import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  FolderKanban,
  Plus,
  Users,
  FileText,
  MapPin,
  CalendarDays,
  Pencil,
  Check,
} from "lucide-react";

import Sidebar from "../components/Sidebar";
import Button from "../components/Button";
import MamarMap from "../components/MamarMap";
import { getSession } from "../services/auth";


const ICON_PATHS = {
  dashboard: (
    <>
      <rect x="3" y="3" width="7" height="7" rx="2" />
      <rect x="14" y="3" width="7" height="7" rx="2" />
      <rect x="3" y="14" width="7" height="7" rx="2" />
      <rect x="14" y="14" width="7" height="7" rx="2" />
    </>
  ),
  projects: (
    <>
      <rect x="3" y="7" width="18" height="13" rx="2" />
      <path d="M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2M3 12h18" />
    </>
  ),
  create: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 8v8M8 12h8" />
    </>
  ),
  providers: (
    <>
      <circle cx="9" cy="8" r="3.5" />
      <path d="M2.5 20c0-3.5 3-6 6.5-6s6.5 2.5 6.5 6" />
      <circle cx="17" cy="9" r="2.5" />
      <path d="M17 14c2.8 0 4.5 2 4.5 5" />
    </>
  ),
  quotations: (
    <>
      <path d="M6 3h9l4 4v14H6z" />
      <path d="M9 8h3M9 12h7M9 16h7" />
    </>
  ),
  info: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 11v6M12 7.5v.5" />
    </>
  ),
  help: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M9.5 9.5a2.5 2.5 0 1 1 3.5 2.3c-.7.4-1 .9-1 1.7M12 17v.5" />
    </>
  ),
  logout: <path d="M4 12h16M14 6l6 6-6 6" />,
  plus: <path d="M12 5v14M5 12h14" />,
  list: (
    <>
      <rect x="4" y="4" width="16" height="16" rx="2" />
      <path d="M4 9h16M4 14h16" />
    </>
  ),
  clock: (
    <>
      <circle cx="12" cy="12" r="9" />
      <path d="M12 7v5l3 2" />
    </>
  ),
  check: <path d="M5 12.5l4.5 4.5L19 7.5" />,
  dots: (
    <>
      <circle cx="9" cy="10" r="1" />
      <circle cx="15" cy="10" r="1" />
      <circle cx="12" cy="16" r="1" />
    </>
  ),
  triangle: <path d="M12 4l8 15H4z" />,
  target: (
    <>
      <circle cx="12" cy="12" r="5" />
      <path d="M12 3v4M12 17v4M3 12h4M17 12h4" />
    </>
  ),
  square: <rect x="6" y="6" width="12" height="12" rx="2" />,
  pin: (
    <>
      <path d="M12 21s-6-5.5-6-11a6 6 0 1 1 12 0c0 5.5-6 11-6 11z" />
      <circle cx="12" cy="10" r="2" />
    </>
  ),
  chevron: <path d="M9 6l6 6-6 6" />,
  more: (
    <>
      <circle cx="12" cy="5" r="1.2" />
      <circle cx="12" cy="12" r="1.2" />
      <circle cx="12" cy="19" r="1.2" />
    </>
  ),
};

function Icon({ name, size = 20 }) {
  return (
    <svg
      viewBox="0 0 24 24"
      width={size}
      height={size}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      focusable="false"
    >
      {ICON_PATHS[name]}
    </svg>
  );
}

const SERVICE_OPTIONS = [
  {
    id: "ttc-plan",
    title: "Temporary Traffic Control Plan (TTC) Service",
    description:
      "Planning and implementation services provided by qualified traffic-control providers.",
  },
  {
    id: "cones-barriers",
    title: "Traffic Cones & Barriers",
    description: "Supply and installation of traffic cones and barriers.",
  },
  {
    id: "road-signs",
    title: "Road Signs & Variable Message Signs",
    description:
      "Installation and rental of road signs and variable message signs.",
  },
];
const navIcon = (name) =>
    function NavIcon({ size }) {
    return <Icon name={name} size={size} />;
  };
