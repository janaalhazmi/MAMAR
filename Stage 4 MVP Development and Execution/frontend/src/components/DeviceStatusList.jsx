import { useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchProjectDevices } from "../services/api";
import "../styles/devices.css";

const when = (value) =>
  value ? new Date(`${value}`.endsWith("Z") ? value : `${value}Z`).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }) : "–";

// The devices of a project and their last verification by a field worker (saved in the database).
export default function DeviceStatusList({ projectId }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");

  useEffect(() => {
    let active = true;
    const token = getSession()?.access_token;
    const load = () =>
      fetchProjectDevices(token, projectId)
        .then((result) => { if (active) { setData(result); setError(""); } })
        .catch((err) => { if (active) setError(err.message || "Could not load the devices."); });
    load();
    const timer = setInterval(load, 30000);
    return () => { active = false; clearInterval(timer); };
  }, [projectId]);

  if (error) return <p className="dv-empty" role="alert">{error}</p>;
  if (!data) return <p className="dv-empty" role="status">Loading devices…</p>;

  return (
    <div className="dv-wrap">
      <div className="dv-counts">
        <div><strong>{data.total}</strong><span>Devices</span></div>
        <div className="ok"><strong>{data.verified}</strong><span>Verified</span></div>
        <div className="wait"><strong>{data.pending}</strong><span>Pending</span></div>
      </div>

      {data.devices.length === 0 ? (
        <p className="dv-empty">
          No devices yet. Add the device codes in Device QR Codes on the project page, then the field workers scan and verify them on site.
        </p>
      ) : (
        <div className="dv-table">
          <table>
            <thead>
              <tr><th>Device</th><th>Status</th><th>Verified by</th><th>When</th><th>Distance</th></tr>
            </thead>
            <tbody>
              {data.devices.map((device) => (
                <tr key={device.code}>
                  <td><b>{device.code}</b><small>{device.name}</small></td>
                  <td><span className={`dv-pill ${device.status === "Verified" ? "ok" : "wait"}`}>{device.status}</span></td>
                  <td>{device.verified_by || "–"}</td>
                  <td>{when(device.verified_at)}</td>
                  <td>{device.distance_m == null ? "–" : `${Math.round(device.distance_m)} m`}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
      <p className="dv-note">A device is verified when a field worker captures the phone location within 50 m of it. Updates every 30 seconds.</p>
    </div>
  );
}