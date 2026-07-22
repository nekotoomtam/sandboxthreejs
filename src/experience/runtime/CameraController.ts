import * as THREE from 'three'
import type { ExperienceComposition } from './experienceComposition'

export class CameraController {
  constructor(private readonly camera: THREE.PerspectiveCamera) {}

  apply(composition: ExperienceComposition, rawProgress: number): void {
    const progress = THREE.MathUtils.clamp(rawProgress, 0, 1)
    const { ready, entered } = composition

    this.camera.position.set(
      THREE.MathUtils.lerp(ready.cameraPosition[0], entered.cameraPosition[0], progress),
      THREE.MathUtils.lerp(ready.cameraPosition[1], entered.cameraPosition[1], progress),
      THREE.MathUtils.lerp(ready.cameraPosition[2], entered.cameraPosition[2], progress),
    )
    this.camera.lookAt(
      THREE.MathUtils.lerp(ready.cameraTarget[0], entered.cameraTarget[0], progress),
      THREE.MathUtils.lerp(ready.cameraTarget[1], entered.cameraTarget[1], progress),
      THREE.MathUtils.lerp(ready.cameraTarget[2], entered.cameraTarget[2], progress),
    )
    this.camera.updateMatrixWorld()
  }
}
