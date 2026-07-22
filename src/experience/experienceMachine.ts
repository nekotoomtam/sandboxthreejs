export type ExperiencePhase = 'loading' | 'ready' | 'entering' | 'entered' | 'error'

export type ExperienceState = {
  phase: ExperiencePhase
  progress: number
  attempt: number
  errorMessage?: string
}

export type ExperienceEvent =
  | { type: 'LOAD_PROGRESS'; progress: number }
  | { type: 'LOAD_SUCCEEDED' }
  | { type: 'LOAD_FAILED'; message: string }
  | { type: 'START_REQUESTED' }
  | { type: 'ENTRY_TRANSITION_FINISHED' }
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
    case 'LOAD_SUCCEEDED':
      return state.phase === 'loading' ? { ...state, phase: 'ready', progress: 1 } : state
    case 'LOAD_FAILED':
      return state.phase === 'loading'
        ? { ...state, phase: 'error', errorMessage: event.message }
        : state
    case 'START_REQUESTED':
      return state.phase === 'ready' ? { ...state, phase: 'entering' } : state
    case 'ENTRY_TRANSITION_FINISHED':
      return state.phase === 'entering' ? { ...state, phase: 'entered' } : state
    case 'RETRY_REQUESTED':
      return state.phase === 'error'
        ? { phase: 'loading', progress: 0, attempt: state.attempt + 1 }
        : state
  }
}
