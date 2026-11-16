import { beforeEach, afterEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({
  authed: vi.fn(),
  getProjects: vi.fn(), createProject: vi.fn(), updateProject: vi.fn(),
  postServiceRequest: vi.fn(), fetchProjectQuotations: vi.fn(), postRejectQuote: vi.fn(),
  postConfirmProvider: vi.fn(), fetchMonitoring: vi.fn(), fetchCompletion: vi.fn(),
  postCompleteProject: vi.fn(), postRequestChanges: vi.fn(),
  fetchFieldProjects: vi.fn(), fetchFieldProject: vi.fn(), patchSiteStatus: vi.fn(),
  postCheckIn: vi.fn(), postDeviceVerify: vi.fn(), postPhotos: vi.fn(),
  fetchAdminSummary: vi.fn(), fetchAdminUsers: vi.fn(), fetchAdminCompanies: vi.fn(),
  fetchProviderProjects: vi.fn(), fetchProviderDashboard: vi.fn(), fetchProviderRequests: vi.fn(),
  postDeclineRequest: vi.fn(), postQuotation: vi.fn(),
}));
const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../auth', () => auth);
vi.mock('../api', () => ({
  API_BASE_URL: 'https://api.example.test', JSON_H: { 'Content-Type': 'application/json' },
  asJson: JSON.stringify, ...api,
}));
vi.mock('../projects', () => ({ getProjectMeta: vi.fn(() => ({})) }));

import * as contractor from '../Contractor/Contractor';
import * as fieldWork from '../fieldWork';
import * as attendance from '../attendance';
import * as profileUtils from '../Contractor/profileUtils';
import * as weather from '../weather';
import * as providerFlow from '../providers/providerFlow';
import * as providerQuotes from '../providers/providerQuotes';
import * as projectFlow from '../projectFlow';

const baseProject = {
  name: 'Road renewal', type: 'Infrastructure', startDate: '2099-01-01',
  endDate: '2099-01-10', description: 'Repair work', latitude: 24.7,
  longitude: 46.6, services: ['ttc-plan'], location: 'Riyadh',
};

beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); vi.clearAllMocks();
  auth.getSession.mockReturnValue({ access_token: 'test-token', user: { full_name: 'Test User' } });
  api.authed.mockResolvedValue({ project_id: 77 });
  api.postServiceRequest.mockResolvedValue({ ok: true });
  api.postCompleteProject.mockResolvedValue({ project_status: 'completed' });
  api.postRequestChanges.mockResolvedValue({ project_status: 'active' });
  api.fetchProjectQuotations.mockResolvedValue([]);
  api.fetchProviderProjects.mockResolvedValue([]);
  api.fetchProviderRequests.mockResolvedValue([]);
  api.fetchProviderDashboard.mockResolvedValue({ new_requests: [], pending_quotes: 0, stats: {}, active_projects: [], overview: { workers_active: 0, sites_active: 0, field_workers: 0 }, next_project: null });
  api.postQuotation.mockResolvedValue({ quote_id: 1 });
  api.postDeclineRequest.mockResolvedValue({ ok: true });
  api.fetchMonitoring.mockResolvedValue({ project_status: 'active', progress: 25, field_team_count: 2, site_status: 'Work in Progress', completion_submitted: false, photos: [], provider: null });
  api.fetchCompletion.mockResolvedValue({ progress: 100, services: ['ttc-plan'], photos: [], quote: null });
  api.fetchFieldProjects.mockResolvedValue([]);
  api.fetchFieldProject.mockResolvedValue({ project: { project_id: 10, project_name: 'Road', latitude: 24, longitude: 46 } });
  api.postCheckIn.mockResolvedValue({ last_check_in: '2025-01-01T00:00:00Z' });
  api.postDeviceVerify.mockResolvedValue({ device: 'DV-1', project_id: 10, planned_latitude: 24, planned_longitude: 46, distance_m: 5, max_distance_m: 50, status: 'verified' });
  api.postPhotos.mockResolvedValue([{ photo_id: 9, url: '/photo.jpg', caption: 'Evidence', created_at: '2025-01-01T00:00:00Z' }]);
});
afterEach(() => { vi.useRealTimers(); });

