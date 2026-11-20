// Provider project loading and interface mapping.

// ============================================================================
// Imports
// ============================================================================

import { getSession } from "../auth";
import { fetchProviderProjects } from "../api";
import { getProjectMeta } from "../projects";

// Read the authenticated provider access token.
function token() {
  const accessToken = getSession()?.access_token;
  if (!accessToken) throw new Error("Please sign in to continue.");
  return accessToken;
}

// Milliseconds used for project duration calculations.
const DAY_MS = 24 * 60 * 60 * 1000;

// Convert a project date to local midnight.
function toDate(value) {
  return new Date(`${value}T00:00:00`);
}

// Calculate the inclusive project duration.
function durationDays(start, end) {
  const days = Math.round((toDate(end) - toDate(start)) / DAY_MS) + 1;
  return Number.isFinite(days) && days > 0 ? days : 1;
}

// Format the project date range.
function datesLabel(start, end) {
  const s = toDate(start);
  const e = toDate(end);
  if (Number.isNaN(s.getTime()) || Number.isNaN(e.getTime()))
    return "Not specified";
  const month = (d) => d.toLocaleDateString("en-GB", { month: "short" });
  return `${s.getDate()} ${month(s)} – ${e.getDate()} ${month(e)} ${e.getFullYear()}`;
}

// Load and map assigned projects for provider pages.
export async function getProviderProjects() {
  const rows = await fetchProviderProjects(token());

  return rows.map((row) => {
    const project = row.project;
    const dates = datesLabel(project.start_date, project.end_date);
    return {
      id: project.project_id,
      code: `PRJ-${String(project.project_id).padStart(3, "0")}`,
      reference: `PRJ-${String(project.project_id).padStart(3, "0")}`,
      name: project.project_name,
      city: project.closure_type,
      location:
        project.location || getProjectMeta(project.project_id).location || "",
      dates,
      dateLabel: dates,
      startDate: project.start_date,
      endDate: project.end_date,
      duration: `${durationDays(project.start_date, project.end_date)} days`,
      progress: row.progress,
      status: row.status, // Active | Upcoming | Completed
      siteStatus: row.site_status,
      teamCount: row.field_team_count,
      workZone: project.work_zone ?? null,
      latitude: project.latitude ?? null,
      longitude: project.longitude ?? null,
      completionSubmitted: row.completion_submitted,
      price: row.quote?.price ?? null,
    };
  });
}
