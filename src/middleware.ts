import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Paths that don't require authentication
const publicPaths = ['/login', '/'];

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Check if path is public
  if (publicPaths.includes(pathname)) {
    return NextResponse.next();
  }
  
  // Check for JWT token
  const jwtToken = request.cookies.get('digi_jwt_token');
  
  // Redirect to login if no token
  if (!jwtToken) {
    return NextResponse.redirect(new URL('/login', request.url));
  }
  
  // For now, allow access if token exists
  // In production, you would decode and validate the token here
  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     */
    '/((?!api|_next/static|_next/image|favicon.ico).*)',
  ],
};