describe('Contractor workflow service – formatters and project state', () => {
  it('handles missing, valid and invalid server dates', () => {
    expect(contractor.parseServerDate('')).toBeNull();
    expect(contractor.parseServerDate('not-a-date')).toBeNull();
    expect(contractor.parseServerDate('2025-01-02T03:04:05Z')).toBeInstanceOf(Date);
    expect(contractor.formatDateTime('bad')).toBe('');
    expect(contractor.formatTime(null)).toBe('');
    expect(contractor.formatDate('')).toBe('Not specified');
    expect(contractor.formatDate('bad-date')).toBe('bad-date');
    expect(contractor.formatDateRange('', '2025-01-01')).toBe('Not specified');
    expect(contractor.formatPrice(1234)).toContain('1,234');
    expect(contractor.absUrl('')).toBe('');
    expect(contractor.absUrl('https://cdn.test/a.png')).toBe('https://cdn.test/a.png');
    expect(contractor.absUrl('/a.png')).toBe('https://api.example.test/a.png');
  });

  it('maps photos and converts geographic and Web Mercator polygons', () => {
    expect(contractor.toUiPhoto({ photo_id: 3, url: '/p.jpg', created_at: null })).toMatchObject({ id: 3, src: 'https://api.example.test/p.jpg', caption: 'Site photo' });
    expect(contractor.zoneToPoints(null)).toBeNull();
    expect(contractor.zoneToPoints({ rings: [[1, 2]] })).toBeNull();
    expect(contractor.zoneToPoints({ rings: [[ [10, 20], [11, 20], [11, 21] ]] })).toEqual([[10,20],[11,20],[11,21]]);
    expect(contractor.zoneToPoints({ polygon: { rings: [[ [0,0], [1000,0], [1000,1000] ]], spatialReference: { wkid: 3857 } } })).toHaveLength(3);
    const huge = Array.from({ length: 510 }, (_, i) => [i % 170, Math.floor(i / 170)]);
    expect(contractor.zoneToPoints(huge).length).toBeLessThanOrEqual(500);
  });

  it('covers project storage defaults, IDs, navigation and status tones', () => {
    expect(contractor.getCurrentProject()).toMatchObject({ name: '', id: null, services: [] });
    sessionStorage.setItem(contractor.KEYS.project, '{bad');
    expect(contractor.getCurrentProject().id).toBeNull();
    sessionStorage.setItem(contractor.KEYS.project, JSON.stringify({ id: 9, name: 'A' }));
    expect(contractor.getCurrentProject()).toMatchObject({ id: 9, name: 'A' });
    contractor.startNewProject(); expect(sessionStorage.getItem(contractor.KEYS.project)).toBeNull();
    contractor.openProjectInFlow({ id: 5, name: 'Road', location: 'Not specified' });
    expect(contractor.getCurrentProject()).toMatchObject({ id: 5, location: '' });
    expect(contractor.nextStepFor({ backendStatus: 'draft', hasRequestedQuotes: false })).toEqual({ label: 'Continue', to: '/providers' });
    expect(contractor.nextStepFor({ backendStatus: 'draft', hasRequestedQuotes: true })).toEqual({ label: 'Continue', to: '/quotations' });
    expect(contractor.nextStepFor({ backendStatus: 'active' }).to).toBe('/project-monitoring');
    expect(contractor.nextStepFor({ backendStatus: 'completed' }).label).toBe('View');
    expect(contractor.nextStepFor({ backendStatus: 'other' })).toBeNull();
    expect(contractor.thumbTone({ statusTone: 'completed' })).toBe('green');
    expect(contractor.thumbTone({ statusTone: 'planned' })).toBe('grey');
    expect(contractor.thumbTone({ statusTone: 'cancelled' })).toBe('grey');
    expect(contractor.thumbTone({})).toBe('orange');
  });

  it('covers dashboard, filtering, display user and draft helpers', () => {
    const projects = [
      { id: 1, name: 'Road A', location: 'Riyadh', statusLabel: 'In Progress', createdAt: '2025-01-01' },
      { id: 2, name: 'Road B', location: 'Jeddah', statusLabel: 'Completed', createdAt: '2025-01-02' },
      { id: 3, name: 'Bridge', location: 'Dammam', statusLabel: 'Pending Quotes', createdAt: '2025-01-03' },
    ];
    expect(contractor.getStats(projects)).toEqual({ total: 3, inProgress: 1, completed: 1, pendingQuotes: 1 });
    expect(contractor.buildDashboard(projects).projects).toHaveLength(3);
    expect(contractor.buildActivity(projects, 2)[0].id).toBe('created-3');
    expect(contractor.buildActivity([{ id: 4, name: 'No date' }])[0].time).toBe('');
    expect(contractor.filterProjects(projects, 'ROAD', 'All')).toHaveLength(2);
    expect(contractor.filterProjects(projects, 'dam', 'Pending Quotes')).toHaveLength(1);
    expect(contractor.filterProjects(projects, 'missing', 'All')).toHaveLength(0);
    expect(contractor.openProject({ backendStatus: 'unknown' })).toBeNull();
    expect(contractor.openProject({ id: 2, backendStatus: 'active' })).toBe('/project-monitoring');
    expect(contractor.getDisplayUser()).toMatchObject({ displayName: 'Test User', userInitial: 'T', firstName: 'Test' });
    auth.getSession.mockReturnValue({ user: { name: '  ' } });
    expect(contractor.getDisplayUser('Guest').displayName).toBe('Guest');
    contractor.saveDraftProject({ name: 'Draft' });
    expect(contractor.getDraftProject()).toMatchObject({ name: 'Draft' });
    expect(contractor.formatServices(['ttc-plan', 'custom'])).toContain('custom');
    expect(contractor.formatServices([])).toBe('Not specified');
    expect(contractor.hasProjectLocation({ latitude: 0, longitude: 0 })).toBe(true);
    expect(contractor.hasProjectLocation({ latitude: null, longitude: 0 })).toBe(false);
    expect(contractor.getNextDate('2025-01-01')).toBe('2025-01-02');
    expect(contractor.getNextDate('')).toBe(contractor.getToday());
  });

  it('validates and saves project details, location and services', () => {
    expect(() => contractor.saveProjectDetails({})).toThrow('Please complete all project details.');
    expect(() => contractor.saveProjectDetails({ ...baseProject, startDate: '2000-01-01' })).toThrow('Start date cannot be in the past.');
    expect(() => contractor.saveProjectDetails({ ...baseProject, endDate: baseProject.startDate })).toThrow('End date must be at least one day after the start date.');
    contractor.saveProjectDetails(baseProject);
    expect(contractor.getDraftProject()).toMatchObject({ name: 'Road renewal' });
    expect(contractor.getSavedLocation()).toMatchObject({ address: 'Riyadh', latitude: 24.7 });
    expect(contractor.applyMapSelection({ zoom: 10 }, null)).toMatchObject({ zoom: 10, latitude: null, polygon: null });
    expect(contractor.applyMapSelection({}, { latitude: 1, longitude: 2, area: 4, polygon: [[1,2]] })).toMatchObject({ address: '1, 2', area: 4 });
    expect(() => contractor.saveProjectLocation({})).toThrow('Please draw and finish the work zone polygon');
    expect(() => contractor.saveProjectLocation({ polygon: [[1,2]], latitude: null, longitude: 2 })).toThrow('Please draw and finish the project work zone');
    contractor.saveProjectLocation({ polygon: [[1,2]], latitude: 1, longitude: 2, address: 'Riyadh', area: 12 });
    expect(contractor.getSavedLocation()).toMatchObject({ address: 'Riyadh', latitude: 1 });
    expect(contractor.getSelectedServices()).toEqual(['ttc-plan']);
    expect(contractor.toggleService(['a'], 'a')).toEqual([]);
    expect(contractor.toggleService([], 'b')).toEqual(['b']);
    expect(() => contractor.saveProjectServices([])).toThrow('Please select at least one service.');
    contractor.saveProjectServices(['road-signs']);
    expect(contractor.getSelectedServices()).toEqual(['road-signs']);
    expect(contractor.buildProjectSummary({})).toMatchObject({ name: 'Not specified', latitude: 'Not specified', workZone: 'Not selected' });
    expect(contractor.buildProjectSummary({ ...baseProject, area: 1000, polygon: [[1,2]] })).toMatchObject({ latitude: '24.700000', area: '1,000 m²', workZone: 'Polygon completed' });
    expect(contractor.getSelectedServiceOptions({ services: ['ttc-plan'] })).toHaveLength(1);
    expect(contractor.getSelectedServiceOptions({ services: 'bad' })).toHaveLength(0);
  });

  it('covers review validations and successful draft persistence', async () => {
    await expect(contractor.handleSaveDraft({})).rejects.toThrow('Project details are incomplete');
    await expect(contractor.handleConfirmProject({ ...baseProject, type: 'x'.repeat(51) })).rejects.toThrow('Project type is too long');
    await expect(contractor.handleConfirmProject({ ...baseProject, latitude: null })).rejects.toThrow('Please select a project location');
    await expect(contractor.handleConfirmProject({ ...baseProject, services: [] })).rejects.toThrow('Please select at least one service');
    const saved = await contractor.handleConfirmProject(baseProject);
    expect(api.authed).toHaveBeenCalledWith('/projects', 'test-token', expect.objectContaining({ method: 'POST' }));
    expect(saved).toMatchObject({ id: 77, projectId: 77, status: 'submitted' });
    const draft = await contractor.handleSaveDraft({ ...baseProject, projectId: 77 });
    expect(api.authed).toHaveBeenCalledWith('/projects/77', 'test-token', expect.objectContaining({ method: 'PATCH' }));
    expect(draft.status).toBe('draft');
  });

  it('filters providers and handles quotation storage and mapping', async () => {
    expect(contractor.filterProviders({ search: '', city: 'Riyadh', service: 'All Required Services' })).toHaveLength(4);
    expect(contractor.filterProviders({ search: 'safety', city: 'Riyadh', service: 'Road Signs' }).length).toBeGreaterThan(0);
    expect(contractor.filterProviders({ search: 'x', city: 'Riyadh', service: 'Road Signs' })).toHaveLength(0);
    expect(contractor.getProviderPageSummary({})).toMatchObject({ name: 'No project selected', location: 'Not specified' });
    expect(contractor.getReceived([{ status: 'received' }, { status: 'rejected' }])).toHaveLength(1);
    sessionStorage.setItem(contractor.KEYS.providerIds, '[1,2]');
    expect(contractor.getSelectedProviderIds()).toEqual([1,2]);
    sessionStorage.setItem(contractor.KEYS.project, JSON.stringify({ id: 7, name: 'Road', services: ['ttc-plan'] }));
    // Contractor.js wraps these API calls through `authed`; the individual
    // api.* wrapper mocks above are not called by its same-module helpers.
    api.authed.mockImplementation((...args) => {
      const path = String(args[0] ?? '');
      if (path.includes('/requests')) return Promise.resolve({ ok: true });
      if (path.includes('/quotations')) return Promise.resolve([
        { quote_id: 4, request_id: 2, provider_id: 88, price: 300, duration_days: 3, status: 'rejected' },
      ]);
      if (path.includes('/monitoring')) return Promise.resolve({
        project_status: 'mystery', progress: 10, field_team_count: 0,
        site_status: 'Not Started', completion_submitted: false, photos: [], provider: null,
      });
      if (path.includes('/completion')) return Promise.resolve({
        progress: 100, submitted_at: '2025-01-02T00:00:00Z',
        services: ['ttc-plan', 'custom'], photos: [{ photo_id: 1, url: '/p', caption: 'proof' }],
        quote: { notes: 'All done' },
      });
      if (path.includes('/complete')) return Promise.resolve({ project_status: 'completed' });
      if (path.includes('/request-changes')) return Promise.resolve({ project_status: 'active' });
      return Promise.resolve({ success: true });
    });
    await expect(contractor.requestQuotes()).resolves.toEqual({ ok: true });
    await expect(contractor.requestQuotes({ id: null, services: [] }, [])).rejects.toThrow('No project selected');
    await expect(contractor.requestQuotes({ id: 7, services: [] }, ['bad'])).rejects.toThrow('Please select valid providers');
    const quotes = await contractor.getQuotations(7);
    expect(quotes[0]).toMatchObject({ id: 4, providerName: 'Provider #88', status: 'rejected', providerLogo: null });
    expect(await contractor.getQuotationById(4)).toMatchObject({ id: 4 });
    expect(contractor.getSelectedQuotationId()).toBeNull();
    contractor.saveSelectedQuotation(4);
    expect(contractor.getSelectedQuotationId()).toBe(4);
    api.postRejectQuote.mockResolvedValue({});
    expect(await contractor.rejectQuotation(4)).toEqual({ id: 4, status: 'rejected' });
    api.postConfirmProvider.mockResolvedValue({ success: true });
    await contractor.confirmProvider(7, 4);
    expect(contractor.getConfirmedQuotationId()).toBe(4);
    expect(await contractor.getSelectedQuotation()).toMatchObject({ id: 4 });
    expect(await contractor.getConfirmedProvider()).toMatchObject({ id: 4 });
  });

  it('maps monitoring and completion data across empty and populated states', async () => {
    await expect(contractor.getMonitoringData(null)).rejects.toThrow('No project selected');
    api.authed.mockImplementation((...args) => {
      const path = String(args[0] ?? '');
      if (path.includes('/monitoring')) {
        return Promise.resolve({ project_status: 'mystery', progress: 10, field_team_count: 0, site_status: 'Not Started', completion_submitted: false, photos: [], provider: null });
      }
      if (path.includes('/completion')) {
        return Promise.resolve({ progress: 100, submitted_at: '2025-01-02T00:00:00Z', services: ['ttc-plan', 'custom'], photos: [{ photo_id: 1, url: '/p', caption: 'proof' }], quote: { notes: 'All done' } });
      }
      if (path.includes('/complete')) return Promise.resolve({ project_status: 'completed' });
      if (path.includes('/request-changes')) return Promise.resolve({ project_status: 'active' });
      return Promise.resolve({});
    });
    const empty = await contractor.getMonitoringData(1);
    expect(empty).toMatchObject({ status: 'mystery', latestUpdate: { title: 'No updates yet' }, provider: null });
    expect(empty.milestones[0].state).toBe('pending');
    api.authed.mockImplementation((...args) => {
      const path = String(args[0] ?? '');
      if (path.includes('/monitoring') && path.includes('/2/')) return Promise.resolve({ project_status: 'completed', progress: 100, field_team_count: 2, site_status: 'Completed', completion_submitted: true, photos: [{ photo_id: 2, url: '/x', caption: 'Done', created_at: '2025-01-01T00:00:00Z' }], provider: { provider_id: 1, company_name: 'TCM', service_type: 'Traffic' } });
      if (path.includes('/monitoring')) return Promise.resolve({ project_status: 'active', progress: 30, field_team_count: 1, site_status: 'Paused', last_check_in: '2025-01-01T00:00:00Z', photos: [], completion_submitted: false });
      if (path.includes('/completion')) return Promise.resolve({ progress: 100, submitted_at: '2025-01-02T00:00:00Z', services: ['ttc-plan', 'custom'], photos: [{ photo_id: 1, url: '/p', caption: 'proof' }], quote: { notes: 'All done' } });
      if (path.includes('/complete')) return Promise.resolve({ project_status: 'completed' });
      if (path.includes('/request-changes')) return Promise.resolve({ project_status: 'active' });
      return Promise.resolve({});
    });
    const full = await contractor.getMonitoringData(2);
    expect(full.latestUpdate.title).toBe('New site photo');
    expect(full.provider.providerName).toBe('TCM');
    expect(full.milestones[1].state).toBe('done');
    expect((await contractor.getMonitoringData(3)).latestUpdate.title).toBe('Site check-in');
    const completion = await contractor.getCompletionData(3);
    expect(completion).toMatchObject({ finalProgress: 100, providerNote: 'Provider note: All done' });
    expect(completion.checklist).toHaveLength(3);
    expect(completion.evidence[0]).toMatchObject({ src: 'https://api.example.test/p', stage: 'during' });
    expect(await contractor.approveCompletion(3)).toEqual({ projectId: 3, status: 'completed' });
    expect(await contractor.requestChanges(3, 'Fix')).toEqual({ projectId: 3, status: 'active', note: 'Fix' });
  });

  it('handles local notification read and create operations', () => {
    const initial = contractor.getNotifications();
    expect(initial.length).toBeGreaterThan(0);
    const updated = contractor.markNotificationAsRead(initial[0].id);
    expect(updated.find((n) => n.id === initial[0].id).read).toBe(true);
    expect(contractor.markAllNotificationsAsRead().every((n) => n.read)).toBe(true);
    const created = contractor.addProjectCreatedNotification({ name: 'New road' });
    expect(created[0].title).toBe('New Project Created');
    sessionStorage.setItem('mamarNotifications', 'bad-json');
    expect(contractor.getNotifications().length).toBeGreaterThan(0);
  });
});

