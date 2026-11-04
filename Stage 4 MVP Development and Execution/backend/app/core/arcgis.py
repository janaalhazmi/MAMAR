import json
import math
import os
import urllib.parse
import urllib.request

# The MAMAR Traffic Devices layer (Stage 3): the planned point of each device.
TRAFFIC_DEVICES_URL = os.getenv(
    "ARCGIS_TRAFFIC_DEVICES_URL",
    "https://services5.arcgis.com/kGzNyz7ldsPH1gDF/arcgis/rest/services/MAMAR_Web_Map_WFL1/FeatureServer/1",
)


class ArcGISError(Exception):
    pass


def device_filter(device: str) -> str:
    # A device is found by its number (device_id, e.g. 3001) or its code (device_code, e.g. TC-001).
    if device.isdigit():
        return f"device_id = {int(device)}"
    if not all(char.isalnum() or char in "-_" for char in device):
        raise ValueError("not a valid device code")
    return f"device_code = '{device}'"


def planned_device_point(device: str, project_id: int) -> tuple[float, float] | None:
    # Returns (latitude, longitude) of the device in the layer, or None if it is not there.
    params = urllib.parse.urlencode(
        {
            "where": f"{device_filter(device)} AND project_id = {int(project_id)}",
            "outFields": "device_id,project_id",
            "outSR": "4326",
            "returnGeometry": "true",
            "f": "json",
        }
    )
    try:
        with urllib.request.urlopen(f"{TRAFFIC_DEVICES_URL}/query?{params}", timeout=10) as response:
            data = json.load(response)
    except (OSError, ValueError) as error:
        raise ArcGISError("The map service could not be reached") from error
    if "error" in data:
        raise ArcGISError(data["error"].get("message", "The map service refused the request"))
    features = data.get("features") or []
    if not features:
        return None
    geometry = features[0].get("geometry") or {}
    if "x" not in geometry or "y" not in geometry:
        return None
    return float(geometry["y"]), float(geometry["x"])


def distance_m(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    # Haversine distance in metres, the same formula as distanceInMeters() in the frontend.
    radius = 6371000
    d_lat = math.radians(lat2 - lat1)
    d_lon = math.radians(lon2 - lon1)
    h = math.sin(d_lat / 2) ** 2 + math.cos(math.radians(lat1)) * math.cos(math.radians(lat2)) * math.sin(d_lon / 2) ** 2
    return 2 * radius * math.asin(math.sqrt(h))
