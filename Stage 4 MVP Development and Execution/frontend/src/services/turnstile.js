// True when the Cloudflare Turnstile site key is set on Vercel (VITE_TURNSTILE_SITE_KEY).
export const turnstileOn = Boolean(import.meta.env.VITE_TURNSTILE_SITE_KEY);
