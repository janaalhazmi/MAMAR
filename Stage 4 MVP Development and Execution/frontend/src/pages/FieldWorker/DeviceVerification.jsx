import { useEffect, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import FieldWorkerShell from "../../components/FieldWorkerShell";
import MamarMap from "../../components/MamarMap";
import Icon from "../../components/Icons";
import {
  MAX_DISTANCE_METERS,
  captureCurrentLocation,
  distanceInMeters,
  formatDistance,
  getDevice,
  getPlannedLocation,
  saveDeviceVerification,
} from "../../services/fieldWork";

const format = (n) => Number(n).toFixed(6);

function DeviceVerification() {
  const [searchParams] = useSearchParams();
  // e.g. /device-verification?deviceId=TC-014
  const deviceId = searchParams.get("deviceId") || "TC-014";

  // Planned point = the location the CONTRACTOR selected for the project.
  // TODO(API): load it from the backend (see getPlannedLocation).
  const planned = getPlannedLocation();

  const [device, setDevice] = useState(null);
  const [captured, setCaptured] = useState(null);
  const [distance, setDistance] = useState(null);
  const [capturing, setCapturing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [verified, setVerified] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    getDevice(deviceId)
      .then((result) => active && setDevice(result))
      .catch(() => active && setError("Could not load this device."));
    return () => {
      active = false;
    };
  }, [deviceId]);

  const tooFar = distance != null && distance > MAX_DISTANCE_METERS;
  const canSave = captured && !tooFar && !verified && !saving;

  async function handleCapture() {
    setCapturing(true);
    setError("");
    setVerified(false);

    try {
      const position = await captureCurrentLocation(planned);
      const meters = distanceInMeters(position, planned);

      setCaptured(position);
      setDistance(meters);

      if (meters > MAX_DISTANCE_METERS) {
        setError(
          `You are ${formatDistance(meters)} from the planned location. Move within ${MAX_DISTANCE_METERS} m of the installed device and capture again.`
        );
      }
    } catch (err) {
      setCaptured(null);
      setDistance(null);
      setError(err.message || "Could not get your location.");
    } finally {
      setCapturing(false);
    }
  }

  async function handleSave() {
    if (!canSave) return;
    setSaving(true);
    setError("");

    try {
      await saveDeviceVerification({
        deviceId,
        projectId: device?.projectId,
        planned,
        captured,
        distanceMeters: distance,
      });
      setVerified(true);
    } catch (err) {
      setError(err.message || "Could not save the verification.");
    } finally {
      setSaving(false);
    }
  }

  if (!device) {
    return (
      <FieldWorkerShell activeKey="team">
        {error ? (
          <p className="pf-alert" role="alert">
            {error}
          </p>
        ) : (
          <p className="pf-empty">Loading device…</p>
        )}
      </FieldWorkerShell>
    );
  }

  return (
    <FieldWorkerShell activeKey="team">
      <Link to="/field-execution" className="pf-backlink">
        ← Back to Field Execution
      </Link>

      <section className="pf-heading">
        <h1>Device Verification</h1>
        <p>
          Capture your location beside the installed device to compare it with
          the planned location.
        </p>
      </section>

      <section className="pf-card fw-device">
        <span className="fw-device-icon" aria-hidden="true">
          <Icon name="triangle" size={28} />
        </span>
        <div className="fw-device-info">
          <span className="pf-label">Device ID · {device.id}</span>
          <strong className="pf-mid">{device.name}</strong>
        </div>
        <div className="fw-device-info">
          <span className="pf-label">Project</span>
          <strong>{device.projectName}</strong>
        </div>
        <span className={`pf-pill ${verified ? "pf-pill-green" : "pf-pill-yellow"}`}>
          <i aria-hidden="true" />
          {verified ? "Verified" : device.status}
        </span>
      </section>

      <div className="fw-verify-grid">
        <section className="pf-card pf-pad">
          <h2>Location Comparison</h2>
          <p className="pf-sub">Planned location from the contractor’s project.</p>

          <div className="pf-map fw-map-tall">
            <MamarMap
              latitude={planned.latitude}
              longitude={planned.longitude}
              workZone={planned.workZone}
              readOnly
            />
          </div>
          {/* TODO: to show a blue "You are here" marker, MamarMap needs a prop
              for a second point, e.g. <MamarMap ... userLocation={captured} /> */}

          <div className="fw-legend">
            <span>
              <i className="fw-dot fw-dot-red" /> The Location (planned)
            </span>
            {captured && (
              <span>
                <i className="fw-dot fw-dot-blue" /> You are here
              </span>
            )}
          </div>
        </section>

        <section className="pf-card pf-pad">
          <h2>Verify Installation Location</h2>
          <p className="pf-sub">
            Stand beside the installed device, then capture your current location.
          </p>

          <button
            type="button"
            className="pf-btn pf-btn-primary fw-full fw-capture"
            onClick={handleCapture}
            disabled={capturing || saving}
          >
            <Icon name="target" size={18} />
            {capturing ? "Finding your location…" : captured ? "Capture Again" : "Capture Current Location"}
          </button>

          <div className="fw-coords">
            <span className="pf-label">Planned Location</span>
            <strong>
              {format(planned.latitude)}, {format(planned.longitude)}
            </strong>
          </div>

          <div className="fw-coords">
            <span className="pf-label">Captured Location</span>
            {captured ? (
              <>
                <strong>
                  {format(captured.latitude)}, {format(captured.longitude)}
                </strong>
                <small>GPS accuracy: ±{captured.accuracy} m · Captured just now</small>
              </>
            ) : (
              <small>Not captured yet.</small>
            )}
          </div>

          <div className={`fw-distance ${tooFar ? "fw-distance-bad" : distance != null ? "fw-distance-ok" : ""}`}>
            <span>Distance from planned location</span>
            <strong>{distance != null ? formatDistance(distance) : "–"}</strong>
            <small>Allowed: within {MAX_DISTANCE_METERS} m</small>
          </div>

          {error && (
            <p className="pf-alert" role="alert">
              {error}
            </p>
          )}

          {verified && (
            <p className="fw-notice" role="status">
              Location verified and saved. Your contractor can now see this device
              as installed.
            </p>
          )}

          <button
            type="button"
            className="pf-btn pf-btn-secondary fw-full"
            onClick={handleSave}
            disabled={!canSave}
          >
            {saving ? "Saving…" : "Save Verification"}
          </button>
        </section>
      </div>
    </FieldWorkerShell>
  );
}

export default DeviceVerification;
