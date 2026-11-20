import { beforeEach, describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

const state = vi.hoisted(() => ({
  projects: null,
  loadError: '',
  workers: [],
  loadingWorkers: false,
  workersError: '',
  setWorkers: vi.fn(),
  registration: null,
  assignmentProjects: [],
  sessionUser: { full_name: 'Sara Ali' },
}))
const api = vi.hoisted(() => ({
  assignProviderWorker: vi.fn(),
  useDeviceVerificationProjects: vi.fn(),
  useProviderFieldWorkers: vi.fn(),
  useWorkerAssignmentProjects: vi.fn(),
  useFieldWorkerRegistration: vi.fn(),
}))
vi.mock('../services/providers/api', () => ({
  assignProviderWorker: (...a) => api.assignProviderWorker(...a),
  useDeviceVerificationProjects: (...a) => api.useDeviceVerificationProjects(...a),
  useProviderFieldWorkers: (...a) => api.useProviderFieldWorkers(...a),
  useWorkerAssignmentProjects: (...a) => api.useWorkerAssignmentProjects(...a),
  useFieldWorkerRegistration: (...a) => api.useFieldWorkerRegistration(...a),
}))
vi.mock('../services/auth', () => ({ getSession: () => ({ user: state.sessionUser }) }))
vi.mock('../components/ProviderSidebar', () => ({ default: () => <aside>provider sidebar</aside> }))
vi.mock('../components/NotificationBell', () => ({ default: () => <span>notification bell</span> }))
vi.mock('../components/Turnstile', () => ({ default: () => <span>turnstile stub</span> }))
vi.mock('../components/MamarMap', () => ({ default: () => <div data-testid="map">map</div> }))

import ProviderDeviceVerification from '../pages/Providers/ProviderDeviceVerification'
import ProviderFieldTeam from '../pages/Providers/ProviderFieldTeam'

const workerRows = [
  { id: 1, name: 'Ali Hassan', email: 'ali@example.com', phone: '0500000001', project: 'Road A', status: 'Active', activity: 'Today' },
  { id: 2, name: 'Mona Saleh', email: 'mona@example.com', phone: '', project: '', status: 'Available', activity: '—' },
  { id: 3, name: 'Omar Noor', email: 'omar@example.com', phone: '0500000003', project: 'Road B', status: 'On Leave', activity: 'Yesterday' },
]
const projectRows = [
  { id: 7, code: 'R-7', name: 'Road project', status: 'Active', progress: 130, startDate: '2026-01-01', endDate: '2026-02-01', latitude: 24.7, longitude: 46.6, siteStatus: 'On Track', teamCount: 2, location: 'Riyadh' },
  { id: 8, name: 'Bridge project', status: '', progress: -10, startDate: '', endDate: '', location: '' },
]
function renderDevice(path = '/provider/device-verification') {
  return render(<MemoryRouter initialEntries={[path]}><Routes>
    <Route path="/provider/device-verification" element={<ProviderDeviceVerification />} />
    <Route path="/provider/device-verification/:projectId" element={<ProviderDeviceVerification />} />
  </Routes></MemoryRouter>)
}
function renderTeam() { return render(<MemoryRouter><ProviderFieldTeam /></MemoryRouter>) }

beforeEach(() => {
  state.projects = projectRows
  state.loadError = ''
  state.workers = workerRows
  state.loadingWorkers = false
  state.workersError = ''
  state.setWorkers = vi.fn()
  state.assignmentProjects = [{ id: 7, name: 'Road project', status: 'Active', dates: 'Jan–Feb' }]
  state.sessionUser = { full_name: 'Sara Ali' }
  state.registration = {
    worker: null, busy: false, error: '', created: false,
    submit: vi.fn((event) => event.preventDefault()),
    setCaptcha: vi.fn(), captchaReset: 0,
  }
  api.assignProviderWorker.mockReset().mockResolvedValue({ ok: true })
  api.useDeviceVerificationProjects.mockImplementation(() => ({ projects: state.projects, loadError: state.loadError }))
  api.useProviderFieldWorkers.mockImplementation(() => ({ workers: state.workers, setWorkers: state.setWorkers, loadingWorkers: state.loadingWorkers, workersError: state.workersError }))
  api.useWorkerAssignmentProjects.mockImplementation(() => state.assignmentProjects)
  api.useFieldWorkerRegistration.mockImplementation(() => state.registration)
})

describe('ProviderDeviceVerification: all visible states', () => {
  it('shows loading and request error states', () => {
    state.projects = null
    const loading = renderDevice()
    expect(screen.getByRole('status')).toHaveTextContent('Loading projects')
    loading.unmount()
    state.loadError = 'Network unavailable'
    renderDevice()
    expect(screen.getByRole('alert')).toHaveTextContent('Network unavailable')
  })
  it('shows empty list and plural/singular project counts', () => {
    state.projects = []
    const empty = renderDevice()
    expect(screen.getByText('0 projects')).toBeInTheDocument()
    expect(screen.getByText('No assigned projects yet')).toBeInTheDocument()
    empty.unmount()
    state.projects = [projectRows[0]]
    renderDevice()
    expect(screen.getByText('1 project')).toBeInTheDocument()
    expect(screen.getByText('Road project')).toBeInTheDocument()
    expect(screen.getByText(/Project ID · R-7/)).toBeInTheDocument()
  })
  it('uses status fallback and safely encodes project IDs in detail links', () => {
    state.projects = [{ ...projectRows[1], id: 'a b' }]
    renderDevice()
    expect(screen.getByText('Status unavailable')).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /View device verification details/ })).toHaveAttribute('href', '/provider/device-verification/a%20b')
  })
  it('shows unknown project message and a back link for an unmatched route ID', () => {
    renderDevice('/provider/device-verification/999')
    expect(screen.getByRole('alert')).toHaveTextContent('not in your assigned projects')
    expect(screen.getByRole('link', { name: /Back to Device Verification Status/ })).toHaveAttribute('href', '/provider/device-verification')
  })
  it('renders project summary, clamps progress, shows map and fallback fields', () => {
    renderDevice('/provider/device-verification/7')
    expect(screen.getByRole('heading', { name: 'Road project' })).toBeInTheDocument()
    expect(screen.getByText('100%')).toBeInTheDocument()
    expect(screen.getByTestId('map')).toBeInTheDocument()
    expect(screen.getByText('2 team members assigned')).toBeInTheDocument()
  })
  it('uses the default provider avatar initial for a blank account name', () => {
    state.sessionUser = { full_name: '   ' }
    renderDevice()
    expect(screen.getByText('P')).toBeInTheDocument()
  })
  it('shows empty work-zone fallback and clamps negative progress', () => {
    renderDevice('/provider/device-verification/8')
    expect(screen.getByText('0%')).toBeInTheDocument()
    expect(screen.getByText('Work zone location is unavailable.')).toBeInTheDocument()
    expect(screen.getAllByText('Not available').length).toBeGreaterThan(0)
    expect(screen.getByText('— – —')).toBeInTheDocument()
  })
})

