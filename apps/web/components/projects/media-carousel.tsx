"use client"

import * as React from "react"
import { useCallback, useEffect, useState } from "react"
import { cn } from "@workspace/ui/lib/utils"
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  type CarouselApi,
} from "@workspace/ui/components/carousel"

import { Plus, ImagePlus, Camera, Loader2 } from "lucide-react"
import { Card } from "@workspace/ui/components/card"
import { uploadProjectImage, type ImageAsset } from "./image.types"

export interface MediaCarouselProps {
  images: ImageAsset[]
  onAddImages?: (newImages: ImageAsset[]) => void
  onChangeImage?: (index: number, newImage: ImageAsset) => void
  className?: string
}

export function MediaCarousel({
  images = [],
  onAddImages,
  onChangeImage,
  className,
}: MediaCarouselProps) {
  const [mainApi, setMainApi] = useState<CarouselApi>()
  const [thumbApi, setThumbApi] = useState<CarouselApi>()
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isUploading, setIsUploading] = useState(false)
  const addFileInputRef = React.useRef<HTMLInputElement>(null)
  const replaceFileInputRef = React.useRef<HTMLInputElement>(null)
  const activeReplaceIndexRef = React.useRef<number | null>(null)

  const onThumbClick = useCallback(
    (index: number) => {
      if (!mainApi || !thumbApi) return
      mainApi.scrollTo(index)
    },
    [mainApi, thumbApi]
  )

  const onSelect = useCallback(() => {
    if (!mainApi || !thumbApi) return
    const index = mainApi.selectedScrollSnap()
    setSelectedIndex(index)
    thumbApi.scrollTo(index)
  }, [mainApi, thumbApi])

  useEffect(() => {
    if (!mainApi) return
    onSelect()
    mainApi.on("select", onSelect)
    mainApi.on("reInit", onSelect)
    return () => {
      mainApi.off("select", onSelect)
      mainApi.off("reInit", onSelect)
    }
  }, [mainApi, onSelect])

  const processAddFiles = async (files: FileList | null) => {
    if (!files || files.length === 0 || !onAddImages) return
    setIsUploading(true)
    try {
      const imageFiles = Array.from(files).filter((file) =>
        file.type.startsWith("image/")
      )
      const uploadedImages = await Promise.all(
        imageFiles.map(uploadProjectImage)
      )

      if (uploadedImages.length > 0) {
        onAddImages(uploadedImages)
      }
    } catch (error: unknown) {
      alert(
        `Media upload error: ${error instanceof Error ? error.message : "Upload failed"}`
      )
    } finally {
      setIsUploading(false)
    }
  }

  const handleAddFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    processAddFiles(e.target.files)
    if (e.target) e.target.value = ""
  }

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault()
    processAddFiles(e.dataTransfer.files)
  }

  const triggerChangeImage = (index: number) => {
    activeReplaceIndexRef.current = index
    replaceFileInputRef.current?.click()
  }

  const handleReplaceFileSelect = async (
    e: React.ChangeEvent<HTMLInputElement>
  ) => {
    const file = e.target.files?.[0]
    const idx = activeReplaceIndexRef.current
    if (
      file &&
      idx !== null &&
      onChangeImage &&
      file.type.startsWith("image/")
    ) {
      setIsUploading(true)
      try {
        onChangeImage(idx, await uploadProjectImage(file))
      } catch (error: unknown) {
        alert(
          `Media replace error: ${error instanceof Error ? error.message : "Upload failed"}`
        )
      } finally {
        setIsUploading(false)
      }
    }
    if (e.target) e.target.value = ""
    activeReplaceIndexRef.current = null
  }

  return (
    <div className={cn("flex w-full flex-col gap-3", className)}>
      {/* Hidden file input for replacing an existing image */}
      <input
        ref={replaceFileInputRef}
        type="file"
        accept="image/*"
        onChange={handleReplaceFileSelect}
        className="hidden"
      />

      {images.length > 0 ? (
        <Carousel setApi={setMainApi} className="w-full">
          <CarouselContent>
            {images.map((image, index) => (
              <CarouselItem key={`${image.url}-${index}`}>
                <Card
                  onClick={() => triggerChangeImage(index)}
                  className="group relative aspect-video cursor-pointer overflow-hidden rounded-md border bg-muted p-0"
                  title="Click to Change Image"
                >
                  <img
                    src={image.url}
                    alt={`Slide ${index + 1}`}
                    referrerPolicy="no-referrer"
                    className="h-full w-full scale-105 object-cover transition-transform delay-300 duration-300 group-hover:scale-110"
                  />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-1 opacity-0 transition-opacity group-hover:opacity-100">
                    {isUploading ? (
                      <Loader2 className="size-6 animate-spin" />
                    ) : (
                      <Camera className="size-6" />
                    )}
                    <span className="font-semibold">
                      {isUploading ? "Uploading..." : "Change Image"}
                    </span>
                  </div>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      ) : (
        <div
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
          onClick={() => addFileInputRef.current?.click()}
          className="relative flex aspect-video w-full cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-input bg-muted/20 text-muted-foreground transition-colors hover:border-primary hover:bg-muted/40 hover:text-foreground"
        >
          {isUploading ? (
            <>
              <Loader2 className="size-8 animate-spin text-primary" />
              <span className="font-medium text-primary">Uploading...</span>
            </>
          ) : (
            <>
              <ImagePlus className="size-8" />
              <span className="font-medium">Click or Drop Images Here</span>
            </>
          )}
          <input
            ref={addFileInputRef}
            type="file"
            accept="image/*"
            multiple
            disabled={isUploading}
            onChange={handleAddFileSelect}
            className="hidden"
          />
        </div>
      )}

      {/* Row containing scrolling thumbnails + fixed non-scrolling Dropzone button on the far right */}
      <div className="flex w-full items-center overflow-hidden">
        {images.length > 0 && (
          <div className="min-w-0 flex-1">
            <Carousel
              setApi={setThumbApi}
              opts={{
                containScroll: "keepSnaps",
                dragFree: true,
              }}
              className="w-full"
            >
              <CarouselContent className="-ml-2 flex-row">
                {images.map((image, index) => (
                  <CarouselItem
                    key={`${image.url}-${index}`}
                    className="basis-1/5 cursor-pointer pl-2 sm:basis-1/6"
                    onClick={() => onThumbClick(index)}
                  >
                    <div
                      className={cn(
                        "relative aspect-square overflow-hidden rounded-md border-2 transition-all",
                        index === selectedIndex
                          ? "opacity-100"
                          : "opacity-50 hover:opacity-80"
                      )}
                    >
                      <img
                        src={image.thumbnail_url || image.url}
                        alt={`Thumb ${index + 1}`}
                        referrerPolicy="no-referrer"
                        className="h-full w-full object-cover"
                      />
                    </div>
                  </CarouselItem>
                ))}
              </CarouselContent>
            </Carousel>
          </div>
        )}

        {/* Fixed Non-Scrolling Dropzone Button on the far right matching exact measured thumbnail dimensions */}
        {images.length > 0 && (
          <div className="aspect-square self-stretch pl-2">
            <div
              onDragOver={(e) => e.preventDefault()}
              onDrop={handleDrop}
              onClick={() => !isUploading && addFileInputRef.current?.click()}
              className="relative flex size-full cursor-pointer flex-col items-center justify-center gap-1 overflow-hidden rounded-lg border-2 border-dashed border-input p-2 text-muted-foreground transition-colors hover:border-primary hover:bg-muted/50 hover:text-foreground"
              title="Pick or Drop Images"
            >
              <input
                ref={addFileInputRef}
                type="file"
                accept="image/*"
                multiple
                disabled={isUploading}
                onChange={handleAddFileSelect}
                className="hidden"
              />
              {isUploading ? (
                <Loader2 className="size-4 animate-spin text-primary" />
              ) : (
                <Plus className="size-4 shrink-0" />
              )}
              <span className="text-center leading-none font-medium select-none">
                {isUploading ? "..." : "Pick Image"}
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
