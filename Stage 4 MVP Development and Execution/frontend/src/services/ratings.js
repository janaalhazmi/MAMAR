import { useEffect, useState } from "react";
import { getSession } from "./auth";
import { fetchProviderRatings } from "./api";

// The average stars of every company, by provider_id and by company name.
export function useProviderRatings() {
  const [ratings, setRatings] = useState({ byId: {}, byName: {} });

  useEffect(() => {
    const token = getSession()?.access_token;
    if (!token) return undefined;
    let active = true;
    fetchProviderRatings(token)
      .then((rows) => {
        if (!active) return;
        const byId = {};
        const byName = {};
        rows.forEach((row) => {
          byId[String(row.provider_id)] = row;
          byName[row.company_name.toLowerCase()] = row;
        });
        setRatings({ byId, byName });
      })
      .catch(() => {});
    return () => { active = false; };
  }, []);

  return ratings;
}
