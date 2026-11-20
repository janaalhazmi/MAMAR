import { act, renderHook, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';

const deps = vi.hoisted(() => ({
  getSession: vi.fn(), getProviderProjects: vi.fn(), getOpenRequestById: vi.fn(),
  fetchRequestWorkZone: vi.fn(), postReturnToTeam: vi.fn(), postSubmitCompletion: vi.fn(),
  postDeviceVerify: vi.fn(), fetchProviderWorkers: vi.fn(), postAssignment: vi.fn(),
  registerUser: vi.fn(), sendPasscode: vi.fn(),
  profile: {
    fetchMyProfile: vi.fn(), updateMyProfile: vi.fn(), changeMyPassword: vi.fn(),
    uploadMyProfilePicture: vi.fn(), deleteMyProfilePicture: vi.fn(),
  },
}));
vi.mock('../services/auth', () => ({ getSession: deps.getSession }));
vi.mock('../services/api', () => ({
  fetchRequestWorkZone: deps.fetchRequestWorkZone,
  postReturnToTeam: deps.postReturnToTeam,
  postSubmitCompletion: deps.postSubmitCompletion,
  postDeviceVerify: deps.postDeviceVerify,
  fetchProviderWorkers: deps.fetchProviderWorkers,
  postAssignment: deps.postAssignment,
  registerUser: deps.registerUser,
  sendPasscode: deps.sendPasscode,
}));
vi.mock('../services/providers/providerFlow', () => ({ getProviderProjects: deps.getProviderProjects }));
vi.mock('../services/providers/providerQuotes', () => ({ getOpenRequestById: deps.getOpenRequestById }));
vi.mock('../services/Contractor/Contractor', () => ({ PROVIDERS: [{ id: 4, name: 'Safety Company' }] }));
vi.mock('../services/Contractor/profileService', () => deps.profile);

import * as hooks from '../services/providers/api';

beforeEach(() => {
  vi.clearAllMocks();
  deps.getSession.mockReturnValue({ access_token: 'provider-token', user: { full_name: 'Sara Ali', provider_id: 4 } });
  deps.getProviderProjects.mockResolvedValue([]);
  deps.getOpenRequestById.mockResolvedValue({ requestId: 1 });
  deps.fetchRequestWorkZone.mockResolvedValue({ work_zone: { rings: [] } });
  deps.postSubmitCompletion.mockResolvedValue({ ok: true });
  deps.postReturnToTeam.mockResolvedValue({ ok: true });
  deps.postDeviceVerify.mockResolvedValue({ verified: true });
  deps.fetchProviderWorkers.mockResolvedValue([]);
  deps.postAssignment.mockResolvedValue({ ok: true });
  deps.registerUser.mockResolvedValue({ user: { user_id: 12, full_name: 'Worker One', phone: '123' } });
  deps.sendPasscode.mockResolvedValue({ ok: true });
  deps.profile.fetchMyProfile.mockResolvedValue({ full_name: 'Sara Ali', email: 'sara@example.com', phone: '123', provider_id: 4, profile_picture: '/avatar.png' });
  deps.profile.updateMyProfile.mockResolvedValue({ full_name: 'Sara Updated', email: 'sara@example.com', phone: '456' });
  deps.profile.changeMyPassword.mockResolvedValue({ ok: true });
  deps.profile.uploadMyProfilePicture.mockResolvedValue({ ok: true });
  deps.profile.deleteMyProfilePicture.mockResolvedValue({ ok: true });
});

function formWith(fields) {
  const form = document.createElement('form');
  Object.entries(fields).forEach(([name, value]) => {
    const input = document.createElement('input'); input.name = name; input.value = value; form.append(input);
  });
  return { currentTarget: form, preventDefault: vi.fn() };
}

describe('provider hooks and actions', () => {
  it('loads dashboard data, names and error states', async () => {
    const load = vi.fn().mockResolvedValue({ total: 3 });
    const { result } = renderHook(() => hooks.useProviderDashboard(() => ({ user: { full_name: 'Sara Ali' } }), load));
    expect(result.current).toMatchObject({ displayName: 'Sara Ali', initials: 'SA', loading: true });
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.data).toEqual({ total: 3 });
    const failLoad = vi.fn().mockRejectedValue(new Error('offline'));
    const failed = renderHook(() => hooks.useProviderDashboard(() => ({ user: {} }), failLoad));
    await waitFor(() => expect(failed.result.current.error).toBe('offline'));
    expect(failed.result.current.displayName).toBe('Provider');
  });

  it('loads quotation request details and handles missing ID, session and failures', async () => {
    const missing = renderHook(() => hooks.useQuotationRequest(''));
    expect(missing.result.current.workZoneError).toBe('Missing request ID.');
    deps.getSession.mockReturnValueOnce(null);
    const noSession = renderHook(() => hooks.useQuotationRequest('12'));
    await waitFor(() => expect(noSession.result.current.workZoneError).toBe('Please sign in again.'));
    deps.getSession.mockReturnValue({ access_token: 'provider-token' });
    const { result } = renderHook(() => hooks.useQuotationRequest('13'));
    await waitFor(() => expect(result.current.workZone).toEqual({ rings: [] }));
    expect(result.current.realRequest).toEqual({ requestId: 1 });
    deps.fetchRequestWorkZone.mockRejectedValueOnce(new Error('zone unavailable'));
    const failed = renderHook(() => hooks.useQuotationRequest('14'));
    await waitFor(() => expect(failed.result.current.workZoneError).toBe('zone unavailable'));
  });

  it('supports supplied provider projects and fetched project states', async () => {
    const given = renderHook(() => hooks.useProviderProjects([{ id: 1, status: 'Active' }]));
    expect(given.result.current).toMatchObject({ loading: false, projects: [{ id: 1, status: 'Active' }] });
    deps.getProviderProjects.mockResolvedValue([{ id: 2, status: 'Upcoming' }]);
    const fetched = renderHook(() => hooks.useProviderProjects(null));
    await waitFor(() => expect(fetched.result.current.loading).toBe(false));
    expect(fetched.result.current.projects[0].status).toBe('upcoming');
    deps.getProviderProjects.mockRejectedValueOnce(new Error('offline'));
    const failed = renderHook(() => hooks.useProviderProjects(undefined));
    await waitFor(() => expect(failed.result.current.loadError).toBe('offline'));
  });

  it('loads project details and covers submit/return review actions', async () => {
    global.fetch = vi.fn().mockResolvedValue({ ok: true, json: async () => ({ project: { project_id: 7 } }) });
    const { result } = renderHook(() => hooks.useProviderProjectDetails('7'));
    await waitFor(() => expect(result.current.project).toEqual({ project_id: 7 }));
    await act(async () => { await result.current.review('return'); });
    expect(result.current.reviewError).toBe('Write a note for the field team first.');
    await act(async () => { await result.current.review('submit'); });
    expect(result.current.reviewNotice).toBe('Sent to the contractor for review.');
    await act(async () => { result.current.setNote('Please fix'); });
    await act(async () => { await result.current.review('return'); });
    expect(result.current.reviewNotice).toBe('Returned to the field team with your note.');
    global.fetch = vi.fn().mockResolvedValue({ ok: false, status: 503 });
    const failed = renderHook(() => hooks.useProviderProjectDetails('bad'));
    await waitFor(() => expect(failed.result.current.current.error).toContain('503'));
  });

  it('covers device verification project loading and API error translation', async () => {
    deps.getProviderProjects.mockResolvedValue([{ id: 1 }]);
    const { result } = renderHook(() => hooks.useDeviceVerificationProjects());
    await waitFor(() => expect(result.current.projects).toEqual([{ id: 1 }]));
    await expect(hooks.verifyProviderDevice(' DV-1 ', 2, { latitude: 1 })).resolves.toEqual({ verified: true });
    expect(deps.postDeviceVerify).toHaveBeenCalledWith('provider-token', 'DV-1', { project_id: 2, latitude: 1 });
    deps.postDeviceVerify.mockRejectedValueOnce({ status: 403 });
    await expect(hooks.verifyProviderDevice('DV', 2, {})).rejects.toThrow('does not have permission');
    deps.postDeviceVerify.mockRejectedValueOnce({ status: 422 });
    await expect(hooks.verifyProviderDevice('DV', 2, {})).rejects.toThrow('Verification failed (422)');
    deps.getSession.mockReturnValue(null);
    await expect(hooks.verifyProviderDevice('DV', 2, {})).rejects.toThrow('Please sign in again');
  });

  it('loads field workers, handles invalid responses and filters assignable projects', async () => {
    deps.fetchProviderWorkers.mockResolvedValue([{ user_id: 1, full_name: 'Ali Khan', email: 'a@b.test', status: 'Available', project: { project_name: 'Road' } }]);
    const { result } = renderHook(() => hooks.useProviderFieldWorkers());
    await waitFor(() => expect(result.current.loadingWorkers).toBe(false));
    expect(result.current.workers[0]).toMatchObject({ id: 1, name: 'Ali Khan', project: 'Road', activity: '—' });
    deps.fetchProviderWorkers.mockResolvedValueOnce({ bad: true });
    const invalid = renderHook(() => hooks.useProviderFieldWorkers());
    await waitFor(() => expect(invalid.result.current.workersError).toContain('Could not read'));
    const setError = vi.fn();
    const disabled = renderHook(() => hooks.useWorkerAssignmentProjects(false, setError));
    expect(disabled.result.current).toBeNull();
    deps.getProviderProjects.mockResolvedValue([{ id: 1, status: 'Active' }, { id: 2, status: 'Upcoming' }, { id: 3, status: 'Completed' }]);
    const enabled = renderHook(() => hooks.useWorkerAssignmentProjects(true, setError));
    await waitFor(() => expect(enabled.result.current).toHaveLength(2));
    expect(enabled.result.current.map((p) => p.id)).toEqual([1, 2]);
    await expect(hooks.assignProviderWorker(1, 2)).resolves.toEqual({ ok: true });
    deps.getSession.mockReturnValue(null);
    await expect(hooks.assignProviderWorker(1, 2)).rejects.toThrow('Please sign in again');
  });

  it('covers worker registration validation, passcode and completion', async () => {
    const onCreated = vi.fn();
    const { result } = renderHook(() => hooks.useFieldWorkerRegistration(onCreated));
    await act(async () => { await result.current.submit(formWith({ full_name: 'Worker One', email: 'w@example.com', password: 'Password1!' })); });
    expect(deps.sendPasscode).toHaveBeenCalledWith('w@example.com');
    await act(async () => { await result.current.submit(formWith({ passcode: '12' })); });
    expect(result.current.error).toBe('Enter the 6-digit passcode.');
    await act(async () => { await result.current.submit(formWith({ passcode: '123456' })); });
    expect(onCreated).toHaveBeenCalledWith(expect.objectContaining({ id: 12, name: 'Worker One', email: 'w@example.com' }));
    expect(result.current.created).toBe(true);
    const noCompany = renderHook(() => hooks.useFieldWorkerRegistration(vi.fn()));
    deps.getSession.mockReturnValue({ access_token: 'x', user: {} });
    await act(async () => { await noCompany.result.current.submit(formWith({ full_name: 'Worker' })); });
    expect(noCompany.result.current.error).toContain('provider ID');
  });

  it('maps provider company names from profile or provider directory', () => {
    expect(hooks.getProviderCompanyName({ company_name: 'Custom Co' })).toBe('Custom Co');
    expect(hooks.getProviderCompanyName({ provider_id: 4 })).toBe('Safety Company');
    expect(hooks.getProviderCompanyName({})).toBe('');
  });

  it('loads and updates provider profile, password and picture workflows', async () => {
    const { result } = renderHook(() => hooks.useProviderProfile());
    await waitFor(() => expect(result.current.loading).toBe(false));
    expect(result.current.profile.full_name).toBe('Sara Ali');
    expect(result.current.picture).toContain('/avatar.png');
    expect(result.current.companyName).toBe('Safety Company');
    await act(async () => { result.current.updateField({ target: { name: 'full_name', value: 'Sara Updated' } }); result.current.updateField({ target: { name: 'email', value: 'SARA@EXAMPLE.COM' } }); });
    await act(async () => { await result.current.handleSaveProfile({ preventDefault() {} }); });
    expect(result.current.success).toContain('updated');
    await act(async () => { result.current.updatePasswordField({ target: { name: 'current_password', value: 'old' } }); result.current.updatePasswordField({ target: { name: 'new_password', value: 'short' } }); result.current.updatePasswordField({ target: { name: 'confirm_password', value: 'short' } }); });
    await act(async () => { await result.current.handleChangePassword({ preventDefault() {} }); });
    expect(result.current.error).toContain('at least 8');
    await act(async () => { result.current.updatePasswordField({ target: { name: 'new_password', value: 'LongPass1!' } }); result.current.updatePasswordField({ target: { name: 'confirm_password', value: 'mismatch' } }); });
    await act(async () => { await result.current.handleChangePassword({ preventDefault() {} }); });
    expect(result.current.error).toContain('do not match');
    await act(async () => { result.current.updatePasswordField({ target: { name: 'confirm_password', value: 'LongPass1!' } }); });
    await act(async () => { await result.current.handleChangePassword({ preventDefault() {} }); });
    expect(result.current.success).toContain('password has been changed');
    await act(async () => { await result.current.handlePictureSelected({ target: { files: [new File(['x'], 'bad.txt', { type: 'text/plain' })], value: 'x' } }); });
    expect(result.current.error).toContain('image file');
    await act(async () => { await result.current.handlePictureSelected({ target: { files: [new File(['x'], 'ok.png', { type: 'image/png' })], value: 'x' } }); });
    expect(result.current.success).toContain('picture has been updated');
    await act(async () => { await result.current.handleDeletePicture(); });
    expect(result.current.success).toContain('picture has been removed');
    await act(async () => { result.current.setEditing(true); result.current.handleCancelEdit(); });
    expect(result.current.editing).toBe(false);
  });
});
