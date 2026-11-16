import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const m = vi.hoisted(() => ({
  currentProject: { id: 9, name: 'Road upgrade', location: 'Riyadh', services: ['ttc-plan'] },
  ratings: { byId: {}, byName: {} },
  providers: [
    { id: 1, name: 'Safety Co', logo: '/safety.png', description: 'Safety experts', services: ['Road Signs'], city: 'Riyadh' },
    { id: 2, name: 'Traffic Co', logo: '/traffic.png', description: 'Traffic experts', services: ['TTC Plan'], city: 'Riyadh' },
  ],
  filterProviders: vi.fn(), getCurrentProject: vi.fn(), getProviderPageSummary: vi.fn(), handleRequestQuotes: vi.fn(), hasRequestedQuotes: vi.fn(),
  fetchProjects: vi.fn(), getQuotations: vi.fn(), handleRejectQuotation: vi.fn(), handleAcceptQuotation: vi.fn(),
}))
vi.mock('../../components/ContractorShell', () => ({ default: ({ children }) => <div data-testid="contractor-shell">{children}</div> }))
vi.mock('../../components/Icons', () => ({ default: ({ name }) => <i>{name}</i> }))
vi.mock('../../components/Stars', () => ({ default: () => <span>stars</span> }))
vi.mock('../../components/ProviderReviews', () => ({ default: () => <span>reviews</span> }))
vi.mock('../../components/AiQuoteAdvisor', () => ({ default: ({ projects, onResult }) => <button type="button" onClick={() => projects[0] && onResult(projects[0].id, { recommended_quote_id: 1 })}>AI recommend</button> }))
vi.mock('../../services/ratings', () => ({ useProviderRatings: () => m.ratings }))
vi.mock('../../services/Contractor/Contractor', () => ({
  CITIES: ['Riyadh', 'Jeddah'], SERVICE_FILTERS: ['All Required Services', 'Road Signs', 'TTC Plan'],
  SERVICE_LABELS: { 'ttc-plan': 'TTC Plan' },
  filterProviders: (...a) => m.filterProviders(...a),
  getCurrentProject: (...a) => m.getCurrentProject(...a),
  getProviderPageSummary: (...a) => m.getProviderPageSummary(...a),
  handleRequestQuotes: (...a) => m.handleRequestQuotes(...a),
  hasRequestedQuotes: (...a) => m.hasRequestedQuotes(...a),
  fetchProjects: (...a) => m.fetchProjects(...a),
  getQuotations: (...a) => m.getQuotations(...a),
  handleRejectQuotation: (...a) => m.handleRejectQuotation(...a),
  handleAcceptQuotation: (...a) => m.handleAcceptQuotation(...a),
  formatDate: (v) => `date:${v || '—'}`,
  formatPrice: (v) => `SAR ${v}`,
}))

import ProviderPage from '../../pages/Contractor/ProviderPage'
import QuotationsPage from '../../pages/Contractor/QuotationsPage'

