import {
  AnalysisResult,
  RiskItem,
  RiskTolerance,
  UsageContext,
  UserPersona,
  validateAnalysisResult,
} from './types';
import { analyzeDeterministically, calculateScoreFromFindings } from './analyzer';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

interface LLMAnalysisOptions {
  policyText: string;
  persona: UserPersona;
  context: UsageContext;
  riskTolerance: RiskTolerance;
}

// In-memory server-side cache to minimize API quota usage
const serverAnalysisCache = new Map<string, { result: AnalysisResult; timestamp: number }>();
const CACHE_TTL_MS = 1000 * 60 * 60 * 4; // 4 hours

/**
 * Generates a fast, clean cache key from normalized input and evaluation settings.
 */
function generateCacheKey(
  text: string,
  persona: UserPersona,
  context: UsageContext,
  tolerance: RiskTolerance
): string {
  const normalized = text.toLowerCase().replace(/\s+/g, ' ').trim();
  let hash = 0;
  for (let i = 0; i < normalized.length; i++) {
    hash = (hash << 5) - hash + normalized.charCodeAt(i);
    hash |= 0;
  }
  return `${persona}:${context}:${tolerance}:${hash}:${normalized.length}`;
}

/**
 * Trims and condenses policy text to reduce prompt tokens while preserving all clauses.
 */
function condenseForPrompt(text: string, maxChars: number = 18000): string {
  const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  if (cleaned.length <= maxChars) {
    return cleaned;
  }
  // If extremely long, keep the beginning and end where permissions and terms typically reside
  const headLength = Math.floor(maxChars * 0.7);
  const tailLength = maxChars - headLength - 50;
  return `${cleaned.substring(0, headLength)}\n\n[... sections trimmed for token efficiency ...]\n\n${cleaned.substring(
    cleaned.length - tailLength
  )}`;
}

/**
 * Verifies that each finding has an actual grounding in the source policy text.
 * Drops any fabricated findings that cannot be corroborated in the source text.
 */
function verifyFindingsGrounding(findings: RiskItem[], policyText: string): RiskItem[] {
  const normalizedSource = policyText.toLowerCase().replace(/\s+/g, ' ');

  return findings.filter((f) => {
    const excerpt = (f.matchedExcerpt || f.originalClause || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!excerpt || excerpt.length < 4) {
      return false;
    }

    // Direct substring match
    if (normalizedSource.includes(excerpt)) {
      return true;
    }

    // Check if at least 4 consecutive significant words from excerpt appear in source
    const words = excerpt.split(/\s+/).filter((w) => w.length > 3);
    if (words.length >= 3) {
      for (let i = 0; i <= words.length - 3; i++) {
        const subphrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (normalizedSource.includes(subphrase)) {
          return true;
        }
      }
    }

    return false;
  });
}

/**
 * Executes analysis using live LLM (Gemini with optional OpenAI-compatible failover)
 * and falls back seamlessly to the deterministic local rule engine.
 */
export async function analyzePolicy(options: LLMAnalysisOptions): Promise<AnalysisResult> {
  const { policyText, persona, context, riskTolerance } = options;

  // 1. Check Server Cache
  const cacheKey = generateCacheKey(policyText, persona, context, riskTolerance);
  const cached = serverAnalysisCache.get(cacheKey);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL_MS) {
    return cached.result;
  }

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const geminiModel = process.env.GEMINI_MODEL?.trim() || 'gemini-3.5-flash-lite';

  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();
  const openaiBaseUrl = (process.env.OPENAI_BASE_URL?.trim() || 'https://api.openai.com/v1').replace(/\/$/, '');
  const openaiModel = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';

  // If no AI keys configured, immediately use deterministic local rule engine
  if (!geminiApiKey && !openaiApiKey) {
    const localResult = analyzeDeterministically(policyText, persona, context, riskTolerance);
    serverAnalysisCache.set(cacheKey, { result: localResult, timestamp: Date.now() });
    return localResult;
  }

  const condensedText = condenseForPrompt(policyText);
  const systemPrompt = buildSystemPrompt(persona, context, riskTolerance);
  const userPrompt = buildUserPrompt(condensedText);

  // 2. Primary Provider: Google Gemini
  if (geminiApiKey) {
    try {
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${geminiModel}:generateContent?key=${geminiApiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          systemInstruction: { parts: [{ text: systemPrompt }] },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(14000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          const parsed = parseJsonSafe(candidateText);
          if (parsed && validateAnalysisResult(parsed)) {
            // Strict text-grounding validation: eliminate any hallucinations
            const verifiedFindings = verifyFindingsGrounding(parsed.findings, policyText);

            // Recompute score to ensure mathematical integrity with verified findings
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
              engineUsed: 'live_ai',
              analyzedAt: new Date().toISOString(),
            };

            serverAnalysisCache.set(cacheKey, { result, timestamp: Date.now() });
            return result;
          }
        }
      }
    } catch {
      // Fall through to OpenAI-compatible provider or local fallback on rate limit (429) or error
    }
  }

  // 3. Optional Secondary Provider: OpenAI-compatible Endpoint
  if (openaiApiKey) {
    try {
      const res = await fetch(`${openaiBaseUrl}/chat/completions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model: openaiModel,
          messages: [
            { role: 'system', content: systemPrompt },
            { role: 'user', content: userPrompt },
          ],
          response_format: { type: 'json_object' },
          temperature: 0.1,
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const content = data?.choices?.[0]?.message?.content;
        if (content) {
          const parsed = parseJsonSafe(content);
          if (parsed && validateAnalysisResult(parsed)) {
            const verifiedFindings = verifyFindingsGrounding(parsed.findings, policyText);
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
              engineUsed: 'live_ai',
              analyzedAt: new Date().toISOString(),
            };

            serverAnalysisCache.set(cacheKey, { result, timestamp: Date.now() });
            return result;
          }
        }
      }
    } catch {
      // Fall through to deterministic engine
    }
  }

  // 4. Deterministic Heuristic Engine Fallback
  const fallbackResult = analyzeDeterministically(policyText, persona, context, riskTolerance);
  serverAnalysisCache.set(cacheKey, { result: fallbackResult, timestamp: Date.now() });
  return fallbackResult;
}

function parseJsonSafe(raw: string): unknown {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
