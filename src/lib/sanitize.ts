/**
 * Input sanitization, length cap, SSRF protection, and normalization helpers.
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

export interface UrlValidationResult {
  isValid: boolean;
  error?: string;
  normalizedUrl?: string;
  hostname?: string;
}

/**
 * Validates a web URL safely and prevents Server-Side Request Forgery (SSRF)
 * by blocking localhost, private IP ranges, link-local addresses, and non-http(s) schemes.
 */
export function validateAndSanitizeUrl(rawUrl: unknown): UrlValidationResult {
  if (typeof rawUrl !== 'string' || !rawUrl.trim()) {
    return { isValid: false, error: 'URL string is required.' };
  }

  let trimmed = rawUrl.trim();
  // Automatically prepend https:// if user provided bare domain (e.g. "example.com/privacy")
  if (!/^https?:\/\//i.test(trimmed)) {
    trimmed = `https://${trimmed}`;
  }

  let parsed: URL;
  try {
    parsed = new URL(trimmed);
  } catch {
    return { isValid: false, error: 'Please enter a valid web address (e.g. https://example.com/privacy).' };
  }

  // Enforce http/https protocols
  if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
    return { isValid: false, error: 'Only HTTP and HTTPS links are supported.' };
  }

  const hostname = parsed.hostname.toLowerCase();

  // Block localhost, loopback, and local domain patterns
  if (
    hostname === 'localhost' ||
    hostname.endsWith('.localhost') ||
    hostname.endsWith('.local') ||
    hostname.endsWith('.internal') ||
    hostname === '127.0.0.1' ||
    hostname === '0.0.0.0' ||
    hostname === '::1' ||
    hostname === '[::1]'
  ) {
    return { isValid: false, error: 'Localhost and internal addresses are blocked for security.' };
  }

  // Check IPv4 private and link-local ranges
  const ipv4Regex = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/;
  const ipMatch = hostname.match(ipv4Regex);
  if (ipMatch) {
    const octets = [
      parseInt(ipMatch[1], 10),
      parseInt(ipMatch[2], 10),
      parseInt(ipMatch[3], 10),
      parseInt(ipMatch[4], 10),
    ];

    if (octets.some((o) => o > 255)) {
      return { isValid: false, error: 'Invalid IP address.' };
    }

    // 10.0.0.0/8
    if (octets[0] === 10) {
      return { isValid: false, error: 'Private IP addresses (10.x.x.x) are blocked.' };
    }
    // 172.16.0.0/12 (172.16 - 172.31)
    if (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) {
      return { isValid: false, error: 'Private IP addresses (172.16-31.x.x) are blocked.' };
    }
    // 192.168.0.0/16
    if (octets[0] === 192 && octets[1] === 168) {
      return { isValid: false, error: 'Private IP addresses (192.168.x.x) are blocked.' };
    }
    // 169.254.0.0/16 (Link-local / cloud metadata)
    if (octets[0] === 169 && octets[1] === 254) {
      return { isValid: false, error: 'Cloud metadata / link-local addresses (169.254.x.x) are blocked.' };
    }
    // 127.0.0.0/8 (Loopback)
    if (octets[0] === 127) {
      return { isValid: false, error: 'Loopback IP addresses are blocked.' };
    }
    // 0.0.0.0/8
    if (octets[0] === 0) {
      return { isValid: false, error: 'Unspecified IP addresses are blocked.' };
    }
  }

  // Reject integer/hex obfuscated IP formats (e.g. 2130706433 or 0x7f000001)
  if (/^0x[0-9a-f]+$/i.test(hostname) || /^\d+$/.test(hostname)) {
    return { isValid: false, error: 'Obfuscated numerical hostnames are blocked.' };
  }

  // Check valid hostname structure (must contain at least one dot or be a recognized public suffix)
  if (!hostname.includes('.')) {
    return { isValid: false, error: 'Please enter a complete domain name (e.g. service.com).' };
  }

  return {
    isValid: true,
    normalizedUrl: parsed.toString(),
    hostname,
  };
}

/**
 * Strips HTML tags, script, style, navigation and decodes common entities to extract clean policy text.
 */
export function extractTextFromHtml(html: string): string {
  if (typeof html !== 'string') return '';

  // Remove script, style, noscript, svg, nav, footer tags and their contents
  let text = html.replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, ' ');
  text = text.replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, ' ');
  text = text.replace(/<noscript\b[^<]*(?:(?!<\/noscript>)<[^<]*)*<\/noscript>/gi, ' ');
  text = text.replace(/<svg\b[^<]*(?:(?!<\/svg>)<[^<]*)*<\/svg>/gi, ' ');
  text = text.replace(/<nav\b[^<]*(?:(?!<\/nav>)<[^<]*)*<\/nav>/gi, ' ');
  text = text.replace(/<footer\b[^<]*(?:(?!<\/footer>)<[^<]*)*<\/footer>/gi, ' ');

  // Replace block elements with linebreaks to prevent text gluing
  text = text.replace(/<\/(p|div|h[1-6]|li|tr|section|article|header)>/gi, '\n');
  text = text.replace(/<(br|hr)\s*\/?>/gi, '\n');

  // Strip all remaining HTML tags
  text = text.replace(/<[^>]+>/g, ' ');

  // Decode decimal & hex HTML entities
  text = text.replace(/&#(\d+);/g, (_, dec) => String.fromCharCode(parseInt(dec, 10)));
  text = text.replace(/&#x([0-9a-fA-F]+);/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

  // Decode common named HTML entities
  text = text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/&nbsp;/g, ' ')
    .replace(/&copy;/g, '©')
    .replace(/&reg;/g, '®')
    .replace(/&rsquo;/g, "'")
    .replace(/&lsquo;/g, "'")
    .replace(/&rdquo;/g, '"')
    .replace(/&ldquo;/g, '"')
    .replace(/&mdash;/g, '—')
    .replace(/&ndash;/g, '–');

  // Collapse consecutive whitespaces and clean line breaks
  text = text.replace(/[ \t]+/g, ' ');
  text = text.replace(/\n\s*\n/g, '\n\n');

  return sanitizeInput(text);
}
