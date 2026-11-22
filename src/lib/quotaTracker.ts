/**
 * ConsentLens Gemini API Quota & Rate Limit Tracker
 *
 * Tracks cumulative Gemini API usage and calculates exact reset timestamps
 * using live Google API rate-limit headers (x-ratelimit-*) when returned,
 * or cumulative server-side request and token counts against tier limits.
 */

export interface QuotaStatus {
  /** Cumulative API usage percentage (0 to 100, e.g. 14.2) */
  usagePercent: number;
  /** Total requests consumed in the active quota window */
  totalRequestsToday: number;
  /** Quota request limit for the tier/window */
  limitRequests: number;
  /** Estimated or reported remaining requests */
  remainingRequests: number;
  /** Total token count consumed in the active window */
  totalTokensToday?: number;
  /** Exact ISO 8601 timestamp when the quota limit resets */
  resetAt: string;
  /** Active Gemini model identifier */
  modelUsed?: string;
}

export interface GeminiRateLimitHeaders {
  limitRequests?: number;
  remainingRequests?: number;
  limitTokens?: number;
  remainingTokens?: number;
  resetRequests?: string;
  resetTokens?: string;
  retryAfterSeconds?: number;
}

export interface GeminiUsageMetadata {
  promptTokenCount?: number;
  candidatesTokenCount?: number;
  totalTokenCount?: number;
}

/** Default tier limits for Gemini 3.5 Flash / Flash-Lite free tier */
const DEFAULT_RPD_LIMIT = 1500; // Requests per day
const DEFAULT_RPM_LIMIT = 15; // Requests per minute

/**
 * Calculates the exact next midnight Pacific Time (PT) timestamp.
 * Google AI Studio / Gemini API daily quotas officially reset at 00:00:00 PT daily.
 *
 * @param fromDate - Base date (defaults to now)
 * @returns Date object representing the exact next 00:00:00 in America/Los_Angeles
 */
export function getNextPacificMidnight(fromDate: Date = new Date()): Date {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: 'numeric',
    day: 'numeric',
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(fromDate);
  const ptParts: Record<string, number> = {};
  for (const p of parts) {
    if (p.type !== 'literal') {
      ptParts[p.type] = parseInt(p.value, 10);
    }
  }

  const currentPTHour = (ptParts.hour || 0) % 24;
  const currentPTMinute = ptParts.minute || 0;
  const currentPTSecond = ptParts.second || 0;

  // Total seconds remaining until midnight in Pacific Time
  const secondsUntilMidnight = 24 * 3600 - (currentPTHour * 3600 + currentPTMinute * 60 + currentPTSecond);
  return new Date(fromDate.getTime() + secondsUntilMidnight * 1000);
}

/**
 * Formats a Pacific Time date string (YYYY-MM-DD) for day-rollover tracking.
 */
function getPacificDayString(date: Date = new Date()): string {
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/Los_Angeles',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  });
  return formatter.format(date);
}

/** In-memory singleton state for cumulative quota tracking */
interface TrackerState {
  currentDayPT: string;
  requestsToday: number;
  tokensToday: number;
  liveLimitRequests: number | null;
  liveRemainingRequests: number | null;
  liveResetAt: string | null;
  lastModel: string;
}

const state: TrackerState = {
  currentDayPT: getPacificDayString(),
  requestsToday: 0,
  tokensToday: 0,
  liveLimitRequests: null,
  liveRemainingRequests: null,
  liveResetAt: null,
  lastModel: 'gemini-3.5-flash-lite',
};

/**
 * Ensures the tracker rolls over to zero when a new Pacific Time day begins.
 */
function checkDayRollover(): void {
  const todayPT = getPacificDayString();
  if (state.currentDayPT !== todayPT) {
    state.currentDayPT = todayPT;
    state.requestsToday = 0;
    state.tokensToday = 0;
    state.liveLimitRequests = null;
    state.liveRemainingRequests = null;
    state.liveResetAt = null;
  }
}

/**
 * Resolves the configured RPD limit from environment variables or default.
 */
export function getConfiguredRpdLimit(): number {
  if (typeof process !== 'undefined' && process.env?.GEMINI_RPD_LIMIT) {
    const parsed = parseInt(process.env.GEMINI_RPD_LIMIT, 10);
    if (!isNaN(parsed) && parsed > 0) return parsed;
  }
  return DEFAULT_RPD_LIMIT;
}

/**
 * Parses live rate limit headers from a Gemini fetch Response.
 *
 * @param headers - Web API Headers object from fetch response
 * @returns Structured rate limit headers if present
 */
