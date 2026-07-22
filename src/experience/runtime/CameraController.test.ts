import * as THREE from 'three'
import { describe, expect, it, vi } from 'vitest'
import { CameraController } from './CameraController'
import { resolveEntryComposition } from './experienceComposition'

describe('CameraController', () => {
  it('applies exact endpoints and forwards the interpolated look target', () => {
    const camera = new THREE.PerspectiveCamera()
    const lookAt = vi.spyOn(camera, 'lookAt')
    const controller = new CameraController(camera)
    const composition = resolveEntryComposition(1_440, 1_024)

    controller.apply(composition, 0)
    expect(camera.position.toArray()).toEqual([...composition.ready.cameraPosition])
    expect(lookAt).toHaveBeenLastCalledWith(...composition.ready.cameraTarget)

    controller.apply(composition, 1)
    expect(camera.position.toArray()).toEqual([...composition.entered.cameraPosition])
    expect(lookAt).toHaveBeenLastCalledWith(...composition.entered.cameraTarget)
  })

  it('clamps progress before interpolation', () => {
    const camera = new THREE.PerspectiveCamera()
    const controller = new CameraController(camera)
    const composition = resolveEntryComposition(390, 844)

    controller.apply(composition, 4)

    expect(camera.position.toArray()).toEqual([...composition.entered.cameraPosition])
  })
})
