import React from 'react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

vi.mock('../../services/auth', () => ({
  getSession: vi.fn(() => ({ access_token: 'test-access-token' })),
}))

vi.mock('../../services/api', () => ({
  fetchQuoteComparison: vi.fn(),
  fetchDailySummary: vi.fn(),
  fetchMyAttendance: vi.fn(),
  postAttendanceCheckIn: vi.fn(),
  postAttendanceCheckOut: vi.fn(),
}))

vi.mock('../../services/ai', () => ({
  useAiEnabled: vi.fn(() => true),
}))

vi.mock('../../services/attendance', () => ({
  clock: vi.fn(() => '08:30'),
  hours: vi.fn((minutes) => `${minutes} min`),
  shortDay: vi.fn(() => '16 Nov'),
}))

vi.mock('../../services/fieldWork', () => ({
  captureCurrentLocation: vi.fn(),
}))

import { getSession } from '../../services/auth'
import {
  fetchQuoteComparison,
  fetchDailySummary,
  fetchMyAttendance,
  postAttendanceCheckIn,
  postAttendanceCheckOut,
} from '../../services/api'
import { useAiEnabled } from '../../services/ai'
import { captureCurrentLocation } from '../../services/fieldWork'
import AiQuoteAdvisor from '../AiQuoteAdvisor'
import AiDailySummary from '../AiDailySummary'
import AttendanceCard from '../AttendanceCard'

const flushTimers = async () => {
  await act(async () => {
    await new Promise((resolve) => setTimeout(resolve, 0))
  })
}

beforeEach(() => {
  vi.useRealTimers()
  vi.clearAllMocks()
  getSession.mockReturnValue({ access_token: 'test-access-token' })
  useAiEnabled.mockReturnValue(true)
})

afterEach(() => {
  vi.useRealTimers()
  vi.unstubAllEnvs()
  delete window.turnstile
  delete window.__turnstileOptions
  document.head.querySelectorAll('script[src*="challenges.cloudflare.com/turnstile"]').forEach((node) => node.remove())
})

describe('AiQuoteAdvisor', () => {
  const projects = [{ id: 7, name: 'Road maintenance', count: 3 }]
  const comparison = {
    recommended_company: 'Safe Roads Ltd',
    recommended_quote_id: 11,
    headline: 'Best overall value',
    tip: 'Confirm the start date before accepting.',
    quotes: [{
      quote_id: 11,
      company: 'Safe Roads Ltd',
      pros: ['Lower cost'],
      cons: ['Longer duration'],
    }],
  }

  it('does not render while AI is disabled or when there are no projects', () => {
    useAiEnabled.mockReturnValue(false)
    const hidden = render(<AiQuoteAdvisor projects={projects} />)
    expect(hidden.container).toBeEmptyDOMElement()
    hidden.unmount()

    useAiEnabled.mockReturnValue(true)
    const empty = render(<AiQuoteAdvisor projects={[]} />)
    expect(empty.container).toBeEmptyDOMElement()
  })

  it('loads a comparison, displays all recommendation details and supports refresh', async () => {
    fetchQuoteComparison.mockResolvedValue(comparison)
    const onResult = vi.fn()
    render(<AiQuoteAdvisor projects={projects} onResult={onResult} />)

    fireEvent.click(screen.getByRole('button', { name: /compare with ai/i }))
    expect(fetchQuoteComparison).toHaveBeenCalledWith('test-access-token', 7, false)
    expect(await screen.findByText('Best overall value')).toBeInTheDocument()
    expect(screen.getByText(/Suggested: Safe Roads Ltd/)).toBeInTheDocument()
    expect(screen.getByText(/Lower cost/)).toBeInTheDocument()
    expect(screen.getByText(/Longer duration/)).toBeInTheDocument()
    expect(screen.getByText(/Confirm the start date/)).toBeInTheDocument()
    expect(onResult).toHaveBeenCalledWith(7, comparison)

    fireEvent.click(screen.getByRole('button', { name: /compare again/i }))
    expect(fetchQuoteComparison).toHaveBeenLastCalledWith('test-access-token', 7, true)
  })

  it('shows an API error and clears it when another comparison starts', async () => {
    fetchQuoteComparison.mockRejectedValueOnce(new Error('Comparison unavailable'))
    fetchQuoteComparison.mockResolvedValueOnce({ ...comparison, recommended_company: null, tip: '' })
    render(<AiQuoteAdvisor projects={projects} />)

    fireEvent.click(screen.getByRole('button', { name: /compare with ai/i }))
    expect(await screen.findByText('Comparison unavailable')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /compare with ai/i }))
    await screen.findByText('Best overall value')
    expect(screen.queryByText('Comparison unavailable')).not.toBeInTheDocument()
  })
})

