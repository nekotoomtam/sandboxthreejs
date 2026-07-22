export type ExperienceQuality = {
  tier: 'desktop' | 'reduced'
  pixelRatio: number
}

export function resolveLoadProgress(loaded: number, total: number) {
  if (!Number.isFinite(total) || total <= 0) return 0
  return Math.min(Math.max(loaded / total, 0), 1) * 0.92
}

export function selectExperienceQuality(input: {
  width: number
  devicePixelRatio: number
  coarsePointer: boolean
}): ExperienceQuality {
  const reduced = input.width < 768 || input.coarsePointer
  return {
    tier: reduced ? 'reduced' : 'desktop',
    pixelRatio: Math.min(input.devicePixelRatio, reduced ? 1 : 1.5),
  }
}

export function shouldShowStartMarker(ready: boolean, entered: boolean) {
  return ready && !entered
}

export const NEUTRAL_STANDING_POSE = {
  leftUpperArm: { zDegrees: -68 },
  rightUpperArm: { zDegrees: 68 },
  leftLowerArm: { zDegrees: -8 },
  rightLowerArm: { zDegrees: 8 },
} as const
