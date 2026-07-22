import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import type { VRM } from '@pixiv/three-vrm'
import { MonaController } from './MonaController'

describe('MonaController', () => {
  it('places Mona at a distance and lowers her arms', () => {
    const bones = new Map([
      ['leftUpperArm', new THREE.Object3D()],
      ['rightUpperArm', new THREE.Object3D()],
      ['leftLowerArm', new THREE.Object3D()],
      ['rightLowerArm', new THREE.Object3D()],
    ])
    const vrm = {
      scene: new THREE.Group(),
      humanoid: {
        getNormalizedBoneNode: vi.fn((name: string) => bones.get(name) ?? null),
        update: vi.fn(),
      },
    } as unknown as VRM

    const controller = new MonaController(vrm)
    controller.applyInitialPose()

    expect(vrm.scene.position.toArray()).toEqual([1.8, 0, -4])
    expect(bones.get('leftUpperArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(-68))
    expect(bones.get('rightUpperArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(68))
  })
})
