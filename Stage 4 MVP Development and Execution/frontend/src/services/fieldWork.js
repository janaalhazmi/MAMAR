// src/services/fieldWork.js
// ---------------------------------------------------------------------------
// Everything the FIELD WORKER pages need:
//   Field Worker Dashboard -> Field Execution -> Device Verification
//
// Every function calls the FastAPI backend (see backend/README.md) and returns
// the same shape the pages used with the mock data. The work zone and the
// planned device points come from ArcGIS Online (services/workZoneLayer.js).
// ---------------------------------------------------------------------------

import { apiRequest, parseApiDate, photoUrl } from "./api";
import { getSession } from "./auth";
import { getTrafficDevice, getWorkZone } from "./workZoneLayer";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// The labels of the service ids saved with the project.
const SERVICE_NAMES = {
  "ttc-plan": "Temporary Traffic Control",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs & VMS",
};

// The project the worker opened last, so Field Execution and Device Verification
// know which project to load.
const CURRENT_KEY = "mamarFieldProjectId";

export function getCurrentFieldProjectId() {
  // ?project=12 in the address wins, then the project opened last.
  const fromUrl = new URLSearchParams(window.location.search).get("project");
  if (fromUrl) {
    sessionStorage.setItem(CURRENT_KEY, fromUrl);
    return Number(fromUrl);
  }
  const saved = sessionStorage.getItem(CURRENT_KEY);
  return saved ? Number(saved) : null;
}

function setCurrentFieldProjectId(projectId) {
  if (projectId != null) sessionStorage.setItem(CURRENT_KEY, String(projectId));
}

