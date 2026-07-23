import type { SandboxSceneDefinition } from './sandbox.types'

export const DEFAULT_SANDBOX_SCENE: SandboxSceneDefinition = {
  background: '#eaf1ee',
  renderer: {
    shadowMapEnabled: false,
  },
  camera: {
    position: [4.6, 3.5, 5.4],
    target: [0, 0.5, 0],
    fieldOfView: 45,
  },
  helpers: {
    grid: true,
    axes: true,
  },
  objects: [
    {
      id: 'learning-cube',
      label: 'Learning cube',
      geometry: { kind: 'box', size: [1.45, 1.45, 1.45] },
      material: {
        color: '#f3a83b',
        roughness: 0.48,
        metalness: 0.05,
      },
      position: [0, 0.75, 0],
      rotation: [0, 0, 0],
      scale: [1, 1, 1],
    },
  ],
}
