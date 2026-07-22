import { describe, expect, it } from 'vitest'
import { ENTRY_DURATION_MS, sampleEntryTimeline } from './entryTimeline'

describe('sampleEntryTimeline', () => {
  it('honors camera, turn, settle, and completion boundaries', () => {
    expect(ENTRY_DURATION_MS).toBe(3_200)
    expect(sampleEntryTimeline(0, false)).toMatchObject({
      progress: 0,
      cameraProgress: 0,
      turnProgress: 0,
      railOpacity: 1,
      complete: false,
    })
    expect(sampleEntryTimeline(150, false).cameraProgress).toBe(0)
    expect(sampleEntryTimeline(450, false).turnProgress).toBe(0)
    expect(sampleEntryTimeline(2_850, false).turnProgress).toBe(1)
    expect(sampleEntryTimeline(3_200, false)).toMatchObject({
      progress: 1,
      cameraProgress: 1,
      turnProgress: 1,
      railOpacity: 0,
      complete: true,
    })
  })

  it('clamps samples before and after the entry window', () => {
    expect(sampleEntryTimeline(-100, false).progress).toBe(0)
    expect(sampleEntryTimeline(9_000, false)).toMatchObject({
      progress: 1,
      cameraProgress: 1,
      turnProgress: 1,
      complete: true,
    })
  })

  it('jumps to the stable final sample for reduced motion', () => {
    expect(sampleEntryTimeline(0, true)).toMatchObject({
      progress: 1,
      cameraProgress: 1,
      turnProgress: 1,
      railOpacity: 0,
      complete: true,
    })
  })
})