describe('AiDailySummary', () => {
  const report = {
    headline: 'A productive day',
    summary: 'The team completed the planned work.',
    highlights: ['All workers checked in', 'No safety incidents'],
    risks: ['Traffic control needs review'],
    date: '2026-11-16',
  }

  it('does not render when AI is disabled or project ID is missing', () => {
    useAiEnabled.mockReturnValue(false)
    const disabled = render(<AiDailySummary projectId={5} />)
    expect(disabled.container).toBeEmptyDOMElement()
    disabled.unmount()

    useAiEnabled.mockReturnValue(true)
    const missing = render(<AiDailySummary />)
    expect(missing.container).toBeEmptyDOMElement()
  })

  it('loads and displays the daily report and refreshes it on demand', async () => {
    fetchDailySummary.mockResolvedValue(report)
    render(<AiDailySummary projectId={15} />)
    expect(screen.getByText(/Writing today's summary/)).toBeInTheDocument()
    await flushTimers()

    expect(fetchDailySummary).toHaveBeenCalledWith('test-access-token', 15, false)
    expect(await screen.findByText('A productive day')).toBeInTheDocument()
    expect(screen.getByText('The team completed the planned work.')).toBeInTheDocument()
    expect(screen.getByText(/All workers checked in/)).toBeInTheDocument()
    expect(screen.getByText(/Traffic control needs review/)).toBeInTheDocument()
    expect(screen.getByText(/Report for 2026-11-16/)).toBeInTheDocument()

    fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
    expect(fetchDailySummary).toHaveBeenLastCalledWith('test-access-token', 15, true)
  })

  it('renders the no-risks state and reports request failures', async () => {
    fetchDailySummary.mockResolvedValueOnce({ ...report, highlights: [], risks: [] })
    const view = render(<AiDailySummary projectId={22} />)
    await flushTimers()
    expect(await screen.findByText('Nothing today 👍')).toBeInTheDocument()
    expect(screen.queryByText('Highlights')).not.toBeInTheDocument()
    view.unmount()

    fetchDailySummary.mockRejectedValueOnce(new Error('Summary failed'))
    render(<AiDailySummary projectId={23} />)
    await flushTimers()
    expect(await screen.findByText('Summary failed')).toBeInTheDocument()
  })

  it('does not call the API without a session token', async () => {
    getSession.mockReturnValue(null)
    render(<AiDailySummary projectId={24} />)
    await flushTimers()
    expect(fetchDailySummary).not.toHaveBeenCalled()
  })
})

describe('AttendanceCard', () => {
  const offSite = { on_site: false, radius_m: 150, visits: [], total_minutes: 0 }
  const onSite = {
    on_site: true,
    radius_m: 150,
    current: { check_in_at: '2026-11-16T08:30:00', minutes: 95 },
    visits: [{ attendance_id: 3, check_in_at: '2026-11-16T08:30:00', check_out_at: null }],
    total_minutes: 95,
  }

  it('does not render without a project ID', () => {
    const view = render(<AttendanceCard />)
    expect(view.container).toBeEmptyDOMElement()
  })

  it('loads attendance, validates an empty code and checks in with GPS coordinates', async () => {
    fetchMyAttendance.mockResolvedValue(offSite)
    captureCurrentLocation.mockResolvedValue({ latitude: 24.7, longitude: 46.6 })
    postAttendanceCheckIn.mockResolvedValue(onSite)
    const onChange = vi.fn()
    render(<AttendanceCard projectId={31} initialCode="site-abc" onChange={onChange} />)
    await flushTimers()

    expect(fetchMyAttendance).toHaveBeenCalledWith('test-access-token', 31)
    const input = screen.getByLabelText('Site code')
    expect(input).toHaveValue('site-abc')
    fireEvent.change(input, { target: { value: '' } })
    fireEvent.click(screen.getByRole('button', { name: /check in at the site/i }))
    expect(await screen.findByRole('alert')).toHaveTextContent(/Scan the QR code/)
    expect(postAttendanceCheckIn).not.toHaveBeenCalled()

    fireEvent.change(input, { target: { value: 'abc-123' } })
    fireEvent.click(screen.getByRole('button', { name: /check in at the site/i }))
    expect(await screen.findByText(/You are checked in/)).toBeInTheDocument()
    expect(postAttendanceCheckIn).toHaveBeenCalledWith('test-access-token', 31, {
      code: 'ABC-123', latitude: 24.7, longitude: 46.6,
    })
    expect(onChange).toHaveBeenCalledWith(onSite)
    expect(screen.getByText(/On site since/)).toBeInTheDocument()
  })

  it('checks out even when GPS is unavailable and displays visit history', async () => {
    fetchMyAttendance.mockResolvedValue(onSite)
    captureCurrentLocation.mockRejectedValue(new Error('GPS denied'))
    postAttendanceCheckOut.mockResolvedValue({ ...offSite, visits: onSite.visits, total_minutes: 95 })
    const onChange = vi.fn()
    render(<AttendanceCard projectId={32} onChange={onChange} />)
    await flushTimers()

    expect(screen.getByText(/Time on site/)).toBeInTheDocument()
    expect(screen.getByText(/Last visits:/)).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Check out' }))
    expect(await screen.findByText(/You are checked out/)).toBeInTheDocument()
    expect(postAttendanceCheckOut).toHaveBeenCalledWith('test-access-token', 32, {})
    expect(onChange).toHaveBeenCalled()
  })

  it('shows attendance loading errors and check-in location/API errors', async () => {
    fetchMyAttendance.mockRejectedValueOnce(new Error('Could not load attendance'))
    const view = render(<AttendanceCard projectId={33} />)
    await flushTimers()
    expect(await screen.findByText('Could not load attendance')).toBeInTheDocument()
    view.unmount()

    fetchMyAttendance.mockResolvedValue(offSite)
    captureCurrentLocation.mockRejectedValue(new Error('Location permission denied'))
    render(<AttendanceCard projectId={34} />)
    await flushTimers()
    fireEvent.change(screen.getByLabelText('Site code'), { target: { value: 'valid' } })
    fireEvent.click(screen.getByRole('button', { name: /check in at the site/i }))
    expect(await screen.findByText('Location permission denied')).toBeInTheDocument()
  })

  it('shows checkout API errors', async () => {
    fetchMyAttendance.mockResolvedValue(onSite)
    captureCurrentLocation.mockResolvedValue({ latitude: 24.7, longitude: 46.6 })
    postAttendanceCheckOut.mockRejectedValue(new Error('Checkout rejected'))
    render(<AttendanceCard projectId={35} />)
    await flushTimers()
    fireEvent.click(screen.getByRole('button', { name: 'Check out' }))
    expect(await screen.findByText('Checkout rejected')).toBeInTheDocument()
  })
})

describe('Turnstile', () => {
  it('renders nothing when the site key is not configured', async () => {
    vi.useRealTimers()
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '')
    vi.resetModules()
    const { default: Turnstile } = await import('../Turnstile')
    const view = render(<Turnstile onToken={vi.fn()} />)
    expect(view.container).toBeEmptyDOMElement()
  })

  it('loads the widget, forwards tokens, resets it and removes it on unmount', async () => {
    vi.useRealTimers()
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-site-key')
    vi.resetModules()
    const { default: Turnstile } = await import('../Turnstile')
    const onToken = vi.fn()
    const renderWidget = vi.fn((_element, options) => {
      window.__turnstileOptions = options
      return 'widget-123'
    })
    window.turnstile = undefined

    const view = render(<Turnstile onToken={onToken} />)
    const script = document.head.querySelector('script[src*=\"challenges.cloudflare.com/turnstile\"]')
    expect(script).toBeInTheDocument()
    expect(script.src).toContain('render=explicit')
    window.turnstile = { render: renderWidget, reset: vi.fn(), remove: vi.fn() }
    act(() => script.dispatchEvent(new Event('load')))
    await waitFor(() => expect(renderWidget).toHaveBeenCalledOnce())
    expect(renderWidget).toHaveBeenCalledWith(expect.any(HTMLElement), expect.objectContaining({ sitekey: 'test-site-key' }))

    act(() => window.__turnstileOptions.callback('secure-token'))
    expect(onToken).toHaveBeenCalledWith('secure-token')
    act(() => window.__turnstileOptions['expired-callback']())
    act(() => window.__turnstileOptions['error-callback']())
    expect(onToken).toHaveBeenLastCalledWith('')

    view.rerender(<Turnstile onToken={onToken} resetKey={1} />)
    expect(window.turnstile.reset).toHaveBeenCalledWith('widget-123')
    view.unmount()
    expect(window.turnstile.remove).toHaveBeenCalledWith('widget-123')
  })

  it('reports a script loading failure through the token callback', async () => {
    vi.useRealTimers()
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-site-key')
    vi.resetModules()
    const { default: Turnstile } = await import('../Turnstile')
    const onToken = vi.fn()
    window.turnstile = undefined
    render(<Turnstile onToken={onToken} />)
    const script = document.head.querySelector('script[src*=\"challenges.cloudflare.com/turnstile\"]')
    expect(script).toBeInTheDocument()
    act(() => script.dispatchEvent(new Event('error')))
    await waitFor(() => expect(onToken).toHaveBeenCalledWith(''))
  })
})
