import { createContext, useContext } from 'react'
import type { LearningProgress } from './progress.model'

export type ProgressContextValue = {
  readonly progress: LearningProgress
  readonly completeExercise: (
    lessonId: string,
    exerciseId: string,
    requiredExerciseIds: readonly string[],
  ) => void
  readonly isExerciseCompleted: (lessonId: string, exerciseId: string) => boolean
  readonly isLessonCompleted: (lessonId: string) => boolean
}

export const ProgressContext = createContext<ProgressContextValue | null>(null)

export function useLearningProgress() {
  const context = useContext(ProgressContext)
  if (!context) {
    throw new Error('useLearningProgress must be used inside ProgressProvider.')
  }
  return context
}
