"use client"

import * as React from "react"
import { Trash2Icon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { Field, FieldGroup, FieldLabel } from "@workspace/ui/components/field"
import { Input } from "@workspace/ui/components/input"
import { ListItem } from "@workspace/ui/components/list"
import { Textarea } from "@workspace/ui/components/textarea"
import { cn } from "@workspace/ui/lib/utils"
import { CollectionWorkspace } from "../collection-panel"
import { MultiSelect } from "../multi-select"
import { PermissionMatrix } from "../permission-matrix"
import { useAccess } from "../access-provider"
import { usePaginatedCollection } from "../../hooks/use-paginated-collection"
import {
  invalidateCollectionOptions,
  useCollectionOptionRecords,
  useCollectionOptions,
} from "../../hooks/use-collection-options"
import {
  COLLECTION_CONFIGS,
  SHELL_EVENTS,
  TOOLBAR_ACTION_IDS,
  collectionDetailURL,
  collectionMutationURL,
  type ContentCollectionKey,
  type ContentEditorField,
} from "../../lib/data"

type Item = Record<string, unknown> & { id?: string; key?: string }
const idOf = (item: Item) => item.id || item.key || ""

function EditorControl({
  field,
  value,
  initialValue,
  onChange,
  isSystem,
  record,
}: {
  field: ContentEditorField
  value: unknown
  initialValue: unknown
  onChange: (value: unknown) => void
  isSystem: boolean
  record: Item
}) {
  const options = useCollectionOptions(
    field.optionsCollection,
    field.optionLabelField
  )
  const optionRecords = useCollectionOptionRecords(field.optionsCollection)
  const isReadOnly =
    (field.readOnlyWhenSystem === true && isSystem) ||
    (field.readOnlyWhen !== undefined &&
      Object.entries(field.readOnlyWhen).every(
        ([key, expected]) => record[key] === expected
      ))
  const [draft, setDraft] = React.useState(() =>
    field.control === "json"
      ? JSON.stringify(value, null, 2)
      : String(value ?? "")
  )
  React.useEffect(() => {
    setDraft(
      field.control === "json"
        ? JSON.stringify(value, null, 2)
        : String(value ?? "")
    )
  }, [field.control, value])
  if (field.control === "multiselect") {
    return (
      <MultiSelect
        value={
          Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : []
        }
        options={options}
        placeholder={field.placeholder}
        onChange={onChange}
      />
    )
  }
  if (field.control === "permission-matrix") {
    return (
      <PermissionMatrix
        value={
          Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : []
        }
        initialValue={
          Array.isArray(initialValue)
            ? initialValue.map(Number).filter(Number.isFinite)
            : []
        }
        permissions={optionRecords}
        disabled={isReadOnly}
        onChange={onChange}
      />
    )
  }
  if (field.control === "input" || field.control === "password") {
    return (
      <Input
        type={field.control === "password" ? "password" : "text"}
        disabled={isReadOnly}
        placeholder={field.placeholder}
        value={draft}
        onChange={(event) => {
          setDraft(event.target.value)
          onChange(event.target.value)
        }}
      />
    )
  }
  return (
    <Textarea
      disabled={isReadOnly}
      placeholder={field.placeholder}
      value={draft}
      onChange={(event) => {
        const next = event.target.value
        setDraft(next)
        if (field.control === "json") {
          try {
            onChange(JSON.parse(next))
          } catch {
            return
          }
        } else {
          onChange(next)
        }
      }}
    />
  )
}

export function ContentList({ kind }: { kind: ContentCollectionKey }) {
  const { can } = useAccess()
  const detailRequestId = React.useRef(0)
  const current = COLLECTION_CONFIGS[kind]
  const editor = current.editor!
  const collection = usePaginatedCollection<Item>(kind)
  const refresh = collection.refresh
  const items = collection.items
  const [selected, setSelected] = React.useState<Item | null>(null)
  const [form, setForm] = React.useState<Item>(() => ({
    ...editor.initialValue,
  }))
  const [initialForm, setInitialForm] = React.useState<Item>(() => ({
    ...editor.initialValue,
  }))
  const [isEditorOpen, setIsEditorOpen] = React.useState(false)
  const [editorError, setEditorError] = React.useState<string | null>(null)
  const setEditorActive = React.useCallback((active: boolean) => {
    setIsEditorOpen(active)
    window.dispatchEvent(
      new CustomEvent(SHELL_EVENTS.editorState, { detail: { active } })
    )
  }, [])
  const resetEditor = React.useCallback(() => {
    detailRequestId.current += 1
    setSelected(null)
    setForm({ ...editor.initialValue })
    setInitialForm({ ...editor.initialValue })
    setEditorError(null)
    setEditorActive(false)
  }, [editor.initialValue, setEditorActive])
  const save = React.useCallback(async () => {
    try {
      const id = idOf(selected || {})
      const method = id ? "PUT" : editor.createMethod
      const response = await fetch(collectionMutationURL(kind, id), {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(form),
      })
      if (!response.ok) throw new Error(`Failed to save ${current.label}`)
      invalidateCollectionOptions(kind)
      await refresh()
      resetEditor()
    } catch (reason) {
      setEditorError(
        reason instanceof Error
          ? reason.message
          : `Failed to save ${current.label}`
      )
    }
  }, [
    current.label,
    editor.createMethod,
    form,
    kind,
    refresh,
    resetEditor,
    selected,
  ])
  React.useEffect(() => {
    const onToolbar = (event: Event) => {
      const action = (event as CustomEvent<{ actionId?: string }>).detail
        .actionId
      if (action === TOOLBAR_ACTION_IDS.newContent) {
        detailRequestId.current += 1
        setSelected(null)
        setForm({ ...editor.initialValue })
        setInitialForm({ ...editor.initialValue })
        setEditorError(null)
        setEditorActive(true)
      }
      if (action === TOOLBAR_ACTION_IDS.saveContent) void save()
    }
    window.addEventListener(SHELL_EVENTS.toolbarAction, onToolbar)
    return () =>
      window.removeEventListener(SHELL_EVENTS.toolbarAction, onToolbar)
  }, [editor.initialValue, save, setEditorActive])
  React.useEffect(
    () => () => {
      window.dispatchEvent(
        new CustomEvent(SHELL_EVENTS.editorState, { detail: { active: false } })
      )
    },
    []
  )
  const remove = async (item: Item) => {
    if (!window.confirm(`Delete this ${current.label.toLowerCase()}?`)) return
    const response = await fetch(collectionMutationURL(kind, idOf(item)), {
      method: "DELETE",
    })
    if (!response.ok) {
      setEditorError(`Failed to delete ${current.label}`)
      return
    }
    invalidateCollectionOptions(kind)
    await refresh()
    if (idOf(selected || {}) === idOf(item)) {
      setSelected(null)
      setForm({ ...editor.initialValue })
      setInitialForm({ ...editor.initialValue })
      setEditorActive(false)
    }
  }
  const edit = async (item: Item) => {
    const requestId = detailRequestId.current + 1
    detailRequestId.current = requestId
    setEditorActive(false)
    setEditorError(null)
    try {
      const response = await fetch(collectionDetailURL(kind, idOf(item)), {
        cache: "no-store",
        credentials: "include",
      })
      if (!response.ok) throw new Error(`Failed to load ${current.label}`)
      const detail = (await response.json()) as Item
      if (detailRequestId.current !== requestId) return
      setSelected(detail)
      setForm({ ...detail })
      setInitialForm({ ...detail })
      setEditorActive(true)
    } catch (reason) {
      if (detailRequestId.current !== requestId) return
      setEditorError(
        reason instanceof Error
          ? reason.message
          : `Failed to load ${current.label}`
      )
    }
  }
  const setField = (key: string, value: unknown) =>
    setForm((old) => ({ ...old, [key]: value }))
  return (
    <CollectionWorkspace
      collectionKey={kind}
      collection={collection}
      editorClassName="flex h-full flex-col gap-4 overflow-auto p-6"
      editorError={editorError}
      editor={
        isEditorOpen ? (
          <FieldGroup>
            {editor.fields
              .filter((field) => !field.createOnly || !idOf(selected || {}))
              .map((field) => (
                <Field key={field.key}>
                  {field.label && <FieldLabel>{field.label}</FieldLabel>}
                  <EditorControl
                    field={field}
                    value={form[field.key]}
                    initialValue={initialForm[field.key]}
                    onChange={(value) => setField(field.key, value)}
                    isSystem={form.is_system === true}
                    record={form}
                  />
                </Field>
              ))}
          </FieldGroup>
        ) : undefined
      }
    >
      {items.map((item) => (
        <ListItem
          key={idOf(item)}
          className={cn(
            "flex cursor-pointer items-start gap-2 p-3",
            idOf(selected || {}) === idOf(item) && "bg-muted"
          )}
          onClick={() => void edit(item)}
        >
          <div className="min-w-0 flex-1 truncate font-medium">
            {String(item[editor.listField] || "Untitled")}
          </div>
          {can(`${kind}.delete`) && item.is_system !== true && (
            <Button
              size="icon-sm"
              variant="ghost"
              aria-label="Delete"
              onClick={(event) => {
                event.stopPropagation()
                void remove(item)
              }}
            >
              <Trash2Icon />
            </Button>
          )}
        </ListItem>
      ))}
    </CollectionWorkspace>
  )
}
