'use client'

import * as React from 'react'

/** Rendered on the client so the greeting follows the visitor's local time. */
export function Greeting({ name }: { name: string }) {
  const [text, setText] = React.useState('Welcome back')

  React.useEffect(() => {
    const hour = new Date().getHours()
    setText(hour < 5 ? 'Burning the midnight oil' : hour < 12 ? 'Good morning' : hour < 18 ? 'Good afternoon' : 'Good evening')
  }, [])

  return (
    <h1 className="line-clamp-2 break-words font-display text-2xl font-bold md:text-3xl">
      {text}, {name}
    </h1>
  )
}
