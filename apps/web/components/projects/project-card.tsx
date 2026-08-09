import * as React from "react"
import { CopyIcon, EllipsisIcon, TrashIcon } from "lucide-react"

import { Button } from "@workspace/ui/components/button"
import {
  DropdownMenu,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@workspace/ui/components/dropdown-menu"
import {
  FrameDescription,
  FrameFooter,
  FrameHeader,
  FrameTitle,
} from "@workspace/ui/components/frame"
import { ListItem } from "@workspace/ui/components/list"
import { cn } from "@workspace/ui/lib/utils"

import { ProjectSummary } from "./project.types"

interface ProjectCardProps {
  project: ProjectSummary
  isSelected?: boolean
  isDeleting?: boolean
  isDuplicating?: boolean
  onClick?: () => void
  onDelete?: () => void
  onDuplicate?: () => void
}

export function ProjectCard({
  project,
  isSelected,
  isDeleting,
  isDuplicating,
  onClick,
  onDelete,
  onDuplicate,
}: ProjectCardProps) {
  return (
    <ListItem
      onClick={onClick}
      className={cn(
        "flex cursor-pointer flex-col gap-1 p-3 shadow-none",
        isSelected && "bg-muted"
      )}
    >
      <FrameHeader className="flex-row items-center gap-2 p-0 shadow-none">
        <FrameTitle className="min-w-0 flex-1 truncate">
          {project.title || "Untitled Project"}
        </FrameTitle>
        {(onDuplicate || onDelete) && <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenuTrigger>
            <Button
              aria-label={`Actions for ${project.title || "Untitled Project"}`}
              size="icon-sm"
              variant="ghost"
            >
              <EllipsisIcon />
            </Button>
            <DropdownMenu placement="bottom end">
              <DropdownMenuGroup>
                {onDuplicate && <DropdownMenuItem
                  isDisabled={isDuplicating}
                  onAction={onDuplicate}
                >
                  <CopyIcon />
                  {isDuplicating ? "Duplicating..." : "Duplicate"}
                </DropdownMenuItem>}
                {onDelete && <DropdownMenuItem
                  isDisabled={isDeleting}
                  onAction={onDelete}
                  variant="destructive"
                >
                  <TrashIcon />
                  {isDeleting ? "Deleting..." : "Delete"}
                </DropdownMenuItem>}
              </DropdownMenuGroup>
            </DropdownMenu>
          </DropdownMenuTrigger>
        </div>}
      </FrameHeader>
      <FrameFooter className="p-0">
        {project.tagline && (
          <FrameDescription className="line-clamp-1 text-start text-muted-foreground">
            {project.tagline}
          </FrameDescription>
        )}
      </FrameFooter>
    </ListItem>
  )
}
