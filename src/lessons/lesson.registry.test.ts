import { describe, expect, it } from 'vitest'
import { getLessonById, getPublishedLessons } from './lesson.registry'

describe('lesson registry', () => {
  it('finds the first lesson by its stable id', () => {
    expect(getLessonById('hello-threejs')?.title).toBe('Hello, Three.js')
  })

  it('returns published lessons in learning order', () => {
    const lessons = getPublishedLessons()
    const orders = lessons.map((lesson) => lesson.order)

    expect(orders).toEqual([...orders].sort((a, b) => a - b))
  })

  it('publishes the transform lesson after Hello Three.js', () => {
    expect(getPublishedLessons().map((lesson) => lesson.id)).toEqual([
      'hello-threejs',
      'position-rotation-scale',
    ])
    expect(getLessonById('position-rotation-scale')?.sections).toHaveLength(3)
  })
})
