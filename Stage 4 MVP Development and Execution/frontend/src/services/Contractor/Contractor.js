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

export function hasRequestedQuotes(projectId) {
  return getProjectMeta(projectId).quotesRequested === true;
}

function markQuotesRequested(projectId, providerIds) {
  saveProjectMeta(projectId, {
    quotesRequested: true,
    selectedProviderIds: providerIds,
  });
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
      return { label: "Continue",
        to: project.hasRequestedQuotes
          ? "/quotations"
          : "/providers",
      };
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
    hasRequestedQuotes: meta.quotesRequested === true,
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
    })),
    submittedOn: submitted,
  };
}

export async function approveCompletion(projectId) {
  const project = await postCompleteProject(token(), requireProjectId(projectId));
  return { projectId, status: project.project_status };
}

export async function requestChanges(projectId, note) {
  const project = await postRequestChanges(token(), requireProjectId(projectId), note);
  return { projectId, status: project.project_status, note };
}

/* ------------------------------------------------------------------ */
/* BUTTON HANDLERS                                                     */
/* ------------------------------------------------------------------ */
export async function handleRequestQuotes(project, selectedIds) {

  if (!selectedIds || selectedIds.length === 0) {

    throw new Error("Please select at least one provider.");

  }

  if (hasRequestedQuotes(project.id)) {

    throw new Error("You have already submitted a quote request.");

  }

  // Send request to providers

  const result = await requestQuotes(project, selectedIds);

  // Save request status

  markQuotesRequested(project.id, selectedIds);

  sessionStorage.setItem(

    KEYS.providerIds,

    JSON.stringify(selectedIds)

  );

  // Add notification after successful submission

  addProjectCreatedNotification(project);

  return result;

}

export async function handleRejectQuotation(quotations, quotation) {
  await rejectQuotation(quotation.id);
  return quotations.map((q) =>
    q.id === quotation.id ? { ...q, status: "rejected" } : q
  );
}

export function handleAcceptQuotation(quotation) {
  saveSelectedQuotation(quotation.id);
}

export async function handleConfirmProvider(project, quotation) {
  if (!quotation) throw new Error("No quotation selected.");
  return confirmProvider(project.id, quotation.id);
}

export async function handleConfirmCompletion(projectId) {
  return approveCompletion(projectId);
}

export async function handleSendChanges(projectId, note) {
  const trimmed = (note || "").trim();
  if (!trimmed) {
    throw new Error("Describe the changes you need before sending.");
  }
  return requestChanges(projectId, trimmed);
}

/* ================================================================== */
/* PAGE LOGIC (كل منطق صفحات الكونتراكتور)                              */
/* ================================================================== */

/* ---------- User ---------- */
export function getDisplayUser(fallback = "there") {
  const user = getSession()?.user;
  const raw = user?.full_name || user?.name || "";
  const displayName = (typeof raw === "string" ? raw.trim() : "") || fallback;
  return {
    displayName,
    userInitial: displayName.charAt(0).toUpperCase(),
    firstName: displayName.split(" ")[0],
  };
}

/* ---------- Draft project (sessionStorage) ---------- */
export function getDraftProject() {
  return readJSON(KEYS.project, {});
}

export function saveDraftProject(patch) {
  const next = { ...getDraftProject(), ...patch };
  sessionStorage.setItem(KEYS.project, JSON.stringify(next));
  return next;
}

/* ---------- Shared small helpers ---------- */
export function formatServices(ids = []) {
  return ids.map((id) => SERVICE_LABELS[id] || id).join(" + ") || "Not specified";
}

export function hasProjectLocation(project) {
  return project.latitude != null && project.longitude != null;
}

function toDateString(date) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export const getToday = () => toDateString(new Date());

export function getNextDate(dateString) {
  if (!dateString) return getToday();
  const date = new Date(`${dateString}T00:00:00`);
  date.setDate(date.getDate() + 1);
  return toDateString(date);
}

/* ---------- Dashboard ---------- */
export function buildDashboard(allProjects) {
  const stats = getStats(allProjects);
  return {
    statistics: [
      { title: "Total Projects", value: stats.total, icon: "list" },
      { title: "In Progress", value: stats.inProgress, icon: "clock" },
      { title: "Completed", value: stats.completed, icon: "check" },
      { title: "Pending Quotes", value: stats.pendingQuotes, icon: "dots" },
    ],
    projects: allProjects.slice(0, 4),
    activities: buildActivity(allProjects),
  };
}

