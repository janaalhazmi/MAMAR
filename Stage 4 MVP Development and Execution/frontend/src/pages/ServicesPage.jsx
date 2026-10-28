import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";
import { getSession, logout } from "../services/auth";

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
    icon: "A",
    title: "Temporary Traffic Control Plan (TTC) Service",
    description:
      "Planning and implementation services provided by qualified traffic-control providers.",
    tags: ["Traffic Management Plan", "Site Setup"],
  },
  {
    id: "cones-barriers",
    icon: "▥",
    title: "Traffic Cones & Barriers",
    description: "Supply and installation of traffic cones and barriers.",
    tags: ["Cones", "Road Barriers"],
  },
  {
    id: "road-signs",
    icon: "⚠",
    title: "Road Signs & Variable Message Signs",
    description:
      "Installation and rental of road signs and variable message signs.",
    tags: ["Road Signs", "Variable Message Signs"],
  },
];

function readProject() {
  try {
    return JSON.parse(sessionStorage.getItem("mamarNewProject")) || {};
  } catch {
    return {};
  }
}

function ServicesPage() {
  const displayName = getSession()?.user?.full_name || "User";

  const navigate = useNavigate();

  const [project] = useState(readProject);

  const [selectedServices, setSelectedServices] = useState(() => {
    const saved = readProject();

    return Array.isArray(saved.services)
      ? saved.services
      : ["ttc-plan", "road-signs"];
  });

  const [error, setError] = useState("");

  function toggleService(serviceId) {
    setSelectedServices((current) => {
      if (current.includes(serviceId)) {
        return current.filter((id) => id !== serviceId);
      }

      return [...current, serviceId];
    });

    setError("");
  }

  function handleNext() {
    if (selectedServices.length === 0) {
      setError("Please select at least one service.");
      return;
    }

    const updatedProject = {
      ...readProject(),
      services: selectedServices,
    };

    sessionStorage.setItem(
      "mamarNewProject",
      JSON.stringify(updatedProject)
    );

    navigate("/review");
  }

  function formatDate(value) {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  }

  const projectName = project.name || "King Fahd Road – Water Line";
  const projectType = project.type || "Road Maintenance";

  const projectDates =
    project.startDate && project.endDate
      ? `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`
      : "2 Oct 2026 – 23 Oct 2026";

  return (
    <div className="services-page">
      {/* Sidebar */}
      <aside className="services-sidebar">
        <div className="services-sidebar-logo">
          <Link to="/contractor-dashboard">
            <img src={logo} alt="MAMAR" />
          </Link>
        </div>

        <nav className="services-sidebar-nav">
          <Link to="/contractor-dashboard">
            <Icon name="dashboard" />
            Dashboard
          </Link>

          <Link to="/my-projects">
            <Icon name="projects" />
            My Projects
          </Link>

          <Link to="/create-project" className="active">
            <Icon name="create" />
            Create Project
          </Link>

          <Link to="/providers">
            <Icon name="providers" />
            Providers
          </Link>
        </nav>

        <div className="services-sidebar-bottom">
          <Link to="/data-disclaimer">ⓘ Data Disclaimer</Link>
          <Link to="/help">ⓘ Help &amp; Support</Link>
          <Link to="/login" onClick={logout}>➜ Log out</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="services-main">
        <header className="services-header">
          <div className="services-account">
            <div className="services-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="services-user-info">
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>

            <span className="services-user-chevron">⌄</span>
          </div>
        </header>

        <div className="services-content">
          {/* Heading */}
          <div className="services-page-heading">
            <h1>Select Traffic-Control Service</h1>
            <p>
              Choose the services you need for this project. You can select
              more than one.
            </p>
          </div>

          {/* Progress */}
          <div className="services-progress">
            <ProgressStep
              number="✓"
              label="Project Details"
              status="completed"
            />

            <div className="services-progress-line completed-line" />

            <ProgressStep
              number="✓"
              label="Location"
              status="completed"
            />

            <div className="services-progress-line completed-line" />

            <ProgressStep number="3" label="Service" status="active" />

            <div className="services-progress-line" />

            <ProgressStep number="4" label="Review" status="" />
          </div>

          {/* Workspace */}
          <div className="services-workspace">
            <section className="services-list-panel">
              <div className="services-panel-heading">
                <h2>Available Services</h2>
                <p>
                  Select the traffic-control services required for your
                  project.
                </p>
              </div>

              <div className="services-options">
                {SERVICE_OPTIONS.map((service) => {
                  const isSelected = selectedServices.includes(service.id);

                  return (
                    <label
                      key={service.id}
                      className={`services-option ${
                        isSelected ? "selected" : ""
                      }`}
                    >
                      <div className="services-option-icon">
                        {service.icon}
                      </div>

                      <div className="services-option-content">
                        <h3>{service.title}</h3>
                        <p>{service.description}</p>

                        <div className="services-option-tags">
                          {service.tags.map((tag) => (
                            <span key={tag}>{tag}</span>
                          ))}
                        </div>
                      </div>

                      <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => toggleService(service.id)}
                        aria-label={`Select ${service.title}`}
                      />
                    </label>
                  );
                })}
              </div>

              {error && <p className="services-error">{error}</p>}
            </section>

            {/* Project Summary */}
            <aside className="services-summary-panel">
              <h2>Project Summary</h2>

              <p className="services-summary-description">
                Review your selected project details before continuing.
              </p>

              <div className="services-summary-map">
                <MamarMap
                  latitude={project.latitude ?? null}
                  longitude={project.longitude ?? null}
                  workZone={project.workZone}
                  readOnly
                />
              </div>

              <SummaryItem label="Project Name" value={projectName} />

              <SummaryItem label="Project Type" value={projectType} />

              <SummaryItem label="Project Dates" value={projectDates} />

              <SummaryItem
                label="Services Selected"
                value={`${selectedServices.length} ${
                  selectedServices.length === 1 ? "service" : "services"
                }`}
              />
            </aside>
          </div>

          {/* Actions */}
          <div className="services-actions">
            <button
              type="button"
              className="services-back-button"
              onClick={() => navigate("/project-location")}
            >
              ← Back
            </button>

            <button
              type="button"
              className="services-next-button"
              onClick={handleNext}
            >
              Next →
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

function ProgressStep({ number, label, status }) {
  return (
    <div className={`services-progress-step ${status}`}>
      <span className="services-progress-number">{number}</span>
      <span className="services-progress-label">{label}</span>
    </div>
  );
}

function SummaryItem({ label, value }) {
  return (
    <div className="services-summary-item">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

export default ServicesPage;
