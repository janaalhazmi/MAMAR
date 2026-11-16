import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route, useLocation } from 'react-router-dom'
import WorkerVerificationPage from '../../pages/Weblogin/WorkerVerificationPage'

const m = vi.hoisted(() => ({ turnstileOn: false, registerUser: vi.fn(), sendPasscode: vi.fn() }))
vi.mock('../../services/turnstile', () => ({
  get turnstileOn() { return m.turnstileOn },
}))
vi.mock('../../services/api', () => ({
  registerUser: (...a) => m.registerUser(...a),
  sendPasscode: (...a) => m.sendPasscode(...a),
}))
vi.mock('../../components/Turnstile', async () => {
  const React = await import('react')
  return {
    default: ({ onToken, resetKey }) =>
      React.createElement('div', null,
        React.createElement('button', { type: 'button', onClick: () => onToken('cap-token') }, 'give-captcha'),
        React.createElement('span', null, `reset-${resetKey}`)),
  }
})

const WORKER = { role: 'worker', email: 'w@example.com', full_name: 'Worker One' }
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
function LoginStub() {
  const { state } = useLocation()
  return <div>login page {state?.message}</div>
}
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/worker-verification']}>
      <Routes>
        <Route path="/register" element={<div>register page</div>} />
        <Route path="/login" element={<LoginStub />} />
        <Route path="/" element={<div>home page</div>} />
        <Route path="*" element={<WorkerVerificationPage />} />
      </Routes>
    </MemoryRouter>,
  )
}
const seed = (value = WORKER) => sessionStorage.setItem('mamarPendingRegistration', JSON.stringify(value))
const typeCode = (v) => fireEvent.change(screen.getByLabelText('Passcode'), { target: { value: v } })
const submitForm = async () => { await act(async () => { fireEvent.click(screen.getByText(/Create Account →|Creating account/)) }) }

beforeEach(() => {
  m.turnstileOn = false
  m.registerUser.mockReset().mockResolvedValue({})
  m.sendPasscode.mockReset().mockResolvedValue({})
  seed()
})
afterEach(() => { vi.useRealTimers() })

describe('WorkerVerificationPage - حماية الدخول للصفحة', () => {
  it('بدون تسجيل معلّق يحوّل لصفحة التسجيل', async () => {
    sessionStorage.clear()
    renderPage()
    expect(await screen.findByText('register page')).toBeInTheDocument()
  })

  it('دور غير worker يحوّل لصفحة التسجيل', async () => {
    seed({ ...WORKER, role: 'contractor' })
    renderPage()
    expect(await screen.findByText('register page')).toBeInTheDocument()
  })

  it('بيانات تالفة تحوّل لصفحة التسجيل', async () => {
    sessionStorage.setItem('mamarPendingRegistration', '{not json')
    renderPage()
    expect(await screen.findByText('register page')).toBeInTheDocument()
  })

  it('Go back يرجع للتسجيل', async () => {
    renderPage()
    fireEvent.click(screen.getByText('Go back'))
    expect(await screen.findByText('register page')).toBeInTheDocument()
  })
})

