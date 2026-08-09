import * as React from "react"
import { cva, type VariantProps } from "class-variance-authority"

import { cn } from "@workspace/ui/lib/utils"

const listVariants = cva(
  "flex w-full items-stretch [&>*]:relative [&>*]:z-0 [&>*:focus-visible]:z-10 [&>*:focus-within]:z-10",
  {
    variants: {
      orientation: {
        horizontal:
          "flex-row [&>*:not(:first-child)]:rounded-l-none [&>*:not(:first-child)]:border-l-0 [&>*:not(:last-child)]:rounded-r-none",
        vertical:
          "flex-col [&>*:not(:first-child)]:rounded-t-none [&>*:not(:first-child)]:border-t-0 [&>*:not(:last-child)]:rounded-b-none",
      },
    },
    defaultVariants: {
      orientation: "vertical",
    },
  }
)

function List({
  className,
  orientation,
  ...props
}: React.ComponentProps<"div"> & VariantProps<typeof listVariants>) {
  return (
    <div
      role="list"
      data-slot="list"
      data-orientation={orientation}
      className={cn(listVariants({ orientation }), className)}
      {...props}
    />
  )
}

function ListItem({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      role="listitem"
      data-slot="list-item"
      className={cn(
        "rounded-md border transition-colors outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 *:data-[slot=button]:rounded-[inherit]",
        className
      )}
      {...props}
    />
  )
}

export { List, ListItem, listVariants }
