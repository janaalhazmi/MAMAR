import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import PhoneAlertsCard from '../components/PhoneAlertsCard'

const m = vi.hoisted(() => ({ getSession: vi.fn(), fetchNotificationChannels: vi.fn(), postTestMessage: vi.fn() }))
vi.mock('../services/auth', () => ({ getSession: (...a) => m.getSession(...a) }))
vi.mock('../services/api', () => ({
  fetchNotificationChannels: (...a) => m.fetchNotificationChannels(...a),
  postTestMessage: (...a) => m.postTestMessage(...a),
}))

const channels = (over = {}) => ({
  channel: 'whatsapp', messages_enabled: true, phone_saved: true, phone_hint: '***12', ...over,
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

beforeEach(() => {
  m.getSession.mockReset().mockReturnValue({ access_token: 'tok' })
  m.fetchNotificationChannels.mockReset().mockResolvedValue(channels())
  m.postTestMessage.mockReset().mockResolvedValue({ phone_hint: '12' })
})

describe('PhoneAlertsCard', () => {
  it('بدون جلسة ما يعرض شي ولا يطلب الخادم', async () => {
    m.getSession.mockReturnValue(null)
    const { container } = render(<PhoneAlertsCard />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
    expect(m.fetchNotificationChannels).not.toHaveBeenCalled()
  })

  it('فشل جلب القنوات يخليه فاضي', async () => {
    m.fetchNotificationChannels.mockRejectedValue(new Error('x'))
    const { container } = render(<PhoneAlertsCard />)
    await act(async () => {})
    expect(container).toBeEmptyDOMElement()
  })

  it('نتيجة متأخرة بعد الإزالة تتجاهل (نجاح)', async () => {
    const d = deferred()
    m.fetchNotificationChannels.mockReturnValue(d.promise)
    const view = render(<PhoneAlertsCard />)
    view.unmount()
    await act(async () => { d.resolve(channels()); await d.promise })
    expect(screen.queryByText('Notifications on Your Phone')).not.toBeInTheDocument()
  })

  it('نتيجة متأخرة بعد الإزالة تتجاهل (فشل)', async () => {
    const d = deferred()
    m.fetchNotificationChannels.mockReturnValue(d.promise)
    const view = render(<PhoneAlertsCard />)
    view.unmount()
    await act(async () => { d.reject(new Error('late')); await d.promise.catch(() => {}) })
    expect(screen.queryByText('Notifications on Your Phone')).not.toBeInTheDocument()
  })

  it('واتساب مفعّل وفيه رقم: يرسل رسالة تجريبية (مع Sending…)', async () => {
    const d = deferred()
    m.postTestMessage.mockReturnValue(d.promise)
    render(<PhoneAlertsCard />)
    expect(await screen.findByText('To your phone ***12')).toBeInTheDocument()
    expect(screen.getByText('WhatsApp')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Send me a test message'))
    expect(await screen.findByText('Sending…')).toBeDisabled()
    await act(async () => { d.resolve({ phone_hint: '12' }); await d.promise })
    expect(await screen.findByRole('status')).toHaveTextContent('Sent to your phone ending 12. Check WhatsApp.')
    expect(screen.getByRole('status')).toHaveClass('ok')
    expect(m.postTestMessage).toHaveBeenCalledWith('tok')
  })

  it('قناة SMS: الرسالة تقول "your messages"', async () => {
    m.fetchNotificationChannels.mockResolvedValue(channels({ channel: 'sms' }))
    render(<PhoneAlertsCard />)
    expect(await screen.findByText('SMS')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Send me a test message'))
    expect(await screen.findByRole('status')).toHaveTextContent('Check your messages.')
  })

  it('فشل الإرسال التجريبي يعرض الخطأ', async () => {
    m.postTestMessage.mockRejectedValue(new Error('Twilio down'))
    render(<PhoneAlertsCard />)
    fireEvent.click(await screen.findByText('Send me a test message'))
    const status = await screen.findByRole('status')
    expect(status).toHaveTextContent('Twilio down')
    expect(status).toHaveClass('bad')
  })

  it('الإرسال بدون جلسة يمرّر undefined', async () => {
    render(<PhoneAlertsCard />)
    const btn = await screen.findByText('Send me a test message')
    m.getSession.mockReturnValue(null)
    fireEvent.click(btn)
    await screen.findByRole('status')
    expect(m.postTestMessage).toHaveBeenCalledWith(undefined)
  })

  it('الرسائل غير مفعّلة من الخادم', async () => {
    m.fetchNotificationChannels.mockResolvedValue(channels({ messages_enabled: false }))
    render(<PhoneAlertsCard />)
    expect(await screen.findByText('Not switched on yet')).toBeInTheDocument()
    expect(screen.queryByText('Send me a test message')).not.toBeInTheDocument()
  })

  it('مفعّلة بس الرقم غير محفوظ', async () => {
    m.fetchNotificationChannels.mockResolvedValue(channels({ phone_saved: false }))
    render(<PhoneAlertsCard />)
    expect(await screen.findByText('Save your mobile number in your profile to get them')).toBeInTheDocument()
    expect(screen.queryByText('Send me a test message')).not.toBeInTheDocument()
  })
})
