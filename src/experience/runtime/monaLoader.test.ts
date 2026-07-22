import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVrmLoader, loadMonaAsset } from './monaLoader'

function fakeLoader(result: { vrm?: VRM }, fail?: Error) {
  return {
    load: vi.fn((_url, onLoad, onProgress, onError) => {
      onProgress?.({ loaded: 50, total: 100 } as ProgressEvent<EventTarget>)
      if (fail) onError?.(fail)
      else onLoad({ userData: result })
      return {} as never
    }),
  }
}

describe('loadMonaAsset', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('registers the VRM loader plugin', () => {
    const register = vi.spyOn(GLTFLoader.prototype, 'register')

    const loader = createVrmLoader()
    const pluginFactory = register.mock.calls.at(-1)?.[0]

    expect(loader).toBeInstanceOf(GLTFLoader)
    expect(register).toHaveBeenCalled()
    expect(pluginFactory?.({ json: { extensionsUsed: [] } } as never)).toBeInstanceOf(VRMLoaderPlugin)
  })

  it('reports download progress and resolves the parsed VRM', async () => {
    const vrm = {} as VRM
    const onProgress = vi.fn()
    await expect(loadMonaAsset(fakeLoader({ vrm }) as never, '/Mona.vrm', onProgress))
      .resolves.toBe(vrm)
    expect(onProgress).toHaveBeenCalledWith(0.46)
  })

  it('rejects glTF data that does not contain a VRM', async () => {
    await expect(loadMonaAsset(fakeLoader({}) as never, '/Mona.vrm', vi.fn()))
      .rejects.toThrow('Loaded asset does not contain VRM data.')
  })

  it('forwards loader failures', async () => {
    await expect(
      loadMonaAsset(fakeLoader({}, new Error('network')) as never, '/Mona.vrm', vi.fn()),
    ).rejects.toThrow('network')
  })
})
