# دليل اختبارات MAMAR Frontend

هذا الملف يشرح ملفات الاختبارات الموجودة في المشروع كما هي في النسخة المرفقة. عدد ملفات الاختبار: **55**.

## تشغيل الاختبارات

```bash
npm ci
npm test
```

## إنشاء تقرير التغطية

```bash
npm run test:coverage
```

بعد انتهاء الأمر، يُنشأ تقرير HTML داخل `coverage/`، ويفتح في متصفح macOS بهذا الأمر:

```bash
open coverage/index.html
```

أو تشغيل التغطية وفتح التقرير مباشرة بعد نجاحها:

```bash
npm run test:coverage && open coverage/index.html
```

## الملفات الاختبارية الموجودة

### مكونات الواجهة

- `src/components/__tests__/ai-attendance-turnstile.coverage.test.jsx` — اختبارات مكونات الذكاء الاصطناعي والملخص اليومي والحضور وTurnstile، بما فيها التحميل والأخطاء والتحديث والتحقق من الجلسة.
- `src/components/__tests__/interactive-components-complete.test.jsx` — اختبارات المكونات التفاعلية المشتركة: الأزرار والروابط والتقييمات وشارات السلامة ومراجعات المزود والتنقل.
- `src/components/__tests__/primitives.test.jsx` — اختبارات العناصر الأساسية Button وStars وSafetyBadge وحالاتها المختلفة.
- `src/components/__tests__/protected-route.test.jsx` — اختبارات حماية المسارات حسب وجود الجلسة وصلاحية الدور.

### خدمات المقاول

- `src/services/Contractor/__tests__/contractor-domain.test.js` — اختبارات منطق وخدمات المقاول الأساسية.
- `src/services/Contractor/__tests__/profileUtils.test.js` — اختبارات أدوات تجهيز وتطبيع بيانات ملف المقاول.

### خدمات العامل الميداني

- `src/services/FieldWorker/__tests__/fieldworker-domain.test.js` — اختبارات منطق وخدمات العامل الميداني.

### الخدمات العامة

- `src/services/__tests__/api-contracts-complete.test.js` — اختبارات عقود نقاط API، وطريقة إرسال البيانات والمعاملات الاختيارية.
- `src/services/__tests__/api.test.js` — اختبارات خدمة API العامة: تسجيل الدخول، فحص الصحة، الأخطاء وفشل الاتصال.
- `src/services/__tests__/attendance.test.js` — اختبارات تنسيق وتحليل أوقات وسجلات الحضور.
- `src/services/__tests__/auth-guards.test.js` — اختبارات حراسة الجلسة وقراءة التخزين وتنظيفه وأحداث تسجيل الخروج.
- `src/services/__tests__/auth.test.js` — اختبارات المصادقة والجلسات وJWT والتحقق من المستخدم والتعامل مع انتهاء الصلاحية والشبكة.
- `src/services/__tests__/contractor-payments-api.test.js` — اختبارات واجهات مدفوعات المقاول وPayPal وحالات إتمام أو إلغاء الدفع.
- `src/services/__tests__/contractor-profile-api.test.js` — اختبارات API ملف المقاول وتحديث البيانات وكلمة المرور والصورة.
- `src/services/__tests__/coverage-expansion.test.js` — اختبارات موسعة لخدمات وتدفقات المقاول والعامل الميداني والتنسيقات والتخزين.
- `src/services/__tests__/fieldWork.test.js` — اختبارات أدوات العمل الميداني والمسافات والإحداثيات ونطاق العمل وأخطاء تحديد الموقع.
- `src/services/__tests__/notifications-api.test.js` — اختبارات API الإشعارات وجلبها وتحديث حالة القراءة.
- `src/services/__tests__/notifications-storage.test.js` — اختبارات تدفق الإشعارات المرتبط بالجلسة والتخزين وطلبات القراءة.
- `src/services/__tests__/notifications.test.js` — اختبارات خدمة الإشعارات الأساسية.
- `src/services/__tests__/payments.test.js` — اختبارات دوال الدفع المساعدة وبيانات الدفع المعلقة والتقاط/إلغاء الطلب.
- `src/services/__tests__/profileService.test.js` — اختبارات خدمة ملف المقاول وتعديل البيانات وكلمة المرور والصورة.
- `src/services/__tests__/project-flow-domain.test.js` — اختبارات منطق تدفق المشروع والتواريخ والصور واختيار المزودين والعروض.
- `src/services/__tests__/projectFlow.test.js` — اختبارات تنسيقات وتخزين تدفق المشروع ومبالغ SAR والتواريخ والصور.
- `src/services/__tests__/projects-coverage.test.js` — اختبارات موسعة لخدمة المشاريع والتخزين والتحويلات وتحديث حالة المشروع.
- `src/services/__tests__/projects.test.js` — اختبارات أدوات المشاريع والإحداثيات والإحصائيات والأنشطة والبيانات الوصفية.
- `src/services/__tests__/weather.test.js` — اختبارات خدمة الطقس والنصائح الآمنة وأخطاء الشبكة والاستجابة.

### خدمات المزود

- `src/services/providers/__tests__/provider-api-coverage.test.js` — اختبارات hooks وإجراءات المزود ولوحة التحكم وطلبات العروض والمشاريع والتحقق.
- `src/services/providers/__tests__/provider-flow.test.js` — اختبارات تدفق عمل المزود.
- `src/services/providers/__tests__/provider-quotes-complete.test.js` — اختبارات خدمة عروض أسعار المزود.

### اختبارات التطبيق والواجهات

