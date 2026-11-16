import { act, fireEvent } from '@testing-library/react'

export const realSetTimeout = globalThis.setTimeout
export const realSetInterval = globalThis.setInterval

// ---------------------------------------------------------------- sessions --
const b64url = (o) =>
  btoa(JSON.stringify(o)).replace(/=+$/, '').replace(/\+/g, '-').replace(/\//g, '_')

export function makeToken(role, id = 1, expOffset = 3600) {
  return [
    b64url({ alg: 'HS256', typ: 'JWT' }),
    b64url({ sub: String(id), role, exp: Math.floor(Date.now() / 1000) + expOffset }),
    'sig',
  ].join('.')
}

export const ROLES = ['contractor', 'provider', 'worker', 'admin']
export const SESSION_KINDS = ['none', ...ROLES, 'expired', 'mismatch']

let currentRole = 'contractor'

export function setSession(kind) {
  sessionStorage.clear()
  if (kind === 'none') return
  const role = ROLES.includes(kind) ? kind : 'contractor'
  currentRole = role
  const user = {
    user_id: 1, id: 1, role, full_name: 'Test User', name: 'Test User',
    email: 'test@example.com', phone: '0500000000', company_name: 'Test Co',
    verified: true, is_verified: true,
  }
  let token = makeToken(role, 1)
  if (kind === 'expired') token = makeToken(role, 1, -60)
  if (kind === 'mismatch') token = makeToken('admin', 99)
  sessionStorage.setItem('mamarSession', JSON.stringify({ access_token: token, user }))
}


// مسودة مشروع وجلسات وهمية: كثير من الصفحات تقرأها من sessionStorage وتحوّل المستخدم لو ما لقتها.
export function seedStorage() {
  const polygon = { rings: [[[46.6, 24.7], [46.7, 24.7], [46.7, 24.8], [46.6, 24.7]]], spatialReference: { wkid: 4326 } }
  const project = {
    id: 7, project_id: 7, name: 'Road renewal', type: 'Infrastructure', startDate: '2099-01-01',
    endDate: '2099-01-10', description: 'Repair work', location: 'Riyadh', latitude: 24.7136,
    longitude: 46.6753, area: 1200, polygon, workZone: polygon, services: ['ttc-plan', 'road-signs'],
    status: 'draft',
  }
  const set = (k, v) => sessionStorage.setItem(k, JSON.stringify(v))
  set('mamarNewProject', project)
  set('selectedProviders', [1, 2])
  set('selectedQuotationId', 1)
  set('confirmedQuotation', 1)
  set('mamarQuotationCache', [{ quotation_id: 1, id: 1, provider_id: 1, provider_name: 'Provider', total_price: 1000, price: 1000, status: 'pending' }])
  set('mamarPendingRegistration', { email: 'test@example.com', full_name: 'Test User', role: 'contractor', phone: '0500000000' })
  set('mamarPendingPayment', { project, quotation: { quotation_id: 1, id: 1, total_price: 1000 } })
  set('mamarNotifications', [{ id: 1, title: 'Hello', message: 'Hi', read: false, created_at: '2099-01-01T10:00:00Z' }])
}

// ----------------------------------------------------------- rich payloads --
const TEXT = ['name', 'title', 'description', 'status', 'email', 'phone', 'full_name', 'company_name',
  'location', 'city', 'type', 'message', 'comment', 'label', 'address', 'category', 'service',
  'provider_name', 'project_name', 'note', 'notes', 'reason', 'currency', 'code', 'url', 'photo_url',
  'image', 'avatar', 'created_at', 'updated_at', 'date', 'start_date', 'end_date', 'startDate',
  'endDate', 'time', 'check_in', 'check_out', 'site_status', 'token', 'access_token', 'approval_url',
  'condition', 'summary_text', 'text', 'content', 'body', 'subject', 'worker_name', 'contractor_name']
const NUM = ['id', 'project_id', 'user_id', 'provider_id', 'quotation_id', 'quote_id', 'worker_id',
  'request_id', 'review_id', 'payment_id', 'service_id', 'notification_id', 'rating', 'amount',
  'price', 'total', 'cost', 'count', 'progress', 'percent', 'budget', 'latitude', 'longitude',
  'lat', 'lng', 'score', 'duration', 'days', 'distance', 'temperature', 'wind', 'humidity',
  'workers_count', 'unread', 'unread_count', 'total_cost', 'vat', 'subtotal']
const BOOL = ['verified', 'is_verified', 'ok', 'success', 'read', 'is_read', 'active', 'paid',
  'completed', 'approved', 'available', 'checked_in', 'is_active', 'safe']
const LISTS = ['items', 'results', 'projects', 'providers', 'quotations', 'quotes', 'requests',
  'workers', 'team', 'members', 'services', 'photos', 'reviews', 'notifications', 'payments',
  'users', 'companies', 'alerts', 'tasks', 'logs', 'records', 'attendance', 'history', 'events',
  'sites', 'list', 'rows', 'steps', 'milestones', 'forecast', 'daily', 'hourly', 'phases',
  'recommendations', 'tips', 'risks', 'lines', 'line_items', 'documents']
const OBJS = ['data', 'project', 'provider', 'quotation', 'quote', 'request', 'worker', 'user',
  'summary', 'profile', 'session', 'company', 'weather', 'payment', 'order', 'stats', 'metrics',
  'site', 'result', 'details', 'meta', 'completion', 'monitoring', 'plan', 'advisor', 'traffic',
  'current', 'totals', 'breakdown']

export const VARIANTS = [
  { status: 'pending' }, { status: 'completed' }, { status: 'rejected' }, { status: 'cancelled' },
  { flip: true, status: 'approved' }, { blank: true }, { blank: true, empty: true },
]

function scalars(variant = {}) {
  const o = {}
  const blank = !!variant.blank
  TEXT.forEach((k, i) => { o[k] = blank ? '' : i % 5 === 0 ? '2099-01-01T10:00:00Z' : `Test ${k}` })
  NUM.forEach((k, i) => { o[k] = blank ? 0 : (i % 7) + 1 })
  BOOL.forEach((k, i) => { o[k] = blank ? false : variant.flip ? i % 3 === 0 : i % 3 !== 0 })
  o.status = variant.status || (blank ? '' : 'active')
  o.role = currentRole
  if (!blank) {
    o.latitude = 24.7136; o.longitude = 46.6753; o.lat = 24.7136; o.lng = 46.6753
    o.email = 'test@example.com'; o.phone = '0500000000'
    o.date = '2099-01-01'; o.start_date = '2099-01-01'; o.end_date = '2099-01-10'
    o.startDate = '2099-01-01'; o.endDate = '2099-01-10'; o.created_at = '2099-01-01T10:00:00Z'
  }
  o.user_id = 1
  o.id = 1
  return o
}
function level(child, variant = {}) {
  const o = scalars(variant)
  LISTS.forEach((k) => { o[k] = variant.empty ? [] : [child] })
  OBJS.forEach((k) => { o[k] = variant.empty ? null : child })
  return o
}
// حجم صغير عمداً: أي JSON.stringify داخل الصفحات يبقى خفيف.
export function buildRich(variant = {}) {
  const leaf = scalars(variant)
  const mid = level(leaf, variant)
  return Object.assign(variant.empty ? [] : [mid], mid)
}

// ------------------------------------------------------------ fetch mocks --
export const FETCH_SCENARIOS = ['rich', 'mixed', 'empty', 'error', 'network']

function makeResponse(ok, status, data) {
  const res = {
    ok, status, statusText: ok ? 'OK' : 'ERR', url: 'https://api.example.test',
    headers: { get: () => 'application/json', has: () => true, forEach() {} },
    json: async () => data,
    text: async () => (typeof data === 'string' ? data : JSON.stringify(data)),
    blob: async () => new Blob(['x']),
    arrayBuffer: async () => new ArrayBuffer(8),
    formData: async () => new FormData(),
  }
  res.clone = () => res
  return res
}

export function installFetch(scenario, variant = {}) {
  let n = 0
  const rich = buildRich(variant)
  const fn = async (url, options = {}) => {
    n += 1
    const method = String(options?.method || 'GET').toUpperCase()
    if (scenario === 'network') throw new TypeError('Failed to fetch')
    if (scenario === 'error') return makeResponse(false, n % 2 ? 500 : 401, { detail: 'boom' })
    if (scenario === 'mixed') {
      const codes = [200, 400, 401, 403, 404, 409, 422, 429, 500, 502]
      const code = codes[n % codes.length]
      if (code === 422) return makeResponse(false, 422, { detail: [{ msg: 'bad value' }] })
      if (code !== 200) return makeResponse(false, code, { detail: `err ${code}` })
      return makeResponse(true, 200, rich)
    }
    if (scenario === 'empty') return makeResponse(true, 200, method === 'GET' ? [] : {})
    return makeResponse(true, 200, rich)
  }
  globalThis.fetch = fn
  window.fetch = fn
  return fn
}

// -------------------------------------------------------- browser polyfills --
export function installBrowserApis() {
  const noop = () => {}
  // نقصّر كل المؤقتات عشان التحويلات والـ polling تنفذ داخل نافذة الاختبار.
  globalThis.setTimeout = window.setTimeout = (fn, ms, ...a) => realSetTimeout(fn, Math.min(Number(ms) || 0, 25), ...a)
  globalThis.setInterval = window.setInterval = (fn, ms, ...a) => realSetInterval(fn, Math.min(Number(ms) || 0, 40), ...a)
  window.matchMedia = window.matchMedia || (() => ({
    matches: false, media: '', onchange: null, addEventListener: noop, removeEventListener: noop,
    addListener: noop, removeListener: noop, dispatchEvent: () => false,
  }))
  class Obs { observe() {} unobserve() {} disconnect() {} takeRecords() { return [] } }
  globalThis.IntersectionObserver = Obs
  globalThis.ResizeObserver = Obs
  globalThis.MutationObserver = globalThis.MutationObserver || Obs
  window.scrollTo = noop
  Element.prototype.scrollIntoView = noop
  window.print = noop
  window.alert = noop
  window.confirm = () => true
  window.prompt = () => 'value'
  window.open = () => ({
    document: { write: noop, close: noop }, focus: noop, print: noop, close: noop,
  })
  URL.createObjectURL = () => 'blob:mock'
  URL.revokeObjectURL = noop
  const ctx = new Proxy({ canvas: {} }, {
    get: (t, k) => (k in t ? t[k] : k === 'measureText' ? () => ({ width: 1 }) :
      k === 'getImageData' ? () => ({ data: new Uint8ClampedArray(4) }) :
      k === 'createLinearGradient' || k === 'createRadialGradient' ? () => ({ addColorStop: noop }) : noop),
    set: () => true,
  })
  HTMLCanvasElement.prototype.getContext = () => ctx
  HTMLCanvasElement.prototype.toDataURL = () => 'data:image/png;base64,AAAA'
  HTMLCanvasElement.prototype.toBlob = (cb) => cb(new Blob(['x']))
  HTMLMediaElement.prototype.play = () => Promise.resolve()
  HTMLMediaElement.prototype.pause = noop
  const pos = { coords: { latitude: 24.7136, longitude: 46.6753, accuracy: 5 }, timestamp: Date.now() }
  Object.defineProperty(navigator, 'geolocation', {
    configurable: true,
    value: {
      getCurrentPosition: (ok) => ok(pos),
      watchPosition: (ok) => { ok(pos); return 1 },
      clearWatch: noop,
    },
  })
  Object.defineProperty(navigator, 'clipboard', {
    configurable: true, value: { writeText: async () => {}, readText: async () => 'x' },
  })
  window.AudioContext = class {
    createOscillator() { return { connect: noop, start: noop, stop: noop, frequency: {}, type: '' } }
    createGain() { return { connect: noop, gain: { value: 1, setValueAtTime: noop, exponentialRampToValueAtTime: noop } } }
    get destination() { return {} }
    get currentTime() { return 0 }
    close() { return Promise.resolve() }
  }
  window.webkitAudioContext = window.AudioContext
  window.turnstile = {
    render: (_el, opts) => { opts?.callback?.('turnstile-token'); return 'widget-1' },
    reset: noop, remove: noop, getResponse: () => 'turnstile-token',
  }
}

export function silenceConsole(vi) {
  vi.spyOn(console, 'error').mockImplementation(() => {})
  vi.spyOn(console, 'warn').mockImplementation(() => {})
  vi.spyOn(console, 'log').mockImplementation(() => {})
}

// ------------------------------------------------------------ interactions --
export const settle = async (ms = 10) => {
  await act(async () => { await new Promise((r) => realSetTimeout(r, ms)) })
}

function valueFor(el, round) {
  const bad = round % 2 === 1
  const hint = `${el.type} ${el.name} ${el.id} ${el.placeholder}`.toLowerCase()
  if (/mail/.test(hint)) return bad ? 'not-an-email' : 'test@example.com'
  if (/pass|pin|code|otp|digit/.test(hint)) return bad ? 'x' : 'Passw0rd!xyz1'
  if (/phone|tel|mobile/.test(hint)) return bad ? '1' : '0512345678'
  if (el.type === 'number' || /amount|price|cost|qty|quantity|budget|number|count/.test(hint)) return bad ? '-1' : '5'
  if (el.type === 'date') return bad ? '' : '2099-01-01'
  if (el.type === 'time') return bad ? '' : '10:00'
  if (el.type === 'datetime-local') return bad ? '' : '2099-01-01T10:00'
  if (el.type === 'url') return bad ? 'nope' : 'https://example.com'
  if (el.type === 'range') return bad ? '0' : '5'
  if (el.type === 'color') return '#ff0000'
  return bad ? '' : 'Test value'
}

function fillField(el, round) {
  const type = (el.type || '').toLowerCase()
  if (type === 'checkbox' || type === 'radio') { fireEvent.click(el); return }
  if (type === 'file') {
    const file = new File(['x'], round % 2 ? 'big.exe' : 'photo.png', { type: round % 2 ? 'application/x-msdownload' : 'image/png' })
    fireEvent.change(el, { target: { files: [file] } })
    return
  }
  if (type === 'submit' || type === 'button' || type === 'reset' || type === 'image') return
  if (el.tagName === 'SELECT') {
    const opts = [...el.options]
    if (opts.length) fireEvent.change(el, { target: { value: opts[round % opts.length].value } })
    return
  }
  fireEvent.change(el, { target: { value: valueFor(el, round) } })
  fireEvent.blur(el)
  fireEvent.keyDown(el, { key: 'Enter', code: 'Enter' })
}

const CLICKABLE = 'button, [role="button"], [role="tab"], [role="menuitem"], [role="option"], summary, label, [tabindex="0"]' // الروابط تُختبر منفصلة لتجنب التنقل العشوائي

export async function poke(rounds = 2, maxClicks = 150) {
  for (let r = 0; r < rounds; r += 1) {
    document.querySelectorAll('input, textarea, select').forEach((el) => {
      try { if (el.isConnected) fillField(el, r) } catch { /* ignore */ }
    })
    await settle()
    document.querySelectorAll('form').forEach((f) => {
      try {
        if (!f.isConnected) return
        // jsdom ما يدعم form.<name> مثل المتصفح؛ نضيفها يدوياً.
        ;[...f.elements].forEach((el) => {
          for (const key of [el.name, el.id]) {
            if (key && !(key in f)) Object.defineProperty(f, key, { value: el, configurable: true })
          }
        })
        fireEvent.submit(f)
      } catch { /* ignore */ }
    })
    await settle()
    // تسجيل الخروج يغيّر المسار ويفكّ تركيب الصفحة؛ نختبره باختبار auth مخصص، لا ضمن النقر العشوائي.
    const targets = [...document.querySelectorAll(CLICKABLE)]
      .filter((el) => !/log\s*out|sign\s*out|logout/i.test(el.textContent || ''))
      .slice(0, maxClicks)
    for (const el of targets) {
      try {
        if (!el.isConnected) continue
        fireEvent.mouseEnter(el)
        fireEvent.click(el)
        fireEvent.keyDown(el, { key: 'Escape' })
      } catch { /* ignore */ }
    }
    await settle()
    for (const name of ['mamar:logout', 'mamar:session-user-updated', 'online', 'offline', 'resize', 'focus', 'storage', 'visibilitychange']) {
      try { window.dispatchEvent(new CustomEvent(name, { detail: { id: 1 } })) } catch { /* ignore */ }
    }
    await settle()
  }
}
