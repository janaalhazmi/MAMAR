import { useCallback, useEffect, useState } from "react";
import { API_BASE_URL, fetchAdminServices } from "../../services/api";
import "../../styles/tools.css";

// System status for the admin: is the API up (the same /health that UptimeRobot checks every
// 5 minutes) and which outside services are switched on.
export default function AdminServices({ token }) {
  const [services, setServices] = useState([]);
  const [health, setHealth] = useState(null);
  const [error, setError] = useState("");

  const check = useCallback(async () => {
    const started = performance.now();
    try {
      const response = await fetch(`${API_BASE_URL}/health`);
      const body = await response.json().catch(() => ({}));
      setHealth({ ok: response.ok, ms: Math.round(performance.now() - started), db: body.database, at: new Date() });
    } catch {
      setHealth({ ok: false, ms: null, db: null, at: new Date() });
    }
  }, []);

  useEffect(() => {
    let active = true;
    fetchAdminServices(token)
      .then((rows) => { if (active) setServices(rows); })
      .catch((err) => { if (active) setError(err.message); });
    const first = setTimeout(check, 0);
    const timer = setInterval(check, 60 * 1000);
    return () => { active = false; clearTimeout(first); clearInterval(timer); };
  }, [token, check]);

  const on = services.filter((service) => service.on).length;

  return (
    <section className="adm-card">
      <div className="tl-head">
        <div>
          <h2>System Status</h2>
          <p>The API is also watched by UptimeRobot every 5 minutes, with an email if it goes down.</p>
        </div>
        {health && (
          <span className={`tl-badge ${health.ok ? "ok" : "bad"}`}>
            {health.ok ? `API up · ${health.ms} ms` : "API not reachable"}
          </span>
        )}
      </div>
      {error && <p className="adm-error" role="alert">{error}</p>}
      {health && (
        <p className="svc-line">
          Database: <b>{health.db === "connected" ? "connected" : "not connected"}</b> · Checked at{" "}
          {health.at.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
          <button type="button" className="adm-ghost" onClick={check}>Check now</button>
        </p>
      )}
      {services.length > 0 && (
        <>
          <p className="svc-line">{on} of {services.length} services on</p>
          <ul className="svc-grid">
            {services.map((service) => (
              <li key={service.name} className={service.on ? "on" : ""}>
                <i aria-hidden="true" />
                <div>
                  <b>{service.name}</b>
                  <span>{service.what}</span>
                  {!service.on && <small>Turn on with {service.setting} on Render</small>}
                </div>
              </li>
            ))}
          </ul>
        </>
      )}
    </section>
  );
}
