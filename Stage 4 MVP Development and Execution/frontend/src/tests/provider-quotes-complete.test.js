import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), fetchProviderDashboard: vi.fn(), fetchProviderRequests: vi.fn(),
  postDeclineRequest: vi.fn(), postQuotation: vi.fn(), getProjectMeta: vi.fn(),
}))
vi.mock('../services/auth', () => ({ getSession: mocks.getSession }))
vi.mock('../services/api', () => ({
  fetchProviderDashboard: mocks.fetchProviderDashboard,
  fetchProviderRequests: mocks.fetchProviderRequests,
  postDeclineRequest: mocks.postDeclineRequest,
  postQuotation: mocks.postQuotation,
}))
vi.mock('../services/projects', () => ({ getProjectMeta: mocks.getProjectMeta }))
import { declineProviderRequest, getOpenRequestById, getOpenRequests, getProviderDashboard, submitProviderQuotation } from '../services/providers/providerQuotes'

const requestRow = (overrides = {}) => ({
  request_id: 21,
  project_id: 7,
  title: 'Night road closure',
  required_by: '2026-12-01',
  details: 'Services: ttc-plan, road-signs',
  created_at: '2026-11-15T10:00:00Z',
  project: {
    project_id: 7, project_name: 'Night road closure', closure_type: 'Road closure',
    location: '', start_date: '2026-12-01', end_date: '2026-12-03', services: [],
  },
  ...overrides,
})

describe('provider quotation workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockReturnValue({ access_token: 'provider-token' })
    mocks.getProjectMeta.mockReturnValue({ location: 'Riyadh' })
    mocks.fetchProviderRequests.mockResolvedValue([requestRow()])
    mocks.postDeclineRequest.mockResolvedValue({ ok: true })
    mocks.postQuotation.mockResolvedValue({ quotation_id: 90 })
    mocks.fetchProviderDashboard.mockResolvedValue({
      stats: { active: 1 }, pending_quotes: 2, new_requests: [requestRow()],
      next_project: { project: { project_id: 8, project_name: 'Highway', location: 'Jeddah', start_date: '2026-12-01', end_date: '2026-12-02' }, progress: 0, status: 'Upcoming' },
      active_projects: [{ project: { project_id: 9, project_name: 'Road', location: 'Riyadh', start_date: '2026-11-01', end_date: '2026-11-02' }, progress: 50, status: 'Active' }],
      overview: { workers_active: 3, sites_active: 2, field_workers: 4 },
    })
  })

  it('requires an authenticated provider for every protected workflow', async () => {
    mocks.getSession.mockReturnValue(null)
    await expect(getOpenRequests()).rejects.toThrow(/sign in/i)
    await expect(declineProviderRequest(1)).rejects.toThrow(/sign in/i)
    await expect(submitProviderQuotation({ request: { projectId: 7 } , price: 1, durationDays: 1 })).rejects.toThrow(/sign in/i)
    await expect(getProviderDashboard()).rejects.toThrow(/sign in/i)
    expect(mocks.fetchProviderRequests).not.toHaveBeenCalled()
    expect(mocks.postQuotation).not.toHaveBeenCalled()
  })

  it('maps invited requests, service ids, dates, and fallback location', async () => {
    const [request] = await getOpenRequests()
    expect(mocks.fetchProviderRequests).toHaveBeenCalledWith('provider-token', false)
    expect(request).toMatchObject({
      requestId: 21, projectId: 7, title: 'Night road closure', type: 'Road closure',
      location: 'Riyadh', durationDays: 3,
      services: ['ttc-plan', 'road-signs'],
      serviceLabels: ['Temporary Traffic Control', 'Road Signs'],
    })
  })

  it('uses project-provided services and location when available', async () => {
    mocks.fetchProviderRequests.mockResolvedValue([requestRow({
      project: { ...requestRow().project, location: 'Dammam', services: ['cones-barriers'] },
    })])
    const [request] = await getOpenRequests()
    expect(request.location).toBe('Dammam')
    expect(request.services).toEqual(['cones-barriers'])
    expect(request.serviceLabels).toEqual(['Traffic Cones & Barriers'])
  })

  it('finds a request by stringified id and returns null for an unknown id', async () => {
    await expect(getOpenRequestById('21')).resolves.toMatchObject({ requestId: 21 })
    await expect(getOpenRequestById(999)).resolves.toBeNull()
  })

  it('declines the request through the backend', async () => {
    await declineProviderRequest(21)
    expect(mocks.postDeclineRequest).toHaveBeenCalledWith('provider-token', 21)
  })

  it('submits a normalized quotation payload', async () => {
    const request = { projectId: 7, startDate: '2026-12-01', services: ['ttc-plan'] }
    await submitProviderQuotation({ request, price: '1200', durationDays: '3', notes: '' })
    expect(mocks.postQuotation).toHaveBeenCalledWith('provider-token', {
      project_id: 7, price: 1200, duration_days: 3, start_date: '2026-12-01',
      services: ['ttc-plan'], notes: null,
    })
  })

  it('converts duplicate quotation conflicts into a user-facing message', async () => {
    mocks.postQuotation.mockRejectedValue(Object.assign(new Error('Conflict'), { status: 409 }))
    await expect(submitProviderQuotation({ request: { projectId: 7, services: [] }, price: 1, durationDays: 1 }))
      .rejects.toThrow(/already sent a quotation/i)
  })

  it('maps dashboard requests, next project, active projects and overview counts', async () => {
    const dashboard = await getProviderDashboard()
    expect(dashboard).toMatchObject({
      stats: { active: 1 }, pendingQuotes: 2,
      newRequests: [{ id: 21, name: 'Night road closure', status: 'Awaiting Your Quote' }],
      newProject: { id: 8, name: 'Highway', status: 'Ready to Start' },
      activeProjects: [{ id: 9, name: 'Road', progress: 50, status: 'Active' }],
      overview: { workersActive: 3, sitesActive: 2, fieldWorkers: 4 },
    })
  })

  it('returns a null new project when the dashboard has no upcoming project', async () => {
    mocks.fetchProviderDashboard.mockResolvedValue({
      stats: {}, pending_quotes: 0, new_requests: [], next_project: null,
      active_projects: [], overview: { workers_active: 0, sites_active: 0, field_workers: 0 },
    })
    await expect(getProviderDashboard()).resolves.toMatchObject({ newProject: null, newRequests: [], activeProjects: [] })
  })
})
