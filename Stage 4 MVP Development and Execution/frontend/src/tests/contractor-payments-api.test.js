import { beforeEach, describe, expect, it, vi } from 'vitest'

const mocks = vi.hoisted(() => ({
  getSession: vi.fn(), fetchProjectPayments: vi.fn(), postCancelPayment: vi.fn(),
  postCapturePayment: vi.fn(), postStartPayment: vi.fn(),
}))
vi.mock('../services/auth', () => ({ getSession: mocks.getSession }))
vi.mock('../services/api', () => ({
  fetchProjectPayments: mocks.fetchProjectPayments,
  postCancelPayment: mocks.postCancelPayment,
  postCapturePayment: mocks.postCapturePayment,
  postStartPayment: mocks.postStartPayment,
}))
import { clearPendingPayment, finishPayment, getCompletedPayment, readPendingPayment } from '../services/Contractor/payments'

describe('contractor payments service', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    sessionStorage.clear()
    mocks.getSession.mockReturnValue({ access_token: 'payment-token' })
    mocks.fetchProjectPayments.mockResolvedValue([
      { id: 1, status: 'pending' }, { id: 2, status: 'completed' }, { id: 3, status: 'completed' },
    ])
    mocks.postCapturePayment.mockResolvedValue({ status: 'captured' })
    mocks.postCancelPayment.mockResolvedValue({ status: 'cancelled' })
  })

  it('returns null for a missing project id without calling the API', async () => {
    await expect(getCompletedPayment(null)).resolves.toBeNull()
    await expect(getCompletedPayment(undefined)).resolves.toBeNull()
    expect(mocks.fetchProjectPayments).not.toHaveBeenCalled()
  })

  it('returns the first completed payment for a project', async () => {
    await expect(getCompletedPayment(7)).resolves.toEqual({ id: 2, status: 'completed' })
    expect(mocks.fetchProjectPayments).toHaveBeenCalledWith('payment-token', 7)
  })

  it('requires a session to load completed payments and finish payment', async () => {
    mocks.getSession.mockReturnValue(null)
    await expect(getCompletedPayment(7)).rejects.toThrow(/sign in/i)
    await expect(finishPayment('order-1', false)).rejects.toThrow(/sign in/i)
  })

  it('captures or cancels the PayPal order according to the return state', async () => {
    await expect(finishPayment('order-1', false)).resolves.toEqual({ status: 'captured' })
    await expect(finishPayment('order-2', true)).resolves.toEqual({ status: 'cancelled' })
    expect(mocks.postCapturePayment).toHaveBeenCalledWith('payment-token', 'order-1')
    expect(mocks.postCancelPayment).toHaveBeenCalledWith('payment-token', 'order-2')
  })

  it('reads, safely handles malformed, and clears pending payment session data', () => {
    expect(readPendingPayment()).toBeNull()
    sessionStorage.setItem('mamarPendingPayment', JSON.stringify({ project: { id: 7 }, quotation: { id: 9 } }))
    expect(readPendingPayment()).toEqual({ project: { id: 7 }, quotation: { id: 9 } })
    sessionStorage.setItem('mamarPendingPayment', '{bad-json')
    expect(readPendingPayment()).toBeNull()
    clearPendingPayment()
    expect(sessionStorage.getItem('mamarPendingPayment')).toBeNull()
  })
})
