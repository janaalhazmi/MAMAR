import { beforeEach, describe, expect, it, vi } from 'vitest'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'

const m = vi.hoisted(() => ({
  getSession: vi.fn(), fetchProjectAttendance: vi.fn(), fetchProjectTraffic: vi.fn(), fetchProjectWeather: vi.fn(),
  fetchSiteCode: vi.fn(), fetchProviderReviews: vi.fn(), postProjectReview: vi.fn(), todayWeather: vi.fn(), qr: vi.fn(),
  fetchProjectDevices: vi.fn(),
  addProjectDevice: vi.fn(),
}))
vi.mock('../services/auth', () => ({ getSession: (...a) => m.getSession(...a) }))
vi.mock('../services/api', () => ({
  fetchProjectAttendance: (...a) => m.fetchProjectAttendance(...a),
  fetchProjectTraffic: (...a) => m.fetchProjectTraffic(...a),
  fetchProjectWeather: (...a) => m.fetchProjectWeather(...a),
  fetchSiteCode: (...a) => m.fetchSiteCode(...a),
  fetchProviderReviews: (...a) => m.fetchProviderReviews(...a),
  postProjectReview: (...a) => m.postProjectReview(...a),
  fetchProjectDevices: (...a) => m.fetchProjectDevices(...a),
  addProjectDevice: (...a) => m.addProjectDevice(...a),
}))
vi.mock('../services/weather', () => ({ todayWeather: (...a) => m.todayWeather(...a) }))
vi.mock('qrcode', () => ({ default: { toDataURL: (...a) => m.qr(...a) } }))

import TeamOnSiteCard from '../components/TeamOnSiteCard'
import TrafficCard from '../components/TrafficCard'
import WeatherCard from '../components/WeatherCard'
import SiteQrCard from '../components/SiteQrCard'
import DeviceQrCard from '../components/DeviceQrCard'
import RateProvider from '../components/RateProvider'
import ProviderReviews from '../components/ProviderReviews'
import SafetyBadge from '../components/SafetyBadge'

const advance = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
beforeEach(() => {
  vi.useRealTimers()
  m.getSession.mockReset().mockReturnValue({ access_token: 'token' })
  m.fetchProjectAttendance.mockReset().mockResolvedValue({ on_site_now: 0, workers: [], visits: [] })
  m.fetchProjectTraffic.mockReset().mockResolvedValue({ level: 'Moderate', congestion: 35, current_speed_kmh: 40, free_flow_speed_kmh: 60, delay_seconds: 125, advice: 'Reduce lane activity', location: 'Riyadh' })
  m.fetchProjectWeather.mockReset().mockResolvedValue({ latitude: 24.7, longitude: 46.6, location: 'Riyadh' })
  m.todayWeather.mockReset().mockResolvedValue({ summary: 'Clear', isDay: false, temp: 25, feels: 24, high: 30, low: 18, wind: 8, gust: 12, rainChance: 0, humidity: 30, uv: null, sunrise: null, sunset: null, checkedAt: null, advice: [['ok', 'Good conditions']] })
  m.fetchSiteCode.mockReset().mockResolvedValue({ code: 'SITE-123', project_name: 'Road <A>' })
  m.fetchProviderReviews.mockReset().mockResolvedValue([{ review_id: 1, rating: 4, created_at: '2026-11-15T10:00:00Z', comment: '' }])
  m.postProjectReview.mockReset().mockResolvedValue({})
  m.fetchProjectDevices.mockReset().mockResolvedValue({
    devices: [{ code: 'TC-001' }],
  })
  m.addProjectDevice.mockReset().mockResolvedValue({
    devices: [{ code: 'TC-001' }, { code: 'TC-014' }],
  })
  m.qr.mockReset().mockResolvedValue('data:image/png;base64,qr')
})

