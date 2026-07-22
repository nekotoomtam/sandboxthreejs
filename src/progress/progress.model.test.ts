import { describe, expect, it } from 'vitest'
import {
  EMPTY_PROGRESS,
  PROGRESS_STORAGE_KEY,
  loadProgress,
  markExerciseComplete,
  saveProgress,
} from './progress.model'

function createMemoryStorage() {
  const values = new Map<string, string>()
  return {
    getItem: (key: string) => values.get(key) ?? null,
    setItem: (key: string, value: string) => values.set(key, value),
    values,
  }
}

describe('learning progress', () => {
  it('marks a lesson complete only after every required exercise', () => {
    const firstStep = markExerciseComplete(
      EMPTY_PROGRESS,
      'lesson-one',
      'exercise-a',
      ['exercise-a', 'exercise-b'],
    )
    const secondStep = markExerciseComplete(
      firstStep,
      'lesson-one',
      'exercise-b',
      ['exercise-a', 'exercise-b'],
    )

    expect(firstStep.completedLessonIds).toEqual([])
    expect(secondStep.completedLessonIds).toEqual(['lesson-one'])
  })

  it('persists and reloads progress from storage', () => {
    const storage = createMemoryStorage()
    const progress = markExerciseComplete(
      EMPTY_PROGRESS,
      'hello-threejs',
      'first-rotation',
      ['first-rotation'],
    )

    saveProgress(storage, progress)

    expect(storage.values.has(PROGRESS_STORAGE_KEY)).toBe(true)
    expect(loadProgress(storage)).toEqual(progress)
  })

  it('falls back safely when stored data is invalid', () => {
    const storage = createMemoryStorage()
    storage.setItem(PROGRESS_STORAGE_KEY, '{not-json')

    expect(loadProgress(storage)).toEqual(EMPTY_PROGRESS)
  })
})
