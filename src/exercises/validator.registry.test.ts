import { describe, expect, it } from 'vitest'
import type { ObjectTransform, SandboxSnapshot } from '../sandbox/sandbox.types'
import { MATCH_TARGET_TRANSFORM } from './transformTarget'
import { validateExercise } from './validator.registry'

function snapshotWithRotation(y: number): SandboxSnapshot {
  return {
    objects: {
      'learning-cube': {
        position: [0, 0.75, 0],
        rotation: [0, y, 0],
        scale: [1, 1, 1],
        castShadow: false,
        receiveShadow: false,
      },
    },
    renderer: { shadowMapEnabled: false },
    lights: {},
    camera: {
      position: [4.6, 3.5, 5.4],
      target: [0, 0.5, 0],
      azimuthDegrees: 40.4,
      elevationDegrees: 25.1,
      distance: 7.1,
    },
  }
}

function snapshotWithTransform(transform: ObjectTransform): SandboxSnapshot {
  return {
    objects: {
      'learning-cube': {
        ...transform,
        castShadow: false,
        receiveShadow: false,
      },
    },
    renderer: { shadowMapEnabled: false },
    lights: {},
    camera: {
      position: [4.6, 3.5, 5.4],
      target: [0, 0.5, 0],
      azimuthDegrees: 40.4,
      elevationDegrees: 25.1,
      distance: 7.1,
    },
  }
}

type LightingPatch = {
  rendererShadowMapEnabled?: boolean
  cubeCastShadow?: boolean
  floorReceiveShadow?: boolean
  lightCastShadow?: boolean
  lightPosition?: readonly [number, number, number]
  lightIntensity?: number
}

function lightingSnapshot(patch: LightingPatch = {}): SandboxSnapshot {
  return {
    objects: {
      'learning-cube': {
        position: [0, 0.75, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        castShadow: patch.cubeCastShadow ?? true,
        receiveShadow: false,
      },
      'shadow-floor': {
        position: [0, -0.05, 0],
        rotation: [0, 0, 0],
        scale: [1, 1, 1],
        castShadow: false,
        receiveShadow: patch.floorReceiveShadow ?? true,
      },
    },
    renderer: {
      shadowMapEnabled: patch.rendererShadowMapEnabled ?? true,
    },
    lights: {
      'key-light': {
        kind: 'directional',
        position: patch.lightPosition ?? [-3, 6, 4],
        intensity: patch.lightIntensity ?? 2.5,
        castShadow: patch.lightCastShadow ?? true,
      },
    },
    camera: {
      position: [7, 5, 8],
      target: [0, 0.5, -0.4],
      azimuthDegrees: 40,
      elevationDegrees: 25,
      distance: 10,
    },
  }
}

describe('exercise validator registry', () => {
  it('accepts a Y rotation within the three-degree tolerance', () => {
    expect(validateExercise('rotate-cube-y-45', snapshotWithRotation(43)).passed).toBe(true)
  })

  it('returns useful guidance when the rotation is too small', () => {
    const result = validateExercise('rotate-cube-y-45', snapshotWithRotation(20))

    expect(result.passed).toBe(false)
    expect(result.message).toContain('เพิ่ม')
  })

  it('passes when the cube matches the target transform', () => {
    expect(
      validateExercise(
        'match-cube-transform',
        snapshotWithTransform(MATCH_TARGET_TRANSFORM),
      ),
    ).toMatchObject({ passed: true })
  })

  it.each([
    ['Position', { ...MATCH_TARGET_TRANSFORM, position: [1.2, 1, -0.5] }],
    ['Rotation', { ...MATCH_TARGET_TRANSFORM, rotation: [0, 30, 0] }],
    ['Scale', { ...MATCH_TARGET_TRANSFORM, scale: [1, 0.75, 1.25] }],
  ] as const)('reports the first mismatched %s group', (label, transform) => {
    const result = validateExercise(
      'match-cube-transform',
      snapshotWithTransform(transform as ObjectTransform),
    )

    expect(result.passed).toBe(false)
    expect(result.message).toContain(label)
  })

  it('fails safely for an unknown validator', () => {
    const result = validateExercise('missing-validator', snapshotWithRotation(45))

    expect(result.passed).toBe(false)
    expect(result.message).toContain('ยังไม่มีตัวตรวจคำตอบ')
  })

  it('passes a complete light and shadow configuration', () => {
    expect(
      validateExercise('configure-light-shadow', lightingSnapshot()),
    ).toMatchObject({ passed: true })
  })

  it.each([
    ['Shadow Map', { rendererShadowMapEnabled: false }],
    ['กล่อง', { cubeCastShadow: false }],
    ['พื้น', { floorReceiveShadow: false }],
    ['ไฟ', { lightCastShadow: false }],
    ['Position', { lightPosition: [0, 6, 4] }],
    ['Intensity', { lightIntensity: 1 }],
  ] as const)(
    'reports the first incomplete shadow dependency: %s',
    (label, patch) => {
      const result = validateExercise(
        'configure-light-shadow',
        lightingSnapshot(patch),
      )
      expect(result.passed).toBe(false)
      expect(result.message).toContain(label)
    },
  )
})
