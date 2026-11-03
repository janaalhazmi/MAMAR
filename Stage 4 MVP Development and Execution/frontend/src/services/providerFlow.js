// src/services/providerFlow.js
// ---------------------------------------------------------------------------
// Provider pages connected to the REAL backend.
//
// The backend has no "provider projects" endpoint, so the list is built from:
//   GET /requests?status=awarded   -> requests this provider won (project_id)
//   GET /projects/{id}             -> dates, status, name of each project
//
// TODO(BACKEND): progress and site_status are not available to providers.
// Ask for them in the /requests or /assignments response.
// ---------------------------------------------------------------------------

import { getSession } from "./auth";
import { fetchOpenRequests, fetchProject } from "./api";

function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

const DAY_MS = 24 * 60 * 60 * 1000;

function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

function durationDays(start, end) {
  const days = Math.round((toDate(end) - toDate(start)) / DAY_MS) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

function datesLabel(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime())) return "Not specified";
  const month = (d) => d.toLocaleDateString("en-GB", { month: "short" });
  return `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)} ${e.getFullYear()}`;
}

// Backend status -> tab used by the page (Active / Upcoming / Completed).
function uiStatus(project) {
  const today = new Date().toISOString().slice(0, 10);
  if (project.project_status === "completed") return "Completed";
  if (project.project_status === "active" && project.start_date <= today) return "Active";
  return "Upcoming";
}

export async function getProviderProjects() {
  const t = token();

  const requests = await fetchOpenRequests(t, "awarded");
  const ids = [...new Set(requests.map((request) => request.project_id))];

  const results = await Promise.allSettled(ids.map((id) => fetchProject(t, id)));

  return results
    .filter((result) => result.status === "fulfilled")
    .map((result) => result.value)
    .filter((project) => project.project_status !== "cancelled")
    .map((project) => {
      const status = uiStatus(project);
      return {
        id: project.project_id,
        code: `PRJ-${String(project.project_id).padStart(3, "0")}`,
        name: project.project_name,
        city: project.closure_type,
        dates: datesLabel(project.start_date, project.end_date),
        duration: `${durationDays(project.start_date, project.end_date)} days`,
        progress: status === "Completed" ? 100 : 0,
        status,
      };
    });
}
