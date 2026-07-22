export const ENTRY_DURATION_MS = 3_200

export type EntryTimelineSample = {
  progress: number
  cameraProgress: number
  turnProgress: number
  railOpacity: number
  complete: boolean
}

const clamp01 = (value: number) => Math.min(Math.max(value, 0), 1)

const smoothstep = (value: number) => {
  const progress = clamp01(value)
  return progress * progress * (3 - 2 * progress)
}

const sampleRange = (elapsedMs: number, startMs: number, endMs: number) =>
  smoothstep((elapsedMs - startMs) / (endMs - startMs))

export function sampleEntryTimeline(
  elapsedMs: number,
  reducedMotion: boolean,
): EntryTimelineSample {
  if (reducedMotion) {
    return {
      progress: 1,
      cameraProgress: 1,
      turnProgress: 1,
      railOpacity: 0,
      complete: true,
    }
  }

  const progress = clamp01(elapsedMs / ENTRY_DURATION_MS)

  return {
    progress,
    cameraProgress: sampleRange(elapsedMs, 150, ENTRY_DURATION_MS),
    turnProgress: sampleRange(elapsedMs, 450, 2_850),
    railOpacity: 1 - sampleRange(elapsedMs, 0, 250),
    complete: elapsedMs >= ENTRY_DURATION_MS,
  }
}