function formatTime(value) {
  if (!value) return "Not yet";
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

function projectStatusLabel(item) {
  if (item.project.project_status === "completed") return "Completed";
  if (item.site_status === "Not Started") return "Ready to Start";
  return item.site_status === "Completed" ? "Submitted" : "Active";
}

/* ------------------------------------------------------------------ */
/* SETTINGS YOU CAN CHANGE WHILE TESTING                               */
/* ------------------------------------------------------------------ */

// How close (in metres) the worker must be to the planned location.
// Further than this => "too far" error and Save Verification is blocked.
export const MAX_DISTANCE_METERS = 50;

// "mock" = pretend the phone is MOCK_OFFSET_METERS away from the planned spot.
// "real" = use the phone's real GPS (needs HTTPS or localhost + permission).
// Set to "real" before going live.
export const LOCATION_MODE = "mock";

// Used only when LOCATION_MODE = "mock".
// 8 = passes. Try 200 to see the "too far" error.
export const MOCK_OFFSET_METERS = 8;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
export function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(`${value}T00:00:00`);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

export function formatDateRange(start, end) {
  if (!start || !end) return "Not specified";
  return `${formatDate(start)} – ${formatDate(end)}`;
}

export function formatDistance(meters) {
  if (meters == null) return "–";
  if (meters < 1000) return `${Math.round(meters)} m`;
  return `${(meters / 1000).toFixed(1)} km`;
}

// Haversine formula: distance in metres between two GPS points.
export function distanceInMeters(a, b) {
  const R = 6371000;
  const toRad = (deg) => (deg * Math.PI) / 180;
  const dLat = toRad(b.latitude - a.latitude);
  const dLng = toRad(b.longitude - a.longitude);
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(toRad(a.latitude)) *
      Math.cos(toRad(b.latitude)) *
      Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

/* ------------------------------------------------------------------ */
/* DASHBOARD                                                           */
/* ------------------------------------------------------------------ */
export async function getFieldWorkerDashboard() {
  // GET /field-worker/projects: the projects the provider assigned to this worker.
  const items = await apiRequest("/field-worker/projects");
  const open = items.filter((item) => item.project.project_status !== "completed");
  const upcoming = open.filter((item) => item.site_status === "Not Started");
  const active = open.filter((item) => item.site_status !== "Not Started");
  const next = upcoming[0] || open[0] || null;
  setCurrentFieldProjectId(next?.project.project_id);

  return {
    stats: {
      assigned: items.length,
      active: active.length,
      upcoming: upcoming.length,
      completed: items.length - open.length,
    },
    newProject: next && {
      id: next.project.project_id,
      name: next.project.project_name,
      type: next.project.closure_type,
      location: "Riyadh",
      startDate: next.project.start_date,
      endDate: next.project.end_date,
      services: next.project.services.map((id) => SERVICE_NAMES[id] || id),
      status: projectStatusLabel(next),
    },
    activeProjects: active.map((item) => ({
      id: item.project.project_id,
      name: item.project.project_name,
      location: "Riyadh",
      progress: item.progress,
      status: projectStatusLabel(item),
    })),
    overview: {
      workersActive: new Set(active.flatMap((item) => item.team.map((member) => member.user_id))).size,
      sitesActive: active.length,
    },
  };
}

/* ------------------------------------------------------------------ */
/* FIELD EXECUTION                                                     */
/* ------------------------------------------------------------------ */

function toPhoto(photo) {
  return {
    id: photo.photo_id,
    projectId: null,
    src: photoUrl(photo.url),
    caption: photo.caption,
    time: parseApiDate(photo.created_at).toLocaleString("en-GB"),
  };
}

const TONES = ["yellow", "grey", "green"];

function toExecution(item, planned) {
  const myId = getSession()?.user?.user_id;
  const team = item.team.map((member, index) => ({
    id: member.user_id,
    initials: member.full_name
      .split(" ")
      .map((part) => part[0])
      .join("")
      .slice(0, 2)
      .toUpperCase(),
    name: member.user_id === myId ? "Me" : member.full_name,
    role: "Field Worker",
    tone: TONES[index % TONES.length],
  }));
  return {
    project: {
      id: item.project.project_id,
      name: item.project.project_name,
      type: item.project.closure_type,
      location: "Riyadh",
      startDate: item.project.start_date,
      endDate: item.project.end_date,
      servicesLabel: item.project.services.map((id) => SERVICE_NAMES[id] || id).join(" + ") || "Not specified",
      progress: item.progress,
      status: projectStatusLabel(item),
    },
    planned,
    site: {
      executionStatus: item.site_status,
      teamCount: item.team.length,
      todayCheckIn: formatTime(item.last_check_in),
      lastUpdate: formatTime(item.last_check_in),
    },
    changeNote: item.change_note,
    team: team.slice(0, 3),
    moreTeamMembers: Math.max(0, team.length - 3),
    photos: item.photos.map(toPhoto),
  };
}

export async function getFieldExecution(projectId) {
  // GET /field-worker/projects/:projectId. The planned location and work zone are the ones
  // the CONTRACTOR drew, read from ArcGIS. The worker cannot edit them.
  if (projectId == null) throw new Error("Open a project from your dashboard first.");
  setCurrentFieldProjectId(projectId);
  const [item, planned] = await Promise.all([
    apiRequest(`/field-worker/projects/${projectId}`),
    getPlannedLocation(projectId),
  ]);
  return toExecution(item, planned);
}

export const SITE_STATUSES = [
  "Not Started",
  "Work in Progress",
  "Paused",
  "Completed",
];

export async function updateSiteStatus(projectId, status) {
  // Completed submits the work, and the contractor's Review Completion button turns on.
  const item = await apiRequest(`/field-worker/projects/${projectId}/status`, {
    method: "PATCH",
    body: { status },
  });
  return { projectId, status: item.site_status };
}

export async function siteCheckIn(projectId) {
  const item = await apiRequest(`/field-worker/projects/${projectId}/check-in`, { method: "POST" });
  return { time: formatTime(item.last_check_in) };
}

// Shrinks a phone photo so it is small enough to store/send.
export function fileToDataUrl(file, maxSize = 900, quality = 0.72) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onerror = () => reject(new Error("Could not read the photo."));
    reader.onload = () => {
      const img = new Image();
      img.onerror = () => reject(new Error("This file is not a valid image."));
      img.onload = () => {
        const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.round(img.width * scale);
        canvas.height = Math.round(img.height * scale);
        canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", quality));
      };
      img.src = reader.result;
    };
    reader.readAsDataURL(file);
  });
}

