"use client"

import * as React from "react"
import { ChevronDownIcon } from "lucide-react"
import { usePathname } from "next/navigation"
import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
} from "@workspace/ui/components/breadcrumb"
import { Button } from "@workspace/ui/components/button"
import { ButtonGroup } from "@workspace/ui/components/button-group"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import { PAGE_CONFIGS, SHELL_EVENTS, TOOLBAR_ACTION_IDS } from "@/lib/data"
import { useAccess } from "./access-provider"

export function Toolbar() {
  const pathname = usePathname()
  const { can } = useAccess()
  const [isEditorActive, setIsEditorActive] = React.useState(false)
  const [editorStatus, setEditorStatus] = React.useState<string | null>(null)
  const config = PAGE_CONFIGS[pathname] || PAGE_CONFIGS["/shell"]

  React.useEffect(() => {
    const handleEditorState = (event: Event) => {
      const customEvent = event as CustomEvent<{
        active?: boolean
        status?: string
      }>
      setIsEditorActive(customEvent.detail.active === true)
      setEditorStatus(customEvent.detail.status ?? null)
    }

    window.addEventListener(SHELL_EVENTS.editorState, handleEditorState)
    return () => {
      window.removeEventListener(SHELL_EVENTS.editorState, handleEditorState)
    }
  }, [])

  if (!config) return null

  const actions = config.actions.filter(
    (action) => can(action.permission) && (!action.requiresEditor || isEditorActive)
  )

  const handleAction = (actionId: string, value?: string) => {
    if (actionId === TOOLBAR_ACTION_IDS.setStatus && value) {
      setEditorStatus(value)
    }

    window.dispatchEvent(
      new CustomEvent(SHELL_EVENTS.toolbarAction, {
        detail: { actionId, value },
      })
    )
  }

  return (
    <ButtonGroup>
      {actions.map((action) => {
        const Icon = action.icon
        const selectedOption = action.options?.find(
          (option) => option.value === editorStatus
        )
        const actionLabel =
          action.id === TOOLBAR_ACTION_IDS.setStatus && selectedOption
            ? selectedOption.label
            : action.label

        if (action.options?.length) {
          return (
            <DropdownMenuTrigger key={action.id}>
              <Button variant="outline" size="sm">
                <Icon data-icon="inline-start" />
                {actionLabel}
                <ChevronDownIcon data-icon="inline-end" />
              </Button>
              <DropdownMenu placement="bottom end">
                <DropdownMenuGroup>
                  {action.options.map((option) => (
                    <DropdownMenuItem
                      key={option.value}
                      onAction={() => handleAction(action.id, option.value)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuGroup>
              </DropdownMenu>
            </DropdownMenuTrigger>
          )
        }

        return (
          <Button
            key={action.id}
            variant="outline"
            onPress={() => handleAction(action.id)}
            size="sm"
          >
            <Icon data-icon="inline-start" />
            {action.label}
          </Button>
        )
      })}
    </ButtonGroup>
  )
}

export function PageHeader() {
  const pathname = usePathname()
  const config = PAGE_CONFIGS[pathname]

  if (!config) return null

  return (
    <div className="flex-1">
      <Breadcrumb className="hidden md:block">
        <BreadcrumbList>
          <BreadcrumbItem>
            <BreadcrumbLink href="#">Dashboard</BreadcrumbLink>
          </BreadcrumbItem>
          <BreadcrumbItem>
            <BreadcrumbPage>{config.title}</BreadcrumbPage>
          </BreadcrumbItem>
        </BreadcrumbList>
      </Breadcrumb>
    </div>
  )
}
