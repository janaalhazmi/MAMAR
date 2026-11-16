import { beforeEach, describe, expect, it, vi } from 'vitest'

const m = vi.hoisted(() => ({
  getSession: vi.fn(), fetchFieldProject: vi.fn(), fetchFieldProjects: vi.fn(), patchSiteStatus: vi.fn(),
  postCheckIn: vi.fn(), postDeviceVerify: vi.fn(), postPhotos: vi.fn(), getProjectMeta: vi.fn(),
}))
vi.mock('../../services/auth', () => ({ getSession: (...a) => m.getSession(...a) }))
vi.mock('../../services/api', () => ({
  fetchFieldProject: (...a) => m.fetchFieldProject(...a), fetchFieldProjects: (...a) => m.fetchFieldProjects(...a),
  patchSiteStatus: (...a) => m.patchSiteStatus(...a), postCheckIn: (...a) => m.postCheckIn(...a),
  postDeviceVerify: (...a) => m.postDeviceVerify(...a), postPhotos: (...a) => m.postPhotos(...a),
}))
vi.mock('../../services/projects', () => ({ getProjectMeta: (...a) => m.getProjectMeta(...a) }))
vi.mock('../../services/projectFlow', () => ({
  SERVICE_LABELS: { 'ttc-plan': 'TTC Plan' },
  formatDate: (v) => `date:${v}`,
  formatDateRange: (a, b) => `${a}-${b}`,
  formatDateTime: (v) => `datetime:${v}`,
  formatTime: (v) => v ? `time:${v}` : '',
  toUiPhoto: (p) => ({ id: p.photo_id, src: p.url, caption: p.caption || 'Site photo', time: p.created_at ? `photo:${p.created_at}` : '' }),
}))
import * as fieldWork from '../../services/fieldWork'

const project = (id, status, siteStatus, extra = {}) => ({
  project: { project_id: id, project_name: `Project ${id}`, closure_type: 'Road work', project_status: status, start_date: '2026-01-01', end_date: '2026-01-03', services: ['ttc-plan', 'unknown'], location: '', latitude: 24.7, longitude: 46.6, ...extra },
  site_status: siteStatus, progress: 40, team: [{ user_id: 1, full_name: 'Ali Hassan' }, { user_id: 2, full_name: 'Mona' }],
})
beforeEach(() => {
  sessionStorage.clear()
  m.getSession.mockReset().mockReturnValue({ access_token: 'worker-token' })
  m.fetchFieldProjects.mockReset().mockResolvedValue([])
  m.fetchFieldProject.mockReset().mockResolvedValue({ project: project(1, 'active', 'Work in Progress').project, progress: 40, site_status: 'Work in Progress', team: [], photos: [], last_check_in: null })
  m.patchSiteStatus.mockReset().mockResolvedValue({})
  m.postCheckIn.mockReset().mockResolvedValue({ last_check_in: '2026-11-17T08:30:00Z' })
  m.postDeviceVerify.mockReset().mockResolvedValue({ device: 'DV-1', project_id: 1, planned_latitude: 24.7, planned_longitude: 46.6, distance_m: 12, max_distance_m: 50, status: 'verified' })
  m.postPhotos.mockReset().mockResolvedValue([{ photo_id: 3, url: '/photo.jpg', caption: 'Barrier' }])
  m.getProjectMeta.mockReturnValue({})
})

