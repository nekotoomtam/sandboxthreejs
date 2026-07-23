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

  it('links the available foundations lesson', () => {
    expect(getWorldById('foundations')?.lessons[0]).toMatchObject({
      lessonId: 'hello-threejs',
      status: 'available',
    })
  })

  it('returns undefined for an unknown world', () => {
    expect(getWorldById('unknown')).toBeUndefined()
  })
})
