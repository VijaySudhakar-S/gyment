import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('gyment_token')?.value;

  // Protect SuperAdmin routes
  if (pathname.startsWith('/super-admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // If already logged in, redirect away from /login
  if (pathname === '/login') {
    if (token) {
      return NextResponse.redirect(new URL('/super-admin', request.url));
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/login',
  ],
};
