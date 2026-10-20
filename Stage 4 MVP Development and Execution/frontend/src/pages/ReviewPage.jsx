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

const SIDEBAR_ITEMS = [
  {
    label: "Dashboard",
    path: "/contractor-dashboard",
    icon: LayoutDashboard,
  },
  {
    label: "My Projects",
    path: "/my-projects",
    icon: FolderKanban,
  },
  {
    label: "Create Project",
    path: "/create-project",
    icon: Plus,
  },
  {
    label: "Providers",
    path: "/providers",
    icon: Users,
  },
  {
    label: "Quotations",
    path: "/quotations",
    icon: FileText,
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