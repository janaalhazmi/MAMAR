// src/services/fieldWork.js
// ---------------------------------------------------------------------------
// Field worker pages connected to the REAL backend:
//   Field Worker Dashboard -> Field Execution -> Device Verification
//
// Same exported names and shapes as the old mock version.
// ---------------------------------------------------------------------------

import { getSession } from "./auth";
import {
  fetchFieldProject,
  fetchFieldProjects,
  patchSiteStatus,
  postCheckIn,
  postDeviceVerify,
  postPhotos,
} from "./api";
import { getProjectMeta } from "./projects";
import {
  SERVICE_LABELS,
  formatDate,
  formatDateRange,
  formatDateTime,
  formatTime,
  toUiPhoto,
} from "./projectFlow";

export { formatDate, formatDateRange };

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

/* ------------------------------------------------------------------ */
/* SETTINGS                                                            */
/* ------------------------------------------------------------------ */

// The backend rejects (422) a worker who is further than 50 m from the device.
export const MAX_DISTANCE_METERS = 50;

// "real" = the phone's GPS (needs HTTPS or localhost + permission).
// "mock" = fake position next to the planned point. It only works when the
// planned point is known in this browser, so use it only for UI tests.
export const LOCATION_MODE = "real";
export const MOCK_OFFSET_METERS = 8;

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
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

const SHORT_SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control",
  "cones-barriers": "Cones & Barriers",
  "road-signs": "Road Signs & VMS",
};

const PROJECT_STATUS_LABELS = {
  draft: "Pending",
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

const TONES = ["yellow", "grey", "green", "blue"];

function initials(name = "") {
  const parts = name.trim().split(/\s+/).filter(Boolean);
  if (parts.length === 0) return "?";
  return (parts[0][0] + (parts[1]?.[0] || "")).toUpperCase();
}

function locationOf(projectId) {
  return getProjectMeta(projectId).location || "Not specified";
}

/* ------------------------------------------------------------------ */
/* DASHBOARD                                                           */
/* ------------------------------------------------------------------ */
const isDone = (p) =>
  p.project.project_status === "completed" || p.site_status === "Completed";
const isActive = (p) =>
  !isDone(p) && (p.site_status === "Work in Progress" || p.site_status === "Paused");
const isUpcoming = (p) => !isDone(p) && p.site_status === "Not Started";

// GET /field-worker/projects
export async function getFieldWorkerDashboard() {
  const list = await fetchFieldProjects(token());

  const active = list.filter(isActive);
  const upcoming = list.filter(isUpcoming);
  const next = upcoming[0];

  const workerIds = new Set();
  active.forEach((p) => p.team.forEach((member) => workerIds.add(member.user_id)));

  return {
    stats: {
      assigned: list.length,
      active: active.length,
      upcoming: upcoming.length,
      completed: list.filter(isDone).length,
    },
    newProject: next
      ? {
          id: next.project.project_id,
          name: next.project.project_name,
          type: next.project.closure_type,
          location: locationOf(next.project.project_id),
          startDate: next.project.start_date,
          endDate: next.project.end_date,
          services: (next.project.services || []).map(
            (id) => SHORT_SERVICE_LABELS[id] || id
          ),
          status: "Ready to Start",
        }
      : null,
    activeProjects: active.map((p) => ({
      id: p.project.project_id,
      name: p.project.project_name,
      location: locationOf(p.project.project_id),
      progress: p.progress,
      status: "Active",
    })),
    overview: { workersActive: workerIds.size, sitesActive: active.length },
  };
}

/* ------------------------------------------------------------------ */
/* FIELD EXECUTION                                                     */
/* ------------------------------------------------------------------ */
// The backend does not store the map location yet, so the planned point comes
// from what this browser saved (meta) and falls back to a sample point.
export function getPlannedLocation(projectId) {
  const meta = projectId != null ? getProjectMeta(projectId) : {};
  if (meta.latitude != null && meta.longitude != null) {
    return {
      latitude: Number(meta.latitude),
      longitude: Number(meta.longitude),
      workZone: meta.workZone,
    };
  }
  try {
    const saved = JSON.parse(sessionStorage.getItem("mamarNewProject"));
    if (saved?.latitude != null && saved?.longitude != null) {
      return {
        latitude: Number(saved.latitude),
        longitude: Number(saved.longitude),
        workZone: saved.workZone,
      };
    }
  } catch {
    /* ignore */
  }
  return { latitude: 24.7136, longitude: 46.6753 };
}

// GET /field-worker/projects/{id}
export async function getFieldExecution(projectId) {
  const r = await fetchFieldProject(token(), projectId);
  const p = r.project;
  const photos = (r.photos || []).map(toUiPhoto);

  const services = (p.services || []).map((id) => SHORT_SERVICE_LABELS[id] || id);

  return {
    project: {
      id: p.project_id,
      name: p.project_name,
      type: p.closure_type,
      location: locationOf(p.project_id),
      startDate: p.start_date,
      endDate: p.end_date,
      servicesLabel: services.join(" + ") || "Not specified",
      progress: r.progress,
      status: PROJECT_STATUS_LABELS[p.project_status] || p.project_status,
    },
    planned: getPlannedLocation(p.project_id),
    site: {
      executionStatus: r.site_status,
      teamCount: r.team.length,
      todayCheckIn: r.last_check_in ? formatTime(r.last_check_in) : "Not yet",
      lastUpdate: photos[0]?.time || (r.last_check_in ? formatDateTime(r.last_check_in) : "–"),
    },
    team: r.team.map((member, index) => ({
      id: member.user_id,
      initials: initials(member.full_name),
      name: member.full_name,
      role: "Field Worker",
      tone: TONES[index % TONES.length],
    })),
    moreTeamMembers: 0,
    photos,
  };
}

export const SITE_STATUSES = ["Not Started", "Work in Progress", "Paused", "Completed"];

// PATCH /field-worker/projects/{id}/status  { status }
export async function updateSiteStatus(projectId, status) {
  await patchSiteStatus(token(), projectId, status);
  return { projectId, status };
}

// POST /field-worker/projects/{id}/check-in
export async function siteCheckIn(projectId) {
  const r = await postCheckIn(token(), projectId);
  return { time: formatTime(r.last_check_in) || formatTime(new Date().toISOString()) };
}

/* ------------------------------------------------------------------ */
/* PHOTOS                                                              */
/* ------------------------------------------------------------------ */
const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;
const MAX_PHOTOS = 10;

// Small preview shown in the page (not what is uploaded).
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

// Phone photos are often bigger than 5 MB: re-encode them as a JPEG.
function toJpegFile(file, maxSize = 2000, quality = 0.85) {
  return new Promise((resolve, reject) => {
    const url = URL.createObjectURL(file);
    const img = new Image();
    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("This file is not a valid image."));
    };
    img.onload = () => {
      const scale = Math.min(1, maxSize / Math.max(img.width, img.height));
      const canvas = document.createElement("canvas");
      canvas.width = Math.round(img.width * scale);
      canvas.height = Math.round(img.height * scale);
      canvas.getContext("2d").drawImage(img, 0, 0, canvas.width, canvas.height);
      URL.revokeObjectURL(url);
      canvas.toBlob(
        (blob) =>
          blob
            ? resolve(
                new File([blob], `${file.name.replace(/\.[^.]+$/, "")}.jpg`, {
                  type: "image/jpeg",
                })
              )
            : reject(new Error("Could not prepare the photo.")),
        "image/jpeg",
        quality
      );
    };
    img.src = url;
  });
}

