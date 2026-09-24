'use client'

import { useRef, useState } from 'react'
import type { DragEvent } from 'react'

/**
 * Tiny HTML5 drag-and-drop helper for re-ordering list rows.
 * Spread `getRowProps(index)` on each row and handle `onMove(from, to)`.
 * (Touch devices use the "Move up / Move down" menu items instead.)
 */
export function useDragSort(onMove: (from: number, to: number) => void) {
  const dragIndex = useRef<number | null>(null)
  const [overIndex, setOverIndex] = useState<number | null>(null)

  const getRowProps = (index: number) => ({
    draggable: true as const,
    onDragStart: (e: DragEvent<HTMLElement>) => {
      dragIndex.current = index
      e.dataTransfer.effectAllowed = 'move'
      e.dataTransfer.setData('text/plain', String(index)) // required by Firefox
    },
    onDragOver: (e: DragEvent<HTMLElement>) => {
      if (dragIndex.current === null) return
      e.preventDefault()
      e.dataTransfer.dropEffect = 'move'
      if (overIndex !== index) setOverIndex(index)
    },
    onDrop: (e: DragEvent<HTMLElement>) => {
      e.preventDefault()
      const from = dragIndex.current
      dragIndex.current = null
      setOverIndex(null)
      if (from !== null && from !== index) onMove(from, index)
    },
    onDragEnd: () => {
      dragIndex.current = null
      setOverIndex(null)
    },
  })

  return { getRowProps, overIndex }
}
