import type { SandboxSnapshot } from '../sandbox.types'
import type { CodeRunResult } from './code.types'

const MAX_RUN_TIME_MS = 1_500

export function runSandboxCode(
  code: string,
  initialSnapshot: SandboxSnapshot,
): Promise<CodeRunResult> {
  return new Promise((resolve) => {
    const worker = new Worker(new URL('./codeRunner.worker.ts', import.meta.url), {
      type: 'module',
    })
    const timeout = window.setTimeout(() => {
      worker.terminate()
      resolve({
        status: 'error',
        logs: [],
        error: 'โค้ดใช้เวลานานเกิน 1.5 วินาที ระบบจึงหยุดการทำงานให้',
      })
    }, MAX_RUN_TIME_MS)

    worker.addEventListener('message', (event: MessageEvent<CodeRunResult>) => {
      window.clearTimeout(timeout)
      worker.terminate()
      resolve(event.data)
    })

    worker.addEventListener('error', (event) => {
      window.clearTimeout(timeout)
      worker.terminate()
      resolve({ status: 'error', logs: [], error: event.message })
    })

    worker.postMessage({ code, initialSnapshot })
  })
}
