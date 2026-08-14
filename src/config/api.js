/* =========================================================
   TAKSHASHILA API CONFIG
========================================================= */

const rawApiUrl =
  import.meta.env.VITE_API_URL ||
  "https://takshashila-academy-api.onrender.com";


/* =========================================================
   NORMALIZE API URL
========================================================= */

export const API_URL =
  String(rawApiUrl)
    .trim()
    .replace(/\/+$/, "");


/* =========================================================
   API BASE
========================================================= */

export const API_BASE =
  `${API_URL}/api`;


/* =========================================================
   API URL HELPER
========================================================= */

export const apiUrl = (path = "") => {
  const normalizedPath =
    String(path || "").startsWith("/")
      ? String(path || "")
      : `/${String(path || "")}`;

  return `${API_URL}${normalizedPath}`;
};


/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default API_URL;