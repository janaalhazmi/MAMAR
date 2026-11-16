import { beforeEach, describe, expect, it } from 'vitest'
import * as flow from '../projectFlow.js'

describe('Contractor project-flow domain logic', () => {
  beforeEach(() => sessionStorage.clear())

  it('parses server timestamps as UTC and rejects invalid values', () => {
    expect(flow.parseServerDate(null)).toBeNull()
    expect(flow.parseServerDate('not-a-date')).toBeNull()
    expect(flow.parseServerDate('2026-01-15T10:30:00').toISOString()).toBe('2026-01-15T10:30:00.000Z')
    expect(flow.parseServerDate('2026-01-15T10:30:00+03:00').toISOString()).toBe('2026-01-15T07:30:00.000Z')
  })

  it('formats invalid and valid dates, ranges and prices', () => {
    expect(flow.formatDate('')).toBe('Not specified')
    expect(flow.formatDate('bad-date')).toBe('bad-date')
    expect(flow.formatDateRange('', '2026-01-01')).toBe('Not specified')
    expect(flow.formatPrice(12500)).toBe('SAR 12,500')
    expect(flow.formatTime('bad-date')).toBe('')
    expect(flow.formatDateTime('bad-date')).toBe('')
  })

  it('normalizes relative and absolute photo URLs', () => {
    expect(flow.absUrl('')).toBe('')
    expect(flow.absUrl('https://cdn.example.com/a.jpg')).toBe('https://cdn.example.com/a.jpg')
    expect(flow.absUrl('/photos/a.jpg')).toMatch(/\/photos\/a\.jpg$/)
    expect(flow.toUiPhoto({ photo_id: 4, url: '/photos/a.jpg', caption: '', created_at: 'bad' }))
      .toMatchObject({ id: 4, caption: 'Site photo', time: '' })
  })

  it('provides a stable default project and maps a saved project id', () => {
    expect(flow.getCurrentProject()).toMatchObject({ id: null, name: '', services: [] })
    sessionStorage.setItem(flow.KEYS.project, JSON.stringify({ projectId: 15, name: 'Night work' }))
    expect(flow.getCurrentProject()).toMatchObject({ id: 15, name: 'Night work' })
  })

  it('reads selected providers safely and persists quote selections', () => {
    expect(flow.getSelectedProviderIds()).toEqual([])
    sessionStorage.setItem(flow.KEYS.providerIds, '{broken')
    expect(flow.getSelectedProviderIds()).toEqual([])
    flow.saveSelectedQuotation(27)
    expect(flow.getSelectedQuotationId()).toBe(27)
    expect(flow.getConfirmedQuotationId()).toBeNull()
  })

  it('returns a cached quotation and null when no project is selected', async () => {
    sessionStorage.setItem(flow.KEYS.quotesCache, JSON.stringify([{ id: 3, price: 100 }]))
    await expect(flow.getQuotationById('3')).resolves.toEqual({ id: 3, price: 100 })
    sessionStorage.removeItem(flow.KEYS.quotesCache)
    await expect(flow.getQuotationById(3)).resolves.toBeNull()
  })

  it('reads selected provider ids from storage', () => {
    sessionStorage.setItem(flow.KEYS.providerIds, JSON.stringify([2, 4]))
    expect(flow.getSelectedProviderIds()).toEqual([2, 4])
  })

  it('requires a selected project before loading or rejecting quotations', async () => {
    await expect(flow.getQuotations(null)).rejects.toThrow(/sign in/i)
    await expect(flow.rejectQuotation(3)).rejects.toThrow(/sign in/i)
  })

  it('requires a project before fetching monitoring and completion data', async () => {
    await expect(flow.getMonitoringData(null)).rejects.toThrow(/sign in/i)
    await expect(flow.getCompletionData(null)).rejects.toThrow(/sign in/i)
  })
})
