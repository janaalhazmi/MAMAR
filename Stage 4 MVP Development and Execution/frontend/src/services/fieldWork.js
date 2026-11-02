// src/services/fieldWork.js
// ---------------------------------------------------------------------------
// Everything the FIELD WORKER pages need:
//   Field Worker Dashboard -> Field Execution -> Device Verification
//
// All data is MOCK for now. Every "TODO(API)" comment marks where the real
// backend call goes. Replace only the function bodies; the pages keep working
// as long as the returned shape stays the same.
// ---------------------------------------------------------------------------

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

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
  await delay();
  // TODO(API): GET /api/field-worker/dashboard
  // Returns the projects the contractor / provider assigned to this worker.
  return {
    stats: { assigned: 4, active: 2, upcoming: 1, completed: 1 },
    newProject: {
      id: "proj-001",
      name: "King Fahd Road – Water Line",
      type: "Infrastructure Project",
      location: "King Fahd Road, Riyadh",
      startDate: "2026-09-10",
      endDate: "2026-09-20",
      services: ["Temporary Traffic Control", "Road Signs & VMS"],
      status: "Ready to Start",
    },
    activeProjects: [
      { id: "proj-002", name: "Northern Ring Road", location: "Riyadh", progress: 68, status: "Active" },
      { id: "proj-003", name: "Olaya Road Works", location: "Riyadh", progress: 35, status: "Active" },
    ],
    overview: { workersActive: 6, sitesActive: 2 },
  };
}

/* ------------------------------------------------------------------ */
/* FIELD EXECUTION                                                     */
/* ------------------------------------------------------------------ */
const PHOTO_KEY = "mamarFieldPhotos";

export function getSitePhotos(projectId) {
  // MOCK STORAGE: photos live in this browser's localStorage so you can see
  // them again after a refresh. See uploadSitePhotos() for the real flow.
  try {
    const all = JSON.parse(localStorage.getItem(PHOTO_KEY)) || [];
    return all.filter((photo) => photo.projectId === projectId);
  } catch {
    return [];
  }
}

export async function getFieldExecution(projectId) {
  await delay();
  // TODO(API): GET /api/field-worker/projects/:projectId
  // The planned location (latitude/longitude) and work zone are the ones the
  // CONTRACTOR picked when creating the project. Do not let the worker edit
  // them.
  return {
    project: {
      id: projectId,
      name: "King Fahd Road – Water Line",
      type: "Project Execution",
      location: "King Fahd Road, Riyadh",
      startDate: "2026-09-10",
      endDate: "2026-09-20",
      servicesLabel: "TTC Plan + Road Signs",
      progress: 35,
      status: "In Progress",
    },
    planned: getPlannedLocation(),
    site: {
      executionStatus: "Work in Progress",
      teamCount: 6,
      todayCheckIn: "07:45 AM",
      lastUpdate: "10:30 AM",
    },
    team: [
      { id: 1, initials: "AM", name: "Ahmed M.", role: "Site Supervisor", tone: "yellow" },
      { id: 2, initials: "KA", name: "Me", role: "Field Worker", tone: "grey" },
      { id: 3, initials: "SA", name: "Saud A.", role: "Field Worker", tone: "green" },
    ],
    moreTeamMembers: 3,
    photos: getSitePhotos(projectId),
  };
}

export const SITE_STATUSES = [
  "Not Started",
  "Work in Progress",
  "Paused",
  "Completed",
];

export async function updateSiteStatus(projectId, status) {
  await delay(200);
  // TODO(API): PATCH /api/field-worker/projects/:projectId/status  { status }
  // When status = "Completed" the backend should flag the project as
  // "completion submitted" so the contractor can review it
  // (see completionSubmitted in services/projectFlow.js).
  return { projectId, status };
}

export async function siteCheckIn(projectId) {
  await delay(200);
  // TODO(API): POST /api/field-worker/projects/:projectId/check-in
  // Send the worker's GPS position too if you want to verify it server-side.
  const now = new Date();
  return {
    time: now.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" }),
  };
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
  await delay(500);
  // TODO(API): POST /api/field-worker/projects/:projectId/photos
  // Send the real files as multipart/form-data (use the File objects, not the
  // shrunken data URLs). The backend stores them and the CONTRACTOR sees them
  // in Project Monitoring > Latest Site Photos and Review Completion >
  // Final Evidence. Return the saved photos, each with a public URL.
  const saved = photos.map((photo, index) => ({
    id: `photo-${Date.now()}-${index}`,
    projectId,
    src: photo.src,
    caption: photo.caption || "Site photo",
    time: new Date().toLocaleString("en-GB"),
  }));

  try {
    const existing = JSON.parse(localStorage.getItem(PHOTO_KEY)) || [];
    localStorage.setItem(PHOTO_KEY, JSON.stringify([...saved, ...existing]));
  } catch {
    throw new Error("Not enough storage for these photos. Send fewer photos.");
  }
  return saved;
}

/* ------------------------------------------------------------------ */
/* DEVICE VERIFICATION                                                 */
/* ------------------------------------------------------------------ */
export function getPlannedLocation() {
  // TODO(API): GET /api/projects/:projectId/location
  // This is the point the CONTRACTOR selected on the map. Until the backend
  // exists we read the project saved in this browser, then fall back to a
  // sample point in Riyadh.
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

export async function getDevice(deviceId) {
  await delay(150);
  // TODO(API): GET /api/devices/:deviceId
  return {
    id: deviceId,
    name: "Traffic Barrier",
    projectId: "proj-001",
    projectName: "Water Pipeline Installation",
    status: "Pending Verification",
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
  await delay(400);
  // TODO(API): POST /api/devices/:deviceId/verify
  // payload = { deviceId, projectId, planned, captured, distanceMeters }
  // The backend should ALSO re-check the distance (never trust the phone
  // alone) and reject it when distanceMeters > MAX_DISTANCE_METERS.
  if (payload.distanceMeters > MAX_DISTANCE_METERS) {
    throw new Error(
      `You are ${formatDistance(payload.distanceMeters)} from the planned location. Move within ${MAX_DISTANCE_METERS} m and capture again.`
    );
  }
  return { ...payload, status: "Verified" };
}