// Today's weather at the work zone, asked from the browser (Open-Meteo, free, no key).
// The free service blocks shared server addresses (like Render's), so the server only gives the location.
const CODES = { 0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Fog" };

export function describe(code) {
  if (code == null) return "Unknown";
  if (CODES[code]) return CODES[code];
  if ((code >= 51 && code <= 67) || (code >= 80 && code <= 82)) return "Rain";
  if ((code >= 71 && code <= 77) || (code >= 85 && code <= 86)) return "Snow";
  if (code >= 95) return "Thunderstorm";
  return "Cloudy";
}

// Safety advice for road work, worst first. Tone: ok, mid or bad.
export function adviceFor(today) {
  const items = [];
  if (today.high >= 45) items.push(["bad", "Extreme heat: stop heavy work between 12 and 4 pm and give water breaks."]);
  else if (today.high >= 40) items.push(["mid", "Very hot: plan shade and water breaks every hour."]);
  if (today.summary === "Thunderstorm") items.push(["bad", "Thunderstorm: stop work in the open and secure the signs."]);
  else if (today.rainChance >= 50 || today.rainMm >= 1) items.push(["mid", "Rain likely: check cones, signs and lights, roads get slippery."]);
  if (today.gust >= 50) items.push(["bad", "Strong wind or dust: secure the signs and barriers."]);
  else if (today.gust >= 35) items.push(["mid", "Windy: weigh down the signs and cones."]);
  if (today.summary === "Fog") items.push(["mid", "Fog: drivers see the zone late, put the advance signs further back."]);
  if (!items.length) items.push(["ok", "Good conditions for road work today."]);
  return items;
}

export async function todayWeather(latitude, longitude) {
  const query = new URLSearchParams({
    latitude: Number(latitude).toFixed(3),
    longitude: Number(longitude).toFixed(3),
    current: "temperature_2m,apparent_temperature,relative_humidity_2m,weather_code,wind_speed_10m,is_day",
    daily: "temperature_2m_max,temperature_2m_min,precipitation_probability_max,precipitation_sum,wind_gusts_10m_max,uv_index_max,sunrise,sunset",
    timezone: "Asia/Riyadh",
    forecast_days: "1",
  });
  let response;
  try {
    response = await fetch(`https://api.open-meteo.com/v1/forecast?${query}`);
  } catch {
    throw new Error("Could not load the weather. Check the internet connection and refresh.");
  }
  if (!response.ok) throw new Error("The weather service is busy right now. Try Refresh in a minute.");
  const { current = {}, daily = {} } = await response.json();
  const first = (name) => (daily[name] || [])[0] ?? null;
  const today = {
    date: first("time") || (daily.time || [])[0],
    temp: current.temperature_2m,
    feels: current.apparent_temperature,
    humidity: current.relative_humidity_2m,
    wind: current.wind_speed_10m,
    isDay: current.is_day !== 0,
    summary: describe(current.weather_code),
    high: first("temperature_2m_max"),
    low: first("temperature_2m_min"),
    rainChance: first("precipitation_probability_max") ?? 0,
    rainMm: first("precipitation_sum") ?? 0,
    gust: first("wind_gusts_10m_max") ?? 0,
    uv: first("uv_index_max"),
    sunrise: first("sunrise"),
    sunset: first("sunset"),
  };
  return { ...today, advice: adviceFor(today), checkedAt: new Date() };
}
