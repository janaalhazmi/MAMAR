// Provider page hooks and supporting actions.

// ============================================================================
// Imports
// ============================================================================

import {
  useParams as useDevicePageParams,
  useNavigate as useQuotationNavigate,
  useSearchParams as useQuotationSearchParams,
  useLocation,
} from "react-router-dom";
import {
  API_BASE_URL as EXECUTION_API_BASE_URL,
  fetchRequestWorkZone,
  postReturnToTeam,
  postSubmitCompletion,
  postDeviceVerify,
  fetchProviderWorkers,
  postAssignment,
  registerUser,
  sendPasscode,
} from "../api";
import { useSafetyChecks as useExecutionSafetyChecks } from "../ai";
import {
  declineProviderRequest as declineQuotationRequest,
  submitProviderQuotation as submitQuotationOffer,
  getOpenRequestById,
  getProviderDashboard,
} from "./providerQuotes";
import * as providerProfileService from "../Contractor/profileService";
import { PROVIDERS as PROVIDER_DIRECTORY } from "../Contractor/Contractor";
import { useEffect, useState, useRef } from "react";
import { getProviderProjects } from "./providerFlow";
import { getSession } from "../auth";

// ============================================================================
// Shared configuration
// ============================================================================

const apiUrl = (
  import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com"
).replace(/\/+$/, "");

// ============================================================================
// Provider Dashboard
// ============================================================================

const DASHBOARD_API_URL = (
  import.meta.env.VITE_API_URL || "https://mamar-api.onrender.com"
).replace(/\/+$/, "");

