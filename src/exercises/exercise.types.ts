import type { SandboxSnapshot } from '../sandbox/sandbox.types'

export type Exercise = {
  readonly id: string
  readonly title: string
  readonly instruction: string
  readonly hint: string
  readonly validator: string
}

export type ExerciseResult = {
  readonly passed: boolean
  readonly message: string
}

export type ExerciseValidator = (snapshot: SandboxSnapshot) => ExerciseResult
