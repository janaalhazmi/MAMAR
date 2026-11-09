import { getSession } from "../auth";
import { API_BASE_URL, authed, JSON_H, asJson } from "../api";

import tcmLogo from "../../assets/provider-tcm.jpg";
import safetyArabiaLogo from "../../assets/provider-safety-arabia.jpg";
import shawahidLogo from "../../assets/provider-shawahid.jpg";
import safetyTriangleLogo from "../../assets/provider-safety-triangle.jpg";

/* ------------------------------------------------------------------ */
/* CONSTANTS                                                           */
/* ------------------------------------------------------------------ */
const PROVIDER_LOGOS = {
  1: tcmLogo,
  2: safetyArabiaLogo,
  3: shawahidLogo,
  4: safetyTriangleLogo,
};

export const KEYS = {
  project: "mamarNewProject",
  providerIds: "selectedProviders",
  quotationId: "selectedQuotationId",
  confirmed: "confirmedQuotation",
  quotesCache: "mamarQuotationCache",
};

const DRAFT_KEY = KEYS.project;
const META_KEY = "mamarProjectMeta";

export const SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control Plan (TTC) Service",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs & Variable Message Signs",
};

const PROJECT_STATUS_LABELS = {
  draft: "Pending",
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export const STATUS_FILTERS = [
  "All",
  "In Progress",
  "Pending Quotes",
  "Planned",
  "Completed",
  "Cancelled",
];

/* ------------------------------------------------------------------ */
/* INTERNAL HELPERS                                                    */
/* ------------------------------------------------------------------ */
function readJSON(key, fallback = null) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

function requireProjectId(projectId) {
  if (projectId == null || projectId === "") {
    throw new Error("No project selected. Open a project from My Projects.");
  }
  return projectId;
}

function numberOrNull(value) {
  const number = Number(value);
  return value === null || value === undefined || value === "" || !Number.isFinite(number)
    ? null
    : number;
}

/* ------------------------------------------------------------------ */
/* SHARED FORMATTERS (يستخدمها FieldWorker.js و Provider.js أيضاً)       */
/* ------------------------------------------------------------------ */
export function parseServerDate(value) {
  if (!value) return null;
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`;
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? null : date;
}

export function formatDateTime(value) {
  const date = parseServerDate(value);
  if (!date) return "";
  return date.toLocaleString("en-GB", {
    day: "numeric",
    month: "short",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export function formatTime(value) {
  const date = parseServerDate(value);
  if (!date) return "";
  return date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
}

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

export function formatPrice(amount) {
  return `SAR ${Number(amount).toLocaleString("en-US")}`;
}

export function absUrl(url) {
  if (!url) return "";
  return /^https?:\/\//i.test(url) ? url : `${API_BASE_URL}${url}`;
}

export function toUiPhoto(photo) {
  return {
    id: photo.photo_id,
    src: absUrl(photo.url),
    caption: photo.caption || "Site photo",
    time: formatDateTime(photo.created_at),
  };
}

/* ------------------------------------------------------------------ */
/* API CALLS                                                           */
/* ------------------------------------------------------------------ */
export function getProjects(accessToken, projectStatus) {
  const query = projectStatus
    ? `?project_status=${encodeURIComponent(projectStatus)}`
    : "";
  return authed(`/projects${query}`, accessToken);
}

export function createProject(accessToken, project) {
  return authed("/projects", accessToken, {
    method: "POST",
    headers: JSON_H,
    body: asJson(project),
  });
}

export function updateProject(accessToken, projectId, changes) {
  return authed(`/projects/${projectId}`, accessToken, {
    method: "PATCH",
    headers: JSON_H,
    body: asJson(changes),
  });
}

export function fetchProject(accessToken, projectId) {
  return authed(`/projects/${projectId}`, accessToken);
}

export const postServiceRequest = (token, projectId, body) =>
  authed(`/projects/${projectId}/requests`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson(body),
  });

export const fetchProjectQuotations = (token, projectId) =>
  authed(`/projects/${projectId}/quotations`, token);

export const postRejectQuote = (token, quoteId) =>
  authed(`/quotes/${quoteId}/reject`, token, { method: "POST" });

export const postConfirmProvider = (token, projectId, quoteId) =>
  authed(`/projects/${projectId}/confirm-provider`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ quote_id: Number(quoteId) }),
  });

export const fetchMonitoring = (token, projectId) =>
  authed(`/projects/${projectId}/monitoring`, token);

export const fetchCompletion = (token, projectId) =>
  authed(`/projects/${projectId}/completion`, token);

export const postCompleteProject = (token, projectId) =>
  authed(`/projects/${projectId}/complete`, token, { method: "POST" });

export const postRequestChanges = (token, projectId, note) =>
  authed(`/projects/${projectId}/request-changes`, token, {
    method: "POST",
    headers: JSON_H,
    body: asJson({ note }),
  });

export const fetchRequestWorkZone = (token, requestId) =>
  authed(`/requests/${encodeURIComponent(requestId)}/work-zone`, token);

/* ------------------------------------------------------------------ */
/* PROJECT META (بيانات قديمة محفوظة بالمتصفح فقط)                      */
/* ------------------------------------------------------------------ */
function readMeta() {
  try {
    return JSON.parse(localStorage.getItem(META_KEY)) || {};
  } catch {
    return {};
  }
}

export function getProjectMeta(projectId) {
  return readMeta()[projectId] || {};
}

function saveProjectMeta(projectId, meta) {
  try {
    const all = readMeta();
    all[projectId] = { ...all[projectId], ...meta };
    localStorage.setItem(META_KEY, JSON.stringify(all));
  } catch {
    /* storage full or blocked */
  }
}

/* ------------------------------------------------------------------ */
/* WORK ZONE                                                           */
/* ------------------------------------------------------------------ */
const EARTH_RADIUS = 6378137;
const MAX_ZONE_POINTS = 500;

export function zoneToPoints(workZone) {
  if (!workZone) return null;
  const geometry = workZone.polygon ?? workZone;
  const ring = Array.isArray(geometry) ? geometry : geometry?.rings?.[0];
  if (!Array.isArray(ring) || ring.length < 3) return null;

  const wkid = geometry?.spatialReference?.latestWkid ?? geometry?.spatialReference?.wkid;
  const points = ring
    .filter((point) => Array.isArray(point) && point.length >= 2)
    .map(([x, y]) => {
      const mercator = wkid === 102100 || wkid === 3857 || Math.abs(x) > 180 || Math.abs(y) > 90;
      const lng = mercator ? (x / EARTH_RADIUS) * (180 / Math.PI) : x;
      const lat = mercator
        ? (2 * Math.atan(Math.exp(y / EARTH_RADIUS)) - Math.PI / 2) * (180 / Math.PI)
        : y;
      return [Number(lng.toFixed(7)), Number(lat.toFixed(7))];
    })
    .filter(([lng, lat]) => Math.abs(lng) <= 180 && Math.abs(lat) <= 90);

  if (points.length < 3) return null;
  if (points.length <= MAX_ZONE_POINTS) return points;
  const step = Math.ceil(points.length / MAX_ZONE_POINTS);
  return points.filter((_, index) => index % step === 0);
}

/* ------------------------------------------------------------------ */
/* CURRENT PROJECT (flow)                                              */
/* ------------------------------------------------------------------ */
export function getCurrentProject() {
  const saved = readJSON(KEYS.project, {});
  return {
    name: "",
    type: "",
    location: "",
    latitude: null,
    longitude: null,
    startDate: "",
    endDate: "",
    services: [],
    ...saved,
    id: saved.projectId ?? saved.id ?? null,
  };
}

export function startNewProject() {
  sessionStorage.removeItem(DRAFT_KEY);
}

export function openProjectInFlow(project) {
  sessionStorage.setItem(
    DRAFT_KEY,
    JSON.stringify({
      id: project.id,
      projectId: project.id,
      name: project.name,
      type: project.type,
      startDate: project.startDate,
      endDate: project.endDate,
      description: project.description,
      location: project.location === "Not specified" ? "" : project.location,
      latitude: project.latitude,
      longitude: project.longitude,
      workZone: project.workZone,
      services: project.services,
    })
  );
}

export function nextStepFor(project) {
  switch (project.backendStatus) {
    case "draft":
      return { label: "Continue", to: "/providers" };
    case "active":
      return { label: "Monitor", to: "/project-monitoring" };
    case "completed":
      return { label: "View", to: "/project-monitoring" };
    default:
      return null;
  }
}

/* ------------------------------------------------------------------ */
/* MY PROJECTS (READ)                                                  */
/* ------------------------------------------------------------------ */
function statusInfo(project) {
  switch (project.project_status) {
    case "active": {
      const today = new Date().toISOString().slice(0, 10);
      return project.start_date > today
        ? { label: "Planned", tone: "planned" }
        : { label: "In Progress", tone: "in-progress" };
    }
    case "completed":
      return { label: "Completed", tone: "completed" };
    case "cancelled":
      return { label: "Cancelled", tone: "cancelled" };
    default:
      return { label: "Pending Quotes", tone: "pending" };
  }
}

export function thumbTone(project) {
  if (project.statusTone === "completed") return "green";
  if (project.statusTone === "planned" || project.statusTone === "cancelled") return "grey";
  return "orange";
}

function toUiProject(raw) {
  const meta = getProjectMeta(raw.project_id);
  const info = statusInfo(raw);

  return {
    id: raw.project_id,
    name: raw.project_name,
    type: raw.closure_type,
    startDate: raw.start_date,
    endDate: raw.end_date,
    description: raw.description || "",
    createdAt: raw.created_at,
    backendStatus: raw.project_status,
    statusLabel: info.label,
    statusTone: info.tone,
    location: raw.location || meta.location || "Not specified",
    latitude: raw.latitude ?? meta.latitude ?? null,
    longitude: raw.longitude ?? meta.longitude ?? null,
    workZone: raw.work_zone || meta.workZone,
    services: raw.services?.length ? raw.services : meta.services || [],
  };
}

export async function fetchProjects() {
  const list = await getProjects(token());
  return list.map(toUiProject);
}

export function getStats(projects) {
  const count = (label) => projects.filter((p) => p.statusLabel === label).length;
  return {
    total: projects.length,
    inProgress: count("In Progress"),
    completed: count("Completed"),
    pendingQuotes: count("Pending Quotes"),
  };
}

function timeAgo(value) {
  if (!value) return "";
  const iso = /[zZ]|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`;
  const time = new Date(iso).getTime();
  if (Number.isNaN(time)) return "";

  const minutes = Math.max(0, Math.floor((Date.now() - time) / 60000));
  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  return `${Math.floor(hours / 24)}d ago`;
}

// TODO(BACKEND): GET /activity
export function buildActivity(projects, limit = 4) {
  return [...projects]
    .sort((a, b) => String(b.createdAt).localeCompare(String(a.createdAt)))
    .slice(0, limit)
    .map((project) => ({
      id: `created-${project.id}`,
      title: "Project created",
      text: project.name,
      time: timeAgo(project.createdAt),
      tone: "yellow",
    }));
}

/* ------------------------------------------------------------------ */
/* PROJECT (WRITE)                                                     */
/* ------------------------------------------------------------------ */
export async function saveProjectToBackend(project) {
  const body = {
    project_name: project.name,
    closure_type: project.type,
    start_date: project.startDate,
    end_date: project.endDate,
    description: project.description || null,
    services: Array.isArray(project.services) ? project.services : [],
    location: project.location ? String(project.location).slice(0, 255) : null,
    latitude: numberOrNull(project.latitude),
    longitude: numberOrNull(project.longitude),
    work_zone: zoneToPoints(project.workZone ?? project.polygon),
  };

  const saved = project.projectId
    ? await updateProject(token(), project.projectId, body)
    : await createProject(token(), body);

  saveProjectMeta(saved.project_id, {
    location: project.location,
    latitude: project.latitude,
    longitude: project.longitude,
    workZone: project.workZone,
    services: project.services,
  });

  return saved;
}

export function setProjectStatus(projectId, status) {
  return updateProject(token(), projectId, { project_status: status });
}

/* ------------------------------------------------------------------ */
/* REQUEST QUOTES                                                      */
/* ------------------------------------------------------------------ */
export function getSelectedProviderIds() {
  return readJSON(KEYS.providerIds, []);
}

export async function requestQuotes(
  project = getCurrentProject(),
  providerIds = getSelectedProviderIds()
) {
  const projectId = requireProjectId(project.id);

  const services = (project.services || []).map((id) => SERVICE_LABELS[id] || id);
  const ids = [...new Set(providerIds.map(Number))];

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error("Please select valid providers.");
  }

  return postServiceRequest(token(), projectId, {
    title: project.name || "Traffic control services",
    required_by: project.startDate,
    details: services.length ? `Services: ${services.join(", ")}` : null,
    provider_ids: ids.length ? ids : null,
  });
}

