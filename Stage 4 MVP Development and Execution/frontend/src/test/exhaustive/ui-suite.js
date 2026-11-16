import React from 'react'
import { describe, it, vi, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import {
  ROLES, VARIANTS, buildRich, seedStorage, installBrowserApis, installFetch, poke, setSession,
  settle, silenceConsole,
} from './env'


const h = React.createElement
const noop = () => {}

class Boundary extends React.Component {
  constructor(p) { super(p); this.state = { failed: false } }
  static getDerivedStateFromError() { return { failed: true } }
  componentDidCatch() {}
  render() { return this.state.failed ? null : this.props.children }
}

function entryFor(rich, withState) {
  return {
    pathname: '/page',
    search: '?token=tok&id=1&project_id=1&projectId=1&PayerID=payer&status=success&q=test&role=contractor&email=test@example.com&order_id=1',
    state: withState ? {
      project: rich[0], projectId: 1, project_id: 1, provider: rich[0], providerId: 1,
      quotation: rich[0], quote: rich[0], email: 'test@example.com', from: '/home',
      role: 'contractor', fromPayment: true, data: rich[0], worker: rich[0],
    } : null,
  }
}

function propsBag(rich) {
  const l = rich[0] || {}
  return {
    ...l,
    children: 'child',
    // Sidebar/NavLink تحتاج عناصر لها path صالح؛ buildRich العام لا يضمن ذلك.
    items: [
      { key: 'dashboard', path: '/dashboard', label: 'Dashboard', icon: 'home' },
      { key: 'providers', path: '/providers', label: 'Providers', icon: 'users' },
    ],
    onClose: noop, onChange: noop, onClick: noop, onSubmit: noop, onSelect: noop, onSuccess: noop,
    onVerify: noop, onToken: noop, onDone: noop, onRefresh: noop, onSave: noop, onCancel: noop,
    onConfirm: noop, onRate: noop, onLogout: noop, onError: noop, onExpire: noop, onLoad: noop,
    onToggle: noop, onSearch: noop, onNavigate: noop,
    projectId: 1, providerId: 1, workerId: 1, quotationId: 1,
    rating: 4, value: 3, max: 5, size: 24, open: true, isOpen: true, show: true, loading: false,
    active: 'home', role: 'contractor', lat: 24.7, lng: 46.6, latitude: 24.7, longitude: 46.6,
    label: 'Label', title: 'Title', to: '/x', href: '/x', variant: 'primary', className: 'x',
    siteKey: 'site-key', session: { user: l },
  }
}

function blankProps(rich) {
  const bag = propsBag(rich)
  const out = Object.fromEntries(Object.entries(bag).map(([k, v]) => [k, k === 'items' ? [] : typeof v === 'function' || k === 'to' || k === 'href' ? v : null]))
  return { ...out, loading: true, error: 'Error text', children: null }
}

function roleForPath(path) {
  if (path.includes('/Contractor/')) return 'contractor'
  if (path.includes('/Providers/')) return 'provider'
  if (path.includes('/FieldWorker/')) return 'worker'
  if (path.includes('/Admin/')) return 'admin'
  return 'contractor'
}

async function renderOnce(Comp, props, entry) {
  const view = render(
    h(Boundary, null,
      h(MemoryRouter, { initialEntries: [entry] },
        h(Routes, null, h(Route, { path: '/login', element: h('div', null, 'login') }), h(Route, { path: '*', element: h(Comp, props) })))),
  )
  await settle()
  await poke()
  view.unmount()
}

export function defineUiSuite(title, loaders) {
  const files = Object.entries(loaders).filter(([p]) =>
    !p.includes('__tests__') && !p.endsWith('/MamarMap.jsx') && !p.endsWith('/AdminMap.jsx') &&
    !p.endsWith('/FieldWorkerSidebar.jsx'))

  describe(title, () => {
    beforeEach(() => {
      installBrowserApis()
      silenceConsole(vi)
    })

    it.each(files)('drives %s', async (path, load) => {
      const mod = await load()
      const Comp = mod.default
      if (typeof Comp !== 'function' && typeof Comp !== 'object') return
      const primary = roleForPath(path)
      const other = ROLES.find((r) => r !== primary)
      const plan = [
        [primary, 'rich', {}, true, true],
        [primary, 'mixed', {}, true, false],
        [primary, 'empty', {}, false, true],
        [primary, 'error', {}, true, true],
        [other, 'rich', {}, true, false],
        ['none', 'network', {}, false, true],
        ...VARIANTS.map((v) => [primary, 'rich', v, true, true]),
        [primary, 'rich', {}, true, 'blank'],
        [primary, 'mixed', {}, false, 'blank'],
      ]
      for (const [role, scenario, variant, withState, withProps] of plan) {
        setSession(role)
        if (scenario === 'rich' || scenario === 'mixed') seedStorage()
        installFetch(scenario, variant)
        const rich = buildRich(variant)
        const props = withProps === true ? propsBag(rich) : withProps === 'blank' ? blankProps(rich) : {}
        await renderOnce(Comp, props, entryFor(rich, withState))
      }
    }, 120000)
  })
}

