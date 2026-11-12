import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App.jsx";
import { loadSessionFromOtherTabs } from "./services/auth";
import "./style.css";
import "./styles/Contractor/data-disclaimer.css";
// A new tab first takes the login from an open tab, then shows the page.
loadSessionFromOtherTabs().then(() => createRoot(document.getElementById("root")).render(
  <StrictMode>
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </StrictMode>
));
