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

  it('moves from ready through entering to entered', () => {
    const ready = reduceExperience(INITIAL_EXPERIENCE_STATE, {
      type: 'LOAD_SUCCEEDED',
    })
    const entering = reduceExperience(ready, { type: 'START_REQUESTED' })
    const entered = reduceExperience(entering, {
      type: 'ENTRY_TRANSITION_FINISHED',
    })

    expect(ready.phase).toBe('ready')
    expect(entering.phase).toBe('entering')
    expect(reduceExperience(entering, { type: 'START_REQUESTED' })).toBe(entering)
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
