import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, renderHook, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({ getSession: vi.fn(), fetchProviderRatings: vi.fn() }))
vi.mock('../../services/auth', () => ({ getSession: (...a) => m.getSession(...a) }))
vi.mock('../../services/api', () => ({ fetchProviderRatings: (...a) => m.fetchProviderRatings(...a) }))
import { useProviderRatings } from '../../services/ratings'

beforeEach(() => {
  m.getSession.mockReset().mockReturnValue({ access_token: 'rating-token' })
  m.fetchProviderRatings.mockReset().mockResolvedValue([
    { provider_id: 7, company_name: 'Road Co', average: 4.5, count: 2 },
    { provider_id: 8, company_name: 'Safety Group', average: 3, count: 1 },
  ])
})

describe('useProviderRatings', () => {
  it('returns empty maps without a session and does not call the API', () => {
    m.getSession.mockReturnValue(null)
    const { result } = renderHook(() => useProviderRatings())
    expect(result.current).toEqual({ byId: {}, byName: {} })
    expect(m.fetchProviderRatings).not.toHaveBeenCalled()
  })
  it('indexes provider ratings by string ID and lowercase company name', async () => {
    const { result } = renderHook(() => useProviderRatings())
    await waitFor(() => expect(result.current.byId['7']).toBeDefined())
    expect(result.current.byName['road co']).toMatchObject({ average: 4.5, count: 2 })
    expect(result.current.byName['safety group']).toMatchObject({ provider_id: 8 })
    expect(m.fetchProviderRatings).toHaveBeenCalledWith('rating-token')
  })
  it('ignores failed rating requests and keeps the empty maps', async () => {
    m.fetchProviderRatings.mockRejectedValueOnce(new Error('offline'))
    const { result } = renderHook(() => useProviderRatings())
    await act(async () => {})
    expect(result.current).toEqual({ byId: {}, byName: {} })
  })
  it('ignores late results after the hook unmounts', async () => {
    let resolve
    m.fetchProviderRatings.mockReturnValueOnce(new Promise((r) => { resolve = r }))
    const { result, unmount } = renderHook(() => useProviderRatings())
    unmount()
    await act(async () => { resolve([{ provider_id: 9, company_name: 'Late Co' }]) })
    expect(result.current).toEqual({ byId: {}, byName: {} })
  })
})
