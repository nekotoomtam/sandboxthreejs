import { lazy, Suspense, useRef, useState } from 'react'
import type { Exercise, ExerciseResult } from '../exercises/exercise.types'
import { validateExercise } from '../exercises/validator.registry'
import { SandboxCanvas, type SandboxCanvasHandle } from '../sandbox/SandboxCanvas'
import { TransformControlsPanel } from '../sandbox/controls/TransformControlsPanel'
import { LightShadowControlsPanel } from '../sandbox/controls/LightShadowControlsPanel'
import type {
  CodeLabDefinition,
  LightShadowControlsDefinition,
  SandboxSceneDefinition,
  SandboxSnapshot,
  TransformPatch,
} from '../sandbox/sandbox.types'
import type { CodeLabHandle } from './CodeLab'

const CodeLab = lazy(() =>
  import('./CodeLab').then((module) => ({ default: module.CodeLab })),
)

type SandboxWorkspaceProps = {
  definition: SandboxSceneDefinition
  activeObjectId: string
  exercise?: Exercise
  codeLab?: CodeLabDefinition
  lightingControls?: LightShadowControlsDefinition
  onExercisePassed?: (exerciseId: string) => void
  compact?: boolean
  practical?: boolean
}

export function SandboxWorkspace({
  definition,
  activeObjectId,
  exercise,
  codeLab,
  lightingControls,
  onExercisePassed,
  compact = false,
  practical = false,
}: SandboxWorkspaceProps) {
  const canvasRef = useRef<SandboxCanvasHandle>(null)
  const codeLabRef = useRef<CodeLabHandle>(null)
  const [snapshot, setSnapshot] = useState<SandboxSnapshot>()
  const [result, setResult] = useState<ExerciseResult>()
  const [showHint, setShowHint] = useState(false)
  const [isValidating, setIsValidating] = useState(false)
  const [workspaceMode, setWorkspaceMode] = useState<'controls' | 'code'>(() =>
    practical && codeLab ? 'code' : 'controls',
  )
  const [mobilePane, setMobilePane] = useState<'code' | 'result'>('code')

  const handleTransformChange = (patch: TransformPatch) => {
    canvasRef.current?.updateObjectTransform(activeObjectId, patch)
    setResult(undefined)
  }

  const handleReset = () => {
    canvasRef.current?.reset()
    setResult(undefined)
    setShowHint(false)
  }

  const handleValidate = async () => {
    if (!exercise || isValidating) return
    setIsValidating(true)

    let currentSnapshot = canvasRef.current?.getSnapshot()
    if (workspaceMode === 'code' && codeLab) {
      const codeResult = await codeLabRef.current?.runCurrentCode()
      if (codeResult?.status !== 'success' || !codeResult.snapshot) {
        setIsValidating(false)
        return
      }
      currentSnapshot = codeResult.snapshot
    }

    if (currentSnapshot) {
      const validationResult = validateExercise(exercise.validator, currentSnapshot)
      setResult(validationResult)
      if (validationResult.passed) {
        onExercisePassed?.(exercise.id)
      }
    }

    setIsValidating(false)
  }

  const handleApplyCodeSnapshot = (nextSnapshot: SandboxSnapshot) => {
    canvasRef.current?.applySnapshot(nextSnapshot)
    setResult(undefined)
  }

  return (
    <section
      className={`overflow-hidden rounded-2xl border border-[#dbe4e0] bg-white shadow-[0_14px_40px_rgba(31,65,55,.08)]${
        practical ? ' sandbox-workspace--practical' : ''
      }`}
    >
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#e1e8e5] px-4 py-3">
        <div className="flex items-center gap-2">
          <span className="size-2 rounded-full bg-emerald-500 shadow-[0_0_0_4px_rgba(16,185,129,.12)]" />
          <span className="text-xs font-extrabold text-[#31564c]">LIVE SANDBOX</span>
          <span className="rounded-full bg-[#eef3f1] px-2 py-1 text-[10px] font-semibold text-[#72817d]">
            WebGL
          </span>
          {codeLab && (
            <div className="ml-2 flex rounded-lg bg-[#e9efed] p-1">
              <button
                type="button"
                onClick={() => setWorkspaceMode('controls')}
                className={`rounded-md px-3 py-1 text-[10px] font-black transition ${
                  workspaceMode === 'controls'
                    ? 'bg-white text-[#24564a] shadow-sm'
                    : 'text-[#72837e]'
                }`}
              >
                ปรับค่า
              </button>
              <button
                type="button"
                onClick={() => setWorkspaceMode('code')}
                className={`rounded-md px-3 py-1 text-[10px] font-black transition ${
                  workspaceMode === 'code'
                    ? 'bg-[#173f37] text-white shadow-sm'
                    : 'text-[#72837e]'
                }`}
              >
                เขียนโค้ด
              </button>
            </div>
          )}
        </div>
        <div className="flex items-center gap-2">
          <span className="hidden text-[11px] text-[#84918d] sm:inline">ลากเพื่อหมุน · เลื่อนเพื่อซูม</span>
          <button
            type="button"
            onClick={handleReset}
            className="rounded-lg border border-[#d7e1dd] px-3 py-1.5 text-xs font-bold text-[#42635a] transition hover:border-[#aac6bd] hover:bg-[#f2f7f5]"
          >
            ↺ รีเซ็ต
          </button>
        </div>
      </div>

      {practical && codeLab && (
        <div className="flex border-b border-[#e1e8e5] bg-[#f5f8f7] p-1 lg:hidden">
          <button
            type="button"
            onClick={() => setMobilePane('code')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-black ${
              mobilePane === 'code' ? 'bg-[#173f37] text-white' : 'text-[#60766f]'
            }`}
          >
            Code
          </button>
          <button
            type="button"
            onClick={() => setMobilePane('result')}
            className={`flex-1 rounded-lg px-3 py-2 text-xs font-black ${
              mobilePane === 'result' ? 'bg-[#173f37] text-white' : 'text-[#60766f]'
            }`}
          >
            Result
          </button>
        </div>
      )}

      <div
        className={`grid ${
          practical && codeLab
            ? 'lg:grid-cols-[minmax(0,45fr)_minmax(0,55fr)]'
            : workspaceMode === 'code' && codeLab
            ? 'lg:grid-cols-[minmax(0,1fr)_410px]'
            : compact
              ? 'lg:grid-cols-[minmax(0,1fr)_290px]'
              : 'lg:grid-cols-[minmax(0,1fr)_300px]'
        }`}
      >
        <div
          className={`relative min-w-0${
            practical
              ? ` lesson-result-pane order-2 ${mobilePane === 'result' ? 'block' : 'hidden'} lg:block`
              : ''
          }`}
          data-testid={practical ? 'lesson-result-pane' : undefined}
        >
          <SandboxCanvas
            ref={canvasRef}
            definition={definition}
            onSnapshot={setSnapshot}
            className={compact ? 'min-h-[430px]' : 'min-h-[520px]'}
          />
          <div className="pointer-events-none absolute bottom-4 left-4 flex items-center gap-2 rounded-lg border border-white/60 bg-white/78 px-3 py-2 text-[11px] font-medium text-[#4c6961] shadow-sm backdrop-blur-md">
            <span className="size-2 rounded-full bg-[#f3a83b]" />
            learning-cube
          </div>
          {snapshot && (
            <div className="pointer-events-none absolute right-3 top-3 min-w-[185px] rounded-xl border border-white/70 bg-[#102f2b]/88 p-3 text-white shadow-lg backdrop-blur-md">
              <div className="mb-2 flex items-center justify-between">
                <span className="text-[10px] font-black tracking-[0.12em] text-[#ffd08b]">CAMERA · ORBIT</span>
                <span className="text-[9px] text-white/50">LIVE</span>
              </div>
              <div className="grid grid-cols-3 gap-2 text-center">
                <div>
                  <p className="text-[9px] text-white/45">รอบแกน Y</p>
                  <p className="mt-0.5 font-mono text-sm font-bold" data-testid="camera-azimuth">
                    {snapshot.camera.azimuthDegrees.toFixed(1)}°
                  </p>
                </div>
                <div className="border-x border-white/10">
                  <p className="text-[9px] text-white/45">มุมเงย</p>
                  <p className="mt-0.5 font-mono text-sm font-bold">
                    {snapshot.camera.elevationDegrees.toFixed(1)}°
                  </p>
                </div>
                <div>
                  <p className="text-[9px] text-white/45">ระยะ</p>
                  <p className="mt-0.5 font-mono text-sm font-bold">
                    {snapshot.camera.distance.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        <aside
          className={`border-t border-[#e1e8e5] bg-[#fbfcfc] lg:border-t-0${
            practical
              ? ` lesson-code-pane order-1 ${mobilePane === 'code' ? 'block' : 'hidden'} lg:block lg:border-r`
              : ' lg:border-l'
          }`}
          data-testid={practical ? 'lesson-code-pane' : undefined}
        >
          {workspaceMode === 'code' && codeLab ? (
            <Suspense
              fallback={
                <div className="grid min-h-[520px] place-items-center p-5 text-sm font-bold text-[#55736b]">
                  กำลังเปิด Code Lab…
                </div>
              }
            >
              <CodeLab
                ref={codeLabRef}
                definition={codeLab}
                snapshot={snapshot}
                onApplySnapshot={handleApplyCodeSnapshot}
              />
            </Suspense>
          ) : (
            <>
              <div className="border-b border-[#e3e9e7] px-5 py-3">
                <p className="text-[11px] font-bold tracking-[0.12em] text-[#84928e]">
                  {lightingControls ? 'LIGHTING · SHADOWS' : `OBJECT · ${activeObjectId}`}
                </p>
                <p className="mt-1 text-[10px] text-[#9aa6a2]">
                  {lightingControls
                    ? 'เปิดระบบเงาและจัดตำแหน่งไฟหลัก'
                    : 'ค่าด้านล่างเปลี่ยนตัววัตถุ ไม่ใช่กล้อง'}
                </p>
              </div>
              {lightingControls ? (
                snapshot ? (
                  <LightShadowControlsPanel
                    snapshot={snapshot}
                    {...lightingControls}
                    onChange={handleApplyCodeSnapshot}
                  />
                ) : (
                  <div className="p-5 text-sm text-[#6c7d78]">
                    กำลังเตรียมแสงและเงา…
                  </div>
                )
              ) : (
                <TransformControlsPanel
                  transform={snapshot?.objects[activeObjectId]}
                  onChange={handleTransformChange}
                />
              )}
            </>
          )}
        </aside>
      </div>

      {exercise && (
        <div className="border-t border-[#dfe7e4] bg-[#173b34] px-5 py-5 text-white sm:px-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div className="max-w-2xl">
              <div className="mb-1 flex items-center gap-2">
                <span className="rounded-md bg-[#f3a83b] px-2 py-0.5 text-[10px] font-black text-[#173b34]">
                  CHALLENGE
                </span>
                <h3 className="font-extrabold">{exercise.title}</h3>
              </div>
              <p className="text-sm leading-6 text-emerald-50/70">{exercise.instruction}</p>
              {showHint && (
                <p className="mt-2 rounded-lg bg-white/8 px-3 py-2 text-xs text-[#ffd28d]">
                  คำใบ้: {exercise.hint}
                </p>
              )}
              {result && (
                <p
                  className={`mt-2 text-sm font-bold ${
                    result.passed ? 'text-[#78e0b1]' : 'text-[#ffc66e]'
                  }`}
                  role="status"
                >
                  {result.passed ? '✓ ' : '→ '}
                  {result.message}
                </p>
              )}
            </div>
            <div className="flex shrink-0 gap-2">
              <button
                type="button"
                onClick={() => setShowHint((value) => !value)}
                className="rounded-xl border border-white/15 px-4 py-2.5 text-xs font-bold text-white/75 transition hover:bg-white/8 hover:text-white"
              >
                {showHint ? 'ซ่อนคำใบ้' : 'ดูคำใบ้'}
              </button>
              <button
                type="button"
                onClick={() => void handleValidate()}
                disabled={isValidating}
                className="rounded-xl bg-[#f3a83b] px-5 py-2.5 text-xs font-black text-[#173b34] shadow-[0_8px_20px_rgba(243,168,59,.2)] transition hover:-translate-y-0.5 hover:bg-[#ffb84d] disabled:cursor-wait disabled:opacity-60"
              >
                {isValidating ? 'กำลังตรวจ…' : 'ตรวจคำตอบ'}
              </button>
            </div>
          </div>
        </div>
      )}
    </section>
  )
}
