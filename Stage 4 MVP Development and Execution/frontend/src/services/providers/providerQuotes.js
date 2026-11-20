// Provider service requests, quotations and dashboard data.

// ============================================================================
// Imports
// ============================================================================

import { getSession } from "../auth";
import {
  fetchProviderDashboard,
  fetchProviderRequests,
  postDeclineRequest,
  postQuotation,
} from "../api";
import { getProjectMeta } from "../projects";
import { SERVICE_LABELS } from "../projectFlow";

// Read the authenticated provider access token.
function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

// Service labels displayed on request cards.
const SHORT_SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs",
};

// Map service labels back to service identifiers.
const LABEL_TO_ID = Object.fromEntries(
  Object.entries(SERVICE_LABELS).map(([id, label]) => [label, id]),
);

// Read requested services from the request details.
function parseServices(details) {
  const match = /Services:\s*(.+)/i.exec(details || "");
  if (!match) return [];
  return match[1]
    .split(",")
    .map((item) => item.trim())
    .map((item) => (SERVICE_LABELS[item] ? item : LABEL_TO_ID[item]))
    .filter(Boolean);
}

// Calculate the inclusive project duration.
function durationDays(start, end) {
  if (!start || !end) return 1;
  const ms = new Date(`${end}T00:00:00`) - new Date(`${start}T00:00:00`);
  const days = Math.round(ms / 86400000) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

// Map a backend request to interface fields.
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
      project?.location ||
      getProjectMeta(request.project_id).location ||
      "Not specified",
    startDate,
    endDate,
    durationDays: durationDays(startDate, endDate),
    services,
    serviceLabels: services.map((id) => SHORT_SERVICE_LABELS[id] || id),
    details: request.details || "",
    createdAt: request.created_at,
  };
}

// Save the provider decision in the backend.
export async function declineProviderRequest(requestId) {
  // POST /provider/requests/{id}/decline: the backend keeps it, so the request
  // leaves this company's lists everywhere, not only in this browser.
  return postDeclineRequest(token(), requestId);
}

// Load requests that have not been quoted.
export async function getOpenRequests() {
  // Only the requests this company has not quoted yet, newest first.
  const rows = await fetchProviderRequests(token(), false);
  return rows.map((row) => toUiRequest(row, row.project));
}

// Find the selected quotation request.
export async function getOpenRequestById(requestId) {
  const list = await getOpenRequests();
  return (
    list.find((request) => String(request.requestId) === String(requestId)) ||
    null
  );
}

// Submit quotation pricing and service details.
export async function submitProviderQuotation({
  request,
  price,
  durationDays: days,
  notes,
}) {
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

// Map dashboard statistics, requests and projects.
export async function getProviderDashboard() {
  // GET /provider/dashboard: every number is counted by the server, and a new
  // company gets zeros and empty lists.
  const data = await fetchProviderDashboard(token());
  const requests = data.new_requests.map((row) =>
    toUiRequest(row, row.project),
  );
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
