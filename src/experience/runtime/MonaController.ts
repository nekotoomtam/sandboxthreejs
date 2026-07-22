import * as THREE from 'three'
import { VRMUtils, type VRM, type VRMHumanBoneName } from '@pixiv/three-vrm'
import type { Vec3Tuple } from './experienceComposition'
import { NEUTRAL_STANDING_POSE } from './experienceRuntime.helpers'
import { BlinkController } from './BlinkController'

export class MonaController {
  readonly vrm: VRM
  private elapsedSeconds = 0
  private turnProgress = 0
  private readonly blink: BlinkController
  private mixer?: THREE.AnimationMixer
  private idleAction?: THREE.AnimationAction

  constructor(vrm: VRM, random: () => number = Math.random) {
    this.vrm = vrm
    this.blink = new BlinkController(random)
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

  setIdleClip(clip: THREE.AnimationClip) {
    this.idleAction?.stop()
    this.mixer?.stopAllAction()
    this.mixer?.uncacheRoot(this.vrm.scene)
    this.mixer = new THREE.AnimationMixer(this.vrm.scene)
    this.idleAction = this.mixer.clipAction(clip)
    this.idleAction.reset().setLoop(THREE.LoopRepeat, Infinity).play()
  }

  update(delta: number) {
    this.elapsedSeconds += delta
    const idleWeight = 1 - Math.sin(this.turnProgress * Math.PI)

    if (this.idleAction && this.mixer) {
      this.idleAction.setEffectiveWeight(idleWeight)
      this.mixer.update(delta)
    } else {
      const breath =
        Math.sin(this.elapsedSeconds * 1.4) * THREE.MathUtils.degToRad(0.7) * idleWeight
      const turnWeight = Math.sin(this.turnProgress * Math.PI)
      this.setNormalizedBoneRotation('chest', 'x', breath)
      this.setNormalizedBoneRotation('hips', 'z', turnWeight * THREE.MathUtils.degToRad(3))
      this.setNormalizedBoneRotation('chest', 'y', turnWeight * THREE.MathUtils.degToRad(-4))
    }

    this.vrm.expressionManager?.setValue('blink', this.blink.update(delta))
    this.vrm.humanoid.update()
    this.vrm.update(delta)
  }

  dispose() {
    this.idleAction?.stop()
    this.mixer?.stopAllAction()
    this.mixer?.uncacheRoot(this.vrm.scene)
    this.idleAction = undefined
    this.mixer = undefined
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
