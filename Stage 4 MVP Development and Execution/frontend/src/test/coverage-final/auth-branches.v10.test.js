import { afterEach, beforeAll, beforeEach, describe, expect, it, vi } from 'vitest'

const api = vi.hoisted(() => ({ getCurrentUser: vi.fn() }))
vi.mock('../../services/api', () => ({ getCurrentUser: (...a) => api.getCurrentUser(...a) }))
let auth
function tokenFor(userId, role = 'contractor') {
  const payload = btoa(JSON.stringify({ exp: Math.floor(Date.now() / 1000) + 3600, role, sub: String(userId) }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `header.${payload}.signature`
}
function session(userId, role = 'contractor') {
  return { access_token: tokenFor(userId, role), token_type: 'bearer', user: { user_id: userId, role, name: `User ${userId}` } }
}
beforeAll(async () => {
  vi.stubGlobal('BroadcastChannel', undefined)
  vi.resetModules()
  auth = await import('../../services/auth')
})
beforeEach(() => {
  sessionStorage.clear()
  api.getCurrentUser.mockReset().mockImplementation(async (token) => {
    const claims = JSON.parse(atob(token.split('.')[1].replace(/-/g, '+').replace(/_/g, '/')))
    return { user_id: Number(claims.sub), role: claims.role }
  })
})
afterEach(() => { vi.unstubAllGlobals() })

describe('auth branch completion', () => {
  it('clears prior account data but preserves session and pending registration keys', () => {
    auth.saveSession(session(1))
    sessionStorage.setItem('privateProjectDraft', 'old-account')
    sessionStorage.setItem('mamarPendingRegistration', '{"email":"pending@example.com"}')
    auth.saveSession(session(2, 'provider'))
    expect(sessionStorage.getItem('privateProjectDraft')).toBeNull()
    expect(sessionStorage.getItem('mamarPendingRegistration')).toContain('pending@example.com')
    expect(auth.getSession().user.user_id).toBe(2)
  })
  it('caches a successfully verified token for subsequent checks', async () => {
    auth.saveSession(session(7))
    await expect(auth.verifySession()).resolves.toBe(true)
    await expect(auth.verifySession()).resolves.toBe(true)
    expect(api.getCurrentUser).toHaveBeenCalledTimes(1)
  })
  it('returns false when no cross-tab channel is available', async () => {
    await expect(auth.requestSession()).resolves.toBe(false)
  })
  it('does not update session when update data is absent', () => {
    auth.saveSession(session(8))
    const before = auth.getSession().user
    auth.updateSessionUser(null)
    expect(auth.getSession().user).toEqual(before)
  })
})
