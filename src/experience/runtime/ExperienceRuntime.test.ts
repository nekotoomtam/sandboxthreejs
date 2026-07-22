// @vitest-environment jsdom
import type { VRM } from '@pixiv/three-vrm'
import { beforeEach, describe, expect, it, vi } from 'vitest'
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
})
