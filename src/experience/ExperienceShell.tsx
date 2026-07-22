import { type ComponentType, useCallback, useReducer } from 'react'
import { ExperienceCanvas, type ExperienceCanvasProps } from './ExperienceCanvas'
import { ExperienceOverlay } from './ExperienceOverlay'
import { INITIAL_EXPERIENCE_STATE, reduceExperience } from './experienceMachine'

type Props = {
  CanvasComponent?: ComponentType<ExperienceCanvasProps>
}

export function ExperienceShell({ CanvasComponent = ExperienceCanvas }: Props) {
  const [state, dispatch] = useReducer(reduceExperience, INITIAL_EXPERIENCE_STATE)
  const onProgress = useCallback((progress: number) => {
    dispatch({ type: 'LOAD_PROGRESS', progress })
  }, [])
  const onReady = useCallback(() => dispatch({ type: 'SCENE_READY' }), [])
  const onEntryComplete = useCallback(
    () => dispatch({ type: 'ENTRY_MOTION_FINISHED' }),
    [],
  )
  const onError = useCallback((message: string) => {
    dispatch({ type: 'LOAD_FAILED', message })
  }, [])

  return (
    <main className="experience-shell" data-experience-phase={state.phase}>
      <CanvasComponent
        key={state.attempt}
        attempt={state.attempt}
        entryActive={state.phase === 'approaching'}
        onProgress={onProgress}
        onReady={onReady}
        onEntryComplete={onEntryComplete}
        onError={onError}
      />
      <ExperienceOverlay
        state={state}
        onStart={() => dispatch({ type: 'START_REQUESTED' })}
        onRetry={() => dispatch({ type: 'RETRY_REQUESTED' })}
        onRevealFinished={() => dispatch({ type: 'LOADER_REVEAL_FINISHED' })}
        onContentRevealFinished={() => dispatch({ type: 'CONTENT_REVEAL_FINISHED' })}
      />
    </main>
  )
}