function getDashboardProfilePictureUrl(user) {
  const path =
    user?.profile_picture_url ||
    user?.profile_picture ||
    user?.avatar_url ||
    "";

  if (!path) return "";
  if (/^https?:\/\//i.test(path)) return path;

  return `${DASHBOARD_API_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function useProviderDashboard(readSession, loadDashboard) {
  const user = readSession()?.user;
  const displayName = user?.full_name || "Provider";
  const initials = displayName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;

    loadDashboard()
      .then((result) => active && setData(result))
      .catch(
        (err) =>
          active && setError(err.message || "Could not load your dashboard."),
      )
      .finally(() => active && setLoading(false));

    return () => {
      active = false;
    };
  }, [loadDashboard]);

  return { displayName, initials, data, loading, error };
}

export function useProviderDashboardPage() {
  // Read the success message received after quotation submission.
  const location = useLocation();
  const [successMessage] = useState(() => location.state?.successMessage || "");

  useEffect(() => {
    if (location.state?.successMessage) {
      window.history.replaceState({ ...window.history.state, usr: null }, "");
    }
  }, [location.state]);

  // Load provider identity and dashboard data.
  const { displayName, initials, data, loading, error } = useProviderDashboard(
    getSession,
    getProviderDashboard,
  );

  // Keep the top-bar avatar in sync when the profile picture is changed.
  const [sessionUser, setSessionUser] = useState(
    () => getSession()?.user || {},
  );

  useEffect(() => {
    let active = true;
    function handleUserUpdate(event) {
      if (event.detail) {
        setSessionUser((current) => ({
          ...current,
          ...event.detail,
        }));
      }
    }
    window.addEventListener("mamar:session-user-updated", handleUserUpdate);
    async function loadUserProfile() {
      try {
        const profile = await providerProfileService.fetchMyProfile();
        if (!active) return;
        setSessionUser((current) => ({
          ...current,
          ...profile,
        }));
        window.dispatchEvent(
          new CustomEvent("mamar:session-user-updated", {
            detail: profile,
          }),
        );
      } catch (error) {
        console.error("Unable to load provider profile:", error);
      }
    }
    loadUserProfile();
    return () => {
      active = false;
      window.removeEventListener(
        "mamar:session-user-updated",
        handleUserUpdate,
      );
    };
  }, []);

  const picture = getDashboardProfilePictureUrl(sessionUser);

  // Prepare project statistics and summary cards.
  const stats = data?.stats || {
    assigned: 0,
    active: 0,
    upcoming: 0,
    completed: 0,
  };

  const summaryCards = [
    {
      label: "Assigned Projects",
      value: stats.assigned,
      icon: "＋",
      color: "yellow",
    },
    {
      label: "Active Execution",
      value: stats.active,
      icon: "✓",
      color: "green",
    },
    { label: "Upcoming", value: stats.upcoming, icon: "⟳", color: "blue" },
    {
      label: "Completed Projects",
      value: stats.completed,
      icon: "✓",
      color: "gray",
    },
  ];

  // Prepare dashboard sections with empty-state defaults.
  const newRequests = data?.newRequests || [];
  const newProject = data?.newProject || null;
  const activeProjects = data?.activeProjects || [];
  const overview = data?.overview || { workersActive: 0, sitesActive: 0 };

  return {
    displayName,
    initials,
    picture,
    successMessage,
    loading,
    error,
    summaryCards,
    newRequests,
    newProject,
    activeProjects,
    overview,
  };
}

// ============================================================================
// Provider Projects
// ============================================================================

const PROVIDER_PROJECT_STATUS_LABELS = {
  active: "Active",
  upcoming: "Upcoming",
  completed: "Completed",
};

function toRow(project) {
  return { ...project, status: String(project.status || "").toLowerCase() };
}

export function useProviderProjects(given) {
  const [loaded, setLoaded] = useState(null);
  const [loading, setLoading] = useState(!given);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    if (given) return undefined;

    let active = true;

    getProviderProjects()
      .then((rows) => {
        if (active) setLoaded(rows.map(toRow));
      })
      .catch((error) => {
        if (active) {
          setLoadError(error.message || "Could not load your projects.");
        }
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [given]);

  const projects = given || loaded || [];

  return { projects, loading, loadError };
}

export function useProviderProjectsPage(given) {
  const { projects, loading, loadError } = useProviderProjects(given);
  const [filter, setFilter] = useState("all");
  const [search, setSearch] = useState("");

  const statuses = PROVIDER_PROJECT_STATUS_LABELS;
  const counts = {
    all: projects.length,
    active: 0,
    upcoming: 0,
    completed: 0,
  };

  for (const project of projects) {
    if (Object.hasOwn(statuses, project.status)) {
      counts[project.status] += 1;
    }
  }

  const query = search.trim().toLowerCase();
  const visibleProjects = projects
    .filter((project) => {
      const matchesStatus = filter === "all" || project.status === filter;
      const matchesSearch = [
        project.name,
        project.reference,
        project.location,
      ].some((value) =>
        String(value ?? "")
          .toLowerCase()
          .includes(query),
      );

      return matchesStatus && matchesSearch;
    })
    .map((project) => ({
      ...project,
      progress: Number.isFinite(project.progress)
        ? Math.max(0, Math.min(100, project.progress))
        : null,
      completed: project.status === "completed",
      referenceLabel: [project.reference, project.location]
        .filter(Boolean)
        .join(" · "),
    }));

  return {
    projects,
    loading,
    loadError,
    filter,
    setFilter,
    search,
    setSearch,
    counts,
    statuses,
    visibleProjects,
  };
}

// ============================================================================
// Prepare Quotation
// ============================================================================

const PROVIDER_QUOTATION_INITIAL_SERVICES = [
  {
    id: 1,
    name: "Traffic Barriers",
    quantity: 20,
    unitPrice: 150,
  },
  {
    id: 2,
    name: "Traffic Cones",
    quantity: 10,
    unitPrice: 80,
  },
  {
    id: 3,
    name: "Temporary Road Signs",
    quantity: 5,
    unitPrice: 200,
  },
];

export function useQuotationRequest(requestId) {
  const [workZone, setWorkZone] = useState(null);
  const [requestDetails, setRequestDetails] = useState(null);
  const [realRequest, setRealRequest] = useState(null);
  const [workZoneError, setWorkZoneError] = useState("");

  useEffect(() => {
    let cancelled = false;

    const loadQuotationRequest = async () => {
      setRequestDetails(null);
      setRealRequest(null);
      setWorkZone(null);
      setWorkZoneError("");

      if (!requestId) {
        setWorkZoneError("Missing request ID.");
        return;
      }

      const accessToken = getSession()?.access_token;

      if (!accessToken) {
        setWorkZoneError("Please sign in again.");
        return;
      }

      try {
        const actualRequest = await getOpenRequestById(requestId);
        if (cancelled) return;
        setRealRequest(actualRequest);
      } catch (error) {
        console.error("Failed to load request details:", error);
      }

      try {
        const data = await fetchRequestWorkZone(accessToken, requestId);

        if (cancelled) return;

        setRequestDetails(data);
        setWorkZone(data?.work_zone ?? null);
      } catch (error) {
        if (cancelled) return;

        console.error("Failed to load work zone:", error);
        setWorkZoneError(error.message || "Failed to load work zone.");
      }
    };

    loadQuotationRequest();

    return () => {
      cancelled = true;
    };
  }, [requestId]);

  return { requestDetails, realRequest, workZone, workZoneError };
}

export function usePrepareQuotationPage() {
  // Provider account display values.
  const providerName = getSession()?.user?.full_name?.trim() || "Provider";
  const providerInitials = providerName
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0].toUpperCase())
    .join("");

  // Navigation and selected service request.
  const navigate = useQuotationNavigate();
  const [searchParams] = useQuotationSearchParams();
  const requestId = searchParams.get("requestId");
  // Form state and duplicate submission guard.
  const submitting = useRef(false);
  const [services, setServices] = useState(PROVIDER_QUOTATION_INITIAL_SERVICES);
  const [delivery, setDelivery] = useState(1200);
  const [showWorkZone, setShowWorkZone] = useState(false);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const { requestDetails, realRequest, workZone, workZoneError } =
    useQuotationRequest(requestId);

  const handleWorkZoneSelect = (polygon) => {
    sessionStorage.setItem("providerWorkZone", JSON.stringify(polygon));
  };

  // Update the selected service quantity.
  const handleQuantityChange = (id, value) => {
    const newQuantity = Number(value);

    setServices((currentServices) =>
      currentServices.map((service) =>
        service.id === id
          ? {
              ...service,
              quantity: Number.isNaN(newQuantity) ? 0 : newQuantity,
            }
          : service,
      ),
    );
  };

  // Update the selected service unit price.
  const handleUnitPriceChange = (id, value) => {
    const newPrice = Number(value);

    setServices((currentServices) =>
      currentServices.map((service) =>
        service.id === id
          ? {
              ...service,
              unitPrice: Number.isNaN(newPrice) ? 0 : newPrice,
            }
          : service,
      ),
    );
  };

  // Calculate service and delivery totals.
  const subtotal = services.reduce(
    (total, service) => total + service.quantity * service.unitPrice,
    0,
  );

  const total = subtotal + Number(delivery || 0);

  // Collect the current quotation values.
  const getQuotationData = () => ({
    requestId,
    services,
    delivery,
    subtotal,
    total,
    location: selectedLocation,
    workZone,
    notes: document.querySelector(".quotation-notes textarea")?.value || "",
    validUntil: document.querySelector(".quotation-date")?.value || "",
  });

  // Decline the request and return to the dashboard.
  const handleDeclineRequest = async () => {
    if (!requestId || submitting.current) return;

    submitting.current = true;
    try {
      await declineQuotationRequest(requestId);
      navigate("/provider-dashboard", {
        replace: true,
        state: { successMessage: "Request declined successfully." },
      });
    } catch (error) {
      window.alert(error.message || "Could not save your decision.");
    } finally {
      submitting.current = false;
    }
  };

  // Validate and submit the quotation.
  const handleSubmitQuotation = async () => {
    if (submitting.current) return;

    if (!requestId) {
      alert("Open this quotation from a service request.");
      return;
    }

    const quotation = getQuotationData();
    const hasInvalidService = quotation.services.some(
      ({ quantity, unitPrice }) =>
        !Number.isFinite(quantity) ||
        quantity <= 0 ||
        !Number.isFinite(unitPrice) ||
        unitPrice <= 0,
    );

    if (
      hasInvalidService ||
      !Number.isFinite(quotation.total) ||
      quotation.total <= 0
    ) {
      alert("Please enter a valid quantity and unit price for all services.");
      return;
    }

    submitting.current = true;
    try {
      const request = await getOpenRequestById(requestId);
      if (!request?.projectId) {
        throw new Error("This request is no longer available for quotation.");
      }

      const start = Date.parse(request.startDate?.slice(0, 10) ?? "");
      const end = Date.parse(request.endDate?.slice(0, 10) ?? "");
      const durationDays = (end - start) / 86400000 + 1;

      if (!Number.isInteger(durationDays) || durationDays < 1) {
        throw new Error("The request needs valid start and end dates.");
      }

      const notes = [
        quotation.notes,
        ...quotation.services.map(
          ({ name, quantity, unitPrice }) =>
            name + ": " + quantity + " × SAR " + unitPrice,
        ),
        "Delivery: SAR " + quotation.delivery,
        quotation.validUntil && "Valid until: " + quotation.validUntil,
      ]
        .filter(Boolean)
        .join("\n");

      await submitQuotationOffer({
        request,
        price: quotation.total,
        durationDays,
        notes,
      });
      localStorage.removeItem("providerQuotationDraft");
      navigate("/provider-dashboard", {
        replace: true,
        state: { successMessage: "Quotation submitted successfully." },
      });
    } catch (error) {
      alert(
        error.message || "Could not submit the quotation. Please try again.",
      );
    } finally {
      submitting.current = false;
    }
  };

  return {
    providerName,
    providerInitials,
    requestId,
    services,
    delivery,
    setDelivery,
    showWorkZone,
    setShowWorkZone,
    requestDetails,
    realRequest,
    workZone,
    workZoneError,
    handleQuantityChange,
    handleUnitPriceChange,
    subtotal,
    total,
    handleDeclineRequest,
    handleSubmitQuotation,
  };
}

// ============================================================================
// Execution Details
// ============================================================================

export async function fetchProjectMilestones(token, projectId) {
  const response = await fetch(
    `${apiUrl}/provider/projects/${encodeURIComponent(projectId)}/milestones`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    },
  );

  if (!response.ok) {
    throw new Error(`Could not load milestones (${response.status}).`);
  }

  return response.json();
}

export async function updateProjectMilestone(
  token,
  projectId,
  milestoneId,
  status,
) {
  const response = await fetch(
    `${apiUrl}/provider/projects/${encodeURIComponent(
      projectId,
    )}/milestones/${encodeURIComponent(milestoneId)}`,
    {
      method: "PATCH",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ status }),
    },
  );

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.detail || "Could not update milestone.");
  }

  return response.json();
}

export function useProviderProjectDetails(projectId) {
  const session = getSession();
  const token = session?.access_token;
  const name = session?.user?.full_name || "Provider";

  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "P";

  const [result, setResult] = useState(null);
  const [reviewBusy, setReviewBusy] = useState(false);
  const [reviewError, setReviewError] = useState("");
  const [reviewNotice, setReviewNotice] = useState("");
  const [note, setNote] = useState("");

  // Milestones state.
  const [milestones, setMilestones] = useState([]);
  const [milestonesLoading, setMilestonesLoading] = useState(true);
  const [milestonesError, setMilestonesError] = useState("");
  const [milestoneBusy, setMilestoneBusy] = useState(null);
  const [milestoneNotice, setMilestoneNotice] = useState("");

  // Load project milestones.
  useEffect(() => {
    let active = true;

    async function loadMilestones() {
      setMilestonesLoading(true);
      setMilestonesError("");

      try {
        if (!projectId) {
          throw new Error("No project was selected.");
        }

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const data = await fetchProjectMilestones(token, projectId);

        if (active) {
          setMilestones(data);
        }
      } catch (error) {
        if (active) {
          setMilestonesError(error.message || "Could not load milestones.");
        }
      } finally {
        if (active) {
          setMilestonesLoading(false);
        }
      }
    }

    loadMilestones();

    return () => {
      active = false;
    };
  }, [projectId, token]);

  // Update a milestone.
  async function updateMilestone(milestoneId, status) {
    if (milestoneBusy !== null) return;

    setMilestoneBusy(milestoneId);
    setMilestonesError("");
    setMilestoneNotice("");

    try {
      const updated = await updateProjectMilestone(
        token,
        projectId,
        milestoneId,
        status,
      );

      setMilestones((current) =>
        current.map((item) =>
          item.milestone_id === milestoneId ? updated : item,
        ),
      );

      setMilestoneNotice("Milestone updated successfully.");
    } catch (error) {
      setMilestonesError(error.message || "Could not update milestone.");
    } finally {
      setMilestoneBusy(null);
    }
  }

  // Field worker -> provider -> contractor.
  async function review(action) {
    if (reviewBusy) return;

    if (action === "return" && !note.trim()) {
      setReviewError("Write a note for the field team first.");
      return;
    }

    setReviewBusy(true);
    setReviewError("");
    setReviewNotice("");

    try {
      const data =
        action === "submit"
          ? await postSubmitCompletion(token, projectId)
          : await postReturnToTeam(token, projectId, note.trim());

      setResult({ projectId, token, data });
      setNote("");

      setReviewNotice(
        action === "submit"
          ? "Sent to the contractor for review."
          : "Returned to the field team with your note.",
      );
    } catch (error) {
      setReviewError(
        error.message || "Could not update the project. Please try again.",
      );
    } finally {
      setReviewBusy(false);
    }
  }

  // Load project details.
  useEffect(() => {
    const controller = new AbortController();

    async function load() {
      try {
        if (!projectId) {
          throw new Error("No project was selected.");
        }

        if (!token) {
          throw new Error("Please sign in to continue.");
        }

        const response = await fetch(
          `${apiUrl}/provider/projects/${encodeURIComponent(projectId)}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
            signal: controller.signal,
          },
        );

        if (!response.ok) {
          throw new Error(`Could not load this project (${response.status}).`);
        }

        const data = await response.json();

        if (!controller.signal.aborted) {
          setResult({ projectId, token, data });
        }
      } catch (error) {
        if (!controller.signal.aborted) {
          setResult({ projectId, token, error: error.message });
        }
      }
    }

    load();

    return () => controller.abort();
  }, [projectId, token]);

  const current =
    result?.projectId === projectId && result?.token === token ? result : null;

  const details = current?.data;
  const project = details?.project;

  return {
    name,
    initials,
    current,
    details,
    project,

    note,
    setNote,
    review,
    reviewBusy,
    reviewError,
    reviewNotice,

    milestones,
    milestonesLoading,
    milestonesError,
    milestoneBusy,
    milestoneNotice,
    updateMilestone,
  };
}