/* ------------------------------------------------------------------ */
/* QUOTATIONS                                                          */
/* ------------------------------------------------------------------ */
function toUiQuotation(q) {
  return {
    id: q.quote_id,
    requestId: q.request_id,
    providerId: q.provider_id,
    providerName: q.provider?.company_name || `Provider #${q.provider_id}`,
    providerDescription: q.provider?.service_type || "",
    providerLogo: PROVIDER_LOGOS[q.provider_id] || null,
    totalPrice: q.price,
    durationDays: q.duration_days,
    startDate: q.start_date,
    services: q.services || [],
    notes: q.notes,
    status: q.status === "rejected" ? "rejected" : "received",
    backendStatus: q.status,
  };
}

function cacheQuotations(list) {
  try {
    sessionStorage.setItem(KEYS.quotesCache, JSON.stringify(list));
  } catch {
    /* ignore */
  }
}

// eslint-disable-next-line no-unused-vars
export async function getQuotations(projectId, providerIds = []) {
  const raw = await fetchProjectQuotations(token(), requireProjectId(projectId));
  const list = raw.map(toUiQuotation);
  cacheQuotations(list);
  return list;
}

export async function getQuotationById(quotationId) {
  const cached = readJSON(KEYS.quotesCache, []);
  const found = cached.find((q) => String(q.id) === String(quotationId));
  if (found) return found;

  const projectId = getCurrentProject().id;
  if (projectId == null) return null;
  const list = await getQuotations(projectId);
  return list.find((q) => String(q.id) === String(quotationId)) || null;
}

