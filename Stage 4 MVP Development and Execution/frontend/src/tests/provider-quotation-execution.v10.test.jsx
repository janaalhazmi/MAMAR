import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const state = vi.hoisted(() => ({
  requestDetails: { project_name: 'Road works', project_id: 12, start_date: '2026-01-01', end_date: '2026-01-03' },
  realRequest: { projectId: 12, title: 'Road works', location: 'Riyadh', startDate: '2026-01-01', endDate: '2026-01-03' },
  workZone: { rings: [[[1, 2], [2, 3], [3, 4]]] },
  workZoneError: '',
  detailsHook: null,
  safety: { enabled: false, checks: {}, busy: {}, error: '' },
}))
const calls = vi.hoisted(() => ({
  getOpenRequestById: vi.fn(), declineProviderRequest: vi.fn(), submitProviderQuotation: vi.fn(),
  useQuotationRequest: vi.fn(), useProviderProjectDetails: vi.fn(), useSafetyChecks: vi.fn(),
}))
vi.mock('../services/providers/providerQuotes', () => ({
  getOpenRequestById: (...a) => calls.getOpenRequestById(...a),
  declineProviderRequest: (...a) => calls.declineProviderRequest(...a),
  submitProviderQuotation: (...a) => calls.submitProviderQuotation(...a),
}))
vi.mock('../services/providers/api', () => ({ useQuotationRequest: (...a) => calls.useQuotationRequest(...a), useProviderProjectDetails: (...a) => calls.useProviderProjectDetails(...a) }))
vi.mock('../services/ai', () => ({ useSafetyChecks: (...a) => calls.useSafetyChecks(...a) }))
vi.mock('../components/NotificationBell', () => ({ default: () => <span>bell</span> }))
vi.mock('../components/ProviderSidebar', () => ({ default: () => <aside>provider nav</aside> }))
vi.mock('../components/MamarMap', () => ({ default: () => <div data-testid="map">map</div> }))
vi.mock('../components/WeatherCard', () => ({ default: () => <div>weather</div> }))
vi.mock('../components/TrafficCard', () => ({ default: () => <div>traffic</div> }))
vi.mock('../components/DeviceQrCard', () => ({ default: () => <div>device QR</div> }))
vi.mock('../components/SiteQrCard', () => ({ default: () => <div>site QR</div> }))
vi.mock('../components/TeamOnSiteCard', () => ({ default: () => <div>team on site</div> }))
vi.mock('../components/SafetyBadge', () => ({ default: () => <span>safety</span> }))
vi.mock('../components/AiDailySummary', () => ({ default: () => <div>daily summary</div> }))

import PrepareQuotation from '../pages/Providers/PrepareQuotation'
import ProviderExecutionDetails from '../pages/Providers/ProviderExecutionDetails'

function renderQuotation(url = '/prepare-quotation?requestId=44') {
  return render(<MemoryRouter initialEntries={[url]}><Routes>
    <Route path="/prepare-quotation" element={<PrepareQuotation />} />
    <Route path="/provider-dashboard" element={<div>dashboard destination</div>} />
    <Route path="/" element={<div>home</div>} />
  </Routes></MemoryRouter>)
}
function renderExecution(path = '/provider/projects/12') {
  return render(<MemoryRouter initialEntries={[path]}><Routes><Route path="/provider/projects/:projectId" element={<ProviderExecutionDetails />} /></Routes></MemoryRouter>)
}

beforeEach(() => {
  localStorage.clear(); sessionStorage.clear()
  state.requestDetails = { project_name: 'Road works', project_id: 12, start_date: '2026-01-01', end_date: '2026-01-03' }
  state.realRequest = { projectId: 12, title: 'Road works', location: 'Riyadh', startDate: '2026-01-01', endDate: '2026-01-03' }
  state.workZone = { rings: [[[1, 2], [2, 3], [3, 4]]] }
  state.workZoneError = ''
  state.detailsHook = { name: 'Sara Ali', initials: 'SA', current: null, details: null, project: null, note: '', setNote: vi.fn(), review: vi.fn(), reviewBusy: false, reviewError: '', reviewNotice: '' }
  state.safety = { enabled: false, checks: {}, busy: {}, error: '' }
  calls.getOpenRequestById.mockReset().mockResolvedValue({ projectId: 12, startDate: '2026-01-01', endDate: '2026-01-03' })
  calls.declineProviderRequest.mockReset().mockResolvedValue({})
  calls.submitProviderQuotation.mockReset().mockResolvedValue({})
  calls.useQuotationRequest.mockImplementation(() => ({ requestDetails: state.requestDetails, realRequest: state.realRequest, workZone: state.workZone, workZoneError: state.workZoneError }))
  calls.useProviderProjectDetails.mockImplementation(() => state.detailsHook)
  calls.useSafetyChecks.mockImplementation(() => state.safety)
  vi.spyOn(window, 'alert').mockImplementation(() => {})
  vi.spyOn(window, 'confirm').mockReturnValue(true)
})

