import { describe, expect, it } from 'vitest'
import { concepts, getConceptById } from './concept.registry'

describe('concept registry', () => {
  it('keeps concept ids unique', () => {
    const ids = concepts.map((concept) => concept.id)

    expect(new Set(ids).size).toBe(ids.length)
  })

  it('only references concepts that exist', () => {
    const missingIds = concepts.flatMap((concept) =>
      concept.relatedConceptIds.filter((id) => !getConceptById(id)),
    )

    expect(missingIds).toEqual([])
  })
})