export async function rejectQuotation(quotationId) {
  await postRejectQuote(token(), quotationId);
  return { id: quotationId, status: "rejected" };
}

export function saveSelectedQuotation(quotationId) {
  sessionStorage.setItem(KEYS.quotationId, JSON.stringify(quotationId));
}

export function getSelectedQuotationId() {
  return readJSON(KEYS.quotationId, null);
}

export async function confirmProvider(projectId, quotationId) {
  const result = await postConfirmProvider(
    token(),
    requireProjectId(projectId),
    quotationId
  );
  sessionStorage.setItem(KEYS.confirmed, JSON.stringify(quotationId));
  return result;
}

export function getConfirmedQuotationId() {
  return readJSON(KEYS.confirmed, null);
}

/* ------------------------------------------------------------------ */
/* PROJECT MONITORING                                                  */
/* ------------------------------------------------------------------ */
function buildMilestones(r) {
  const site = r.site_status;
  const notStarted = site === "Not Started";

  const prep = notStarted
    ? { state: "pending", note: "Pending" }
    : { state: "done", note: "Completed" };

  const install =
    site === "Completed"
      ? { state: "done", note: "Completed" }
      : notStarted
        ? { state: "pending", note: "Pending" }
        : { state: "active", note: `${site} • ${r.progress}%` };

  const final = r.completion_submitted
    ? { state: "done", note: "Submitted by the provider" }
    : { state: "pending", note: "Pending" };

  return [
    { id: 1, title: "Site Preparation", ...prep },
    { id: 2, title: "Traffic Control Installation", ...install },
    { id: 3, title: "Final Site Check", ...final },
  ];
}

