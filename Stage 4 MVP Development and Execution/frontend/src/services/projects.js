// src/services/projects.js
// ---------------------------------------------------------------------------
// Connects the contractor pages to the REAL backend (FastAPI /projects).
//
// Backend project fields:  project_id, project_name, project_status,
//   closure_type, start_date, end_date, description, created_at
// Backend statuses:        draft | active | completed | cancelled
//
// The backend does NOT store location (lat/lng/work zone) or services yet.
// Until it does, we keep them in this browser (localStorage) next to the
// project_id. See "META" below. TODO(BACKEND): add these columns, or save the
// work zone in the MAMAR_Projects ArcGIS layer using project_id.
// ---------------------------------------------------------------------------

import { getSession } from "./auth";
import { createProject, getProjects, updateProject } from "./api";

const DRAFT_KEY = "mamarNewProject"; // the project being created / opened
const META_KEY = "mamarProjectMeta"; // location + services per project_id

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

/* ------------------------------------------------------------------ */
/* META: data the backend does not store yet                           */
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
    /* storage full or blocked: the project still exists in the backend */
  }
}

/* ------------------------------------------------------------------ */
/* STATUS                                                              */
/* ------------------------------------------------------------------ */
export const STATUS_FILTERS = [
  "All",
  "In Progress",
  "Pending Quotes",
  "Planned",
  "Completed",
  "Cancelled",
];

// Backend status  ->  label shown on screen
//   draft      -> Pending Quotes  (created, still choosing a provider)
//   active     -> In Progress     (or "Planned" if the start date is in the future)
//   completed  -> Completed
//   cancelled  -> Cancelled
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

/* ------------------------------------------------------------------ */
/* READ                                                                */
/* ------------------------------------------------------------------ */
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
    // from META (until the backend stores them)
    location: meta.location || "Not specified",
    latitude: meta.latitude ?? null,
    longitude: meta.longitude ?? null,
    workZone: meta.workZone,
    services: meta.services || [],
  };
}

export async function fetchProjects() {
  // GET /projects  (the signed-in contractor's projects, newest first)
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
  // The server sends a time without a zone: treat it as UTC.
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

// Recent Activity. The backend has no activity endpoint, so we build it from
// the projects (created_at only). TODO(BACKEND): GET /activity for quotes,
// status changes and provider messages.
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
/* WRITE                                                               */
/* ------------------------------------------------------------------ */
// Used by the Review page (Save Draft and Confirm).
// First time: POST /projects. After that (it has a projectId): PATCH.
export async function saveProjectToBackend(project) {
  const body = {
    project_name: project.name,
    closure_type: project.type,
    start_date: project.startDate,
    end_date: project.endDate,
    description: project.description || null,
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

// Call this when the flow moves forward:
//   after the provider is confirmed -> "active"
//   after the contractor approves completion -> "completed"
export function setProjectStatus(projectId, status) {
  return updateProject(token(), projectId, { project_status: status });
}

/* ------------------------------------------------------------------ */
/* NAVIGATION HELPERS                                                  */
/* ------------------------------------------------------------------ */
// Clears the half-finished project so "Create Project" starts empty.
export function startNewProject() {
  sessionStorage.removeItem(DRAFT_KEY);
}

// Puts a project from the list back into the flow pages, which read it
// from sessionStorage (getCurrentProject in projectFlow.js).
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

// The button on each row of My Projects.
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
