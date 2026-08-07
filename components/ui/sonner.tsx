"use client"

import { Toaster as Sonner } from "sonner"

type ToasterProps = React.ComponentProps<typeof Sonner>

const Toaster = ({ ...props }: ToasterProps) => (
  <Sonner
    theme="light"
    className="toaster group"
    position="bottom-right"
    toastOptions={{
      classNames: {
        toast:
          "group toast rounded-lg border border-border bg-popover text-popover-foreground shadow-popover",
        description: "text-muted-foreground",
        actionButton: "bg-primary text-primary-foreground rounded-pill",
        cancelButton: "bg-muted text-muted-foreground rounded-pill",
        success: "!text-success",
        error: "!text-destructive",
      },
    }}
    {...props}
  />
)

export { Toaster }
