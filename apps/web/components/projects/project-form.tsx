"use client"

import * as React from "react"
import { Input } from "@workspace/ui/components/input"
import { AdaptiveTextInput } from "@workspace/ui/components/adaptive-text-input"
import { Label } from "@workspace/ui/components/label"
import { Textarea } from "@workspace/ui/components/textarea"
import { BadgeInput } from "@workspace/ui/components/badge-input"
import { KeyValueInput } from "@workspace/ui/components/key-value-input"
import {
  Frame,
  FrameHeader,
  FrameTitle,
  FrameDescription,
  FramePanel,
} from "@workspace/ui/components/frame"
import { MediaCarousel } from "./media-carousel"
import { SingleImageDropzone } from "./single-image-dropzone"
import { imageAsset, zipImageAssets } from "./image.types"
import { Project, emptyProject, isProjectStatus } from "./project.types"
import {
  COLLECTION_CONFIGS,
  SHELL_EVENTS,
  TOOLBAR_ACTION_IDS,
} from "../../lib/data"

interface ToolbarActionDetail {
  actionId?: string
  value?: unknown
}

interface ProjectFormProps {
  project: Project | null
  onSaveSuccess: () => void
  onCancel?: () => void
}

function FormField({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <Label>{label}</Label>
      {children}
    </div>
  )
}

