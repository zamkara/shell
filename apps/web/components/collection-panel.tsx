"use client"

import { useEffect, useState, type ReactNode } from "react"
import { ChevronLeftIcon, ChevronRightIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { FramePanel } from "@workspace/ui/components/frame"
import { Input } from "@workspace/ui/components/input"
import { List } from "@workspace/ui/components/list"
import { Separator } from "@workspace/ui/components/separator"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@workspace/ui/components/empty"
import { Skeleton } from "@workspace/ui/components/skeleton"
import {
  COLLECTION_CONFIGS,
  COLLECTION_DEFAULTS,
  type CollectionKey,
} from "../lib/data"
import type { PaginatedCollection } from "../hooks/use-paginated-collection"

export function CollectionEmptyState({
  collectionKey,
  mode,
  error,
}: {
  collectionKey: CollectionKey
  mode: "list" | "editor" | "error"
  error?: string | null
}) {
  const config = COLLECTION_CONFIGS[collectionKey]
  const Icon = config.icon
  return (
    <Empty>
      <EmptyHeader>
        {mode !== "error" && <Icon aria-hidden />}
        <EmptyTitle>
          {mode === "error"
            ? `Unable to load ${config.label}`
            : mode === "editor"
              ? config.editorEmptyTitle
              : config.emptyTitle}
        </EmptyTitle>
        <EmptyDescription>
          {mode === "error"
            ? error
            : mode === "editor"
              ? config.editorEmptyDescription
              : config.emptyDescription}
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

interface CollectionPanelProps<T> {
  collectionKey: CollectionKey
  collection: PaginatedCollection<T>
  children: ReactNode
  error?: string | null
}

export function CollectionPanel<T>({
  collectionKey,
  collection,
  children,
  error = collection.error,
}: CollectionPanelProps<T>) {
  const config = COLLECTION_CONFIGS[collectionKey]
  const pages = Math.max(1, Math.ceil(collection.total / collection.limit))
  const [limitInput, setLimitInput] = useState(String(collection.limit))
  useEffect(() => setLimitInput(String(collection.limit)), [collection.limit])
  const commitLimit = () => {
    const value = Number(limitInput)
    if (!Number.isFinite(value) || value < 1) {
      setLimitInput(String(collection.limit))
      return
    }
    const next = Math.min(COLLECTION_DEFAULTS.maxLimit, Math.floor(value))
    setLimitInput(String(next))
    collection.setLimit(next)
    collection.setPage(COLLECTION_DEFAULTS.page)
  }
  return (
    <FramePanel className="flex h-full flex-col gap-2 overflow-hidden p-2">
      <Input
        aria-label={`Search ${config.label}`}
        placeholder={config.searchPlaceholder}
        value={collection.search}
        onChange={(event) => {
          collection.setSearch(event.target.value)
          collection.setPage(COLLECTION_DEFAULTS.page)
        }}
      />
      <div className="flex min-h-0 flex-1 flex-col gap-2 overflow-y-auto">
        {collection.loading ? (
          <>
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
            <Skeleton className="h-16 w-full" />
          </>
        ) : error ? (
          <CollectionEmptyState
            collectionKey={collectionKey}
            mode="error"
            error={error}
          />
        ) : collection.items.length === 0 ? (
          <CollectionEmptyState collectionKey={collectionKey} mode="list" />
        ) : (
          <List>{children}</List>
        )}
      </div>
      <Separator />
      <div className="flex items-center justify-between gap-2">
        <Button
          size="icon-sm"
          variant="ghost"
          isDisabled={collection.loading || collection.page <= 1}
          aria-label="Previous page"
          onClick={() => collection.setPage(collection.page - 1)}
        >
          <ChevronLeftIcon />
        </Button>
        <span>
          Page {collection.page} of {pages}
        </span>
        <Button
          size="icon-sm"
          variant="ghost"
          isDisabled={collection.loading || collection.page >= pages}
          aria-label="Next page"
          onClick={() => collection.setPage(collection.page + 1)}
        >
          <ChevronRightIcon />
        </Button>
        <Input
          aria-label="Rows per page"
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          className="w-16 text-center"
          value={limitInput}
          onChange={(event) =>
            setLimitInput(event.target.value.replace(/\D/g, ""))
          }
          onBlur={commitLimit}
          onKeyDown={(event) => {
            if (event.key === "Enter") event.currentTarget.blur()
          }}
        />
      </div>
    </FramePanel>
  )
}

interface CollectionWorkspaceProps<T> extends CollectionPanelProps<T> {
  editor?: ReactNode
  editorError?: string | null
  editorClassName?: string
}

export function CollectionWorkspace<T>({
  editor,
  editorError,
  editorClassName = "flex h-full flex-col overflow-hidden p-0",
  ...panelProps
}: CollectionWorkspaceProps<T>) {
  return (
    <>
      <FramePanel className={editorClassName}>
        {editorError ? (
          <CollectionEmptyState
            collectionKey={panelProps.collectionKey}
            mode="error"
            error={editorError}
          />
        ) : (
          (editor ?? (
            <CollectionEmptyState
              collectionKey={panelProps.collectionKey}
              mode="editor"
            />
          ))
        )}
      </FramePanel>
      <CollectionPanel {...panelProps} />
    </>
  )
}
