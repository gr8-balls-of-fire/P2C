import { NextRequest, NextResponse } from 'next/server';

export function middleware(request: NextRequest) {
  // Public routes that don't require authentication
  const publicRoutes = ['/', '/api/health'];

  if (publicRoutes.includes(request.nextUrl.pathname)) {
    return NextResponse.next();
  }

  // API routes require Authorization header
  if (request.nextUrl.pathname.startsWith('/api/')) {
    const authHeader = request.headers.get('authorization');
    const expectedKey = process.env.P2C_ACCESS_KEY;

    if (!authHeader || !expectedKey) {
      return NextResponse.json(
        { error: 'Missing authorization header' },
        { status: 401 }
      );
    }

    // Format: "Bearer <key>"
    const [scheme, token] = authHeader.split(' ');
    if (scheme !== 'Bearer' || token !== expectedKey) {
      return NextResponse.json(
        { error: 'Invalid access key' },
        { status: 403 }
      );
    }
  }

  // App routes (UI) check for session/browser cookie (future: upgrade to NextAuth)
  // For v1, we trust that if you can access the deployment URL, you're authorized
  // (deploy behind VPN or password gate at infrastructure level)

  return NextResponse.next();
}

export const config = {
  matcher: [
    // Match API routes
    '/api/:path*',
    // Match app routes except static assets and Next.js internals
    '/((?!_next/static|_next/image|favicon.ico|public/).*)',
  ],
};
