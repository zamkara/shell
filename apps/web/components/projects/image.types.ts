export interface ImageAsset {
  url: string
  thumbnail_url: string
}

export interface UploadImageResponse extends ImageAsset {
  success: true
  show_url?: string
  th_url: string
  name?: string
}

export async function uploadProjectImage(file: File): Promise<ImageAsset> {
  const formData = new FormData()
  formData.append("file", file)

  const response = await fetch("/api/admin/upload", {
    method: "POST",
    body: formData,
  })
  const data = (await response.json()) as
    UploadImageResponse | { error?: string }

  if (!response.ok || !("url" in data) || !("thumbnail_url" in data)) {
    throw new Error(
      "error" in data && data.error ? data.error : "Upload failed"
    )
  }

  return imageAsset(data.url, data.thumbnail_url)
}

export function imageAsset(url?: string, thumbnailURL?: string): ImageAsset {
  const normalizedURL = url ?? ""
  return {
    url: normalizedURL,
    thumbnail_url: thumbnailURL || normalizedURL,
  }
}

export function zipImageAssets(
  urls: string[] = [],
  thumbnailURLs: string[] = []
): ImageAsset[] {
  return urls.map((url, index) => imageAsset(url, thumbnailURLs[index]))
}
