import React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import {
  SESSION_KINDS, buildRich, seedStorage, installBrowserApis, installFetch, poke, setSession, settle, silenceConsole,
} from '../test/exhaustive/env'

vi.mock('../components/MamarMap', async () => ({ default: (await import('../test/exhaustive/map-mock')).MockMap }))
vi.mock('../components/AdminMap', () => ({ default: () => null }))

const h = React.createElement

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() {}
  render() { return this.state.failed ? null : this.props.children }
}

// ----------------------------------------------------------------- App ------
const appSource = Object.values(import.meta.glob('../../App.jsx', { query: '?raw', import: 'default', eager: true }))[0]
const routePaths = [...new Set([...appSource.matchAll(/path=\s*"([^"]+)"/g)].map((m) => m[1].replace('*', 'missing')))]

describe('exhaustive routing coverage: App + ProtectedRoute', () => {
  beforeEach(() => {
    installBrowserApis()
    silenceConsole(vi)
  })

  it.each(SESSION_KINDS)('walks every route as session "%s"', async (kind) => {
    const { default: App } = await import('../App')
    const rich = buildRich()
    let i = 0
    for (const path of routePaths) {
      i += 1
      setSession(kind)
      if (i % 3 !== 1) seedStorage()
      installFetch(['rich', 'error', 'mixed'][i % 3])
      const view = render(
        h(Boundary, null,
          h(MemoryRouter, { initialEntries: [{ pathname: path, search: '?token=tok&id=1&PayerID=p', state: { project: rich[0], projectId: 1, provider: rich[0] } }] }, h(App))),
      )
      await settle()
      await poke(1, 15)
      view.unmount()
    }
  }, 240000)
})
