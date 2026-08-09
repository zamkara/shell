import { cookies } from "next/headers"

import { BACKEND_URL } from "@/lib/backend"

async function forwardProfile(request: Request, method: "GET" | "PUT") {
  const token = (await cookies()).get("access_token")?.value
  if (!token) {
    return Response.json({ error: "Unauthorized access" }, { status: 401 })
  }

  const response = await fetch(`${BACKEND_URL}/api/profile`, {
    method,
    headers: {
      Authorization: `Bearer ${token}`,
      ...(method === "PUT" ? { "Content-Type": "application/json" } : {}),
    },
    body: method === "PUT" ? await request.text() : undefined,
    cache: "no-store",
  })

  return new Response(await response.text(), {
    status: response.status,
    headers: {
      "Content-Type":
        response.headers.get("Content-Type") ?? "application/json",
    },
  })
}

export async function GET(request: Request) {
  return forwardProfile(request, "GET")
}

export async function PUT(request: Request) {
  return forwardProfile(request, "PUT")
}