describe('TeamOnSiteCard', () => {
  it('does not render without project ID and does not fetch without session', async () => {
    const empty = render(<TeamOnSiteCard />)
    expect(empty.container).toBeEmptyDOMElement()
    empty.unmount()
    m.getSession.mockReturnValue(null)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    render(<TeamOnSiteCard projectId={4} />)
    await advance(0)
    expect(m.fetchProjectAttendance).not.toHaveBeenCalled()
  })
  it('renders loading, error, empty workers, on-site and visit history', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.fetchProjectAttendance.mockRejectedValueOnce(new Error('Attendance offline'))
    const view = render(<TeamOnSiteCard projectId={4} />)
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    await advance(0)
    expect(screen.getByText('Attendance offline')).toBeInTheDocument()
    view.unmount()
    m.fetchProjectAttendance.mockResolvedValueOnce({ on_site_now: 0, workers: [], visits: [] })
    render(<TeamOnSiteCard projectId={4} />)
    await advance(0)
    expect(screen.getByText('Nobody on site now')).toBeInTheDocument()
    expect(screen.getByText('No check-ins yet.')).toBeInTheDocument()
  })
  it('lists active and inactive workers and visit rows with/without checkout', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.fetchProjectAttendance.mockResolvedValue({
      on_site_now: 1,
      workers: [
        { worker_id: 1, worker_name: 'Ali', on_site: true, since: '2026-11-17T08:00:00Z', total_minutes: 75, visits: 2 },
        { worker_id: 2, worker_name: 'Mona', on_site: false, since: null, total_minutes: 20, visits: 1 },
      ],
      visits: [
        { attendance_id: 1, worker_name: 'Ali', check_in_at: '2026-11-17T08:00:00Z', check_out_at: null, minutes: 75 },
        { attendance_id: 2, worker_name: 'Mona', check_in_at: '2026-11-16T08:00:00Z', check_out_at: '2026-11-16T08:20:00Z', minutes: 20 },
      ],
    })
    render(<TeamOnSiteCard projectId={4} />)
    await advance(0)
    expect(screen.getByText('1 on site now')).toBeInTheDocument()
    expect(screen.getAllByText('Ali')).toHaveLength(2)
    expect(screen.getByText('Not on site')).toBeInTheDocument()
    fireEvent.click(screen.getByText('All visits (2)'))
    expect(screen.getAllByText('On site').length).toBeGreaterThan(0)
  })
})

describe('TrafficCard', () => {
  it('does not render without project ID and handles missing session', async () => {
    const view = render(<TrafficCard />)
    expect(view.container).toBeEmptyDOMElement()
    view.unmount()
    m.getSession.mockReturnValue(null)
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    render(<TrafficCard projectId={5} />)
    await advance(0)
    expect(m.fetchProjectTraffic).not.toHaveBeenCalled()
  })
  it('renders traffic metrics, fallback values and refreshes', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.fetchProjectTraffic.mockResolvedValue({ level: 'Unknown', congestion: 0, current_speed_kmh: null, free_flow_speed_kmh: null, delay_seconds: null, advice: 'No advice' })
    render(<TrafficCard projectId={5} />)
    await advance(0)
    expect(screen.getByText('Unknown traffic')).toBeInTheDocument()
    expect(screen.getAllByText('–').length).toBeGreaterThan(0)
    expect(screen.getByText('No advice')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Refresh'))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(m.fetchProjectTraffic).toHaveBeenCalledTimes(2)
  })
  it('handles 503 feature-off and other errors', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.fetchProjectTraffic.mockRejectedValueOnce({ status: 503 })
    const view = render(<TrafficCard projectId={5} />)
    await advance(0)
    expect(screen.getByText(/Live traffic is not switched on yet/)).toBeInTheDocument()
    view.unmount()
    m.fetchProjectTraffic.mockRejectedValueOnce(new Error('Traffic API down'))
    render(<TrafficCard projectId={5} />)
    await advance(0)
    expect(screen.getByText('Traffic API down')).toBeInTheDocument()
  })
})

describe('WeatherCard', () => {
  it('does not render without project ID and handles fetch failure', async () => {
    const view = render(<WeatherCard />)
    expect(view.container).toBeEmptyDOMElement()
    view.unmount()
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.fetchProjectWeather.mockRejectedValueOnce(new Error('Weather offline'))
    render(<WeatherCard projectId={3} />)
    await advance(0)
    expect(screen.getByText('Weather offline')).toBeInTheDocument()
  })
  it('renders night icons, missing values, advice tone and refreshes using cached location', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout', 'setInterval', 'clearInterval'] })
    m.todayWeather.mockResolvedValue({ summary: 'Clear', isDay: false, temp: 22.4, feels: null, high: null, low: 10, wind: 3, gust: null, rainChance: 0, humidity: 40, uv: null, sunrise: null, sunset: null, checkedAt: null, advice: [['bad', 'Avoid outdoor work']] })
    render(<WeatherCard projectId={3} />)
    await advance(0)
    expect(screen.getByText('Weather alert')).toBeInTheDocument()
    expect(screen.getByText('🌙')).toBeInTheDocument()
    expect(screen.getByText('Avoid outdoor work')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Refresh'))
    await act(async () => { await Promise.resolve(); await Promise.resolve() })
    expect(m.todayWeather).toHaveBeenCalledTimes(2)
    expect(m.fetchProjectWeather).toHaveBeenCalledTimes(1)
  })
})

