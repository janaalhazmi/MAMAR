import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getSession } from "../services/auth";
import { fetchSiteCode } from "../services/api";
import "../styles/tools.css";

// The attendance QR of a project. The provider prints it and puts it at the work zone; the field
// worker scans it with the phone camera on arrival and on leaving.
export default function SiteQrCard({ projectId }) {
  const [site, setSite] = useState(null);
  const [image, setImage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    const token = getSession()?.access_token;
    if (!projectId || !token) return undefined;
    let active = true;
    fetchSiteCode(token, projectId)
      .then(async (result) => {
        const link = `${window.location.origin}/attendance?projectId=${encodeURIComponent(projectId)}&code=${encodeURIComponent(result.code)}`;
        const png = await QRCode.toDataURL(link, { width: 320, margin: 1 });
        if (active) { setSite(result); setImage(png); }
      })
      .catch((err) => { if (active) setError(err.message); });
    return () => { active = false; };
  }, [projectId]);

  function printPoster() {
    const win = window.open("", "_blank", "width=700,height=900");
    if (!win || !site) return;
    const name = String(site.project_name || "").replace(/[<>&]/g, "");
    win.document.write(
      `<title>Site attendance QR</title><style>body{font-family:sans-serif;text-align:center;padding:30px}` +
        `h1{margin:0 0 6px}img{width:70%;max-width:420px}.c{font-size:28px;letter-spacing:4px;font-weight:700}</style>` +
        `<h1>MAMAR · Site Attendance</h1><p>${name}</p><img src="${image}"><p>Field team: scan on arrival and when you leave.</p>` +
        `<p>Or type the code:</p><p class="c">${site.code}</p><scr` + `ipt>onload=()=>print()</scr` + `ipt>`
    );
    win.document.close();
  }

  if (!projectId) return null;

  return (
    <section className="tl-card" aria-label="Site attendance QR">
      <div className="tl-head">
        <div>
          <h2>Site Attendance QR</h2>
          <p>Print it and put it at the work zone. The field team scans it when they arrive and when they leave.</p>
        </div>
        <button type="button" className="tl-btn" onClick={printPoster} disabled={!image}>Print poster</button>
      </div>
      {error && <p className="tl-empty">{error}</p>}
      {!site && !error && <p className="tl-empty">Preparing the code…</p>}
      {site && (
        <div className="att-qr">
          {image && <img src={image} alt="Attendance QR code for this site" />}
          <div>
            <span className="tl-label">Site code</span>
            <strong className="att-code">{site.code}</strong>
            <small>A worker can also type this code on the Attendance page. It only works for workers assigned to this project, and only at the work zone (GPS).</small>
          </div>
        </div>
      )}
    </section>
  );
}
