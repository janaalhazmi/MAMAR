import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import SelectProviderPage from '../pages/Contractor/SelectProviderPage'

const m = vi.hoisted(() => ({
  project: null, getSelectedQuotation: vi.fn(), handleConfirmProvider: vi.fn(),
}))
vi.mock('../components/ContractorShell', async () => {
  const React = await import('react')
  return { default: ({ children }) => React.createElement('div', null, children) }
})
vi.mock('../services/Contractor/Contractor', () => ({
  NEXT_STEPS: [{ title: 'Step A', text: 'Do A' }, { title: 'Step B', text: 'Do B' }],
  SERVICE_LABELS: { 'ttc-plan': 'TTC Plan' },
  formatDate: (d) => `D(${d})`,
  formatDateRange: (a, b) => `R(${a}-${b})`,
  formatPrice: (p) => `P(${p})`,
  getCurrentProject: () => m.project,
  getSelectedQuotation: (...a) => m.getSelectedQuotation(...a),
  handleConfirmProvider: (...a) => m.handleConfirmProvider(...a),
}))

const makeQuotation = () => ({
  providerName: 'Acme Traffic', providerLogo: 'logo.png', providerDescription: 'Great provider',
  totalPrice: 1000, durationDays: 5, startDate: '2099-01-01', services: ['ttc-plan', 'unknown-svc'],
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
function renderPage() {
  return render(
    <MemoryRouter initialEntries={['/select-provider']}>
      <Routes>
        <Route path="/quotations" element={<div>quotations page</div>} />
        <Route path="/project-monitoring" element={<div>monitoring page</div>} />
        <Route path="*" element={<SelectProviderPage />} />
      </Routes>
    </MemoryRouter>,
  )
}

beforeEach(() => {
  m.project = { name: 'Road renewal', location: 'Riyadh', startDate: '2099-01-01', endDate: '2099-01-10' }
  m.getSelectedQuotation.mockReset().mockResolvedValue(makeQuotation())
  m.handleConfirmProvider.mockReset().mockResolvedValue({})
})

describe('SelectProviderPage', () => {
  it('حالة التحميل', () => {
    m.getSelectedQuotation.mockReturnValue(new Promise(() => {}))
    renderPage()
    expect(screen.getByText('Loading…')).toBeInTheDocument()
  })

  it('بدون عرض مختار: يعرض الرسالة وزر الذهاب للعروض', async () => {
    m.getSelectedQuotation.mockResolvedValue(null)
    renderPage()
    expect(await screen.findByText(/No quotation selected yet/)).toBeInTheDocument()
    fireEvent.click(screen.getByText('Go to Quotations'))
    expect(await screen.findByText('quotations page')).toBeInTheDocument()
  })

  it('فشل تحميل العرض يرجع لصفحة "ما فيه عرض"', async () => {
    m.getSelectedQuotation.mockRejectedValue(new Error('x'))
    renderPage()
    expect(await screen.findByText(/No quotation selected yet/)).toBeInTheDocument()
  })

  it('نتيجة متأخرة بعد الإزالة تتجاهل (نجاح وفشل)', async () => {
    const a = deferred()
    m.getSelectedQuotation.mockReturnValue(a.promise)
    renderPage().unmount()
    await act(async () => { a.resolve(makeQuotation()); await a.promise })

    const b = deferred()
    m.getSelectedQuotation.mockReturnValue(b.promise)
    renderPage().unmount()
    await act(async () => { b.reject(new Error('late')); await b.promise.catch(() => {}) })
    expect(screen.queryByText('Select Provider')).not.toBeInTheDocument()
  })

  it('يعرض تفاصيل المشروع والعرض والخطوات', async () => {
    renderPage()
    expect(await screen.findByText('Acme Traffic')).toBeInTheDocument()
    expect(screen.getByText('Road renewal')).toBeInTheDocument()
    expect(screen.getByText('Riyadh')).toBeInTheDocument()
    expect(screen.getByText('R(2099-01-01-2099-01-10)')).toBeInTheDocument()
    expect(screen.getByText('P(1000)')).toBeInTheDocument()
    expect(screen.getByText('5 Days')).toBeInTheDocument()
    expect(screen.getByText('D(2099-01-01)')).toBeInTheDocument()
    expect(screen.getByText('TTC Plan')).toBeInTheDocument()
    expect(screen.getByText('unknown-svc')).toBeInTheDocument()
    expect(screen.getByText('Step A')).toBeInTheDocument()
    expect(screen.getByAltText('Acme Traffic logo')).toBeInTheDocument()
  })

  it('موقع غير محدد', async () => {
    m.project = { ...m.project, location: '' }
    renderPage()
    expect(await screen.findByText('Not specified')).toBeInTheDocument()
  })

  it('Change Provider و Cancel و Back يرجعون للعروض', async () => {
    renderPage()
    await screen.findByText('Acme Traffic')
    fireEvent.click(screen.getByText('Change Provider'))
    expect(await screen.findByText('quotations page')).toBeInTheDocument()
  })

  it('Cancel يرجع للعروض', async () => {
    renderPage()
    await screen.findByText('Acme Traffic')
    fireEvent.click(screen.getByText('Cancel'))
    expect(await screen.findByText('quotations page')).toBeInTheDocument()
  })

  it('Back to Quotations رابط للعروض', async () => {
    renderPage()
    await screen.findByText('Acme Traffic')
    fireEvent.click(screen.getByText(/Back to Quotations/))
    expect(await screen.findByText('quotations page')).toBeInTheDocument()
  })

  it('التأكيد ينجح ويروح للمتابعة (مع Confirming…)', async () => {
    const d = deferred()
    m.handleConfirmProvider.mockReturnValue(d.promise)
    renderPage()
    await screen.findByText('Acme Traffic')
    fireEvent.click(screen.getByText('Confirm Provider →'))
    expect(await screen.findByText('Confirming…')).toBeDisabled()
    expect(screen.getByText('Cancel')).toBeDisabled()
    await act(async () => { d.resolve({}); await d.promise })
    expect(await screen.findByText('monitoring page')).toBeInTheDocument()
    expect(m.handleConfirmProvider).toHaveBeenCalledWith(m.project, makeQuotation())
  })

  it('فشل التأكيد برسالة', async () => {
    m.handleConfirmProvider.mockRejectedValue(new Error('Already assigned'))
    renderPage()
    await screen.findByText('Acme Traffic')
    fireEvent.click(screen.getByText('Confirm Provider →'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Already assigned')
    expect(screen.getByText('Confirm Provider →')).toBeEnabled()
  })

  it('فشل التأكيد بدون رسالة', async () => {
    m.handleConfirmProvider.mockRejectedValue(new Error(''))
    renderPage()
    await screen.findByText('Acme Traffic')
    fireEvent.click(screen.getByText('Confirm Provider →'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not confirm the provider. Please try again.')
  })
})
