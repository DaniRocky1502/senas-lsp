export class ScoreAnimator {
  private shown = 0
  private lastTime: number | null = null

  update(target: number, nowMs: number): number {
    if (this.lastTime === null) {
      this.lastTime = nowMs
      return this.shown
    }
    const dt = Math.max(0, nowMs - this.lastTime) / 1000
    this.lastTime = nowMs
    this.shown += (target - this.shown) * (1 - Math.exp(-dt / 0.25))
    return this.shown
  }

  reset(value = 0): void {
    this.shown = value
    this.lastTime = null
  }
}

export class AcceptanceTracker {
  private startedAt: number | null = null
  private accepted = false
  private readonly threshold: number
  private readonly holdMs: number

  constructor(threshold = 0.9, holdMs = 2000) {
    this.threshold = threshold
    this.holdMs = holdMs
  }

  update(score: number, nowMs: number): boolean {
    if (score < this.threshold) {
      this.reset()
      return false
    }
    if (this.accepted) return false
    if (this.startedAt === null) this.startedAt = nowMs
    if (nowMs - this.startedAt < this.holdMs) return false
    this.accepted = true
    return true
  }

  holdProgress(nowMs: number): number {
    if (this.startedAt === null) return 0
    return Math.min(1, (nowMs - this.startedAt) / this.holdMs)
  }

  reset(): void {
    this.startedAt = null
    this.accepted = false
  }
}
