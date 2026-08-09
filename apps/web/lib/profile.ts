import { cache } from "react"
import { cookies } from "next/headers"
import { redirect } from "next/navigation"

import { BACKEND_URL } from "@/lib/backend"

export interface Profile {
  id: string
  email: string
  full_name: string
  display_name: string
  avatar_url: string
  resolved_avatar_url: string
  role: string
  roles: string[]
  permissions: string[]
  created_at: string
  updated_at: string
}

export const getProfile = cache(async (): Promise<Profile> => {
  const token = (await cookies()).get("access_token")?.value
  if (!token) redirect("/auth")

  const response = await fetch(`${BACKEND_URL}/api/profile`, {
    headers: { Authorization: `Bearer ${token}` },
    cache: "no-store",
  })

  if (response.status === 401 || response.status === 403) redirect("/auth")
  if (!response.ok) throw new Error("Failed to load profile")
  return response.json() as Promise<Profile>
})

export const getAdminProfile = getProfile