describe('ProviderFieldTeam: directory, registration and assignment UI', () => {
  it('shows worker stats, filters by search, status and project', () => {
    renderTeam()
    expect(screen.getByText('Field Team')).toBeInTheDocument()
    expect(screen.getByText('03')).toBeInTheDocument()
    expect(screen.getByText('Ali Hassan')).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search workers'), { target: { value: 'mona' } })
    expect(screen.getByText('Mona Saleh')).toBeInTheDocument()
    expect(screen.queryByText('Ali Hassan')).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Search workers'), { target: { value: '' } })
    fireEvent.change(screen.getByLabelText('Worker status'), { target: { value: 'On Leave' } })
    expect(screen.getByText('Omar Noor')).toBeInTheDocument()
    expect(screen.queryByText('Mona Saleh')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /Available/ }))
    expect(screen.getByText('Mona Saleh')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: /All Workers/ }))
    fireEvent.change(screen.getByLabelText('Assigned project'), { target: { value: 'Road B' } })
    expect(screen.getByText('Omar Noor')).toBeInTheDocument()
    expect(screen.queryByText('Ali Hassan')).not.toBeInTheDocument()
  })
  it('shows loading/error and empty-filter states', () => {
    state.loadingWorkers = true
    state.workersError = 'Could not load workers'
    const loading = renderTeam()
    expect(screen.getByRole('status')).toHaveTextContent('Loading field workers')
    expect(screen.getByRole('alert')).toHaveTextContent('Could not load workers')
    expect(screen.getByRole('button', { name: /Add Field Worker/ })).toBeDisabled()
    loading.unmount()
    state.loadingWorkers = false
    state.workersError = ''
    renderTeam()
    fireEvent.change(screen.getByLabelText('Search workers'), { target: { value: 'missing' } })
    expect(screen.getByText('No workers match these filters.')).toBeInTheDocument()
  })
  it('shows no-workers empty state', () => {
    state.workers = []
    renderTeam()
    expect(screen.getByText('No field workers to display yet.')).toBeInTheDocument()
  })
  it('opens worker details, displays fallback phone/project and returns to list', () => {
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: 'Assign →' }))
    expect(screen.getByRole('region', { name: 'Worker details' })).toBeInTheDocument()
    expect(screen.getAllByText('Mona Saleh')).toHaveLength(2)
    expect(screen.getAllByText('Not available').length).toBeGreaterThan(0)
    expect(screen.getByText('Not assigned')).toBeInTheDocument()
    fireEvent.click(screen.getByText('← Back to Field Team'))
    expect(screen.getByRole('heading', { name: 'Field Team' })).toBeInTheDocument()
  })
  it('shows already-assigned worker status without assignment form', () => {
    renderTeam()
    fireEvent.click(screen.getAllByRole('button', { name: 'View →' })[0])
    expect(screen.getByRole('status')).toHaveTextContent('Assigned to Road A')
    expect(screen.queryByText('Save Assignment')).not.toBeInTheDocument()
  })
  it('assigns an available worker and updates the worker collection', async () => {
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: 'Assign →' }))
    fireEvent.change(screen.getByLabelText('Assign to Project'), { target: { value: '7' } })
    fireEvent.click(screen.getByText('Save Assignment'))
    await waitFor(() => expect(api.assignProviderWorker).toHaveBeenCalledWith(7, 2))
    expect(state.setWorkers).toHaveBeenCalledWith(expect.any(Function))
  })
  it('handles invalid worker IDs and assignment API failures', async () => {
    state.workers = [{ id: 'bad-id', name: 'Invalid Worker', email: 'bad@example.com', phone: '', project: '', status: 'Available', activity: '—' }]
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: 'Assign →' }))
    expect(screen.getByText("The worker's account ID is required to assign a project.")).toBeInTheDocument()
    state.workers = [workerRows[1]]
    api.assignProviderWorker.mockRejectedValueOnce(new Error('Assignment denied'))
    const view = renderTeam()
    fireEvent.click(screen.getByRole('button', { name: 'Assign →' }))
    fireEvent.change(screen.getByLabelText('Assign to Project'), { target: { value: '7' } })
    fireEvent.click(screen.getByText('Save Assignment'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Assignment denied')
    view.unmount()
  })
  it('shows no open projects and disables assignment', () => {
    state.assignmentProjects = []
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: 'Assign →' }))
    expect(screen.getByText(/No open projects yet/)).toBeInTheDocument()
    expect(screen.getByText('Save Assignment')).toBeDisabled()
  })
  it('opens add-worker form, invokes submit and cancel', () => {
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: /Add Field Worker/ }))
    expect(screen.getByRole('region', { name: 'Add field worker' })).toBeInTheDocument()
    fireEvent.change(screen.getByLabelText('Full Name'), { target: { value: 'New Worker' } })
    fireEvent.change(screen.getByLabelText('Company Email'), { target: { value: 'new@example.com' } })
    fireEvent.change(screen.getByLabelText('Password'), { target: { value: 'pass123' } })
    fireEvent.click(screen.getByText('Send Verification Code'))
    expect(state.registration.submit).toHaveBeenCalled()
    fireEvent.click(screen.getByText('Cancel'))
    expect(screen.getByRole('heading', { name: 'Field Team' })).toBeInTheDocument()
  })
  it('renders verification-code and created states from registration hook', () => {
    state.registration = { ...state.registration, worker: { email: 'new@example.com' }, captchaReset: 2 }
    const view = renderTeam()
    fireEvent.click(screen.getByRole('button', { name: /Add Field Worker/ }))
    expect(screen.getByText(/Enter the verification code sent to/)).toBeInTheDocument()
    expect(screen.getByText('turnstile stub')).toBeInTheDocument()
    view.unmount()
    state.registration = { ...state.registration, created: true }
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: /Add Field Worker/ }))
    expect(screen.getByRole('status')).toHaveTextContent('Field worker account created')
    fireEvent.click(screen.getByText('Done'))
  })
  it('shows registration errors and busy state', () => {
    state.registration = { ...state.registration, error: 'Registration rejected', busy: true }
    renderTeam()
    fireEvent.click(screen.getByRole('button', { name: /Add Field Worker/ }))
    expect(screen.getByRole('alert')).toHaveTextContent('Registration rejected')
    expect(screen.getByText('Please wait…')).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
  })
})
