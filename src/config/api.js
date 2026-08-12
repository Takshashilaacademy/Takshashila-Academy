/* =========================================================
   TAKSHASHILA API CONFIG
========================================================= */

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  "http://172.20.84.121:5000";

export const API_URL =
  String(rawApiUrl)
    .trim()
    .replace(/\/+$/, "");

export const API_BASE =
  `${API_URL}/api`;

export const apiUrl = (path = "") => {
  const normalizedPath =
    String(path || "").startsWith("/")
      ? String(path || "")
      : `/${String(path || "")}`;

  return `${API_URL}${normalizedPath}`;
};

export default API_URL;