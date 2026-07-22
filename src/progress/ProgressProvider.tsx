import {
  type ReactNode,
  useCallback,
  useMemo,
  useState,
} from 'react'
import { ProgressContext, type ProgressContextValue } from './progress.context'
import {
  createExerciseKey,
  loadProgress,
  markExerciseComplete,
  saveProgress,
} from './progress.model'

export function ProgressProvider({ children }: { children: ReactNode }) {
  const [progress, setProgress] = useState(() => loadProgress(window.localStorage))

  const completeExercise = useCallback(
    (
      lessonId: string,
      exerciseId: string,
      requiredExerciseIds: readonly string[],
    ) => {
      setProgress((currentProgress) => {
        const nextProgress = markExerciseComplete(
          currentProgress,
          lessonId,
          exerciseId,
          requiredExerciseIds,
        )
        saveProgress(window.localStorage, nextProgress)
        return nextProgress
      })
    },
    [],
  )

  const value = useMemo<ProgressContextValue>(
    () => ({
      progress,
      completeExercise,
      isExerciseCompleted: (lessonId, exerciseId) =>
        progress.completedExerciseKeys.includes(createExerciseKey(lessonId, exerciseId)),
      isLessonCompleted: (lessonId) =>
        progress.completedLessonIds.includes(lessonId),
    }),
    [completeExercise, progress],
  )

  return <ProgressContext.Provider value={value}>{children}</ProgressContext.Provider>
}
