import { beforeEach, describe, expect, it } from 'vitest'
import * as contractor from '../Contractor.js'

const tomorrow = () => {
  const d = new Date()
  d.setDate(d.getDate() + 1)
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

describe('Contractor project workflow domain logic', () => {
  beforeEach(() => sessionStorage.clear())

  it('normalizes a missing current project and maps projectId to id', () => {
    expect(contractor.getCurrentProject().id).toBeNull()
    sessionStorage.setItem(contractor.KEYS.project, JSON.stringify({ projectId: 42, name: 'Road work' }))
    expect(contractor.getCurrentProject()).toMatchObject({ id: 42, name: 'Road work', services: [] })
  })

  it('saves and merges draft fields without losing existing values', () => {
    contractor.saveDraftProject({ name: 'A' })
    expect(contractor.saveDraftProject({ type: 'Road closure' })).toMatchObject({ name: 'A', type: 'Road closure' })
    expect(contractor.getDraftProject().name).toBe('A')
  })

  it('clears the draft when starting a new project', () => {
    contractor.saveDraftProject({ name: 'Old project' })
    contractor.startNewProject()
    expect(contractor.getDraftProject()).toEqual({})
  })

  it('stores a selected project in the project flow', () => {
    contractor.openProjectInFlow({ id: 9, name: 'Bridge', location: 'Not specified', services: ['ttc-plan'] })
    expect(contractor.getDraftProject()).toMatchObject({ id: 9, projectId: 9, name: 'Bridge', location: '', services: ['ttc-plan'] })
  })

  it.each([
    [{ backendStatus: 'draft', hasRequestedQuotes: false }, { label: 'Continue', to: '/providers' }],
    [{ backendStatus: 'draft', hasRequestedQuotes: true }, { label: 'Continue', to: '/quotations' }],
    [{ backendStatus: 'active' }, { label: 'Monitor', to: '/project-monitoring' }],
    [{ backendStatus: 'completed' }, { label: 'View', to: '/project-monitoring' }],
    [{ backendStatus: 'unknown' }, null],
  ])('chooses the correct next step for %o', (project, expected) => {
    expect(contractor.nextStepFor(project)).toEqual(expected)
  })

  it('maps work-zone rings to geographic points and rejects invalid rings', () => {
    expect(contractor.zoneToPoints(null)).toBeNull()
    expect(contractor.zoneToPoints({ rings: [[ [1, 2], [3, 4] ]] })).toBeNull()
    expect(contractor.zoneToPoints({ rings: [[ [46, 24], [47, 24], [47, 25] ]] })).toEqual([[46, 24], [47, 24], [47, 25]])
  })

  it('converts Web Mercator work-zone coordinates to longitude and latitude', () => {
    const points = contractor.zoneToPoints({ spatialReference: { wkid: 3857 }, rings: [[ [0, 0], [111319.49, 0], [0, 111325.14] ]] })
    expect(points[0]).toEqual([0, 0])
    expect(points[1][0]).toBeCloseTo(1, 3)
    expect(points[2][1]).toBeCloseTo(1, 3)
  })

  it('calculates project statistics and dashboard sections', () => {
    const projects = [
      { id: 1, statusLabel: 'In Progress', name: 'A', createdAt: '2026-01-01T00:00:00Z' },
      { id: 2, statusLabel: 'Completed', name: 'B', createdAt: '2026-01-02T00:00:00Z' },
      { id: 3, statusLabel: 'Pending Quotes', name: 'C', createdAt: '2026-01-03T00:00:00Z' },
    ]
    expect(contractor.getStats(projects)).toEqual({ total: 3, inProgress: 1, completed: 1, pendingQuotes: 1 })
    expect(contractor.buildDashboard(projects).projects).toHaveLength(3)
    expect(contractor.buildDashboard(projects).statistics[0].value).toBe(3)
  })

  it('filters projects by case-insensitive name, location and status', () => {
    const rows = [
      { name: 'Main Road', location: 'Riyadh', statusLabel: 'In Progress' },
      { name: 'Bridge', location: 'Jeddah', statusLabel: 'Completed' },
    ]
    expect(contractor.filterProjects(rows, 'RIY', 'All')).toEqual([rows[0]])
    expect(contractor.filterProjects(rows, '', 'Completed')).toEqual([rows[1]])
  })

  it('updates project fields and clears an invalidated end date', () => {
    expect(contractor.updateProjectField({ startDate: '2026-01-01', endDate: '2026-01-10' }, 'startDate', '2026-01-12'))
      .toEqual({ startDate: '2026-01-12', endDate: '' })
  })

  it('validates project details before saving', () => {
   expect(() => contractor.saveProjectDetails({
  name: '',
  type: '',
  startDate: '',
  endDate: '',
  description: '',
})).toThrow(/complete all project details/i)
    expect(() => contractor.saveProjectDetails({ name: 'A', type: 'Road', startDate: '2000-01-01', endDate: '2000-01-02', description: 'Details' }))
      .toThrow(/past/i)
    expect(() => contractor.saveProjectDetails({ name: 'A', type: 'Road', startDate: tomorrow(), endDate: tomorrow(), description: 'Details' }))
      .toThrow(/at least one day/i)
  })

  it('saves a valid project location and reads it back', () => {
    const polygon = { rings: [[[1, 2], [2, 3], [3, 4]]] }
    const location = { address: 'Riyadh', latitude: 24, longitude: 46, area: 100, polygon }
    contractor.saveProjectLocation(location)
    expect(contractor.getSavedLocation()).toMatchObject({ address: 'Riyadh', latitude: 24, longitude: 46, polygon })
    expect(() => contractor.saveProjectLocation({ ...location, polygon: null })).toThrow(/polygon/i)
  })

  it('applies map selection and resets a cleared selection', () => {
    const selected = contractor.applyMapSelection({}, { latitude: 24, longitude: 46, area: 200, polygon: { rings: [] } })
    expect(selected.address).toBe('24, 46')
    expect(contractor.applyMapSelection(selected, null)).toMatchObject({ latitude: null, longitude: null, address: '', polygon: null })
  })

  it('toggles services and prevents saving an empty service selection', () => {
    expect(contractor.toggleService(['ttc-plan'], 'road-signs')).toEqual(['ttc-plan', 'road-signs'])
    expect(contractor.toggleService(['ttc-plan', 'road-signs'], 'ttc-plan')).toEqual(['road-signs'])
    expect(() => contractor.saveProjectServices([])).toThrow(/at least one service/i)
    contractor.saveProjectServices(['ttc-plan'])
    expect(contractor.getSelectedServices()).toEqual(['ttc-plan'])
  })

  it('builds project summaries and selected service options', () => {
    const summary = contractor.buildProjectSummary({ name: 'Road', type: 'Closure', latitude: 24, longitude: 46, area: 1200, polygon: true })
    expect(summary).toMatchObject({ name: 'Road', latitude: '24.000000', longitude: '46.000000', area: '1,200 m²', workZone: 'Polygon completed' })
    expect(contractor.getSelectedServiceOptions({ services: ['ttc-plan'] })).toHaveLength(1)
    expect(contractor.formatServices(['ttc-plan', 'unknown'])).toContain('unknown')
    expect(contractor.hasProjectLocation({ latitude: 0, longitude: 0 })).toBe(true)
  })

  it('filters providers by search, city and service', () => {
    expect(contractor.filterProviders({ search: 'tcm', city: 'Riyadh', service: 'All Required Services' })).toHaveLength(1)
    expect(contractor.filterProviders({ search: '', city: 'Jeddah', service: 'All Required Services' })).toHaveLength(0)
    expect(contractor.filterProviders({ search: '', city: 'Riyadh', service: 'Site Safety' })).toHaveLength(1)
  })

  it('returns provider summary and selected quote status', () => {
    contractor.saveDraftProject({ name: 'Road', location: 'Riyadh', services: ['ttc-plan'] })
    expect(contractor.getProviderPageSummary()).toMatchObject({ name: 'Road', location: 'Riyadh' })
    expect(contractor.getReceived([{ status: 'received' }, { status: 'rejected' }])).toHaveLength(1)
  })

  it('manages local notification read states and project-created notifications', () => {
    const initial = contractor.getNotifications()
    expect(initial.length).toBeGreaterThan(0)
    expect(contractor.markNotificationAsRead(initial[0].id).find((n) => n.id === initial[0].id).read).toBe(true)
    expect(contractor.markAllNotificationsAsRead().every((n) => n.read)).toBe(true)
    const added = contractor.addProjectCreatedNotification({ name: 'Night road closure' })
    expect(added[0].message).toContain('Night road closure')
    expect(added[0].read).toBe(false)
  })
})