/* ---------- My Projects ---------- */
export function filterProjects(projects, search, status) {
  const term = search.trim().toLowerCase();
  return projects.filter((project) => {
    const matchesSearch =
      !term ||
      project.name.toLowerCase().includes(term) ||
      project.location.toLowerCase().includes(term);
    const matchesStatus = status === "All" || project.statusLabel === status;
    return matchesSearch && matchesStatus;
  });
}

// يفتح المشروع في الـflow ويرجع المسار، أو null إذا ما فيه خطوة
export function openProject(project) {
  const step = nextStepFor(project);
  if (!step) return null;
  openProjectInFlow(project);
  return step.to;
}

/* ---------- Step 1: Project details ---------- */
export const PROJECT_TYPES = [
  "Infrastructure",
  "Road Maintenance",
  "Construction",
  "Utility Work",
  "Event Traffic Control",
];

export function updateProjectField(project, name, value) {
  const updated = { ...project, [name]: value };
  if (name === "startDate" && updated.endDate && updated.endDate <= value) {
    updated.endDate = "";
  }
  return updated;
}

export function saveProjectDetails(project) {
  if (
    !project.name.trim() ||
    !project.type ||
    !project.startDate ||
    !project.endDate ||
    !project.description.trim()
  ) {
    throw new Error("Please complete all project details.");
  }
  if (project.startDate < getToday()) {
    throw new Error("Start date cannot be in the past.");
  }
  if (project.endDate <= project.startDate) {
    throw new Error("End date must be at least one day after the start date.");
  }
  sessionStorage.setItem(KEYS.project, JSON.stringify(project));
}

/* ---------- Step 2: Location ---------- */
const EMPTY_LOCATION = {
  address: "",
  latitude: null,
  longitude: null,
  area: null,
  polygon: null,
};

export function getSavedLocation() {
  const p = getDraftProject();
  return {
    address: p.location || "",
    latitude: p.latitude ?? null,
    longitude: p.longitude ?? null,
    area: p.area ?? null,
    polygon: p.polygon ?? p.workZone ?? null,
  };
}

export function applyMapSelection(previous, coordinates) {
  if (!coordinates) return { ...previous, ...EMPTY_LOCATION };
  return {
    ...previous,
    latitude: coordinates.latitude,
    longitude: coordinates.longitude,
    address: `${coordinates.latitude}, ${coordinates.longitude}`,
    area: coordinates.area,
    polygon: coordinates.polygon,
  };
}

export function saveProjectLocation(location) {
  if (!location.polygon) {
    throw new Error("Please draw and finish the work zone polygon before continuing.");
  }
  if (location.latitude === null || location.longitude === null) {
    throw new Error("Please draw and finish the project work zone before continuing.");
  }
  saveDraftProject({
    location: location.address,
    latitude: location.latitude,
    longitude: location.longitude,
    area: location.area,
    polygon: location.polygon,
    workZone: location.polygon,
  });
}

/* ---------- Step 3: Services ---------- */
export const SERVICE_OPTIONS = [
  {
    id: "ttc-plan",
    icon: "A",
    title: "Temporary Traffic Control Plan (TTC) Service",
    description:
      "Planning and implementation services provided by qualified traffic-control providers.",
    tags: ["Traffic Management Plan", "Site Setup"],
  },
  {
    id: "cones-barriers",
    icon: "▥",
    title: "Traffic Cones & Barriers",
    description: "Supply and installation of traffic cones and barriers.",
    tags: ["Cones", "Road Barriers"],
  },
  {
    id: "road-signs",
    icon: "⚠",
    title: "Road Signs & Variable Message Signs",
    description: "Installation and rental of road signs and variable message signs.",
    tags: ["Road Signs", "Variable Message Signs"],
  },
];

export function getSelectedServices() {
  const saved = getDraftProject().services;
  return Array.isArray(saved) ? saved : ["ttc-plan", "road-signs"];
}

