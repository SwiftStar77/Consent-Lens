/**
 * ConsentLens Gemini LLM Client & Prompt Orchestrator
 *
 * Handles live structured JSON generation via Google Gemini API (defaulting to gemini-3.5-flash-lite),
 * grounding verification against source text, prompt text condensation, and caching.
 */

import {
  AnalysisResult,
  RiskItem,
  RiskTolerance,
  UsageContext,
  UserPersona,
} from './types';
import { calculateScoreFromFindings } from './analyzer';
import {
  extractRateLimitHeaders,
  type GeminiRateLimitHeaders,
  type GeminiUsageMetadata,
} from './quotaTracker';

export interface GeminiCallResult {
  parsed: unknown;
  usageMetadata?: GeminiUsageMetadata;
  rateLimitHeaders?: GeminiRateLimitHeaders;
}

/**
 * Generates a deterministic cache key from normalized input text and evaluation parameters.
 * Uses a 32-bit polynomial hash to keep memory footprint minimal.
 *
 * @param text - The raw or condensed policy text
 * @param persona - Target user persona
 * @param context - Functional application category
 * @param tolerance - Risk tolerance setting
 * @returns Serialized cache key string
 */
export function generateCacheKey(
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
 * Trims and condenses lengthy policy text to reduce prompt tokens while preserving
 * vital permission grants and term definitions typically situated in the opening and closing clauses.
 *
 * @param text - Source text
 * @param maxChars - Maximum characters permitted (defaults to 18,000)
 * @returns Cleaned and bounded string
 */
export function condenseForPrompt(text: string, maxChars: number = 18000): string {
  const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  if (cleaned.length <= maxChars) return cleaned;

  // Split budget: 70% head, 30% tail
  const headLength = Math.floor(maxChars * 0.7);
  const tailLength = maxChars - headLength - 50;

  return `${cleaned.substring(0, headLength)}\n\n[... sections trimmed for token efficiency ...]\n\n${cleaned.substring(
    cleaned.length - tailLength
  )}`;
}

/**
 * Normalizes text for grounding comparisons by standardizing quotation marks,
 * apostrophes, dashes, and collapsing whitespace.
 */
function normalizeForGrounding(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u2018\u2019\u201A\u201B]/g, "'")
    .replace(/[\u201C\u201D\u201E\u201F]/g, '"')
    .replace(/[\u2013\u2014]/g, '-')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Verifies that each finding produced by the LLM is genuinely grounded in the source text.
 * Strictly drops any hallucinated findings that cannot be corroborated in the source agreement,
 * while allowing for minor OCR, quote style, or whitespace variations.
 *
 * @param findings - Candidate findings returned by LLM
 * @param policyText - Actual input text analyzed
 * @returns Verified subset of findings
 */
export function verifyFindingsGrounding(findings: RiskItem[], policyText: string): RiskItem[] {
  if (!Array.isArray(findings)) return [];
  const normalizedSource = normalizeForGrounding(policyText);
  const sourceAlphaOnly = normalizedSource.replace(/[^\w\s]/g, ' ');

  return findings.filter((f) => {
    const rawExcerpt = f.matchedExcerpt || f.originalClause || '';
    const excerpt = normalizeForGrounding(rawExcerpt);
    if (!excerpt || excerpt.length < 4) return false;

    // Direct verbatim substring match
    if (normalizedSource.includes(excerpt)) return true;

    // Token-based matching: punctuation-agnostic sliding window
    const words = excerpt.replace(/[^\w\s]/g, ' ').split(/\s+/).filter((w) => w.length > 2);
    if (words.length >= 3) {
      for (let i = 0; i <= words.length - 3; i++) {
        const subphrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (sourceAlphaOnly.includes(subphrase)) return true;
      }
    } else if (words.length > 0) {
      const subphrase = words.join(' ');
      if (sourceAlphaOnly.includes(subphrase)) return true;
    }

    return false;
  });
}

/**
 * Safely parses raw JSON output from LLM, stripping optional markdown code fences.
 */
function parseJsonSafe(raw: string): unknown {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

/**
 * Calls the Google Gemini API using structured JSON output mode (responseMimeType: "application/json").
 * Throws an informative error if the request fails or times out.
 *
 * @param systemPrompt - Instructions and JSON schema definition
 * @param userPrompt - Policy text enclosed in safety delimiters
 * @param apiKey - Gemini API Key from environment
 * @param model - Target Gemini model name
 * @returns Parsed JSON object, token usage metadata, and any rate limit headers from Gemini
 */
export async function callGeminiAnalysis(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string
): Promise<GeminiCallResult> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

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
    signal: AbortSignal.timeout(20000),
  });

  if (!res.ok) {
    const rateLimitHeaders = extractRateLimitHeaders(res.headers);
    const errBody = await res.text().catch(() => '');
    const err = new Error(
      `${res.status} ${res.statusText}${errBody ? `: ${errBody.substring(0, 200)}` : ''}`
    ) as Error & { status?: number; rateLimitHeaders?: GeminiRateLimitHeaders };
    err.status = res.status;
    err.rateLimitHeaders = rateLimitHeaders;
    throw err;
  }

  const rateLimitHeaders = extractRateLimitHeaders(res.headers);
  const data = await res.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;
  const usageMetadata: GeminiUsageMetadata | undefined = data?.usageMetadata;

  if (!candidateText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  return {
    parsed: parseJsonSafe(candidateText),
    usageMetadata,
    rateLimitHeaders,
  };
}

// Re-export calculateScoreFromFindings for callers
export { calculateScoreFromFindings };
export type { AnalysisResult };
