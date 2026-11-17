import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import NotificationBell from '../components/NotificationBell'

const m = vi.hoisted(() => ({ getNotifications: vi.fn() }))
vi.mock('../services/notifications', () => ({ getNotifications: (...a) => m.getNotifications(...a) }))

const dot = (c) => c.querySelector('.cd-notification-dot')
const tick = (ms) => act(async () => { await vi.advanceTimersByTimeAsync(ms) })
const mount = () => render(<MemoryRouter><NotificationBell /></MemoryRouter>)
const deferred = () => {
  let resolve
  const promise = new Promise((res) => { resolve = res })
  return { promise, resolve }
}

let audio
function installAudio() {
  audio = { created: 0, started: false, closed: false, osc: null }
  window.AudioContext = class {
    constructor() { audio.created += 1 }
    createOscillator() {
      audio.osc = { connect() {}, start() { audio.started = true }, stop() {}, frequency: {} }
      return audio.osc
    }
    createGain() { return { connect() {}, gain: {} } }
    get destination() { return {} }
    get currentTime() { return 0 }
    close() { audio.closed = true }
  }
}

beforeEach(() => {
  vi.useFakeTimers({ toFake: ['setInterval', 'clearInterval'] })
  m.getNotifications.mockReset().mockResolvedValue([])
  delete window.AudioContext
  delete window.webkitAudioContext
  vi.spyOn(console, 'error').mockImplementation(() => {})
})
afterEach(() => {
  vi.useRealTimers()
  delete window.AudioContext
  delete window.webkitAudioContext
})

describe('NotificationBell', () => {
  it('يعرض نقطة لما فيه غير مقروء', async () => {
    m.getNotifications.mockResolvedValue([{ id: 1, read: false }, { id: 2, read: true }])
    const { container } = mount()
    await tick(0)
    expect(dot(container)).not.toBeNull()
  })

  it('بدون نقطة لما الكل مقروء', async () => {
    m.getNotifications.mockResolvedValue([{ id: 1, read: true }])
    const { container } = mount()
    await tick(0)
    expect(dot(container)).toBeNull()
  })

  it('فشل الجلب يطبع خطأ ولا ينهار', async () => {
    m.getNotifications.mockRejectedValue(new Error('no session'))
    const { container } = mount()
    await tick(0)
    expect(console.error).toHaveBeenCalled()
    expect(dot(container)).toBeNull()
  })

  it('نتيجة متأخرة بعد الإزالة تتجاهل', async () => {
    const d = deferred()
    m.getNotifications.mockReturnValue(d.promise)
    const view = mount()
    view.unmount()
    await act(async () => { d.resolve([{ id: 1, read: false }]); await d.promise })
    expect(console.error).not.toHaveBeenCalled()
  })

  it('إشعار جديد في التحديث الدوري يشغّل الصوت ويقفل السياق عند الانتهاء', async () => {
    installAudio()
    m.getNotifications
      .mockResolvedValueOnce([{ id: 1, read: false }])
      .mockResolvedValue([{ id: 1, read: false }, { id: 2, read: false }])
    mount()
    await tick(0)
    expect(audio.created).toBe(0)
    await tick(10000)
    expect(audio.created).toBe(1)
    expect(audio.started).toBe(true)
    audio.osc.onended()
    expect(audio.closed).toBe(true)
  })

  it('نفس الإشعارات بدون جديد ما يشغّل صوت', async () => {
    installAudio()
    m.getNotifications.mockResolvedValue([{ id: 1, read: false }])
    mount()
    await tick(0)
    await tick(10000)
    expect(audio.created).toBe(0)
  })

  it('يستخدم webkitAudioContext إذا AudioContext غير موجود', async () => {
    installAudio()
    window.webkitAudioContext = window.AudioContext
    delete window.AudioContext
    m.getNotifications
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 5, read: false }])
    mount()
    await tick(0)
    await tick(10000)
    expect(audio.created).toBe(1)
  })

  it('بدون دعم للصوت يتخطى بهدوء', async () => {
    m.getNotifications
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 5, read: false }])
    const { container } = mount()
    await tick(0)
    await tick(10000)
    expect(dot(container)).not.toBeNull()
  })

  it('إذا السياق الصوتي رمى خطأ يتجاهله', async () => {
    window.AudioContext = class { constructor() { throw new Error('blocked') } }
    m.getNotifications
      .mockResolvedValueOnce([])
      .mockResolvedValue([{ id: 5, read: false }])
    const { container } = mount()
    await tick(0)
    await tick(10000)
    expect(dot(container)).not.toBeNull()
    expect(console.error).not.toHaveBeenCalled()
  })

  it('يوقف التحديث الدوري عند الإزالة', async () => {
    const view = mount()
    await tick(0)
    view.unmount()
    const calls = m.getNotifications.mock.calls.length
    await tick(30000)
    expect(m.getNotifications.mock.calls.length).toBe(calls)
  })
})
