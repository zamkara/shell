"use client"

import * as React from "react"
import { Trash2 } from "lucide-react"
import { Input } from "@workspace/ui/components/input"
import { AdaptiveTextInput } from "@workspace/ui/components/adaptive-text-input"
import { Button } from "@workspace/ui/components/button"
import { cn } from "@workspace/ui/lib/utils"

export interface KeyValueInputProps {
  value?: Record<string, string>
  onChange: (value: Record<string, string>) => void
  keyPlaceholder?: string
  valuePlaceholder?: string
  actionId?: string
  eventName?: string
  className?: string
}

interface Pair {
  id: string
  key: string
  val: string
}

export function KeyValueInput({
  value = {},
  onChange,
  keyPlaceholder = "Key",
  valuePlaceholder = "Value",
  actionId,
  eventName,
  className,
}: KeyValueInputProps) {
  // Convert Record<string, string> to internal state array
  const [pairs, setPairs] = React.useState<Pair[]>(() =>
    Object.entries(value).map(([k, v]) => ({
      id: Math.random().toString(36).substring(2, 9),
      key: k,
      val: v,
    }))
  )

  // Sync state if controlled value prop changes externally
  React.useEffect(() => {
    setPairs((prevPairs) => {
      const recordFromPairs = prevPairs.reduce(
        (acc, p) => {
          if (p.key.trim()) acc[p.key.trim()] = p.val
          return acc
        },
        {} as Record<string, string>
      )

      if (JSON.stringify(recordFromPairs) !== JSON.stringify(value)) {
        return Object.entries(value).map(([k, v]) => ({
          id: Math.random().toString(36).substring(2, 9),
          key: k,
          val: v,
        }))
      }
      return prevPairs
    })
  }, [value])

  const notifyChange = (updatedPairs: Pair[]) => {
    const record = updatedPairs.reduce(
      (acc, p) => {
        if (p.key.trim()) {
          acc[p.key.trim()] = p.val
        }
        return acc
      },
      {} as Record<string, string>
    )
    onChange(record)
  }

  const handleKeyChange = (id: string, newKey: string) => {
    const next = pairs.map((p) => (p.id === id ? { ...p, key: newKey } : p))
    setPairs(next)
    notifyChange(next)
  }

  const handleValChange = (id: string, newVal: string) => {
    const next = pairs.map((p) => (p.id === id ? { ...p, val: newVal } : p))
    setPairs(next)
    notifyChange(next)
  }

  const handleAdd = React.useCallback(() => {
    const newPair: Pair = {
      id: Math.random().toString(36).substring(2, 9),
      key: "",
      val: "",
    }
    setPairs((prev) => {
      const next = [...prev, newPair]
      notifyChange(next)
      return next
    })
  }, [])

  React.useEffect(() => {
    if (!actionId || !eventName) return
    const handleToolbarAction = (e: Event) => {
      const customEvent = e as CustomEvent
      if (customEvent.detail.actionId === actionId) {
        handleAdd()
      }
    }
    window.addEventListener(eventName, handleToolbarAction)
    return () => window.removeEventListener(eventName, handleToolbarAction)
  }, [actionId, eventName, handleAdd])

  const handleRemove = (id: string) => {
    const next = pairs.filter((p) => p.id !== id)
    setPairs(next)
    notifyChange(next)
  }

  return (
    <div className={cn("space-y-2", className)}>
      {pairs.map((pair) => (
        <div key={pair.id} className="flex items-center gap-2">
          <Input
            value={pair.key}
            onChange={(e) => handleKeyChange(pair.id, e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1"
          />
          <AdaptiveTextInput
            value={pair.val}
            onChange={(e) => handleValChange(pair.id, e.target.value)}
            placeholder={valuePlaceholder}
            className="min-h-9 flex-1"
          />
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => handleRemove(pair.id)}
            className="h-9 w-9 shrink-0 p-0 text-muted-foreground hover:text-destructive"
          >
            <Trash2 className="size-4" />
          </Button>
        </div>
      ))}
    </div>
  )
}
