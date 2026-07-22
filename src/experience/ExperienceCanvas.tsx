import { useEffect, useRef } from 'react'
import { ExperienceRuntime } from './runtime/ExperienceRuntime'

export type ExperienceCanvasProps = {
  attempt: number
  entered: boolean
  onProgress: (progress: number) => void
  onReady: () => void
  onError: (message: string) => void
}

export function ExperienceCanvas({
  attempt,
  entered,
  onProgress,
  onReady,
  onError,
}: ExperienceCanvasProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<ExperienceRuntime>(null)

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    let active = true
    const runtime = new ExperienceRuntime()

    try {
      runtime.mount(container)
      runtimeRef.current = runtime
      runtime.load('/models/mona/Mona.vrm', onProgress).then(
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
    runtimeRef.current?.setEntered(entered)
  }, [entered])

  return <div ref={containerRef} className="experience-canvas" aria-label="ฉาก Three.js ของ Mona" />
}
