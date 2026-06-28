import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

const COOKIE_NAME = "cyberpay_session"

export default function proxy(request: NextRequest) {
  const session = request.cookies.get(COOKIE_NAME)?.value
  const isAuthPage = request.nextUrl.pathname.startsWith("/login")

  if (isAuthPage) {
    if (session) {
      return NextResponse.redirect(new URL("/", request.url))
    }
    return NextResponse.next()
  }

  if (!session) {
    return NextResponse.redirect(new URL("/login", request.url))
  }

  return NextResponse.next()
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
    "/((?!api|_next/static|_next/image|favicon.ico).*)",
  ],
}
