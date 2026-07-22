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
    dispose: ReturnType<typeof vi.fn>
  }> = []
  const constructor = vi.fn(function MonaControllerMock() {
    const controller = {
      attachTo: vi.fn(),
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
})
