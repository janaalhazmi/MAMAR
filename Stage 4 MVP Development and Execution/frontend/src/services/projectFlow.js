// src/services/projectFlow.js
// ---------------------------------------------------------------------------
// ONE PLACE for every call in the flow:
//   Review -> Providers -> Quotations -> Select Provider -> Project Monitoring -> Review Completion
//
// Every function calls the FastAPI backend (see backend/README.md) and returns
// the same shape the pages used with the mock data, so the pages did not change.
// The work zone polygon is saved in ArcGIS Online (services/workZoneLayer.js).
// ---------------------------------------------------------------------------

import { apiRequest, parseApiDate, photoUrl } from "./api";
import { getSession } from "./auth";
import { getWorkZone, saveWorkZone } from "./workZoneLayer";

import tcmLogo from "../assets/provider-tcm.jpg";
import safetyArabiaLogo from "../assets/provider-safety-arabia.jpg";
import shawahidLogo from "../assets/provider-shawahid.jpg";
import safetyTriangleLogo from "../assets/provider-safety-triangle.jpg";

// The logos of the demo providers (provider_id 1-4 in the backend).
export const PROVIDER_LOGOS = {
  1: tcmLogo,
  2: safetyArabiaLogo,
  3: shawahidLogo,
  4: safetyTriangleLogo,
};

/* ------------------------------------------------------------------ */
/* sessionStorage keys shared by the pages                             */
/* ------------------------------------------------------------------ */
export const KEYS = {
  project: "mamarNewProject", // written by the Create Project flow (has project_id once saved)
  providerIds: "selectedProviders", // written by ProviderPage
  requestId: "quotationRequestId", // the service request that asks the providers for quotes
  quotationId: "selectedQuotationId", // written by QuotationsPage (Accept)
  confirmed: "confirmedQuotation", // written by SelectProviderPage (Confirm)
};

function readJSON(key, fallback = null) {
  try {
    const value = JSON.parse(sessionStorage.getItem(key));
    return value ?? fallback;
  } catch {
    return fallback;
  }
}

function writeJSON(key, value) {
  sessionStorage.setItem(key, JSON.stringify(value));
}

function requireProjectId(projectId) {
  if (projectId == null) {
    throw new Error("Create the project first, then come back to this page.");
  }
  return projectId;
}

/* ------------------------------------------------------------------ */
/* PROJECT                                                             */
/* ------------------------------------------------------------------ */
export const SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control Plan (TTC) Service",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs & Variable Message Signs",
};