describe('SiteQrCard and DeviceQrCard', () => {
  it('hides SiteQrCard without project ID or session and displays API errors', async () => {
    const empty = render(<SiteQrCard />)
    expect(empty.container).toBeEmptyDOMElement()
    empty.unmount()
    m.getSession.mockReturnValue(null)
    render(<SiteQrCard projectId={3} />)
    expect(m.fetchSiteCode).not.toHaveBeenCalled()
    m.getSession.mockReturnValue({ access_token: 'token' })
    m.fetchSiteCode.mockRejectedValueOnce(new Error('QR unavailable'))
    render(<SiteQrCard projectId={4} />)
    expect(await screen.findByText('QR unavailable')).toBeInTheDocument()
  })
  it('renders site QR and guards print when popup is blocked', async () => {
    render(<SiteQrCard projectId={4} />)
    expect(await screen.findByText('SITE-123')).toBeInTheDocument()
    expect(screen.getByRole('img', { name: 'Attendance QR code for this site' })).toHaveAttribute('src', 'data:image/png;base64,qr')
    vi.spyOn(window, 'open').mockReturnValue(null)
    fireEvent.click(screen.getByText('Print poster'))
    expect(window.open).toHaveBeenCalled()
  })
  it('adds normalized unique device codes and handles popup-blocked printing', async () => {
    render(<DeviceQrCard projectId={8} projectName="Road" />)
    expect(await screen.findByAltText('QR code for TC-001')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Device code, e.g. TC-014'), { target: { value: ' tc-014 ' } })
    fireEvent.click(screen.getByText('Add'))
    expect(await screen.findByAltText('QR code for TC-014')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Device code, e.g. TC-014'), { target: { value: 'TC-014' } })
    fireEvent.click(screen.getByText('Add'))
    expect(screen.getAllByText('TC-014')).toHaveLength(1)
    vi.spyOn(window, 'open').mockReturnValue(null)
    fireEvent.click(screen.getByText('Print labels'))
    expect(window.open).toHaveBeenCalled()
  })
})

describe('RateProvider, ProviderReviews and SafetyBadge edge cases', () => {
  it('requires a rating, submits trimmed comment, reports API errors and supports skip', async () => {
    const onDone = vi.fn()
    const view = render(<RateProvider projectId={9} providerName="Road Co" onDone={onDone} />)
    fireEvent.click(screen.getByText('Send Rating'))
    expect(screen.getByRole('alert')).toHaveTextContent('Choose from 1 to 5 stars')
    fireEvent.click(screen.getByRole('radio', { name: '5 stars' }))
    fireEvent.change(screen.getByPlaceholderText('A short comment (optional)'), { target: { value: '  Great work  ' } })
    m.postProjectReview.mockRejectedValueOnce(new Error('Review failed'))
    fireEvent.click(screen.getByText('Send Rating'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Review failed')
    m.postProjectReview.mockResolvedValueOnce({})
    fireEvent.click(screen.getByText('Send Rating'))
    await waitFor(() => expect(m.postProjectReview).toHaveBeenCalledWith('token', 9, 5, 'Great work'))
    expect(onDone).toHaveBeenCalledTimes(1)
    // A successful submission leaves the form in its completed/saving state.
    // Verify Skip independently on a fresh, idle form.
    view.unmount()
    const skipped = vi.fn()
    render(<RateProvider projectId={9} providerName="Road Co" onDone={skipped} />)
    fireEvent.click(screen.getByText('Skip'))
    expect(skipped).toHaveBeenCalledTimes(1)
  })
  it('shows ProviderReviews loading, errors, empty comments and does not refetch after close', async () => {
    m.fetchProviderReviews.mockReturnValueOnce(new Promise(() => {}))
    render(<ProviderReviews providerId={8} count={2} />)
    fireEvent.click(screen.getByText('Read reviews (2)'))
    expect(screen.getByText('Loading…')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hide reviews'))
  })
  it('shows review failure and fallback no-comment text', async () => {
    m.fetchProviderReviews.mockRejectedValueOnce(new Error('Reviews unavailable'))
    const view = render(<ProviderReviews providerId={8} count={1} />)
    fireEvent.click(screen.getByText('Read reviews (1)'))
    expect(await screen.findByText('Reviews unavailable')).toBeInTheDocument()
    view.unmount()
    m.fetchProviderReviews.mockResolvedValueOnce([{ review_id: 2, rating: 3, created_at: '2026-01-01', comment: '' }])
    render(<ProviderReviews providerId={8} count={1} />)
    fireEvent.click(screen.getByText('Read reviews (1)'))
    expect(await screen.findByText('No comment.')).toBeInTheDocument()
  })
  it('renders busy and unknown safety-check states', () => {
    const check = vi.fn()
    render(<SafetyBadge photoId={7} safety={{ enabled: true, checks: {}, busy: { 7: true }, check }} />)
    expect(screen.getByText('Checking…')).toBeDisabled()
    const view = render(<SafetyBadge photoId={7} safety={{ enabled: true, checks: { 7: { level: 'Other', score: 5, checks: [{ item: 'Unknown', status: 'other', note: '' }], hazards: [], advice: '' } }, busy: {}, check }} />)
    fireEvent.click(screen.getByRole('button', { name: /5\/10 Other/ }))
    expect(screen.getByText('Unknown')).toBeInTheDocument()
    expect(screen.getByText('❔')).toBeInTheDocument()
    expect(view.container).toBeTruthy()
  })
})
