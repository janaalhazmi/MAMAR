import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import "./style.css";
import "./styles/Weblogin/data-disclaimer.css";
// Loaded last on purpose: site-wide spacing and phone fixes on top of every page style.
import "./styles/polish.css";
createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
);

// PWA: the site can be installed on the phone home screen (only in the built site, not in dev).
if (import.meta.env.PROD && "serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("/sw.js").catch(() => {});
  });
}
