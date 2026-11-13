import { useEffect, useRef } from "react";

// Cloudflare Turnstile: the "I am not a robot" check. It shows only when VITE_TURNSTILE_SITE_KEY
// is set on Vercel; the backend checks the token with TURNSTILE_SECRET_KEY on Render.
const SITE_KEY = import.meta.env.VITE_TURNSTILE_SITE_KEY;

let scriptPromise = null;

function loadScript() {
  if (window.turnstile) return Promise.resolve();
  if (!scriptPromise) {
    scriptPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
      script.async = true;
      script.onload = resolve;
      script.onerror = () => {
        scriptPromise = null;
        reject(new Error("Turnstile could not load"));
      };
      document.head.appendChild(script);
    });
  }
  return scriptPromise;
}

// onToken gets the token ("" when it expires). Change resetKey to get a new token
// after a failed try, because one token works only once.
export default function Turnstile({ onToken, resetKey = 0 }) {
  const box = useRef(null);
  const widget = useRef(null);
  const tokenCallback = useRef(onToken);

  useEffect(() => {
    tokenCallback.current = onToken;
  }, [onToken]);

  useEffect(() => {
    if (!SITE_KEY) return undefined;
    let gone = false;
    loadScript()
      .then(() => {
        if (gone || !box.current) return;
        widget.current = window.turnstile.render(box.current, {
          sitekey: SITE_KEY,
          callback: (token) => tokenCallback.current(token),
          "expired-callback": () => tokenCallback.current(""),
          "error-callback": () => tokenCallback.current(""),
        });
      })
      .catch(() => tokenCallback.current(""));
    return () => {
      gone = true;
      if (widget.current !== null) window.turnstile?.remove(widget.current);
      widget.current = null;
    };
  }, []);

  useEffect(() => {
    if (resetKey && widget.current !== null) {
      window.turnstile?.reset(widget.current);
      tokenCallback.current("");
    }
  }, [resetKey]);

  if (!SITE_KEY) return null;
  return <div ref={box} className="turnstile-box" />;
}
