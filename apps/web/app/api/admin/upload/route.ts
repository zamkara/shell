import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import sharp from "sharp"
import { BACKEND_URL } from "@/lib/backend"

interface PixhostUploadResponse {
  name?: string
  show_url?: string
  th_url?: string
}

const MAX_UPLOAD_BYTES = 4 * 1024 * 1024

export const maxDuration = 60

function fullSizeURLFromThumbnail(thumbnailURL: string) {
  const url = new URL(thumbnailURL)
  const host = url.hostname.match(/^t(\d+)\.pixhost\.cc$/)

  if (!host || !url.pathname.startsWith("/thumbs/")) {
    throw new Error("PiXhost returned an unsupported thumbnail URL")
  }

  url.hostname = `img${host[1]}.pixhost.cc`
  url.pathname = url.pathname.replace(/^\/thumbs\//, "/images/")
  return url.toString()
}

export async function POST(req: Request) {
  try {
    const token = (await cookies()).get("access_token")?.value
    if (!token) return NextResponse.json({ error: "Unauthorized access" }, { status: 401 })
    const accessResponse = await fetch(`${BACKEND_URL}/api/auth/session`, {
      headers: { Authorization: `Bearer ${token}` },
      cache: "no-store",
    })
    if (!accessResponse.ok) return NextResponse.json({ error: "Unauthorized access" }, { status: accessResponse.status })
    const session = await accessResponse.json() as { user?: { permissions?: string[] } }
    const permissions = session.user?.permissions ?? []
    if (!permissions.includes("projects.create") && !permissions.includes("projects.update")) {
      return NextResponse.json({ error: "Insufficient project permission" }, { status: 403 })
    }
    const formData = await req.formData()
    const file = formData.get("file") as File | null

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    if (!file.type.startsWith("image/")) {
      return NextResponse.json({ error: "Only image files are supported" }, { status: 415 })
    }

    if (file.size > MAX_UPLOAD_BYTES) {
      return NextResponse.json(
        { error: "Image exceeds the 4 MB upload limit" },
        { status: 413 }
      )
    }

    const inputBuffer = Buffer.from(await file.arrayBuffer())

    // Convert any image (JPEG, PNG, GIF, Animated GIF, WebP) to WebP with animated frame support
    const webpBuffer = await sharp(inputBuffer, { animated: true })
      .webp({ quality: 82, effort: 4 })
      .toBuffer()

    const originalName = file.name || "image.jpg"
    const baseName =
      originalName.substring(0, originalName.lastIndexOf(".")) || originalName
    const webpFileName = `${baseName}.webp`

    const pixhostFormData = new FormData()
    // Append the converted WebP buffer as a Blob/File
    pixhostFormData.append(
      "img",
      new Blob([webpBuffer], { type: "image/webp" }),
      webpFileName
    )
    pixhostFormData.append("content_type", "0")
    pixhostFormData.append("max_th_size", "500")

    const res = await fetch("https://api.pixhost.cc/images", {
      method: "POST",
      headers: {
        Accept: "application/json",
      },
      body: pixhostFormData,
    })

    if (!res.ok) {
      const errText = await res.text()
      return NextResponse.json(
        { error: `PiXhost upload failed: ${errText}` },
        { status: res.status }
      )
    }

    const data = (await res.json()) as PixhostUploadResponse
    if (!data.th_url) {
      return NextResponse.json(
        { error: "PiXhost response did not include a thumbnail URL" },
        { status: 502 }
      )
    }

    const fullSizeURL = fullSizeURLFromThumbnail(data.th_url)

    return NextResponse.json({
      success: true,
      url: fullSizeURL,
      thumbnail_url: data.th_url,
      show_url: data.show_url,
      th_url: data.th_url,
      name: data.name,
    })
  } catch (error: unknown) {
    return NextResponse.json(
      {
        error:
          error instanceof Error
            ? error.message
            : "Image conversion/upload failed",
      },
      { status: 500 }
    )
  }
}
