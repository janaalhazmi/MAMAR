// Small helpers for the attendance cards.

// The server saves times in UTC without a zone: add Z so they show in local time.
export const asDate = (value) => new Date(/Z|[+-]\d\d:?\d\d$/.test(value) ? value : `${value}Z`);

export const clock = (value) => asDate(value).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });

export const shortDay = (value) => asDate(value).toLocaleDateString("en-GB", { day: "numeric", month: "short" });

export function hours(minutes) {
  if (!minutes) return "0 min";
  const h = Math.floor(minutes / 60);
  const m = minutes % 60;
  return h ? `${h} h ${m} min` : `${m} min`;
}
