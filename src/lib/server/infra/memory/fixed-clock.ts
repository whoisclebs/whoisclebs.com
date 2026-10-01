import type { Clock } from '../../ports/clock'

/** Relógio controlável para testes. */
export class FixedClock implements Clock {
  private current: Date

  constructor(iso: string) {
    this.current = new Date(iso)
  }

  now(): Date {
    return new Date(this.current)
  }

  set(iso: string): void {
    this.current = new Date(iso)
  }
}
