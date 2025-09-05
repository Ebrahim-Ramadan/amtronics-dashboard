import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import { getSessionFromRequestHeaders } from '@/lib/session'


export function middleware(request: NextRequest) {
  const session = getSessionFromRequestHeaders(request.headers)
  const isAuthenticated = !!session
  const url = request.nextUrl.clone()

  // Define protected paths and role-based rules
  const protectedPaths = ['/analytics', '/projects', '/products', '/customers', '/orders']
  const adminOnlyPaths = [ '/api/users']

  // Redirect authenticated users from login page to dashboard
  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users from root to login page
  if (request.nextUrl.pathname === '/' && !isAuthenticated) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users from protected paths to login page (excluding /login)
  if (protectedPaths.some(p => request.nextUrl.pathname.startsWith(p)) && !isAuthenticated) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Enforce admin-only access
  if (adminOnlyPaths.some(p => request.nextUrl.pathname.startsWith(p))) {
    if (!session || session.role !== 'admin') {
      url.pathname = '/'
      return NextResponse.redirect(url)
    }
  }

  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/', '/login', '/analytics/:path*', '/projects/:path*', '/products/:path*', '/customers/:path*', '/orders/:path*', '/admin/:path*', '/api/users/:path*'],
}