- `src/test/all-modules.smoke.test.jsx` — اختبار دخاني لتحميل التطبيق والمسارات الرئيسية.
- `src/test/coverage-final/app-execution-notice.v10.test.jsx` — اختبار تنبيه مسار تنفيذ قديم وتحويل المستخدم إلى صفحة مشاريع المزود.
- `src/test/coverage-final/auth-branches.v10.test.js` — اختبارات فروع إضافية للمصادقة وتخزين الحساب والتحقق من الجلسة والتحديث.
- `src/test/coverage-final/contractor-providers-quotations.v10.test.jsx` — اختبارات صفحات مزودي المقاول وعروض الأسعار: البحث والاختيار والإرسال والتصفية والمقارنة والقبول والرفض.
- `src/test/coverage-final/fieldwork-service.v10.test.js` — اختبارات تدفقات خدمة العامل الميداني والمشاريع والموقع والصور والجهاز والتحقق.
- `src/test/coverage-final/live-cards-and-small-components.v10.test.jsx` — اختبارات بطاقات الفريق بالموقع والمرور والطقس وQR وحالات التحميل والأخطاء والبيانات الفارغة.
- `src/test/coverage-final/provider-device-team.v10.test.jsx` — اختبارات التحقق من أجهزة المزود وإدارة فريق العمل والبحث والتصفية وحالات القائمة.
- `src/test/coverage-final/provider-quotation-execution.v10.test.jsx` — اختبارات إعداد عرض السعر وتعديله وحفظه وإرساله ورفضه وتفاصيل التنفيذ ومراجعة الإكمال.
- `src/test/coverage-final/ratings-hook.v10.test.jsx` — اختبارات hook تقييمات المزود وربط التقييمات بالمعرف والاسم والتعامل مع النتائج المتأخرة.
- `src/test/coverage-final/shells.v10.test.jsx` — اختبارات أغلفة صفحات المقاول والعامل الميداني: الهوية والتنقل والصورة والإشعارات وتسجيل الخروج.
- `src/test/exhaustive/app.exhaustive.test.js` — اختبارات شاملة لتوجيه التطبيق وProtectedRoute.
- `src/test/exhaustive/main.exhaustive.test.js` — اختبارات نقطة تشغيل التطبيق وتسجيل Service Worker في وضع الإنتاج.
- `src/test/exhaustive/services.exhaustive.test.js` — اختبارات شاملة للدوال المصدّرة من طبقة الخدمات.
- `src/test/exhaustive/ui.components.exhaustive.test.js` — اختبارات واجهة المكونات المشتركة ضمن مجموعة الاختبارات الشاملة.
- `src/test/exhaustive/ui.contractor.exhaustive.test.js` — اختبارات واجهات وتدفقات صفحات المقاول ضمن المجموعة الشاملة.
- `src/test/exhaustive/ui.providers.exhaustive.test.js` — اختبارات واجهات وتدفقات صفحات المزود ضمن المجموعة الشاملة.
- `src/test/exhaustive/ui.weblogin.exhaustive.test.js` — اختبارات واجهات تسجيل الدخول والتسجيل والتحقق ضمن المجموعة الشاملة.
- `src/test/exhaustive/ui.workeradmin.exhaustive.test.js` — اختبارات واجهات العامل الميداني والإدارة ضمن المجموعة الشاملة.
- `src/test/targeted/AiTrafficPlan.v9.test.jsx` — اختبارات نموذج خطة المرور والحقول والحالات والشرح المدعوم بالذكاء الاصطناعي.
- `src/test/targeted/FieldExecution.v9.test.jsx` — اختبارات تحميل صفحة تنفيذ العامل الميداني وحالات المشروع والصور والأعضاء والأخطاء.
- `src/test/targeted/NotificationBell.v9.test.jsx` — اختبارات جرس الإشعارات والتحديث الدوري والصوت والتنظيف عند إلغاء تحميل المكون.
- `src/test/targeted/PhoneAlertsCard.v9.test.jsx` — اختبارات بطاقة تنبيهات الهاتف وقنوات WhatsApp وSMS وإرسال الرسائل التجريبية.
- `src/test/targeted/RegisterVerificationPage.v9.test.jsx` — اختبارات حماية صفحة توثيق التسجيل وإنشاء الحساب والتحقق من الرمز وTurnstile.
- `src/test/targeted/SelectProviderPage.v9.test.jsx` — اختبارات صفحة اختيار المزود وتأكيد الاختيار والعودة للعروض وحالات الفشل.
- `src/test/targeted/WorkerVerificationPage.v9.test.jsx` — اختبارات حماية صفحة توثيق العامل وإنشاء الحساب والتحقق من الرمز وTurnstile.
- `src/test/targeted/ai.v9.test.jsx` — اختبارات تفعيل ميزات الذكاء الاصطناعي وفحوصات السلامة وسلوك الجلسة والنتائج المتأخرة.

## ملاحظات

- إعداد Vitest موجود في `vite.config.js` ويستخدم بيئة `jsdom` وملف التهيئة `src/test/setup.js`.
- التغطية تستخدم V8 وتنتج تقارير HTML وLCOV وJSON داخل مجلد `coverage/`.
- مجلد `node_modules` ومخرجات البناء `dist` وتقارير التغطية القديمة لم تُضمّن في الحزمة لتقليل حجمها؛ أعد تثبيت الحزم باستخدام `npm ci` ثم أنشئ تقريرًا جديدًا.
- هذا الدليل يشرح نطاق الاختبارات بحسب أسماء الملفات والحالات المكتوبة داخلها؛ لا يعني وجود الاختبار وحده أن كل اختبار ناجح أو أن التغطية 100%.
