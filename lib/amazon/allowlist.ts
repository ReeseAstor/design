/**
 * Strict Amazon destination allowlist.
 *
 * `/go/[book]/amazon` never accepts a destination from the request. It looks one
 * up from content, and then this module decides whether that looked-up URL is
 * allowed to be sent to a browser. Both halves have to hold for the redirect to
 * be safe: an editor with Studio access still cannot turn the route into an open
 * redirect by pasting an arbitrary URL into a campaign document.
 */

/**
 * Hosts that may receive a reader. Amazon Attribution links are issued on
 * amazon.<tld> and on the short domain amzn.to, and the retail marketplaces are
 * the only other permitted targets.
 */
const ALLOWED_HOSTS = new Set<string>([
  'www.amazon.com',
  'amazon.com',
  'www.amazon.co.uk',
  'amazon.co.uk',
  'www.amazon.ca',
  'amazon.ca',
  'www.amazon.com.au',
  'amazon.com.au',
  'www.amazon.de',
  'amazon.de',
  'www.amazon.fr',
  'amazon.fr',
  'www.amazon.es',
  'amazon.es',
  'www.amazon.it',
  'amazon.it',
  'www.amazon.nl',
  'amazon.nl',
  'www.amazon.co.jp',
  'amazon.co.jp',
  'www.amazon.in',
  'amazon.in',
  'www.amazon.com.br',
  'amazon.com.br',
  'www.amazon.com.mx',
  'amazon.com.mx',
  'read.amazon.com',
  'amzn.to',
]);

export type AllowlistFailure =
  | 'empty'
  | 'unparseable'
  | 'insecure_protocol'
  | 'credentials_present'
  | 'host_not_allowed';

export type AllowlistResult =
  | { ok: true; url: string; hostname: string }
  | { ok: false; reason: AllowlistFailure };

export function checkAmazonDestination(candidate: string | null | undefined): AllowlistResult {
  if (!candidate || candidate.trim().length === 0) {
    return { ok: false, reason: 'empty' };
  }

  let parsed: URL;
  try {
    parsed = new URL(candidate.trim());
  } catch {
    return { ok: false, reason: 'unparseable' };
  }

  if (parsed.protocol !== 'https:') {
    return { ok: false, reason: 'insecure_protocol' };
  }

  // `https://www.amazon.com@evil.example/` parses with hostname evil.example in
  // modern parsers, but rejecting embedded credentials outright removes the
  // entire class of look-alike URLs rather than trusting the parser.
  if (parsed.username || parsed.password) {
    return { ok: false, reason: 'credentials_present' };
  }

  const hostname = parsed.hostname.toLowerCase();
  if (!ALLOWED_HOSTS.has(hostname)) {
    return { ok: false, reason: 'host_not_allowed' };
  }

  return { ok: true, url: parsed.toString(), hostname };
}

export function isAllowedAmazonDestination(candidate: string | null | undefined): boolean {
  return checkAmazonDestination(candidate).ok;
}

export function allowedAmazonHosts(): string[] {
  return [...ALLOWED_HOSTS].sort();
}
