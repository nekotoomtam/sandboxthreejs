// @vitest-environment jsdom
import type { VRM } from '@pixiv/three-vrm'
import * as THREE from 'three'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { ExperienceRuntime } from './ExperienceRuntime'

const loaderSpies = vi.hoisted(() => ({
  createVrmLoader: vi.fn(),
  loadMonaAsset: vi.fn(),
}))

const controllerSpies = vi.hoisted(() => {
  const instances: Array<{
    attachTo: ReturnType<typeof vi.fn>
    setCompositionPosition: ReturnType<typeof vi.fn>
    applyEntrySample: ReturnType<typeof vi.fn>
    update: ReturnType<typeof vi.fn>
    dispose: ReturnType<typeof vi.fn>
  }> = []
  const constructor = vi.fn(function MonaControllerMock() {
    const controller = {
      attachTo: vi.fn(),
      setCompositionPosition: vi.fn(),
      applyEntrySample: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }
    instances.push(controller)
    return controller
  })
  return { constructor, instances }
})

vi.mock('./monaLoader', () => loaderSpies)
vi.mock('./MonaController', () => ({ MonaController: controllerSpies.constructor }))

describe('ExperienceRuntime', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    controllerSpies.instances.length = 0
    controllerSpies.constructor.mockImplementation(function MonaControllerMock() {
      const controller = {
        attachTo: vi.fn(),
        setCompositionPosition: vi.fn(),
        applyEntrySample: vi.fn(),
        update: vi.fn(),
        dispose: vi.fn(),
      }
      controllerSpies.instances.push(controller)
      return controller
    })
  })

  afterEach(() => {
    vi.restoreAllMocks()
    vi.unstubAllGlobals()
  })

  it('disposes a Mona controller that resolves after runtime disposal without attaching it', async () => {
    let resolveVrm!: (vrm: VRM) => void
    loaderSpies.loadMonaAsset.mockReturnValueOnce(
      new Promise<VRM>((resolve) => {
        resolveVrm = resolve
      }),
    )
    const runtime = new ExperienceRuntime()
    const loading = runtime.load('/models/mona/Mona.vrm', vi.fn())

    runtime.dispose()
    resolveVrm({} as VRM)
    await loading

    expect(controllerSpies.constructor).toHaveBeenCalledOnce()
    expect(controllerSpies.instances[0].dispose).toHaveBeenCalledOnce()
    expect(controllerSpies.instances[0].attachTo).not.toHaveBeenCalled()
  })

  it('updates the frame timer before reading its delta', () => {
    const updateTimer = vi.spyOn(THREE.Timer.prototype, 'update')
    const readDelta = vi.spyOn(THREE.Timer.prototype, 'getDelta').mockReturnValue(0.016)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const runtime = new ExperienceRuntime()

    ;(runtime as unknown as { tick: (timestamp: number) => void }).tick(250)

    expect(updateTimer).toHaveBeenCalledWith(250)
    expect(updateTimer.mock.invocationCallOrder[0])
      .toBeLessThan(readDelta.mock.invocationCallOrder[0])
    runtime.dispose()
  })

  it('starts entry once and reports completion from runtime motion', () => {
    const getDelta = vi.spyOn(THREE.Timer.prototype, 'getDelta').mockReturnValue(3.2)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const runtime = new ExperienceRuntime()
    const controller = {
      applyEntrySample: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }
    ;(runtime as unknown as { mona: typeof controller }).mona = controller
    const finished = vi.fn()

    runtime.playEntry(finished, false)
    runtime.playEntry(finished, false)
    ;(runtime as unknown as { tick: (timestamp: number) => void }).tick(3_200)

    expect(getDelta).toHaveBeenCalled()
    expect(controller.applyEntrySample).toHaveBeenLastCalledWith(
      expect.objectContaining({ progress: 1, complete: true }),
    )
    expect(finished).toHaveBeenCalledOnce()
    runtime.dispose()
  })

  it('does not advance entry time while the document is hidden', () => {
    vi.spyOn(THREE.Timer.prototype, 'getDelta').mockReturnValue(2)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const runtime = new ExperienceRuntime()
    const controller = {
      applyEntrySample: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }
    ;(runtime as unknown as { mona: typeof controller; hidden: boolean }).mona = controller
    runtime.playEntry(vi.fn(), false)
    ;(runtime as unknown as { hidden: boolean }).hidden = true
    ;(runtime as unknown as { tick: (timestamp: number) => void }).tick(2_000)

    expect(controller.applyEntrySample).not.toHaveBeenCalled()

    ;(runtime as unknown as { hidden: boolean }).hidden = false
    vi.spyOn(THREE.Timer.prototype, 'getDelta').mockReturnValue(0.016)
    ;(runtime as unknown as { tick: (timestamp: number) => void }).tick(2_016)

    expect(controller.applyEntrySample).toHaveBeenLastCalledWith(
      expect.objectContaining({ progress: 0.005 }),
    )
    runtime.dispose()
  })

  it('does not invoke a late entry completion callback after disposal', () => {
    vi.spyOn(THREE.Timer.prototype, 'getDelta').mockReturnValue(3.2)
    vi.stubGlobal('requestAnimationFrame', vi.fn(() => 1))
    vi.stubGlobal('cancelAnimationFrame', vi.fn())
    const runtime = new ExperienceRuntime()
    ;(runtime as unknown as {
      mona: {
        applyEntrySample: ReturnType<typeof vi.fn>
        update: ReturnType<typeof vi.fn>
        dispose: ReturnType<typeof vi.fn>
      }
    }).mona = {
      applyEntrySample: vi.fn(),
      update: vi.fn(),
      dispose: vi.fn(),
    }
    const finished = vi.fn()
    runtime.playEntry(finished, false)

    runtime.dispose()
    ;(runtime as unknown as { tick: (timestamp: number) => void }).tick(3_200)

    expect(finished).not.toHaveBeenCalled()
  })
})