function buildLatestUpdate(r) {
  const newest = [...(r.photos || [])].sort((a, b) =>
    String(b.created_at).localeCompare(String(a.created_at))
  )[0];

  if (newest) {
    return {
      title: "New site photo",
      text: newest.caption || "The field team uploaded a site photo.",
      time: formatDateTime(newest.created_at),
    };
  }
  if (r.last_check_in) {
    return {
      title: "Site check-in",
      text: "The field team checked in at the site.",
      time: formatDateTime(r.last_check_in),
    };
  }
  return {
    title: "No updates yet",
    text: "The field team has not reported from the site yet.",
    time: "",
  };
}

export async function getMonitoringData(projectId) {
  const r = await fetchMonitoring(token(), requireProjectId(projectId));
  const photos = (r.photos || []).map(toUiPhoto);

  return {
    status: PROJECT_STATUS_LABELS[r.project_status] || r.project_status,
    overallProgress: r.progress,
    fieldTeamCount: r.field_team_count,
    executionStatus: r.site_status,
    latestUpdate: buildLatestUpdate(r),
    milestones: buildMilestones(r),
    photos,
    completionSubmitted: r.completion_submitted,
    provider: r.provider
      ? {
          providerName: r.provider.company_name,
          providerDescription: r.provider.service_type,
          providerLogo: PROVIDER_LOGOS[r.provider.provider_id] || null,
        }
      : null,
  };
}

/* ------------------------------------------------------------------ */
/* REVIEW COMPLETION                                                   */
/* ------------------------------------------------------------------ */
export async function getCompletionData(projectId) {
  const r = await fetchCompletion(token(), requireProjectId(projectId));
  const submitted = r.submitted_at ? r.submitted_at.slice(0, 10) : "";

  const checklist = (r.services || []).map((id, index) => ({
    id: index + 1,
    title: SERVICE_LABELS[id] || id,
    note: "Implementation completed by the provider.",
  }));
  checklist.push({
    id: checklist.length + 1,
    title: "Final Site Inspection",
    note: "Final field inspection submitted by the provider.",
  });

  return {
    completionDate: submitted,
    finalProgress: r.progress,
    checklist,
    providerNote: r.quote?.notes
      ? `Provider note: ${r.quote.notes}`
      : "The provider has submitted the work for your review.",
    evidence: (r.photos || []).map((photo) => ({
      id: photo.photo_id,
      src: absUrl(photo.url),