describe('Field worker service helpers and workflows', () => {
  it('formats distances and computes GPS distances', () => {
    expect(fieldWork.formatDistance(null)).toBe('–');
    expect(fieldWork.formatDistance(55.6)).toBe('56 m');
    expect(fieldWork.formatDistance(1200)).toBe('1.2 km');
    expect(fieldWork.distanceInMeters({ latitude: 0, longitude: 0 }, { latitude: 0, longitude: 0 })).toBe(0);
    expect(fieldWork.distanceInMeters({ latitude: 24, longitude: 46 }, { latitude: 24.001, longitude: 46 })).toBeGreaterThan(100);
    expect(fieldWork.getPlannedLocation(1, null)).toBeNull();
    expect(fieldWork.getPlannedLocation(1, { latitude: null, longitude: null })).toBeNull();
    expect(fieldWork.getPlannedLocation(1, { latitude: '24', longitude: '46', work_zone: { rings: [] } })).toMatchObject({ latitude: 24, longitude: 46 });
  });

  it('builds field worker dashboard statistics and active worker counts', async () => {
    api.fetchFieldProjects.mockResolvedValue([
      { project: { project_id: 1, project_name: 'Active', project_status: 'active', latitude: 24, longitude: 46, services: ['ttc-plan'] }, site_status: 'Work in Progress', progress: 40, team: [{ user_id: 8, full_name: 'Ali Khan' }, { user_id: 9, full_name: 'Sara' }] },
      { project: { project_id: 2, project_name: 'Next', project_status: 'draft', latitude: null, longitude: null, services: ['unknown'] }, site_status: 'Not Started', progress: 0, team: [] },
      { project: { project_id: 3, project_name: 'Done', project_status: 'completed' }, site_status: 'Completed', progress: 100, team: [] },
    ]);
    const dashboard = await fieldWork.getFieldWorkerDashboard();
    expect(dashboard.stats).toEqual({ assigned: 3, active: 1, upcoming: 1, completed: 1 });
    expect(dashboard.overview.workersActive).toBe(2);
    expect(dashboard.newProject.name).toBe('Next');
    expect(dashboard.activeProjects[0].location).toContain('24.000000');
    api.fetchFieldProjects.mockResolvedValue([]);
  api.fetchFieldProject.mockResolvedValue({ project: { project_id: 10, project_name: 'Road', latitude: 24, longitude: 46 } });
  api.postCheckIn.mockResolvedValue({ last_check_in: '2025-01-01T00:00:00Z' });
  api.postDeviceVerify.mockResolvedValue({ device: 'DV-1', project_id: 10, planned_latitude: 24, planned_longitude: 46, distance_m: 5, max_distance_m: 50, status: 'verified' });
  api.postPhotos.mockResolvedValue([{ photo_id: 9, url: '/photo.jpg', caption: 'Evidence', created_at: '2025-01-01T00:00:00Z' }]);
    expect((await fieldWork.getFieldWorkerDashboard()).newProject).toBeNull();
  });

  it('maps field execution details and supports status, check-in and device calls', async () => {
    api.fetchFieldProject.mockResolvedValue({ project: { project_id: 10, project_name: 'Road', closure_type: 'Infrastructure', project_status: 'active', latitude: 24, longitude: 46, services: ['ttc-plan', 'custom'], start_date: '2025-01-01', end_date: '2025-01-02' }, progress: 50, site_status: 'Paused', team: [{ user_id: 1, full_name: 'Ali Khan' }], photos: [], last_check_in: '2025-01-01T00:00:00Z' });
    const result = await fieldWork.getFieldExecution(10);
    expect(result.project.servicesLabel).toContain('Temporary Traffic Control');
    expect(result.site.teamCount).toBe(1);
    expect(result.team[0].initials).toBe('AK');
    expect(result.site.todayCheckIn).not.toBe('Not yet');
    expect(await fieldWork.updateSiteStatus(10, 'Paused')).toEqual({ projectId: 10, status: 'Paused' });
    expect(await fieldWork.siteCheckIn(10)).toMatchObject({ time: expect.any(String) });
    expect(await fieldWork.getDevice('device', 10)).toMatchObject({ id: 'device', projectId: 10 });
    await expect(fieldWork.uploadSitePhotos(10, [])).rejects.toThrow('Add at least one photo first.');
    await expect(fieldWork.uploadSitePhotos(10, Array.from({ length: 11 }, () => ({ file: new File(['x'], 'x.jpg', { type: 'image/jpeg' }) })))).rejects.toThrow('up to 10 photos');
    const uploaded = await fieldWork.uploadSitePhotos(10, [{ file: new File(['x'], 'x.jpg', { type: 'image/jpeg' }), caption: 'Evidence' }]);
    expect(uploaded[0]).toMatchObject({ id: 9, caption: 'Evidence' });
    const verified = await fieldWork.saveDeviceVerification({ deviceId: 'DV-1', projectId: 10, captured: { latitude: 24, longitude: 46 } });
    expect(verified).toMatchObject({ deviceId: 'DV-1', distanceMeters: 5, status: 'verified' });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: undefined });
    await expect(fieldWork.captureCurrentLocation(null)).rejects.toThrow('does not support location services');
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (success) => success({ coords: { latitude: 24, longitude: 46, accuracy: 4.6 } }) } });
    await expect(fieldWork.captureCurrentLocation(null)).resolves.toEqual({ latitude: 24, longitude: 46, accuracy: 5 });
    Object.defineProperty(navigator, 'geolocation', { configurable: true, value: { getCurrentPosition: (_success, failure) => failure({ code: 1 }) } });
    await expect(fieldWork.captureCurrentLocation(null)).rejects.toThrow('permission was denied');
  });
});

