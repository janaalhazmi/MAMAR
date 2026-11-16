import react from '@vitejs/plugin-react'
import { defineConfig } from 'vitest/config'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.js'],
    globals: true,
    css: true,
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 20000,
    // لا نتجاهل الرفض غير المعالج: أي خطأ async حقيقي يجب أن يظهر.
    coverage: {
      provider: 'v8',
      reporter: ['text-summary', 'html', 'lcov', 'json', 'json-summary'],
      reportsDirectory: './coverage',
      include: ['src/**/*.{js,jsx}'],
      exclude: [
        'src/test/**',
        'src/**/__tests__/**',
        'src/**/*.test.{js,jsx}',
        'src/**/*.css',
        'src/**/*.svg',
        'src/**/*.png',
        'src/**/*.jpg',
        // خرائط ArcGIS تحتاج WebGL حقيقي ومتصفح؛ ما تشتغل داخل jsdom.
        'src/components/MamarMap.jsx',
        'src/components/AdminMap.jsx',
        // ملف فاضي (0 أسطر).
        'src/components/field-worker/FieldWorkerSidebar.jsx',
      ],
      // لا نفرض 100% كـ threshold أثناء بناء الاختبارات؛ نعرض الفجوات بتقرير مستقل.
    },
  },
})
