import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { getSession } from "../services/auth";
import { addProjectDevice, fetchProjectDevices } from "../services/api";
import "../styles/extras.css";

// QR codes for the devices of a project. The field worker scans one with the phone camera and
// the Device Verification page opens with the project and the device already filled in.
export default function DeviceQrCard({ projectId, projectName }) {
  const [codes, setCodes] = useState([]);
  const [draft, setDraft] = useState("");
  const [images, setImages] = useState({});
  const [error, setError] = useState("");

  // The codes are saved with the project, so the Device Verification Status page lists them too.
  useEffect(() => {
    let active = true;
    fetchProjectDevices(getSession()?.access_token, projectId)
      .then((data) => { if (active) setCodes(data.devices.map((device) => device.code)); })
      .catch(() => {});
    return () => { active = false; };
  }, [projectId]);

  useEffect(() => {
    let active = true;
    Promise.all(
      codes.map(async (code) => {
        const link = `${window.location.origin}/device-verification?projectId=${encodeURIComponent(projectId)}&deviceId=${encodeURIComponent(code)}`;
        return [code, await QRCode.toDataURL(link, { width: 220, margin: 1 })];
      })
    ).then((pairs) => { if (active) setImages(Object.fromEntries(pairs)); });
    return () => { active = false; };
  }, [codes, projectId]);

  async function addCode(event) {
    event.preventDefault();
    const code = draft.trim().toUpperCase();
    if (!code) return;
    if (codes.includes(code)) { setDraft(""); return; }
    try {
      const data = await addProjectDevice(getSession()?.access_token, projectId, { code });
      setCodes(data.devices.map((device) => device.code));
      setDraft("");
      setError("");
    } catch (err) {
      setError(err.message || "Could not add the device.");
    }
  }

  function printLabels() {
    const win = window.open("", "_blank", "width=800,height=900");
    if (!win) return;
    const cells = codes
      .map((code) => `<div class="l"><img src="${images[code]}"><b>${code}</b><small>${projectName || ""}</small></div>`)
      .join("");
    win.document.write(
      `<title>Device QR labels</title><style>body{font-family:sans-serif;display:grid;grid-template-columns:repeat(3,1fr);gap:16px;padding:16px}.l{border:2px dashed #999;padding:10px;text-align:center;display:grid;gap:4px}img{width:100%}</style>${cells}<scr` + `ipt>onload=()=>print()</scr` + `ipt>`
    );
    win.document.close();
  }

  return (
    <section className="qr-card" aria-label="Device QR codes">
      <div className="qr-head">
        <div>
          <h2>Device QR Codes</h2>
          <p>Stick a code on each device. The field worker scans it to open Device Verification.</p>
        </div>
        <button type="button" className="qr-print" onClick={printLabels} disabled={!codes.length}>Print labels</button>
      </div>
      <form className="qr-add" onSubmit={addCode}>
        <input value={draft} onChange={(event) => setDraft(event.target.value)} placeholder="Device code, e.g. TC-014" maxLength={30} />
        <button type="submit">Add</button>
      </form>
      {error && <p className="qr-error" role="alert">{error}</p>}
      {codes.length === 0 && <p className="qr-none">No devices yet. Add the code written on each device, e.g. TC-014.</p>}
      <div className="qr-grid">
        {codes.map((code) => (
          <figure key={code}>
            {images[code] ? <img src={images[code]} alt={`QR code for ${code}`} /> : <span className="qr-wait" />}
            <figcaption>{code}</figcaption>
          </figure>
        ))}
      </div>
    </section>
  );
}
