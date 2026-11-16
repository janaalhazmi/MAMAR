import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(),
  fetchProviderProjects: vi.fn(),
  getProjectMeta: vi.fn(),
}))

vi.mock('../../auth.js', () => ({ getSession: mocks.getSession }))
vi.mock('../../api.js', () => ({ fetchProviderProjects: mocks.fetchProviderProjects }))
vi.mock('../../projects.js', () => ({ getProjectMeta: mocks.getProjectMeta }))

import { getProviderProjects } from '../providerFlow.js'

describe('Provider project workflow', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockReturnValue({ access_token: 'provider-token' })
    mocks.getProjectMeta.mockReturnValue({ location: 'Saved location' })
  })

  it('requires an authenticated provider session', async () => {
    mocks.getSession.mockReturnValue(null)
    await expect(getProviderProjects()).rejects.toThrow(/sign in/i)
    expect(mocks.fetchProviderProjects).not.toHaveBeenCalled()
  })

  it('maps provider projects into the page view model', async () => {
    mocks.fetchProviderProjects.mockResolvedValue([{
      project: {
        project_id: 7,
        project_name: 'Night road closure',
        closure_type: 'Road closure',
        start_date: '2026-11-20',
        end_date: '2026-11-22',
        location: '',
      },
      progress: 45,
      status: 'Active',
      site_status: 'Work in Progress',
      field_team_count: 3,
      completion_submitted: false,
      quote: { price: 12500 },
    }])

    const [project] = await getProviderProjects()
    expect(mocks.fetchProviderProjects).toHaveBeenCalledWith('provider-token')
    expect(project).toMatchObject({
      id: 7,
      code: 'PRJ-007',
      name: 'Night road closure',
      location: 'Saved location',
      duration: '3 days',
      progress: 45,
      status: 'Active',
      teamCount: 3,
      price: 12500,
    })
  })

  it('uses backend location and null quote price when supplied', async () => {
    mocks.fetchProviderProjects.mockResolvedValue([{
      project: { project_id: 2, project_name: 'A', closure_type: 'TTC', start_date: 'bad', end_date: 'bad', location: 'Riyadh' },
      progress: 0, status: 'Upcoming', site_status: 'Not Started', field_team_count: 0,
      completion_submitted: false, quote: null,
    }])
    const [project] = await getProviderProjects()
    expect(project.location).toBe('Riyadh')
    expect(project.duration).toBe('1 days')
    expect(project.price).toBeNull()
  })
})
