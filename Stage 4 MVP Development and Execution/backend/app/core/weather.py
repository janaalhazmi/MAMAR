import json
import time
import urllib.parse
import urllib.request

# Open-Meteo: free weather forecast, no key and no account (https://open-meteo.com).
# Gives 16 days of daily forecast for a point, so the work zone gets safety alerts.
OPEN_METEO_URL = "https://api.open-meteo.com/v1/forecast"
CACHE_SECONDS = 30 * 60
_cache: dict[tuple[float, float], tuple[float, dict]] = {}

# Simple safety rules for road work in Riyadh.
HEAT_C = 45  # extreme heat: stop heavy work at noon
RAIN_MM = 1  # rain: slippery roads, cones and signs need checking
WIND_KMH = 50  # strong wind: dust and falling signs

# WMO weather codes -> short words.
CODES = {0: "Clear", 1: "Mostly clear", 2: "Partly cloudy", 3: "Cloudy", 45: "Fog", 48: "Fog"}


class WeatherError(Exception):
    pass


def describe(code: int | None) -> str:
    if code is None:
        return "Unknown"
    if code in CODES:
        return CODES[code]
    if 51 <= code <= 67 or 80 <= code <= 82:
        return "Rain"
    if 71 <= code <= 77 or 85 <= code <= 86:
        return "Snow"
    if code >= 95:
        return "Thunderstorm"
    return "Cloudy"


def alerts_for(temp_max: float | None, rain_mm: float | None, gust_kmh: float | None) -> list[str]:
    alerts = []
    if temp_max is not None and temp_max >= HEAT_C:
        alerts.append("Extreme heat: avoid heavy work between 12 and 4 pm")
    if rain_mm is not None and rain_mm >= RAIN_MM:
        alerts.append("Rain: check cones, signs and lights")
    if gust_kmh is not None and gust_kmh >= WIND_KMH:
        alerts.append("Strong wind or dust: secure the signs")
    return alerts


def fetch(latitude: float, longitude: float) -> dict:
    key = (round(latitude, 2), round(longitude, 2))
    saved = _cache.get(key)
    if saved and time.time() - saved[0] < CACHE_SECONDS:
        return saved[1]
    query = urllib.parse.urlencode({
        "latitude": key[0],
        "longitude": key[1],
        "daily": "weather_code,temperature_2m_max,temperature_2m_min,precipitation_sum,wind_gusts_10m_max",
        "timezone": "Asia/Riyadh",
        "forecast_days": 16,
    })
    try:
        with urllib.request.urlopen(f"{OPEN_METEO_URL}?{query}", timeout=15) as response:
            data = json.loads(response.read())
    except Exception as error:  # noqa: BLE001 - any network or JSON problem is the same for the page
        raise WeatherError("The weather service could not be reached") from error
    _cache[key] = (time.time(), data)
    return data


def forecast(latitude: float, longitude: float) -> list[dict]:
    daily = fetch(latitude, longitude).get("daily") or {}
    days = []
    for i, day in enumerate(daily.get("time", [])):
        def value(name):
            values = daily.get(name) or []
            return values[i] if i < len(values) else None

        temp_max, rain, gust = value("temperature_2m_max"), value("precipitation_sum"), value("wind_gusts_10m_max")
        days.append({
            "date": day,
            "summary": describe(value("weather_code")),
            "temp_max": temp_max,
            "temp_min": value("temperature_2m_min"),
            "rain_mm": rain,
            "wind_gust_kmh": gust,
            "alerts": alerts_for(temp_max, rain, gust),
        })
    return days
