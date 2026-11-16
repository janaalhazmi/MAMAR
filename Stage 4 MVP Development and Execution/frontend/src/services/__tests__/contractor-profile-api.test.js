import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({ getSession: vi.fn(), authed: vi.fn() }))
vi.mock('../auth', () => ({ getSession: mocks.getSession }))
vi.mock('../api', () => ({ authed: mocks.authed, JSON_H: { 'Content-Type': 'application/json' }, asJson: JSON.stringify }))
import { changeMyPassword, deleteMyProfilePicture, fetchMyProfile, updateMyProfile, uploadMyProfilePicture } from '../Contractor/profileService'

describe('contractor profile API service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocks.getSession.mockReturnValue({ access_token: 'profile-token' })
    mocks.authed.mockResolvedValue({ ok: true })
  })

  it('rejects all profile operations without an authenticated session', async () => {
    mocks.getSession.mockReturnValue(null)
    await expect(fetchMyProfile()).rejects.toThrow(/sign in/i)
    await expect(updateMyProfile({ name: 'A' })).rejects.toThrow(/sign in/i)
    await expect(changeMyPassword('old', 'new')).rejects.toThrow(/sign in/i)
    await expect(uploadMyProfilePicture(new File(['x'], 'avatar.png'))).rejects.toThrow(/sign in/i)
    await expect(deleteMyProfilePicture()).rejects.toThrow(/sign in/i)
    expect(mocks.authed).not.toHaveBeenCalled()
  })

  it('loads and updates the profile with the expected method and body', async () => {
    await fetchMyProfile()
    await updateMyProfile({ full_name: 'Jana', phone: '0500000000' })
    expect(mocks.authed).toHaveBeenNthCalledWith(1, '/auth/me', 'profile-token')
    expect(mocks.authed).toHaveBeenNthCalledWith(2, '/auth/me', 'profile-token', {
      method: 'PATCH', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ full_name: 'Jana', phone: '0500000000' }),
    })
  })

  it('sends password changes and avatar upload/delete requests', async () => {
    await changeMyPassword('old-pass', 'new-pass')
    const file = new File(['avatar'], 'avatar.png', { type: 'image/png' })
    await uploadMyProfilePicture(file)
    await deleteMyProfilePicture()
    expect(mocks.authed.mock.calls[0]).toEqual(['/auth/change-password', 'profile-token', expect.objectContaining({ method: 'POST', body: JSON.stringify({ current_password: 'old-pass', new_password: 'new-pass' }) })])
    const form = mocks.authed.mock.calls[1][2].body
    expect(form).toBeInstanceOf(FormData)
    expect(form.get('file')).toBe(file)
    expect(mocks.authed.mock.calls[2]).toEqual(['/auth/me/avatar', 'profile-token', { method: 'DELETE' }])
  })
})
