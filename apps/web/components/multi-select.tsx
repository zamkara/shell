"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "@workspace/ui/components/button"
import { DropdownMenu, DropdownMenuItem, DropdownMenuTrigger } from "@workspace/ui/components/dropdown-menu"

export interface MultiSelectOption { id: string | number; label: string }

export function MultiSelect({ value, options, placeholder, onChange }: {
  value: number[]
  options: MultiSelectOption[]
  placeholder: string
  onChange: (value: number[]) => void
}) {
  const selected = new Set(value.map(String))
  return (
    <DropdownMenuTrigger>
      <Button variant="outline" className="w-full justify-between">
        {value.length ? `${value.length} selected` : placeholder}
        <ChevronDownIcon data-icon="inline-end" />
      </Button>
      <DropdownMenu
        selectionMode="multiple"
        selectedKeys={selected}
        onSelectionChange={(keys) => onChange(Array.from(keys).map(Number).filter(Number.isFinite))}
      >
        {options.map((option) => (
          <DropdownMenuItem id={String(option.id)} key={option.id}>{option.label}</DropdownMenuItem>
        ))}
      </DropdownMenu>
    </DropdownMenuTrigger>
  )
}
