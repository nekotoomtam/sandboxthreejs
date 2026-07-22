import { describe, expect, it, vi } from 'vitest'
import type { VRM } from '@pixiv/three-vrm'
import { loadMonaAsset } from './monaLoader'

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
