// src/services/projectFlow.js
// ---------------------------------------------------------------------------
// ONE PLACE for every call in the flow:
//   Providers -> Quotations -> Select Provider -> Project Monitoring -> Review Completion
//
// Every function below returns MOCK data right now. Each one has a
//   "TODO(API)"  comment showing exactly where the real backend call goes.
// When the backend is ready, replace only the body of the function. The pages
// do not need to change as long as you return the same shape.
// ---------------------------------------------------------------------------

import tcmLogo from "../assets/provider-tcm.jpg";
import safetyArabiaLogo from "../assets/provider-safety-arabia.jpg";
import shawahidLogo from "../assets/provider-shawahid.jpg";
import safetyTriangleLogo from "../assets/provider-safety-triangle.jpg";

// Mock site photos: swap for the real URLs your provider uploads.
import photoOne from "../assets/david-klein-KXM2z8Werl0-unsplash.jpg";
import photoTwo from "../assets/mika-baumeister-74tW4FXP4Hw-unsplash.jpg";
import photoThree from "../assets/jay-openiano-CxwBBqxBfuk-unsplash.jpg";

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

/* ------------------------------------------------------------------ */
/* sessionStorage keys shared by the pages                             */
/* ------------------------------------------------------------------ */
export const KEYS = {
  project: "mamarNewProject", // written by the Create Project flow
  providerIds: "selectedProviders", // written by ProviderPage
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

/* ------------------------------------------------------------------ */
/* PROJECT                                                             */
/* ------------------------------------------------------------------ */
const MOCK_PROJECT = {
  id: "proj-001",
  name: "King Fahd Road – Water Line",
  type: "Infrastructure Project",
  location: "Riyadh, Saudi Arabia",
  latitude: 24.7136,
  longitude: 46.6753,
  startDate: "2026-09-10",
  endDate: "2026-09-20",
  services: ["ttc-plan", "road-signs"],
};

export const SERVICE_LABELS = {
  "ttc-plan": "Temporary Traffic Control Plan (TTC) Service",
  "cones-barriers": "Traffic Cones & Barriers",
  "road-signs": "Road Signs & Variable Message Signs",
};

export function getCurrentProject() {
  // TODO(API): GET /api/projects/:projectId  (use the id saved after
  // "Confirm & Find Providers"). For now we read what the Create Project
  // flow saved in sessionStorage and fall back to the mock project.
  const saved = readJSON(KEYS.project, {});
  return { ...MOCK_PROJECT, ...saved };
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

/* ------------------------------------------------------------------ */
/* QUOTATIONS                                                          */
/* ------------------------------------------------------------------ */
// providerId matches the ids in ProviderPage.jsx (1-4).
const MOCK_QUOTATIONS = [
  {
    id: "q-1",
    providerId: 1,
    providerName: "TCM",
    providerDescription: "Traffic and Construction Management",
    providerLogo: tcmLogo,
    totalPrice: 18500,
    durationDays: 15,
    startDate: "2026-09-10",
    services: ["ttc-plan", "road-signs"],
    status: "received",
  },
  {
    id: "q-2",
    providerId: 2,
    providerName: "Safety Arabia Co. LTD",
    providerDescription: "Traffic safety service provider",
    providerLogo: safetyArabiaLogo,
    totalPrice: 21000,
    durationDays: 6,
    startDate: "2026-09-10",
    services: ["ttc-plan", "road-signs"],
    status: "received",
  },
  {
    id: "q-3",
    providerId: 3,
    providerName: "Shawahid Roads Industrial Co.",
    providerDescription: "Road safety and traffic-control solutions",
    providerLogo: shawahidLogo,
    totalPrice: 16800,
    durationDays: 12,
    startDate: "2026-09-12",
    services: ["road-signs"],
    status: "received",
  },
  {
    id: "q-4",
    providerId: 4,
    providerName: "Safety Triangle Company",
    providerDescription: "Road safety and road traffic-control solutions",
    providerLogo: safetyTriangleLogo,
    totalPrice: 19900,
    durationDays: 9,
    startDate: "2026-09-11",
    services: ["ttc-plan", "road-signs"],
    status: "received",
  },
];

export function getSelectedProviderIds() {
  return readJSON(KEYS.providerIds, [1, 2]);
}

export async function getQuotations(projectId, providerIds = []) {
  await delay();
  // TODO(API): GET /api/projects/:projectId/quotations
  // The backend should return one quotation per provider the contractor
  // requested quotes from (providerIds), with the provider's real price,
  // duration, start date and included services. Keep this shape:
  //   { id, providerId, providerName, providerDescription, providerLogo,
  //     totalPrice, durationDays, startDate, services: [serviceId], status }
  return MOCK_QUOTATIONS.filter(
    (quotation) =>
      providerIds.length === 0 || providerIds.includes(quotation.providerId)
  );
}

export async function getQuotationById(quotationId) {
  await delay(100);
  // TODO(API): GET /api/quotations/:quotationId
  return MOCK_QUOTATIONS.find((quotation) => quotation.id === quotationId) || null;
}

export async function rejectQuotation(quotationId) {
  await delay(150);
  // TODO(API): POST /api/quotations/:quotationId/reject
  return { id: quotationId, status: "rejected" };
}

export function saveSelectedQuotation(quotationId) {
  // Only the id is stored. SelectProviderPage re-fetches the full quotation.
  sessionStorage.setItem(KEYS.quotationId, JSON.stringify(quotationId));
}

export function getSelectedQuotationId() {
  return readJSON(KEYS.quotationId, null);
}

export async function confirmProvider(projectId, quotationId) {
  await delay(400);
  // TODO(API): POST /api/projects/:projectId/confirm-provider  { quotationId }
  // Backend should: assign the provider, notify them, set project status to
  // "in_progress", and return the updated project.
  sessionStorage.setItem(KEYS.confirmed, JSON.stringify(quotationId));
  return { projectId, quotationId, status: "provider_confirmed" };
}

export function getConfirmedQuotationId() {
  return readJSON(KEYS.confirmed, null);
}

/* ------------------------------------------------------------------ */
/* PROJECT MONITORING                                                  */
/* ------------------------------------------------------------------ */
export async function getMonitoringData(projectId) {
  await delay();
  // TODO(API): GET /api/projects/:projectId/monitoring
  // Progress, team size, milestones and photos come from the provider's
  // field app (updated by the field worker). Keep this shape.
  return {
    status: "In Progress",
    overallProgress: 35,
    fieldTeamCount: 6,
    executionStatus: "Work in Progress",
    latestUpdate: {
      title: "Road signs installed",
      text: "Work zone signs and barriers have been installed successfully.",
      time: "Today • 10:30 AM",
    },
    milestones: [
      { id: 1, title: "Site Preparation", note: "Completed", state: "done" },
      {
        id: 2,
        title: "Traffic Control Installation",
        note: "In Progress • 35%",
        state: "active",
      },
      { id: 3, title: "Final Site Check", note: "Pending", state: "pending" },
    ],
    photos: [
      { id: 1, src: photoOne, caption: "Work Zone Setup", time: "Today • 9:45 AM" },
    ],
    // Set to true by the backend when the provider submits the final work.
    // The "Review Completion" button is only enabled when this is true.
    // MOCK: true so you can click through the whole flow.
    completionSubmitted: true,
  };
}

/* ------------------------------------------------------------------ */
/* REVIEW COMPLETION                                                   */
/* ------------------------------------------------------------------ */
export async function getCompletionData(projectId) {
  await delay();
  // TODO(API): GET /api/projects/:projectId/completion
  // The provider's final submission: checklist, evidence photos, date.
  return {
    completionDate: "2026-09-18",
    finalProgress: 100,
    checklist: [
      {
        id: 1,
        title: "Temporary Traffic Control (TTC) Service",
        note: "Implementation completed and verified.",
      },
      {
        id: 2,
        title: "Road Signs & Variable Message Signs",
        note: "Required road signs have been installed.",
      },
      {
        id: 3,
        title: "Final Site Inspection",
        note: "Final field inspection submitted by the provider.",
      },
    ],
    providerNote:
      "Provider submission: All planned traffic-control activities have been completed.",
    evidence: [
      { id: 1, src: photoTwo },
      { id: 2, src: photoThree },
    ],
    submittedOn: "2026-09-18",
  };
}

export async function approveCompletion(projectId) {
  await delay(400);
  // TODO(API): POST /api/projects/:projectId/complete
  // Backend should mark the project "completed" and notify the provider.
  return { projectId, status: "completed" };
}

export async function requestChanges(projectId, note) {
  await delay(400);
  // TODO(API): POST /api/projects/:projectId/request-changes  { note }
  // Backend should send the note to the provider and set status back to
  // "in_progress".
  return { projectId, status: "changes_requested", note };
}