export function extractRateLimitHeaders(headers: Headers): GeminiRateLimitHeaders {
  const result: GeminiRateLimitHeaders = {};

  const limitReq = headers.get('x-ratelimit-limit-requests');
  if (limitReq) {
    const val = parseInt(limitReq, 10);
    if (!isNaN(val) && val > 0) result.limitRequests = val;
  }

  const remainingReq = headers.get('x-ratelimit-remaining-requests');
  if (remainingReq) {
    const val = parseInt(remainingReq, 10);
    if (!isNaN(val) && val >= 0) result.remainingRequests = val;
  }

  const limitTok = headers.get('x-ratelimit-limit-tokens');
  if (limitTok) {
    const val = parseInt(limitTok, 10);
    if (!isNaN(val) && val > 0) result.limitTokens = val;
  }

  const remainingTok = headers.get('x-ratelimit-remaining-tokens');
  if (remainingTok) {
    const val = parseInt(remainingTok, 10);
    if (!isNaN(val) && val >= 0) result.remainingTokens = val;
  }

  const resetReq = headers.get('x-ratelimit-reset-requests');
  if (resetReq) result.resetRequests = resetReq;

  const resetTok = headers.get('x-ratelimit-reset-tokens');
  if (resetTok) result.resetTokens = resetTok;

  const retryAfter = headers.get('retry-after');
  if (retryAfter) {
    const seconds = parseFloat(retryAfter);
    if (!isNaN(seconds) && seconds > 0) {
      result.retryAfterSeconds = seconds;
    }
  }

  return result;
}

/**
 * Records a completed Gemini API invocation, updating token counts and live rate limit headers.
 *
 * @param model - Target Gemini model name
 * @param headers - Extracted rate limit headers from Google's response
 * @param usageMetadata - Token usage details returned in response body
 */
export function recordGeminiUsage(
  model: string,
  headers?: GeminiRateLimitHeaders,
  usageMetadata?: GeminiUsageMetadata
): void {
  checkDayRollover();

  state.lastModel = model;
  state.requestsToday += 1;

  if (usageMetadata?.totalTokenCount && usageMetadata.totalTokenCount > 0) {
    state.tokensToday += usageMetadata.totalTokenCount;
  }

  // Update live headers if present
  if (headers) {
    if (typeof headers.limitRequests === 'number' && headers.limitRequests > 0) {
      state.liveLimitRequests = headers.limitRequests;
    }
    if (typeof headers.remainingRequests === 'number' && headers.remainingRequests >= 0) {
      state.liveRemainingRequests = headers.remainingRequests;
    }
    if (headers.retryAfterSeconds && headers.retryAfterSeconds > 0) {
      state.liveResetAt = new Date(Date.now() + headers.retryAfterSeconds * 1000).toISOString();
    } else if (headers.resetRequests) {
      // Attempt parse if date or duration string
      const parsedDate = new Date(headers.resetRequests);
      if (!isNaN(parsedDate.getTime())) {
        state.liveResetAt = parsedDate.toISOString();
      }
    }
  }
}

/**
 * Calculates current QuotaStatus reflecting live rate limits or cumulative consumption.
 *
 * @param model - Optional model override
 * @returns Fully populated QuotaStatus object
 */
export function getGeminiQuotaStatus(model?: string): QuotaStatus {
  checkDayRollover();

  const rpdLimit = state.liveLimitRequests || getConfiguredRpdLimit();
  let usagePercent: number;
  let remainingRequests: number;

  if (
    typeof state.liveLimitRequests === 'number' &&
    typeof state.liveRemainingRequests === 'number' &&
    state.liveLimitRequests > 0
  ) {
    // Exact percentage from Google's live rate-limit headers
    const used = Math.max(0, state.liveLimitRequests - state.liveRemainingRequests);
    usagePercent = Math.max(0, Math.min(100, (used / state.liveLimitRequests) * 100));
    remainingRequests = state.liveRemainingRequests;
  } else {
    // Cumulative tracking against configured tier limit
    usagePercent = Math.max(0, Math.min(100, (state.requestsToday / rpdLimit) * 100));
    remainingRequests = Math.max(0, rpdLimit - state.requestsToday);
  }

  // Round percentage to 1 decimal place (e.g. 14.2)
  usagePercent = Math.round(usagePercent * 10) / 10;

  // Determine exact reset timestamp: prioritize header reset / retry-after, or next midnight Pacific Time
  const resetAt = state.liveResetAt || getNextPacificMidnight().toISOString();

  return {
    usagePercent,
    totalRequestsToday: state.requestsToday,
    limitRequests: rpdLimit,
    remainingRequests,
    totalTokensToday: state.tokensToday,
    resetAt,
    modelUsed: model || state.lastModel,
  };
}

/**
 * Resets the in-memory tracker state (used for testing).
 */
export function resetQuotaTrackerForTest(): void {
  state.currentDayPT = getPacificDayString();
  state.requestsToday = 0;
  state.tokensToday = 0;
  state.liveLimitRequests = null;
  state.liveRemainingRequests = null;
  state.liveResetAt = null;
  state.lastModel = 'gemini-3.5-flash-lite';
}
