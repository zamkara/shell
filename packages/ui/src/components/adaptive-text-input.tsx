"use client"

import * as React from "react"

import { Input } from "@workspace/ui/components/input"
import { Textarea } from "@workspace/ui/components/textarea"

interface AdaptiveTextInputProps {
  name?: string
  value: string
  onChange?: React.ChangeEventHandler<HTMLInputElement | HTMLTextAreaElement>
  placeholder?: string
  className?: string
  required?: boolean
  rows?: number
}

export function AdaptiveTextInput({
  value,
  onChange,
  rows = 3,
  ...props
}: AdaptiveTextInputProps) {
  return value.includes("\n") ? (
    <Textarea
      {...props}
      value={value}
      rows={rows}
      onChange={(event) => onChange?.(event)}
    />
  ) : (
    <Input {...props} value={value} onChange={(event) => onChange?.(event)} />
  )
}
