import { useEffect, useState } from "react";
import { getSession } from "../services/auth";
import { fetchNotificationChannels, postTestMessage } from "../services/api";
import "../styles/tools.css";

// Where notifications go (the site, and WhatsApp/SMS by Twilio), with a test button.
export default function PhoneAlertsCard() {
  const [channels, setChannels] = useState(null);
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);

  useEffect(() => {
    const token = getSession()?.access_token;
    if (!token) return undefined;
    let active = true;
    fetchNotificationChannels(token)
      .then((data) => { if (active) setChannels(data); })
      .catch(() => { if (active) setChannels(null); });
    return () => { active = false; };
  }, []);

  async function sendTest() {
    setBusy(true);
    setResult(null);
    try {
      const data = await postTestMessage(getSession()?.access_token);
      setResult({ ok: true, text: `Sent to your phone ending ${data.phone_hint}. Check ${channels?.channel === "whatsapp" ? "WhatsApp" : "your messages"}.` });
    } catch (err) {
      setResult({ ok: false, text: err.message });
    } finally {
      setBusy(false);
    }
  }

  if (!channels) return null;

  const name = channels.channel === "whatsapp" ? "WhatsApp" : "SMS";
  const phoneLine = !channels.messages_enabled
    ? "Not switched on yet"
    : channels.phone_saved
      ? `To your phone ${channels.phone_hint}`
      : "Save your mobile number in your profile to get them";

  return (
    <section className="tl-card phone-card" aria-label="Where notifications go">
      <div className="tl-head">
        <div>
          <h2>Notifications on Your Phone</h2>
          <p>Every notification here can also reach your phone, so the field team and the contractor never miss an update.</p>
        </div>
        {channels.messages_enabled && channels.phone_saved && (
          <button type="button" className="tl-btn" onClick={sendTest} disabled={busy}>
            {busy ? "Sending…" : "Send me a test message"}
          </button>
        )}
      </div>
      <ul className="phone-channels">
        <li className="on"><b>In the site</b><span>Always on</span></li>
        <li className={channels.messages_enabled && channels.phone_saved ? "on" : ""}>
          <b>{name}</b><span>{phoneLine}</span>
        </li>
      </ul>
      {result && <p className={`att-msg ${result.ok ? "ok" : "bad"}`} role="status">{result.text}</p>}
    </section>
  );
}
