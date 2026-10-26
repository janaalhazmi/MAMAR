import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";

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
    description:
      "Supply and installation of traffic cones and barriers.",
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

function getSavedProject() {
  try {
    return JSON.parse(sessionStorage.getItem("mamarNewProject")) || {};
  } catch {
    return {};
  }
}

function ServicesPage() {
  const navigate = useNavigate();

  const [project, setProject] = useState(getSavedProject);

  const [selectedServices, setSelectedServices] = useState(() => {
    const saved = getSavedProject();
    return Array.isArray(saved.services) ? saved.services : [
      "ttc-plan",
      "road-signs",
    ];
  });

  useEffect(() => {
    setProject(getSavedProject());
  }, []);

  const toggleService = (serviceId) => {
    setSelectedServices((current) =>
      current.includes(serviceId)
        ? current.filter((id) => id !== serviceId)
        : [...current, serviceId]
    );
  };

  const handleNext = () => {
    if (selectedServices.length === 0) {
      window.alert("Please select at least one service.");
      return;
    }

    const updatedProject = {
      ...getSavedProject(),
      services: selectedServices,
    };

    sessionStorage.setItem(
      "mamarNewProject",
      JSON.stringify(updatedProject)
    );

    navigate("/review");
  };

  const projectName = project.name || "King Fahd Road – Water Line";
  const projectType = project.type || "Infrastructure (Water Line)";

  const formatDate = (value) => {
    if (!value) return "";

    const date = new Date(`${value}T00:00:00`);

    if (Number.isNaN(date.getTime())) return value;

    return date.toLocaleDateString("en-GB", {
      day: "numeric",
      month: "short",
      year: "numeric",
    });
  };

  const projectDates =
    project.startDate && project.endDate
      ? `${formatDate(project.startDate)} – ${formatDate(project.endDate)}`
      : "10 Sep 2026 – 20 Sep 2026";

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
            <span className="services-nav-icon">▦</span>
            Dashboard
          </Link>

          <Link to="/my-projects">
            <span className="services-nav-icon">▣</span>
            My Projects
          </Link>

          <Link to="/create-project" className="active">
            <span className="services-nav-icon">✚</span>
            Create Project
          </Link>

          <Link to="/providers">
            <span className="services-nav-icon">♧</span>
            Providers
          </Link>

          <Link to="/quotations">
            <span className="services-nav-icon">▤</span>
            Quotations
          </Link>
        </nav>

        <div className="services-sidebar-bottom">
          <Link to="/data-disclaimer">ⓘ Data Disclaimer</Link>
          <Link to="/support">ⓘ Help &amp; Support</Link>
          <Link to="/login">➜ Log out</Link>
        </div>
      </aside>

      {/* Main */}
      <main className="services-main">
        {/* Header */}
        <header className="services-header">
          <div className="services-account">
            <div className="services-avatar">K</div>

            <div className="services-user-info">
              <strong>Kayan</strong>
              <span>Contractor</span>
            </div>

            <span className="services-user-chevron">⌄</span>
          </div>
        </header>

        {/* Content */}
        <div className="services-content">
          <div className="services-page-heading">
            <h1>Select Traffic-Control Service</h1>
            <p>
              Choose the services you need for this project. You can select
              more than one.
            </p>
          </div>

          {/* Progress */}
          <div className="services-progress">
            <ProgressStep number="✓" label="Project Details" status="completed" />
            <div className="services-progress-line completed-line" />

            <ProgressStep number="✓" label="Location" status="completed" />
            <div className="services-progress-line completed-line" />

            <ProgressStep number="3" label="Service" status="active" />
            <div className="services-progress-line" />

            <ProgressStep number="4" label="Review" status="" />
          </div>

          {/* Workspace */}
          <div className="services-workspace">
            {/* Available Services */}
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
            </section>

            {/* Project Summary */}
            <aside className="services-summary-panel">
              <h2>Project Summary</h2>

              <p className="services-summary-description">
                Review your selected project details before continuing.
              </p>

              <div className="services-summary-map">
                <iframe
                  src="https://arcg.is/0r90n00"
                  title="Project location map"
                  loading="lazy"
                  allowFullScreen
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

          {/* Bottom Buttons */}
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