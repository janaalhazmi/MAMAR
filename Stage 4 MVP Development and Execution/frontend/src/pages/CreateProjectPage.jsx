import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";

function CreateProjectPage() {
  const navigate = useNavigate();

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

    setProject((previousProject) => ({
      ...previousProject,
      [name]: value,
    }));

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

    if (project.endDate < project.startDate) {
      setError("End date must be after the start date.");
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
            <span>▦</span>
            Dashboard
          </Link>

          <Link to="/contractor-dashboard#projects">
            <span>▣</span>
            My Projects
          </Link>

          <Link to="/create-project" className="active">
            <span>⊕</span>
            Create Project
          </Link>

          <Link to="/providers">
            <span>♧</span>
            Providers
          </Link>

          <Link to="/contractor-dashboard#quotations">
            <span>▤</span>
            Quotations
          </Link>
        </nav>

        <div className="create-project-sidebar-bottom">
          <Link to="/support">
            <span>ⓘ</span>
            Help &amp; Support
          </Link>

          <Link to="/login">
            <span>→</span>
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
            <div className="create-project-avatar">K</div>

            <div>
              <strong>Kayan</strong>
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
                    min={project.startDate || undefined}
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