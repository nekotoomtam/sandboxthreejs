import * as THREE from 'three'
import { describe, expect, it } from 'vitest'
import {
  lightFromDefinition,
  materialParameters,
  SandboxRuntime,
} from './SandboxRuntime'

describe('sandbox material parameters', () => {
  it('preserves translucent target material options', () => {
    expect(
      materialParameters({
        color: '#8bdcff',
        opacity: 0.28,
        transparent: true,
        wireframe: true,
        depthWrite: false,
      }),
    ).toMatchObject({
      color: '#8bdcff',
      opacity: 0.28,
      transparent: true,
      wireframe: true,
      depthWrite: false,
    })
  })
})

describe('sandbox light definitions', () => {
  it('creates a shadow-casting directional light from its definition', () => {
    const light = lightFromDefinition({
      id: 'key-light',
      kind: 'directional',
      color: '#ffffff',
      intensity: 2.5,
      position: [-3, 6, 4],
      castShadow: true,
    })

    expect(light).toBeInstanceOf(THREE.DirectionalLight)
    expect(light.position.toArray()).toEqual([-3, 6, 4])
    expect(light.intensity).toBe(2.5)
    expect(light.castShadow).toBe(true)
  })

  it('snapshots explicit renderer, object, and light shadow state before mount', () => {
    const runtime = new SandboxRuntime({
      background: '#111111',
      renderer: { shadowMapEnabled: true },
      camera: { position: [4, 3, 6], target: [0, 0, 0] },
      lights: [
        {
          id: 'key-light',
          kind: 'directional',
          color: '#ffffff',
          intensity: 2.5,
          position: [-3, 6, 4],
          castShadow: true,
        },
      ],
      objects: [
        {
          id: 'learning-cube',
          label: 'Cube',
          geometry: { kind: 'box', size: [1, 1, 1] },
          material: { color: '#ffffff' },
          castShadow: true,
        },
      ],
    }).create()

    expect(runtime.getSnapshot()).toMatchObject({
      renderer: { shadowMapEnabled: true },
      objects: { 'learning-cube': { castShadow: true } },
      lights: { 'key-light': { intensity: 2.5, castShadow: true } },
    })
    runtime.dispose()
  })
})