export function toggleService(current, serviceId) {
  return current.includes(serviceId)
    ? current.filter((id) => id !== serviceId)
    : [...current, serviceId];
}

export function saveProjectServices(selected) {
  if (selected.length === 0) throw new Error("Please select at least one service.");
  saveDraftProject({ services: selected });
}

export function buildProjectSummary(project) {
  return {
    name: project.name || "Not specified",
    type: project.type || "Not specified",
    dates: formatDateRange(project.startDate, project.endDate),
    latitude:
      project.latitude != null ? Number(project.latitude).toFixed(6) : "Not specified",
    longitude:
      project.longitude != null ? Number(project.longitude).toFixed(6) : "Not specified",
    area:
      project.area != null
        ? `${Number(project.area).toLocaleString()} m²`
        : "Not specified",
    workZone: project.polygon || project.workZone ? "Polygon completed" : "Not selected",
  };
}

/* ---------- Step 4: Review ---------- */
export function getSelectedServiceOptions(project) {
  const ids = Array.isArray(project.services) ? project.services : [];
  return SERVICE_OPTIONS.filter((service) => ids.includes(service.id));
}

function requireProjectDetails(project) {
  if (!project.name || !project.type || !project.startDate || !project.endDate) {
    throw new Error("Project details are incomplete. Please edit the project details.");
  }
}

async function persistProject(project, status) {
  const saved = await saveProjectToBackend(project);
  return saveDraftProject({
    ...project,
    id: saved.project_id,
    projectId: saved.project_id,
    status,
  });
}

export async function handleSaveDraft(project) {
  requireProjectDetails(project);
  return persistProject(project, "draft");
}

export async function handleConfirmProject(project) {
  requireProjectDetails(project);
  if (project.type.length > 50) {
    throw new Error("Project type is too long (50 characters maximum).");
  }
  if (project.latitude == null || project.longitude == null) {
    throw new Error("Please select a project location before continuing.");
  }
  if (!Array.isArray(project.services) || project.services.length === 0) {
    throw new Error("Please select at least one service.");
  }
  return persistProject(project, "submitted");
}

/* ---------- Providers page ---------- */
export const PROVIDERS = [
  {
    id: 1,
    name: "TCM",
    description: "Traffic and Construction Management",
    logo: PROVIDER_LOGOS[1],
    city: "Riyadh",
    services: ["TTC Planning", "Road Signs", "Barriers"],
  },
  {
    id: 2,
    name: "Safety Arabia Co. LTD",
    description: "Traffic safety service provider",
    logo: PROVIDER_LOGOS[2],
    city: "Riyadh",
    services: ["TTC Planning", "Road Signs", "Site Safety"],
  },
  {
    id: 3,
    name: "Shawahid Roads Industrial Co.",
    description: "Road safety and traffic-control solutions",
    logo: PROVIDER_LOGOS[3],
    city: "Riyadh",
    services: ["Road Signs", "Barriers"],
  },
  {
    id: 4,
    name: "Safety Triangle Company",
    description: "Road safety and road traffic-control solutions",
    logo: PROVIDER_LOGOS[4],
    city: "Riyadh",
    services: ["TTC Planning", "Road Signs", "Barriers"],
  },
];

export const CITIES = ["Riyadh", "Jeddah", "Dammam"];

export const SERVICE_FILTERS = [
  "All Required Services",
  "TTC Planning",
  "Road Signs",
  "Barriers",
  "Site Safety",
];

export function filterProviders({ search, city, service }) {
  const term = search.trim().toLowerCase();
  return PROVIDERS.filter((provider) => {
    const matchesSearch =
      !term ||
      provider.name.toLowerCase().includes(term) ||
      provider.description.toLowerCase().includes(term);
    const matchesCity = provider.city === city;
    const matchesService =
      service === "All Required Services" || provider.services.includes(service);
    return matchesSearch && matchesCity && matchesService;
  });
}

export function getProviderPageSummary(project = getCurrentProject()) {
  return {
    name: project.name || "No project selected",
    location: project.location || "Not specified",
    services: formatServices(project.services),
  };
}

/* ---------- Quotations page ---------- */
const QUOTES_REFRESH_MS = 30000;

export const getReceived = (quotations) =>
  quotations.filter((q) => q.status === "received");

