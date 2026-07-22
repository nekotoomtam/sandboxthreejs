import { useEffect, useRef } from 'react'
import { ExperienceRuntime } from './runtime/ExperienceRuntime'

export type ExperienceCanvasProps = {
  attempt: number
  entryActive: boolean
  onProgress: (progress: number) => void
  onReady: () => void
  onEntryComplete: () => void
  onError: (message: string) => void
}

export function ExperienceCanvas({
  attempt,
  entryActive,
  onProgress,
  onReady,
  onEntryComplete,
  onError,
}: ExperienceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<ExperienceRuntime>(null)
  const entryRequestedRef = useRef(false)
  const onEntryCompleteRef = useRef(onEntryComplete)
  onEntryCompleteRef.current = onEntryComplete

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let active = true
    const runtime = new ExperienceRuntime()
    entryRequestedRef.current = false

    try {
      runtime.mount(container)
      runtimeRef.current = runtime
      runtime.load('/models/mona/Mona.vrm', (progress) => {
        if (active) onProgress(progress)
      }).then(
        () => {
          if (active) onReady()
        },
        (error: unknown) => {
          if (active) onError(error instanceof Error ? error.message : 'โหลด Mona ไม่สำเร็จ')
        },
      )
    } catch (error: unknown) {
      runtime.dispose()
      onError(error instanceof Error ? error.message : 'ไม่สามารถเริ่มฉาก Three.js ได้')
    }

    return () => {
      active = false
      runtime.dispose()
      runtimeRef.current = null
    }
  }, [attempt, onError, onProgress, onReady])

  useEffect(() => {
    if (!entryActive || entryRequestedRef.current) return
    const runtime = runtimeRef.current
    if (!runtime) return

    entryRequestedRef.current = true
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    runtime.playEntry(() => onEntryCompleteRef.current(), reducedMotion)
  }, [attempt, entryActive])

  return <div ref={containerRef} className="experience-canvas" aria-label="ฉาก Three.js ของ Mona" />
}
