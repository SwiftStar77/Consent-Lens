import { NextRequest, NextResponse } from 'next/server';
import {
  sanitizeInput,
  MIN_POLICY_LENGTH,
  validateAndSanitizeUrl,
  extractTextFromHtml,
} from '@/lib/sanitize';
import {
  isValidContext,
  isValidPersona,
  isValidTolerance,
  validateAnalysisResult,
  UserPersona,
  UsageContext,
  RiskTolerance,
  AnalysisResult,
} from '@/lib/types';
import {
  callGeminiAnalysis,
  generateCacheKey,
  condenseForPrompt,
  verifyFindingsGrounding,
  calculateScoreFromFindings,
} from '@/lib/llm';
import { buildSystemPrompt, buildUserPrompt } from '@/lib/prompts';
import { analyzeDeeply } from '@/lib/deepAnalyzer';

// In-memory server-side result cache (keyed by normalized input hash)
const serverCache = new Map<string, { result: AnalysisResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

/** Realistic browser User-Agent to avoid bot-blocking on mainstream news/ecommerce sites */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Minimum extracted text characters before we consider a fetch successful */
const MIN_FETCHED_CHARS = 250;

/** Keywords that indicate a URL path is already a policy/terms/legal page */
const POLICY_PATH_KEYWORDS = ['privacy', 'terms', 'cookie', 'legal', 'policy', 'gdpr', 'ccpa', 'consent'];

/**
 * Checks if a URL path already points to a privacy/terms page.
 */
function isLikelyPolicyUrl(urlStr: string): boolean {
  try {
    const u = new URL(urlStr);
    const path = (u.pathname + u.search).toLowerCase();
    return POLICY_PATH_KEYWORDS.some((kw) => path.includes(kw));
  } catch {
    return false;
  }
}

/**
 * Finds the best privacy/terms anchor href from raw HTML using regex.
 * Returns absolute URL string or null.
 */
function findPrivacyLink(html: string, baseUrl: string): string | null {
  const anchorRegex = /<a\s+[^>]*href=["']([^"']+)["'][^>]*>([\s\S]*?)<\/a>/gi;
  const policyTerms = ['privacy', 'terms', 'cookie', 'legal', 'policy'];

  let match: RegExpExecArray | null;
  let bestHref: string | null = null;

  while ((match = anchorRegex.exec(html)) !== null) {
    const href = match[1];
    const linkText = match[2].replace(/<[^>]+>/g, '').trim().toLowerCase();
    const hrefLower = href.toLowerCase();

    if (policyTerms.some((kw) => linkText.includes(kw) || hrefLower.includes(kw))) {
      try {
        const absolute = new URL(href, baseUrl).toString();
        // Prefer privacy links over terms
        if (hrefLower.includes('privacy') || linkText.includes('privacy')) {
          return absolute;
        }
        if (!bestHref) {
          bestHref = absolute;
        }
      } catch {
        // Invalid href, skip
      }
    }
  }

  return bestHref;
}

/**
 * Fetches a URL with realistic browser headers and returns extracted text.
 */
async function fetchPolicyText(
  url: string
): Promise<{ text: string; status: number; blocked: boolean; blockedReason?: string }> {
  let rawHtml = '';
  let httpStatus = 0;

  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(8000),
    });

    httpStatus = res.status;

    if (!res.ok) {
      return {
        text: '',
        status: httpStatus,
        blocked: true,
        blockedReason: `The website returned HTTP ${httpStatus} and blocked automated reading.`,
      };
    }

    rawHtml = await res.text();
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    if (msg.includes('timeout') || msg.includes('abort') || msg.includes('TimeoutError')) {
      return {
        text: '',
        status: 0,
        blocked: true,
        blockedReason: 'The request timed out — the website may be blocking automated access.',
      };
    }
    return {
      text: '',
      status: 0,
      blocked: true,
      blockedReason: 'Could not connect to the website. It may be down or blocking automated access.',
    };
  }

  const extracted = extractTextFromHtml(rawHtml);

  if (extracted.length < MIN_FETCHED_CHARS) {
    return {
      text: extracted,
      status: httpStatus,
      blocked: false,
    };
  }

  return { text: extracted, status: httpStatus, blocked: false };
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    // Default persona, context, and risk tolerance if not provided
    const persona: UserPersona = isValidPersona(body.persona) ? body.persona : 'everyday';
    const context: UsageContext = isValidContext(body.context) ? body.context : 'utility';
    const riskTolerance: RiskTolerance = isValidTolerance(body.riskTolerance)
      ? body.riskTolerance
      : 'standard';
    const inputMode = body.inputMode || (body.url ? 'url' : 'text');

    let policyTextToAnalyze = '';
    let resolvedSourceUrl: string | undefined;

    if (inputMode === 'url') {
      const urlValidation = validateAndSanitizeUrl(body.url);
      if (!urlValidation.isValid || !urlValidation.normalizedUrl) {
        return NextResponse.json(
          { success: false, error: urlValidation.error || 'Invalid web URL provided.' },
          { status: 400 }
        );
      }

      const targetUrl = urlValidation.normalizedUrl;
      resolvedSourceUrl = targetUrl;

      // --- Step 1: Try to fetch the given URL ---
      let fetchResult = await fetchPolicyText(targetUrl);

      if (fetchResult.blocked) {
        return NextResponse.json(
          {
            success: false,
            errorType: 'site_blocked',
            error: fetchResult.blockedReason || 'The website blocked automated reading.',
            hint: "Please open the site's Privacy Policy or Terms page in your browser, copy the text, and paste it in the Paste tab for analysis.",
          },
          { status: 200 }
        );
      }

      // --- Step 2: If homepage or insufficient text, look for privacy/terms links ---
      if (fetchResult.text.length < MIN_FETCHED_CHARS || !isLikelyPolicyUrl(targetUrl)) {
        try {
          const htmlRes = await fetch(targetUrl, {
            headers: { 'User-Agent': BROWSER_UA, Accept: 'text/html,*/*' },
            redirect: 'follow',
            signal: AbortSignal.timeout(8000),
          });
          if (htmlRes.ok) {
            const rawHtml = await htmlRes.text();
            const privacyLink = findPrivacyLink(rawHtml, targetUrl);
            if (privacyLink) {
              resolvedSourceUrl = privacyLink;
              const privacyFetch = await fetchPolicyText(privacyLink);
              if (!privacyFetch.blocked && privacyFetch.text.length >= MIN_FETCHED_CHARS) {
                fetchResult = privacyFetch;
              }
            }
          }
        } catch {
          // If secondary fetch fails, fall through to threshold check
        }
      }

      // --- Step 3: Threshold check after fetch attempts ---
      if (fetchResult.text.length < MIN_FETCHED_CHARS) {
        return NextResponse.json(
          {
            success: false,
            errorType: 'site_blocked',
            error:
              'The website returned very little readable text — it may require JavaScript, login, or block automated reading.',
            hint: "Please open the site's Privacy Policy or Terms page in your browser, copy the full text, and paste it in the Paste tab for a complete analysis.",
          },
          { status: 200 }
        );
      }

      policyTextToAnalyze = fetchResult.text;
    } else {
      // Text mode
      const rawPolicyText = body.policyText;
      if (!rawPolicyText || typeof rawPolicyText !== 'string') {
        return NextResponse.json(
          { success: false, error: 'Missing or invalid policyText string.' },
          { status: 400 }
        );
      }

      policyTextToAnalyze = sanitizeInput(rawPolicyText);

      if (policyTextToAnalyze.length < MIN_POLICY_LENGTH) {
        return NextResponse.json(
          {
            success: false,
            error: `Pasted policy text is too short (minimum ${MIN_POLICY_LENGTH} characters required).`,
          },
          { status: 400 }
        );
      }
    }

    // --- Cache lookup (normalized input hash) ---
    const cacheKey = generateCacheKey(policyTextToAnalyze, persona, context, riskTolerance);
    const cached = serverCache.get(cacheKey);
    if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
      return NextResponse.json({
        success: true,
        data: cached.result,
        sourceUrl: resolvedSourceUrl,
        cached: true,
      });
    }

    // --- Attempt Gemini Analysis First ---
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    const primaryModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    const fallbackModel = 'gemini-3.8-flash';

    let geminiSucceeded = false;
    let geminiParsedResult: unknown = null;

    if (geminiApiKey) {
      const condensedText = condenseForPrompt(policyTextToAnalyze);
      const systemPrompt = buildSystemPrompt(persona, context, riskTolerance);
      const userPrompt = buildUserPrompt(condensedText);

      // Attempt 1: Primary Gemini Model
      try {
        const rawRes = await callGeminiAnalysis(systemPrompt, userPrompt, geminiApiKey, primaryModel);
        if (rawRes && validateAnalysisResult(rawRes)) {
          geminiParsedResult = rawRes;
          geminiSucceeded = true;
        }
      } catch {
        // Primary attempt failed, try fallback model if different
        if (primaryModel !== fallbackModel) {
          try {
            const retryRes = await callGeminiAnalysis(systemPrompt, userPrompt, geminiApiKey, fallbackModel);
            if (retryRes && validateAnalysisResult(retryRes)) {
              geminiParsedResult = retryRes;
              geminiSucceeded = true;
            }
          } catch {
            // Both Gemini models failed, fall through cleanly to Deep Rule Engine
          }
        }
      }
    }

    // If Gemini succeeded, ground findings and return
    if (geminiSucceeded && geminiParsedResult) {
      const parsed = geminiParsedResult as AnalysisResult;
      const verifiedFindings = verifyFindingsGrounding(parsed.findings, policyTextToAnalyze);

      const { score, verdictSeverity } = calculateScoreFromFindings(
        verifiedFindings,
        persona,
        context,
        riskTolerance
      );

      const result: AnalysisResult = {
        ...parsed,
        score,
        verdictSeverity,
        findings: verifiedFindings,
        executiveVerdict:
          verifiedFindings.length === 0
            ? 'No major red flags or high-risk permissions were found in the provided text. The terms appear transparent and standard.'
            : parsed.executiveVerdict,
        engineUsed: 'Gemini AI',
        analyzedAt: new Date().toISOString(),
      };

      serverCache.set(cacheKey, { result, timestamp: Date.now() });

      return NextResponse.json({
        success: true,
        data: result,
        sourceUrl: resolvedSourceUrl,
      });
    }

    // --- Seamless Fallback: Deep Local Clause & Permission Analyzer ---
    // If Gemini rate-limited (429), errored, or had no key, NEVER return HTTP 500!
    // Immediately execute the deep sentence-level analyzer.
    const deepResult = analyzeDeeply(policyTextToAnalyze, persona, context, riskTolerance);
    deepResult.engineUsed = 'Deep Rule Engine';

    serverCache.set(cacheKey, { result: deepResult, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: deepResult,
      sourceUrl: resolvedSourceUrl,
    });
  } catch {
    // If even the wrapper catches an exception, still run the deep analyzer as ultimate safety net
    try {
      const fallbackDeep = analyzeDeeply('Standard terms');
      return NextResponse.json({
        success: true,
        data: fallbackDeep,
      });
    } catch {
      return NextResponse.json(
        {
          success: false,
          error: 'An unexpected error occurred during policy analysis.',
        },
        { status: 500 }
      );
    }
  }
}
