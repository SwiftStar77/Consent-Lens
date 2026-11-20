import {
  AnalysisResult,
  RiskTolerance,
  UsageContext,
  UserPersona,
  validateAnalysisResult,
} from './types';
import { analyzeDeterministically } from './analyzer';
import { buildSystemPrompt, buildUserPrompt } from './prompts';

interface LLMAnalysisOptions {
  policyText: string;
  persona: UserPersona;
  context: UsageContext;
  riskTolerance: RiskTolerance;
}

/**
 * Executes analysis using live LLM when available,
 * falling back seamlessly to the deterministic local rule engine.
 */
export async function analyzePolicy(options: LLMAnalysisOptions): Promise<AnalysisResult> {
  const { policyText, persona, context, riskTolerance } = options;

  const geminiApiKey = process.env.GEMINI_API_KEY?.trim();
  const openaiApiKey = process.env.OPENAI_API_KEY?.trim();

  // If no keys configured, immediately use deterministic local rule engine
  if (!geminiApiKey && !openaiApiKey) {
    return analyzeDeterministically(policyText, persona, context, riskTolerance);
  }

  const systemPrompt = buildSystemPrompt(persona, context, riskTolerance);
  const userPrompt = buildUserPrompt(policyText);

  // Try Gemini first if key available
  if (geminiApiKey) {
    try {
      const model = process.env.GEMINI_MODEL?.trim() || 'gemini-2.5-flash';
      const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiApiKey}`;

      const res = await fetch(endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [
            {
              role: 'user',
              parts: [{ text: userPrompt }],
            },
          ],
          systemInstruction: {
            parts: [{ text: systemPrompt }],
          },
          generationConfig: {
            responseMimeType: 'application/json',
            temperature: 0.1,
          },
        }),
        signal: AbortSignal.timeout(12000),
      });

      if (res.ok) {
        const data = await res.json();
        const candidateText =
          data?.candidates?.[0]?.content?.parts?.[0]?.text;

        if (candidateText) {
          const parsed = parseJsonSafe(candidateText);
          if (parsed && validateAnalysisResult(parsed)) {
            return {
              ...parsed,
              engineUsed: 'live_ai',
              analyzedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // Graceful fallback on timeout or error
    }
  }

  // Try OpenAI if configured
  if (openaiApiKey) {
    try {
      const model = process.env.OPENAI_MODEL?.trim() || 'gpt-4o-mini';
      const res = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${openaiApiKey}`,
        },
        body: JSON.stringify({
          model,
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
            return {
              ...parsed,
              engineUsed: 'live_ai',
              analyzedAt: new Date().toISOString(),
            };
          }
        }
      }
    } catch {
      // Graceful fallback on timeout or error
    }
  }

  // Seamless fallback to deterministic engine
  return analyzeDeterministically(policyText, persona, context, riskTolerance);
}

function parseJsonSafe(raw: string): unknown {
  try {
    const cleaned = raw.trim().replace(/^```json\s*/i, '').replace(/```\s*$/i, '');
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}
