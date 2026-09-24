'use client'

import * as React from 'react'
import { ImagePlus, Music, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

export function FileField({
  label,
  accept,
  kind,
  file,
  onChange,
  currentUrl,
  hint,
  required,
  disabled,
}: {
  label: string
  accept: string
  kind: 'audio' | 'image'
  file: File | null
  onChange: (file: File | null) => void
  currentUrl?: string | null
  hint?: string
  required?: boolean
  disabled?: boolean
}) {
  const inputRef = React.useRef<HTMLInputElement>(null)
  const [preview, setPreview] = React.useState<string | null>(null)

  React.useEffect(() => {
    if (!file || kind !== 'image') {
      setPreview(null)
      return
    }
    const url = URL.createObjectURL(file)
    setPreview(url)
    return () => URL.revokeObjectURL(url)
  }, [file, kind])

  const shown = preview ?? (kind === 'image' ? (currentUrl ?? null) : null)

  return (
    <div className="space-y-2">
      <span className="block text-sm font-medium leading-none">
        {label}
        {required && <span className="text-destructive"> *</span>}
      </span>
      <div className={cn('flex items-center gap-3 rounded-2xl border border-dashed border-input p-3', disabled && 'opacity-60')}>
        <div className="grid h-14 w-14 shrink-0 place-items-center overflow-hidden rounded-xl bg-muted">
          {kind === 'image' ? (
            shown ? (
              <img src={shown} alt="" className="h-full w-full object-cover" />
            ) : (
              <ImagePlus className="h-6 w-6 text-muted-foreground" />
            )
          ) : (
            <Music className="h-6 w-6 text-muted-foreground" />
          )}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-sm">
            {file ? file.name : currentUrl ? 'Current file is kept unless you pick a new one' : 'No file selected'}
          </p>
          {hint && <p className="text-xs text-muted-foreground">{hint}</p>}
        </div>
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          className="sr-only"
          tabIndex={-1}
          disabled={disabled}
          onChange={(e) => onChange(e.target.files?.[0] ?? null)}
        />
        <Button type="button" variant="secondary" size="sm" disabled={disabled} onClick={() => inputRef.current?.click()}>
          Choose
        </Button>
        {file && (
          <button
            type="button"
            aria-label="Clear selected file"
            disabled={disabled}
            onClick={() => {
              onChange(null)
              if (inputRef.current) inputRef.current.value = ''
            }}
            className="grid h-9 w-9 place-items-center rounded-full text-muted-foreground hover:bg-accent hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>
    </div>
  )
}
