import { beforeEach, describe, expect, it, vi } from 'vitest'
import * as api from '../api'

const token = 'test-access-token'
const jsonResponse = (body = { ok: true }) => ({
  ok: true,
  status: 200,
  json: async () => body,
})

const endpointCases = [
  ['testBackendConnection', () => api.testBackendConnection(), '/health', 'GET'],
  ['sendPasscode', () => api.sendPasscode(' JANA@EXAMPLE.COM '), '/auth/send-passcode', 'POST'],
  ['registerUser', () => api.registerUser({ full_name: ' Jana ', email: ' JANA@EXAMPLE.COM ', password: 'secret', role: 'contractor' }, ' 1234 ', 'captcha'), '/auth/register', 'POST'],
  ['getCurrentUser', () => api.getCurrentUser(token), '/auth/me', 'GET'],
  ['loginUser', () => api.loginUser(' JANA@EXAMPLE.COM ', 'secret', 'captcha'), '/auth/login', 'POST'],
  ['getProjects', () => api.getProjects(token), '/projects', 'GET'],
  ['getProjects with status', () => api.getProjects(token, 'active & done'), '/projects?project_status=active%20%26%20done', 'GET'],
  ['createProject', () => api.createProject(token, { project_name: 'Road' }), '/projects', 'POST'],
  ['updateProject', () => api.updateProject(token, 7, { project_name: 'Updated' }), '/projects/7', 'PATCH'],
  ['fetchProject', () => api.fetchProject(token, 7), '/projects/7', 'GET'],
  ['createRequest', () => api.createRequest(token, 7, { title: 'Request' }), '/projects/7/requests', 'POST'],
  ['getProjectQuotations', () => api.getProjectQuotations(token, 7), '/projects/7/quotations', 'GET'],
  ['rejectQuote', () => api.rejectQuote(token, 9), '/quotes/9/reject', 'POST'],
  ['confirmProvider', () => api.confirmProvider(token, 7, '9'), '/projects/7/confirm-provider', 'POST'],
  ['getMonitoring', () => api.getMonitoring(token, 7), '/projects/7/monitoring', 'GET'],
  ['getCompletion', () => api.getCompletion(token, 7), '/projects/7/completion', 'GET'],
  ['approveCompletion', () => api.approveCompletion(token, 7), '/projects/7/complete', 'POST'],
  ['requestChanges', () => api.requestChanges(token, 7, 'Fix signs'), '/projects/7/request-changes', 'POST'],
  ['listRequests', () => api.listRequests(token), '/requests?status=open', 'GET'],
  ['submitQuotation', () => api.submitQuotation(token, { project_id: 7 }), '/quotations', 'POST'],
  ['assignWorker', () => api.assignWorker(token, 7, 11), '/projects/7/assignments', 'POST'],
  ['listAssignments', () => api.listAssignments(token), '/assignments', 'GET'],
  ['getFieldProjects', () => api.getFieldProjects(token), '/field-worker/projects', 'GET'],
  ['getFieldProject', () => api.getFieldProject(token, 7), '/field-worker/projects/7', 'GET'],
  ['verifyDevice', () => api.verifyDevice(token, 'QR-7', { project_id: 7 }), '/devices/QR-7/verify', 'POST'],
  ['postServiceRequest', () => api.postServiceRequest(token, 7, { title: 'TTC' }), '/projects/7/requests', 'POST'],
  ['fetchProjectQuotations', () => api.fetchProjectQuotations(token, 7), '/projects/7/quotations', 'GET'],
  ['postRejectQuote', () => api.postRejectQuote(token, 9), '/quotes/9/reject', 'POST'],
  ['postConfirmProvider', () => api.postConfirmProvider(token, 7, 9), '/projects/7/confirm-provider', 'POST'],
  ['fetchMonitoring', () => api.fetchMonitoring(token, 7), '/projects/7/monitoring', 'GET'],
  ['fetchCompletion', () => api.fetchCompletion(token, 7), '/projects/7/completion', 'GET'],
  ['postCompleteProject', () => api.postCompleteProject(token, 7), '/projects/7/complete', 'POST'],
  ['postRequestChanges', () => api.postRequestChanges(token, 7, 'Change'), '/projects/7/request-changes', 'POST'],
  ['fetchRequestWorkZone encodes id', () => api.fetchRequestWorkZone(token, 'a/b'), '/requests/a%2Fb/work-zone', 'GET'],
  ['fetchOpenRequests encodes status', () => api.fetchOpenRequests(token, 'in review'), '/requests?status=in%20review', 'GET'],
  ['postQuotation', () => api.postQuotation(token, { project_id: 7 }), '/quotations', 'POST'],
  ['postDeclineRequest encodes id', () => api.postDeclineRequest(token, 'a/b'), '/provider/requests/a%2Fb/decline', 'POST'],
  ['fetchProviderRequests', () => api.fetchProviderRequests(token, false), '/provider/requests?quoted=false', 'GET'],
  ['fetchProviderProjects', () => api.fetchProviderProjects(token, 'active & done'), '/provider/projects?status=active%20%26%20done', 'GET'],
  ['fetchProviderProject encodes id', () => api.fetchProviderProject(token, 'a/b'), '/provider/projects/a%2Fb', 'GET'],
  ['fetchProviderDashboard', () => api.fetchProviderDashboard(token), '/provider/dashboard', 'GET'],
  ['postSubmitCompletion', () => api.postSubmitCompletion(token, 'a/b'), '/provider/projects/a%2Fb/submit-completion', 'POST'],
  ['postReturnToTeam', () => api.postReturnToTeam(token, 7, 'Fix'), '/provider/projects/7/return-to-team', 'POST'],
  ['fetchProviderWorkers', () => api.fetchProviderWorkers(token, 'active'), '/provider/workers?status=active', 'GET'],
  ['fetchAssignments', () => api.fetchAssignments(token, 'pending'), '/assignments?status=pending', 'GET'],
  ['postAssignment', () => api.postAssignment(token, 7, '11'), '/projects/7/assignments', 'POST'],
  ['fetchFieldProjects (field section)', () => api.fetchFieldProjects(token), '/field-worker/projects', 'GET'],
  ['fetchFieldProject (field section)', () => api.fetchFieldProject(token, 7), '/field-worker/projects/7', 'GET'],
  ['patchSiteStatus', () => api.patchSiteStatus(token, 7, 'Paused'), '/field-worker/projects/7/status', 'PATCH'],
  ['postCheckIn', () => api.postCheckIn(token, 7), '/field-worker/projects/7/check-in', 'POST'],
  ['postPhotos', () => api.postPhotos(token, 7, new FormData()), '/field-worker/projects/7/photos', 'POST'],
  ['postDeviceVerify encodes device', () => api.postDeviceVerify(token, 'A/B', {}), '/devices/A%2FB/verify', 'POST'],
  ['postStartPayment', () => api.postStartPayment(token, 'a/b', 'return', 'cancel'), '/projects/a%2Fb/payments', 'POST'],
  ['postCapturePayment', () => api.postCapturePayment(token, 'order/1'), '/payments/orders/order%2F1/capture', 'POST'],
  ['postCancelPayment', () => api.postCancelPayment(token, 'order/1'), '/payments/orders/order%2F1/cancel', 'POST'],
  ['fetchProjectPayments', () => api.fetchProjectPayments(token, 'a/b'), '/projects/a%2Fb/payments', 'GET'],
  ['fetchAdminSummary', () => api.fetchAdminSummary(token), '/admin/summary', 'GET'],
  ['fetchAdminUsers', () => api.fetchAdminUsers(token, 'provider', 'road works'), '/admin/users?role=provider&search=road+works', 'GET'],
  ['fetchAdminCompanies', () => api.fetchAdminCompanies(token), '/admin/companies', 'GET'],
  ['postAdminUser', () => api.postAdminUser(token, { role: 'worker' }), '/admin/users', 'POST'],
  ['patchAdminUser', () => api.patchAdminUser(token, 'a/b', { active: false }), '/admin/users/a%2Fb', 'PATCH'],
  ['fetchProjectWeather', () => api.fetchProjectWeather(token, 'a/b'), '/projects/a%2Fb/weather', 'GET'],
  ['fetchProviderRatings', () => api.fetchProviderRatings(token), '/providers/ratings', 'GET'],
  ['fetchProjectReview', () => api.fetchProjectReview(token, 'a/b'), '/projects/a%2Fb/review', 'GET'],
  ['postProjectReview', () => api.postProjectReview(token, 7, 5, 'Good'), '/projects/7/review', 'POST'],
  ['fetchAdminActivity', () => api.fetchAdminActivity(token, 25), '/admin/activity?limit=25', 'GET'],
  ['fetchAdminProjects', () => api.fetchAdminProjects(token), '/admin/projects', 'GET'],
  ['fetchProjectTraffic', () => api.fetchProjectTraffic(token, 'a/b'), '/projects/a%2Fb/traffic', 'GET'],
  ['fetchSiteCode', () => api.fetchSiteCode(token, 'a/b'), '/projects/a%2Fb/site-code', 'GET'],
  ['fetchProjectAttendance', () => api.fetchProjectAttendance(token, 'a/b'), '/projects/a%2Fb/attendance', 'GET'],
  ['fetchMyAttendance', () => api.fetchMyAttendance(token, 'a/b'), '/field-worker/projects/a%2Fb/attendance', 'GET'],
  ['postAttendanceCheckIn', () => api.postAttendanceCheckIn(token, 7, { qr: 'x' }), '/field-worker/projects/7/attendance/check-in', 'POST'],
  ['postAttendanceCheckOut', () => api.postAttendanceCheckOut(token, 7), '/field-worker/projects/7/attendance/check-out', 'POST'],
  ['fetchNotificationChannels', () => api.fetchNotificationChannels(token), '/notifications/channels', 'GET'],
  ['postTestMessage', () => api.postTestMessage(token), '/notifications/test-message', 'POST'],
  ['fetchAdminServices', () => api.fetchAdminServices(token), '/admin/services', 'GET'],
  ['fetchProviderReviews', () => api.fetchProviderReviews(token, 'a/b'), '/providers/a%2Fb/reviews', 'GET'],
  ['fetchAiStatus', () => api.fetchAiStatus(token), '/ai/status', 'GET'],
  ['fetchSafetyChecks', () => api.fetchSafetyChecks(token, 'a/b'), '/projects/a%2Fb/safety-checks', 'GET'],
  ['postSafetyCheck', () => api.postSafetyCheck(token, 'a/b', true), '/photos/a%2Fb/safety-check?refresh=true', 'POST'],
  ['postTrafficPlan', () => api.postTrafficPlan(token, { lanes: 2 }), '/ai/traffic-plan', 'POST'],
  ['fetchQuoteComparison', () => api.fetchQuoteComparison(token, 'a/b', true), '/projects/a%2Fb/quotes/ai-compare?refresh=true', 'GET'],
  ['fetchDailySummary', () => api.fetchDailySummary(token, 'a/b', true), '/projects/a%2Fb/ai-summary?refresh=true', 'GET'],
]

