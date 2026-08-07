import * as React from "react"

import { cn } from "@/lib/utils"
import { Breadcrumb, type BreadcrumbItem } from "@/components/ui/breadcrumb"

type AppHeaderProps = {
  breadcrumb: BreadcrumbItem[]
  trailing?: React.ReactNode
  search?: React.ReactNode
  actions?: React.ReactNode
  dense?: boolean
  className?: string
}

const AppHeader = ({ breadcrumb, trailing, search, actions, dense, className }: AppHeaderProps) => (
  <header
    className={cn(
      "flex items-center justify-between bg-transparent",
      dense ? "px-6 py-3" : "px-8 py-5",
      className
    )}
  >
    <Breadcrumb items={breadcrumb} trailing={trailing} />
    {(search || actions) && (
      <div className="flex items-center gap-3">
        {search}
        {actions}
      </div>
    )}
  </header>
)

export { AppHeader }
