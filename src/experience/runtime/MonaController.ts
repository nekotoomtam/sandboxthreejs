import * as THREE from 'three'
import { VRMUtils, type VRM, type VRMHumanBoneName } from '@pixiv/three-vrm'
import type { Vec3Tuple } from './experienceComposition'
import { NEUTRAL_STANDING_POSE } from './experienceRuntime.helpers'

export class MonaController {
  readonly vrm: VRM
  private elapsedSeconds = 0
  private turnProgress = 0

  constructor(vrm: VRM) {
    this.vrm = vrm
  }

  applyInitialPose() {
    this.vrm.scene.position.set(1.8, 0, -4)
    this.vrm.scene.rotation.y = Math.PI
    this.turnProgress = 0

    for (const [boneName, pose] of Object.entries(NEUTRAL_STANDING_POSE)) {
      this.setNormalizedBoneRotation(
        boneName as VRMHumanBoneName,
        'z',
        THREE.MathUtils.degToRad(pose.zDegrees),
      )
    }
    this.vrm.humanoid.update()
  }

  setCompositionPosition(position: Vec3Tuple) {
    this.vrm.scene.position.set(...position)
  }

  applyEntrySample(sample: { turnProgress: number }) {
    this.turnProgress = THREE.MathUtils.clamp(sample.turnProgress, 0, 1)
    this.vrm.scene.rotation.y = THREE.MathUtils.lerp(Math.PI, 0, this.turnProgress)
  }

  attachTo(scene: THREE.Scene) {
    VRMUtils.combineSkeletons(this.vrm.scene)
    VRMUtils.combineMorphs(this.vrm)
    this.applyInitialPose()
    scene.add(this.vrm.scene)
    this.vrm.scene.updateMatrixWorld(true)
    this.vrm.springBoneManager?.reset()
  }

  update(delta: number) {
    this.elapsedSeconds += delta
    const idleWeight = 1 - Math.sin(this.turnProgress * Math.PI)
    const breath =
      Math.sin(this.elapsedSeconds * 1.4) * THREE.MathUtils.degToRad(0.7) * idleWeight
    const turnWeight = Math.sin(this.turnProgress * Math.PI)
    const weightShift = turnWeight * THREE.MathUtils.degToRad(3)
    const torsoFollow = turnWeight * THREE.MathUtils.degToRad(-4)

    this.setNormalizedBoneRotation('chest', 'x', breath)
    this.setNormalizedBoneRotation('hips', 'z', weightShift)
    this.setNormalizedBoneRotation('chest', 'y', torsoFollow)
    this.vrm.humanoid.update()
    this.vrm.update(delta)
  }

  dispose() {
    this.vrm.scene.removeFromParent()
    VRMUtils.deepDispose(this.vrm.scene)
  }

  private setNormalizedBoneRotation(
    boneName: VRMHumanBoneName,
    axis: 'x' | 'y' | 'z',
    radians: number,
  ) {
    const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName)
    if (bone) bone.rotation[axis] = radians
  }
}