// يحمّل العروض ويحدّثها كل 30 ثانية. يرجع دالة لإيقافها.
export function watchQuotations(projectId, { onData, onError, onFinish }) {
  let stopped = false;

  const load = (silent) =>
    getQuotations(projectId)
      .then((data) => !stopped && onData(data))
      .catch((err) => {
        if (!stopped && !silent) {
          onError(err.message || "Could not load quotations. Please try again.");
        }
      })
      .finally(() => !stopped && onFinish());

  load(false);
  const timer = setInterval(() => load(true), QUOTES_REFRESH_MS);

  return () => {
    stopped = true;
    clearInterval(timer);
  };
}

/* ---------- Select provider page ---------- */
export const NEXT_STEPS = [
  {
    title: "Provider is notified",
    text: "The selected provider receives the confirmed project request.",
  },
  {
    title: "Work begins",
    text: "Field execution starts based on the approved project schedule.",
  },
  {
    title: "Track execution",
    text: "You can monitor project progress from your MAMAR dashboard.",
  },
];

export async function getSelectedQuotation() {
  const id = getSelectedQuotationId();
  return id ? getQuotationById(id) : null;
}

/* ---------- Review completion page ---------- */

export async function getConfirmedProvider() {
  const id = getConfirmedQuotationId();
  return id ? getQuotationById(id) : null;
}
//this function checks if quotes have been requested for a given project by looking up the project metadata in local storage. It returns true if quotes have been requested, and false otherwise.
/* ------------------------------------------------------------------ */
/* NOTIFICATIONS                                                       */
/* ------------------------------------------------------------------ */

const NOTIFICATIONS_KEY = "mamarNotifications";

const INITIAL_NOTIFICATIONS = [
  {
    id: 1,
    type: "quotation",
    title: "New Quotation Received",
    message: "A provider has submitted a quotation for your project.",
    time: "10 minutes ago",
    date: "Today",
    read: false,
    link: "/quotations",
  },
  {
    id: 2,
    type: "project",
    title: "Project Created Successfully",
    message: "Your project has been created and is ready for provider selection.",
    time: "2 hours ago",
    date: "Today",
    read: false,
    link: "/my-projects",
  },
  {
    id: 3,
    type: "provider",
    title: "Provider Confirmed",
    message: "Your selected service provider has been confirmed.",
    time: "Yesterday",
    date: "Yesterday",
    read: true,
    link: "/my-projects",
  },
  {
    id: 4,
    type: "update",
    title: "Project Status Updated",
    message: "Your project status has been updated.",
    time: "2 days ago",
    date: "Earlier",
    read: true,
    link: "/my-projects",
  },
];

export function getNotifications() {
  try {
    const saved = sessionStorage.getItem(NOTIFICATIONS_KEY);

    return saved
      ? JSON.parse(saved)
      : INITIAL_NOTIFICATIONS;
  } catch (error) {
    return INITIAL_NOTIFICATIONS;
  }
}

export function markNotificationAsRead(id) {
  const notifications = getNotifications();

  const updated = notifications.map((notification) =>
    notification.id === id
      ? { ...notification, read: true }
      : notification
  );

  sessionStorage.setItem(
    NOTIFICATIONS_KEY,
    JSON.stringify(updated)
  );

  return updated;
}

export function markAllNotificationsAsRead() {
  const updated = getNotifications().map((notification) => ({
    ...notification,
    read: true,
  }));

  sessionStorage.setItem(
    NOTIFICATIONS_KEY,
    JSON.stringify(updated)
  );

  return updated;
}
export function addProjectCreatedNotification(project) {
  const notifications = getNotifications();

  const now = new Date();

  const newNotification = {
    id: Date.now(),
    type: "project",
    title: "New Project Created",
    message: `Your project "${project.name}" has been successfully created and sent to the selected provider(s).`,
    time: now.toLocaleTimeString("en-US", {
      hour: "2-digit",
      minute: "2-digit",
    }),
    date: "Today",
    read: false,
    link: "/my-projects",
  };

  const updated = [newNotification, ...notifications];

  sessionStorage.setItem(
    NOTIFICATIONS_KEY,
    JSON.stringify(updated)
  );

  return updated;
}
