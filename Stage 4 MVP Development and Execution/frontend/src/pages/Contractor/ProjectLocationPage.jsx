import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import MamarMap from "../../components/MamarMap";
import ContractorShell from "../../components/ContractorShell";

import {
  applyMapSelection,
  getSavedLocation,
  saveProjectLocation,
} from "../../services/Contractor/Contractor";

function ProjectLocationPage() {
  const navigate = useNavigate();
  const mapDrawingRef = useRef(null);

  const [drawing, setDrawing] = useState(false);
  const [location, setLocation] = useState(getSavedLocation);
  const [error, setError] = useState("");

  const workZonePolygon = location.polygon;

  const handleMapLocationSelect = (coordinates) => {
    setLocation((previous) => applyMapSelection(previous, coordinates));
    setDrawing(false);
    setError("");
  };

  const handleStartDrawing = () => {
    if (!mapDrawingRef.current) {
      setError("Map drawing tools are not ready yet.");
      return;
    }

    mapDrawingRef.current.startDrawing();
    setDrawing(true);
    setError("");
  };

  const handleFinishDrawing = () => {
    mapDrawingRef.current?.finishDrawing();
  };

  const handleCancelDrawing = () => {
    if (!mapDrawingRef.current) return;

    mapDrawingRef.current.cancelDrawing();
    setDrawing(false);
    setError("");
  };

  const handleContinue = (event) => {
    event.preventDefault();

    try {
      saveProjectLocation(location);
      navigate("/services");
    } catch (err) {
      setError(err.message);
    }
  };

  const handleBack = () => navigate("/create-project");

  return (
    <ContractorShell activeKey="create">
      <div className="location-content">
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

            {/* Drawing Controls */}
            <div
              className="location-drawing-controls"
              style={{
                display: "flex",
                alignItems: "center",
                flexWrap: "wrap",
                gap: "10px",
                marginTop: "16px",
                marginBottom: "14px",
                position: "relative",
                zIndex: 2,
              }}
            >
              <button
                type="button"
                onClick={handleStartDrawing}
                disabled={drawing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px 18px",
                  borderRadius: "9px",
                  border: "1px solid #ffbf00",
                  backgroundColor: "#ffbf00",
                  color: "#111827",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: drawing ? "not-allowed" : "pointer",
                  opacity: drawing ? 0.55 : 1,
                }}
              >
                <span aria-hidden="true">✎</span>
                Draw Work Zone
              </button>

              <button
                type="button"
                onClick={handleFinishDrawing}
                disabled={!drawing}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px 18px",
                  borderRadius: "9px",
                  border: "1px solid #111827",
                  backgroundColor: "#111827",
                  color: "#ffffff",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: 700,
                  cursor: !drawing ? "not-allowed" : "pointer",
                  opacity: !drawing ? 0.45 : 1,
                }}
              >
                <span aria-hidden="true">✓</span>
                Finish Drawing
              </button>

              <button
                type="button"
                onClick={handleCancelDrawing}
                disabled={!drawing && location.polygon === null}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  padding: "11px 18px",
                  borderRadius: "9px",
                  border: "1px solid #d7dce5",
                  backgroundColor: "#ffffff",
                  color: "#374151",
                  fontFamily: "inherit",
                  fontSize: "13px",
                  fontWeight: 600,
                  cursor:
                    !drawing && location.polygon === null
                      ? "not-allowed"
                      : "pointer",
                  opacity:
                    !drawing && location.polygon === null ? 0.45 : 1,
                }}
              >
                <span aria-hidden="true">×</span>
                Cancel
              </button>
            </div>

            {/* Map */}
            <div className="location-map-frame">
              <MamarMap
                ref={mapDrawingRef}
                onLocationSelect={handleMapLocationSelect}
                polygon={location.polygon}
              />
            </div>

            {/* Error */}
            {error && (
              <p className="location-error" role="alert">
                {error}
              </p>
            )}

            {workZonePolygon && (
              <div className="location-selected-message">
                <span>✓</span>
                Work zone polygon completed successfully
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
                {location.area !== null
                  ? `${location.area.toLocaleString()} m²`
                  : "Calculated automatically"}
              </strong>
            </div>

            <div className="location-details-divider" />

            <div className="location-work-zone">
              <span className="location-detail-label">
                WORK ZONE
              </span>

              <p>
                <span
                  className="location-zone-dot"
                  style={{
                    backgroundColor: "#FFBF00",
                    borderColor: "#FFBF00",
                  }}
                />

                {workZonePolygon
                  ? "Polygon completed"
                  : "Work zone"}
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
      </div>
    </ContractorShell>
  );
}

export default ProjectLocationPage;