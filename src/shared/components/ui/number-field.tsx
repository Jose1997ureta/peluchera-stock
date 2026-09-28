import * as React from "react"
import { NumberField as NumberFieldPrimitive } from "@base-ui/react/number-field"
import { ChevronDown, ChevronUp } from "lucide-react"

import { cn } from "@/shared/utils/cn"

function NumberField({
  className,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Root>) {
  return (
    <NumberFieldPrimitive.Root
      data-slot="number-field"
      className={cn("w-full", className)}
      {...props}
    />
  )
}

function NumberFieldGroup({
  className,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Group>) {
  return (
    <NumberFieldPrimitive.Group
      data-slot="number-field-group"
      className={cn(
        "flex h-8 w-full min-w-0 items-stretch overflow-hidden rounded-lg border border-input bg-transparent transition-colors focus-within:border-ring focus-within:ring-3 focus-within:ring-ring/50 has-aria-invalid:border-destructive has-aria-invalid:ring-3 has-aria-invalid:ring-destructive/20 data-disabled:pointer-events-none data-disabled:cursor-not-allowed data-disabled:opacity-50 dark:bg-input/30 dark:has-aria-invalid:border-destructive/50 dark:has-aria-invalid:ring-destructive/40",
        className
      )}
      {...props}
    />
  )
}

function NumberFieldInput({
  className,
  ...props
}: React.ComponentProps<typeof NumberFieldPrimitive.Input>) {
  return (
    <NumberFieldPrimitive.Input
      data-slot="number-field-input"
      className={cn(
        "w-full min-w-0 bg-transparent px-2.5 py-1 text-base tabular-nums outline-none placeholder:text-muted-foreground md:text-sm",
        className
      )}
      {...props}
    />
  )
}

const stepButtonClassName =
  "flex flex-1 items-center justify-center text-muted-foreground transition-colors outline-none hover:bg-muted hover:text-foreground focus-visible:bg-muted disabled:pointer-events-none disabled:opacity-40"

function NumberFieldArrows({ className }: { className?: string }) {
  return (
    <div
      data-slot="number-field-arrows"
      className={cn("flex w-6 shrink-0 flex-col border-l border-input", className)}
    >
      <NumberFieldPrimitive.Increment
        aria-label="Aumentar"
        className={cn(stepButtonClassName, "border-b border-input")}
      >
        <ChevronUp className="size-3" />
      </NumberFieldPrimitive.Increment>
      <NumberFieldPrimitive.Decrement
        aria-label="Disminuir"
        className={stepButtonClassName}
      >
        <ChevronDown className="size-3" />
      </NumberFieldPrimitive.Decrement>
    </div>
  )
}

export { NumberField, NumberFieldGroup, NumberFieldInput, NumberFieldArrows }
