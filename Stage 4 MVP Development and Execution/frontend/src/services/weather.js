// Open-Meteo straight from the browser, used when our server cannot reach it.
// Same rules as the backend (app/core/weather.py).
const CODES = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Fog" };

function describe(code) {
  if (code == null) return "Unknown";
  if (CODES[code]) return CODES[code];
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

function alertsFor(tempMax, rain, gust) {
  const alerts = [];
  if (tempMax != null && tempMax >= 45) alerts.push("Extreme heat: avoid heavy work between 12 and 4 pm");
  if (rain != null && rain >= 1) alerts.push("Rain: check cones, signs and lights");
  if (gust != null && gust >= 50) alerts.push("Strong wind or dust: secure the signs");
  return alerts;
}

export async function weatherInBrowser(info) {
  const query = new URLSearchParams({
    latitude: Number(info.latitude).toFixed(2),
    longitude: Number(info.longitude).toFixed(2),
    daily: "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max",
    timezone: "Asia/Riyadh",
    forecast_days: "16",
  });
  const response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  if (!response.ok) throw new Error("The weather service could not be reached");
  const daily = (await response.json()).daily || {};
  const all = (daily.time || []).map((date, i) => {
    const v = (name) => (daily[name] || [])[i] ?? null;
    const tempMax = v("temperature_2m_max"), rain = v("precipitation_sum"), gust = v("wind_gusts_10m_max");
    return {
      date, summary: describe(v("weather_code")), temp_max: tempMax, temp_min: v("temperature_2m_min"),
      rain_mm: rain, wind_gust_kmh: gust, alerts: alertsFor(tempMax, rain, gust),
    };
  });
  const projectDays = all.filter((day) => day.date >= info.start_date && day.date <= info.end_date);
  return { ...info, browser: false, project_days: projectDays.length > 0, days: projectDays.length ? projectDays : all.slice(0, 7) };
}
