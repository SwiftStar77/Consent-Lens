/**
 * Input sanitization, length cap, and normalization helpers.
 */

export const MAX_POLICY_LENGTH = 45000;
export const MIN_POLICY_LENGTH = 10;

export function sanitizeInput(raw: unknown): string {
  if (typeof raw !== 'string') {
    return '';
  }

  // Remove null bytes and non-printable ASCII control characters except \r, \n, \t
  let cleaned = raw.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');

  // Normalize Unicode spaces and line endings
  cleaned = cleaned.replace(/\r\n/g, '\n').replace(/\r/g, '\n');

  // Trim whitespace
  cleaned = cleaned.trim();

  // Cap length
  if (cleaned.length > MAX_POLICY_LENGTH) {
    cleaned = cleaned.substring(0, MAX_POLICY_LENGTH);
  }

  return cleaned;
}

/**
 * Neutralizes prompt delimiter breakout attempts inside user text.
 */
export function wrapInUntrustedDelimiters(text: string): string {
  const sanitized = text
    .replace(/<\/policy_text>/gi, '&lt;/policy_text&gt;')
    .replace(/<policy_text>/gi, '&lt;policy_text&gt;');
  return `<policy_text>\n${sanitized}\n</policy_text>`;
}
