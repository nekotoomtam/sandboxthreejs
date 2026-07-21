import type { SandboxSnapshot } from '../sandbox/sandbox.types'
import type { ExerciseResult, ExerciseValidator } from './exercise.types'

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

const validators: Readonly<Record<string, ExerciseValidator>> = {
  'rotate-cube-y-45': rotateCubeY45,
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
