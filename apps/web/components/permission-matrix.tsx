"use client"

import * as React from "react"
import { CheckIcon, CircleIcon } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { Button } from "@workspace/ui/components/button"
import {
  FieldDescription,
  FieldLegend,
  FieldSet,
} from "@workspace/ui/components/field"
import { Frame, FrameHeader } from "@workspace/ui/components/frame"
import { List, ListItem } from "@workspace/ui/components/list"
import { cn } from "@workspace/ui/lib/utils"
import type { CollectionOptionRecord } from "@/hooks/use-collection-options"

interface PermissionMatrixProps {
  value: number[]
  initialValue: number[]
  permissions: CollectionOptionRecord[]
  disabled?: boolean
  onChange: (value: number[]) => void
}

function numericIDs(value: unknown) {
  return Array.isArray(value) ? value.map(Number).filter(Number.isFinite) : []
}

function humanize(value: unknown) {
  return String(value ?? "Other")
    .replaceAll("_", " ")
    .replace(/\b\w/g, (character) => character.toUpperCase())
}

export function PermissionMatrix({
  value,
  initialValue,
  permissions,
  disabled = false,
  onChange,
}: PermissionMatrixProps) {
  const selected = React.useMemo(() => new Set(value), [value])
  const initial = React.useMemo(() => new Set(initialValue), [initialValue])
  const groups = React.useMemo(() => {
    const grouped = new Map<string, CollectionOptionRecord[]>()
    for (const permission of permissions) {
      const moduleName = String(permission.module ?? "other")
      const group = grouped.get(moduleName) ?? []
      group.push(permission)
      grouped.set(moduleName, group)
    }
    return Array.from(grouped.entries())
  }, [permissions])

  const setPermission = (id: number, checked: boolean) => {
    const next = new Set(selected)
    if (checked) next.add(id)
    else next.delete(id)
    onChange(Array.from(next).sort((left, right) => left - right))
  }

  const setGroup = (records: CollectionOptionRecord[], checked: boolean) => {
    const next = new Set(selected)
    for (const permission of records) {
      const id = Number(permission.id)
      if (!Number.isFinite(id)) continue
      if (checked) next.add(id)
      else next.delete(id)
    }
    onChange(Array.from(next).sort((left, right) => left - right))
  }

  return (
    <FieldSet disabled={disabled}>
      <FieldLegend>Permissions</FieldLegend>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <FieldDescription>
          {disabled
            ? "This permission set is managed by the system."
            : "Grant access by module. Changes are applied with Save in the toolbar."}
        </FieldDescription>
        <Badge variant="outline">
          {value.length} of {permissions.length} granted
        </Badge>
      </div>
      <div className="grid gap-3 xl:grid-cols-2">
        {groups.map(([moduleName, records]) => {
          const ids = numericIDs(records.map((permission) => permission.id))
          const selectedCount = ids.filter((id) => selected.has(id)).length
          const allSelected = ids.length > 0 && selectedCount === ids.length
          return (
            <Frame className="rounded-lg" key={moduleName} spacing="sm">
              <FieldSet className="gap-2">
                <FrameHeader>
                  <FieldLegend className="mt-2">{humanize(moduleName)}</FieldLegend>
                  <div className="flex -mt-1.5 items-center justify-between gap-2">
                    <FieldDescription>
                      {selectedCount} of {ids.length} granted
                    </FieldDescription>
                    <Button
                      type="button"
                      variant="outline"
                      isDisabled={disabled || ids.length === 0}
                      onPress={() => setGroup(records, !allSelected)}
                    >
                      {allSelected ? "Clear" : "Select all"}
                    </Button>
                  </div>
                </FrameHeader>
                <List>
                  {records.map((permission) => {
                    const id = Number(permission.id)
                    const isSelected = selected.has(id)
                    const wasSelected = initial.has(id)
                    const change =
                      isSelected && !wasSelected
                        ? "Added"
                        : !isSelected && wasSelected
                          ? "Removed"
                          : null
                    return (
                      <ListItem
                        key={String(permission.id)}
                        className={cn(isSelected && "bg-muted")}
                      >
                        <Button
                          type="button"
                          variant="ghost"
                          className="h-auto w-full justify-start py-3 whitespace-normal"
                          aria-pressed={isSelected}
                          isDisabled={disabled || !Number.isFinite(id)}
                          onPress={() => setPermission(id, !isSelected)}
                        >
                          {isSelected ? (
                            <CheckIcon data-icon="inline-start" />
                          ) : (
                            <CircleIcon data-icon="inline-start" />
                          )}
                          <span className="min-w-0 flex-1 text-left">
                            {humanize(permission.action ?? permission.key)}
                          </span>
                          {change && (
                            <Badge
                              variant={
                                change === "Added" ? "secondary" : "outline"
                              }
                            >
                              {change}
                            </Badge>
                          )}
                        </Button>
                      </ListItem>
                    )
                  })}
                </List>
              </FieldSet>
            </Frame>
          )
        })}
      </div>
    </FieldSet>
  )
}
