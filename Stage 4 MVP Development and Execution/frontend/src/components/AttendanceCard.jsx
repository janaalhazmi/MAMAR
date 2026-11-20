import { useCallback, useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchMyAttendance, postAttendanceCheckIn, postAttendanceCheckOut } from "../services/api";
import { clock, hours, shortDay } from "../services/attendance";
import { captureCurrentLocation } from "../services/fieldWork";
import "../styles/tools.css";

// The field worker's check in / check out with the site QR code and the phone GPS.
// The code comes from the QR link (?code=...) or is typed from the poster at the site.
export default function AttendanceCard({ projectId, initialCode = "", onChange }) {
  const [status, setStatus] = useState(null);
  const [code, setCode] = useState(initialCode);
  const [busy, setBusy] = useState("");
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");

  const token = () => getSession()?.access_token;

  const load = useCallback(() => {
    if (!projectId || !token()) return;
    fetchMyAttendance(token(), projectId)
      .then((result) => setStatus(result))
      .catch((err) => setError(err.message));
  }, [projectId]);

  useEffect(() => {
    const first = setTimeout(load, 0);
    return () => clearTimeout(first);
  }, [load]);

  async function checkIn(event) {
    event.preventDefault();
    if (!code.trim()) {
      setError("Scan the QR code at the site, or type the code written under it.");
      return;
    }
    setBusy("in");
    setError("");
    setNotice("");
    try {
      const place = await captureCurrentLocation();
      const result = await postAttendanceCheckIn(token(), projectId, {
        code: code.trim(),
        latitude: place.latitude,
        longitude: place.longitude,
      });
      setStatus(result);
      setNotice("You are checked in. Your contractor and provider can see you are on site.");
      onChange?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  async function checkOut() {
    setBusy("out");
    setError("");
    setNotice("");
    try {
      // The place on leaving is nice to have; leaving still works without GPS.
      const place = await captureCurrentLocation().catch(() => null);
      const result = await postAttendanceCheckOut(token(), projectId, place ? { latitude: place.latitude, longitude: place.longitude } : {});
      setStatus(result);
      setNotice("You are checked out. Thank you!");
      onChange?.(result);
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy("");
    }
  }

  if (!projectId) return null;

  return (
    <section className="tl-card att-card" aria-label="My attendance">
      <div className="tl-head">
        <div>
          <h2>My Attendance</h2>
          <p>Scan the QR at the work zone when you arrive and when you leave. You must be within {status?.radius_m ?? 300} m of the site.</p>
        </div>
        {status && (
          <span className={`tl-badge ${status.on_site ? "ok" : ""}`}>
            {status.on_site ? `On site since ${clock(status.current.check_in_at)}` : "Not checked in"}
          </span>
        )}
      </div>

      {error && <p className="att-msg bad" role="alert">{error}</p>}
      {notice && <p className="att-msg ok" role="status">{notice}</p>}

      {status && !status.on_site && (
        <form className="att-form" onSubmit={checkIn}>
          <label>
            Site code
            <input
              value={code}
              onChange={(event) => setCode(event.target.value.toUpperCase())}
              placeholder="From the QR poster"
              maxLength={20}
              autoCapitalize="characters"
            />
          </label>
          <button type="submit" className="tl-btn" disabled={busy !== ""}>
            {busy === "in" ? "Getting your location…" : "Check in at the site"}
          </button>
        </form>
      )}

      {status?.on_site && (
        <div className="att-form">
          <p className="att-now">
            Time on site: <strong>{hours(status.current.minutes)}</strong>
          </p>
          <button type="button" className="tl-btn dark" onClick={checkOut} disabled={busy !== ""}>
            {busy === "out" ? "Checking out…" : "Check out"}
          </button>
        </div>
      )}

      {status && status.visits.length > 0 && (
        <p className="att-total">
          Total on this project: <strong>{hours(status.total_minutes)}</strong> · Last visits:{" "}
          {status.visits.slice(0, 3).map((visit) => (
            <span key={visit.attendance_id}>
              {shortDay(visit.check_in_at)} {clock(visit.check_in_at)}–{visit.check_out_at ? clock(visit.check_out_at) : "now"}
            </span>
          ))}
        </p>
      )}
    </section>
  );
}
