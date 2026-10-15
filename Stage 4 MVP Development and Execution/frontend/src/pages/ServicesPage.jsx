import { useState } from "react";
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
    <div className="location-screen">
      <aside className="location-sidebar">
        <Link to="/" className="location-sidebar-logo">
          <img src={logo} alt="MAMAR" />
        </Link>

        <nav className="location-sidebar-nav">
          <Link to="/contractor-dashboard">
            <span className="location-nav-icon">▦</span>
            <span>Dashboard</span>
          </Link>

          <Link to="/contractor-dashboard">
            <span className="location-nav-icon">▣</span>
            <span>My Projects</span>
          </Link>

          <Link
            to="/create-project"
            className="location-nav-active"
          >
            <span className="location-nav-icon">⊕</span>
            <span>Create Project</span>
          </Link>

          <Link to="/providers">
            <span className="location-nav-icon">♧</span>
            <span>Providers</span>
          </Link>

          <Link to="/quotations">
            <span className="location-nav-icon">▤</span>
            <span>Quotations</span>
          </Link>
        </nav>

        <div className="location-sidebar-bottom">
          <Link to="/data-disclaimer">
            <span>ⓘ</span>
            Data Disclaimer
          </Link>

          <Link to="/support">
            <span>ⓘ</span>
            Help &amp; Support
          </Link>

          <Link to="/login">
            <span>➜</span>
            Log out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="services-main">
        {/* Header */}
        <header className="services-header">
          <div className="services-account">
            <div className="services-avatar">K</div>

            <div className="location-user-info">
              <strong>Kayan</strong>
              <span>Contractor</span>
            </div>

            <span className="location-user-chevron">⌄</span>
          </div>
        </header>

        {/* Content */}
        <div className="services-content">
          <div className="services-page-heading">
            <h1>Select Traffic-Control Service</h1>
            <p>
              Find your project location and draw the work zone on the map.
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

            <div className="location-progress-step">
              <span className="location-progress-number">4</span>
              <span className="location-progress-label">
                Review
              </span>
            </div>
          </div>

          {/* Workspace */}
          <div className="services-workspace">
            {/* Available Services */}
            <section className="services-list-panel">
              <div className="services-panel-heading">
                <h2>Available Services</h2>
                <p>
                  Search for a location, then draw the project work zone
                  directly on the map.
                </p>
              </div>

              <form
                className="location-search"
                onSubmit={(event) => event.preventDefault()}
              >
                <span className="location-search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search location e.g. King Fahd Road, Riyadh"
                  value={location.address}
                  onChange={handleAddressChange}
                  aria-label="Search project location"
                />
              </form>

              <div className="location-map-frame">
                <MamarMap
                  height="100%"
                  onLocationSelect={handleMapLocationSelect}
                />
              </div>
            </section>

            <aside className="location-details-panel">
              <h2>Location Details</h2>

              <p className="location-details-description">
                Confirm your project location.
              </p>

              <div className="services-summary-map">
                <iframe
                  src="https://arcg.is/0r90n00"
                  title="Project location map"
                  loading="lazy"
                  allowFullScreen
                />
              </div>

              <div className="location-detail-section">
                <span className="location-detail-label">
                  WORK ZONE AREA
                </span>

                <strong>
                  {location.latitude !== null
                    ? "Location selected"
                    : "Calculated automatically"}
                </strong>
              </div>

              <div className="location-details-divider" />

              <div className="location-work-zone">
                <span className="location-detail-label">
                  WORK ZONE
                </span>

                <p>
                  <span className="location-zone-dot" />
                  Work zone
                </p>
              </div>
            </aside>
          </div>

          {/* Bottom Buttons */}
          <div className="services-actions">
            <button
              type="button"
              className="location-back-button"
              onClick={handleBack}
            >
              ← Back
            </button>

            <button
              type="button"
              className="location-next-button"
              onClick={handleContinue}
            >
              Next →
            </button>
          </div>
        </main>
      </div>
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