"use client"

import * as React from "react"

import { cn } from "@/lib/utils"

export interface PillButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  active?: boolean
}

const PillButton = React.forwardRef<HTMLButtonElement, PillButtonProps>(
  ({ className, active, type = "button", ...props }, ref) => (
    <button
      ref={ref}
      type={type}
      aria-pressed={active}
      className={cn(
        "rounded-sm border px-3 py-1.5 text-xs transition-colors",
        active
          ? "border-accent bg-accent/10 font-semibold text-foreground"
          : "border-border text-muted-foreground hover:border-accent/60",
        className
      )}
      {...props}
    />
  )
)
PillButton.displayName = "PillButton"

export interface PillOption<T extends string> {
  id: T
  label: string
}

export interface PillGroupProps<T extends string> {
  options: PillOption<T>[]
  value: T | null
  onChange: (value: T) => void
  className?: string
  pillClassName?: string
}

function PillGroup<T extends string>({
  options,
  value,
  onChange,
  className,
  pillClassName,
}: PillGroupProps<T>) {
  return (
    <div className={cn("flex flex-wrap gap-2", className)}>
      {options.map((option) => (
        <PillButton
          key={option.id}
          active={value === option.id}
          onClick={() => onChange(option.id)}
          className={pillClassName}
        >
          {option.label}
        </PillButton>
      ))}
    </div>
  )
}

export { PillButton, PillGroup }
