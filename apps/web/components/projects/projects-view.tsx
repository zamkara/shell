"use client"

import * as React from "react"

import { Skeleton } from "@workspace/ui/components/skeleton"

import { ProjectCard } from "./project-card"
import { ProjectForm } from "./project-form"
import {
  normalizeProject,
  type Project,
  type ProjectSummary,
} from "./project.types"
import { CollectionWorkspace } from "../collection-panel"
import { useAccess } from "../access-provider"
import { usePaginatedCollection } from "../../hooks/use-paginated-collection"
import {
  SHELL_EVENTS,
  TOOLBAR_ACTION_IDS,
  collectionDetailURL,
  collectionMutationURL,
} from "../../lib/data"

type EditorMode = "idle" | "loading" | "new" | "edit"

async function fetchProjectDetail(id: string): Promise<Project> {
  const response = await fetch(collectionDetailURL("projects", id), {
    cache: "no-store",
  })
  if (!response.ok) {
    const data = (await response.json()) as { error?: string }
    throw new Error(data.error || "Failed to fetch project")
  }

  const data = (await response.json()) as Partial<Project>
  return normalizeProject(data)
}

function ProjectEditorSkeleton() {
  return (
    <div className="flex h-full flex-col gap-6 p-6">
      <Skeleton className="h-28 w-full" />
      <Skeleton className="h-40 w-full" />
      <Skeleton className="h-52 w-full" />
    </div>
  )
}

export function ProjectsView() {
  const { can } = useAccess()
  const detailRequestId = React.useRef(0)
  const collection = usePaginatedCollection<ProjectSummary>("projects")
  const projects = collection.items
  const [error, setError] = React.useState<string | null>(null)
  const [editorMode, setEditorMode] = React.useState<EditorMode>("idle")
  const [selectedProjectId, setSelectedProjectId] = React.useState<
    string | null
  >(null)
  const [selectedProject, setSelectedProject] = React.useState<Project | null>(
    null
  )
  const [deletingProjectId, setDeletingProjectId] = React.useState<
    string | null
  >(null)
  const [duplicatingProjectId, setDuplicatingProjectId] = React.useState<
    string | null
  >(null)

  const fetchProjects = collection.refresh

  React.useEffect(() => {
    const active = editorMode === "new" || editorMode === "edit"
    window.dispatchEvent(
      new CustomEvent(SHELL_EVENTS.editorState, {
        detail: {
          active,
          status: active
            ? (selectedProject?.status ??
              (editorMode === "new" ? "draft" : undefined))
            : undefined,
        },
      })
    )
  }, [editorMode, selectedProject?.status])

  React.useEffect(() => {
    const handleToolbarAction = (event: Event) => {
      const customEvent = event as CustomEvent<{ actionId?: string }>
      if (customEvent.detail.actionId === TOOLBAR_ACTION_IDS.newProject) {
        detailRequestId.current += 1
        setSelectedProjectId(null)
        setSelectedProject(null)
        setEditorMode("new")
        setError(null)
      }
    }

    window.addEventListener(SHELL_EVENTS.toolbarAction, handleToolbarAction)
    return () => {
      window.removeEventListener(
        SHELL_EVENTS.toolbarAction,
        handleToolbarAction
      )
      window.dispatchEvent(
        new CustomEvent(SHELL_EVENTS.editorState, {
          detail: { active: false },
        })
      )
    }
  }, [])

  const handleOpen = async (project: ProjectSummary) => {
    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId
    setSelectedProjectId(project.id)
    setSelectedProject(null)
    setEditorMode("loading")
    setError(null)

    try {
      const detail = await fetchProjectDetail(project.id)
      if (detailRequestId.current !== requestId) return

      setSelectedProject(detail)
      setEditorMode("edit")
    } catch (reason: unknown) {
      if (detailRequestId.current !== requestId) return

      setSelectedProjectId(null)
      setEditorMode("idle")
      setError(
        reason instanceof Error ? reason.message : "Failed to fetch project"
      )
    }
  }

  const handleDuplicate = async (project: ProjectSummary) => {
    setDuplicatingProjectId(project.id)
    setError(null)

    try {
      const source = await fetchProjectDetail(project.id)
      const duplicate: Project = {
        ...source,
        id: undefined,
        created_at: undefined,
        slug: `${source.slug}-copy-${crypto.randomUUID().slice(0, 8)}`,
        status: "draft",
        title: `${source.title} Copy`,
      }
      const response = await fetch(collectionMutationURL("projects"), {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(duplicate),
      })
      const data = (await response.json()) as { error?: string; id?: string }

      if (!response.ok || !data.id) {
        throw new Error(data.error || "Failed to duplicate project")
      }

      await fetchProjects()
      setSelectedProjectId(data.id)
      setSelectedProject({ ...duplicate, id: data.id })
      setEditorMode("edit")
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Failed to duplicate project"
      )
    } finally {
      setDuplicatingProjectId(null)
    }
  }

  const handleDelete = async (project: ProjectSummary) => {
    const shouldDelete = window.confirm(
      `Delete "${project.title || "Untitled Project"}"? This action cannot be undone.`
    )
    if (!shouldDelete) return

    setDeletingProjectId(project.id)
    setError(null)

    try {
      const response = await fetch(
        collectionMutationURL("projects", project.id),
        {
          method: "DELETE",
        }
      )
      if (!response.ok) {
        const data = (await response.json()) as { error?: string }
        throw new Error(data.error || "Failed to delete project")
      }

      if (selectedProjectId === project.id) {
        detailRequestId.current += 1
        setSelectedProjectId(null)
        setSelectedProject(null)
        setEditorMode("idle")
      }

      await fetchProjects()
    } catch (reason: unknown) {
      setError(
        reason instanceof Error ? reason.message : "Failed to delete project"
      )
    } finally {
      setDeletingProjectId(null)
    }
  }

  return (
    <CollectionWorkspace
      collectionKey="projects"
      collection={collection}
      error={
        projects.length === 0 ? error || collection.error : collection.error
      }
      editor={
        editorMode === "loading" ? (
          <ProjectEditorSkeleton />
        ) : editorMode !== "idle" ? (
          <ProjectForm
            key={selectedProject?.id || "new"}
            project={selectedProject}
            onSaveSuccess={() => void fetchProjects()}
          />
        ) : undefined
      }
    >
      {projects.map((project) => (
        <ProjectCard
          key={project.id}
          project={project}
          isSelected={selectedProjectId === project.id}
          isDeleting={deletingProjectId === project.id}
          isDuplicating={duplicatingProjectId === project.id}
          onClick={() => handleOpen(project)}
          onDelete={can("projects.delete") ? () => handleDelete(project) : undefined}
          onDuplicate={can("projects.create") ? () => handleDuplicate(project) : undefined}
        />
      ))}
    </CollectionWorkspace>
  )
}
