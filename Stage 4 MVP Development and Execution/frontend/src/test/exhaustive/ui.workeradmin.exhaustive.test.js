import { vi } from 'vitest'
import { defineUiSuite } from './ui-suite'

// ArcGIS يحتاج WebGL؛ نستبدله بمكوّن فاضي (الملفان مستثنيان من الـ coverage).
vi.mock('../../components/MamarMap', async () => ({ default: (await import('./map-mock')).MockMap }))
vi.mock('../../components/AdminMap', () => ({ default: () => null }))

defineUiSuite('pages/FieldWorker + Admin', {
  ...import.meta.glob('../../pages/FieldWorker/**/*.jsx'),
  ...import.meta.glob('../../pages/Admin/**/*.jsx'),
})
