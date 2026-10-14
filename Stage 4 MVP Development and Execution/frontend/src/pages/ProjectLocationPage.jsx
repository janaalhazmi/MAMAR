import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";

function ProjectLocationPage() {
  const navigate = useNavigate();

  const [location, setLocation] = useState({
    address: "",
    latitude: null,
    longitude: null,
  });

  const [error, setError] = useState("");

  const handleMapLocationSelect = (coordinates) => {
    setLocation((previous) => ({
      ...previous,
      latitude: coordinates.latitude,
      longitude: coordinates.longitude,
      address: `${coordinates.latitude}, ${coordinates.longitude}`,
    }));

    setError("");
  };

  const handleAddressChange = (event) => {
    setLocation((previous) => ({
      ...previous,
      address: event.target.value,
    }));

    setError("");
  };

  const handleContinue = (event) => {
    event.preventDefault();

    if (location.latitude === null || location.longitude === null) {
      setError("Please select a location on the map before continuing.");
      return;
    }

    const savedProject = sessionStorage.getItem("mamarNewProject");

try {
  const project = savedProject ? JSON.parse(savedProject) : {};

  sessionStorage.setItem(
    "mamarNewProject",
    JSON.stringify({
      ...project,
      location: location.address,
      latitude: location.latitude,
      longitude: location.longitude,
    })
  );
} catch {
  setError("Unable to load the project details. Please try again.");
  return;
}

navigate("/select-service");

    sessionStorage.setItem(
      "mamarNewProject",
      JSON.stringify({
        ...project,
        location: location.address,
        latitude: location.latitude,
        longitude: location.longitude,
      })
    );

    navigate("/select-service");
  };

  const handleBack = () => {
    navigate("/create-project");
  };

  return (
    <div className="location-screen">
      {/* Sidebar */}
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
      <div className="location-main">
        {/* Header */}
        <header className="location-header">
          <div className="location-header-spacer" />

          <div className="location-user">
            <div className="location-avatar">K</div>

            <div className="location-user-info">
              <strong>Kayan</strong>
              <span>Contractor</span>
            </div>

            <span className="location-user-chevron">⌄</span>
          </div>
        </header>

        <main className="location-content">
          {/* Page Heading */}
          <div className="location-page-heading">
            <h1>Select Project Location</h1>

            <p>
              Find your project location and draw the work zone on the map.
            </p>
          </div>

          {/* Progress */}
          <div className="location-progress">
            <div className="location-progress-step completed">
              <span className="location-progress-number">✓</span>

              <span className="location-progress-label">
                Project Details
              </span>
            </div>

            <div className="location-progress-line completed-line" />

            <div className="location-progress-step active">
              <span className="location-progress-number">2</span>

              <span className="location-progress-label">
                Location
              </span>
            </div>

            <div className="location-progress-line" />

            <div className="location-progress-step">
              <span className="location-progress-number">3</span>

              <span className="location-progress-label">
                Service
              </span>
            </div>

            <div className="location-progress-line" />

            <div className="location-progress-step">
              <span className="location-progress-number">4</span>

              <span className="location-progress-label">
                Review
              </span>
            </div>
          </div>

          {/* Location Workspace */}
          <div className="location-workspace">
            {/* Map Panel */}
            <section className="location-map-panel">
              <div className="location-map-panel-heading">
                <h2>Project Location</h2>

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

              {error && (
                <p className="location-error" role="alert">
                  {error}
                </p>
              )}

              {location.latitude !== null &&
                location.longitude !== null && (
                  <div className="location-selected-message">
                    <span>✓</span>
                    Location selected successfully
                  </div>
                )}
            </section>

            {/* Location Details */}
            <aside className="location-details-panel">
              <h2>Location Details</h2>

              <p className="location-details-description">
                Confirm your project location.
              </p>

              <div className="location-detail-section">
                <span className="location-detail-label">
                  PROJECT LOCATION
                </span>

                <strong>
                  {location.latitude !== null
                    ? "Selected Map Location"
                    : location.address.trim() || "No location selected"}
                </strong>

                {location.latitude !== null &&
                  location.longitude !== null && (
                    <p className="location-detail-subtext">
                      Latitude: {location.latitude.toFixed(6)}
                      <br />
                      Longitude: {location.longitude.toFixed(6)}
                    </p>
                  )}
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

          {/* Navigation Buttons */}
          <div className="location-page-actions">
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

export default ProjectLocationPage;