const quotation = (id, status = 'received', over = {}) => ({
  id, providerName: `Provider ${id}`, providerDescription: 'Description', providerLogo: '', totalPrice: id * 100,
  durationDays: 4, services: ['ttc-plan', 'unknown'], notes: 'Line item details', startDate: '2026-01-01', status,
  backendStatus: status, projectId: 9, projectName: 'Road upgrade', project: { id: 9, name: 'Road upgrade' },
  ...over,
})
function renderProvider(path = '/providers') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/providers" element={<ProviderPage />} />
    <Route path="/contractor-dashboard" element={<div>contractor dashboard</div>} />
  </Routes></MemoryRouter>)
}
function renderQuotes() {
  return render(<MemoryRouter initialEntries={['/quotations']}><Routes>
    <Route path="/quotations" element={<QuotationsPage />} />
    <Route path="/payment" element={<div>payment page</div>} />
    <Route path="/my-projects" element={<div>my projects page</div>} />
  </Routes></MemoryRouter>)
}
beforeEach(() => {
  m.currentProject = { id: 9, name: 'Road upgrade', location: 'Riyadh', services: ['ttc-plan'] }
  m.ratings = { byId: {}, byName: {} }
  m.filterProviders.mockReset().mockImplementation(({ search, city, service }) => m.providers.filter((p) => (!search || p.name.toLowerCase().includes(search.toLowerCase())) && (!city || p.city === city) && (service === 'All Required Services' || p.services.includes(service))))
  m.getCurrentProject.mockReset().mockImplementation(() => m.currentProject)
  m.getProviderPageSummary.mockReset().mockReturnValue({ name: 'Road upgrade', location: 'Riyadh', services: 'TTC Plan' })
  m.handleRequestQuotes.mockReset().mockResolvedValue({ ok: true })
  m.hasRequestedQuotes.mockReset().mockReturnValue(false)
  m.fetchProjects.mockReset().mockResolvedValue([{ id: 9, name: 'Road upgrade' }])
  m.getQuotations.mockReset().mockResolvedValue([quotation(11), quotation(12), quotation(13, 'accepted'), quotation(14, 'rejected')])
  m.handleRejectQuotation.mockReset().mockImplementation(async (list, item) => list.map((q) => q.id === item.id ? { ...q, status: 'rejected' } : q))
  m.handleAcceptQuotation.mockReset()
  vi.spyOn(window, 'alert').mockImplementation(() => {})
})