export function getProviderSitePhotoUrl(photo) {
  const path = photo.url || photo.photo_url;
  if (!path) return "";

  let src;
  try {
    src = new URL(path, EXECUTION_API_BASE_URL.replace(/\/+$/, "") + "/").href;
  } catch {
    return "";
  }

  return src;
}

export function useProviderExecutionPage(projectId) {
  const state = useProviderProjectDetails(projectId);
  const progress = Math.max(
    0,
    Math.min(100, Number(state.details?.progress) || 0),
  );
  const team = state.details?.team ?? [];
  const photos = state.details?.photos ?? [];
  const safety = useExecutionSafetyChecks(
    state.project?.project_id,
    photos.length,
  );

  return {
    ...state,
    progress,
    team,
    photos,
    safety,
  };
}

// ============================================================================
// Device Verification
// ============================================================================

export function useDeviceVerificationProjects() {
  const [projects, setProjects] = useState(null);
  const [loadError, setLoadError] = useState("");

  useEffect(() => {
    let active = true;

    getProviderProjects()
      .then((items) => {
        if (active) setProjects(items);
      })
      .catch(() => {
        if (active) setLoadError("Could not load your projects.");
      });

    return () => {
      active = false;
    };
  }, []);

  return { projects, loadError };
}

export async function verifyProviderDevice(deviceId, projectId, location) {
  const token = getSession()?.access_token;

  if (!token) {
    throw new Error("Please sign in again.");
  }

  try {
    return await postDeviceVerify(token, deviceId.trim(), {
      project_id: Number(projectId),
      ...location,
    });
  } catch (error) {
    if (error.status === 403) {
      throw new Error(
        "This account does not have permission to verify this device.",
      );
    }

    if (error.status) {
      throw new Error(
        "Verification failed (" +
          error.status +
          "). Check the device ID and project.",
      );
    }

    throw error;
  }
}

