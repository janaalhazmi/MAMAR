import { vi } from 'vitest'
import { defineUiSuite } from './ui-suite'

// ArcGIS يحتاج WebGL؛ نستبدله بمكوّن فاضي (الملفان مستثنيان من الـ coverage).
vi.mock('../../components/MamarMap', async () => ({ default: (await import('./map-mock')).MockMap }))
vi.mock('../../components/AdminMap', () => ({ default: () => null }))

defineUiSuite('pages/Contractor', {
  ...import.meta.glob('../../pages/Contractor/**/*.jsx'),
})
