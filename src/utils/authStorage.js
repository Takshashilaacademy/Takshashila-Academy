/* =========================================================
   STUDENT AUTH STORAGE

   One canonical storage contract for the whole frontend.

   IMPORTANT:
   Keep all student authentication storage operations
   inside this file.

   Other components/pages should use these functions instead
   of directly reading or writing student authentication keys.
========================================================= */

/* =========================================================
   STORAGE KEYS
========================================================= */

export const STUDENT_TOKEN_KEY =
  "takshashila_student_token";

export const STUDENT_DATA_KEY =
  "takshashila_student";

/* =========================================================
   LEGACY STORAGE KEYS

   Older versions of the application may have used these
   keys. They are removed whenever student authentication
   is completely cleared.
========================================================= */

const LEGACY_AUTH_KEYS = [
  "token",
  "studentToken",
  "authToken",
  "student",
  "studentData",
  "user",
  "currentStudent",
];

/* =========================================================
   AUTH CHANGE EVENT

   Useful for updating Navbar, Dashboard and other UI
   without directly reading authentication storage.
========================================================= */

export const STUDENT_AUTH_EVENT =
  "student-auth-changed";

/* =========================================================
   INTERNAL STORAGE HELPERS
========================================================= */

const isBrowser = () => {
  return typeof window !== "undefined";
};

const getStorage = () => {
  if (!isBrowser() || !window.localStorage) {
    return null;
  }

  return window.localStorage;
};

/* =========================================================
   GET STUDENT TOKEN
========================================================= */

export const getStudentToken = () => {
  const storage = getStorage();

  if (!storage) {
    return "";
  }

  try {
    const token = storage.getItem(
      STUDENT_TOKEN_KEY
    );

    if (
      typeof token !== "string" ||
      !token.trim()
    ) {
      return "";
    }

    return token.trim();
  } catch (error) {
    console.error(
      "Get Student Token Error:",
      error
    );

    return "";
  }
};

/* =========================================================
   SAVE STUDENT TOKEN
========================================================= */

export const saveStudentToken = (token) => {
  const storage = getStorage();

  if (
    !storage ||
    typeof token !== "string" ||
    !token.trim()
  ) {
    return false;
  }

  try {
    storage.setItem(
      STUDENT_TOKEN_KEY,
      token.trim()
    );

    return true;
  } catch (error) {
    console.error(
      "Save Student Token Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   GET STORED STUDENT
========================================================= */

export const getStoredStudent = () => {
  const storage = getStorage();

  if (!storage) {
    return null;
  }

  try {
    const raw = storage.getItem(
      STUDENT_DATA_KEY
    );

    if (!raw) {
      return null;
    }

    const student = JSON.parse(raw);

    if (
      !student ||
      typeof student !== "object" ||
      Array.isArray(student)
    ) {
      return null;
    }

    return student;
  } catch (error) {
    console.error(
      "Get Stored Student Error:",
      error
    );

    return null;
  }
};

/* =========================================================
   SAVE STORED STUDENT
========================================================= */

export const saveStoredStudent = (student) => {
  const storage = getStorage();

  if (
    !storage ||
    !student ||
    typeof student !== "object" ||
    Array.isArray(student)
  ) {
    return false;
  }

  try {
    storage.setItem(
      STUDENT_DATA_KEY,
      JSON.stringify(student)
    );

    return true;
  } catch (error) {
    console.error(
      "Save Stored Student Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   UPDATE STORED STUDENT

   Updates only the supplied student fields while preserving
   the rest of the currently stored student object.
========================================================= */

export const updateStoredStudent = (updates) => {
  const storage = getStorage();

  if (
    !storage ||
    !updates ||
    typeof updates !== "object" ||
    Array.isArray(updates)
  ) {
    return false;
  }

  try {
    const currentStudent =
      getStoredStudent() || {};

    const updatedStudent = {
      ...currentStudent,
      ...updates,
    };

    storage.setItem(
      STUDENT_DATA_KEY,
      JSON.stringify(updatedStudent)
    );

    return true;
  } catch (error) {
    console.error(
      "Update Stored Student Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   CLEAR STUDENT TOKEN
========================================================= */

export const clearStudentToken = () => {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(
      STUDENT_TOKEN_KEY
    );

    return true;
  } catch (error) {
    console.error(
      "Clear Student Token Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   CLEAR STORED STUDENT
========================================================= */

export const clearStoredStudent = () => {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  try {
    storage.removeItem(
      STUDENT_DATA_KEY
    );

    return true;
  } catch (error) {
    console.error(
      "Clear Stored Student Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   CLEAR COMPLETE STUDENT AUTH

   Removes:
   1. Current student token
   2. Current student data
   3. Legacy authentication keys

   Then notifies the rest of the application that the
   student authentication state has changed.
========================================================= */

export const clearStudentAuth = () => {
  const storage = getStorage();

  if (!storage) {
    return false;
  }

  let success = true;

  try {
    /* -----------------------------------------------------
       CURRENT AUTH KEYS
    ----------------------------------------------------- */

    storage.removeItem(
      STUDENT_TOKEN_KEY
    );

    storage.removeItem(
      STUDENT_DATA_KEY
    );

    /* -----------------------------------------------------
       LEGACY AUTH KEYS
    ----------------------------------------------------- */

    LEGACY_AUTH_KEYS.forEach((key) => {
      try {
        storage.removeItem(key);
      } catch (error) {
        console.error(
          `Unable to remove legacy auth key: ${key}`,
          error
        );

        success = false;
      }
    });

    /* -----------------------------------------------------
       AUTH CHANGE EVENT
    ----------------------------------------------------- */

    notifyStudentAuthChanged();

    return success;
  } catch (error) {
    console.error(
      "Clear Student Auth Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   STUDENT LOGIN STATUS
========================================================= */

export const isStudentLoggedIn = () => {
  return Boolean(
    getStudentToken()
  );
};

/* =========================================================
   STUDENT AUTH HEADERS
========================================================= */

export const getStudentAuthHeaders = () => {
  const token = getStudentToken();

  if (!token) {
    return {};
  }

  return {
    Authorization: `Bearer ${token}`,
  };
};

/* =========================================================
   STUDENT JSON AUTH HEADERS

   Use for authenticated JSON API requests.
========================================================= */

export const getStudentJsonHeaders = () => {
  return {
    "Content-Type": "application/json",
    ...getStudentAuthHeaders(),
  };
};

/* =========================================================
   NOTIFY AUTH CHANGE

   Useful after:
   - Login
   - Logout
   - Profile update
   - Session changes
========================================================= */

export const notifyStudentAuthChanged = () => {
  if (!isBrowser()) {
    return false;
  }

  try {
    window.dispatchEvent(
      new Event(STUDENT_AUTH_EVENT)
    );

    return true;
  } catch (error) {
    console.error(
      "Notify Student Auth Change Error:",
      error
    );

    return false;
  }
};

/* =========================================================
   EXPORT DEFAULT
========================================================= */

export default {
  STUDENT_TOKEN_KEY,
  STUDENT_DATA_KEY,
  STUDENT_AUTH_EVENT,

  getStudentToken,
  saveStudentToken,

  getStoredStudent,
  saveStoredStudent,
  updateStoredStudent,

  clearStudentToken,
  clearStoredStudent,
  clearStudentAuth,

  isStudentLoggedIn,

  getStudentAuthHeaders,
  getStudentJsonHeaders,

  notifyStudentAuthChanged,
};