// Middleware removed - authentication is now handled in the admin layout
// This prevents redirect loops
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // No redirects here - all auth is handled in the admin layout
  return NextResponse.next()
}

export const config = {
  matcher: '/admin/:path*',
}

