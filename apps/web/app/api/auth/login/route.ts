import { NextResponse } from "next/server"

import { BACKEND_URL } from "@/lib/backend"

interface LoginPayload {
  email?: unknown
  password?: unknown
}

function getErrorMessage(data: unknown) {
  if (!data || typeof data !== "object") {
    return "Failed to login"
  }

  const errorData = data as Record<string, unknown>
  const message =
    errorData.error_description || errorData.error || errorData.message

  return typeof message === "string" ? message : "Failed to login"
}

export async function POST(request: Request) {
  let credentials: LoginPayload

  try {
    credentials = (await request.json()) as LoginPayload
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 })
  }

  if (
    typeof credentials.email !== "string" ||
    typeof credentials.password !== "string" ||
    !credentials.email.trim() ||
    !credentials.password
  ) {
    return NextResponse.json(
      { error: "Email and password are required" },
      { status: 400 }
    )
  }

  try {
    const loginResponse = await fetch(`${BACKEND_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        email: credentials.email.trim(),
        password: credentials.password,
      }),
      cache: "no-store",
    })
    const loginData: unknown = await loginResponse.json()

    if (!loginResponse.ok) {
      return NextResponse.json(
        { error: getErrorMessage(loginData) },
        { status: loginResponse.status }
      )
    }

    const authData = loginData as Record<string, unknown>
    const accessToken = authData.access_token

    if (typeof accessToken !== "string") {
      return NextResponse.json(
        { error: "Authentication server returned an invalid session" },
        { status: 502 }
      )
    }

    const sessionResponse = await fetch(`${BACKEND_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
      cache: "no-store",
    })

    if (!sessionResponse.ok) {
      return NextResponse.json(
        { error: "This account does not have access to the admin shell" },
        { status: 403 }
      )
    }

    const response = NextResponse.json({ success: true })
    response.cookies.set("access_token", accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      path: "/",
      maxAge:
        typeof authData.expires_in === "number" ? authData.expires_in : 3600,
      sameSite: "lax",
    })

    return response
  } catch {
    return NextResponse.json(
      { error: "Authentication service is unavailable" },
      { status: 502 }
    )
  }
}