describe('Complete API endpoint contracts', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(jsonResponse()))
  })

  it.each(endpointCases)('%s sends the expected authenticated request', async (_name, invoke, path, method) => {
    await invoke()
    expect(fetch).toHaveBeenCalledOnce()
    const [url, options] = fetch.mock.calls[0]
    expect(url).toBe(`${api.API_BASE_URL}${path}`)
    expect(options.method || 'GET').toBe(method)
    const publicPaths = ['/health', '/auth/send-passcode', '/auth/register', '/auth/login']
    if (publicPaths.includes(path)) expect(options.headers?.Authorization).toBeUndefined()
    else expect(options.headers.Authorization).toBe(`Bearer ${token}`)
    if (options.body instanceof FormData) {
      expect(options.headers['Content-Type']).toBeUndefined()
    }
  })

  it('serializes JSON bodies and coerces numeric identifiers where required', async () => {
    await api.confirmProvider(token, 3, '12')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ quote_id: 12 })
    fetch.mockClear()
    await api.postAssignment(token, 3, '12')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ worker_id: 12 })
    fetch.mockClear()
    await api.postProjectReview(token, 3, 4, '')
    expect(JSON.parse(fetch.mock.calls[0][1].body)).toEqual({ rating: 4, comment: null })
  })

  it('omits optional admin query parameters when they are empty', async () => {
    await api.fetchAdminUsers(token, '', '')
    expect(fetch.mock.calls[0][0]).toBe(`${api.API_BASE_URL}/admin/users`)
  })
})
