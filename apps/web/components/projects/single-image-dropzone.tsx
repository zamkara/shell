"use client"

import * as React from "react"
import { ImagePlus, Camera, Trash2, Loader2 } from "lucide-react"
import { cn } from "@workspace/ui/lib/utils"
import { uploadProjectImage, type ImageAsset } from "./image.types"

export interface SingleImageDropzoneProps {
  value?: ImageAsset
  onChange: (image: ImageAsset | null) => void
  label?: string
  aspectRatio?: "video" | "square"
  className?: string
}

export function SingleImageDropzone({
  value,
  onChange,
  label = "Upload Image",
  aspectRatio = "video",
  className,
}: SingleImageDropzoneProps) {
  const fileInputRef = React.useRef<HTMLInputElement>(null)
  const [isUploading, setIsUploading] = React.useState(false)

  const processFile = async (file?: File) => {
    if (!file || !file.type.startsWith("image/")) return
    setIsUploading(true)
    try {
      onChange(await uploadProjectImage(file))
    } catch (error: unknown) {
      alert(
        `Image upload error: ${error instanceof Error ? error.message : "Upload failed"}`
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    processFile(file)
    if (e.target) e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    const file = e.dataTransfer.files?.[0]
    processFile(file)
  }

  return (
    <div className={cn("flex w-full flex-col gap-2", className)}>
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        disabled={isUploading}
        onChange={handleFileSelect}
        className="hidden"
      />

      {isUploading ? (
        <div
          className={cn(
            "relative flex w-full flex-col items-center justify-center gap-2 rounded-md border-2 border-dashed border-primary/50 bg-muted/30 text-primary",
            aspectRatio === "video" ? "aspect-video" : "aspect-square"
          )}
        >
          <Loader2 className="size-8 animate-spin" />
          <span className="font-semibold">Uploading...</span>
        </div>
      ) : value?.url ? (
        <div
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "group relative w-full cursor-pointer overflow-hidden rounded-md border bg-muted",
            aspectRatio === "video" ? "aspect-video" : "aspect-square"
          )}
          title="Click to Change Image"
        >
          <img
            src={value.thumbnail_url || value.url}
            alt={label}
            referrerPolicy="no-referrer"
            className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
          <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 bg-background/60 text-foreground opacity-0 transition-opacity group-hover:opacity-100">
            <Camera className="size-6" />
            <span className="font-semibold">Change {label}</span>
          </div>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              onChange(null)
            }}
            className="absolute top-2 right-2 rounded-md bg-background/60 p-1.5 text-foreground opacity-0 transition-opacity group-hover:opacity-100 hover:bg-destructive"
            title="Remove Image"
          >
            <Trash2 className="size-4" />
          </button>
        </div>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => fileInputRef.current?.click()}
          className={cn(
            "relative flex w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/20 text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40 hover:text-foreground",
            aspectRatio === "video" ? "aspect-video" : "aspect-square"
          )}
        >
          <ImagePlus className="size-8" />
          <span className="font-medium">Click or Drop {label} Here</span>
        </div>
      )}
    </div>
  )
}
