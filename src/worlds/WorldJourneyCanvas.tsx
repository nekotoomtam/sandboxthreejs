import { useEffect, useLayoutEffect, useRef } from 'react'
import { worldCatalog } from './world.registry'
import { WorldJourneyRuntime } from './runtime/WorldJourneyRuntime'

type Props = {
  worldId: string
  onReady?: () => void
  revealInitial?: boolean
}

export function WorldJourneyCanvas({ worldId, onReady, revealInitial = false }: Props) {
  const containerRef = useRef<HTMLDivElement>(null)
  const runtimeRef = useRef<WorldJourneyRuntime>(null)
  const onReadyRef = useRef(onReady)
  const initialRevealRequestedRef = useRef(false)
  onReadyRef.current = onReady
  const initialIndexRef = useRef(
    Math.max(0, worldCatalog.findIndex((world) => world.id === worldId)),
  )

  useEffect(() => {
    const container = containerRef.current
    if (!container) return
    const runtime = new WorldJourneyRuntime().mount(
      container,
      initialIndexRef.current,
      () => onReadyRef.current?.(),
    )
    runtimeRef.current = runtime
    return () => {
      runtime.dispose()
      runtimeRef.current = null
    }
  }, [])

  useEffect(() => {
    const index = worldCatalog.findIndex((world) => world.id === worldId)
    if (index < 0) return
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    runtimeRef.current?.travelTo(index, reducedMotion)
  }, [worldId])

  useLayoutEffect(() => {
    if (!revealInitial || initialRevealRequestedRef.current) return
    initialRevealRequestedRef.current = true
    const reducedMotion =
      window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false
    runtimeRef.current?.revealInitial(initialIndexRef.current, reducedMotion)
  }, [revealInitial])

  return (
    <div
      ref={containerRef}
      className="world-journey__canvas"
      aria-label="ฉากดาวบทเรียน Three.js"
    />
  )
}
