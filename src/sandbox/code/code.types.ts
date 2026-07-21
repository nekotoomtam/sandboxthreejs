import type { SandboxSnapshot } from '../sandbox.types'

export type CodeRunRequest = {
  readonly code: string
  readonly initialSnapshot: SandboxSnapshot
}

export type CodeRunResult = {
  readonly status: 'success' | 'error'
  readonly snapshot?: SandboxSnapshot
  readonly logs: readonly string[]
  readonly error?: string
}
