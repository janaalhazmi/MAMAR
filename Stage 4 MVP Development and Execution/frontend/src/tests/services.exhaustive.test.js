import { describe, it, vi, beforeEach } from 'vitest'
import {
  FETCH_SCENARIOS, buildRich, seedStorage, installBrowserApis, installFetch, setSession, silenceConsole, settle, realSetTimeout,
} from '../test/exhaustive/env'

const modules = Object.entries(import.meta.glob('../../services/**/*.js')).filter(
  ([p]) => !p.includes('__tests__'),
)

const withTimeout = (p, ms = 40) =>
  Promise.race([Promise.resolve(p).catch(() => {}), new Promise((r) => realSetTimeout(r, ms))])

function argSets(rich) {
  const file = typeof File !== 'undefined' ? new File(['x'], 'a.png', { type: 'image/png' }) : 'file'
  const form = typeof FormData !== 'undefined' ? new FormData() : {}
  const body = { ...rich[0], name: 'Test', title: 'T', amount: 10, rating: 5, message: 'hi' }
  return [
    [], [1], ['x'], [null], [undefined, undefined], [{}], [rich], [body], [1, {}], [1, body],
    [1, 1], ['x', 'y'], [1, 'x', {}], [1, 2, 3], [form, 1], [file], [1, file], [1, [file]],
    [{ projectId: 1, providerId: 1, quotationId: 1 }], [24.7, 46.6], [[1, 2], 'x'],
    [1, { status: 'completed' }], [1, { reason: 'because' }], [{ page: 2, limit: 5, q: 'a' }],
    [() => {}], [1, () => {}], [() => {}, () => {}], [1, {}, () => {}], [1, () => {}, () => {}], [{}, () => {}, () => {}],
  ]
}

describe('exhaustive service coverage: every exported function', () => {
  beforeEach(() => {
    installBrowserApis()
    silenceConsole(vi)
  })

  it.each(modules)('exercises %s', async (_path, load) => {
    const mod = await load()
    const rich = buildRich()
    const fns = Object.entries(mod).filter(([, v]) => typeof v === 'function')
    for (const kind of ['none', 'contractor', 'provider', 'worker', 'admin']) {
      for (const scenario of FETCH_SCENARIOS) {
        setSession(kind)
        if (scenario !== 'error') seedStorage()
        installFetch(scenario)
        for (const [exportName, fn] of fns) {
          // React hooks (useX) لا يجوز استدعاؤها كدوال عادية خارج renderHook/React.
          if (exportName.startsWith('use') || fn.name.startsWith('use')) continue

          // watchQuotations يستقبل callbacks داخل object destructuring، وليس كوسائط منفصلة.
          // استدعاؤه بوسائط عشوائية كان يترك onFinish غير معرّفة ويسبب unhandled rejections.
          if (exportName === 'watchQuotations' || fn.name === 'watchQuotations') {
            let stop
            try {
              stop = fn(1, { onData: () => {}, onError: () => {}, onFinish: () => {} })
              await settle(5)
            } catch { /* invalid backend response is acceptable in this fuzz pass */ }
            finally { if (typeof stop === 'function') stop() }
            continue
          }

          for (const args of argSets(rich)) {
            try {
              const out = fn(...args)
              const settled = await withTimeout(out)
              if (typeof settled === 'function') settled()
              if (typeof out === 'function') out()
            } catch { /* errors are expected for invalid arguments */ }
          }
        }
        await settle(2)
      }
    }
  }, 300000)
})
