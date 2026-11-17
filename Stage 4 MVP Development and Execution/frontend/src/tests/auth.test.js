import { beforeEach, describe, expect, it, vi } from 'vitest'

vi.mock('../services/api', () => ({ getCurrentUser: vi.fn() }))
import { getCurrentUser } from '../services/api'
import {
  getSession, logout, saveSession, updateSessionUser, verifySession,
} from '../services/auth'

function makeToken({ exp = Math.floor(Date.now() / 1000) + 3600, role = 'contractor', sub = '7' } = {}) {
  const payload = btoa(JSON.stringify({ exp, role, sub }))
    .replace(/=/g, '').replace(/\+/g, '-').replace(/\//g, '_')
  return `header.${payload}.signature`
}
const session = () => ({
  access_token: makeToken(),
  token_type: 'bearer',
  user: { user_id: 7, role: 'contractor', name: 'Jana' },
})

describe('authentication/session service', () => {
  beforeEach(() => {
    sessionStorage.clear()
    vi.clearAllMocks()
  })

  it('returns null when there is no saved session', () => {
    expect(getSession()).toBeNull()
  })

  it('saves and reads a valid JWT session', () => {
    saveSession(session())
    expect(getSession()).toMatchObject({
      user: { user_id: 7, role: 'contractor' },
      expiresAt: expect.any(Number),
    })
  })

  it('rejects malformed session data', () => {
    sessionStorage.setItem('mamarSession', '{bad json')
    expect(getSession()).toBeNull()
    expect(sessionStorage.getItem('mamarSession')).toBeNull()
  })

  it('rejects an expired token', () => {
    const expired = session()
    expired.access_token = makeToken({ exp: Math.floor(Date.now() / 1000) - 10 })
    sessionStorage.setItem('mamarSession', JSON.stringify(expired))
    expect(getSession()).toBeNull()
  })

  it('rejects a token whose role or user id differs from the saved user', () => {
    const invalid = session()
    invalid.access_token = makeToken({ role: 'provider', sub: '99' })
    sessionStorage.setItem('mamarSession', JSON.stringify(invalid))
    expect(getSession()).toBeNull()
  })

  it('throws when saving a response without an access token or role', () => {
    expect(() => saveSession({ user: { user_id: 7 } })).toThrow('Invalid login response.')
  })

  it('verifies a valid user with the backend', async () => {
    saveSession(session())
    getCurrentUser.mockResolvedValue({ user_id: 7, role: 'contractor' })
    await expect(verifySession()).resolves.toBe(true)
    expect(getCurrentUser).toHaveBeenCalledWith(expect.any(String))
  })

  it('logs out when backend verification returns a different user', async () => {
    saveSession(session())
    getCurrentUser.mockResolvedValue({ user_id: 99, role: 'contractor' })
    await expect(verifySession()).resolves.toBe(false)
    expect(getSession()).toBeNull()
  })

  it('keeps the session during temporary network failures', async () => {
    saveSession(session())
    getCurrentUser.mockRejectedValue(new Error('offline'))
    await expect(verifySession()).resolves.toBe(true)
    expect(getSession()).not.toBeNull()
  })

  it('logs out when the backend says the token is unauthorized', async () => {
    saveSession(session())
    getCurrentUser.mockRejectedValue(Object.assign(new Error('unauthorized'), { status: 401 }))
    await expect(verifySession()).resolves.toBe(false)
    expect(getSession()).toBeNull()
  })

  it('updates user data and dispatches the session update event', () => {
    saveSession(session())
    const listener = vi.fn()
    window.addEventListener('mamar:session-user-updated', listener)
    updateSessionUser({ name: 'New Name' })
    expect(getSession().user.name).toBe('New Name')
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('mamar:session-user-updated', listener)
  })

  it('clears the current session and emits logout event', () => {
    saveSession(session())
    const listener = vi.fn()
    window.addEventListener('mamar:logout', listener)
    logout(false)
    expect(getSession()).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('mamar:logout', listener)
  })
})
