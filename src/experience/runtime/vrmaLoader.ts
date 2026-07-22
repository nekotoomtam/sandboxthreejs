import {
  createVRMAnimationClip,
  VRMAnimationLoaderPlugin,
  VRMLookAtQuaternionProxy,
  type VRMAnimation,
} from '@pixiv/three-vrm-animation'
import type { VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { resolveLoadProgress } from './experienceRuntime.helpers'

type LoaderPort = Pick<GLTFLoader, 'load'>

export function createVrmaLoader() {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMAnimationLoaderPlugin(parser))
  return loader
}

export function loadVrmaClip(
  loader: LoaderPort,
  url: string,
  vrm: VRM,
  onProgress: (progress: number) => void,
) {
  return new Promise<import('three').AnimationClip>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const animation = (gltf.userData.vrmAnimations as VRMAnimation[] | undefined)?.[0]
        if (!animation) {
          reject(new Error('Loaded asset does not contain VRM animation data.'))
          return
        }
        if (
          vrm.lookAt &&
          !vrm.scene.children.some((child) => child instanceof VRMLookAtQuaternionProxy)
        ) {
          const lookAtProxy = new VRMLookAtQuaternionProxy(vrm.lookAt)
          lookAtProxy.name = 'VRMLookAtQuaternionProxy'
          vrm.scene.add(lookAtProxy)
        }
        const clip = createVRMAnimationClip(animation, vrm)
        clip.name = 'Mona_Idle_Calm'
        resolve(clip)
      },
      (event) => onProgress(resolveLoadProgress(event.loaded, event.total)),
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    )
  })
}
