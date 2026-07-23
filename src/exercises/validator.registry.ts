import type { SandboxSnapshot } from '../sandbox/sandbox.types'
import type { ExerciseResult, ExerciseValidator } from './exercise.types'
import {
  LIGHT_SHADOW_TARGET,
  LIGHT_SHADOW_TOLERANCE,
} from './lightShadowTarget'
import { MATCH_TARGET_TOLERANCE, MATCH_TARGET_TRANSFORM } from './transformTarget'

const AXES = ['X', 'Y', 'Z'] as const

function firstLinearMismatch(
  actual: readonly number[],
  target: readonly number[],
  tolerance: number,
) {
  return actual.findIndex(
    (value, index) => Math.abs(value - target[index]) > tolerance,
  )
}

function angleDifference(actual: number, target: number) {
  return Math.abs(((actual - target + 180) % 360 + 360) % 360 - 180)
}

const rotateCubeY45: ExerciseValidator = (snapshot) => {
  const cube = snapshot.objects['learning-cube']
  if (!cube) {
    return { passed: false, message: 'ไม่พบกล่องในฉาก ลองรีเซ็ตฉากแล้วเริ่มใหม่' }
  }

  const yRotation = cube.rotation[1]
  const difference = Math.abs(yRotation - 45)
  if (difference <= 3) {
    return {
      passed: true,
      message: 'เยี่ยมเลย! กล่องหมุนรอบแกน Y ได้ 45° ตามเป้าหมายแล้ว',
    }
  }

  const direction = yRotation < 45 ? 'เพิ่ม' : 'ลด'
  return {
    passed: false,
    message: `ใกล้แล้ว ลอง${direction}ค่า Rotation Y อีก ${Math.ceil(difference)}°`,
  }
}

const matchCubeTransform: ExerciseValidator = (snapshot) => {
  const cube = snapshot.objects['learning-cube']
  if (!cube) {
    return { passed: false, message: 'ไม่พบกล่องในฉาก ลองรีเซ็ตฉากแล้วเริ่มใหม่' }
  }

  const positionAxis = firstLinearMismatch(
    cube.position,
    MATCH_TARGET_TRANSFORM.position,
    MATCH_TARGET_TOLERANCE.position,
  )
  if (positionAxis >= 0) {
    return {
      passed: false,
      message: `Position ${AXES[positionAxis]} ยังไม่ตรงกับกล่องเงา`,
    }
  }

  const rotationAxis = cube.rotation.findIndex(
    (value, index) =>
      angleDifference(value, MATCH_TARGET_TRANSFORM.rotation[index]) >
      MATCH_TARGET_TOLERANCE.rotation,
  )
  if (rotationAxis >= 0) {
    return {
      passed: false,
      message: `Rotation ${AXES[rotationAxis]} ยังไม่ตรงกับกล่องเงา`,
    }
  }

  const scaleAxis = firstLinearMismatch(
    cube.scale,
    MATCH_TARGET_TRANSFORM.scale,
    MATCH_TARGET_TOLERANCE.scale,
  )
  if (scaleAxis >= 0) {
    return {
      passed: false,
      message: `Scale ${AXES[scaleAxis]} ยังไม่ตรงกับกล่องเงา`,
    }
  }

  return {
    passed: true,
    message:
      'ยอดเยี่ยม! กล่องจริงซ้อนตรงกับกล่องเงาครบทั้ง Position, Rotation และ Scale แล้ว',
  }
}

const configureLightShadow: ExerciseValidator = (snapshot) => {
  if (!snapshot.renderer.shadowMapEnabled) {
    return { passed: false, message: 'เปิด Shadow Map ของ renderer ก่อน' }
  }

  const cube = snapshot.objects[LIGHT_SHADOW_TARGET.casterObjectId]
  if (!cube?.castShadow) {
    return { passed: false, message: 'กล่องยังไม่ได้เปิด castShadow' }
  }

  const floor = snapshot.objects[LIGHT_SHADOW_TARGET.receiverObjectId]
  if (!floor?.receiveShadow) {
    return { passed: false, message: 'พื้นยังไม่ได้เปิด receiveShadow' }
  }

  const light = snapshot.lights[LIGHT_SHADOW_TARGET.lightId]
  if (!light?.castShadow) {
    return { passed: false, message: 'ไฟยังไม่ได้เปิด castShadow' }
  }

  const positionAxis = firstLinearMismatch(
    light.position,
    LIGHT_SHADOW_TARGET.position,
    LIGHT_SHADOW_TOLERANCE.position,
  )
  if (positionAxis >= 0) {
    return {
      passed: false,
      message: `Position ${AXES[positionAxis]} ของไฟยังไม่ตรงเป้าหมาย`,
    }
  }

  if (
    Math.abs(light.intensity - LIGHT_SHADOW_TARGET.intensity) >
    LIGHT_SHADOW_TOLERANCE.intensity
  ) {
    return {
      passed: false,
      message: 'Intensity ของไฟยังไม่เท่ากับ 2.5',
    }
  }

  return {
    passed: true,
    message:
      'ยอดเยี่ยม! แสงและเงาทำงานครบทั้ง renderer, กล่อง, พื้น และ Directional Light แล้ว',
  }
}

const validators: Readonly<Record<string, ExerciseValidator>> = {
  'rotate-cube-y-45': rotateCubeY45,
  'match-cube-transform': matchCubeTransform,
  'configure-light-shadow': configureLightShadow,
}

export function validateExercise(
  validatorId: string,
  snapshot: SandboxSnapshot,
): ExerciseResult {
  const validator = validators[validatorId]
  if (!validator) {
    return { passed: false, message: 'ยังไม่มีตัวตรวจคำตอบสำหรับแบบฝึกหัดนี้' }
  }

  return validator(snapshot)
}