export function useProviderDeviceVerificationPage() {
  const { projectId } = useDevicePageParams();
  const { projects, loadError } = useDeviceVerificationProjects();

  const name = getSession()?.user?.full_name || "Provider";
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "P";

  const matchedProject = projects?.find(
    (project) => String(project.id) === projectId,
  );

  // Prepare the existing progress value for the project summary.
  const selected = matchedProject
    ? {
        ...matchedProject,
        displayProgress: Math.max(
          0,
          Math.min(100, Number(matchedProject.progress) || 0),
        ),
      }
    : matchedProject;

  return {
    projectId,
    projects,
    loadError,
    name,
    initials,
    selected,
  };
}

// ============================================================================
// Field Team
// ============================================================================

export const PROVIDER_WORKER_STATUSES = ["Active", "Available", "On Leave"];

export function getFieldTeamInitials(name) {
  return (
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((word) => word.charAt(0).toUpperCase())
      .join("") || "P"
  );
}

export function useProviderFieldWorkers() {
  const [workers, setWorkers] = useState([]);
  const [loadingWorkers, setLoadingWorkers] = useState(true);
  const [workersError, setWorkersError] = useState("");

  useEffect(() => {
    let active = true;

    async function loadWorkers() {
      try {
        const token = getSession()?.access_token;

        if (!token) {
          throw new Error("Please sign in again.");
        }

        const data = await fetchProviderWorkers(token);

        if (!Array.isArray(data)) {
          throw new Error("Could not read the field team response.");
        }

        const loadedWorkers = data.map((worker) => ({
          id: worker.user_id,
          name: worker.full_name,
          email: worker.email,
          phone: worker.phone,
          project: worker.project?.project_name || "",
          status: worker.status,
          activity: worker.last_activity
            ? new Date(worker.last_activity).toLocaleString("en-GB")
            : "—",
        }));

        if (active) setWorkers(loadedWorkers);
      } catch (error) {
        if (active) {
          setWorkersError(error.message || "Could not load field workers.");
        }
      } finally {
        if (active) setLoadingWorkers(false);
      }
    }

    loadWorkers();

    return () => {
      active = false;
    };
  }, []);

  return { workers, setWorkers, loadingWorkers, workersError };
}

