import { describe, expect, it } from 'vitest'
import { materialParameters } from './SandboxRuntime'

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
