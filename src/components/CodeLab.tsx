import { useState } from 'react'
import type { CodeLabDefinition, SandboxSnapshot } from '../sandbox/sandbox.types'
import type { CodeRunResult } from '../sandbox/code/code.types'
import { runSandboxCode } from '../sandbox/code/runSandboxCode'
import { CodeEditor } from './CodeEditor'

type CodeLabProps = {
  definition: CodeLabDefinition
  snapshot?: SandboxSnapshot
  onApplySnapshot: (snapshot: SandboxSnapshot) => void
}

function number(value: number) {
  return Number(value.toFixed(2))
}

function snapshotToCode(snapshot: SandboxSnapshot) {
  const cube = snapshot.objects['learning-cube']
  if (!cube) return ''

  return `// โค้ดจากค่าปัจจุบันของตัวกล่อง\ncube.position.set(${cube.position.map(number).join(', ')})\ncube.rotation.set(\n  THREE.MathUtils.degToRad(${number(cube.rotation[0])}),\n  THREE.MathUtils.degToRad(${number(cube.rotation[1])}),\n  THREE.MathUtils.degToRad(${number(cube.rotation[2])})\n)\ncube.scale.set(${cube.scale.map(number).join(', ')})`
}

export function CodeLab({ definition, snapshot, onApplySnapshot }: CodeLabProps) {
  const [code, setCode] = useState(definition.starterCode)
  const [lastSuccessfulCode, setLastSuccessfulCode] = useState(definition.starterCode)
  const [result, setResult] = useState<CodeRunResult>()
  const [isRunning, setIsRunning] = useState(false)
  const hasPendingChanges = code !== lastSuccessfulCode

  const handleRun = async () => {
    if (!snapshot || isRunning) return
    setIsRunning(true)
    setResult(undefined)
    const nextResult = await runSandboxCode(code, snapshot)
    setResult(nextResult)
    setIsRunning(false)

    if (nextResult.status === 'success' && nextResult.snapshot) {
      setLastSuccessfulCode(code)
      onApplySnapshot(nextResult.snapshot)
    }
  }

  return (
    <div className="lesson-code-lab flex h-full min-h-[520px] flex-col bg-[#f8faf9]">
      <div className="border-b border-[#dfe7e4] p-4">
        <div className="flex items-center justify-between gap-2">
          <div>
            <p className="text-[10px] font-black tracking-[0.13em] text-[#c87c1d]">GUIDED CODE LAB</p>
            <h3 className="mt-0.5 text-sm font-black text-[#25483f]">{definition.title}</h3>
          </div>
          <span className="rounded-full bg-[#dff0e8] px-2.5 py-1 text-[10px] font-bold text-[#2b6c59]">
            Worker sandbox
          </span>
        </div>
        <p className="mt-2 text-xs leading-5 text-[#667a74]">{definition.description}</p>
        <div className="mt-3 flex flex-wrap gap-1.5">
          {definition.availableBindings.map((binding) => (
            <code key={binding} className="rounded-md bg-[#e9efed] px-2 py-1 text-[10px] font-bold text-[#49665e]">
              {binding}
            </code>
          ))}
        </div>
      </div>

      <div className="p-3">
        <CodeEditor value={code} onChange={setCode} onRun={handleRun} />
      </div>

      <div className="mt-auto space-y-3 border-t border-[#dfe7e4] p-4">
        {result && (
          <div
            data-testid="code-run-status"
            className={`rounded-xl px-3 py-2.5 text-xs ${
              result.status === 'success'
                ? 'bg-[#e0f3e9] text-[#21664f]'
                : 'bg-[#fff0ed] text-[#9a4235]'
            }`}
          >
            <p className="font-black">
              {result.status === 'success' ? '✓ รันสำเร็จและอัปเดตฉากแล้ว' : `✕ ${result.error}`}
            </p>
            {result.logs.map((log, index) => (
              <p key={`${log}-${index}`} className="mt-1 font-mono text-[10px] opacity-80">› {log}</p>
            ))}
          </div>
        )}

        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={handleRun}
            disabled={!snapshot || isRunning}
            className="flex-1 rounded-xl bg-[#f3a83b] px-4 py-2.5 text-xs font-black text-[#173b34] transition hover:bg-[#ffb84d] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isRunning ? 'กำลังรัน…' : hasPendingChanges ? '▶ Run changes' : '▶ Run'}
          </button>
          <button
            type="button"
            onClick={() => {
              setCode(definition.starterCode)
              setResult(undefined)
            }}
            className="rounded-xl border border-[#d4dfdb] px-3 py-2.5 text-xs font-bold text-[#527068] hover:bg-white"
          >
            คืนโค้ดเริ่มต้น
          </button>
        </div>
        <button
          type="button"
          disabled={!snapshot}
          onClick={() => snapshot && setCode(snapshotToCode(snapshot))}
          className="w-full rounded-lg px-3 py-2 text-[11px] font-bold text-[#397561] hover:bg-[#e7f1ed] disabled:opacity-50"
        >
          ↳ สร้างโค้ดจากค่าที่ปรับอยู่ตอนนี้
        </button>
      </div>
    </div>
  )
}
