import { describe, expect, it } from 'vitest'
import {
  getPictureUrl,
  formatProfileDate,
  getProfileInitial,
} from '../services/Contractor/profileUtils'

describe('profileUtils', () => {
  describe('getPictureUrl', () => {
    it('returns an empty string when the profile has no picture', () => {
      expect(getPictureUrl({})).toBe('')
      expect(getPictureUrl(null)).toBe('')
    })

    it('keeps an absolute image URL unchanged', () => {
      expect(getPictureUrl({ profile_picture_url: 'https://example.com/a.png' }))
        .toBe('https://example.com/a.png')
    })

    it('uses the API base URL for a relative image path', () => {
      expect(getPictureUrl({ profile_picture: '/uploads/a.png' }))
        .toMatch(/^https?:\/\/[^/]+\/uploads\/a\.png$/)
    })
  })

  describe('formatProfileDate', () => {
    it('returns an em dash for an empty date', () => {
      expect(formatProfileDate('')).toBe('—')
      expect(formatProfileDate(null)).toBe('—')
    })

    it('returns the original value when the date is invalid', () => {
      expect(formatProfileDate('not-a-date')).toBe('not-a-date')
    })

    it('formats a valid date in day-month-year order', () => {
      expect(formatProfileDate('2025-01-15T12:00:00Z')).toMatch(/15.*January.*2025/)
    })
  })

  describe('getProfileInitial', () => {
    it('returns the uppercase first letter after trimming spaces', () => {
      expect(getProfileInitial(' jana')).toBe('J')
    })

    it('falls back to U when the name is empty', () => {
      expect(getProfileInitial('')).toBe('U')
      expect(getProfileInitial(null)).toBe('U')
    })
  })
})
