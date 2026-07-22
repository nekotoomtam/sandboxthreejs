type BlinkPhase = 'waiting' | 'closing' | 'closed' | 'opening' | 'double-gap'

const CLOSING_SECONDS = 0.075
const CLOSED_SECONDS = 0.04
const OPENING_SECONDS = 0.1
const DOUBLE_GAP_SECONDS = 0.12
const DOUBLE_BLINK_CHANCE = 0.12

export class BlinkController {
  private phase: BlinkPhase = 'waiting'
  private elapsed = 0
  private duration: number
  private doubleBlinkAvailable = true

  constructor(private readonly random: () => number = Math.random) {
    this.duration = this.nextWait()
  }

  update(deltaSeconds: number): number {
    this.elapsed += Math.max(0, deltaSeconds)
    while (this.elapsed >= this.duration) {
      this.elapsed -= this.duration
      this.advance()
    }

    const progress = this.duration === 0 ? 1 : this.elapsed / this.duration
    if (this.phase === 'closing') return Math.min(1, progress)
    if (this.phase === 'closed') return 1
    if (this.phase === 'opening') return Math.max(0, 1 - progress)
    return 0
  }

  private advance() {
    if (this.phase === 'waiting' || this.phase === 'double-gap') {
      this.phase = 'closing'
      this.duration = CLOSING_SECONDS
      return
    }
    if (this.phase === 'closing') {
      this.phase = 'closed'
      this.duration = CLOSED_SECONDS
      return
    }
    if (this.phase === 'closed') {
      this.phase = 'opening'
      this.duration = OPENING_SECONDS
      return
    }
    if (this.doubleBlinkAvailable && this.random() < DOUBLE_BLINK_CHANCE) {
      this.phase = 'double-gap'
      this.duration = DOUBLE_GAP_SECONDS
      this.doubleBlinkAvailable = false
      return
    }
    this.phase = 'waiting'
    this.duration = this.nextWait()
    this.doubleBlinkAvailable = true
  }

  private nextWait() {
    return 2.5 + this.random() * 3
  }
}
