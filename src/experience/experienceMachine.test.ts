import { describe, expect, it } from 'vitest'
import { INITIAL_EXPERIENCE_STATE, reduceExperience } from './experienceMachine'

describe('experience state machine', () => {
  it('tracks loading progress without moving beyond loading', () => {
    expect(
      reduceExperience(INITIAL_EXPERIENCE_STATE, {
        type: 'LOAD_PROGRESS',
        progress: 0.42,
      }),
    ).toMatchObject({ phase: 'loading', progress: 0.42, attempt: 0 })
    expect(
      reduceExperience(INITIAL_EXPERIENCE_STATE, {
        type: 'LOAD_PROGRESS',
        progress: 4,
      }).progress,
    ).toBe(0.99)
  })

  it('ignores Start until the scene is ready', () => {
    expect(
      reduceExperience(INITIAL_EXPERIENCE_STATE, { type: 'START_REQUESTED' }),
    ).toEqual(INITIAL_EXPERIENCE_STATE)
  })

  it('moves through reveal, approach, and content only on matching completion events', () => {
    const revealing = reduceExperience(INITIAL_EXPERIENCE_STATE, { type: 'SCENE_READY' })
    const ready = reduceExperience(revealing, { type: 'LOADER_REVEAL_FINISHED' })
    const approaching = reduceExperience(ready, { type: 'START_REQUESTED' })
    const content = reduceExperience(approaching, { type: 'ENTRY_MOTION_FINISHED' })
    const entered = reduceExperience(content, { type: 'CONTENT_REVEAL_FINISHED' })

    expect(revealing.phase).toBe('revealing')
    expect(ready.phase).toBe('ready')
    expect(approaching.phase).toBe('approaching')
    expect(reduceExperience(approaching, { type: 'START_REQUESTED' })).toBe(approaching)
    expect(content.phase).toBe('revealing-content')
    expect(entered.phase).toBe('entered')
  })

  it('retries a failed load with a fresh attempt', () => {
    const failed = reduceExperience(INITIAL_EXPERIENCE_STATE, {
      type: 'LOAD_FAILED',
      message: 'โหลด Mona ไม่สำเร็จ',
    })
    const retried = reduceExperience(failed, { type: 'RETRY_REQUESTED' })

    expect(failed).toMatchObject({ phase: 'error', errorMessage: 'โหลด Mona ไม่สำเร็จ' })
    expect(retried).toEqual({ phase: 'loading', progress: 0, attempt: 1 })
  })
})
