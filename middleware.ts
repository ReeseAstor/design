import { NextResponse, type NextRequest } from 'next/server';
import { ANON_ID_MAX_AGE_SECONDS, COOKIE_ANON_ID } from '@/lib/cookies';

/**
 * Issues the first-party anonymous ID used for experiment bucketing and as the
 * PostHog distinct ID. It is a random UUID with no personal data in it, and it
 * is the only cookie set before a reader interacts with anything.
 */
export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  if (!request.cookies.get(COOKIE_ANON_ID)) {
    response.cookies.set(COOKIE_ANON_ID, crypto.randomUUID(), {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: ANON_ID_MAX_AGE_SECONDS,
    });
  }

  return response;
}

export const config = {
  matcher: ['/((?!_next/static|_next/image|favicon.ico|studio|api|.*\\.(?:svg|png|jpg|jpeg|webp|avif|ico|txt|xml)$).*)'],
};
