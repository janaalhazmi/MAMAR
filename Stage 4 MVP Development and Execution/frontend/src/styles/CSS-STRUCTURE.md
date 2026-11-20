# CSS organization

The former `src/style.css` was split into smaller files. Import order is controlled by
`src/styles/index.css`; keep the responsive file after page files.

## Shared styles
- `styles/shared/base.css` — reset, shared branding, contractor shell/sidebar, map primitives.
- `styles/shared/mobile-responsive.css` — cross-page mobile and iOS overrides.
- `styles/polish.css` — final site-wide visual adjustments (loaded after `index.css`).

## Page styles
- `styles/pages/LandingPage.css` — landing page.
- `styles/pages/LoginPage.css` — login.
- `styles/pages/RegisterPage.css` — registration.
- `styles/pages/VerificationPages.css` — registration and worker verification.
- `styles/pages/ProjectLocationFlow.css` — legacy project-location flow.
- `styles/pages/ReviewPage.css` — contractor review page.
- `styles/pages/QuotationFlow.css` — quotation flow.
- `styles/pages/HelpSupportPage.css` — help and support.
- `styles/pages/ProviderPages.css` — provider-facing pages and shared provider project details.
- `styles/pages/FieldWorkerPages.css` — field-worker pages.

Existing page/component CSS files remain in their current folders and are imported by their
corresponding page or component, for example `Contractor/myproject.css`, `Contractor/location.css`,
`Weblogin/payment.css`, and `Weblogin/notification.css`.

`styles/index.css` is only an import manifest; do not put page-specific rules there.
