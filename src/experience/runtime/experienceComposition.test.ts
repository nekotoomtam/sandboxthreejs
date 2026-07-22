import { describe, expect, it } from 'vitest'
import { resolveEntryComposition } from './experienceComposition'

describe('resolveEntryComposition', () => {
  it('keeps desktop Mona right-weighted and defines a low opening camera', () => {
    const result = resolveEntryComposition(1_440, 1_024)

    expect(result.breakpoint).toBe('desktop')
    expect(result.ready.cameraPosition[1]).toBeLessThan(result.entered.cameraPosition[1])
    expect(result.ready.cameraTarget[0]).toBeGreaterThan(result.entered.cameraTarget[0])
    expect(result.monaPosition[0]).toBeGreaterThan(0)
  })

  it('uses the narrow composition below 768px', () => {
    expect(resolveEntryComposition(767, 844).breakpoint).toBe('narrow')
    expect(resolveEntryComposition(768, 844).breakpoint).toBe('desktop')
  })

  it('keeps semantic endpoints independent from viewport height', () => {
    expect(resolveEntryComposition(1_440, 720)).toEqual(
      resolveEntryComposition(1_440, 1_024),
    )
  })
})
