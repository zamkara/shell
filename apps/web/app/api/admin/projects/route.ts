import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { BACKEND_URL } from "@/lib/backend"

async function proxyToBackend(req: Request) {
  try {
    const cookieStore = await cookies()
    const token = cookieStore.get("access_token")?.value

    const url = new URL(req.url)
    const backendUrl = `${BACKEND_URL}/api/admin/projects${url.search}`

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
      Accept: "application/json",
    }

    if (token) {
      headers["Authorization"] = `Bearer ${token}`
    }

    const method = req.method
    let body: string | undefined = undefined

    if (method !== "GET" && method !== "HEAD") {
      body = await req.text()
    }

    const res = await fetch(backendUrl, {
      method,
      headers,
      body,
    })

    const responseText = await res.text()
    let data: unknown
    try {
      data = JSON.parse(responseText)
    } catch {
      data = { message: responseText }
    }

    return NextResponse.json(data, { status: res.status })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error ? error.message : "Proxy request failed",
      },
      { status: 500 }
    )
  }
}

export async function GET(req: Request) {
  return proxyToBackend(req)
}

export async function POST(req: Request) {
  return proxyToBackend(req)
}

export async function PUT(req: Request) {
  return proxyToBackend(req)
}

export async function DELETE(req: Request) {
  return proxyToBackend(req)
}
