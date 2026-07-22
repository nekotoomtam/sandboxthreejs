import { describe, expect, it } from 'vitest'
import {
  NEUTRAL_STANDING_POSE,
  resolveLoadProgress,
  resolveExperienceComposition,
  selectExperienceQuality,
  shouldShowStartMarker,
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

  it('shows the spatial marker only after loading and before entry', () => {
    expect(shouldShowStartMarker(false, false)).toBe(false)
    expect(shouldShowStartMarker(true, false)).toBe(true)
    expect(shouldShowStartMarker(true, true)).toBe(false)
  })

  it('keeps Mona right-weighted on desktop and brings the marker into the mobile frame', () => {
    expect(resolveExperienceComposition(1440)).toEqual({
      cameraTarget: [0, 1.05, -3.4],
      markerPosition: [-1.65, 0.78, 0.3],
      markerScale: 1,
    })
    expect(resolveExperienceComposition(390)).toEqual({
      cameraTarget: [1.3, 1.05, -3.4],
      markerPosition: [0.5, 0.5, 0.3],
      markerScale: 0.55,
    })
  })
})
