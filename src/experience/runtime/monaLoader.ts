import { VRMLoaderPlugin, type VRM } from '@pixiv/three-vrm'
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js'
import { resolveLoadProgress } from './experienceRuntime.helpers'

type LoaderPort = Pick<GLTFLoader, 'load'>

export function createVrmLoader() {
  const loader = new GLTFLoader()
  loader.register((parser) => new VRMLoaderPlugin(parser))
  return loader
}

export function loadMonaAsset(
  loader: LoaderPort,
  url: string,
  onProgress: (progress: number) => void,
) {
  return new Promise<VRM>((resolve, reject) => {
    loader.load(
      url,
      (gltf) => {
        const vrm = gltf.userData.vrm as VRM | undefined
        if (!vrm) {
          reject(new Error('Loaded asset does not contain VRM data.'))
          return
        }
        resolve(vrm)
      },
      (event) => onProgress(resolveLoadProgress(event.loaded, event.total)),
      (error) => reject(error instanceof Error ? error : new Error(String(error))),
    )
  })
}
