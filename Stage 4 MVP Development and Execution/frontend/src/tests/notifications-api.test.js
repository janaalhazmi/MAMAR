import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), authed: vi.fn() }))
vi.mock('../services/auth', () => ({ getSession: mocks.getSession }))
vi.mock('../services/api', () => ({ authed: mocks.authed }))
import { getNotifications, getUnreadNotificationCount, markAllNotificationsAsRead, markNotificationAsRead } from '../services/notifications'

describe('notifications API service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockReturnValue({ access_token: 'notify-token' })
    mocks.authed.mockResolvedValue({ ok: true })
  })

  it('requires a signed-in session before requesting notifications', () => {
    mocks.getSession.mockReturnValue(null)
    expect(() => getNotifications()).toThrow(/sign in/i)
    expect(() => getUnreadNotificationCount()).toThrow(/sign in/i)
    expect(() => markNotificationAsRead(4)).toThrow(/sign in/i)
    expect(() => markAllNotificationsAsRead()).toThrow(/sign in/i)
    expect(mocks.authed).not.toHaveBeenCalled()
  })

  it('requests the notification list and unread count with the access token', async () => {
    await getNotifications()
    await getUnreadNotificationCount()
    expect(mocks.authed).toHaveBeenNthCalledWith(1, '/notifications', 'notify-token')
    expect(mocks.authed).toHaveBeenNthCalledWith(2, '/notifications/unread-count', 'notify-token')
  })

  it('marks one notification and all notifications as read using PATCH', async () => {
    await markNotificationAsRead(42)
    await markAllNotificationsAsRead()
    expect(mocks.authed).toHaveBeenNthCalledWith(1, '/notifications/42/read', 'notify-token', { method: 'PATCH' })
    expect(mocks.authed).toHaveBeenNthCalledWith(2, '/notifications/read-all', 'notify-token', { method: 'PATCH' })
  })
})