describe('Other domain helpers', () => {
  it('covers attendance date and duration formatters', () => {
    expect(attendance.asDate('2025-01-01T10:00:00')).toBeInstanceOf(Date);
    expect(attendance.asDate('2025-01-01T10:00:00Z')).toBeInstanceOf(Date);
    expect(attendance.clock('2025-01-01T10:00:00Z')).toMatch(/\d{2}:\d{2}/);
    expect(attendance.shortDay('2025-01-01T10:00:00Z')).toContain('Jan');
    expect(attendance.hours(90)).toBe('1 h 30 min');
    expect(attendance.hours(30)).toBe('30 min');
    expect(attendance.hours(0)).toBe('0 min');
  });

  it('covers profile image, date and initials fallbacks', () => {
    expect(profileUtils.getPictureUrl(null)).toBe('');
    expect(profileUtils.getPictureUrl({ profile_picture_url: 'https://cdn.test/a' })).toBe('https://cdn.test/a');
    expect(profileUtils.formatProfileDate(null)).toBe('—');
    expect(profileUtils.formatProfileDate('bad')).toBe('bad');
    expect(profileUtils.getProfileInitial('sara ali')).toBe('S');
    expect(profileUtils.getProfileInitial('')).toBe('U');
  });

  it('covers weather codes, advice and fetch failure behavior', async () => {
    expect(weather.describe(0)).toMatch(/clear/i);
    expect(weather.describe(95)).toMatch(/thunder/i);
    expect(weather.describe(55)).toMatch(/rain/i);
    expect(weather.describe(75)).toMatch(/snow/i);
    expect(weather.describe(null)).toMatch(/unknown/i);
    expect(weather.describe(999)).toMatch(/cloudy/i);
    expect(weather.adviceFor({ high: 45, summary: 'Thunderstorm', rainChance: 90, rainMm: 2, gust: 50 })).toHaveLength(3);
    const oldFetch = global.fetch;
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 500 });
    await expect(weather.todayWeather(24, 46)).rejects.toThrow();
    global.fetch = oldFetch;
  });

  it('covers provider projects, open requests, quotation submission and dashboard mapping', async () => {
    api.fetchProviderProjects.mockResolvedValue([{ project: { project_id: 12, project_name: 'Road', closure_type: 'Highway', start_date: '2025-01-01', end_date: '2025-01-03', location: 'Riyadh' }, progress: 40, status: 'Active', site_status: 'Paused', field_team_count: 2, completion_submitted: false, quote: { price: 500 } }]);
    const projects = await providerFlow.getProviderProjects();
    expect(projects[0]).toMatchObject({ id: 12, code: 'PRJ-012', duration: '3 days', price: 500 });
    api.fetchProviderRequests.mockResolvedValue([{ request_id: 5, project_id: 12, title: 'Traffic request', details: 'Services: ttc-plan, road-signs', required_by: '2025-01-01', project: { project_name: 'Road', closure_type: 'Highway', start_date: '2025-01-01', end_date: '2025-01-03', location: 'Riyadh' } }]);
    const requests = await providerQuotes.getOpenRequests();
    expect(requests[0]).toMatchObject({ requestId: 5, title: 'Road', services: ['ttc-plan', 'road-signs'], durationDays: 3 });
    expect(await providerQuotes.getOpenRequestById('5')).toMatchObject({ requestId: 5 });
    await providerQuotes.declineProviderRequest(5);
    await providerQuotes.submitProviderQuotation({ request: requests[0], price: '250', durationDays: '3', notes: '' });
    expect(api.postQuotation).toHaveBeenCalledWith('test-token', expect.objectContaining({ project_id: 12, price: 250, duration_days: 3, notes: null }));
    api.postQuotation.mockRejectedValueOnce({ status: 409 });
    await expect(providerQuotes.submitProviderQuotation({ request: requests[0], price: 1, durationDays: 1 })).rejects.toThrow('You already sent a quotation');
    api.fetchProviderDashboard.mockResolvedValue({ new_requests: [{ request_id: 6, project_id: 12, title: 'Request', required_by: '2025-01-01', details: 'Services: ttc-plan', project: { project_name: 'Road', closure_type: 'Highway', start_date: '2025-01-01', end_date: '2025-01-02', location: 'Riyadh' } }], pending_quotes: 2, stats: { total: 4 }, active_projects: [], overview: { workers_active: 1, sites_active: 1, field_workers: 2 }, next_project: { project: { project_id: 9, project_name: 'Next', location: 'Jeddah', start_date: '2025-02-01', end_date: '2025-02-02' }, progress: 0, status: 'Upcoming' } });
    const dashboard = await providerQuotes.getProviderDashboard();
    expect(dashboard.newRequests[0].status).toBe('Awaiting Your Quote');
    expect(dashboard.newProject.name).toBe('Next');
    expect(dashboard.overview.fieldWorkers).toBe(2);
  });

  it('covers project-flow storage, quote and completion paths', async () => {
    expect(projectFlow.parseServerDate(null)).toBeNull();
    expect(projectFlow.parseServerDate('bad')).toBeNull();
    expect(projectFlow.formatDateTime('bad')).toBe('');
    expect(projectFlow.formatTime(null)).toBe('');
    expect(projectFlow.absUrl('')).toBe('');
    expect(projectFlow.absUrl('/img')).toBe('https://api.example.test/img');
    expect(projectFlow.absUrl('https://cdn.test/img')).toBe('https://cdn.test/img');
    expect(projectFlow.toUiPhoto({ photo_id: 1, url: '/img', created_at: null })).toMatchObject({ id: 1, src: 'https://api.example.test/img', caption: 'Site photo' });
    expect(projectFlow.formatDate('')).toBe('Not specified');
    expect(projectFlow.formatDate('bad')).toBe('bad');
    expect(projectFlow.formatDateRange('', '')).toBe('Not specified');
    expect(projectFlow.formatPrice(1500)).toContain('1,500');
    expect(projectFlow.getCurrentProject()).toMatchObject({ id: null, services: [] });
    sessionStorage.setItem(projectFlow.KEYS.project, JSON.stringify({ projectId: 22, name: 'Road', startDate: '2025-01-01', services: ['ttc-plan'] }));
    expect(projectFlow.getCurrentProject().id).toBe(22);
    await expect(projectFlow.requestQuotes({ id: null, services: [] }, [])).rejects.toThrow('No project selected');
    await expect(projectFlow.requestQuotes({ id: 22, services: [] }, [0])).rejects.toThrow('Please select valid providers');
    api.postServiceRequest.mockResolvedValue({ request_id: 1 });
    await projectFlow.requestQuotes();
    api.fetchProjectQuotations.mockResolvedValue([{ quote_id: 3, request_id: 1, provider_id: 9, price: 200, duration_days: 2, status: 'sent' }]);
    expect((await projectFlow.getQuotations(22))[0]).toMatchObject({ id: 3, providerName: 'Provider #9', status: 'received' });
    expect(await projectFlow.getQuotationById(3)).toMatchObject({ id: 3 });
    projectFlow.saveSelectedQuotation(3);
    expect(projectFlow.getSelectedQuotationId()).toBe(3);
    api.postRejectQuote.mockResolvedValue({});
    expect(await projectFlow.rejectQuotation(3)).toEqual({ id: 3, status: 'rejected' });
    api.postConfirmProvider.mockResolvedValue({ ok: true });
    await projectFlow.confirmProvider(22, 3);
    expect(projectFlow.getConfirmedQuotationId()).toBe(3);
    api.fetchMonitoring.mockResolvedValue({ project_status: 'draft', progress: 0, field_team_count: 0, site_status: 'Not Started', completion_submitted: false, photos: [], last_check_in: null, provider: null });
    expect((await projectFlow.getMonitoringData(22)).milestones[1].state).toBe('pending');
    api.fetchCompletion.mockResolvedValue({ progress: 100, submitted_at: null, services: [], photos: [], quote: null });
    expect((await projectFlow.getCompletionData(22)).providerNote).toContain('submitted the work');
    api.postCompleteProject.mockResolvedValue({ project_status: 'completed' });
    expect(await projectFlow.approveCompletion(22)).toEqual({ projectId: 22, status: 'completed' });
    api.postRequestChanges.mockResolvedValue({ project_status: 'active' });
    expect(await projectFlow.requestChanges(22, 'change')).toEqual({ projectId: 22, status: 'active', note: 'change' });
  });
});