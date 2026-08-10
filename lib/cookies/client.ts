'use client';

/** Reads a non-HttpOnly first-party cookie. Returns null on the server. */
export function readClientCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;

  const prefix = `${name}=`;
  for (const part of document.cookie.split(';')) {
    const entry = part.trim();
    if (entry.startsWith(prefix)) {
      return decodeURIComponent(entry.slice(prefix.length));
    }
  }
  return null;
}
