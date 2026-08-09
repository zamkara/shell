import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { BACKEND_URL } from "@/lib/backend"

export interface Session {
  authenticated: true
  user_id: string
  user: SessionUser
}

export interface SessionUser {
  id: string
  name: string
  email: string
  avatar_url: string
  role: string
  roles: string[]
  permissions: string[]
}

export async function requireAdminSession(): Promise<Session> {
  const token = (await cookies()).get("access_token")?.value

  if (!token) {
    redirect("/auth")
  }

  let response: Response

  try {
    response = await fetch(`${BACKEND_URL}/api/auth/session`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })
  } catch {
    redirect("/auth")
  }

  if (!response.ok) {
    redirect("/auth")
  }

  return response.json() as Promise<Session>
}
