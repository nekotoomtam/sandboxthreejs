import { describe, expect, it } from 'vitest'
import { calculateCameraOrbit } from './cameraMath'

describe('calculateCameraOrbit', () => {
  it('measures azimuth around the Y axis from the target', () => {
    const orbit = calculateCameraOrbit([1, 0, 1], [0, 0, 0])

    expect(orbit.azimuthDegrees).toBeCloseTo(45)
    expect(orbit.elevationDegrees).toBeCloseTo(0)
    expect(orbit.distance).toBeCloseTo(Math.sqrt(2))
  })

  it('measures elevation independently from azimuth', () => {
    const orbit = calculateCameraOrbit([0, 1, 1], [0, 0, 0])

    expect(orbit.azimuthDegrees).toBeCloseTo(0)
    expect(orbit.elevationDegrees).toBeCloseTo(45)
  })
})
