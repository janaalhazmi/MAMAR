import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

const m = vi.hoisted(() => ({
  getSession: vi.fn(), getNotifications: vi.fn(), fetchMyProfile: vi.fn(), getCurrentUser: vi.fn(), logout: vi.fn(),
}))
vi.mock('../services/auth', () => ({ getSession: (...a) => m.getSession(...a), logout: (...a) => m.logout(...a) }))
vi.mock('../services/notifications', () => ({ getNotifications: (...a) => m.getNotifications(...a) }))
vi.mock('../services/Contractor/profileService', () => ({ fetchMyProfile: (...a) => m.fetchMyProfile(...a) }))
vi.mock('../services/api', () => ({ API_BASE_URL: 'https://api.example.test', getCurrentUser: (...a) => m.getCurrentUser(...a) }))
vi.mock('../components/NotificationBell', () => ({ default: () => <span>Bell mock</span> }))
vi.mock('../components/Sidebar', () => ({ default: ({ items = [], activeKey }) => <nav aria-label="Contractor navigation">{items.map((item) => <span key={item.key} data-active={item.key === activeKey}>{item.label}</span>)}</nav> }))
vi.mock('../components/Icons', () => ({ default: ({ name }) => <i>{name}</i> }))

import ContractorShell from '../components/ContractorShell'
import FieldWorkerShell from '../components/FieldWorkerShell'

const tick = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
beforeEach(() => {
  vi.useRealTimers()
  m.getSession.mockReset().mockReturnValue({ access_token: 'tok', user: { full_name: 'Sara Ali', role: 'contractor' } })
  m.getNotifications.mockReset().mockResolvedValue([])
  m.fetchMyProfile.mockReset().mockResolvedValue({ full_name: 'Sara Updated', profile_picture: '/avatar.png' })
  m.getCurrentUser.mockReset().mockResolvedValue({ full_name: 'Worker Updated', profile_picture: '/worker.png' })
  m.logout.mockReset()
})

describe('ContractorShell', () => {
  it('renders session identity, nav, children and profile picture after load', async () => {
    render(<MemoryRouter><ContractorShell activeKey="projects"><p>page content</p></ContractorShell></MemoryRouter>)
    expect(screen.getByText('Sara Ali')).toBeInTheDocument()
    expect(screen.getByText('page content')).toBeInTheDocument()
    expect(screen.getByText('My Projects')).toHaveAttribute('data-active', 'true')
    await waitFor(() => expect(screen.getByText('Sara Updated')).toBeInTheDocument())
    expect(screen.getByAltText('Profile')).toHaveAttribute('src', 'https://api.example.test/avatar.png')
  })
  it('falls back for blank/non-string names and handles profile load failure', async () => {
    m.getSession.mockReturnValue({ user: { full_name: 42 } })
    m.fetchMyProfile.mockRejectedValueOnce(new Error('Profile offline'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<MemoryRouter><ContractorShell><p>content</p></ContractorShell></MemoryRouter>)
    expect(screen.getByText('there')).toBeInTheDocument()
    await waitFor(() => expect(error).toHaveBeenCalled())
  })
  it('updates session identity from custom event and polls notifications safely', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.getNotifications.mockResolvedValueOnce([{ id: 1, read: false }]).mockResolvedValue([{ id: 1, read: false }, { id: 2, read: false }])
    // Keep the initial profile request pending so it cannot overwrite the custom event update.
    m.fetchMyProfile.mockReturnValue(new Promise(() => {}))
    render(<MemoryRouter><ContractorShell><p>content</p></ContractorShell></MemoryRouter>)
    await tick(0)
    await act(async () => {
      window.dispatchEvent(new CustomEvent('mamar:session-user-updated', { detail: { full_name: 'New Name' } }))
      await Promise.resolve()
    })
    await tick(0)
    expect(screen.getByText('New Name')).toBeInTheDocument()
    await tick(10000)
    expect(m.getNotifications).toHaveBeenCalledTimes(2)
  })
  it('logs notification polling failures and stops polling after unmount', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.getNotifications.mockRejectedValue(new Error('notification offline'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    const view = render(<MemoryRouter><ContractorShell><p>content</p></ContractorShell></MemoryRouter>)
    await tick(0)
    expect(error).toHaveBeenCalled()
    const count = m.getNotifications.mock.calls.length
    view.unmount()
    await tick(30000)
    expect(m.getNotifications).toHaveBeenCalledTimes(count)
  })
})

describe('FieldWorkerShell', () => {
  it('renders worker identity, active navigation and loaded relative avatar', async () => {
    render(<MemoryRouter><FieldWorkerShell activeKey="attendance"><p>attendance content</p></FieldWorkerShell></MemoryRouter>)
    expect(screen.getByText('Sara Ali')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: 'My Profile' })).toHaveAttribute('href', '/field-worker/profile')
    await waitFor(() => expect(screen.getByText('Worker Updated')).toBeInTheDocument())
    expect(screen.getByAltText('Worker Updated')).toHaveAttribute('src', 'https://api.example.test/worker.png')
    expect(screen.getByText('attendance content')).toBeInTheDocument()
  })
  it('uses fallback identity and skips profile fetch without a token', async () => {
    m.getSession.mockReturnValue({ user: {} })
    render(<MemoryRouter><FieldWorkerShell><p>content</p></FieldWorkerShell></MemoryRouter>)
    expect(screen.getAllByText('Field Worker')).toHaveLength(2)
    expect(m.getCurrentUser).not.toHaveBeenCalled()
  })
  it('logs profile failure and switches to initials after image error', async () => {
    m.getCurrentUser.mockRejectedValueOnce(new Error('profile unavailable'))
    const error = vi.spyOn(console, 'error').mockImplementation(() => {})
    render(<MemoryRouter><FieldWorkerShell><p>content</p></FieldWorkerShell></MemoryRouter>)
    await waitFor(() => expect(error).toHaveBeenCalled())
    m.getCurrentUser.mockResolvedValueOnce({ full_name: 'Omar Noor', avatar_url: 'https://cdn.example.test/avatar.png' })
    window.dispatchEvent(new Event('mamar:session-user-updated'))
    await waitFor(() => expect(screen.getByAltText('Omar Noor')).toBeInTheDocument())
    fireEvent.error(screen.getByAltText('Omar Noor'))
    expect(screen.getByText('O')).toBeInTheDocument()
  })
  it('logs out from the sidebar link', () => {
    render(<MemoryRouter><FieldWorkerShell><p>content</p></FieldWorkerShell></MemoryRouter>)
    fireEvent.click(screen.getByRole('link', { name: /Log out/ }))
    expect(m.logout).toHaveBeenCalled()
  })
})