const STATUS_LABELS = {
  draft: "Draft",
  active: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

export function getCurrentProject() {
  // The project of the current flow, saved in sessionStorage by the Create Project pages.
  // id is the backend project_id (null until the project is confirmed on the Review page).
  const saved = readJSON(KEYS.project, {});
  return {
    name: "",
    type: "",
    location: "Riyadh, Saudi Arabia",
    services: [],
    ...saved,
    id: saved.project_id ?? null,
  };
}

function toProjectBody(project) {
  return {
    project_name: (project.name || "").trim(),
    closure_type: project.type,
    start_date: project.startDate,
    end_date: project.endDate,
    description: (project.description || "").trim() || null,
    services: Array.isArray(project.services) ? project.services : [],
  };
}

export async function submitProject(project) {
  // Review page > Confirm: saves the project in PostgreSQL (POST, or PATCH if it was already
  // saved) and its work zone in ArcGIS. Returns { project, mapError }: the project is saved
  // even when the map cannot be updated, and mapError explains why.
  const saved = project.project_id
    ? await apiRequest(`/projects/${project.project_id}`, { method: "PATCH", body: toProjectBody(project) })
    : await apiRequest("/projects", { method: "POST", body: toProjectBody(project) });

  const updated = { ...project, project_id: saved.project_id, project_status: saved.project_status };
  writeJSON(KEYS.project, updated);

  let mapError = "";
  try {
    await saveWorkZone({
      projectId: saved.project_id,
      contractorId: getSession()?.user?.user_id,
      project,
    });
  } catch (error) {
    mapError = error.message;
  }
  return { project: updated, mapError };
}

export function formatDate(value) {
  if (!value) return "Not specified";
  const date = new Date(`${String(value).slice(0, 10)}T00:00:00`);
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

function formatTime(value) {
  // "2026-11-02T10:30:00" -> "2 Nov 2026 • 10:30 AM"
  if (!value) return "Not yet";
  const date = parseApiDate(value);
  if (Number.isNaN(date.getTime())) return value;
  const day = date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
  const time = date.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit" });
  return `${day} • ${time}`;
}

/* ------------------------------------------------------------------ */
/* QUOTATIONS                                                          */
/* ------------------------------------------------------------------ */
// The quote statuses of the backend, as the Quotations page shows them.
const QUOTE_STATUSES = { pending: "received", accepted: "accepted", rejected: "rejected" };

function toProvider(provider) {
  if (!provider) return null;
  return {
    providerId: provider.provider_id,
    providerName: provider.company_name,
    providerDescription: provider.service_type,
    providerLogo: PROVIDER_LOGOS[provider.provider_id],
  };
}

function toQuotation(quote) {
  return {
    id: quote.quote_id,
    ...toProvider(quote.provider),
    totalPrice: quote.price,
    durationDays: quote.duration_days,
    startDate: quote.start_date,
    services: quote.services || [],
    notes: quote.notes,
    status: QUOTE_STATUSES[quote.status] || quote.status,
  };
}

export function getSelectedProviderIds() {
  return readJSON(KEYS.providerIds, []);
}

export async function requestQuotes(projectId, providerIds) {
  // Providers page > Request Quotes: opens one service request for the project, so the
  // providers can send their quotations. Asking again does not open a second request.
  requireProjectId(projectId);
  writeJSON(KEYS.providerIds, providerIds);

  const saved = readJSON(KEYS.requestId, null);
  if (saved?.projectId === projectId) return saved.requestId;

  const project = getCurrentProject();
  const request = await apiRequest(`/projects/${projectId}/requests`, {
    method: "POST",
    body: {
      title: `Quotation request: ${project.name}`.slice(0, 150),
      details: (project.services || []).map((id) => SERVICE_LABELS[id] || id).join(", ") || null,
      required_by: project.startDate,
    },
  });
  writeJSON(KEYS.requestId, { projectId, requestId: request.request_id });
  return request.request_id;
}

export async function getQuotations(projectId, providerIds = []) {
  // GET /projects/:projectId/quotations, only from the providers the contractor asked.
  const quotes = await apiRequest(`/projects/${requireProjectId(projectId)}/quotations`);
  return quotes
    .map(toQuotation)
    .filter(
      (quotation) =>
        providerIds.length === 0 || providerIds.includes(quotation.providerId)
    );
}

export async function getQuotationById(quotationId) {
  const quotations = await getQuotations(getCurrentProject().id);
  return quotations.find((quotation) => String(quotation.id) === String(quotationId)) || null;
}

export async function rejectQuotation(quotationId) {
  const quote = await apiRequest(`/quotes/${quotationId}/reject`, { method: "POST" });
  return { id: quote.quote_id, status: QUOTE_STATUSES[quote.status] };
}

export async function submitQuotation({ projectId, totalPrice, notes }) {
  // Provider > Prepare Quotation: POST /quotations. The quote covers the project's dates,
  // so the start date and the duration come from the project.
  if (!projectId) {
    throw new Error("Open this page from a project that asks for quotations.");
  }
  const project = await apiRequest(`/projects/${projectId}`);
  const days =
    Math.round(
      (new Date(`${project.end_date}T00:00:00`) - new Date(`${project.start_date}T00:00:00`)) / 86400000
    ) + 1;
  return apiRequest("/quotations", {
    method: "POST",
    body: {
      project_id: Number(projectId),
      price: Math.round(Number(totalPrice) * 100) / 100,
      duration_days: Math.max(1, days),
      start_date: project.start_date,
      services: project.services,
      notes: notes || null,
    },
  });
}

export function saveSelectedQuotation(quotationId) {
  // Only the id is stored. SelectProviderPage re-fetches the full quotation.
  writeJSON(KEYS.quotationId, quotationId);
}

export function getSelectedQuotationId() {
  return readJSON(KEYS.quotationId, null);
}

export async function confirmProvider(projectId, quotationId) {
  // Accepts the quote, rejects the others and moves the project to active.
  const result = await apiRequest(`/projects/${requireProjectId(projectId)}/confirm-provider`, {
    method: "POST",
    body: { quote_id: Number(quotationId) },
  });
  writeJSON(KEYS.confirmed, quotationId);
  writeJSON(KEYS.project, { ...readJSON(KEYS.project, {}), project_status: result.project.project_status });
  return { projectId, quotationId, status: "provider_confirmed" };
}

export function getConfirmedQuotationId() {
  return readJSON(KEYS.confirmed, null);
}

/* ------------------------------------------------------------------ */
/* PROJECT MONITORING                                                  */
/* ------------------------------------------------------------------ */
function toPhoto(photo) {
  return {
    id: photo.photo_id,
    src: photoUrl(photo.url),
    caption: photo.caption,
    time: formatTime(photo.created_at),
  };
}

function milestones(data) {
  const started = data.site_status !== "Not Started";
  const installed = data.site_status === "Completed" || data.project_status === "completed";
  return [
    { id: 1, title: "Site Preparation", note: started ? "Completed" : "Pending", state: started ? "done" : "pending" },
    {
      id: 2,
      title: "Traffic Control Installation",
      note: installed ? "Completed" : started ? `${data.site_status} • ${data.progress}%` : "Pending",
      state: installed ? "done" : started ? "active" : "pending",
    },
    {
      id: 3,
      title: "Final Site Check",
      note: data.project_status === "completed" ? "Completed" : data.completion_submitted ? "Waiting for your review" : "Pending",
      state: data.project_status === "completed" ? "done" : data.completion_submitted ? "active" : "pending",
    },
  ];
}

function latestUpdate(data) {
  if (data.change_note && !data.completion_submitted) {
    return { title: "Changes requested", text: data.change_note, time: formatTime(data.last_check_in) };
  }
  return {
    title: data.site_status,
    text: data.last_check_in
      ? "The field team checked in at the site."
      : "The field team has not checked in yet.",
    time: formatTime(data.last_check_in),
  };
}

async function withWorkZone(data, projectId) {
  // The page shows the map from the saved project; fill it from ArcGIS when missing.
  const project = getCurrentProject();
  if (project.workZone?.length >= 3) return data;
  try {
    const zone = await getWorkZone(projectId);
    if (zone) writeJSON(KEYS.project, { ...readJSON(KEYS.project, {}), ...zone });
  } catch {
    /* the map stays empty */
  }
  return data;
}

export async function getMonitoringData(projectId) {
  // GET /projects/:projectId/monitoring: progress, team and photos from the field worker.
  const data = await apiRequest(`/projects/${requireProjectId(projectId)}/monitoring`);
  return withWorkZone(
    {
      status: STATUS_LABELS[data.project_status] || data.project_status,
      overallProgress: data.progress,
      fieldTeamCount: data.field_team_count,
      executionStatus: data.site_status,
      latestUpdate: latestUpdate(data),
      milestones: milestones(data),
      photos: data.photos.map(toPhoto),
      provider: toProvider(data.provider),
      // The "Review Completion" button is enabled when the field worker marks the site Completed.
      completionSubmitted: data.completion_submitted,
    },
    projectId
  );
}

/* ------------------------------------------------------------------ */
/* REVIEW COMPLETION                                                   */
/* ------------------------------------------------------------------ */
export async function getCompletionData(projectId) {
  // GET /projects/:projectId/completion: the work the field team submitted.
  const data = await apiRequest(`/projects/${requireProjectId(projectId)}/completion`);
  const provider = toProvider(data.provider);
  const submitted = data.submitted_at ? String(data.submitted_at).slice(0, 10) : null;
  return withWorkZone(
    {
      completionDate: submitted,
      finalProgress: data.progress,
      checklist: [
        ...data.services.map((id, index) => ({
          id: index + 1,
          title: SERVICE_LABELS[id] || id,
          note: "Marked completed by the field team.",
        })),
        {
          id: data.services.length + 1,
          title: "Final Site Inspection",
          note: data.completion_submitted
            ? "Final field inspection submitted by the provider."
            : "Not submitted yet.",
        },
      ],
      providerNote: data.completion_submitted
        ? `${provider?.providerName || "The provider"} marked the site Completed on ${formatDate(submitted)}.`
        : "The field team has not submitted the work yet.",
      evidence: data.photos.map(toPhoto),
      submittedOn: submitted,
      provider,
      completionSubmitted: data.completion_submitted,
    },
    projectId
  );
}

export async function approveCompletion(projectId) {
  const project = await apiRequest(`/projects/${requireProjectId(projectId)}/complete`, { method: "POST" });
  return { projectId, status: project.project_status };
}

export async function requestChanges(projectId, note) {
  // Sends the note to the field team and sets the site back to Work in Progress.
  await apiRequest(`/projects/${requireProjectId(projectId)}/request-changes`, {
    method: "POST",
    body: { note },
  });
  return { projectId, status: "changes_requested", note };
}