export async function uploadSitePhotos(projectId, photos) {
  // POST /field-worker/projects/:projectId/photos as multipart/form-data with the original
  // files (not the small previews). The contractor sees them in Project Monitoring and
  // Review Completion.
  const form = new FormData();
  photos.forEach((photo) => {
    form.append("photos", photo.file);
    form.append("captions", photo.caption || "Site photo");
  });
  const saved = await apiRequest(`/field-worker/projects/${projectId}/photos`, {
    method: "POST",
    form,
  });
  return saved.map(toPhoto);
}

/* ------------------------------------------------------------------ */
/* DEVICE VERIFICATION                                                 */
/* ------------------------------------------------------------------ */
// Used when the project has no work zone on the map yet.
const RIYADH = { latitude: 24.7136, longitude: 46.6753 };

export async function getPlannedLocation(projectId) {
  // The work zone the CONTRACTOR drew, from the MAMAR Projects layer in ArcGIS.
  try {
    const zone = await getWorkZone(projectId);
    if (zone) return zone;
  } catch {
    /* the map service is not reachable: show Riyadh */
  }
  return { ...RIYADH, missing: true };
}

export async function getDevice(deviceId) {
  // The device from the MAMAR Traffic Devices layer, with its planned point.
  const device = await getTrafficDevice(deviceId);
  if (!device) throw new Error(`Device ${deviceId} is not on the map.`);
  return {
    id: deviceId,
    name: device.device_type,
    code: device.device_code,
    projectId: device.project_id,
    projectName: `Project ${device.project_id}`,
    status: device.device_status === "Verified" ? "Verified" : "Pending Verification",
    planned: { latitude: device.latitude, longitude: device.longitude },
  };
}

const GEO_ERRORS = {
  1: "Location permission was denied. Allow location access in your browser settings and try again.",
  2: "Your position is unavailable. Move to an open area and try again.",
  3: "Finding your location took too long. Try again.",
};

export function captureCurrentLocation(planned) {
  // MOCK MODE: pretend the worker stands MOCK_OFFSET_METERS north of the spot.
  if (LOCATION_MODE === "mock") {
    return delay(600).then(() => ({
      latitude: planned.latitude + MOCK_OFFSET_METERS / 111320,
      longitude: planned.longitude,
      accuracy: 5,
    }));
  }

  // REAL MODE: the phone's GPS.
  return new Promise((resolve, reject) => {
    if (!navigator.geolocation) {
      reject(new Error("This device does not support location services."));
      return;
    }
    navigator.geolocation.getCurrentPosition(
      (position) =>
        resolve({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: Math.round(position.coords.accuracy),
        }),
      (error) =>
        reject(new Error(GEO_ERRORS[error.code] || "Could not get your location.")),
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
    );
  });
}

export async function saveDeviceVerification(payload) {
  // POST /devices/:deviceId/verify. The phone checks the distance first, then the server
  // checks it again with the planned point from ArcGIS and refuses more than 50 m.
  if (payload.distanceMeters > MAX_DISTANCE_METERS) {
    throw new Error(
      `You are ${formatDistance(payload.distanceMeters)} from the planned location. Move within ${MAX_DISTANCE_METERS} m and capture again.`
    );
  }
  const result = await apiRequest(`/devices/${encodeURIComponent(payload.deviceId)}/verify`, {
    method: "POST",
    body: {
      project_id: Number(payload.projectId),
      latitude: payload.captured.latitude,
      longitude: payload.captured.longitude,
      accuracy: payload.captured.accuracy ?? null,
    },
  });
  return { ...payload, distanceMeters: result.distance_m, status: result.status };
}