export function useWorkerAssignmentProjects(canAssign, setError) {
  const [projects, setProjects] = useState(null);

  useEffect(() => {
    if (!canAssign) return;

    let active = true;

    getProviderProjects()
      .then((items) => {
        if (active) {
          setProjects(
            items.filter(
              (item) => item.status === "Active" || item.status === "Upcoming",
            ),
          );
        }
      })
      .catch(() => {
        if (active) setError("Could not load assigned projects.");
      });

    return () => {
      active = false;
    };
  }, [canAssign, setError]);

  return projects;
}

export async function assignProviderWorker(projectId, workerId) {
  const token = getSession()?.access_token;

  if (!token) {
    throw new Error("Please sign in again.");
  }

  return postAssignment(token, projectId, workerId);
}

export function useFieldWorkerRegistration(onCreated) {
  const [worker, setWorker] = useState(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState(false);

  // The robot check token for the sign up of the worker.
  const [captcha, setCaptcha] = useState("");
  const [captchaReset, setCaptchaReset] = useState(0);

  async function submit(event) {
    event.preventDefault();

    if (busy || created) return;

    const fields = new FormData(event.currentTarget);

    setBusy(true);
    setError("");

    try {
      if (worker) {
        const passcode = String(fields.get("passcode") || "").trim();

        if (!/^\d{6}$/.test(passcode)) {
          throw new Error("Enter the 6-digit passcode.");
        }

        const registered = await registerUser(worker, passcode, captcha);
        const user = registered?.user ?? registered;
        const email = worker.email.trim().toLowerCase();

        onCreated({
          id: user?.user_id ?? user?.id ?? email,
          name: user?.full_name ?? worker.full_name,
          email,
          phone: user?.phone ?? worker.phone,
          project: "",
          status: "Available",
          activity: "—",
        });

        setWorker(null);
        setCreated(true);
        return;
      }

      const session = getSession();

      const providerId = Number(
        session?.user?.provider_id ?? session?.provider_id,
      );

      if (!Number.isInteger(providerId) || providerId < 1) {
        throw new Error("Your session is missing the company provider ID.");
      }

      const fullName = String(fields.get("full_name") || "").trim();

      if (!fullName) {
        throw new Error("Enter the worker's full name.");
      }

      const registration = {
        full_name: fullName,
        email: String(fields.get("email") || "").trim(),
        password: String(fields.get("password") || ""),
        phone: String(fields.get("phone") || "").trim() || null,
        role: "worker",
        provider_id: providerId,
      };

      await sendPasscode(registration.email);
      setWorker(registration);
    } catch (failure) {
      setError(failure.message || "Could not register the field worker.");
      setCaptchaReset((count) => count + 1);
    } finally {
      setBusy(false);
    }
  }

  return {
    worker,
    busy,
    error,
    created,
    submit,
    setCaptcha,
    captchaReset,
  };
}

export function useProviderFieldTeamPage() {
  const statuses = PROVIDER_WORKER_STATUSES;

  const { workers, setWorkers, loadingWorkers, workersError } =
    useProviderFieldWorkers();

  const name = getSession()?.user?.full_name || "Provider";
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [project, setProject] = useState("");
  const [selected, setSelected] = useState(null);
  const [addingWorker, setAddingWorker] = useState(false);
  const projects = [
    ...new Set(workers.map((worker) => worker.project).filter(Boolean)),
  ];

  function addRegisteredWorker(worker) {
    setWorkers((current) => [
      ...current.filter((item) => item.email !== worker.email),
      worker,
    ]);
  }

  const query = search.trim().toLowerCase();
  const visible = workers.filter(
    (worker) =>
      (!status || worker.status === status) &&
      (!project || worker.project === project) &&
      [worker.name, worker.id, worker.email].some((value) =>
        String(value).toLowerCase().includes(query),
      ),
  );

  const stats = [
    ["Total Workers", workers.length, "Registered workers"],
    ...statuses.map((item, index) => [
      item === "On Leave" ? item : item + " Workers",
      workers.filter((worker) => worker.status === item).length,
      [
        "Assigned to projects",
        "Ready for assignment",
        "Temporarily unavailable",
      ][index],
    ]),
  ];

  // Synchronize the selected worker and directory after assignment.
  function handleWorkerAssigned(project) {
    const updated = {
      ...selected,
      project: project.name,
      status: "Active",
    };

    setWorkers((current) =>
      current.map((item) => (item.id === updated.id ? updated : item)),
    );
    setSelected(updated);
  }

  return {
    workers,
    loadingWorkers,
    workersError,
    name,
    search,
    setSearch,
    status,
    setStatus,
    project,
    setProject,
    selected,
    setSelected,
    addingWorker,
    setAddingWorker,
    projects,
    addRegisteredWorker,
    visible,
    stats,
    handleWorkerAssigned,
  };
}

export function useProviderWorkerAssignment(worker, onAssigned) {
  const [projectId, setProjectId] = useState("");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const workerId = Number(worker.id);
  const canAssign =
    !worker.project && Number.isSafeInteger(workerId) && workerId > 0;

  const projects = useWorkerAssignmentProjects(canAssign, setError);

  async function assign(event) {
    event.preventDefault();
    const project = projects?.find((item) => String(item.id) === projectId);
    if (!canAssign || !project || saving) return;

    setSaving(true);
    setError("");

    try {
      await assignProviderWorker(project.id, workerId);
      onAssigned(project);
    } catch (failure) {
      setError(failure.message || "Could not assign the worker.");
    } finally {
      setSaving(false);
    }
  }

  return {
    projectId,
    setProjectId,
    saving,
    error,
    canAssign,
    projects,
    assign,
  };
}

// ============================================================================
// Provider Profile
// ============================================================================

const {
  fetchMyProfile,
  updateMyProfile,
  changeMyPassword,
  uploadMyProfilePicture,
  deleteMyProfilePicture,
} = providerProfileService;

const EMPTY_PROVIDER_PROFILE = {
  full_name: "",
  email: "",
  phone: "",
  role: "provider",
  profile_picture: "",
  created_at: "",
};

export function getProviderCompanyName(profile) {
  if (profile?.company_name) return profile.company_name;
  if (profile?.provider_id == null) return "";

  return (
    PROVIDER_DIRECTORY.find(
      (company) => String(company.id) === String(profile.provider_id),
    )?.name ?? ""
  );
}

function getProviderProfileErrorMessage(error, fallback) {
  return error?.message || fallback;
}

function getProviderProfilePictureUrl(profile) {
  const path =
    profile?.profile_picture_url ||
    profile?.profile_picture ||
    profile?.avatar_url ||
    "";

  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  return `${apiUrl}${path.startsWith("/") ? "" : "/"}${path}`;
}

function formatProviderProfileDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  return Number.isNaN(date.getTime())
    ? value
    : date.toLocaleDateString("en-GB", {
        day: "numeric",
        month: "long",
        year: "numeric",
      });
}

