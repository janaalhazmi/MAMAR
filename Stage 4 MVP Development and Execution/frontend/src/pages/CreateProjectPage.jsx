import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";
import { getSession, logout } from "../services/auth";

function CreateProjectPage() {
  const displayName = getSession()?.user?.full_name || "User";

  const navigate = useNavigate();

  const getToday = () => {
    const date = new Date();
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

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

  const getNextDate = (dateString) => {
    if (!dateString) return getToday();

    const date = new Date(`${dateString}T00:00:00`);
    date.setDate(date.getDate() + 1);

    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, "0");
    const day = String(date.getDate()).padStart(2, "0");

    return `${year}-${month}-${day}`;
  };

  const today = getToday();

  const [project, setProject] = useState({
    name: "",
    type: "",
    startDate: "",
    endDate: "",
    description: "",
  });

  const [error, setError] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;

    setProject((previousProject) => {
      const updatedProject = {
        ...previousProject,
        [name]: value,
      };

      if (
        name === "startDate" &&
        updatedProject.endDate &&
        updatedProject.endDate <= value
      ) {
        updatedProject.endDate = "";
      }

      return updatedProject;
    });

    setError("");
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    if (
      !project.name.trim() ||
      !project.type ||
      !project.startDate ||
      !project.endDate ||
      !project.description.trim()
    ) {
      setError("Please complete all project details.");
      return;
    }

    if (project.startDate < today) {
      setError("Start date cannot be in the past.");
      return;
    }

    if (project.endDate <= project.startDate) {
      setError("End date must be at least one day after the start date.");
      return;
    }

    sessionStorage.setItem(
      "mamarNewProject",
      JSON.stringify(project)
    );

    navigate("/project-location");
  };

  return (
    <div className="create-project-page">
      {/* Sidebar */}
      <aside className="create-project-sidebar">
        <Link to="/" className="create-project-brand">
          <img src={logo} alt="MAMAR Logo" />
        </Link>

        <nav className="create-project-navigation">
          <Link to="/contractor-dashboard">
            <Icon name="dashboard" />
            Dashboard
          </Link>

          <Link to="/contractor-dashboard#projects">
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

          <Link to="/contractor-dashboard#quotations">
            <Icon name="quotations" />
            Quotations
          </Link>
        </nav>

        <div className="create-project-sidebar-bottom">
          <Link to="/help">
            Help &amp; Support
          </Link>

          <Link to="/login" onClick={logout}>
            <span>→</span>
            <Icon name="logout" />
            Log out
          </Link>
        </div>
      </aside>

      {/* Main */}
      <main className="create-project-main">
        {/* Header */}
        <header className="create-project-header">
          <Link to="/" className="create-project-header-logo">
            <img src={logo} alt="MAMAR" />
          </Link>

          <div className="create-project-user">
            <div className="create-project-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div>
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>

            <span className="user-chevron">⌄</span>
          </div>
        </header>

        {/* Content */}
        <div className="create-project-content">
          <div className="create-project-heading">
            <h1>Create New Project</h1>

            <p>
              Add the key details about your project to find the right
              traffic control providers.
            </p>
          </div>

          {/* Steps */}
          <div className="create-project-steps">
            <div className="create-project-step active">
              <span className="step-circle">1</span>

              <div>
                <strong>Project Details</strong>
                <span className="step-underline" />
              </div>
            </div>

            <span className="step-connector" />

            <div className="create-project-step">
              <span className="step-circle">2</span>
              <span>Location</span>
            </div>

            <span className="step-connector" />

            <div className="create-project-step">
              <span className="step-circle">3</span>
              <span>Service</span>
            </div>

            <span className="step-connector" />

            <div className="create-project-step">
              <span className="step-circle">4</span>
              <span>Review</span>
            </div>
          </div>

          {/* Form */}
          <section className="create-project-form-section">
            <h2>Project Details</h2>

            <form
              className="create-project-form"
              onSubmit={handleSubmit}
            >
              <div className="create-project-field">
                <label htmlFor="project-name">
                  Project Name <span>*</span>
                </label>

                <input
                  id="project-name"
                  name="name"
                  type="text"
                  placeholder="e.g. King Fahd Road – Water Line"
                  value={project.name}
                  onChange={handleChange}
                  required
                />
              </div>

              <div className="create-project-field">
                <label htmlFor="project-type">
                  Project Type <span>*</span>
                </label>

                <select
                  id="project-type"
                  name="type"
                  value={project.type}
                  onChange={handleChange}
                  required
                >
                  <option value="" disabled>
                    Select project type
                  </option>

                  <option value="Infrastructure">
                    Infrastructure
                  </option>

                  <option value="Road Maintenance">
                    Road Maintenance
                  </option>

                  <option value="Construction">
                    Construction
                  </option>

                  <option value="Utility Work">
                    Utility Work
                  </option>

                  <option value="Event Traffic Control">
                    Event Traffic Control
                  </option>
                </select>
              </div>

              <div className="create-project-date-fields">
                <div className="create-project-field">
                  <label htmlFor="project-start-date">
                    Start Date <span>*</span>
                  </label>

                  <input
                    id="project-start-date"
                    name="startDate"
                    type="date"
                    min={today}
                    value={project.startDate}
                    onChange={handleChange}
                    required
                  />
                </div>

                <div className="create-project-field">
                  <label htmlFor="project-end-date">
                    End Date <span>*</span>
                  </label>

                  <input
                    id="project-end-date"
                    name="endDate"
                    type="date"
                    min={getNextDate(project.startDate)}
                    value={project.endDate}
                    onChange={handleChange}
                    required
                  />
                </div>
              </div>

              <div className="create-project-field">
                <label htmlFor="project-description">
                  Description <span>*</span>
                </label>

                <textarea
                  id="project-description"
                  name="description"
                  placeholder="Describe the project scope and roadwork requirements"
                  value={project.description}
                  onChange={handleChange}
                  required
                />
              </div>

              {error && (
                <p className="create-project-error" role="alert">
                  {error}
                </p>
              )}

              <div className="create-project-form-actions">
                <Link
                  to="/contractor-dashboard"
                  className="create-project-back-button"
                >
                  Cancel
                </Link>

                <button
                  type="submit"
                  className="create-project-next-button"
                >
                  Next →
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
    </div>
  );
}

export default CreateProjectPage;
