import { beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const auth = vi.hoisted(() => ({
  getSession: vi.fn(),
  logout: vi.fn(),
  verifySession: vi.fn(),
  requestSession: vi.fn(),
}))
vi.mock('../../services/auth.js', () => auth)

import ProtectedRoute from '../ProtectedRoute.jsx'

function renderRoute(roles = ['contractor']) {
  return render(
    <MemoryRouter initialEntries={['/private?tab=projects']}>
      <Routes>
        <Route path="/private" element={<ProtectedRoute roles={roles}><h1>Private dashboard</h1></ProtectedRoute>} />
        <Route path="/login" element={<h1>Login destination</h1>} />
        <Route path="/" element={<h1>Home destination</h1>} />
      </Routes>
    </MemoryRouter>
  )
}

describe('ProtectedRoute access control', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    auth.requestSession.mockResolvedValue(false)
    auth.verifySession.mockResolvedValue(true)
  })

  it('redirects anonymous users to login', async () => {
    auth.getSession.mockReturnValue(null)
    renderRoute()
    expect(await screen.findByRole('heading', { name: 'Login destination' })).toBeInTheDocument()
  })

  it('allows a signed-in user with an allowed role', async () => {
    auth.getSession.mockReturnValue({ access_token: 't', expiresAt: Date.now() + 60000, user: { role: 'contractor' } })
    renderRoute(['contractor'])
    expect(await screen.findByRole('heading', { name: 'Private dashboard' })).toBeInTheDocument()
    await waitFor(() => expect(auth.verifySession).toHaveBeenCalled())
  })

  it('redirects a signed-in user with the wrong role to home', async () => {
    auth.getSession.mockReturnValue({ access_token: 't', expiresAt: Date.now() + 60000, user: { role: 'worker' } })
    renderRoute(['contractor'])
    expect(await screen.findByRole('heading', { name: 'Home destination' })).toBeInTheDocument()
  })
})
