import { type ComponentType, useCallback, useEffect, useReducer } from 'react'
import { ExperienceCanvas, type ExperienceCanvasProps } from './ExperienceCanvas'
import { ExperienceOverlay } from './ExperienceOverlay'
import { INITIAL_EXPERIENCE_STATE, reduceExperience } from './experienceMachine'

type Props = {
  CanvasComponent?: ComponentType<ExperienceCanvasProps>
  entryDurationMs?: number
}

export function ExperienceShell({
  CanvasComponent = ExperienceCanvas,
  entryDurationMs = 450,
}: Props) {
  const [state, dispatch] = useReducer(reduceExperience, INITIAL_EXPERIENCE_STATE)
  const onProgress = useCallback((progress: number) => {
    dispatch({ type: 'LOAD_PROGRESS', progress })
  }, [])
  const onReady = useCallback(() => dispatch({ type: 'LOAD_SUCCEEDED' }), [])
  const onError = useCallback((message: string) => {
    dispatch({ type: 'LOAD_FAILED', message })
  }, [])

  useEffect(() => {
    if (state.phase !== 'entering') return
    const timer = window.setTimeout(
      () => dispatch({ type: 'ENTRY_TRANSITION_FINISHED' }),
      entryDurationMs,
    )
    return () => window.clearTimeout(timer)
  }, [entryDurationMs, state.phase])

  return (
    <main className="experience-shell" data-experience-phase={state.phase}>
      <CanvasComponent
        key={state.attempt}
        attempt={state.attempt}
        entered={state.phase === 'entered'}
        onProgress={onProgress}
        onReady={onReady}
        onError={onError}
      />
      <ExperienceOverlay
        state={state}
        onStart={() => dispatch({ type: 'START_REQUESTED' })}
        onRetry={() => dispatch({ type: 'RETRY_REQUESTED' })}
      />
    </main>
  )
}
