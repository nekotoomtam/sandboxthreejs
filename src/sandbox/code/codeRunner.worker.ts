import * as THREE from 'three'
import { calculateCameraOrbit } from '../cameraMath'
import type { SandboxSnapshot, Vector3Tuple } from '../sandbox.types'
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

workerScope.addEventListener('message', (event) => {
  const { code, initialSnapshot } = event.data
  const logs: string[] = []
  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(45, 1, 0.1, 100)
  const geometry = new THREE.BoxGeometry(1.45, 1.45, 1.45)
  const material = new THREE.MeshStandardMaterial({ color: '#f3a83b' })
  const cube = new THREE.Mesh(geometry, material)
  const initialCube = initialSnapshot.objects['learning-cube']
  const target = new THREE.Vector3().fromArray(initialSnapshot.camera.target)

  scene.add(cube)
  camera.position.fromArray(initialSnapshot.camera.position)
  camera.lookAt(target)

  if (initialCube) {
    cube.position.fromArray(initialCube.position)
    cube.rotation.set(
      initialCube.rotation[0] * DEG_TO_RAD,
      initialCube.rotation[1] * DEG_TO_RAD,
      initialCube.rotation[2] * DEG_TO_RAD,
    )
    cube.scale.fromArray(initialCube.scale)
  }

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
      'console',
      `"use strict";\n${code}`,
    )
    execute(THREE, scene, camera, cube, sandboxConsole)

    const cameraPosition: Vector3Tuple = [
      camera.position.x,
      camera.position.y,
      camera.position.z,
    ]
    const cameraTarget: Vector3Tuple = [target.x, target.y, target.z]
    const snapshot: SandboxSnapshot = {
      objects: {
        'learning-cube': {
          position: [cube.position.x, cube.position.y, cube.position.z],
          rotation: [
            cube.rotation.x * RAD_TO_DEG,
            cube.rotation.y * RAD_TO_DEG,
            cube.rotation.z * RAD_TO_DEG,
          ],
          scale: [cube.scale.x, cube.scale.y, cube.scale.z],
        },
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
    scene.clear()
  }
})
