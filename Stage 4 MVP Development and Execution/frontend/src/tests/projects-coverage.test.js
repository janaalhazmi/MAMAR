import { beforeEach, describe, expect, it, vi } from 'vitest';

const api = vi.hoisted(() => ({ getProjects: vi.fn(), createProject: vi.fn(), updateProject: vi.fn() }));
const auth = vi.hoisted(() => ({ getSession: vi.fn() }));
vi.mock('../services/auth', () => auth);
vi.mock('../services/api', () => api);

import * as projects from '../services/projects';

beforeEach(() => {
  sessionStorage.clear(); localStorage.clear(); vi.clearAllMocks();
  auth.getSession.mockReturnValue({ access_token: 'token' });
  api.getProjects.mockResolvedValue([]);
  api.createProject.mockResolvedValue({ project_id: 20 });
  api.updateProject.mockResolvedValue({ project_id: 20 });
});

describe('projects service coverage', () => {
  it('covers metadata storage and malformed storage fallback', async () => {
    expect(projects.getProjectMeta(1)).toEqual({});
    localStorage.setItem('mamarProjectMeta', '{bad');
    expect(projects.getProjectMeta(1)).toEqual({});
    api.getProjects.mockResolvedValue([{ project_id: 1, project_name: 'Road', closure_type: 'Road', start_date: '2099-01-01', end_date: '2099-01-02', project_status: 'active', services: [], location: null }]);
    const rows = await projects.fetchProjects();
    expect(rows[0]).toMatchObject({ id: 1, statusLabel: 'Planned', location: 'Not specified', services: [] });
    expect(api.getProjects).toHaveBeenCalledWith('token');
  });

  it('covers polygon conversion, including invalid and oversized rings', () => {
    expect(projects.zoneToPoints(null)).toBeNull();
    expect(projects.zoneToPoints({ rings: [[1, 2]] })).toBeNull();
    expect(projects.zoneToPoints({ rings: [[[1, 2], [2, 2], [2, 3]]] })).toEqual([[1, 2], [2, 2], [2, 3]]);
    expect(projects.zoneToPoints({ rings: [[[NaN, NaN], [NaN, 0], [0, NaN]]] })).toBeNull();
    const ring = Array.from({ length: 700 }, (_, i) => [i % 170, Math.floor(i / 170)]);
    expect(projects.zoneToPoints(ring).length).toBeLessThanOrEqual(500);
  });

  it('covers status tones, stats and recent activity limits', async () => {
    expect(projects.thumbTone({ statusTone: 'completed' })).toBe('green');
    expect(projects.thumbTone({ statusTone: 'planned' })).toBe('grey');
    expect(projects.thumbTone({ statusTone: 'cancelled' })).toBe('grey');
    expect(projects.thumbTone({})).toBe('orange');
    const list = [
      { id: 1, name: 'A', statusLabel: 'In Progress', createdAt: new Date().toISOString() },
      { id: 2, name: 'B', statusLabel: 'Completed', createdAt: new Date(Date.now() - 60 * 60 * 1000).toISOString() },
      { id: 3, name: 'C', statusLabel: 'Pending Quotes', createdAt: new Date(Date.now() - 2 * 86400000).toISOString() },
    ];
    expect(projects.getStats(list)).toEqual({ total: 3, inProgress: 1, completed: 1, pendingQuotes: 1 });
    expect(projects.buildActivity(list, 2)).toHaveLength(2);
    expect(projects.buildActivity([{ id: 4, name: 'No date' }])[0].time).toBe('');
  });

  it('covers create/update persistence, metadata, and status changes', async () => {
    const draft = { name: 'Road', type: 'Highway', startDate: '2025-01-01', endDate: '2025-01-03', latitude: '24.7', longitude: '46.6', services: ['ttc-plan'], location: 'Riyadh', polygon: [[1, 2], [2, 2], [2, 3]] };
    await projects.saveProjectToBackend(draft);
    expect(api.createProject).toHaveBeenCalledWith('token', expect.objectContaining({ project_name: 'Road', latitude: 24.7, longitude: 46.6, location: 'Riyadh' }));
    expect(projects.getProjectMeta(20)).toMatchObject({ location: 'Riyadh', services: ['ttc-plan'] });
    await projects.saveProjectToBackend({ ...draft, projectId: 20, latitude: '', longitude: 'bad', services: 'bad', location: 'x'.repeat(300) });
    expect(api.updateProject).toHaveBeenCalledWith('token', 20, expect.objectContaining({ latitude: null, longitude: null, services: [], location: 'x'.repeat(255) }));
    projects.setProjectStatus(20, 'completed');
    expect(api.updateProject).toHaveBeenLastCalledWith('token', 20, { project_status: 'completed' });
  });

  it('covers draft cleanup, flow hydration and navigation steps', () => {
    sessionStorage.setItem('mamarNewProject', 'draft');
    projects.startNewProject();
    expect(sessionStorage.getItem('mamarNewProject')).toBeNull();
    projects.openProjectInFlow({ id: 7, name: 'Road', location: 'Not specified', type: 'Road', services: [] });
    const saved = JSON.parse(sessionStorage.getItem('mamarNewProject'));
    expect(saved).toMatchObject({ id: 7, projectId: 7, location: '' });
    expect(projects.nextStepFor({ backendStatus: 'draft' })).toMatchObject({ label: 'Continue', to: '/providers' });
    expect(projects.nextStepFor({ backendStatus: 'active' })).toMatchObject({ label: 'Monitor' });
    expect(projects.nextStepFor({ backendStatus: 'completed' })).toMatchObject({ label: 'View' });
    expect(projects.nextStepFor({ backendStatus: 'other' })).toBeNull();
  });

  it('rejects protected API calls without a valid session token', async () => {
    auth.getSession.mockReturnValue(null);
    await expect(projects.fetchProjects()).rejects.toThrow('Please sign in to continue.');
    await expect(projects.saveProjectToBackend({})).rejects.toThrow('Please sign in to continue.');
  });
});