function notifyProviderShellUser(user) {
  if (typeof window === "undefined") return;

  window.dispatchEvent(
    new CustomEvent("mamar:session-user-updated", {
      detail: user,
    }),
  );
}

export function useProviderProfile() {
  const [profile, setProfile] = useState(EMPTY_PROVIDER_PROFILE);

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
  });

  const [passwords, setPasswords] = useState({
    current_password: "",
    new_password: "",
    confirm_password: "",
  });

  const [loading, setLoading] = useState(true);
  const [savingProfile, setSavingProfile] = useState(false);
  const [savingPassword, setSavingPassword] = useState(false);
  const [pictureBusy, setPictureBusy] = useState(false);
  const [editing, setEditing] = useState(false);

  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");

  const fileInput = useRef(null);

  async function loadProfile() {
    setLoading(true);
    setError("");

    try {
      const user = await fetchMyProfile();

      const updatedProfile = {
        ...EMPTY_PROVIDER_PROFILE,
        ...user,
      };

      setProfile(updatedProfile);

      setForm({
        full_name: user?.full_name || "",
        email: user?.email || "",
        phone: user?.phone || "",
      });

      notifyProviderShellUser(updatedProfile);

      return updatedProfile;
    } catch (err) {
      setError(
        getProviderProfileErrorMessage(err, "Unable to load your profile."),
      );

      return null;
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadProfile();
  }, []);

  function updateField(event) {
    const { name, value } = event.target;

    setForm((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleSaveProfile(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!form.full_name.trim() || !form.email.trim()) {
      setError("Name and email are required.");
      return;
    }

    setSavingProfile(true);

    try {
      const updated = await updateMyProfile({
        full_name: form.full_name.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim() || null,
      });

      const updatedProfile = {
        ...profile,
        ...updated,
      };

      setProfile(updatedProfile);

      setForm({
        full_name: updated.full_name ?? form.full_name.trim(),
        email: updated.email ?? form.email.trim().toLowerCase(),
        phone: updated.phone ?? form.phone.trim(),
      });

      notifyProviderShellUser(updatedProfile);

      setEditing(false);
      setSuccess("Your profile details have been updated.");
    } catch (err) {
      setError(
        getProviderProfileErrorMessage(err, "Unable to update your profile."),
      );
    } finally {
      setSavingProfile(false);
    }
  }

  function handleCancelEdit() {
    setForm({
      full_name: profile.full_name || "",
      email: profile.email || "",
      phone: profile.phone || "",
    });

    setEditing(false);
    setError("");
  }

  function updatePasswordField(event) {
    const { name, value } = event.target;

    setPasswords((current) => ({
      ...current,
      [name]: value,
    }));
  }

  async function handleChangePassword(event) {
    event.preventDefault();

    setError("");
    setSuccess("");

    if (!passwords.current_password || !passwords.new_password) {
      setError("Enter your current password and a new password.");
      return;
    }

    if (passwords.new_password.length < 8) {
      setError("Your new password must contain at least 8 characters.");
      return;
    }

    if (passwords.new_password !== passwords.confirm_password) {
      setError("The new password and confirmation do not match.");
      return;
    }

    setSavingPassword(true);

    try {
      await changeMyPassword(
        passwords.current_password,
        passwords.new_password,
      );

      setPasswords({
        current_password: "",
        new_password: "",
        confirm_password: "",
      });

      setSuccess("Your password has been changed.");
    } catch (err) {
      setError(
        getProviderProfileErrorMessage(err, "Unable to change your password."),
      );
    } finally {
      setSavingPassword(false);
    }
  }

  async function handlePictureSelected(event) {
    const file = event.target.files?.[0];

    event.target.value = "";

    if (!file) return;

    if (!file.type.startsWith("image/")) {
      setError("Please select an image file.");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("The image must be 5 MB or smaller.");
      return;
    }

    setError("");
    setSuccess("");
    setPictureBusy(true);

    try {
      await uploadMyProfilePicture(file);

      const updatedProfile = await fetchMyProfile();

      const nextProfile = {
        ...EMPTY_PROVIDER_PROFILE,
        ...updatedProfile,
      };

      setProfile(nextProfile);
      notifyProviderShellUser(nextProfile);

      setSuccess("Your profile picture has been updated.");
    } catch (err) {
      setError(
        getProviderProfileErrorMessage(
          err,
          "Unable to upload your profile picture.",
        ),
      );
    } finally {
      setPictureBusy(false);
    }
  }

  async function handleDeletePicture() {
    setError("");
    setSuccess("");
    setPictureBusy(true);

    try {
      await deleteMyProfilePicture();

      const updatedProfile = await fetchMyProfile();

      const nextProfile = {
        ...EMPTY_PROVIDER_PROFILE,
        ...updatedProfile,
      };

      setProfile(nextProfile);
      notifyProviderShellUser(nextProfile);

      setSuccess("Your profile picture has been removed.");
    } catch (err) {
      setError(
        getProviderProfileErrorMessage(
          err,
          "Unable to remove your profile picture.",
        ),
      );
    } finally {
      setPictureBusy(false);
    }
  }

  const picture = getProviderProfilePictureUrl(profile);

  const initial = (profile.full_name || "U").trim().charAt(0).toUpperCase();

  const companyName = getProviderCompanyName(profile) || "—";

  return {
    profile,
    form,
    passwords,
    loading,
    savingProfile,
    savingPassword,
    pictureBusy,
    editing,
    error,
    success,
    fileInput,
    picture,
    initial,
    setEditing,
    updateField,
    updatePasswordField,
    handleSaveProfile,
    handleCancelEdit,
    handleChangePassword,
    handlePictureSelected,
    handleDeletePicture,
    formatDate: formatProviderProfileDate,
    companyName,
  };
}

export { providerProfileService };
