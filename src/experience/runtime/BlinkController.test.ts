import { describe, expect, it } from 'vitest'
import { BlinkController } from './BlinkController'

describe('BlinkController', () => {
  it('waits at least 2.5 seconds before closing the eyes', () => {
    const blink = new BlinkController(() => 0)

    expect(blink.update(2.49)).toBe(0)
    expect(blink.update(0.01)).toBe(0)
    expect(blink.update(0.0375)).toBeCloseTo(0.5)
  })

  it('closes, holds, and opens with bounded weights', () => {
    const blink = new BlinkController(() => 0.5)
    blink.update(4)

    const samples = [0.04, 0.04, 0.04, 0.1].map((delta) => blink.update(delta))
    expect(samples.every((weight) => weight >= 0 && weight <= 1)).toBe(true)
    expect(Math.max(...samples)).toBe(1)
    expect(samples.at(-1)).toBe(0)
  })

  it('can schedule one double blink without entering an endless chain', () => {
    const blink = new BlinkController(() => 0)
    blink.update(2.5)
    blink.update(0.075)
    blink.update(0.04)
    blink.update(0.1)

    expect(blink.update(0.119)).toBe(0)
    expect(blink.update(0.001)).toBe(0)
    expect(blink.update(0.0375)).toBeCloseTo(0.5)

    blink.update(0.0375)
    blink.update(0.04)
    expect(blink.update(0.1)).toBe(0)
    expect(blink.update(2.49)).toBe(0)
  })
})
