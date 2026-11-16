import { describe, it, vi, beforeEach, afterEach } from 'vitest'
import { installBrowserApis, installFetch, settle, silenceConsole } from './env'

vi.mock('../../components/MamarMap', async () => ({ default: (await import('./map-mock')).MockMap }))
vi.mock('../../components/AdminMap', () => ({ default: () => null }))

describe('main.jsx entry point', () => {
  beforeEach(() => {
    installBrowserApis()
    silenceConsole(vi)
    installFetch('rich')
    document.body.innerHTML = '<div id="root"></div>'
  })
  afterEach(() => {
    vi.unstubAllEnvs()
    vi.resetModules()
  })

  it('renders the app in development mode', async () => {
    await import('../../main.jsx')
    await settle(30)
  })

  it('registers the service worker in production (success and failure)', async () => {
    for (const registerImpl of [() => Promise.resolve({}), () => Promise.reject(new Error('no sw'))]) {
      vi.resetModules()
      vi.stubEnv('PROD', true)
      document.body.innerHTML = '<div id="root"></div>'
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true, value: { register: registerImpl },
      })
      await import('../../main.jsx')
      window.dispatchEvent(new Event('load'))
      await settle(30)
    }
  })
})
