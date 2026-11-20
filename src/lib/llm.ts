import {
  AnalysisResult,
  RiskItem,
  RiskTolerance,
  UsageContext,
  UserPersona,
} from './types';
import { calculateScoreFromFindings } from './analyzer';

// ---------------------------------------------------------------------------
// Cache key generator — exported for use in route.ts
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Prompt condenser — exported for route.ts
// ---------------------------------------------------------------------------
export function condenseForPrompt(text: string, maxChars: number = 18000): string {
  const cleaned = text.replace(/[ \t]+/g, ' ').replace(/\n\s*\n/g, '\n\n').trim();
  if (cleaned.length <= maxChars) return cleaned;
  const headLength = Math.floor(maxChars * 0.7);
  const tailLength = maxChars - headLength - 50;
  return `${cleaned.substring(0, headLength)}\n\n[... sections trimmed for token efficiency ...]\n\n${cleaned.substring(
    cleaned.length - tailLength
  )}`;
}

// ---------------------------------------------------------------------------
// Grounding verifier — exported for route.ts
// Drops any AI finding not corroborated in the actual source text.
// ---------------------------------------------------------------------------
export function verifyFindingsGrounding(findings: RiskItem[], policyText: string): RiskItem[] {
  const normalizedSource = policyText.toLowerCase().replace(/\s+/g, ' ');

  return findings.filter((f) => {
    const excerpt = (f.matchedExcerpt || f.originalClause || '').toLowerCase().replace(/\s+/g, ' ').trim();
    if (!excerpt || excerpt.length < 4) return false;

    // Direct substring match
    if (normalizedSource.includes(excerpt)) return true;

    // 3-word window match — at least one 3-consecutive-word phrase must appear in source
    const words = excerpt.split(/\s+/).filter((w) => w.length > 3);
    if (words.length >= 3) {
      for (let i = 0; i <= words.length - 3; i++) {
        const subphrase = `${words[i]} ${words[i + 1]} ${words[i + 2]}`;
        if (normalizedSource.includes(subphrase)) return true;
      }
    }

    return false;
  });
}

// ---------------------------------------------------------------------------
// JSON parser (strips optional markdown fences)
// ---------------------------------------------------------------------------
function parseJsonSafe(raw: string): unknown {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// callGeminiAnalysis — sole LLM entry point, throws on failure
// route.ts catches errors and surfaces them transparently to the UI.
// ---------------------------------------------------------------------------
export async function callGeminiAnalysis(
  systemPrompt: string,
  userPrompt: string,
  apiKey: string,
  model: string
): Promise<unknown> {
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
    const errBody = await res.text().catch(() => '');
    throw new Error(`${res.status} ${res.statusText}${errBody ? `: ${errBody.substring(0, 200)}` : ''}`);
  }

  const data = await res.json();
  const candidateText = data?.candidates?.[0]?.content?.parts?.[0]?.text;

  if (!candidateText) {
    throw new Error('Gemini returned an empty response. Please try again.');
  }

  return parseJsonSafe(candidateText);
}

// ---------------------------------------------------------------------------
// calculateScoreFromFindings re-export so callers don't need a second import
// ---------------------------------------------------------------------------
export { calculateScoreFromFindings };

// ---------------------------------------------------------------------------
// LEGACY — kept only so the Risk Simulator (recalculateRiskScore) in
// analyzer.ts continues to compile. Do NOT use in the analysis pipeline.
// ---------------------------------------------------------------------------
export type { AnalysisResult };

