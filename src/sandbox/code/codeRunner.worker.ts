import * as THREE from 'three'
import { calculateCameraOrbit } from '../cameraMath'
import type {
  SandboxObjectState,
  SandboxSnapshot,
  Vector3Tuple,
} from '../sandbox.types'
import type { CodeRunRequest, CodeRunResult } from './code.types'

type WorkerScope = {
  addEventListener: (
    type: 'message',
    listener: (event: MessageEvent<CodeRunRequest>) => void,
  ) => void
  postMessage: (message: CodeRunResult) => void
}

const workerScope = self as unknown as WorkerScope
const RAD_TO_DEG = 180 / Math.PI
const DEG_TO_RAD = Math.PI / 180

function formatLogValue(value: unknown) {
  if (typeof value === 'string') return value
  if (typeof value === 'number' || typeof value === 'boolean' || value == null) {
    return String(value)
  }

  try {
    return JSON.stringify(value)
  } catch {
    return String(value)
  }
}

function applyObjectState(
  object: THREE.Object3D,
  state: SandboxObjectState | undefined,
) {
  if (!state) return

  object.position.fromArray(state.position)
  object.rotation.set(
    state.rotation[0] * DEG_TO_RAD,
    state.rotation[1] * DEG_TO_RAD,
    state.rotation[2] * DEG_TO_RAD,
  )
  object.scale.fromArray(state.scale)
  object.castShadow = state.castShadow
  object.receiveShadow = state.receiveShadow
}

function objectState(object: THREE.Object3D): SandboxObjectState {
  return {
    position: [object.position.x, object.position.y, object.position.z],
    rotation: [
      object.rotation.x * RAD_TO_DEG,
      object.rotation.y * RAD_TO_DEG,
      object.rotation.z * RAD_TO_DEG,
    ],
    scale: [object.scale.x, object.scale.y, object.scale.z],
    castShadow: object.castShadow,
    receiveShadow: object.receiveShadow,
  }
}

workerScope.addEventListener('message', (event) => {
  const { code, initialSnapshot } = event.data
  const logs: string[] = []
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  const geometry = new THREE.BoxGeometry(1.45, 1.45, 1.45)
  const material = new THREE.MeshStandardMaterial({ color: '#f3a83b' })
  const cube = new THREE.Mesh(geometry, material)
  const floorGeometry = new THREE.BoxGeometry(10, 0.1, 10)
  const floorMaterial = new THREE.MeshStandardMaterial()
  const floor = new THREE.Mesh(floorGeometry, floorMaterial)
  const initialCube = initialSnapshot.objects['learning-cube']
  const initialFloor = initialSnapshot.objects['shadow-floor']
  const initialLight = initialSnapshot.lights['key-light']
  const light = new THREE.DirectionalLight(
    0xffffff,
    initialLight?.intensity ?? 1,
  )
  const renderer = {
    shadowMap: {
      enabled: initialSnapshot.renderer.shadowMapEnabled,
    },
  }
  const target = new THREE.Vector3().fromArray(initialSnapshot.camera.target)

  scene.add(cube)
  camera.position.fromArray(initialSnapshot.camera.position)
  camera.lookAt(target)
  applyObjectState(cube, initialCube)
  applyObjectState(floor, initialFloor)
  light.position.fromArray(initialLight?.position ?? [1, 4, 3])
  light.castShadow = initialLight?.castShadow ?? false

  const sandboxConsole = {
    log: (...values: unknown[]) => logs.push(values.map(formatLogValue).join(' ')),
    warn: (...values: unknown[]) => logs.push(`⚠ ${values.map(formatLogValue).join(' ')}`),
    error: (...values: unknown[]) => logs.push(`✕ ${values.map(formatLogValue).join(' ')}`),
  }

  try {
    const execute = new Function(
      'THREE',
      'scene',
      'camera',
      'cube',
      'renderer',
      'floor',
      'light',
      'console',
      `"use strict";\n${code}`,
    )
    execute(
      THREE,
      scene,
      camera,
      cube,
      renderer,
      floor,
      light,
      sandboxConsole,
    )

    const cameraPosition: Vector3Tuple = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]
    const cameraTarget: Vector3Tuple = [target.x, target.y, target.z]
    const lightPosition: Vector3Tuple = [
      light.position.x,
      light.position.y,
      light.position.z,
    ]
    const snapshot: SandboxSnapshot = {
      objects: {
        ...initialSnapshot.objects,
        'learning-cube': objectState(cube),
        ...(initialFloor ? { 'shadow-floor': objectState(floor) } : {}),
      },
      renderer: {
        shadowMapEnabled: renderer.shadowMap.enabled,
      },
      lights: {
        ...initialSnapshot.lights,
        ...(initialLight
          ? {
              'key-light': {
                kind: 'directional' as const,
                position: lightPosition,
                intensity: light.intensity,
                castShadow: light.castShadow,
              },
            }
          : {}),
      },
      camera: {
        position: cameraPosition,
        target: cameraTarget,
        ...calculateCameraOrbit(cameraPosition, cameraTarget),
      },
    }

    workerScope.postMessage({ status: 'success', snapshot, logs })
  } catch (error) {
    workerScope.postMessage({
      status: 'error',
      logs,
      error: error instanceof Error ? `${error.name}: ${error.message}` : String(error),
    })
  } finally {
    geometry.dispose()
    material.dispose()
    floorGeometry.dispose()
    floorMaterial.dispose()
    scene.clear()
  }
})
