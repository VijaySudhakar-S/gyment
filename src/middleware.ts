import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const token = request.cookies.get('gyment_token')?.value;

  // Protect SuperAdmin routes (except /super-admin/login)
  if (pathname.startsWith('/super-admin')) {
    if (pathname === '/super-admin/login') {
      if (token) {
        return NextResponse.redirect(new URL('/super-admin', request.url));
      }
      return NextResponse.next();
    }

    if (!token) {
      const loginUrl = new URL('/super-admin/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  // Protect Gym Admin routes
  if (pathname.startsWith('/gym-admin')) {
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('redirect', pathname);
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/super-admin/:path*',
    '/gym-admin/:path*',
    '/login',
  ],
};
