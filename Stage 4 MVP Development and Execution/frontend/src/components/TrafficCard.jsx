import { useCallback, useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchProjectTraffic } from "../services/api";
import "../styles/tools.css";

const TONE = { Light: "ok", Moderate: "mid", Heavy: "bad", Closed: "bad", Unknown: "" };

// Live traffic on the road at the work zone (TomTom through our backend): the speed now vs. an
// empty road, the delay, and what the traffic control team should do about it.
export default function TrafficCard({ projectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [off, setOff] = useState(false);
  const [checkedAt, setCheckedAt] = useState(null);

  const load = useCallback(() => {
    const token = getSession()?.access_token;
    if (!projectId || !token) return Promise.resolve();
    return fetchProjectTraffic(token, projectId)
      .then((result) => { setData(result); setError(""); setOff(false); setCheckedAt(new Date()); })
      .catch((err) => { if (err.status === 503) setOff(true); else setError(err.message); });
  }, [projectId]);

  useEffect(() => {
    let active = true;
    const run = () => { if (active) load(); };
    const first = setTimeout(run, 0);
    const timer = setInterval(run, 5 * 60 * 1000); // the backend caches 5 minutes
    return () => { active = false; clearTimeout(first); clearInterval(timer); };
  }, [load]);

  if (!projectId) return null;

  return (
    <section className="tl-card" aria-label="Live traffic at the work zone">
      <div className="tl-head">
        <div>
          <h2>Live Traffic at the Work Zone</h2>
          <p>{data?.location || "Road speed right now compared with an empty road"}</p>
        </div>
        {data && <span className={`tl-badge ${TONE[data.level] || ""}`}>{data.level} traffic</span>}
      </div>

      {off && <p className="tl-empty">Live traffic is not switched on yet. It starts when the TomTom key is added on the server.</p>}
      {error && <p className="tl-empty">{error}</p>}
      {!data && !error && !off && <p className="tl-empty">Checking the traffic…</p>}

      {data && (
        <>
          <div className="tl-meter" aria-label={`Congestion ${data.congestion}%`}>
            <span className={TONE[data.level] || ""} style={{ width: `${Math.max(4, data.congestion)}%` }} />
          </div>
          <div className="tl-stats">
            <div><strong>{data.current_speed_kmh ?? "–"}</strong><small>km/h now</small></div>
            <div><strong>{data.free_flow_speed_kmh ?? "–"}</strong><small>km/h empty road</small></div>
            <div><strong>{data.congestion}%</strong><small>slower</small></div>
            <div>
              <strong>{data.delay_seconds != null ? `+${Math.round(data.delay_seconds / 60)} min` : "–"}</strong>
              <small>delay on this stretch</small>
            </div>
          </div>
          <p className={`tl-advice ${TONE[data.level] || ""}`}>{data.advice}</p>
          <p className="tl-source">
            Source: TomTom{checkedAt ? ` · updated ${checkedAt.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}` : ""}
            <button type="button" onClick={load}>Refresh</button>
          </p>
        </>
      )}
    </section>
  );
}
