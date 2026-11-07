import { getSession } from "./auth";
import {
  API_BASE_URL,
  fetchCompletion,
  fetchMonitoring,
  fetchProjectQuotations,
  postCompleteProject,
  postConfirmProvider,
  postRejectQuote,
  postRequestChanges,
  postServiceRequest,
} from "./api";
 
import tcmLogo from "../assets/provider-tcm.jpg";
import safetyArabiaLogo from "../assets/provider-safety-arabia.jpg";
import shawahidLogo from "../assets/provider-shawahid.jpg";
import safetyTriangleLogo from "../assets/provider-safety-triangle.jpg";
 
// The backend does not return logos: map them here by provider_id (1-4).
const PROVIDER_LOGOS = {
  1: tcmLogo,
  2: safetyArabiaLogo,
  3: shawahidLogo,
  4: safetyTriangleLogo,
};
 
/* ------------------------------------------------------------------ */
/* Storage keys                                                        */
/* ------------------------------------------------------------------ */
export const KEYS = {
  project: "mamarNewProject",
  providerIds: "selectedProviders",
  quotationId: "selectedQuotationId",
  confirmed: "confirmedQuotation",
  quotesCache: "mamarQuotationCache", // the backend has no GET /quotations/{id}
};
 
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
 
/* ------------------------------------------------------------------ */
/* Shared helpers (also used by fieldWork.js)                          */
/* ------------------------------------------------------------------ */
export function parseServerDate(value) {
  if (!value) return null;
  // The server sends times without a zone: treat them as UTC.
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
 
// Photo urls come back relative (/photos/abc): add the server address.
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
 
export const SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control Plan (TTC) Service",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs & Variable Message Signs",
};
 
/* ------------------------------------------------------------------ */
/* PROJECT                                                             */
/* ------------------------------------------------------------------ */
// The project being worked on. NO mock fallback: the id must be the real
// project_id returned by POST /projects (saved as projectId by the Review page).
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
 
function requireProjectId(projectId) {
  if (projectId == null || projectId === "") {
    throw new Error("No project selected. Open a project from My Projects.");
  }
  return projectId;
}
 
/* ------------------------------------------------------------------ */
/* REQUEST QUOTES  (call this from the "Request Quotes" button)        */
/* ------------------------------------------------------------------ */
// Create one open service request for the project.
// All providers can view open requests and submit quotations.
export async function requestQuotes(
  project = getCurrentProject(),
  providerIds = getSelectedProviderIds()
) {
  const projectId = requireProjectId(project.id);

  const services = (project.services || []).map(
    (id) => SERVICE_LABELS[id] || id
  );

  const ids = [...new Set(providerIds.map(Number))];

  if (ids.some((id) => !Number.isInteger(id) || id <= 0)) {
    throw new Error("Please select valid providers.");
  }

  return postServiceRequest(token(), projectId, {
    title: project.name || "Traffic control services",
    required_by: project.startDate,
    details: services.length
      ? `Services: ${services.join(", ")}`
      : null,
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
    // The pages only know "received" and "rejected".
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
 
export function getSelectedProviderIds() {
  return readJSON(KEYS.providerIds, []);
}
 
// GET /projects/{id}/quotations
// providerIds is kept only so the page call does not change: the backend
// already returns just the quotations providers really sent.
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
 
  // Cache empty (page refresh): reload the list of the current project.
  const projectId = getCurrentProject().id;
  if (projectId == null) return null;
  const list = await getQuotations(projectId);
  return list.find((q) => String(q.id) === String(quotationId)) || null;
}
 
// POST /quotes/{id}/reject
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
 
// POST /projects/{id}/confirm-provider  { quote_id }
export async function confirmProvider(projectId, quotationId) {
  const result = await postConfirmProvider(
    token(),
    requireProjectId(projectId),
    quotationId
  );
  sessionStorage.setItem(KEYS.confirmed, JSON.stringify(quotationId));
  return result; // { project, quote }
}
 
export function getConfirmedQuotationId() {
  return readJSON(KEYS.confirmed, null);
}
 
/* ------------------------------------------------------------------ */
/* PROJECT MONITORING                                                  */
/* ------------------------------------------------------------------ */
const PROJECT_STATUS_LABELS = {
  draft: "Pending",
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};
 
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
 
function buildLatestUpdate(r, photos) {
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
 
// GET /projects/{id}/monitoring
export async function getMonitoringData(projectId) {
  const r = await fetchMonitoring(token(), requireProjectId(projectId));
  const photos = (r.photos || []).map(toUiPhoto);
 
  return {
    status: PROJECT_STATUS_LABELS[r.project_status] || r.project_status,
    overallProgress: r.progress,
    fieldTeamCount: r.field_team_count,
    executionStatus: r.site_status,
    latestUpdate: buildLatestUpdate(r, photos),
    milestones: buildMilestones(r),
    photos,
    completionSubmitted: r.completion_submitted,
    // The backend returns the provider here, so the second call is not needed.
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
// GET /projects/{id}/completion
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
 
// POST /projects/{id}/complete
export async function approveCompletion(projectId) {
  const project = await postCompleteProject(token(), requireProjectId(projectId));
  return { projectId, status: project.project_status };
}
 
// POST /projects/{id}/request-changes  { note }
export async function requestChanges(projectId, note) {
  const project = await postRequestChanges(token(), requireProjectId(projectId), note);
  return { projectId, status: project.project_status, note };
}
 