import { API_BASE_URL } from "../api";

export function getPictureUrl(profile) {
  const path =
    profile?.profile_picture_url ||
    profile?.profile_picture ||
    profile?.avatar_url ||
    "";

  if (!path) return "";

  if (/^https?:\/\//i.test(path)) return path;

  return `${API_BASE_URL}${path.startsWith("/") ? "" : "/"}${path}`;
}

export function formatProfileDate(value) {
  if (!value) return "—";

  const date = new Date(value);

  if (Number.isNaN(date.getTime())) return value;

  return date.toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

export function getProfileInitial(name) {
  return (name || "U").trim().charAt(0).toUpperCase();
}