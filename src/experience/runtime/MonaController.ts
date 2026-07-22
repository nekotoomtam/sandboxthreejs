import * as THREE from 'three'
import { VRMUtils, type VRM, type VRMHumanBoneName } from '@pixiv/three-vrm'
import { NEUTRAL_STANDING_POSE } from './experienceRuntime.helpers'

export class MonaController {
  readonly vrm: VRM

  constructor(vrm: VRM) {
    this.vrm = vrm
  }

  applyInitialPose() {
    this.vrm.scene.position.set(1.8, 0, -4)
    this.vrm.scene.rotation.y = THREE.MathUtils.degToRad(-32)

    for (const [boneName, pose] of Object.entries(NEUTRAL_STANDING_POSE)) {
      const bone = this.vrm.humanoid.getNormalizedBoneNode(boneName as VRMHumanBoneName)
      if (bone) bone.rotation.z = THREE.MathUtils.degToRad(pose.zDegrees)
    }
    this.vrm.humanoid.update()
  }

  attachTo(scene: THREE.Scene) {
    VRMUtils.combineSkeletons(this.vrm.scene)
    VRMUtils.combineMorphs(this.vrm)
    this.applyInitialPose()
    scene.add(this.vrm.scene)
  }

  update(delta: number) {
    this.vrm.update(delta)
  }

  dispose() {
    this.vrm.scene.removeFromParent()
    VRMUtils.deepDispose(this.vrm.scene)
  }
}
