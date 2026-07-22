import { describe, expect, it } from 'vitest'
import {
  NEUTRAL_STANDING_POSE,
  resolveLoadProgress,
  selectExperienceQuality,
} from './experienceRuntime.helpers'

describe('experience runtime helpers', () => {
  it('reserves the final progress segment for parsing and scene preparation', () => {
    expect(resolveLoadProgress(50, 100)).toBeCloseTo(0.46)
    expect(resolveLoadProgress(100, 100)).toBeCloseTo(0.92)
    expect(resolveLoadProgress(25, 0)).toBe(0)
  })

  it('uses a reduced quality tier for narrow or coarse-pointer devices', () => {
    expect(selectExperienceQuality({ width: 390, devicePixelRatio: 3, coarsePointer: true }))
      .toEqual({ tier: 'reduced', pixelRatio: 1 })
    expect(selectExperienceQuality({ width: 1440, devicePixelRatio: 2, coarsePointer: false }))
      .toEqual({ tier: 'desktop', pixelRatio: 1.5 })
  })

  it('lowers both upper arms symmetrically from the bind T-pose', () => {
    expect(NEUTRAL_STANDING_POSE.leftUpperArm.zDegrees).toBe(-68)
    expect(NEUTRAL_STANDING_POSE.rightUpperArm.zDegrees).toBe(68)
  })

})
