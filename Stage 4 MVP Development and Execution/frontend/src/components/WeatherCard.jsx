import { useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchProjectWeather } from "../services/api";
import "../styles/weather.css";

const ICONS = { Clear: "☀️", "Mostly clear": "🌤️", "Partly cloudy": "⛅", Cloudy: "☁️", Fog: "🌫️", Rain: "🌧️", Snow: "❄️", Thunderstorm: "⛈️" };

function dayLabel(iso) {
  return new Date(`${iso}T12:00:00`).toLocaleDateString("en-GB", { weekday: "short", day: "numeric", month: "short" });
}

// The weather at the work zone (Open-Meteo through our backend), with safety alerts.
export default function WeatherCard({ projectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getSession()?.access_token;
    if (!projectId || !token) return undefined;
    let active = true;
    fetchProjectWeather(token, projectId)
      .then((result) => { if (active) { setData(result); setError(""); } })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [projectId]);

  if (!projectId) return null;

  const alerts = data ? data.days.filter((day) => day.alerts.length) : [];

  return (
    <section className="wx-card" aria-label="Weather at the work zone">
      <div className="wx-head">
        <div>
          <h2>Weather at the Work Zone</h2>
          <p>
            {data?.project_days ? "Forecast for the project days" : "Forecast for the next days"}
            {data?.location ? ` · ${data.location}` : ""}
          </p>
        </div>
        {data && (
          <span className={`wx-badge ${alerts.length ? "warn" : "ok"}`}>
            {alerts.length ? `${alerts.length} day${alerts.length > 1 ? "s" : ""} with alerts` : "No safety alerts"}
          </span>
        )}
      </div>

      {error && <p className="wx-empty">{error}</p>}
      {!data && !error && <p className="wx-empty">Loading the forecast…</p>}

      {data && (
        <>
          <div className="wx-days">
            {data.days.map((day) => (
              <div className={`wx-day ${day.alerts.length ? "warn" : ""}`} key={day.date}>
                <span className="wx-date">{dayLabel(day.date)}</span>
                <span className="wx-icon" aria-hidden="true">{ICONS[day.summary] || "🌡️"}</span>
                <strong>{Math.round(day.temp_max)}°</strong>
                <small>{Math.round(day.temp_min)}° · {day.summary}</small>
                {day.rain_mm > 0 && <small>💧 {day.rain_mm} mm</small>}
                <small>💨 {Math.round(day.wind_gust_kmh)} km/h</small>
              </div>
            ))}
          </div>
          {alerts.length > 0 && (
            <ul className="wx-alerts">
              {alerts.map((day) => (
                <li key={day.date}>
                  <b>{dayLabel(day.date)}:</b> {day.alerts.join(" · ")}
                </li>
              ))}
            </ul>
          )}
          <p className="wx-source">Source: Open-Meteo</p>
        </>
      )}
    </section>
  );
}
