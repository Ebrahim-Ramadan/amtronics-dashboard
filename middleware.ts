import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'


export function middleware(request: NextRequest) {
  const isAuthenticated = request.cookies.has('authenticated') // Check for an 'authenticated' cookie

  const url = request.nextUrl.clone()

  // Define protected paths
  const protectedPaths = ['/']

  // Redirect authenticated users from login page to dashboard
  if (request.nextUrl.pathname === '/login' && isAuthenticated) {
    url.pathname = '/'
    return NextResponse.redirect(url)
  }

  // Redirect unauthenticated users from protected paths to login page
  if (protectedPaths.includes(request.nextUrl.pathname) && !isAuthenticated) {
    url.pathname = '/login'
    return NextResponse.redirect(url)
  }

  // Allow the request to proceed for all other cases
  return NextResponse.next()
}

// Configure the middleware to run on specific paths
export const config = {
  matcher: ['/', '/login'],
} 