async function prepareFile(file) {
  if (ALLOWED_TYPES.includes(file.type) && file.size <= MAX_BYTES) return file;
  return toJpegFile(file);
}

// POST /field-worker/projects/{id}/photos  (multipart: photos + captions)
export async function uploadSitePhotos(projectId, photos) {
  if (photos.length === 0) throw new Error("Add at least one photo first.");
  if (photos.length > MAX_PHOTOS) {
    throw new Error(`You can send up to ${MAX_PHOTOS} photos at a time.`);
  }

  const files = await Promise.all(photos.map((photo) => prepareFile(photo.file)));

  const form = new FormData();
  files.forEach((file) => form.append("photos", file));
  photos.forEach((photo) => form.append("captions", photo.caption || "Site photo"));

  const saved = await postPhotos(token(), projectId, form);
  return saved.map(toUiPhoto);
}

/* ------------------------------------------------------------------ */
/* DEVICE VERIFICATION                                                 */
/* ------------------------------------------------------------------ */
// There is no GET /devices/{id}: the project comes from the page address,
//   /device-verification?deviceId=TC-014&projectId=12
export async function getDevice(deviceId, projectId) {
  let project = null;

  if (projectId) {
    project = (await fetchFieldProject(token(), projectId)).project;
  } else {
    const list = await fetchFieldProjects(token());
    project = (list.find(isActive) || list[0])?.project || null;
  }

  return {
    id: deviceId,
    name: "Installed Device",
    projectId: project?.project_id ?? null,
    projectName: project?.project_name || "Project",
    status: "Pending Verification",
  };
}

const GEO_ERRORS = {
  1: "Location permission was denied. Allow location access in your browser settings and try again.",
  2: "Your position is unavailable. Move to an open area and try again.",
  3: "Finding your location took too long. Try again.",
};

export function captureCurrentLocation(planned) {
  if (LOCATION_MODE === "mock") {
    const base = planned || { latitude: 24.7136, longitude: 46.6753 };
    return new Promise((resolve) =>
      setTimeout(
        () =>
          resolve({
            latitude: base.latitude + MOCK_OFFSET_METERS / 111320,
            longitude: base.longitude,
            accuracy: 5,
          }),
        600
      )
    );
  }

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

// POST /devices/{device}/verify  { project_id, latitude, longitude, accuracy }
// The BACKEND measures the distance against the planned point (ArcGIS) and
// answers 422 when the worker is further than 50 m: the message is shown as is.
export async function saveDeviceVerification({ deviceId, projectId, captured }) {
  const r = await postDeviceVerify(token(), deviceId, {
    project_id: Number(projectId),
    latitude: captured.latitude,
    longitude: captured.longitude,
    accuracy: captured.accuracy ?? null,
  });

  return {
    deviceId: r.device,
    projectId: r.project_id,
    planned: { latitude: r.planned_latitude, longitude: r.planned_longitude },
    distanceMeters: r.distance_m,
    maxDistanceMeters: r.max_distance_m,
    status: r.status,
  };
}
