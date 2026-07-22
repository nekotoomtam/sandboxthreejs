export type ExperiencePhase =
  | 'loading'
  | 'revealing'
  | 'ready'
  | 'approaching'
  | 'revealing-content'
  | 'entered'
  | 'error'

export type ExperienceState = {
  phase: ExperiencePhase
  progress: number
  attempt: number
  errorMessage?: string
}

export type ExperienceEvent =
  | { type: 'LOAD_PROGRESS'; progress: number }
  | { type: 'SCENE_READY' }
  | { type: 'LOAD_FAILED'; message: string }
  | { type: 'LOADER_REVEAL_FINISHED' }
  | { type: 'START_REQUESTED' }
  | { type: 'ENTRY_MOTION_FINISHED' }
  | { type: 'CONTENT_REVEAL_FINISHED' }
  | { type: 'RETRY_REQUESTED' }

export const INITIAL_EXPERIENCE_STATE: ExperienceState = {
  phase: 'loading',
  progress: 0,
  attempt: 0,
}

export function reduceExperience(
  state: ExperienceState,
  event: ExperienceEvent,
): ExperienceState {
  switch (event.type) {
    case 'LOAD_PROGRESS':
      return state.phase === 'loading'
        ? { ...state, progress: Math.min(Math.max(event.progress, 0), 0.99) }
        : state
    case 'SCENE_READY':
      return state.phase === 'loading' ? { ...state, phase: 'revealing', progress: 1 } : state
    case 'LOAD_FAILED':
      return state.phase === 'loading'
        ? { ...state, phase: 'error', errorMessage: event.message }
        : state
    case 'LOADER_REVEAL_FINISHED':
      return state.phase === 'revealing' ? { ...state, phase: 'ready' } : state
    case 'START_REQUESTED':
      return state.phase === 'ready' ? { ...state, phase: 'approaching' } : state
    case 'ENTRY_MOTION_FINISHED':
      return state.phase === 'approaching'
        ? { ...state, phase: 'revealing-content' }
        : state
    case 'CONTENT_REVEAL_FINISHED':
      return state.phase === 'revealing-content' ? { ...state, phase: 'entered' } : state
    case 'RETRY_REQUESTED':
      return state.phase === 'error'
        ? { phase: 'loading', progress: 0, attempt: state.attempt + 1 }
        : state
  }
}
