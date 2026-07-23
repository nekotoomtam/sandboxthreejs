import type { ObjectTransform } from '../sandbox/sandbox.types'

export const MATCH_TARGET_TRANSFORM: ObjectTransform = {
  position: [1.5, 1, -0.5],
  rotation: [0, 45, 0],
  scale: [1.25, 0.75, 1.25],
}

export const MATCH_TARGET_TOLERANCE = {
  position: 0.05,
  rotation: 2,
  scale: 0.05,
} as const
