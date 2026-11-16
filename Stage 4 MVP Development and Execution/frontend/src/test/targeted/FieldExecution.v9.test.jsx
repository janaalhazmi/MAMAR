import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor, act } from '@testing-library/react'
import { MemoryRouter, Routes, Route } from 'react-router-dom'
import FieldExecution from '../../pages/FieldWorker/FieldExecution'
import * as svc from '../../services/FieldWorker/FieldWorker'

// ---- stubs للمكوّنات الثقيلة (الخريطة، الطقس، الحضور...) ---------------------
const state = vi.hoisted(() => ({ attendanceChange: null }))

vi.mock('../../components/FieldWorkerShell', async () => {
  const React = await import('react')
  return { default: ({ children }) => React.createElement('div', { 'data-testid': 'shell' }, children) }
})
vi.mock('../../components/MamarMap', async () => {
  const React = await import('react')
  return { default: (p) => React.createElement('div', { 'data-testid': 'map-stub' }, `map ${p.latitude}`) }
})
vi.mock('../../components/WeatherCard', async () => {
  const React = await import('react')
  return { default: () => React.createElement('div', null, 'weather-stub') }
})
vi.mock('../../components/TrafficCard', async () => {
  const React = await import('react')
  return { default: () => React.createElement('div', null, 'traffic-stub') }
})
vi.mock('../../components/SafetyBadge', async () => {
  const React = await import('react')
  return { default: () => React.createElement('span', null, 'badge-stub') }
})
vi.mock('../../components/AttendanceCard', async () => {
  const React = await import('react')
  return {
    default: (p) => {
      state.attendanceChange = p.onChange
      return React.createElement('button', { type: 'button', onClick: () => p.onChange?.() }, 'attendance-stub')
    },
  }
})
vi.mock('../../services/ai', () => ({ useSafetyChecks: () => ({}) }))
vi.mock('../../services/FieldWorker/FieldWorker', () => ({
  SITE_STATUSES: ['On Track', 'Delayed'],
  formatDateRange: () => 'DATE RANGE',
  fileToDataUrl: vi.fn(),
  getFieldExecution: vi.fn(),
  getFieldWorkerDashboard: vi.fn(),
  updateSiteStatus: vi.fn(),
  uploadSitePhotos: vi.fn(),
}))

// ---- بيانات ومساعدات ----------------------------------------------------------
const makeData = (over = {}) => ({
  project: {
    name: 'Road renewal', type: 'Infrastructure', status: 'Active', location: 'Riyadh',
    startDate: '2099-01-01', endDate: '2099-01-10', servicesLabel: 'Signs', progress: 40,
  },
  planned: { latitude: 24.7, longitude: 46.6, workZone: null },
  site: { executionStatus: 'On Track', teamCount: 3, todayCheckIn: '08:00', lastUpdate: '10:00' },
  team: [{ id: 1, name: 'Ali', role: 'Lead', initials: 'AL', tone: 'blue' }],
  moreTeamMembers: 2,
  photos: [{ id: 9, src: 'data:old', caption: 'old photo' }],
  ...over,
})

function renderAt(url = '/field-execution?projectId=5') {
  return render(
    <MemoryRouter initialEntries={[url]}>
      <Routes>
        <Route path="/device-verification" element={<div>device page</div>} />
        <Route path="/field-worker-dashboard" element={<div>dash page</div>} />
        <Route path="*" element={<FieldExecution />} />
      </Routes>
    </MemoryRouter>,
  )
}

const deferred = () => {
  let resolve, reject
  const promise = new Promise((res, rej) => { resolve = res; reject = rej })
  return { promise, resolve, reject }
}

async function loaded(url) {
  const view = renderAt(url)
  await screen.findByText('Road renewal')
  return view
}

const fileInput = () => document.querySelector('input[type="file"]')
const pickFile = (name = 'site photo.png') =>
  fireEvent.change(fileInput(), { target: { files: [new File(['x'], name, { type: 'image/png' })] } })