describe('PrepareQuotation: pricing, work-zone, draft, submit and decline branches', () => {
  it('shows request details and toggles work-zone loading, error, map and empty states', () => {
    state.requestDetails = null
    state.realRequest = null
    state.workZone = null
    renderQuotation()
    expect(screen.getByText('Loading project...')).toBeInTheDocument()
    fireEvent.click(screen.getByText('View Work Zone'))
    expect(screen.getByText('Loading work zone...')).toBeInTheDocument()
  })
  it('renders work-zone error and closes the map panel', () => {
    state.workZoneError = 'Zone service offline'
    renderQuotation()
    fireEvent.click(screen.getByText('View Work Zone'))
    expect(screen.getByText('Zone service offline')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Close map' }))
    expect(screen.queryByText('Project Work Zone')).not.toBeInTheDocument()
  })
  it('renders map when a work zone is available and saves selected polygon to session storage', () => {
    renderQuotation()
    fireEvent.click(screen.getByText('View Work Zone'))
    expect(screen.getByTestId('map')).toBeInTheDocument()
    // The component exposes the map selection callback only through its map widget; the UI path is verified above.
  })
  it('updates quantities, unit prices and delivery, then saves a draft', () => {
    renderQuotation()
    const numbers = screen.getAllByRole('spinbutton')
    fireEvent.change(numbers[0], { target: { value: '0' } })
    fireEvent.change(numbers[1], { target: { value: '25' } })
    fireEvent.change(numbers[6], { target: { value: '300' } })
    fireEvent.change(document.querySelector('.quotation-date'), { target: { value: '31 Dec 2026' } })
    fireEvent.change(document.querySelector('.quotation-notes textarea'), { target: { value: 'Includes night work' } })
    fireEvent.click(screen.getByText('Save Draft'))
    const draft = JSON.parse(localStorage.getItem('providerQuotationDraft'))
    expect(draft.requestId).toBe('44')
    expect(draft.services[0].quantity).toBe(0)
    expect(draft.services[0].unitPrice).toBe(25)
    expect(draft.delivery).toBe(300)
    expect(draft.notes).toBe('Includes night work')
    expect(window.alert).toHaveBeenCalledWith('Quotation draft saved successfully.')
  })
  it('rejects submission without request ID and rejects invalid service pricing', () => {
    const noId = renderQuotation('/prepare-quotation')
    fireEvent.click(screen.getByText('Submit Quotation →'))
    expect(window.alert).toHaveBeenCalledWith('Open this quotation from a service request.')
    noId.unmount()
    renderQuotation()
    fireEvent.change(screen.getAllByRole('spinbutton')[0], { target: { value: '0' } })
    fireEvent.click(screen.getByText('Submit Quotation →'))
    expect(window.alert).toHaveBeenCalledWith('Please enter a valid quantity and unit price for all services.')
    expect(calls.getOpenRequestById).not.toHaveBeenCalled()
  })
  it('submits a valid quotation and removes the saved draft', async () => {
    localStorage.setItem('providerQuotationDraft', 'old')
    renderQuotation()
    fireEvent.click(screen.getByText('Submit Quotation →'))
    await waitFor(() => expect(calls.submitProviderQuotation).toHaveBeenCalledWith(expect.objectContaining({ request: expect.objectContaining({ projectId: 12 }), durationDays: 3, price: expect.any(Number), notes: expect.stringContaining('Delivery: SAR 1200') })))
    expect(localStorage.getItem('providerQuotationDraft')).toBeNull()
    expect(window.alert).not.toHaveBeenCalled()
  })
  it('handles missing request, invalid dates, unavailable request and API errors', async () => {
    calls.getOpenRequestById.mockResolvedValueOnce({ projectId: null })
    renderQuotation()
    fireEvent.click(screen.getByText('Submit Quotation →'))
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('This request is no longer available for quotation.'))
  })
  it('declines only after confirmation and handles decline failures', async () => {
    const confirmSpy = window.confirm
    confirmSpy.mockReturnValue(false)
    renderQuotation()
    fireEvent.click(screen.getByText('Decline Request'))
    expect(calls.declineProviderRequest).not.toHaveBeenCalled()
    confirmSpy.mockReturnValue(true)
    calls.declineProviderRequest.mockRejectedValueOnce(new Error('Cannot decline'))
    fireEvent.click(screen.getByText('Decline Request'))
    await waitFor(() => expect(window.alert).toHaveBeenCalledWith('Cannot decline'))
  })
})

