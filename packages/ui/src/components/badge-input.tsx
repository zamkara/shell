"use client"

import * as React from "react"
import { X } from "lucide-react"
import { Badge } from "@workspace/ui/components/badge"
import { cn } from "@workspace/ui/lib/utils"

export interface BadgeInputProps {
  value: string[]
  onChange: (value: string[]) => void
  placeholder?: string
  className?: string
}

export function BadgeInput({
  value = [],
  onChange,
  placeholder = "Type and press Enter...",
  className,
}: BadgeInputProps) {
  const [inputValue, setInputValue] = React.useState("")
  const inputRef = React.useRef<HTMLInputElement>(null)

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" || e.key === ",") {
      e.preventDefault()
      const trimmed = inputValue.trim()
      if (trimmed && !value.includes(trimmed)) {
        onChange([...value, trimmed])
        setInputValue("")
      }
    } else if (e.key === "Backspace" && !inputValue && value.length > 0) {
      e.preventDefault()
      onChange(value.slice(0, -1))
    }
  }

  const handleRemove = (itemToRemove: string) => {
    onChange(value.filter((item) => item !== itemToRemove))
  }

  return (
    <div
      onClick={() => inputRef.current?.focus()}
      className={cn(
        "flex min-h-10 w-full cursor-text flex-wrap items-center gap-1.5 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-within:ring-2 focus-within:ring-ring focus-within:ring-offset-2",
        className
      )}
    >
      {value.map((item) => (
        <Badge key={item} variant="secondary" className="gap-1 pr-1 text-xs">
          <span>{item}</span>
          <button
            type="button"
            onClick={(e) => {
              e.stopPropagation()
              handleRemove(item)
            }}
            className="rounded-full p-0.5 hover:bg-muted focus:outline-none"
          >
            <X className="size-3" />
          </button>
        </Badge>
      ))}
      <input
        ref={inputRef}
        type="text"
        value={inputValue}
        onChange={(e) => setInputValue(e.target.value)}
        onKeyDown={handleKeyDown}
        placeholder={value.length === 0 ? placeholder : ""}
        className="min-w-28 flex-1 bg-transparent text-sm outline-none placeholder:text-muted-foreground"
      />
    </div>
  )
}