export function ProjectForm({ project, onSaveSuccess }: ProjectFormProps) {
  const formRef = React.useRef<HTMLFormElement>(null)
  const [formData, setFormData] = React.useState<Project>(emptyProject)

  React.useEffect(() => {
    const handleToolbarAction = (e: Event) => {
      const { actionId, value } = (e as CustomEvent<ToolbarActionDetail>).detail

      if (actionId === TOOLBAR_ACTION_IDS.saveProject) {
        formRef.current?.requestSubmit()
      }

      if (actionId === TOOLBAR_ACTION_IDS.setStatus && isProjectStatus(value)) {
        setFormData((previous) => ({ ...previous, status: value }))
      }
    }
    window.addEventListener(SHELL_EVENTS.toolbarAction, handleToolbarAction)
    return () =>
      window.removeEventListener(
        SHELL_EVENTS.toolbarAction,
        handleToolbarAction
      )
  }, [])

  React.useEffect(() => {
    if (project) {
      setFormData(project)
    } else {
      setFormData(emptyProject)
    }
  }, [project])

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }))
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      const payload: Project = {
        ...formData,
      }

      const method = project?.id ? "PUT" : "POST"
      const url = project?.id
        ? `${COLLECTION_CONFIGS.projects.adminEndpoint}?id=${project.id}`
        : COLLECTION_CONFIGS.projects.adminEndpoint!

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      })

      if (!res.ok) {
        const d = await res.json()
        throw new Error(d.error || "Failed to save project")
      }

      onSaveSuccess()
    } catch (error: unknown) {
      alert(error instanceof Error ? error.message : "Failed to save project")
    }
  }

  return (
    <form
      ref={formRef}
      onSubmit={handleSave}
      className="flex h-full flex-col overflow-hidden"
    >
      <div className="flex-1 space-y-6 overflow-y-auto p-6">
        {/* General Info Frame */}
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>General Information</FrameTitle>
            {/*<FrameDescription>Basic details for the project entry.</FrameDescription>*/}
          </FrameHeader>
          <FramePanel className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Slug">
                <Input
                  name="slug"
                  value={formData.slug}
                  onChange={handleChange}
                  required
                />
              </FormField>
              <FormField label="Title">
                <Input
                  name="title"
                  value={formData.title}
                  onChange={handleChange}
                  required
                />
              </FormField>
            </div>
            <FormField label="Tagline">
              <AdaptiveTextInput
                name="tagline"
                value={formData.tagline}
                onChange={handleChange}
                rows={2}
              />
            </FormField>
          </FramePanel>
        </Frame>

        {/* Challenge & Solution Frame */}
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Project Context</FrameTitle>
            <FrameDescription>
              Challenge faced and solution implemented.
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="grid grid-cols-2 gap-4">
            <FormField label="Challenge">
              <Textarea
                name="challenge"
                value={formData.challenge}
                onChange={handleChange}
                rows={3}
              />
            </FormField>
            <FormField label="Solution">
              <Textarea
                name="solution"
                value={formData.solution}
                onChange={handleChange}
                rows={3}
              />
            </FormField>
          </FramePanel>
        </Frame>

        {/* Cover & Hero Images Frame */}
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Cover & Hero Images</FrameTitle>
            <FrameDescription>
              Upload main cover thumbnail and hero banner images via Dropzone.
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="grid grid-cols-2 gap-4">
            <FormField label="Cover Image">
              <SingleImageDropzone
                value={imageAsset(
                  formData.image_url,
                  formData.image_thumbnail_url
                )}
                onChange={(image) =>
                  setFormData((previous) => ({
                    ...previous,
                    image_url: image?.url ?? "",
                    image_thumbnail_url: image?.thumbnail_url ?? "",
                  }))
                }
                label="Cover Image"
              />
            </FormField>
            <FormField label="Hero Image">
              <SingleImageDropzone
                value={imageAsset(
                  formData.hero_url,
                  formData.hero_thumbnail_url
                )}
                onChange={(image) =>
                  setFormData((previous) => ({
                    ...previous,
                    hero_url: image?.url ?? "",
                    hero_thumbnail_url: image?.thumbnail_url ?? "",
                  }))
                }
                label="Hero Image"
              />
            </FormField>
          </FramePanel>
        </Frame>

        {/* Project Links & Tags Frame */}
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Links & Tags</FrameTitle>
            <FrameDescription>
              Project links, ratio, and categorization tags.
            </FrameDescription>
          </FrameHeader>
          <FramePanel className="grid gap-4">
            <div className="grid grid-cols-2 gap-4">
              <FormField label="Ratio (e.g. 2250 / 1500)">
                <Input
                  name="ratio"
                  value={formData.ratio}
                  onChange={handleChange}
                />
              </FormField>
              <FormField label="Live URL">
                <Input
                  name="live_url"
                  value={formData.live_url}
                  onChange={handleChange}
                />
              </FormField>
            </div>
            <FormField label="Tags">
              <BadgeInput
                value={formData.tags || []}
                onChange={(newTags) =>
                  setFormData((prev) => ({ ...prev, tags: newTags }))
                }
                placeholder="Type tag and press Enter..."
              />
            </FormField>
          </FramePanel>
        </Frame>

        {/* Dedicated Project Media Frame */}
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Project Media</FrameTitle>
            <FrameDescription>
              Upload and manage project image assets via Dropzone.
            </FrameDescription>
          </FrameHeader>
          <FramePanel>
            <MediaCarousel
              images={zipImageAssets(
                formData.media,
                formData.media_thumbnail_urls
              )}
              onAddImages={(newImages) =>
                setFormData((previous) => ({
                  ...previous,
                  media: [
                    ...previous.media,
                    ...newImages.map((image) => image.url),
                  ],
                  media_thumbnail_urls: [
                    ...previous.media_thumbnail_urls,
                    ...newImages.map((image) => image.thumbnail_url),
                  ],
                }))
              }
              onChangeImage={(index, newImage) =>
                setFormData((previous) => {
                  const media = [...previous.media]
                  const mediaThumbnailURLs = [...previous.media_thumbnail_urls]
                  media[index] = newImage.url
                  mediaThumbnailURLs[index] = newImage.thumbnail_url
                  return {
                    ...previous,
                    media,
                    media_thumbnail_urls: mediaThumbnailURLs,
                  }
                })
              }
            />
          </FramePanel>
        </Frame>

        {/* Metadata & Stats Frame */}
        <Frame spacing="sm">
          <FrameHeader>
            <FrameTitle>Attributes & Metrics</FrameTitle>
            <FrameDescription>
              Dynamic key-value metadata and performance statistics.
            </FrameDescription>
          </FrameHeader>
          <Frame className="grid grid-cols-2 gap-1">
            <FramePanel>
              <FormField label="Meta">
                <KeyValueInput
                  value={formData.meta || {}}
                  onChange={(newMeta) =>
                    setFormData((prev) => ({ ...prev, meta: newMeta }))
                  }
                  keyPlaceholder="Meta Key"
                  valuePlaceholder="Meta Value"
                  actionId={TOOLBAR_ACTION_IDS.addMeta}
                  eventName={SHELL_EVENTS.toolbarAction}
                />
              </FormField>
            </FramePanel>
            <FramePanel>
              <FormField label="Stats">
                <KeyValueInput
                  value={formData.stats || {}}
                  onChange={(newStats) =>
                    setFormData((prev) => ({ ...prev, stats: newStats }))
                  }
                  keyPlaceholder="Stat Label"
                  valuePlaceholder="Stat Value"
                  actionId={TOOLBAR_ACTION_IDS.addStat}
                  eventName={SHELL_EVENTS.toolbarAction}
                />
              </FormField>
            </FramePanel>
          </Frame>
        </Frame>
      </div>
    </form>
  )
}
