import {
  VRMAnimation,
  VRMAnimationLoaderPlugin,
  VRMLookAtQuaternionProxy,
} from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import { Group } from 'three'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { afterEach, describe, expect, it, vi } from 'vitest'
import { createVrmaLoader, loadVrmaClip } from './vrmaLoader'

function emptyAnimation(duration = 5) {
  const animation = new VRMAnimation()
  animation.duration = duration
  return animation
}

function fakeLoader(result: { vrmAnimations?: VRMAnimation[] }, fail?: Error) {
  return {
    load: vi.fn((_url, onLoad, onProgress, onError) => {
      onProgress?.({ loaded: 50, total: 100 } as ProgressEvent<EventTarget>)
      if (fail) onError?.(fail)
      else onLoad({ userData: result })
      return {} as never
    }),
  }
}

describe('vrmaLoader', () => {
  afterEach(() => vi.restoreAllMocks())

  it('registers the VRM animation loader plugin', () => {
    const register = vi.spyOn(GLTFLoader.prototype, 'register')
    const loader = createVrmaLoader()
    const factory = register.mock.calls.at(-1)?.[0]

    expect(loader).toBeInstanceOf(GLTFLoader)
    expect(factory?.({ json: {} } as never)).toBeInstanceOf(VRMAnimationLoaderPlugin)
  })

  it('reports progress and creates a named five-second clip', async () => {
    const onProgress = vi.fn()
    const vrm = {
      meta: { metaVersion: '1' },
      humanoid: {},
      expressionManager: undefined,
      lookAt: undefined,
    } as unknown as VRM

    const clip = await loadVrmaClip(
      fakeLoader({ vrmAnimations: [emptyAnimation()] }) as never,
      '/models/mona/animations/idle.vrma',
      vrm,
      onProgress,
    )

    expect(onProgress).toHaveBeenCalledWith(0.46)
    expect(clip.name).toBe('Mona_Idle_Calm')
    expect(clip.duration).toBe(5)
  })

  it('creates the named LookAt proxy before converting a clip', async () => {
    const warn = vi.spyOn(console, 'warn').mockImplementation(() => undefined)
    const scene = new Group()
    const vrm = {
      scene,
      meta: { metaVersion: '1' },
      humanoid: {},
      expressionManager: undefined,
      lookAt: {},
    } as unknown as VRM

    await loadVrmaClip(
      fakeLoader({ vrmAnimations: [emptyAnimation()] }) as never,
      '/models/mona/animations/idle.vrma',
      vrm,
      vi.fn(),
    )

    const proxy = scene.children.find((child) => child instanceof VRMLookAtQuaternionProxy)
    expect(proxy?.name).toBe('VRMLookAtQuaternionProxy')
    expect(warn).not.toHaveBeenCalled()
  })

  it('rejects a file without VRM animation data', async () => {
    await expect(
      loadVrmaClip(fakeLoader({}) as never, '/idle.vrma', {} as VRM, vi.fn()),
    ).rejects.toThrow('Loaded asset does not contain VRM animation data.')
  })

  it('forwards loader failures', async () => {
    await expect(
      loadVrmaClip(
        fakeLoader({}, new Error('animation network failure')) as never,
        '/idle.vrma',
        {} as VRM,
        vi.fn(),
      ),
    ).rejects.toThrow('animation network failure')
  })
})
