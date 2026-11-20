import { beforeEach, describe, expect, it, vi } from 'vitest'
import { asJson, loginUser, testBackendConnection } from '../services/api'

describe('API service', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  it('serializes request bodies as JSON', () => {
    expect(asJson({ name: 'Jana' })).toBe('{"name":"Jana"}')
  })

  it('normalizes the email before sending a login request', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ access_token: 'test-token' }),
    })

    await loginUser('  JANA@EXAMPLE.COM  ', 'password123')

    expect(fetch).toHaveBeenCalledTimes(1)
    const [url, options] = fetch.mock.calls[0]
    expect(url).toContain('/auth/login')
    expect(options.method).toBe('POST')
    expect(JSON.parse(options.body)).toEqual({
      email: 'jana@example.com',
      password: 'password123',
    })
  })

  it('returns the health-check response when the backend succeeds', async () => {
    fetch.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ status: 'ok' }),
    })

    await expect(testBackendConnection()).resolves.toEqual({ status: 'ok' })
    expect(fetch).toHaveBeenCalledWith(
      expect.stringContaining('/health'),
      {},
    )
  })

  it('preserves the HTTP status on API errors', async () => {
    fetch.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({ detail: 'Unauthorized' }),
    })

    await expect(testBackendConnection()).rejects.toMatchObject({
      message: 'Unauthorized',
      status: 401,
    })
  })

  it('shows a connection error when fetch rejects', async () => {
    fetch.mockRejectedValue(new Error('Network unavailable'))

    await expect(testBackendConnection()).rejects.toThrow(
      'Unable to connect to the server. Please try again.',
    )
  })
})
