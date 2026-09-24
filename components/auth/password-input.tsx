'use client'

import * as React from 'react'
import { Eye, EyeOff } from 'lucide-react'
import { Input } from '@/components/ui/input'

export const PasswordInput = React.forwardRef<HTMLInputElement, Omit<React.ComponentPropsWithoutRef<'input'>, 'type'>>(
  (props, ref) => {
    const [visible, setVisible] = React.useState(false)
    return (
      <div className="relative">
        <Input ref={ref} type={visible ? 'text' : 'password'} className="pr-12" {...props} />
        <button
          type="button"
          onClick={() => setVisible((v) => !v)}
          aria-label={visible ? 'Hide password' : 'Show password'}
          aria-pressed={visible}
          className="absolute right-1 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full text-muted-foreground hover:text-foreground"
        >
          {visible ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
        </button>
      </div>
    )
  },
)
PasswordInput.displayName = 'PasswordInput'
