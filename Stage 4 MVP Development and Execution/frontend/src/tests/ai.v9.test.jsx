import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { renderHook, act } from '@testing-library/react'

const m = vi.hoisted(() => ({
  getSession: vi.fn(), fetchAiStatus: vi.fn(), fetchSafetyChecks: vi.fn(), postSafetyCheck: vi.fn(),
}))
vi.mock('../services/auth', () => ({ getSession: (...a) => m.getSession(...a) }))
vi.mock('../services/api', () => ({
  fetchAiStatus: (...a) => m.fetchAiStatus(...a),
  fetchSafetyChecks: (...a) => m.fetchSafetyChecks(...a),
  postSafetyCheck: (...a) => m.postSafetyCheck(...a),
}))

// ai.js يحتفظ بـ promise على مستوى الملف، فنحمّله من جديد لكل اختبار.
async function freshAi() {
  vi.resetModules()
  return import('../services/ai')
}
const flush = () => act(async () => { await vi.advanceTimersByTimeAsync(0) })
const advance = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
const deferred = () => {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
  m.getSession.mockReset().mockReturnValue({ access_token: 'tok' })
  m.fetchAiStatus.mockReset().mockResolvedValue({ enabled: true })
  m.fetchSafetyChecks.mockReset().mockResolvedValue({ 1: { level: 'safe' } })
  m.postSafetyCheck.mockReset().mockResolvedValue({ level: 'warn' })
})
afterEach(() => { vi.useRealTimers() })

describe('useAiEnabled', () => {
  it('بدون جلسة يرجع false ولا يسأل الخادم', async () => {
    m.getSession.mockReturnValue(null)
    const { useAiEnabled } = await freshAi()
    const { result } = renderHook(() => useAiEnabled())
    await flush()
    expect(result.current).toBe(false)
    expect(m.fetchAiStatus).not.toHaveBeenCalled()
  })

  it('يرجع true لما الخادم مفعّل، ويسأل مرة وحدة بس لأكثر من مستخدم', async () => {
    const { useAiEnabled } = await freshAi()
    const a = renderHook(() => useAiEnabled())
    const b = renderHook(() => useAiEnabled())
    await flush()
    expect(a.result.current).toBe(true)
    expect(b.result.current).toBe(true)
    expect(m.fetchAiStatus).toHaveBeenCalledTimes(1)
    expect(m.fetchAiStatus).toHaveBeenCalledWith('tok')
  })

  it('الخادم يقول غير مفعّل أو يرجع فاضي', async () => {
    m.fetchAiStatus.mockResolvedValue(undefined)
    const { useAiEnabled } = await freshAi()
    const { result } = renderHook(() => useAiEnabled())
    await flush()
    expect(result.current).toBe(false)
  })

  it('فشل الطلب يعتبر غير مفعّل', async () => {
    m.fetchAiStatus.mockRejectedValue(new Error('down'))
    const { useAiEnabled } = await freshAi()
    const { result } = renderHook(() => useAiEnabled())
    await flush()
    expect(result.current).toBe(false)
  })

  it('نتيجة متأخرة بعد الإزالة تتجاهل', async () => {
    const d = deferred()
    m.fetchAiStatus.mockReturnValue(d.promise)
    const { useAiEnabled } = await freshAi()
    const { result, unmount } = renderHook(() => useAiEnabled())
    unmount()
    await act(async () => { d.resolve({ enabled: true }); await d.promise })
    expect(result.current).toBe(false)
  })
})

describe('useSafetyChecks', () => {
  it('يقرأ الفحوصات على دفعات زمنية بعد التفعيل', async () => {
    const { useSafetyChecks } = await freshAi()
    const { result } = renderHook(() => useSafetyChecks(5, 2))
    await flush() // يتفعّل الـ AI وتُجدول المؤقتات
    await flush() // ينطلق المؤقت الأول (0ms)
    expect(result.current.enabled).toBe(true)
    expect(m.fetchSafetyChecks).toHaveBeenCalledTimes(1)
    expect(m.fetchSafetyChecks).toHaveBeenCalledWith('tok', 5)
    expect(result.current.checks).toEqual({ 1: { level: 'safe' } })
    await advance(20000)
    expect(m.fetchSafetyChecks).toHaveBeenCalledTimes(4)
  })

  it('إذا الذكاء الاصطناعي مطفّي ما يقرأ شي', async () => {
    m.fetchAiStatus.mockResolvedValue({ enabled: false })
    const { useSafetyChecks } = await freshAi()
    const { result } = renderHook(() => useSafetyChecks(5))
    await flush()
    await advance(20000)
    expect(result.current.enabled).toBe(false)
    expect(m.fetchSafetyChecks).not.toHaveBeenCalled()
  })

  it('بدون projectId ما يقرأ', async () => {
    const { useSafetyChecks } = await freshAi()
    renderHook(() => useSafetyChecks(undefined))
    await flush()
    await advance(20000)
    expect(m.fetchSafetyChecks).not.toHaveBeenCalled()
  })

  it('لو انتهت الجلسة قبل القراءة ما يقرأ', async () => {
    const { useSafetyChecks } = await freshAi()
    renderHook(() => useSafetyChecks(5))
    await flush()
    m.fetchSafetyChecks.mockClear()
    m.getSession.mockReturnValue(null)
    await advance(20000)
    expect(m.fetchSafetyChecks).not.toHaveBeenCalled()
  })

  it('فشل القراءة يتجاهل', async () => {
    m.fetchSafetyChecks.mockRejectedValue(new Error('x'))
    const { useSafetyChecks } = await freshAi()
    const { result } = renderHook(() => useSafetyChecks(5))
    await flush()
    await flush()
    expect(m.fetchSafetyChecks).toHaveBeenCalledTimes(1)
    expect(result.current.checks).toEqual({})
  })

  it('يلغي المؤقتات عند الإزالة', async () => {
    const { useSafetyChecks } = await freshAi()
    const { unmount } = renderHook(() => useSafetyChecks(5))
    await flush()
    unmount()
    m.fetchSafetyChecks.mockClear()
    await advance(20000)
    expect(m.fetchSafetyChecks).not.toHaveBeenCalled()
  })

  it('check() يفحص صورة (مع busy) ويحفظ النتيجة', async () => {
    const d = deferred()
    m.postSafetyCheck.mockReturnValue(d.promise)
    const { useSafetyChecks } = await freshAi()
    const { result } = renderHook(() => useSafetyChecks(5))
    await flush()
    let pending
    act(() => { pending = result.current.check(7) })
    expect(result.current.busy[7]).toBe(true)
    await act(async () => { d.resolve({ level: 'warn' }); await pending })
    expect(result.current.busy[7]).toBe(false)
    expect(result.current.checks[7]).toEqual({ level: 'warn' })
    expect(m.postSafetyCheck).toHaveBeenCalledWith('tok', 7, false)
  })

  it('check() مع refresh=true', async () => {
    const { useSafetyChecks } = await freshAi()
    const { result } = renderHook(() => useSafetyChecks(5))
    await flush()
    await act(async () => { await result.current.check(7, true) })
    expect(m.postSafetyCheck).toHaveBeenCalledWith('tok', 7, true)
  })

  it('check() عند الفشل يحفظ رسالة الخطأ', async () => {
    m.postSafetyCheck.mockRejectedValue(new Error('Model unavailable'))
    const { useSafetyChecks } = await freshAi()
    const { result } = renderHook(() => useSafetyChecks(5))
    await flush()
    await act(async () => { await result.current.check(7) })
    expect(result.current.error).toBe('Model unavailable')
    expect(result.current.busy[7]).toBe(false)
  })
})