describe('fieldWork service workflows', () => {
  it('summarizes active, upcoming and completed projects with deduplicated workers', async () => {
    m.fetchFieldProjects.mockResolvedValue([
      { ...project(1, 'active', 'Work in Progress'), team: [{ user_id: 1 }, { user_id: 2 }] },
      { ...project(2, 'active', 'Paused'), team: [{ user_id: 2 }, { user_id: 3 }] },
      { ...project(3, 'active', 'Not Started', { services: ['unknown'] }), team: [] },
      { ...project(4, 'completed', 'Completed'), team: [] },
    ])
    const result = await fieldWork.getFieldWorkerDashboard()
    expect(result.stats).toEqual({ assigned: 4, active: 2, upcoming: 1, completed: 1 })
    expect(result.overview).toEqual({ workersActive: 3, sitesActive: 2 })
    expect(result.newProject).toMatchObject({ id: 3, name: 'Project 3', services: ['unknown'], status: 'Ready to Start' })
    expect(result.activeProjects).toHaveLength(2)
  })
  it('returns no upcoming project and handles saved/project-coordinate location fallbacks', async () => {
    m.fetchFieldProjects.mockResolvedValue([{ ...project(1, 'active', 'Work in Progress'), team: [] }])
    m.getProjectMeta.mockReturnValue({ location: 'Saved location' })
    const result = await fieldWork.getFieldWorkerDashboard()
    expect(result.newProject).toBeNull()
    expect(result.activeProjects[0].location).toBe('Saved location')
  })
  it('maps execution details, photos, team initials, unknown status and service fallbacks', async () => {
    m.fetchFieldProject.mockResolvedValue({
      project: { project_id: 5, project_name: 'Road', closure_type: 'Road work', project_status: 'custom', start_date: '2026-01-01', end_date: '2026-01-03', services: ['ttc-plan', 'unknown'], latitude: null, longitude: null, work_zone: { rings: [] } },
      progress: 75, site_status: 'Paused', team: [{ user_id: 1, full_name: 'Ali Hassan' }, { user_id: 2, full_name: 'Mona' }],
      photos: [{ photo_id: 9, url: '/p.jpg', caption: 'Barrier', created_at: '2026-11-17' }], last_check_in: '2026-11-17T08:00:00Z',
    })
    const result = await fieldWork.getFieldExecution(5)
    expect(result.project).toMatchObject({ id: 5, name: 'Road', servicesLabel: 'Temporary Traffic Control + unknown', status: 'custom' })
    expect(result.planned).toEqual({ latitude: null, longitude: null, workZone: { rings: [] } })
    expect(result.site).toMatchObject({ teamCount: 2, todayCheckIn: 'time:2026-11-17T08:00:00Z', lastUpdate: 'photo:2026-11-17' })
    expect(result.team.map((x) => x.initials)).toEqual(['AH', 'M'])
    expect(result.photos[0]).toMatchObject({ id: 9, caption: 'Barrier' })
  })
  it('uses Not specified, Not yet and dash fallbacks when execution fields are missing', async () => {
    m.fetchFieldProject.mockResolvedValue({ project: { project_id: 6, project_name: 'Empty', services: [], project_status: 'draft' }, team: [], photos: [], progress: 0, site_status: 'Not Started' })
    const result = await fieldWork.getFieldExecution(6)
    expect(result.project.servicesLabel).toBe('Not specified')
    expect(result.project.location).toBe('Not specified')
    expect(result.site).toMatchObject({ teamCount: 0, todayCheckIn: 'Not yet', lastUpdate: '–' })
  })
  it('updates status and returns a formatted check-in time with fallback time', async () => {
    await expect(fieldWork.updateSiteStatus(4, 'Paused')).resolves.toEqual({ projectId: 4, status: 'Paused' })
    expect(m.patchSiteStatus).toHaveBeenCalledWith('worker-token', 4, 'Paused')
    await expect(fieldWork.siteCheckIn(4)).resolves.toEqual({ time: 'time:2026-11-17T08:30:00Z' })
    m.postCheckIn.mockResolvedValueOnce({})
    await expect(fieldWork.siteCheckIn(4)).resolves.toMatchObject({ time: expect.stringContaining('time:') })
  })
  it('uploads valid photos with default captions and stages and maps returned photos', async () => {
    const file = new File(['photo'], 'site.jpg', { type: 'image/jpeg' })
    const result = await fieldWork.uploadSitePhotos(4, [{ file }, { file, caption: 'Sign', stage: 'before' }])
    expect(m.postPhotos).toHaveBeenCalledWith('worker-token', 4, expect.any(FormData))
    const form = m.postPhotos.mock.calls[0][2]
    expect(form.getAll('captions')).toEqual(['Site photo', 'Sign'])
    expect(form.getAll('stages')).toEqual(['during', 'before'])
    expect(result[0]).toMatchObject({ id: 3, caption: 'Barrier' })
  })
  it('gets device by explicit project, active project, first fallback or no project', async () => {
    m.fetchFieldProject.mockResolvedValueOnce({ project: { project_id: 7, project_name: 'Explicit', latitude: 1, longitude: 2 } })
    await expect(fieldWork.getDevice('DV-7', 7)).resolves.toMatchObject({ id: 'DV-7', projectId: 7, projectName: 'Explicit' })
    m.fetchFieldProjects.mockResolvedValueOnce([{ ...project(8, 'completed', 'Completed') }, { ...project(9, 'active', 'Work in Progress') }])
    await expect(fieldWork.getDevice('DV-8')).resolves.toMatchObject({ projectId: 9, projectName: 'Project 9' })
    m.fetchFieldProjects.mockResolvedValueOnce([{ ...project(10, 'completed', 'Completed') }])
    await expect(fieldWork.getDevice('DV-10')).resolves.toMatchObject({ projectId: 10 })
    m.fetchFieldProjects.mockResolvedValueOnce([])
    await expect(fieldWork.getDevice('DV-none')).resolves.toMatchObject({ projectId: null, projectName: 'Project', planned: null })
  })
  it('saves device verification and normalizes absent accuracy', async () => {
    await expect(fieldWork.saveDeviceVerification({ deviceId: 'DV-1', projectId: '4', captured: { latitude: 1, longitude: 2 } })).resolves.toMatchObject({ deviceId: 'DV-1', projectId: 1, distanceMeters: 12, status: 'verified' })
    expect(m.postDeviceVerify).toHaveBeenCalledWith('worker-token', 'DV-1', { project_id: 4, latitude: 1, longitude: 2, accuracy: null })
  })
  it('rejects protected actions without session and translates all GPS errors', async () => {
    m.getSession.mockReturnValue(null)
    await expect(fieldWork.getFieldWorkerDashboard()).rejects.toThrow(/sign in/i)
    await expect(fieldWork.getFieldExecution(1)).rejects.toThrow(/sign in/i)
    await expect(fieldWork.updateSiteStatus(1, 'Paused')).rejects.toThrow(/sign in/i)
    await expect(fieldWork.siteCheckIn(1)).rejects.toThrow(/sign in/i)
    await expect(fieldWork.getDevice('DV')).rejects.toThrow(/sign in/i)
    await expect(fieldWork.saveDeviceVerification({ deviceId: 'DV', projectId: 1, captured: {} })).rejects.toThrow(/sign in/i)
    m.getSession.mockReturnValue({ access_token: 'worker-token' })
    const originalGeolocation = navigator.geolocation
    try {
      for (const [code, phrase] of [[2, 'position is unavailable'], [3, 'took too long'], [9, 'Could not get your location']]) {
        Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_ok, fail) => fail({ code }) } })
        await expect(fieldWork.captureCurrentLocation(null)).rejects.toThrow(phrase)
      }
    } finally {
      Object.defineProperty(navigator, 'geolocation', { configurable: true, value: originalGeolocation })
    }
  })
})
