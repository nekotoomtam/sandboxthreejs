import { forwardRef, useEffect, useImperativeHandle, useRef } from 'react'
import type { SandboxSceneDefinition, SandboxSnapshot, TransformPatch } from './sandbox.types'
import { SandboxRuntime } from './runtime/SandboxRuntime'

export type SandboxCanvasHandle = {
  reset: () => void
  getSnapshot: () => SandboxSnapshot | undefined
  applySnapshot: (snapshot: SandboxSnapshot) => void
  updateObjectTransform: (objectId: string, patch: TransformPatch) => void
}

type SandboxCanvasProps = {
  definition: SandboxSceneDefinition
  onSnapshot?: (snapshot: SandboxSnapshot) => void
  className?: string
}

export const SandboxCanvas = forwardRef<SandboxCanvasHandle, SandboxCanvasProps>(
  function SandboxCanvas({ definition, onSnapshot, className = 'min-h-[380px]' }, ref) {
    const containerRef = useRef<HTMLDivElement>(null)
    const runtimeRef = useRef<SandboxRuntime>(null)
    const snapshotHandlerRef = useRef(onSnapshot)
    snapshotHandlerRef.current = onSnapshot

    useImperativeHandle(
      ref,
      () => ({
        reset: () => runtimeRef.current?.reset(),
        getSnapshot: () => runtimeRef.current?.getSnapshot(),
        applySnapshot: (snapshot) => runtimeRef.current?.applySnapshot(snapshot),
        updateObjectTransform: (objectId, patch) =>
          runtimeRef.current?.updateObjectTransform(objectId, patch),
      }),
      [],
    )

    useEffect(() => {
      const container = containerRef.current
      if (!container) return

      const runtime = new SandboxRuntime(definition).create()
      const unsubscribe = runtime.subscribe((snapshot) =>
        snapshotHandlerRef.current?.(snapshot),
      )
      runtimeRef.current = runtime
      runtime.mount(container)

      return () => {
        unsubscribe()
        runtime.dispose()
        runtimeRef.current = null
      }
    }, [definition])

    return (
      <div
        ref={containerRef}
        className={`sandbox-canvas ${className}`}
        aria-label="พื้นที่แสดงผล Three.js"
      />
    )
  },
)