describe('ProviderPage: provider search, selection, sidebar and quote request', () => {
  it('shows project summary, filters providers and supports selecting/deselecting cards', () => {
    renderProvider()
    expect(screen.getByText('Road upgrade')).toBeInTheDocument()
    expect(screen.getByText('2 Providers Found')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Select Safety Co' }))
    expect(screen.getByText('1 provider selected')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Select Safety Co' }))
    expect(screen.getByText('0 providers selected')).toBeInTheDocument()
    fireEvent.change(screen.getByPlaceholderText('Search providers'), { target: { value: 'traffic' } })
    expect(screen.getByText('Traffic Co')).toBeInTheDocument()
    expect(screen.queryByText('Safety Co')).not.toBeInTheDocument()
  })
  it('shows empty provider results after filters', () => {
    renderProvider()
    fireEvent.change(screen.getByPlaceholderText('Search providers'), { target: { value: 'missing' } })
    expect(screen.getByText(/No providers match your search/)).toBeInTheDocument()
  })
  it('requires a selected provider before requesting quotes', () => {
    renderProvider()
    fireEvent.click(screen.getByRole('button', { name: /Request Quotes \(0\)/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Please select at least one provider')
    expect(m.handleRequestQuotes).not.toHaveBeenCalled()
  })
  it('submits selected providers, alerts and navigates to dashboard', async () => {
    renderProvider()
    fireEvent.click(screen.getByRole('button', { name: 'Select Traffic Co' }))
    fireEvent.click(screen.getByRole('button', { name: /Request Quotes \(1\)/ }))
    await waitFor(() => expect(m.handleRequestQuotes).toHaveBeenCalledWith(m.currentProject, [2]))
    expect(window.alert).toHaveBeenCalledWith('Your project has been submitted successfully!')
    expect(await screen.findByText('contractor dashboard')).toBeInTheDocument()
  })
  it('shows API failure and resets sending state', async () => {
    m.handleRequestQuotes.mockRejectedValueOnce(new Error('Could not send'))
    renderProvider()
    fireEvent.click(screen.getByRole('button', { name: 'Select Safety Co' }))
    fireEvent.click(screen.getByRole('button', { name: /Request Quotes \(1\)/ }))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not send')
    expect(screen.getByRole('button', { name: /Request Quotes \(1\)/ })).toBeEnabled()
  })
  it('hides selection actions from sidebar and redirects when quotes were already requested', async () => {
    const sidebar = render(<MemoryRouter initialEntries={[{ pathname: '/providers', state: { source: 'sidebar' } }]}><Routes>
      <Route path="/providers" element={<ProviderPage />} /><Route path="/contractor-dashboard" element={<div>contractor dashboard</div>} />
    </Routes></MemoryRouter>)
    expect(screen.queryByText(/provider selected/)).not.toBeInTheDocument()
    expect(screen.queryByText(/Request Quotes/)).not.toBeInTheDocument()
    sidebar.unmount()
    m.hasRequestedQuotes.mockReturnValue(true)
    renderProvider()
    expect(await screen.findByText('contractor dashboard')).toBeInTheDocument()
  })
})

describe('QuotationsPage: aggregation, filters, compare, accept and reject', () => {
  it('shows loading then all status counts, cards, and optional service/notes fallbacks', async () => {
    m.getQuotations.mockReturnValue(new Promise(() => {}))
    const view = renderQuotes()
    expect(screen.getByText('Loading quotations from your projects…')).toBeInTheDocument()
    view.unmount()
    m.getQuotations.mockResolvedValue([quotation(1), quotation(2), quotation(3, 'accepted', { services: [], notes: '', providerLogo: null, startDate: '' }), quotation(4, 'rejected')])
    renderQuotes()
    await screen.findByText('Provider 1')
    expect(screen.getAllByText('4').length).toBeGreaterThan(0)
    expect(screen.getByText('No service details provided.')).toBeInTheDocument()
    expect(screen.queryByText('No quotations match your search')).not.toBeInTheDocument()
    fireEvent.click(screen.getByText('AI recommend'))
    expect(screen.getByText('✨ AI pick')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Compare Quotes →'))
    expect(screen.getByRole('table')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hide Comparison'))
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })
  it('filters by provider/project and status and shows no-match state', async () => {
    renderQuotes()
    await screen.findByText('Provider 11')
    fireEvent.change(screen.getByLabelText('Search quotations'), { target: { value: 'Provider 12' } })
    expect(screen.getByText('Provider 12')).toBeInTheDocument()
    expect(screen.queryByText('Provider 11')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search quotations'), { target: { value: 'nothing' } })
    expect(screen.getByText('No quotations match your search')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search quotations'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Filter quotations by status'), { target: { value: 'accepted' } })
    expect(screen.getByText('Provider 13')).toBeInTheDocument()
  })
  it('rejects a quotation and shows a rejection error', async () => {
    renderQuotes()
    await screen.findByText('Provider 11')
    fireEvent.click(screen.getAllByText('✕ Reject')[0])
    await waitFor(() => expect(m.handleRejectQuotation).toHaveBeenCalled())
    expect(screen.getAllByText('Rejected').length).toBeGreaterThan(0)
    m.handleRejectQuotation.mockRejectedValueOnce(new Error('Reject failed'))
    fireEvent.click(screen.getAllByText('✕ Reject').find((el) => !el.disabled))
    expect(await screen.findByRole('alert')).toHaveTextContent('Reject failed')
  })
  it('accepts a quotation and navigates with project and quotation state', async () => {
    renderQuotes()
    await screen.findByText('Provider 11')
    fireEvent.click(screen.getAllByRole('button', { name: /Accept/ })[0])
    expect(m.handleAcceptQuotation).toHaveBeenCalledWith(expect.objectContaining({ id: 11 }))
    expect(await screen.findByText('payment page')).toBeInTheDocument()
  })
  it('handles empty projects and partial project failures', async () => {
    m.fetchProjects.mockResolvedValueOnce([])
    renderQuotes()
    expect(await screen.findByText('No quotations received yet')).toBeInTheDocument()
    m.fetchProjects.mockResolvedValueOnce([{ id: 9, name: 'Road upgrade' }, { id: 10, name: 'Bridge' }])
    m.getQuotations.mockImplementation((id) => id === 9 ? Promise.resolve([quotation(31)]) : Promise.reject(new Error('offline')))
    renderQuotes()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load quotations for: Bridge')
    expect(screen.getByText('Provider 31')).toBeInTheDocument()
  })
})
