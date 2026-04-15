'use client'

import { useRef, useEffect, useCallback } from 'react'
import type { EntropyPoint } from '@/types/aegis-types'

const WINDOW_MS = 500

/**
 * useEntropyCollector
 *
 * Captures hardware-level mouse/touch trajectory data in a rolling 500ms window.
 * Buffer lives in useRef — zero re-renders on every pointer event.
 * All event listeners are removed on unmount (no memory leaks).
 */
export function useEntropyCollector() {
  // useRef keeps the buffer off React's render cycle entirely
  const bufferRef = useRef<EntropyPoint[]>([])

  const appendPoint = useCallback((x: number, y: number) => {
    const t = Date.now()
    bufferRef.current.push({ x, y, t })

    // Prune entries outside the 500ms rolling window
    const cutoff = t - WINDOW_MS
    bufferRef.current = bufferRef.current.filter(p => p.t >= cutoff)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => appendPoint(e.clientX, e.clientY)
    const onTouchMove = (e: TouchEvent) => {
      const touch = e.touches[0]
      if (touch) appendPoint(touch.clientX, touch.clientY)
    }

    document.addEventListener('mousemove', onMouseMove, { passive: true })
    document.addEventListener('touchmove', onTouchMove, { passive: true })

    // Cleanup — critical for RAM: removes listeners when component unmounts
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('touchmove', onTouchMove)
    }
  }, [appendPoint])

  /** Returns a snapshot of the current rolling-window buffer */
  const getBuffer = useCallback((): readonly EntropyPoint[] => {
    const now = Date.now()
    const cutoff = now - WINDOW_MS
    // Re-prune on read to guarantee invariant even if no new events fired
    bufferRef.current = bufferRef.current.filter(p => p.t >= cutoff)
    return [...bufferRef.current]
  }, [])

  /** Empties the buffer */
  const clearBuffer = useCallback(() => {
    bufferRef.current = []
  }, [])

  return { getBuffer, clearBuffer }
}
