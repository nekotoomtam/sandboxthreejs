import type { Vector3Tuple } from './sandbox.types'

const RAD_TO_DEG = 180 / Math.PI

export type CameraOrbit = {
  readonly azimuthDegrees: number
  readonly elevationDegrees: number
  readonly distance: number
}

export function calculateCameraOrbit(
  position: Vector3Tuple,
  target: Vector3Tuple,
): CameraOrbit {
  const x = position[0] - target[0]
  const y = position[1] - target[1]
  const z = position[2] - target[2]
  const horizontalDistance = Math.hypot(x, z)

  return {
    azimuthDegrees: Math.atan2(x, z) * RAD_TO_DEG,
    elevationDegrees: Math.atan2(y, horizontalDistance) * RAD_TO_DEG,
    distance: Math.hypot(x, y, z),
  }
}
