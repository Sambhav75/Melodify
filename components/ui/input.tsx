import * as React from 'react'
import { cn } from '@/lib/utils'

export const inputClasses =
  'flex h-11 w-full rounded-xl border border-input bg-background/60 px-4 text-base placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50 md:text-sm'

export const Input = React.forwardRef<HTMLInputElement, React.ComponentPropsWithoutRef<'input'>>(
  ({ className, type, ...props }, ref) => (
    <input type={type} ref={ref} className={cn(inputClasses, className)} {...props} />
  ),
)
Input.displayName = 'Input'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.ComponentPropsWithoutRef<'textarea'>>(
  ({ className, ...props }, ref) => (
    <textarea ref={ref} className={cn(inputClasses, 'min-h-[92px] resize-y py-3', className)} {...props} />
  ),
)
Textarea.displayName = 'Textarea'

export const Select = React.forwardRef<HTMLSelectElement, React.ComponentPropsWithoutRef<'select'>>(
  ({ className, children, ...props }, ref) => (
    <select ref={ref} className={cn(inputClasses, 'select-arrow appearance-none pr-10', className)} {...props}>
      {children}
    </select>
  ),
)
Select.displayName = 'Select'
