import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, act } from '@testing-library/react'
import AiTrafficPlan from '../../components/AiTrafficPlan'

const m = vi.hoisted(() => ({ getSession: vi.fn(), postTrafficPlan: vi.fn(), aiOn: false }))
vi.mock('../../services/auth', () => ({ getSession: (...a) => m.getSession(...a) }))
vi.mock('../../services/api', () => ({ postTrafficPlan: (...a) => m.postTrafficPlan(...a) }))
vi.mock('../../services/ai', () => ({ useAiEnabled: () => m.aiOn }))

const makePlan = (over = {}) => ({
  closure: 'Lane closure',
  total_length_m: 300,
  zones: [
    { name: 'Advance warning', length_m: 100, detail: 'detail one' },
    { name: 'Taper', length_m: 50, detail: 'detail two' },
  ],
  devices: [{ name: 'Cone', qty: 10, why: 'guides traffic' }],
  explanation: { summary: 'Summary text', steps: ['Step one'], risks: ['Risk one'] },
  notes: ['Note one'],
  ...over,
})
const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}
const openForm = () => fireEvent.click(screen.getByText('Plan it'))
const submit = async () => {
  await act(async () => { fireEvent.click(screen.getByText('Get the plan')) })
}

beforeEach(() => {
  m.aiOn = false
  m.getSession.mockReset().mockReturnValue({ access_token: 'tok' })
  m.postTrafficPlan.mockReset().mockResolvedValue(makePlan())
})

describe('AiTrafficPlan', () => {
  it('يفتح ويقفل النموذج', () => {
    render(<AiTrafficPlan />)
    expect(screen.queryByLabelText('Closure type')).not.toBeInTheDocument()
    openForm()
    expect(screen.getByLabelText('Closure type')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Hide'))
    expect(screen.queryByLabelText('Closure type')).not.toBeInTheDocument()
  })

  it('يرسل قيم النموذج بعد تعديلها (select, number, checkbox)', async () => {
    render(<AiTrafficPlan startDate="2099-01-01" endDate="2099-01-03" />)
    openForm()
    fireEvent.change(screen.getByLabelText('Closure type'), { target: { value: 'full_closure' } })
    fireEvent.change(screen.getByLabelText('Road speed (km/h)'), { target: { value: '100' } })
    fireEvent.change(screen.getByLabelText('Lanes in one direction'), { target: { value: '4' } })
    fireEvent.change(screen.getByLabelText('Lanes closed'), { target: { value: '2' } })
    fireEvent.change(screen.getByLabelText('Work area length (m)'), { target: { value: '250' } })
    fireEvent.click(screen.getByLabelText('Night work'))
    await submit()
    expect(m.postTrafficPlan).toHaveBeenCalledWith('tok', {
      closure_type: 'full_closure', speed_kmh: 100, lanes_total: 4, lanes_closed: 2,
      work_length_m: 250, night_work: true, duration_days: 3,
    })
  })

  it('مدة المشروع: بدون تواريخ 3 أيام، وتاريخ نهاية قبل البداية يعطي يوم', async () => {
    const { unmount } = render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(m.postTrafficPlan.mock.calls[0][1].duration_days).toBe(3)
    unmount()

    render(<AiTrafficPlan startDate="2099-01-10" endDate="2099-01-01" />)
    openForm()
    await submit()
    expect(m.postTrafficPlan.mock.calls[1][1].duration_days).toBe(1)
  })

  it('يعرض الخطة كاملة بدون AI (بدون ✨)', async () => {
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(screen.getByText('300 m total')).toBeInTheDocument()
    expect(screen.getByText('Advance warning')).toBeInTheDocument()
    expect(screen.getByText('detail two')).toBeInTheDocument()
    expect(screen.getByText('Cone')).toBeInTheDocument()
    expect(screen.getByText('guides traffic')).toBeInTheDocument()
    expect(screen.getByText('Summary text')).toBeInTheDocument()
    expect(screen.getByText('Step one')).toBeInTheDocument()
    expect(screen.getByText('Risk one')).toBeInTheDocument()
    expect(screen.getByText('Note one')).toBeInTheDocument()
    expect(screen.getByText('How it looks on the road')).toBeInTheDocument()
  })

  it('مع AI مفعّل يظهر ✨ في عنوان الشرح', async () => {
    m.aiOn = true
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(screen.getByText('✨ How it looks on the road')).toBeInTheDocument()
  })

  it('شرح بدون خطوات ولا مخاطر، وبدون ملاحظات', async () => {
    m.postTrafficPlan.mockResolvedValue(makePlan({ explanation: { summary: 'Only summary', steps: [], risks: [] }, notes: [] }))
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(screen.getByText('Only summary')).toBeInTheDocument()
    expect(screen.queryByText('Set-up order')).not.toBeInTheDocument()
    expect(screen.queryByText('Watch out for')).not.toBeInTheDocument()
    expect(screen.queryByText('Note one')).not.toBeInTheDocument()
  })

  it('بدون شرح (explanation) ما يظهر القسم', async () => {
    m.postTrafficPlan.mockResolvedValue(makePlan({ explanation: null }))
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(screen.queryByText('How it looks on the road')).not.toBeInTheDocument()
  })

  it('الخطة تختفي لما يقفل النموذج', async () => {
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    fireEvent.click(screen.getByText('Hide'))
    expect(screen.queryByText('300 m total')).not.toBeInTheDocument()
  })

  it('حالة Planning… أثناء الطلب', async () => {
    const d = deferred()
    m.postTrafficPlan.mockReturnValue(d.promise)
    render(<AiTrafficPlan />)
    openForm()
    fireEvent.click(screen.getByText('Get the plan'))
    expect(await screen.findByText('Planning…')).toBeDisabled()
    await act(async () => { d.resolve(makePlan()); await d.promise })
    expect(screen.getByText('Get the plan')).toBeEnabled()
  })

  it('فشل الطلب يعرض الخطأ', async () => {
    m.postTrafficPlan.mockRejectedValue(new Error('Plan failed'))
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(screen.getByRole('alert')).toHaveTextContent('Plan failed')
  })

  it('بدون جلسة يمرّر undefined كتوكن', async () => {
    m.getSession.mockReturnValue(null)
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(m.postTrafficPlan.mock.calls[0][0]).toBeUndefined()
  })

  it('Add to project description يستدعي onUse ويتعطل', async () => {
    const onUse = vi.fn()
    render(<AiTrafficPlan onUse={onUse} />)
    openForm()
    await submit()
    fireEvent.click(screen.getByText('Add to project description'))
    expect(onUse).toHaveBeenCalledWith(
      'Traffic plan (Lane closure, 80 km/h): Advance warning 100 m, Taper 50 m. Total 300 m. Devices: 10 x Cone.',
    )
    expect(screen.getByText('Added to the description ✓')).toBeDisabled()
    await submit()
    expect(screen.getByText('Add to project description')).toBeEnabled()
  })

  it('بدون onUse ما يظهر زر الإضافة', async () => {
    render(<AiTrafficPlan />)
    openForm()
    await submit()
    expect(screen.queryByText('Add to project description')).not.toBeInTheDocument()
  })
})
