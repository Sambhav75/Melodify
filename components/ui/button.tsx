import * as React from 'react'
import { Slot } from '@radix-ui/react-slot'
import { cva, type VariantProps } from 'class-variance-authority'
import { cn } from '@/lib/utils'

export const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-full text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background disabled:pointer-events-none disabled:opacity-50 active:scale-[0.97] [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        default: 'bg-brand-gradient text-primary-foreground shadow-lg shadow-primary/20 hover:brightness-110',
        secondary: 'bg-secondary text-secondary-foreground hover:bg-accent',
        outline: 'border border-input bg-transparent hover:bg-accent/60',
        ghost: 'hover:bg-accent/70 hover:text-accent-foreground',
        destructive: 'bg-destructive text-destructive-foreground hover:bg-destructive/90',
        link: 'rounded-md text-primary underline-offset-4 hover:underline',
      },
      size: {
        default: 'h-11 px-6',
        sm: 'h-9 px-4 text-[13px]',
        lg: 'h-12 px-8 text-base',
        icon: 'h-11 w-11',
        'icon-sm': 'h-9 w-9',
      },
    },
    defaultVariants: {
      variant: 'default',
      size: 'default',
    },
  },
)

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonVariants> {
  asChild?: boolean
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, type, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button'
    // default to type="button" so buttons never submit a form by accident
    const typeProps = asChild ? {} : { type: type ?? 'button' }
    return <Comp ref={ref} className={cn(buttonVariants({ variant, size }), className)} {...typeProps} {...props} />
  },
)
Button.displayName = 'Button'
