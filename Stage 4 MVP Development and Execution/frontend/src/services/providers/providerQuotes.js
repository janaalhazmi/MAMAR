// src/services/providers/providerQuotes.js
// ---------------------------------------------------------------------------
// Provider side of the quotation flow, connected to the REAL backend:
//   Provider Dashboard (new request) -> Prepare Quotation -> contractor decides
//
//   GET  /provider/requests    open requests this company was invited to,
//                              with the project and a "quoted" flag
//   GET  /provider/dashboard   the numbers and lists of the dashboard
//   POST /quotations           the provider's price
// ---------------------------------------------------------------------------

import { getSession } from "../auth";
import {
  fetchProviderDashboard,
  fetchProviderRequests,
  postQuotation,
} from "../api";
import { getProjectMeta } from "../projects";
import { SERVICE_LABELS } from "../projectFlow";

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

/* ------------------------------------------------------------------ */
/* Helpers                                                             */
/* ------------------------------------------------------------------ */
const SHORT_SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs",
};

const LABEL_TO_ID = Object.fromEntries(
  Object.entries(SERVICE_LABELS).map(([id, label]) => [label, id])
);

// requestQuotes() writes "Services: ttc-plan, road-signs" in the details.
function parseServices(details) {
  const match = /Services:\s*(.+)/i.exec(details || "");
  if (!match) return [];
  return match[1]
    .split(",")
    .map((item) => item.trim())
    .map((item) => (SERVICE_LABELS[item] ? item : LABEL_TO_ID[item]))
    .filter(Boolean);
}

function durationDays(start, end) {
  if (!start || !end) return 1;
  const ms = new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`);
  const days = Math.round(ms / 86400000) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

function toUiRequest(request, project) {
  const startDate = project?.start_date || request.required_by;
  const endDate = project?.end_date || null;
  const services = project?.services?.length
    ? project.services
    : parseServices(request.details);

  return {
    requestId: request.request_id,
    projectId: request.project_id,
    title: project?.project_name || request.title,
    type: project?.closure_type || "",
    location:
      project?.location || getProjectMeta(request.project_id).location || "Not specified",
    startDate,
    endDate,
    durationDays: durationDays(startDate, endDate),
    services,
    serviceLabels: services.map((id) => SHORT_SERVICE_LABELS[id] || id),
    details: request.details || "",
    createdAt: request.created_at,
  };
}

/* ------------------------------------------------------------------ */
/* OPEN REQUESTS                                                       */
/* ------------------------------------------------------------------ */
function declinedRequestsKey() {
  const user = getSession()?.user;
  const accountId = user?.user_id ?? user?.id ?? user?.email;
  return accountId ? `mamarDeclinedRequests:${accountId}` : null;
}

function readDeclinedRequests(key) {
  if (!key) return [];

  try {
    const ids = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(ids) ? ids : [];
  } catch {
    return [];
  }
}

export function declineProviderRequest(requestId) {
  const key = declinedRequestsKey();
  if (!key) throw new Error("Please sign in again.");

  const ids = new Set(readDeclinedRequests(key));
  ids.add(String(requestId));
  localStorage.setItem(key, JSON.stringify([...ids]));
}

function excludeDeclinedRequests(rows) {
  const ids = new Set(readDeclinedRequests(declinedRequestsKey()));
  return rows.filter((row) => !ids.has(String(row.request_id)));
}

export async function getOpenRequests() {
  // Only the requests this company has not quoted yet, newest first.
  const rows = await fetchProviderRequests(token(), false);
  return excludeDeclinedRequests(rows).map((row) => toUiRequest(row, row.project));
}

export async function getOpenRequestById(requestId) {
  const list = await getOpenRequests();
  return list.find((request) => String(request.requestId) === String(requestId)) || null;
}

/* ------------------------------------------------------------------ */
/* SUBMIT QUOTATION                                                    */
/* ------------------------------------------------------------------ */
// POST /quotations { project_id, price, duration_days, start_date, services, notes }
// The backend stores ONE total price: the line details go inside the notes.
export async function submitProviderQuotation({ request, price, durationDays: days, notes }) {
  try {
    const saved = await postQuotation(token(), {
      project_id: request.projectId,
      price: Number(price),
      duration_days: Number(days),
      start_date: request.startDate || null,
      services: request.services,
      notes: notes || null,
    });
    return saved;
  } catch (error) {
    if (error.status === 409) {
      throw new Error("You already sent a quotation for this request.");
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* DASHBOARD                                                           */
/* ------------------------------------------------------------------ */
export async function getProviderDashboard() {
  // GET /provider/dashboard: every number is counted by the server, and a new
  // company gets zeros and empty lists.
  const data = await fetchProviderDashboard(token());
  const requests = excludeDeclinedRequests(data.new_requests)
    .map((row) => toUiRequest(row, row.project));
  const toUiProject = (row) => ({
    id: row.project.project_id,
    name: row.project.project_name,
    city: row.project.location || row.project.closure_type,
    dates: `${row.project.start_date} – ${row.project.end_date}`,
    progress: row.progress,
    status: row.status,
  });
  const next = data.next_project ? toUiProject(data.next_project) : null;

  return {
    stats: data.stats,
    pendingQuotes: data.pending_quotes,
    // "New Service Request" cards (one per request not quoted yet, newest first)
    newRequests: requests.map((request) => ({
      id: request.requestId,
      name: request.title,
      type: request.type || "Traffic control project",
      location: request.location,
      startDate: request.startDate,
      endDate: request.endDate,
      services: request.serviceLabels,
      status: "Awaiting Your Quote",
    })),
    // "New Assigned Project" card
    newProject: next
      ? {
          id: next.id,
          name: next.name,
          subtitle: `${next.city} · ${next.dates}`,
          status: "Ready to Start",
        }
      : null,
    activeProjects: data.active_projects.map(toUiProject),
    overview: {
      workersActive: data.overview.workers_active,
      sitesActive: data.overview.sites_active,
      fieldWorkers: data.overview.field_workers,
    },
  };
}
