import { useCallback, useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchProjectWeather } from "../services/api";
import { todayWeather } from "../services/weather";
import "../styles/weather.css";

const ICONS = { Clear: "☀️", "Mostly clear": "🌤️", "Partly cloudy": "⛅", Cloudy: "☁️", Fog: "🌫️", Rain: "🌧️", Snow: "❄️", Thunderstorm: "⛈️" };
const NIGHT = { Clear: "🌙", "Mostly clear": "🌙" };
const BADGE = { ok: "Safe to work", mid: "Take care", bad: "Weather alert" };

const time = (iso) => (iso ? new Date(iso).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" }) : "–");
const round = (value) => (value == null ? "–" : Math.round(value));

// Today's weather at the work zone, with what it means for the road work.
export default function WeatherCard({ projectId }) {
  const [place, setPlace] = useState(null);
  const [today, setToday] = useState(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const token = getSession()?.access_token;
    if (!projectId || !token) return;
    setBusy(true);
    try {
      const where = place || (await fetchProjectWeather(token, projectId));
      setPlace(where);
      setToday(await todayWeather(where.latitude, where.longitude));
      setError("");
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  }, [projectId, place]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    const timer = setInterval(load, 30 * 60 * 1000);
    return () => { clearTimeout(first); clearInterval(timer); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [projectId]);

  if (!projectId) return null;

  const tone = today ? (today.advice.some(([t]) => t === "bad") ? "bad" : today.advice.some(([t]) => t === "mid") ? "mid" : "ok") : "";
  const icon = today ? ((!today.isDay && NIGHT[today.summary]) || ICONS[today.summary] || "🌡️") : "";
  const dateLabel = new Date().toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long" });

  return (
    <section className="wx-card" aria-label="Today's weather at the work zone">
      <div className="wx-head">
        <div>
          <h2>Today&apos;s Weather</h2>
          <p>{dateLabel}{place?.location ? ` · ${place.location}` : ""}</p>
        </div>
        {today && <span className={`wx-badge ${tone}`}>{BADGE[tone]}</span>}
      </div>

      {error && <p className="wx-empty">{error}</p>}
      {!today && !error && <p className="wx-empty">Loading today&apos;s weather…</p>}

      {today && (
        <>
          <div className="wx-today">
            <div className="wx-now">
              <span className="wx-big-icon" aria-hidden="true">{icon}</span>
              <div>
                <strong className="wx-temp">{round(today.temp)}°</strong>
                <span className="wx-cond">{today.summary}</span>
                <small>Feels like {round(today.feels)}°</small>
              </div>
            </div>
            <div className="wx-stats">
              <div><small>High / Low</small><b>{round(today.high)}° / {round(today.low)}°</b></div>
              <div><small>Wind</small><b>{round(today.wind)} km/h</b><span>gusts {round(today.gust)}</span></div>
              <div><small>Rain chance</small><b>{round(today.rainChance)}%</b></div>
              <div><small>Humidity</small><b>{round(today.humidity)}%</b></div>
              <div><small>UV index</small><b>{today.uv == null ? "–" : Math.round(today.uv)}</b></div>
              <div><small>Daylight</small><b>{time(today.sunrise)} – {time(today.sunset)}</b></div>
            </div>
          </div>

          <ul className="wx-advice">
            {today.advice.map(([level, text]) => <li key={text} className={level}>{text}</li>)}
          </ul>

          <p className="wx-source">
            Source: Open-Meteo · updated {time(today.checkedAt)}
            <button type="button" onClick={load} disabled={busy}>{busy ? "Loading…" : "Refresh"}</button>
          </p>
        </>
      )}
    </section>
  );
}