describe('WorkerVerificationPage - إنشاء الحساب', () => {
  it('حقل الرمز يقبل أرقام فقط وبحد 6', () => {
    renderPage()
    typeCode('12ab34567890')
    expect(screen.getByLabelText('Passcode')).toHaveValue('123456')
  })

  it('رمز ناقص يعرض خطأ', async () => {
    renderPage()
    typeCode('123')
    await submitForm()
    expect(screen.getByRole('alert')).toHaveTextContent('Please enter the 6-digit passcode.')
    expect(m.registerUser).not.toHaveBeenCalled()
  })

  it('اختفاء التسجيل المعلّق قبل الإرسال يحوّل للتسجيل', async () => {
    renderPage()
    typeCode('123456')
    sessionStorage.clear()
    await submitForm()
    expect(await screen.findByText('register page')).toBeInTheDocument()
  })

  it('Turnstile مفعّل بدون تحقق يرفض', async () => {
    m.turnstileOn = true
    renderPage()
    typeCode('123456')
    await submitForm()
    expect(screen.getByRole('alert')).toHaveTextContent('Please confirm you are not a robot.')
    expect(m.registerUser).not.toHaveBeenCalled()
  })

  it('نجاح التسجيل: ينادي registerUser ويحوّل للدخول برسالة', async () => {
    m.turnstileOn = true
    renderPage()
    fireEvent.click(screen.getByText('give-captcha'))
    typeCode('123456')
    await submitForm()
    expect(m.registerUser).toHaveBeenCalledWith(WORKER, '123456', 'cap-token')
    expect(await screen.findByText(/login page Account created successfully/)).toBeInTheDocument()
    expect(sessionStorage.getItem('mamarPendingRegistration')).toBeNull()
  })

  it('حالة Creating account... أثناء الطلب', async () => {
    const d = deferred()
    m.registerUser.mockReturnValue(d.promise)
    renderPage()
    typeCode('123456')
    await submitForm()
    expect(screen.getByText('Creating account...')).toBeDisabled()
    await act(async () => { d.resolve({}); await d.promise })
  })

  it('دور تغيّر بعد فتح الصفحة يرفض', async () => {
    renderPage()
    typeCode('123456')
    seed({ ...WORKER, role: 'provider' })
    await submitForm()
    expect(screen.getByRole('alert')).toHaveTextContent('Invalid account type. Please register again.')
    expect(screen.getByText('reset-1')).toBeInTheDocument()
    expect(m.registerUser).not.toHaveBeenCalled()
  })

  it('فشل التسجيل برسالة', async () => {
    m.registerUser.mockRejectedValue(new Error('Wrong passcode'))
    renderPage()
    typeCode('123456')
    await submitForm()
    expect(screen.getByRole('alert')).toHaveTextContent('Wrong passcode')
  })

  it('فشل التسجيل بدون رسالة', async () => {
    m.registerUser.mockRejectedValue(new Error(''))
    renderPage()
    typeCode('123456')
    await submitForm()
    expect(screen.getByRole('alert')).toHaveTextContent('Unable to create your account.')
  })
})

describe('WorkerVerificationPage - إعادة إرسال الرمز', () => {
  it('نجاح الإرسال ثم عدّاد تنازلي (مع Sending...)', async () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] })
    const d = deferred()
    m.sendPasscode.mockReturnValue(d.promise)
    renderPage()
    await act(async () => { fireEvent.click(screen.getByText('Resend Passcode')) })
    expect(screen.getByText('Sending...')).toBeDisabled()
    await act(async () => { d.resolve({}); await d.promise })
    expect(m.sendPasscode).toHaveBeenCalledWith('w@example.com')
    expect(screen.getByRole('status')).toHaveTextContent('A new passcode has been sent to your email.')
    expect(screen.getByText('Resend passcode in 60s')).toBeDisabled()
    await act(async () => { await vi.advanceTimersByTimeAsync(1000) })
    expect(screen.getByText('Resend passcode in 59s')).toBeInTheDocument()
  })

  it('بدون تسجيل معلّق يحوّل للتسجيل', async () => {
    renderPage()
    sessionStorage.clear()
    fireEvent.click(screen.getByText('Resend Passcode'))
    expect(await screen.findByText('register page')).toBeInTheDocument()
  })

  it('دور غير صحيح عند الإعادة', async () => {
    renderPage()
    seed({ ...WORKER, role: 'provider' })
    fireEvent.click(screen.getByText('Resend Passcode'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Invalid account type. Please register again.')
    expect(m.sendPasscode).not.toHaveBeenCalled()
  })

  it('فشل الإعادة برسالة وبدون رسالة', async () => {
    m.sendPasscode.mockRejectedValueOnce(new Error('SMTP down'))
    renderPage()
    fireEvent.click(screen.getByText('Resend Passcode'))
    expect(await screen.findByRole('alert')).toHaveTextContent('SMTP down')
    m.sendPasscode.mockRejectedValueOnce(new Error(''))
    fireEvent.click(screen.getByText('Resend Passcode'))
    expect(await screen.findByText('Unable to resend the passcode.')).toBeInTheDocument()
  })
})
