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

/**
 * Server-Side In-Memory Result Cache
 * Prevents redundant Gemini API calls and preserves rate-limit quota for identical requests.
 */
const serverCache = new Map<string, { result: AnalysisResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours TTL

/** Realistic browser User-Agent to avoid bot-blocking on mainstream news/ecommerce sites */
const BROWSER_UA =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

/** Minimum extracted text characters before we consider a page fetch viable */
const MIN_FETCHED_CHARS = 250;

/** Policy signals to check whether extracted text is a substantive privacy/terms document */
const POLICY_SIGNALS = [
  'personal data',
  'information we collect',
  'how we use',
  'third parties',
  'third-party',
  'cookies',
  'your rights',
  'opt-out',
  'data retention',
  'privacy policy',
  'information collection',
  'security of your',
  'disclosure of',
  'consent',
  'terms of service',
  'governing law',
];

/**
 * Counts the presence of substantive policy indicators in text.
 */
function countPolicySignals(text: string): number {
  const lower = text.toLowerCase();
  let count = 0;
  for (const sig of POLICY_SIGNALS) {
    if (lower.includes(sig)) count++;
  }
  return count;
}

/**
 * Scans raw HTML to discover the highest-quality privacy policy or terms link.
 * Inspects href, aria-label, title, and link text, skipping self-links.
 *
 * @param html - Raw webpage HTML
 * @param currentUrl - The current URL (after any redirects) to resolve relative links against
 * @returns Object with discovered URL and confidence score
 */
function findBestPolicyLink(
  html: string,
  currentUrl: string
): { link: string | null; score: number } {
  const anchorRegex = /<a\s+([^>]*?)href=["']([^"']+)["']([^>]*?)>([\s\S]*?)<\/a>/gi;
  let match: RegExpExecArray | null;
  let bestLink: string | null = null;
  let bestScore = 0;

  const currentNormalized = currentUrl.replace(/\/+$/, '').toLowerCase();

  while ((match = anchorRegex.exec(html)) !== null) {
    const preAttr = match[1];
    const rawHref = match[2].trim();
    const postAttr = match[3];
    const fullAttrs = `${preAttr} ${postAttr}`;

    if (!rawHref || rawHref.startsWith('#') || rawHref.startsWith('javascript:')) continue;

    const ariaLabelMatch = fullAttrs.match(/aria-label=["']([^"']+)["']/i);
    const ariaLabel = ariaLabelMatch ? ariaLabelMatch[1].toLowerCase() : '';
    const titleMatch = fullAttrs.match(/title=["']([^"']+)["']/i);
    const title = titleMatch ? titleMatch[1].toLowerCase() : '';

    const linkText = match[4].replace(/<[^>]+>/g, ' ').toLowerCase().trim();
    const combinedDesc = `${linkText} ${ariaLabel} ${title}`.trim();
    const hrefLower = rawHref.toLowerCase();

    try {
      const resolved = new URL(rawHref, currentUrl).toString();
      const resolvedNormalized = resolved.replace(/\/+$/, '').toLowerCase();

      // Skip self-referencing links
      if (resolvedNormalized === currentNormalized) continue;

      let score = 0;

      // Score based on URL path specificity
      if (
        hrefLower.includes('/help/privacy-policy') ||
        hrefLower.includes('/legal/privacy-policy') ||
        hrefLower.includes('/privacy-policy') ||
        hrefLower.includes('/privacy_policy')
      ) {
        score += 150;
      } else if (hrefLower.includes('/privacy')) {
        score += 80;
      } else if (hrefLower.includes('/terms') || hrefLower.includes('/legal')) {
        score += 40;
      }

      // Score based on descriptive text and accessibility labels
      if (
        combinedDesc.includes('privacy policy') ||
        combinedDesc.includes('privacy notice') ||
        combinedDesc.includes('our privacy policy')
      ) {
        score += 120;
      } else if (
        combinedDesc.includes('personal data') ||
        combinedDesc.includes('how we collect') ||
        combinedDesc.includes('privacy statement')
      ) {
        score += 100;
      } else if (combinedDesc.includes('privacy')) {
        score += 60;
      } else if (
        combinedDesc.includes('terms of service') ||
        combinedDesc.includes('terms of use') ||
        combinedDesc.includes('terms & conditions')
      ) {
        score += 50;
      } else if (combinedDesc.includes('terms') || combinedDesc.includes('legal')) {
        score += 25;
      }

      if (score > bestScore) {
        bestScore = score;
        bestLink = resolved;
      }
    } catch {
      // Ignore unparseable URLs
    }
  }

  return { link: bestLink, score: bestScore };
}

/**
 * Fetches a single URL with realistic browser headers and returns clean text and HTML.
 */
async function fetchSingleUrl(
  url: string
): Promise<{ ok: boolean; status: number; finalUrl: string; text: string; rawHtml: string; error?: string }> {
  try {
    const res = await fetch(url, {
      headers: {
        'User-Agent': BROWSER_UA,
        Accept: 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
      },
      redirect: 'follow',
      signal: AbortSignal.timeout(9000),
    });

    const finalUrl = res.url || url;
    if (!res.ok) {
      return { ok: false, status: res.status, finalUrl, text: '', rawHtml: '' };
    }

    const rawHtml = await res.text();
    const text = extractTextFromHtml(rawHtml);
    return { ok: true, status: res.status, finalUrl, text, rawHtml };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    return { ok: false, status: 0, finalUrl: url, text: '', rawHtml: '', error: msg };
  }
}

/**
 * Resolves and extracts the full privacy policy document from a given web link.
 * Handles homepages, navigation hubs (e.g. /info/privacy), redirects, and SPA fallback probing.
 *
 * @param targetUrl - Validated target web link
 * @returns Resolved policy text and source URL, or error details
 */
async function resolvePolicyFromUrl(targetUrl: string): Promise<{
  text: string;
  resolvedUrl: string;
  blocked: boolean;
  blockedReason?: string;
}> {
  // Step 1: Initial fetch of the user-provided URL
  let current = await fetchSingleUrl(targetUrl);

  if (!current.ok) {
    if (current.status === 403 || current.status === 401 || current.status === 429) {
      return {
        text: '',
        resolvedUrl: current.finalUrl,
        blocked: true,
        blockedReason: `The website returned HTTP ${current.status} and blocked automated reading.`,
      };
    }
    const isTimeout = current.error?.toLowerCase().includes('timeout') || current.error?.toLowerCase().includes('abort');
    return {
      text: '',
      resolvedUrl: current.finalUrl,
      blocked: true,
      blockedReason: isTimeout
        ? 'The request timed out — the website may be blocking automated access.'
        : 'Could not connect to the website. It may be down or blocking automated access.',
    };
  }

  let signals = countPolicySignals(current.text);

  // If initial URL already has strong policy indicators and substantial text, use it directly!
  if (signals >= 6 && current.text.length >= 4000) {
    return { text: current.text, resolvedUrl: current.finalUrl, blocked: false };
  }

  // Step 2: Multi-hop discovery (up to 2 hops for directory/hub pages like theguardian.com/info/privacy)
  for (let hop = 1; hop <= 2; hop++) {
    const { link, score } = findBestPolicyLink(current.rawHtml, current.finalUrl);
    if (!link || link === current.finalUrl || score < 50) {
      break;
    }

    const nextFetch = await fetchSingleUrl(link);
    if (nextFetch.ok && nextFetch.text.length >= 250) {
      const nextSignals = countPolicySignals(nextFetch.text);
      current = nextFetch;
      signals = nextSignals;
      // If we reached substantive policy document, stop traversing
      if (nextSignals >= 4 && nextFetch.text.length >= 2500) {
        break;
      }
    } else {
      break;
    }
  }

  // Step 3: SPA / client-rendered fallback probing
  if (current.text.length < 800 || signals < 2) {
    try {
      const parsedUrl = new URL(targetUrl);
      const host = parsedUrl.hostname;
      const parts = host.split('.');
      const rootDomain = parts.length > 2 ? parts.slice(-2).join('.') : host;

      const fallbackPaths = [
        `https://www.${rootDomain}/legal/privacy-policy`,
        `https://www.${rootDomain}/privacy-policy`,
        `https://www.${rootDomain}/privacy`,
        `https://${rootDomain}/privacy-policy`,
        `https://${rootDomain}/privacy`,
        `https://${rootDomain}/legal/privacy-policy`,
      ];

      for (const fb of fallbackPaths) {
        if (fb === current.finalUrl) continue;
        const probe = await fetchSingleUrl(fb);
        if (probe.ok && probe.text.length >= 1000) {
          const probeSignals = countPolicySignals(probe.text);
          if (probeSignals >= 3) {
            return { text: probe.text, resolvedUrl: probe.finalUrl, blocked: false };
          }
        }
      }
    } catch {
      // Ignore fallback errors
    }
  }

  if (current.text.length < MIN_FETCHED_CHARS) {
    return {
      text: current.text,
      resolvedUrl: current.finalUrl,
      blocked: true,
      blockedReason:
        'The website returned very little readable text — it may require JavaScript, login, or block automated reading.',
    };
  }

  return { text: current.text, resolvedUrl: current.finalUrl, blocked: false };
}

/**
 * POST /api/analyze Handler
 *
 * Orchestrates policy text analysis:
 * 1. Validates inputs, mode, and parameters
 * 2. Fetches and discovers policy text if URL mode is requested (with SSRF defense & multi-hop crawler)
 * 3. Checks memory cache
 * 4. Prioritizes live Gemini AI analysis (primary: gemini-3.5-flash-lite, fallback: gemini-3.8-flash)
 * 5. Uses Deep Local Clause & Permission Analyzer ONLY when Gemini limits run out or fail
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || typeof body !== 'object') {
      return NextResponse.json(
        { success: false, error: 'Invalid JSON request payload.' },
        { status: 400 }
      );
    }

    const persona: UserPersona = isValidPersona(body.persona) ? body.persona : 'everyday';
    const context: UsageContext = isValidContext(body.context) ? body.context : 'utility';
    const riskTolerance: RiskTolerance = isValidTolerance(body.riskTolerance)
      ? body.riskTolerance
      : 'standard';
    const inputMode = body.inputMode || (body.url ? 'url' : 'text');

    let policyTextToAnalyze = '';
    let resolvedSourceUrl: string | undefined;

    // --- URL Input Handling ---
    if (inputMode === 'url') {
      const urlValidation = validateAndSanitizeUrl(body.url);
      if (!urlValidation.isValid || !urlValidation.normalizedUrl) {
        return NextResponse.json(
          { success: false, error: urlValidation.error || 'Invalid web URL provided.' },
          { status: 400 }
        );
      }

      const targetUrl = urlValidation.normalizedUrl;
      const crawlResult = await resolvePolicyFromUrl(targetUrl);
      resolvedSourceUrl = crawlResult.resolvedUrl || targetUrl;

      if (crawlResult.blocked || crawlResult.text.length < MIN_FETCHED_CHARS) {
        return NextResponse.json(
          {
            success: false,
            errorType: 'site_blocked',
            error:
              crawlResult.blockedReason ||
              'The website blocked automated page reading or returned minimal text.',
            hint: "Please open the site's Privacy Policy or Terms page in your browser, copy the text, and paste it into the Paste tab for instant analysis.",
          },
          { status: 200 }
        );
      }

      policyTextToAnalyze = crawlResult.text;
    } else {
      // --- Direct Text Input Handling ---
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

    // --- Check Server Cache ---
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

    // --- Attempt Primary Engine: Google Gemini API ---
    const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
    const primaryModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';
    const fallbackModel = 'gemini-3.8-flash';

    let geminiSucceeded = false;
    let geminiParsedResult: unknown = null;

    if (geminiApiKey) {
      const condensedText = condenseForPrompt(policyTextToAnalyze);
      const systemPrompt = buildSystemPrompt(persona, context, riskTolerance);
      const userPrompt = buildUserPrompt(condensedText);

      // Try primary model
      try {
        const rawRes = await callGeminiAnalysis(systemPrompt, userPrompt, geminiApiKey, primaryModel);
        if (rawRes && validateAnalysisResult(rawRes)) {
          geminiParsedResult = rawRes;
          geminiSucceeded = true;
        }
      } catch {
        // If primary failed, attempt automatic retry on fallback model
        if (primaryModel !== fallbackModel) {
          try {
            const retryRes = await callGeminiAnalysis(systemPrompt, userPrompt, geminiApiKey, fallbackModel);
            if (retryRes && validateAnalysisResult(retryRes)) {
              geminiParsedResult = retryRes;
              geminiSucceeded = true;
            }
          } catch {
            // Both Gemini models failed or rate-limited; proceed to local deep analyzer
          }
        }
      }
    }

    // If Gemini succeeded, return grounded results with Gemini's intelligent risk score
    if (geminiSucceeded && geminiParsedResult) {
      const parsed = geminiParsedResult as AnalysisResult;
      const verifiedFindings = verifyFindingsGrounding(parsed.findings, policyTextToAnalyze);

      // Preserve Gemini's AI score if findings were present, or safely calculate from findings
      let finalScore = typeof parsed.score === 'number' && parsed.score >= 0 && parsed.score <= 100
        ? parsed.score
        : 0;
      let finalSeverity = parsed.verdictSeverity || 'safe';

      if (verifiedFindings.length === 0) {
        // If no findings were detected or corroborated, report low safe score
        finalScore = Math.min(finalScore, 15);
        finalSeverity = 'safe';
      } else if (finalScore === 0) {
        // Recalculate if Gemini returned findings but gave 0 score
        const recalc = calculateScoreFromFindings(verifiedFindings, persona, context, riskTolerance);
        finalScore = recalc.score;
        finalSeverity = recalc.verdictSeverity;
      }

      const result: AnalysisResult = {
        ...parsed,
        score: finalScore,
        verdictSeverity: finalSeverity,
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

    // --- Fallback Engine: Deep Local Clause & Permission Analyzer ---
    // Executes ONLY when the Gemini API key is absent, quota/rate limits are hit, or Gemini fails
    const deepResult = analyzeDeeply(policyTextToAnalyze, persona, context, riskTolerance);
    deepResult.engineUsed = 'Deep Rule Engine';

    serverCache.set(cacheKey, { result: deepResult, timestamp: Date.now() });

    return NextResponse.json({
      success: true,
      data: deepResult,
      sourceUrl: resolvedSourceUrl,
    });
  } catch {
    return NextResponse.json(
      {
        success: false,
        error: 'An unexpected error occurred during policy analysis. Please try again or paste the text directly.',
      },
      { status: 500 }
    );
  }
}
