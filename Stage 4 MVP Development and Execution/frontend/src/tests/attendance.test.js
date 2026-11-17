import { describe, expect, it } from 'vitest'
import { asDate, clock, hours, shortDay } from '../services/attendance'

describe('attendance helpers', () => {
  it('parses timestamps without a timezone as UTC', () => {
    expect(asDate('2026-01-15T10:30:00').toISOString()).toBe('2026-01-15T10:30:00.000Z')
  })

  it('preserves an explicit UTC timezone', () => {
    expect(asDate('2026-01-15T10:30:00Z').toISOString()).toBe('2026-01-15T10:30:00.000Z')
  })

  it('formats hours and remaining minutes', () => {
    expect(hours(0)).toBe('0 min')
    expect(hours(45)).toBe('45 min')
    expect(hours(60)).toBe('1 h 0 min')
    expect(hours(135)).toBe('2 h 15 min')
  })

  it('formats attendance clock and day strings', () => {
    // The displayed clock uses the machine's local timezone (Saudi Arabia is UTC+3).
    expect(clock('2026-01-15T10:30:00Z')).toMatch(/^\d{2}:\d{2}$/)
    expect(shortDay('2026-01-15T10:30:00Z')).toMatch(/15/)
  })
})
