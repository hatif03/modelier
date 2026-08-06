import Link from "next/link"
import * as React from "react"

import { cn } from "@/lib/utils"

export type BreadcrumbItem = {
  label: string
  href?: string
}

type BreadcrumbProps = {
  items: BreadcrumbItem[]
  trailing?: React.ReactNode
  className?: string
}

const crumbClass = "font-serif text-lg tracking-tight text-foreground";

const Breadcrumb = ({ items, trailing, className }: BreadcrumbProps) => (
  <div className={cn("flex items-center gap-2", className)}>
    {items.map((item, index) => (
      <React.Fragment key={`${item.label}-${index}`}>
        {index > 0 && <span className="text-border">/</span>}
        {item.href ? (
          <Link href={item.href} className={cn(crumbClass, "hover:text-accent")}>
            {item.label}
          </Link>
        ) : (
          <span className={crumbClass}>{item.label}</span>
        )}
      </React.Fragment>
    ))}
    {trailing && (
      <>
        <span className="text-border">/</span>
        {trailing}
      </>
    )}
  </div>
)

export { Breadcrumb }
