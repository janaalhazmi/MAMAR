import { useCallback, useEffect, useState } from "react";
import { getSession } from "./auth";
import { fetchAiStatus, fetchSafetyChecks, postSafetyCheck } from "./api";

const token = () => getSession()?.access_token;

// Asked once per page load: is the AI switched on on the server?
let statusPromise = null;
export function useAiEnabled() {
  const [enabled, setEnabled] = useState(false);
  useEffect(() => {
    if (!token()) return undefined;
    let active = true;
    statusPromise = statusPromise || fetchAiStatus(token()).catch(() => ({ enabled: false }));
    statusPromise.then((status) => { if (active) setEnabled(Boolean(status?.enabled)); });
    return () => { active = false; };
  }, []);
  return enabled;
}

// The saved safety checks of a project's photos, and a function to check one photo.
// New photos are checked by the server right after the upload, so the list is read again a few times.
export function useSafetyChecks(projectId, photoCount = 0) {
  const enabled = useAiEnabled();
  const [checks, setChecks] = useState({});
  const [busy, setBusy] = useState({});
  const [error, setError] = useState("");

  const load = useCallback(() => {
    if (!projectId || !token()) return;
    fetchSafetyChecks(token(), projectId).then(setChecks).catch(() => {});
  }, [projectId]);

  useEffect(() => {
    if (!enabled) return undefined;
    const timers = [0, 4000, 10000, 20000].map((ms) => setTimeout(load, ms));
    return () => timers.forEach(clearTimeout);
  }, [enabled, load, photoCount]);

  async function check(photoId, refresh = false) {
    setBusy((current) => ({ ...current, [photoId]: true }));
    setError("");
    try {
      const result = await postSafetyCheck(token(), photoId, refresh);
      setChecks((current) => ({ ...current, [photoId]: result }));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy((current) => ({ ...current, [photoId]: false }));
    }
  }

  return { enabled, checks, busy, error, check };
}
