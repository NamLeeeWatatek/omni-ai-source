import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  const protectedRoutes = [
    '/dashboard',
    '/templates',
    '/inbox',
    '/settings',
    '/channels',
    '/bots',
    '/team',
    '/archives',
    '/analytics',
    '/ai-assistant',
    '/ai-assistant',
    '/integrations',
    '/jobs',
  ]

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))
  const isAuthPage = ['/login', '/register', '/forgot-password'].includes(pathname)

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  if (isAuthPage && isAuthenticated) {
    return NextResponse.redirect(new URL('/dashboard', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/templates/:path*",
    "/inbox/:path*",
    "/settings/:path*",
    "/channels/:path*",
    "/bots/:path*",
    "/team/:path*",
    "/archives/:path*",
    "/analytics/:path*",
    "/ai-assistant/:path*",
    "/ai-assistant/:path*",
    "/integrations/:path*",
    "/jobs/:path*",
    "/test-auth",
  ],
};