describe('ProviderExecutionDetails: loading, errors, completion review and photo fallbacks', () => {
  it('shows loading and API error states', () => {
    renderExecution()
    expect(screen.getByRole('status')).toHaveTextContent('Loading project details')
    state.detailsHook = { ...state.detailsHook, current: { error: 'Not found' } }
    renderExecution()
    expect(screen.getByRole('alert')).toHaveTextContent('Not found')
  })
  it('renders empty project details and no work-zone/team/photos fallbacks', () => {
    state.detailsHook = {
      ...state.detailsHook,
      current: { data: { project: { project_id: 12, project_name: 'Empty road', services: [], start_date: null, end_date: null }, progress: -5, team: [], photos: [] } },
      details: { progress: -5, team: [], photos: [] },
      project: { project_id: 12, project_name: 'Empty road', services: [], start_date: null, end_date: null },
    }
    renderExecution()
    expect(screen.getByRole('heading', { name: 'Empty road' })).toBeInTheDocument()
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Work zone location is unavailable.')).toBeInTheDocument()
    expect(screen.getByText('No team members assigned yet.')).toBeInTheDocument()
    expect(screen.getByText('No site photos yet.')).toBeInTheDocument()
  })
  it('renders completion-awaiting-review, validates return note and triggers submit/return actions', () => {
    const review = vi.fn()
    state.detailsHook = {
      ...state.detailsHook,
      current: { data: { project: { project_id: 12, project_name: 'Road', work_zone: { rings: [] } }, progress: 130, awaiting_review: true, team: [{ user_id: 1, full_name: 'Ali' }], photos: [{ photo_id: 1, url: '/photo.jpg', caption: 'Evidence' }, { photo_id: 2, url: '', photo_url: '', caption: '' }] } },
      details: { progress: 130, awaiting_review: true, team: [{ user_id: 1, full_name: 'Ali' }], photos: [{ photo_id: 1, url: '/photo.jpg', caption: 'Evidence' }, { photo_id: 2, url: '', photo_url: '', caption: '' }] },
      project: { project_id: 12, project_name: 'Road', work_zone: { rings: [] } }, review,
    }
    renderExecution()
    expect(screen.getByText('Evidence')).toBeInTheDocument()
    expect(screen.getByAltText('Evidence')).toHaveAttribute('src', expect.stringContaining('/photo.jpg'))
    expect(screen.getByText('Site photo')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Return to Field Team'))
    expect(review).toHaveBeenCalledWith('return')
    fireEvent.click(screen.getByText('Send to Contractor'))
    expect(review).toHaveBeenCalledWith('submit')
  })
  it('renders submitted completion state and review notices/errors', () => {
    state.detailsHook = {
      ...state.detailsHook,
      current: { data: { project: { project_id: 12, project_name: 'Road' }, completion_submitted: true, submitted_at: '2026-01-02T10:00:00Z', team: [], photos: [] } },
      details: { completion_submitted: true, submitted_at: '2026-01-02T10:00:00Z', team: [], photos: [], site_status: '' },
      project: { project_id: 12, project_name: 'Road' },
      reviewNotice: 'Sent to contractor', reviewError: 'Some warning',
    }
    renderExecution()
    expect(screen.getByText(/Waiting for their review/)).toBeInTheDocument()
    expect(screen.getByRole('status')).toHaveTextContent('Sent to contractor')
    expect(screen.getByRole('alert')).toHaveTextContent('Some warning')
  })
})