const SIDEBAR_ITEMS = [

  {
    label: "Dashboard",
    path: "/contractor-dashboard",
    icon: navIcon('dashboard'),
  },
  {
    label: "My Projects",
    path: "/my-projects",
    icon: navIcon('projects'),
  },
  {
    label: "Create Project",
    path: "/create-project",
    icon: navIcon('create'),
  },
  {
    label: "Providers",
    path: "/providers",
    icon: navIcon('providers'),
  },
  {
    label: "Quotations",
    path: "/quotations",
    icon: navIcon('quotations'),
  },
];

function readProject() {
  try {
    return JSON.parse(
      sessionStorage.getItem("mamarNewProject")
    ) || {};
  } catch {
    return {};
  }
}

function formatDate(value) {
  if (!value) return "Not specified";

  const date = new Date(`${value}T00:00:00`);

  if (Number.isNaN(date.getTime())) {
    return value;
  }

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function ReviewPage() {
  const displayName = getSession()?.user?.full_name || "User";

  const navigate = useNavigate();

  const [project, setProject] = useState(readProject);

  const [error, setError] = useState("");
  const [savedMessage, setSavedMessage] = useState("");

  const selectedServices = Array.isArray(project.services)
    ? project.services
    : [];

  const services = SERVICE_OPTIONS.filter((service) =>
    selectedServices.includes(service.id)
  );

  const projectDates =
    project.startDate && project.endDate
      ? `${formatDate(project.startDate)} – ${formatDate(
          project.endDate
        )}`
      : "Not specified";

  function handleEditDetails() {
    navigate("/create-project");
  }

  function handleEditLocation() {
    navigate("/project-location");
  }

  function handleEditServices() {
    navigate("/select-service");
  }

  function handleSaveDraft() {
    try {
      sessionStorage.setItem(
        "mamarNewProject",
        JSON.stringify({
          ...project,
          status: "draft",
        })
      );

      setSavedMessage("Project draft saved successfully.");
      setError("");
    } catch {
      setError("Unable to save the project draft. Please try again.");
      setSavedMessage("");
    }
  }

  function handleConfirm() {
    if (
      !project.name ||
      !project.type ||
      !project.startDate ||
      !project.endDate
    ) {
      setError(
        "Project details are incomplete. Please edit the project details."
      );
      return;
    }

    if (
      project.latitude === null ||
      project.latitude === undefined ||
      project.longitude === null ||
      project.longitude === undefined
    ) {
      setError(
        "Please select a project location before continuing."
      );
      return;
    }

    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    const confirmedProject = {
      ...project,
      status: "submitted",
    };

    sessionStorage.setItem(
      "mamarNewProject",
      JSON.stringify(confirmedProject)
    );

    setProject(confirmedProject);
    setError("");

    // Provider matching will be connected here.
    navigate("/providers", {
      state: { project: confirmedProject },
    });
  }

  return (
    <div className="review-page">
      <Sidebar
        items={SIDEBAR_ITEMS}
        activePath="/create-project"
      />

      <main className="review-main">
        <header className="review-header">
          <div className="review-account">
            <div className="review-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="review-user-info">
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>

            <span className="review-chevron">⌄</span>
          </div>
        </header>

        <div className="review-content">
          <div className="review-heading">
            <h1>Review Project</h1>
            <p>
              Review your project details before finding the right
              traffic-control providers.
            </p>
          </div>

          <div className="review-progress">
            <ProgressStep
              number={<Check size={16} />}
              label="Project Details"
              status="completed"
            />

            <div className="review-progress-line completed" />

            <ProgressStep
              number={<Check size={16} />}
              label="Location"
              status="completed"
            />

            <div className="review-progress-line completed" />

            <ProgressStep
              number={<Check size={16} />}
              label="Service"
              status="completed"
            />

            <div className="review-progress-line completed" />

            <ProgressStep
              number="4"
              label="Review"
              status="active"
            />
          </div>

          <div className="review-grid">
            <section className="review-card review-details-card">
              <div className="review-card-heading">
                <div>
                  <h2>Project Details</h2>
                  <p>Basic information about your project.</p>
                </div>

                <button
                  type="button"
                  className="review-edit-button"
                  onClick={handleEditDetails}
                >
                  <Pencil size={15} />
                  Edit
                </button>
              </div>

              <ReviewField
                label="Project Name"
                value={project.name || "Not specified"}
              />

              <ReviewField
                label="Project Type"
                value={project.type || "Not specified"}
              />

              <ReviewField
                label="Project Dates"
                value={projectDates}
              />

              <ReviewField
                label="Description"
                value={project.description || "Not specified"}
              />
            </section>

            <section className="review-card review-location-card">
              <div className="review-card-heading">
                <div>
                  <h2>Project Location</h2>
                  <p>Selected location for the work zone.</p>
                </div>

                <button
                  type="button"
                  className="review-edit-button"
                  onClick={handleEditLocation}
                >
                  <Pencil size={15} />
                  Edit
                </button>
              </div>

              <div className="review-map">
                {project.latitude != null &&
                project.longitude != null ? (
                  <MamarMap
                    latitude={project.latitude}
                    longitude={project.longitude}
                    workZone={project.workZone}
                    readOnly
                  />
                ) : (
                  <div className="review-map-empty">
                    <MapPin size={28} />
                    <span>No location selected</span>
                  </div>
                )}
              </div>

              <div className="review-location-info">
                <MapPin size={18} />

                <div>
                  <strong>Project Location</strong>
                  <p>
                    {project.location || "No location selected"}
                  </p>

                  {project.latitude != null &&
                    project.longitude != null && (
                      <small>
                        {project.latitude}, {project.longitude}
                      </small>
                    )}
                </div>
              </div>
            </section>

            <section className="review-card review-services-card">
              <div className="review-card-heading">
                <div>
                  <h2>Selected Services</h2>
                  <p>
                    Services requested for this project.
                  </p>
                </div>

                <button
                  type="button"
                  className="review-edit-button"
                  onClick={handleEditServices}
                >
                  <Pencil size={15} />
                  Edit
                </button>
              </div>

              {services.length > 0 ? (
                <div className="review-services-list">
                  {services.map((service) => (
                    <div
                      className="review-service-item"
                      key={service.id}
                    >
                      <span className="review-service-check">
                        <Check size={16} />
                      </span>

                      <div>
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <p className="review-empty-services">
                  No services selected.
                </p>
              )}
            </section>
          </div>

          <section className="review-confirmation">
            <div className="review-confirmation-icon">
              <CalendarDays size={23} />
            </div>

            <div className="review-confirmation-text">
              <h2>Ready to continue?</h2>
              <p>
                Confirm your project details to continue to the
                provider selection process.
              </p>
            </div>
          </section>

          {error && (
            <p className="review-error" role="alert">
              {error}
            </p>
          )}

          {savedMessage && (
            <p className="review-success" role="status">
              {savedMessage}
            </p>
          )}

          <div className="review-actions">
            <Button
              variant="secondary"
              onClick={() => navigate("/select-service")}
            >
              ← Back
            </Button>

            <div className="review-actions-right">
              <Button
                variant="secondary"
                onClick={handleSaveDraft}
              >
                Save Draft
              </Button>

              <Button onClick={handleConfirm}>
                Confirm &amp; Find Providers →
              </Button>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProgressStep({ number, label, status }) {
  return (
    <div className={`review-progress-step ${status}`}>
      <span className="review-progress-number">{number}</span>
      <span className="review-progress-label">{label}</span>
    </div>
  );
}

function ReviewField({ label, value }) {
  return (
    <div className="review-field">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ReviewPage;