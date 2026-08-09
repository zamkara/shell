import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

export function proxy(request: NextRequest) {
  const requestHeaders = new Headers(request.headers)
  const token = request.cookies.get("access_token")?.value

  if (request.nextUrl.pathname.startsWith("/shell") && !token) {
    return NextResponse.redirect(new URL("/auth", request.url))
  }

  if (token) {
    requestHeaders.set("Authorization", `Bearer ${token}`)
  }

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: ["/shell/:path*", "/api/admin/:path*"],
}
