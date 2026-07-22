import * as THREE from 'three'
import { VRMUtils, type VRM } from '@pixiv/three-vrm'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { MonaController } from './MonaController'

describe('MonaController', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('places Mona at a distance and lowers her arms', () => {
    const bones = new Map([
      ['leftUpperArm', new THREE.Object3D()],
      ['rightUpperArm', new THREE.Object3D()],
      ['leftLowerArm', new THREE.Object3D()],
      ['rightLowerArm', new THREE.Object3D()],
    ])
    const humanoidUpdate = vi.fn()
    const vrm = {
      scene: new THREE.Group(),
      humanoid: {
        getNormalizedBoneNode: vi.fn((name: string) => bones.get(name) ?? null),
        update: humanoidUpdate,
      },
    } as unknown as VRM

    const controller = new MonaController(vrm)
    controller.applyInitialPose()

    expect(vrm.scene.position.toArray()).toEqual([1.8, 0, -4])
    expect(vrm.scene.rotation.y).toBeCloseTo(THREE.MathUtils.degToRad(-32))
    expect(bones.get('leftUpperArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(-68))
    expect(bones.get('rightUpperArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(68))
    expect(bones.get('leftLowerArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(-8))
    expect(bones.get('rightLowerArm')?.rotation.z).toBeCloseTo(THREE.MathUtils.degToRad(8))
    expect(humanoidUpdate).toHaveBeenCalledOnce()
  })

  it('optimizes and attaches Mona to the scene', () => {
    const vrm = {
      scene: new THREE.Group(),
      humanoid: {
        getNormalizedBoneNode: vi.fn(),
        update: vi.fn(),
      },
    } as unknown as VRM
    const scene = new THREE.Scene()
    const combineSkeletons = vi.spyOn(VRMUtils, 'combineSkeletons').mockImplementation(() => undefined)
    const combineMorphs = vi.spyOn(VRMUtils, 'combineMorphs').mockImplementation(() => undefined)

    new MonaController(vrm).attachTo(scene)

    expect(combineSkeletons).toHaveBeenCalledWith(vrm.scene)
    expect(combineMorphs).toHaveBeenCalledWith(vrm)
    expect(vrm.scene.parent).toBe(scene)
  })

  it('forwards animation deltas to the VRM', () => {
    const update = vi.fn()
    const vrm = { update } as unknown as VRM

    new MonaController(vrm).update(0.25)

    expect(update).toHaveBeenCalledWith(0.25)
  })

  it('removes Mona and deeply disposes her scene', () => {
    const vrm = { scene: new THREE.Group() } as unknown as VRM
    const scene = new THREE.Scene()
    scene.add(vrm.scene)
    const deepDispose = vi.spyOn(VRMUtils, 'deepDispose').mockImplementation(() => undefined)

    new MonaController(vrm).dispose()

    expect(vrm.scene.parent).toBeNull()
    expect(deepDispose).toHaveBeenCalledWith(vrm.scene)
  })
})
