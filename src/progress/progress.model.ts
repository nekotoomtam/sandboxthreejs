export const PROGRESS_STORAGE_KEY = 'threelab.progress.v1'

export type LearningProgress = {
  readonly version: 1
  readonly completedExerciseKeys: readonly string[]
  readonly completedLessonIds: readonly string[]
  readonly lastLessonId?: string
}

export const EMPTY_PROGRESS: LearningProgress = {
  version: 1,
  completedExerciseKeys: [],
  completedLessonIds: [],
}

export function createExerciseKey(lessonId: string, exerciseId: string) {
  return `${lessonId}:${exerciseId}`
}

function uniqueStrings(value: unknown) {
  if (!Array.isArray(value)) return []
  return [...new Set(value.filter((item): item is string => typeof item === 'string'))]
}

export function loadProgress(storage: Pick<Storage, 'getItem'> | undefined): LearningProgress {
  if (!storage) return EMPTY_PROGRESS

  try {
    const rawValue = storage.getItem(PROGRESS_STORAGE_KEY)
    if (!rawValue) return EMPTY_PROGRESS
    const parsed = JSON.parse(rawValue) as Partial<LearningProgress>
    if (parsed.version !== 1) return EMPTY_PROGRESS

    return {
      version: 1,
      completedExerciseKeys: uniqueStrings(parsed.completedExerciseKeys),
      completedLessonIds: uniqueStrings(parsed.completedLessonIds),
      lastLessonId:
        typeof parsed.lastLessonId === 'string' ? parsed.lastLessonId : undefined,
    }
  } catch {
    return EMPTY_PROGRESS
  }
}

export function saveProgress(
  storage: Pick<Storage, 'setItem'> | undefined,
  progress: LearningProgress,
) {
  try {
    storage?.setItem(PROGRESS_STORAGE_KEY, JSON.stringify(progress))
  } catch {
    // Learning must continue even when storage is disabled or full.
  }
}

export function markExerciseComplete(
  progress: LearningProgress,
  lessonId: string,
  exerciseId: string,
  requiredExerciseIds: readonly string[],
): LearningProgress {
  const completedExerciseKeys = new Set(progress.completedExerciseKeys)
  completedExerciseKeys.add(createExerciseKey(lessonId, exerciseId))

  const lessonIsComplete =
    requiredExerciseIds.length > 0 &&
    requiredExerciseIds.every((id) =>
      completedExerciseKeys.has(createExerciseKey(lessonId, id)),
    )
  const completedLessonIds = new Set(progress.completedLessonIds)
  if (lessonIsComplete) completedLessonIds.add(lessonId)

  return {
    version: 1,
    completedExerciseKeys: [...completedExerciseKeys],
    completedLessonIds: [...completedLessonIds],
    lastLessonId: lessonId,
  }
}
