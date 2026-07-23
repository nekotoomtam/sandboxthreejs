import { describe, expect, it } from 'vitest'
import { getWorldById, worldCatalog } from './world.registry'

describe('world registry', () => {
  it('keeps the three worlds in display order', () => {
    expect(worldCatalog.map((world) => world.id)).toEqual([
      'foundations',
      'controls',
      'integration',
    ])
  })

  it('links the first two available foundations lessons', () => {
    expect(getWorldById('foundations')?.lessons.slice(0, 2)).toMatchObject([
      { lessonId: 'hello-threejs', status: 'available' },
      { lessonId: 'position-rotation-scale', status: 'available' },
    ])
  })

  it('returns undefined for an unknown world', () => {
    expect(getWorldById('unknown')).toBeUndefined()
  })
})
