import { auth } from "@/auth"
import { NextResponse } from "next/server"

export default auth((req) => {
  const { pathname } = req.nextUrl
  const isAuthenticated = !!req.auth

  if (pathname.startsWith('/test-auth')) {
    return NextResponse.next()
  }

  const protectedRoutes = [
    '/dashboard',
    '/flows',
    '/templates',
    '/inbox',
    '/settings',
    '/channels',
    '/bots',
    '/team',
    '/archives',
    '/analytics',
    '/ai-assistant',
    '/integrations',
  ]

  const isProtectedRoute = protectedRoutes.some(route => pathname.startsWith(route))

  if (isProtectedRoute && !isAuthenticated) {
    return NextResponse.redirect(new URL('/login', req.url))
  }

  return NextResponse.next()
})

export const config = {
  matcher: [
    "/dashboard/:path*",
    "/flows/:path*",
    "/templates/:path*",
    "/inbox/:path*",
    "/settings/:path*",
    "/channels/:path*",
    "/bots/:path*",
    "/team/:path*",
    "/archives/:path*",
    "/analytics/:path*",
    "/ai-assistant/:path*",
    "/integrations/:path*",
    "/test-auth",
  ],
};
