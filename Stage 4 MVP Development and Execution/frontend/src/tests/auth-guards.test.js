import { describe, expect, it, vi } from 'vitest'
import { getSession, logout, updateSessionUser } from '../services/auth.js'

describe('Authentication session guards', () => {
  it('returns null for missing, malformed and incomplete session data', () => {
    sessionStorage.clear()
    expect(getSession()).toBeNull()
    sessionStorage.setItem('mamarSession', '{broken')
    expect(getSession()).toBeNull()
    sessionStorage.setItem('mamarSession', JSON.stringify({ access_token: 'x' }))
    expect(getSession()).toBeNull()
  })

  it('clears malformed stored sessions when read', () => {
    sessionStorage.setItem('mamarSession', '{broken')
    expect(getSession()).toBeNull()
    expect(sessionStorage.getItem('mamarSession')).toBeNull()
  })

  it('does not update the user when there is no valid session', () => {
    sessionStorage.clear()
    expect(() => updateSessionUser({ full_name: 'Updated' })).not.toThrow()
    expect(sessionStorage.getItem('mamarSession')).toBeNull()
  })

  it('clears the local session and emits the logout event', () => {
    sessionStorage.setItem('mamarSession', 'anything')
    const listener = vi.fn()
    window.addEventListener('mamar:logout', listener)
    logout(false)
    expect(sessionStorage.getItem('mamarSession')).toBeNull()
    expect(listener).toHaveBeenCalledOnce()
    window.removeEventListener('mamar:logout', listener)
  })
})
