import json
import time
import urllib.error
import urllib.parse
import urllib.request

from app.core import config

# TomTom Traffic Flow: the live speed on the road nearest to a point, compared with the speed
# when the road is empty. Free plan: 2,500 requests a day. Put TOMTOM_API_KEY on Render.
# The key stays on the server; the page only gets the result.
FLOW_URL = "https://api.tomtom.com/traffic/services/4/flowSegmentData/absolute/10/json"
CACHE_SECONDS = 5 * 60
_cache: dict[tuple[float, float], tuple[float, dict]] = {}


class TrafficError(Exception):
    pass


class TrafficOff(TrafficError):
    pass


def enabled() -> bool:
    return bool(config.TOMTOM_API_KEY)


def level_for(current: float | None, free: float | None, closed: bool) -> tuple[str, int]:
    # -> (level, congestion %). Congestion = how much slower than an empty road.
    if closed:
        return "Closed", 100
    if not current or not free:
        return "Unknown", 0
    congestion = max(0, min(100, round((1 - current / free) * 100)))
    if congestion < 20:
        return "Light", congestion
    if congestion < 50:
        return "Moderate", congestion
    return "Heavy", congestion


ADVICE = {
    "Light": "Light traffic: a good time to set up or remove the closure.",
    "Moderate": "Moderate traffic: make sure the advance warning signs are clear and lit.",
    "Heavy": "Heavy traffic: put the advance signs further back and keep a flagger at the taper.",
    "Closed": "The road is reported closed here. Check the diversion signs.",
    "Unknown": "Traffic data is not available for this road.",
}


def fetch(latitude: float, longitude: float) -> dict:
    if not enabled():
        raise TrafficOff("Live traffic is not set up yet")
    key = (round(latitude, 4), round(longitude, 4))
    saved = _cache.get(key)
    if saved and time.time() - saved[0] < CACHE_SECONDS:
        return saved[1]
    query = urllib.parse.urlencode({"point": f"{key[0]},{key[1]}", "unit": "KMPH", "key": config.TOMTOM_API_KEY})
    try:
        with urllib.request.urlopen(f"{FLOW_URL}?{query}", timeout=15) as response:
            data = json.loads(response.read())
    except urllib.error.HTTPError as error:
        if error.code == 400:
            raise TrafficError("No road with traffic data near this location") from error
        raise TrafficError("The traffic service could not be reached") from error
    except Exception as error:  # noqa: BLE001 - any network or JSON problem is the same for the page
        raise TrafficError("The traffic service could not be reached") from error
    _cache[key] = (time.time(), data)
    return data


def flow(latitude: float, longitude: float) -> dict:
    segment = fetch(latitude, longitude).get("flowSegmentData") or {}
    current, free = segment.get("currentSpeed"), segment.get("freeFlowSpeed")
    closed = bool(segment.get("roadClosure"))
    level, congestion = level_for(current, free, closed)
    current_time, free_time = segment.get("currentTravelTime"), segment.get("freeFlowTravelTime")
    delay = max(0, current_time - free_time) if current_time is not None and free_time is not None else None
    return {
        "level": level,
        "congestion": congestion,
        "current_speed_kmh": current,
        "free_flow_speed_kmh": free,
        "delay_seconds": delay,
        "road_closed": closed,
        "confidence": segment.get("confidence"),
        "advice": ADVICE[level],
    }
