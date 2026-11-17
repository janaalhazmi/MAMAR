import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import Button from '../components/Button'
import Stars from '../components/Stars'
import SafetyBadge from '../components/SafetyBadge'
import ProviderReviews from '../components/ProviderReviews'
import Footer from '../components/Footer'
import Header from '../components/Header'

vi.mock('../components/NotificationBell', () => ({ default: () => <span>Notifications mock</span> }))
vi.mock('../services/auth', () => ({
  getSession: vi.fn(() => null),
  logout: vi.fn(),
}))
vi.mock('../services/api', () => ({
  fetchProviderReviews: vi.fn().mockResolvedValue([
    { review_id: 1, rating: 5, created_at: '2026-11-15T10:00:00Z', comment: 'Excellent work' },
  ]),
}))
import { getSession, logout } from '../services/auth'
import { fetchProviderReviews } from '../services/api'

const routed = (ui) => render(<MemoryRouter>{ui}</MemoryRouter>)

describe('shared interactive components', () => {
  it('renders a button and forwards click events and disabled state', () => {
    const onClick = vi.fn()
    routed(<Button onClick={onClick}>Save project</Button>)
    fireEvent.click(screen.getByRole('button', { name: 'Save project' }))
    expect(onClick).toHaveBeenCalledOnce()
  })

  it('renders a navigational button as a router link', () => {
    routed(<Button to="/projects">Projects</Button>)
    expect(screen.getByRole('link', { name: 'Projects' })).toHaveAttribute('href', '/projects')
  })

  it('shows the empty rating state when no ratings exist', () => {
    routed(<Stars rating={null} />)
    expect(screen.getByText('No ratings yet')).toBeInTheDocument()
  })

  it('renders a rounded star score and accessible rating label', () => {
    routed(<Stars rating={{ average: 4.2, count: 5 }} />)
    expect(screen.getByLabelText('4.2 out of 5 from 5 ratings')).toBeInTheDocument()
    expect(screen.getByText(/4.2 \(5\)/)).toBeInTheDocument()
  })

  it('does not render a safety badge when AI safety is disabled', () => {
    const { container } = routed(<SafetyBadge photoId={1} safety={{ enabled: false }} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('starts a safety check when no result exists and exposes busy state', () => {
    const check = vi.fn()
    routed(<SafetyBadge photoId={4} safety={{ enabled: true, checks: {}, busy: {}, check }} />)
    fireEvent.click(screen.getByRole('button', { name: /check safety/i }))
    expect(check).toHaveBeenCalledWith(4)
  })

  it('opens safety details and supports rechecking a photo', () => {
    const check = vi.fn()
    const safety = {
      enabled: true, checks: { '4': { level: 'Unsafe', score: 3, checks: [{ item: 'Barriers', status: 'missing', note: 'Add barriers' }], hazards: ['Open lane'], advice: 'Secure the lane.' } },
      busy: {}, check,
    }
    routed(<SafetyBadge photoId={4} safety={safety} />)
    fireEvent.click(screen.getByRole('button', { name: /3\/10 Unsafe/i }))
    expect(screen.getByText('Barriers')).toBeInTheDocument()
    expect(screen.getByText(/Open lane/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /check again/i }))
    expect(check).toHaveBeenCalledWith(4, true)
  })

  it('hides provider reviews when the count is zero', () => {
    const { container } = routed(<ProviderReviews providerId={2} count={0} />)
    expect(container).toBeEmptyDOMElement()
  })

  it('loads provider reviews on first open and toggles the review list', async () => {
    getSession.mockReturnValue({ access_token: 'review-token' })
    routed(<ProviderReviews providerId={8} count={1} />)
    fireEvent.click(screen.getByRole('button', { name: 'Read reviews (1)' }))
    expect(await screen.findByText('Excellent work')).toBeInTheDocument()
    expect(fetchProviderReviews).toHaveBeenCalledWith('review-token', 8)
    fireEvent.click(screen.getByRole('button', { name: 'Hide reviews' }))
    expect(screen.queryByText('Excellent work')).not.toBeInTheDocument()
  })

  it('renders footer navigation links', () => {
    routed(<Footer />)
    expect(screen.getByRole('link', { name: 'Contractor Guide' })).toHaveAttribute('href', '/contractor-guide')
    expect(screen.getByRole('link', { name: 'Help & Support' })).toHaveAttribute('href', '/help')
  })

  it('shows sign-in and registration actions when signed out', () => {
    getSession.mockReturnValue(null)
    routed(<Header />)
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/login')
    expect(screen.getByRole('link', { name: /get started/i })).toHaveAttribute('href', '/register')
  })

  it('shows provider dashboard and logout actions when a provider is signed in', () => {
    getSession.mockReturnValue({ user: { role: 'provider' } })
    routed(<Header />)
    expect(screen.getByRole('link', { name: 'Dashboard' })).toHaveAttribute('href', '/provider-dashboard')
    fireEvent.click(screen.getByRole('link', { name: 'Log out' }))
    expect(logout).toHaveBeenCalled()
  })
})
