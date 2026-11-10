// src/services/providerQuotes.js
// ---------------------------------------------------------------------------
// Provider side of the quotation flow, connected to the REAL backend:
//   Provider Dashboard (new request) -> Prepare Quotation -> contractor decides
//
//   GET  /requests?status=open   requests created by contractors
//   GET  /projects/{id}          details of the project (may be refused: 403)
//   POST /quotations             the provider's price
// ---------------------------------------------------------------------------

import { getSession } from "./auth";
import {
  fetchAssignments,
  fetchOpenRequests,
  fetchProject,
  postQuotation,
} from "./api";
import { getProjectMeta } from "./projects";
import { SERVICE_LABELS } from "./projectFlow";
import { getProviderProjects } from "./providerFlow";

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

/* ------------------------------------------------------------------ */
/* Requests this provider already quoted (the backend has no flag)     */
/* ------------------------------------------------------------------ */
const quotedKey = () => `mamarQuotedRequests:${getSession()?.user?.user_id ?? "x"}`;

function readQuoted() {
  try {
    return JSON.parse(localStorage.getItem(quotedKey())) || [];
  } catch {
    return [];
  }
}

function markQuoted(requestId) {
  try {
    const list = readQuoted();
    if (!list.includes(requestId)) {
      localStorage.setItem(quotedKey(), JSON.stringify([...list, requestId]));
    }
  } catch {
    /* ignore */
  }
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
    location: getProjectMeta(request.project_id).location || "Not specified",
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
export async function getOpenRequests() {
  const t = token();
  const requests = await fetchOpenRequests(t, "open");

  const quoted = readQuoted();
  const fresh = requests
    .filter((request) => !quoted.includes(request.request_id))
    .sort((a, b) => String(b.created_at).localeCompare(String(a.created_at)));

  // The project details are optional: a provider may get 403 here.
  const projects = await Promise.allSettled(
    fresh.map((request) => fetchProject(t, request.project_id))
  );

  return fresh.map((request, index) =>
    toUiRequest(
      request,
      projects[index].status === "fulfilled" ? projects[index].value : null
    )
  );
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
    markQuoted(request.requestId);
    return saved;
  } catch (error) {
    if (error.status === 409) {
      markQuoted(request.requestId);
      throw new Error("You already sent a quotation for this request.");
    }
    throw error;
  }
}

/* ------------------------------------------------------------------ */
/* DASHBOARD                                                           */
/* ------------------------------------------------------------------ */
export async function getProviderDashboard() {
  const t = token();

  const [requests, projects, assignments] = await Promise.all([
    getOpenRequests(),
    getProviderProjects(),
    fetchAssignments(t, "active").catch(() => []),
  ]);

  const active = projects.filter((p) => p.status === "Active");
  const upcoming = projects.filter((p) => p.status === "Upcoming");
  const completed = projects.filter((p) => p.status === "Completed");

  const nextProject = upcoming[0];

  return {
    stats: {
      assigned: projects.length,
      active: active.length,
      upcoming: upcoming.length,
      completed: completed.length,
    },
    // "New Service Request" cards (one per open request, newest first)
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
    newProject: nextProject
      ? {
          id: nextProject.id,
          name: nextProject.name,
          subtitle: `${nextProject.city} · ${nextProject.dates}`,
          status: "Ready to Start",
        }
      : null,
    activeProjects: active,
    overview: {
      workersActive: new Set(assignments.map((a) => a.worker_id)).size,
      sitesActive: active.length,
    },
  };
}