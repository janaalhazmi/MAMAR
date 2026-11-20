import { useCallback, useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchProjectAttendance } from "../services/api";
import { clock as time, hours, shortDay as day } from "../services/attendance";
import "../styles/tools.css";

// Who of the field team is at the work zone now, and their visits (from the site QR check-ins).
export default function TeamOnSiteCard({ projectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  const load = useCallback(() => {
    const token = getSession()?.access_token;
    if (!projectId || !token) return;
    fetchProjectAttendance(token, projectId)
      .then((result) => { setData(result); setError(""); })
      .catch((err) => setError(err.message));
  }, [projectId]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 30 * 1000);
    return () => { clearTimeout(first); clearInterval(timer); };
  }, [load]);

  if (!projectId) return null;

  return (
    <section className="tl-card" aria-label="Field team on site">
      <div className="tl-head">
        <div>
          <h2>Field Team on Site</h2>
          <p>From the site QR check-ins. Updates every 30 seconds.</p>
        </div>
        {data && (
          <span className={`tl-badge ${data.on_site_now ? "ok" : ""}`}>
            {data.on_site_now ? `${data.on_site_now} on site now` : "Nobody on site now"}
          </span>
        )}
      </div>
      {error && <p className="tl-empty">{error}</p>}
      {!data && !error && <p className="tl-empty">Loading…</p>}
      {data && data.workers.length === 0 && <p className="tl-empty">No check-ins yet.</p>}
      {data && data.workers.length > 0 && (
        <>
          <ul className="att-team">
            {data.workers.map((worker) => (
              <li key={worker.worker_id}>
                <i className={worker.on_site ? "on" : ""} aria-hidden="true" />
                <strong>{worker.worker_name}</strong>
                <span>{worker.on_site ? `On site since ${time(worker.since)}` : "Not on site"}</span>
                <small>{hours(worker.total_minutes)} · {worker.visits} visit{worker.visits > 1 ? "s" : ""}</small>
              </li>
            ))}
          </ul>
          <details className="att-log">
            <summary>All visits ({data.visits.length})</summary>
            <table>
              <thead><tr><th>Worker</th><th>Day</th><th>In</th><th>Out</th><th>Time</th></tr></thead>
              <tbody>
                {data.visits.map((visit) => (
                  <tr key={visit.attendance_id}>
                    <td>{visit.worker_name}</td>
                    <td>{day(visit.check_in_at)}</td>
                    <td>{time(visit.check_in_at)}</td>
                    <td>{visit.check_out_at ? time(visit.check_out_at) : "On site"}</td>
                    <td>{hours(visit.minutes)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </details>
        </>
      )}
    </section>
  );
}