beforeEach(() => {
  state.attendanceChange = null
  svc.getFieldExecution.mockReset().mockResolvedValue(makeData())
  svc.getFieldWorkerDashboard.mockReset().mockResolvedValue({ activeProjects: [{ id: 11 }], newProject: { id: 12 } })
  svc.updateSiteStatus.mockReset().mockResolvedValue({})
  svc.uploadSitePhotos.mockReset().mockResolvedValue([{ id: 20, src: 'data:new', caption: 'new photo' }])
  svc.fileToDataUrl.mockReset().mockResolvedValue('data:preview')
  Element.prototype.scrollIntoView = vi.fn()
})

describe('FieldExecution - تحميل المشروع', () => {
  it('يحمّل المشروع من projectId ويعرض كل الأقسام', async () => {
    await loaded('/field-execution?projectId=5&code=ABC')
    expect(svc.getFieldExecution).toHaveBeenCalledWith('5')
    expect(screen.getByTestId('map-stub')).toHaveTextContent('map 24.7')
    expect(screen.getByText('Ali')).toBeInTheDocument()
    expect(screen.getByText('+ 2 more team members')).toBeInTheDocument()
    expect(screen.getByAltText('old photo')).toBeInTheDocument()
    expect(screen.getByText('DATE RANGE')).toBeInTheDocument()
    expect(screen.getByText('40%')).toBeInTheDocument()
  })

  it('بدون صور ولا أعضاء إضافيين ولا موقع مخطط', async () => {
    svc.getFieldExecution.mockResolvedValue(makeData({ photos: [], moreTeamMembers: 0, planned: null }))
    await loaded()
    expect(screen.queryByText(/more team members/)).not.toBeInTheDocument()
    expect(screen.queryByAltText('old photo')).not.toBeInTheDocument()
    expect(screen.getByText('Work zone location is not available for this project.')).toBeInTheDocument()
  })

  it('بدون projectId: ياخذ أول مشروع نشط من الداشبورد', async () => {
    await loaded('/field-execution')
    expect(svc.getFieldWorkerDashboard).toHaveBeenCalled()
    expect(svc.getFieldExecution).toHaveBeenCalledWith(11)
  })

  it('بدون projectId وبدون مشاريع نشطة: ياخذ newProject', async () => {
    svc.getFieldWorkerDashboard.mockResolvedValue({ activeProjects: [], newProject: { id: 12 } })
    await loaded('/field-execution')
    expect(svc.getFieldExecution).toHaveBeenCalledWith(12)
  })

  it('بدون أي مشروع: رسالة خطأ ورابط رجوع', async () => {
    svc.getFieldWorkerDashboard.mockResolvedValue({ activeProjects: [] })
    renderAt('/field-execution')
    expect(await screen.findByRole('alert')).toHaveTextContent('You have no assigned project yet.')
    fireEvent.click(screen.getByText(/Back to Dashboard/))
    expect(await screen.findByText('dash page')).toBeInTheDocument()
  })

  it('newProject بدون id يعتبر لا يوجد مشروع', async () => {
    svc.getFieldWorkerDashboard.mockResolvedValue({ activeProjects: [], newProject: null })
    renderAt('/field-execution')
    expect(await screen.findByRole('alert')).toHaveTextContent('You have no assigned project yet.')
  })

  it('فشل التحميل برسالة', async () => {
    svc.getFieldExecution.mockRejectedValue(new Error('Server down'))
    renderAt()
    expect(await screen.findByRole('alert')).toHaveTextContent('Server down')
  })

  it('فشل التحميل بدون رسالة يعرض الرسالة الافتراضية', async () => {
    svc.getFieldExecution.mockRejectedValue(new Error(''))
    renderAt()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not load this project.')
  })

  it('حالة التحميل تظهر "Loading project…"', async () => {
    svc.getFieldExecution.mockReturnValue(new Promise(() => {}))
    renderAt()
    expect(screen.getByText('Loading project…')).toBeInTheDocument()
  })

  it('نتيجة متأخرة بعد إزالة الصفحة تتجاهل (نجاح)', async () => {
    const d = deferred()
    svc.getFieldExecution.mockReturnValue(d.promise)
    const view = renderAt()
    view.unmount()
    await act(async () => { d.resolve(makeData()); await d.promise })
    expect(screen.queryByText('Road renewal')).not.toBeInTheDocument()
  })

  it('نتيجة متأخرة بعد إزالة الصفحة تتجاهل (فشل)', async () => {
    const d = deferred()
    svc.getFieldExecution.mockReturnValue(d.promise)
    const view = renderAt()
    view.unmount()
    await act(async () => { d.reject(new Error('late')); await d.promise.catch(() => {}) })
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('FieldExecution - حالة الموقع والحضور', () => {
  it('تغيير الحالة بنجاح', async () => {
    await loaded()
    fireEvent.click(screen.getByText('Update Status'))
    const select = await screen.findByLabelText('New status')
    fireEvent.change(select, { target: { value: 'Delayed' } })
    await screen.findByText('Status updated.')
    expect(svc.updateSiteStatus).toHaveBeenCalledWith('5', 'Delayed')
    expect(screen.queryByLabelText('New status')).not.toBeInTheDocument()
    expect(screen.getByText('Delayed')).toBeInTheDocument()
  })

  it('زر Update Status يفتح ويقفل الاختيار', async () => {
    await loaded()
    fireEvent.click(screen.getByText('Update Status'))
    expect(screen.getByLabelText('New status')).toBeInTheDocument()
    fireEvent.click(screen.getByText('Update Status'))
    expect(screen.queryByLabelText('New status')).not.toBeInTheDocument()
  })

  it('فشل تغيير الحالة برسالة', async () => {
    svc.updateSiteStatus.mockRejectedValue(new Error('Not allowed'))
    await loaded()
    fireEvent.click(screen.getByText('Update Status'))
    fireEvent.change(await screen.findByLabelText('New status'), { target: { value: 'Delayed' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Not allowed')
  })

  it('فشل تغيير الحالة بدون رسالة', async () => {
    svc.updateSiteStatus.mockRejectedValue(new Error(''))
    await loaded()
    fireEvent.click(screen.getByText('Update Status'))
    fireEvent.change(await screen.findByLabelText('New status'), { target: { value: 'Delayed' } })
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not update the status. Please try again.')
  })

  it('Site Check-in يمرّر الصفحة لبطاقة الحضور', async () => {
    await loaded()
    fireEvent.click(screen.getByText('Site Check-in'))
    expect(Element.prototype.scrollIntoView).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('Verify an installed device يروح لصفحة التحقق', async () => {
    await loaded()
    fireEvent.click(screen.getByText(/Verify an installed device/))
    expect(await screen.findByText('device page')).toBeInTheDocument()
  })

  it('بعد تسجيل الحضور يعيد تحميل المشروع', async () => {
    await loaded()
    svc.getFieldExecution.mockResolvedValueOnce(makeData({ project: { ...makeData().project, name: 'Fresh name' } }))
    fireEvent.click(screen.getByText('attendance-stub'))
    expect(await screen.findByText('Fresh name')).toBeInTheDocument()
  })

  it('فشل إعادة التحميل بعد الحضور يبقي الأرقام القديمة', async () => {
    await loaded()
    svc.getFieldExecution.mockRejectedValueOnce(new Error('offline'))
    fireEvent.click(screen.getByText('attendance-stub'))
    await waitFor(() => expect(svc.getFieldExecution).toHaveBeenCalledTimes(2))
    expect(screen.getByText('Road renewal')).toBeInTheDocument()
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})

describe('FieldExecution - صور الموقع', () => {
  it('زر Add more photos يفتح اختيار الملفات', async () => {
    await loaded()
    const spy = vi.spyOn(fileInput(), 'click').mockImplementation(() => {})
    fireEvent.click(screen.getByText('+ Add more photos').closest('button'))
    expect(spy).toHaveBeenCalled()
  })

  it('اختيار صورة، تغيير مرحلتها، حذفها', async () => {
    await loaded()
    pickFile('site photo.png')
    await screen.findByText('Send Photos (1)')
    expect(screen.getByAltText('site photo')).toBeInTheDocument()

    const stage = screen.getByLabelText('When was site photo taken')
    fireEvent.change(stage, { target: { value: 'after' } })
    expect(stage).toHaveValue('after')

    fireEvent.click(screen.getByLabelText('Remove site photo'))
    await waitFor(() => expect(screen.queryByAltText('site photo')).not.toBeInTheDocument())
    expect(screen.getByText('Send Photos')).toBeDisabled()
  })

  it('تغيير مرحلة صورة لا يغيّر صورة ثانية', async () => {
    await loaded()
    pickFile('a.png')
    await screen.findByText('Send Photos (1)')
    pickFile('b.png')
    await screen.findByText('Send Photos (2)')
    fireEvent.change(screen.getByLabelText('When was a taken'), { target: { value: 'before' } })
    expect(screen.getByLabelText('When was a taken')).toHaveValue('before')
    expect(screen.getByLabelText('When was b taken')).toHaveValue('during')
    fireEvent.click(screen.getByLabelText('Remove a'))
    await waitFor(() => expect(screen.queryByAltText('a')).not.toBeInTheDocument())
    expect(screen.getByAltText('b')).toBeInTheDocument()
  })

  it('اختيار بدون ملفات أو files = null لا يسوي شي', async () => {
    await loaded()
    fireEvent.change(fileInput(), { target: { files: [] } })
    Object.defineProperty(fileInput(), 'files', { value: null, configurable: true })
    fireEvent.change(fileInput())
    expect(screen.getByText('Send Photos')).toBeDisabled()
    expect(svc.fileToDataUrl).not.toHaveBeenCalled()
  })

  it('فشل قراءة الصورة برسالة', async () => {
    svc.fileToDataUrl.mockRejectedValue(new Error('Corrupt image'))
    await loaded()
    pickFile()
    expect(await screen.findByRole('alert')).toHaveTextContent('Corrupt image')
  })

  it('فشل قراءة الصورة بدون رسالة', async () => {
    svc.fileToDataUrl.mockRejectedValue(new Error(''))
    await loaded()
    pickFile()
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not read the photo.')
  })

  it('إرسال الصور بنجاح (مع حالة Sending…)', async () => {
    const d = deferred()
    svc.uploadSitePhotos.mockReturnValue(d.promise)
    await loaded()
    pickFile()
    fireEvent.click(await screen.findByText('Send Photos (1)'))
    expect(await screen.findByText('Sending…')).toBeInTheDocument()
    await act(async () => { d.resolve([{ id: 20, src: 'data:new', caption: 'new photo' }]); await d.promise })
    expect(await screen.findByText(/Photos sent/)).toBeInTheDocument()
    expect(screen.getByAltText('new photo')).toBeInTheDocument()
    expect(svc.uploadSitePhotos).toHaveBeenCalledWith('5', expect.any(Array))
    expect(screen.getByText('Send Photos')).toBeDisabled()
  })

  it('فشل إرسال الصور برسالة', async () => {
    svc.uploadSitePhotos.mockRejectedValue(new Error('Quota exceeded'))
    await loaded()
    pickFile()
    fireEvent.click(await screen.findByText('Send Photos (1)'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Quota exceeded')
  })

  it('فشل إرسال الصور بدون رسالة', async () => {
    svc.uploadSitePhotos.mockRejectedValue(new Error(''))
    await loaded()
    pickFile()
    fireEvent.click(await screen.findByText('Send Photos (1)'))
    expect(await screen.findByRole('alert')).toHaveTextContent('Could not send the photos. Please try again.')
  })
})
