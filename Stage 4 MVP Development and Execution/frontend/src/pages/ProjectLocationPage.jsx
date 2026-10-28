import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";

import logo from "../assets/mamar-logo.svg";
import MamarMap from "../components/MamarMap";
import { getSession, logout } from "../services/auth";

// Riyadh city centre as "x,y" (lon,lat): ranks nearby matches first
// without hiding matches elsewhere.
const RIYADH_BIAS = "46.6753,24.7136";

const RESULT_TYPE_LABELS = {
  StreetName: "Road",
  StreetAddress: "Address",
  StreetInt: "Intersection",
  PointAddress: "Address",
  POI: "Place",
  Locality: "Area",
  Postal: "Postal code",
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

function ProjectLocationPage() {
  const displayName = getSession()?.user?.full_name || "User";
  const navigate = useNavigate();

  const [location, setLocation] = useState({
    address: "",
    latitude: null,
    longitude: null,
  });

  // Where the map should move to (set only by search, not by drawing).
  const [mapCenter, setMapCenter] = useState({
    latitude: null,
    longitude: null,
  });

  const [workZone, setWorkZone] = useState([]);
  const [workZonePolygon, setWorkZonePolygon] = useState(null);
  const [error, setError] = useState("");
  const [searching, setSearching] = useState(false);
  const [searchResults, setSearchResults] = useState([]);

  // Called by the map when a polygon is finished (data) or cleared (null).
  const handleMapLocationSelect = (data) => {
    if (!data) {
      setWorkZone([]);
      setWorkZonePolygon(null);
      return;
    }

    setLocation((previous) => ({
      ...previous,
      latitude: data.latitude,
      longitude: data.longitude,
    }));

    setWorkZone(Array.isArray(data.workZone) ? data.workZone : []);
    setWorkZonePolygon(data.polygon ?? null);
    setError("");
  };

  const handleAddressChange = (event) => {
    setLocation((previous) => ({
      ...previous,
      address: event.target.value,
    }));

    setSearchResults([]);
    setError("");
  };

  const selectCandidate = (candidate) => {
    const latitude = candidate.location.y;
    const longitude = candidate.location.x;

    setLocation({
      address: candidate.address,
      latitude,
      longitude,
    });

    setMapCenter({ latitude, longitude });
    setError("");
  };

  const handleLocationSearch = async (event) => {
    event.preventDefault();

    const query = location.address.trim();

    if (!query) {
      setError("Please enter a neighborhood name.");
      return;
    }

    setSearching(true);
    setError("");

    try {
      const searchQuery = /الرياض|riyadh/i.test(query)
        ? query
        : `${query}, Riyadh, Saudi Arabia`;

      const params = new URLSearchParams({
        SingleLine: searchQuery,
        countryCode: "SA",
        location: RIYADH_BIAS,
        outFields: "Addr_type,Match_addr",
        maxLocations: "8",
        f: "json",
      });

      const response = await fetch(
        `https://geocode-api.arcgis.com/arcgis/rest/services/World/GeocodeServer/findAddressCandidates?${params}`
      );

      if (!response.ok) {
        throw new Error("Location search failed. Please try again.");
      }

      const data = await response.json();

      const seen = new Set();

      const candidates = (data.candidates || [])
        .filter(
          (candidate) =>
            candidate.score >= 70 &&
            Number.isFinite(candidate.location?.x) &&
            Number.isFinite(candidate.location?.y)
        )
        .filter((candidate) => {
          if (seen.has(candidate.address)) return false;

          seen.add(candidate.address);

          return true;
        })
        .slice(0, 6);

      if (candidates.length === 0) {
        setSearchResults([]);
        setError(
          "Location not found. Try the English road or neighborhood name, or add Riyadh."
        );
        return;
      }

      // Jump to the best match, and keep the others selectable.
      selectCandidate(candidates[0]);
      setSearchResults(candidates);
    } catch (searchError) {
      setError(searchError.message || "Unable to find this neighborhood.");
    } finally {
      setSearching(false);
    }
  };

  const handleContinue = (event) => {
    event.preventDefault();
  

    if (!workZonePolygon) {
      setError(
        "Please draw and finish the work zone polygon before continuing."
      );
      return;
    }

    if (workZone.length < 3) {
      setError("Please draw and finish the project work zone on the map.");
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
          workZone,
          workZonePolygon: workZonePolygon,
        })
      );
    } catch {
      setError("Unable to load the project details. Please try again.");
      return;
    }

    navigate("/select-service");
  };

  const handleBack = () => {
    navigate("/create-project");
  };

  return (
    <div className="location-screen">
      <aside className="location-sidebar">
        <Link to="/" className="location-sidebar-logo">
          <img src={logo} alt="MAMAR" />
        </Link>

        <nav className="location-sidebar-nav">
          <Link to="/contractor-dashboard">
            <Icon name="dashboard" />
            <span>Dashboard</span>
          </Link>

          <Link to="/contractor-dashboard#projects">
            <Icon name="projects" />
            <span>My Projects</span>
          </Link>

          <Link to="/create-project" className="location-nav-active">
            <Icon name="create" />
            <span>Create Project</span>
          </Link>

          <Link to="/providers">
            <Icon name="providers" />
            <span>Providers</span>
          </Link>

          <Link to="/quotations">
            <Icon name="quotations" />
            <span>Quotations</span>
          </Link>
        </nav>

        <div className="location-sidebar-bottom">
          <Link to="/data-disclaimer">
            <Icon name="info" />
            <span>Data Disclaimer</span>
          </Link>

          <Link to="/help">
            <Icon name="help" />
            <span>Help &amp; Support</span>
          </Link>

          <Link to="/login" onClick={logout}>
            <Icon name="logout" />
            <span>Log out</span>
          </Link>
        </div>
      </aside>

      <div className="location-main">
        <header className="location-header">
          <div className="location-header-spacer" />

          <div className="location-user">
            <div className="location-avatar">
              {displayName.charAt(0).toUpperCase()}
            </div>

            <div className="location-user-info">
              <strong>{displayName}</strong>
              <span>Contractor</span>
            </div>

            <span className="location-user-chevron">⌄</span>
          </div>
        </header>

        <main className="location-content">
          <div className="location-page-heading">
            <h1>Select Project Location</h1>
            <p>
              Search for your neighborhood, then draw the work zone on the map.
            </p>
          </div>

          <div className="location-progress">
            <div className="location-progress-step completed">
              <span className="location-progress-number">✓</span>
              <span className="location-progress-label">Project Details</span>
            </div>

            <div className="location-progress-line completed-line" />

            <div className="location-progress-step active">
              <span className="location-progress-number">2</span>
              <span className="location-progress-label">Location</span>
            </div>

            <div className="location-progress-line" />

            <div className="location-progress-step">
              <span className="location-progress-number">3</span>
              <span className="location-progress-label">Service</span>
            </div>

            <div className="location-progress-line" />

            <div className="location-progress-step">
              <span className="location-progress-number">4</span>
              <span className="location-progress-label">Review</span>
            </div>
          </div>

          <div className="location-workspace">
            <section className="location-map-panel">
              <div className="location-map-panel-heading">
                <h2>Project Location</h2>
                <p>
                  Search for a neighborhood, select a location, and draw your
                  project work zone.
                </p>
              </div>

              <form
                className="location-search"
                onSubmit={handleLocationSearch}
              >
                <span className="location-search-icon">⌕</span>

                <input
                  type="text"
                  placeholder="Search neighborhood or road, e.g. King Fahd Road"
                  value={location.address}
                  onChange={handleAddressChange}
                  aria-label="Search neighborhood or road"
                />

                <button type="submit" disabled={searching}>
                  {searching ? "Searching..." : "Search"}
                </button>
              </form>

              {searchResults.length > 1 && (
                <ul
                  className="location-search-results"
                  aria-label="Search results"
                >
                  {searchResults.map((candidate) => {
                    const isSelected =
                      candidate.location.y === location.latitude &&
                      candidate.location.x === location.longitude;

                    return (
                      <li
                        key={`${candidate.address}-${candidate.location.x}-${candidate.location.y}`}
                      >
                        <button
                          type="button"
                          className={isSelected ? "selected" : ""}
                          onClick={() => selectCandidate(candidate)}
                        >
                          <span className="location-result-name">
                            {candidate.address}
                          </span>

                          <span className="location-result-type">
                            {RESULT_TYPE_LABELS[
                              candidate.attributes?.Addr_type
                            ] ||
                              candidate.attributes?.Addr_type ||
                              ""}
                          </span>
                        </button>
                      </li>
                    );
                  })}
                </ul>
              )}

              <div className="location-map-frame">
                <MamarMap
                  height="100%"
                  latitude={mapCenter.latitude}
                  longitude={mapCenter.longitude}
                  onLocationSelect={handleMapLocationSelect}
                />
              </div>

              {error && (
                <p className="location-error" role="alert">
                  {error}
                </p>
              )}

              {location.latitude !== null && location.longitude !== null && (
                <div className="location-selected-message">
                  <span>✓</span>
                  Location selected successfully
                </div>
              )}

              {workZonePolygon && (
                <div className="location-selected-message">
                  <span>✓</span>
                  Work zone polygon completed successfully
                </div>
              )}
            </section>

            <aside className="location-details-panel">
              <h2>Location Details</h2>

              <p className="location-details-description">
                Confirm your project location.
              </p>

              <div className="location-detail-section">
                <span className="location-detail-label">PROJECT LOCATION</span>

                <strong>
                  {location.latitude !== null
                    ? location.address || "Selected Map Location"
                    : location.address.trim() || "No location selected"}
                </strong>

                {location.latitude !== null && location.longitude !== null && (
                  <p className="location-detail-subtext">
                    Latitude: {location.latitude.toFixed(6)}
                    <br />
                    Longitude: {location.longitude.toFixed(6)}
                  </p>
                )}
              </div>

              <div className="location-detail-section">
                <span className="location-detail-label">WORK ZONE AREA</span>

                <strong>
                  {workZonePolygon
                    ? "Work zone defined"
                    : "Calculated automatically"}
                </strong>
              </div>

              <div className="location-details-divider" />

              <div className="location-work-zone">
                <span className="location-detail-label">WORK ZONE</span>

                <p>
                  <span className="location-zone-dot" />
                  {workZonePolygon
                    ? "Polygon completed"
                    : "Work zone"}
                </p>
              </div>
            </aside>
          </div>

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
