import { useEffect, useState } from "react";
import {
  Link,
  useLocation,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Phone,
  ShieldCheck,
  Sparkles,
  UserRound,
} from "lucide-react";

import { API_URL } from "../config/api.js";
import SEO from "../components/SEO.jsx";

import {
  isStudentLoggedIn,
  notifyStudentAuthChanged,
  saveStoredStudent,
  saveStudentToken,
} from "../utils/authStorage.js";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_PASSWORD_LENGTH = 128;
const REQUEST_TIMEOUT = 15000;

/* =========================================================
   LOGIN PAGE
========================================================= */

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();

  /* =======================================================
     STATES
  ======================================================= */

  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [successMessage, setSuccessMessage] = useState("");

  const [formData, setFormData] = useState({
    mobile: "",
    password: "",
  });

  /* =======================================================
     REDIRECT ALREADY LOGGED-IN STUDENT

     Prevents an already authenticated student from staying
     unnecessarily on the login page.
  ======================================================= */

  useEffect(() => {
    if (isStudentLoggedIn()) {
      navigate(getRedirectPath(location), {
        replace: true,
      });
    }
  }, [navigate, location]);

  /* =======================================================
     SAFE REDIRECT

     Only internal application paths are accepted.

     Allowed:
     /dashboard
     /course/123
     /learning/123?lesson=5

     Rejected:
     https://example.com
     //example.com
  ======================================================= */

  function getRedirectPath(currentLocation = location) {
    const params = new URLSearchParams(
      currentLocation.search
    );

    const queryRedirect = params.get("redirect");

    const stateFrom = currentLocation.state?.from;

    const redirect =
      queryRedirect ||
      (typeof stateFrom === "string"
        ? stateFrom
        : "");

    if (
      typeof redirect === "string" &&
      redirect.startsWith("/") &&
      !redirect.startsWith("//")
    ) {
      return redirect;
    }

    return "/dashboard";
  }

  /* =======================================================
     CLEAR MESSAGES
  ======================================================= */

  function clearMessages() {
    setErrorMessage("");
    setSuccessMessage("");
  }

  /* =======================================================
     FORGOT PASSWORD
  ======================================================= */

  function handleForgotPassword() {
    if (loading) {
      return;
    }

    navigate("/forgot-password");
  }

  /* =======================================================
     HANDLE INPUT
  ======================================================= */

  function handleChange(event) {
    const { name, value } = event.target;

    let nextValue = value;

    if (name === "mobile") {
      nextValue = value
        .replace(/\D/g, "")
        .slice(0, 10);
    }

    if (name === "password") {
      nextValue = value.slice(
        0,
        MAX_PASSWORD_LENGTH
      );
    }

    setFormData((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    if (errorMessage || successMessage) {
      clearMessages();
    }
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  function validateForm() {
    const mobile = formData.mobile.trim();
    const password = formData.password;

    if (!mobile) {
      return "Mobile number required है.";
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return "कृपया valid 10 digit mobile number डालें.";
    }

    if (!password) {
      return "Password required है.";
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`;
    }

    return "";
  }

  /* =======================================================
     SAFE JSON RESPONSE PARSER
  ======================================================= */

  async function parseResponse(response) {
    const responseText = await response.text();

    if (!responseText) {
      return {};
    }

    try {
      return JSON.parse(responseText);
    } catch {
      return {
        message: responseText,
      };
    }
  }

  /* =======================================================
     API ERROR MESSAGE
  ======================================================= */

  function getLoginErrorMessage(
    response,
    data
  ) {
    if (response.status === 400) {
      return (
        data?.message ||
        "Please check your login details."
      );
    }

    if (response.status === 401) {
      return "Invalid mobile number or password.";
    }

    if (response.status === 403) {
      return (
        data?.message ||
        "Your account is currently inactive. Please contact support."
      );
    }

    if (response.status === 404) {
      return (
        data?.message ||
        "Login service is currently unavailable."
      );
    }

    if (response.status >= 500) {
      return "Server error. Please try again in a moment.";
    }

    return (
      data?.message ||
      "Login failed. Please try again."
    );
  }

  /* =======================================================
     HANDLE LOGIN
  ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    clearMessages();

    const validationError = validateForm();

    if (validationError) {
      setErrorMessage(validationError);
      return;
    }

    const mobile = formData.mobile.trim();
    const password = formData.password;

    let timeoutId = null;
    const controller = new AbortController();

    try {
      setLoading(true);

      timeoutId = window.setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT);

      const response = await fetch(
        `${API_URL}/api/auth/login`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Accept: "application/json",
          },

          body: JSON.stringify({
            mobile,
            password,
          }),

          signal: controller.signal,
        }
      );

      const data = await parseResponse(
        response
      );

      /* =================================================
         API ERROR
      ================================================= */

      if (!response.ok) {
        throw new Error(
          getLoginErrorMessage(
            response,
            data
          )
        );
      }

      /* =================================================
         TOKEN VALIDATION
      ================================================= */

      if (
        typeof data?.token !== "string" ||
        !data.token.trim()
      ) {
        throw new Error(
          "Login successful लेकिन authentication token नहीं मिला. Please try again."
        );
      }

      /* =================================================
         SAVE JWT
      ================================================= */

      const tokenSaved = saveStudentToken(
        data.token
      );

      if (!tokenSaved) {
        throw new Error(
          "Authentication session save नहीं हो पाया. Please try again."
        );
      }

      /* =================================================
         SAVE STUDENT PROFILE
      ================================================= */

      if (
        data?.student &&
        typeof data.student === "object" &&
        !Array.isArray(data.student)
      ) {
        const studentSaved =
          saveStoredStudent(
            data.student
          );

        if (!studentSaved) {
          console.warn(
            "Student profile could not be saved locally."
          );
        }
      }

      /* =================================================
         AUTH CHANGE EVENT

         Do not fail a successful login just because
         the UI notification event fails.
      ================================================= */

      try {
        notifyStudentAuthChanged();
      } catch (error) {
        console.warn(
          "Student auth change notification failed:",
          error
        );
      }

      /* =================================================
         SUCCESS
      ================================================= */

      setSuccessMessage(
        "Login successful. Welcome back!"
      );

      /* =================================================
         CLEAR PASSWORD FROM MEMORY/UI STATE
      ================================================= */

      setFormData({
        mobile,
        password: "",
      });

      /* =================================================
         REDIRECT

         Give the success state a short moment to render.
      ================================================= */

      const redirectPath =
        getRedirectPath(location);

      window.setTimeout(() => {
        navigate(redirectPath, {
          replace: true,
        });
      }, 450);
    } catch (error) {
      console.error(
        "Login Error:",
        error
      );

      if (error?.name === "AbortError") {
        setErrorMessage(
          "Login request timed out. Please check your internet connection and try again."
        );
      } else if (
        error instanceof TypeError
      ) {
        setErrorMessage(
          "Unable to connect to the server. Please check your internet connection and try again."
        );
      } else {
        setErrorMessage(
          error?.message ||
            "Login failed. Please try again."
        );
      }
    } finally {
      if (timeoutId) {
        window.clearTimeout(timeoutId);
      }

      setLoading(false);
    }
  }

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-slate-50">

      {/* =================================================
          LOGIN PAGE SEO
      ================================================= */}

      <SEO
        title="Student Login"
        description="Securely login to your Takshashila Academy student account and access purchased courses, recorded videos, notes and PDFs."
        path="/login"
      />


      {/* =================================================
          BACKGROUND DECORATION
      ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-red-100/50 blur-3xl" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-white/80 blur-3xl" />
      </div>

      {/* =================================================
          MAIN CONTAINER
      ================================================= */}

      <div className="container-main relative flex min-h-[calc(100vh-72px)] items-center py-8 sm:py-12 lg:py-16">
        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">
          {/* =================================================
              LEFT INFORMATION
          ================================================= */}

          <section className="hidden lg:block">
            <div className="max-w-xl">
              {/* BRAND BADGE */}

              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm">
                <Sparkles size={15} />

                Takshashila Academy
              </div>

              {/* HEADING */}

              <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight text-[#071b41] xl:text-6xl">
                अपनी तैयारी

                <span className="block text-red-700">
                  जारी रखें।
                </span>
              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
                अपने Takshashila Academy
                student account में secure
                login करें और अपने purchased
                courses, recorded videos,
                notes और PDFs को एक ही जगह
                से access करें।
              </p>

              {/* FEATURES */}

              <div className="mt-10 space-y-6">
                <LoginFeature
                  icon={<UserRound size={20} />}
                  iconClass="bg-blue-50 text-blue-700"
                  title="Personal Student Account"
                  description="आपके courses और learning activity आपके account से securely connected रहती है।"
                />

                <LoginFeature
                  icon={<LockKeyhole size={20} />}
                  iconClass="bg-green-50 text-green-700"
                  title="Protected Learning Content"
                  description="Purchased courses का paid content केवल authorized students के लिए available रहेगा।"
                />

                <LoginFeature
                  icon={<ShieldCheck size={20} />}
                  iconClass="bg-yellow-50 text-yellow-700"
                  title="Secure Authentication"
                  description="आपका student session protected authentication system के द्वारा manage होता है।"
                />
              </div>

              {/* TRUST BADGES */}

              <div className="mt-10 flex flex-wrap gap-3">
                <TrustBadge>
                  <CheckCircle2 size={15} />
                  Secure Login
                </TrustBadge>

                <TrustBadge>
                  <CheckCircle2 size={15} />
                  Student Dashboard
                </TrustBadge>

                <TrustBadge>
                  <CheckCircle2 size={15} />
                  Protected Courses
                </TrustBadge>
              </div>
            </div>
          </section>

          {/* =================================================
              LOGIN CARD
          ================================================= */}

          <section className="mx-auto w-full max-w-[480px]">
            <div className="relative">
              {/* CARD GLOW */}

              <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-red-200/60 via-transparent to-blue-200/60 blur-xl" />

              {/* CARD */}

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
                {/* =================================================
                    CARD HEADER
                ================================================= */}

                <div className="bg-[#071b41] px-6 py-7 text-white sm:px-8">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-yellow-400 ring-1 ring-white/10">
                        <GraduationCap size={25} />
                      </div>

                      <div>
                        <p className="text-xs font-bold text-slate-400">
                          Welcome Back
                        </p>

                        <p className="mt-0.5 font-black">
                          Takshashila Academy
                        </p>
                      </div>
                    </div>

                    <div className="hidden h-9 w-9 items-center justify-center rounded-xl bg-white/10 text-green-400 sm:flex">
                      <ShieldCheck size={18} />
                    </div>
                  </div>
                </div>

                {/* =================================================
                    CARD BODY
                ================================================= */}

                <div className="p-6 sm:p-8">
                  {/* TITLE */}

                  <div>
                    <h2 className="text-2xl font-black tracking-tight text-[#071b41]">
                      Student Login
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      अपने account में login
                      करके अपनी learning जारी
                      रखें।
                    </p>
                  </div>

                  {/* =================================================
                      ERROR
                  ================================================= */}

                  {errorMessage && (
                    <div
                      role="alert"
                      aria-live="polite"
                      className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-red-700">
                          !
                        </div>

                        <p className="pt-1 text-sm font-bold leading-5 text-red-700">
                          {errorMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      SUCCESS
                  ================================================= */}

                  {successMessage && (
                    <div
                      role="status"
                      aria-live="polite"
                      className="mt-6 rounded-2xl border border-green-200 bg-green-50 p-4"
                    >
                      <div className="flex items-start gap-3">
                        <CheckCircle2
                          size={19}
                          className="mt-0.5 shrink-0 text-green-600"
                        />

                        <p className="text-sm font-bold leading-5 text-green-700">
                          {successMessage}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form
                    onSubmit={handleSubmit}
                    className="mt-7 space-y-5"
                    noValidate
                  >
                    {/* =============================================
                        MOBILE
                    ============================================= */}

                    <div>
                      <label
                        htmlFor="mobile"
                        className="mb-2.5 block text-sm font-black text-slate-700"
                      >
                        Mobile Number
                      </label>

                      <div className="relative">
                        <Phone
                          size={18}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="mobile"
                          name="mobile"
                          type="tel"
                          inputMode="numeric"
                          autoComplete="tel"
                          maxLength={10}
                          value={formData.mobile}
                          onChange={handleChange}
                          placeholder="Enter 10 digit mobile number"
                          required
                          disabled={loading}
                          aria-invalid={
                            Boolean(errorMessage)
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />
                      </div>

                      <p className="mt-2 text-[11px] font-medium text-slate-400">
                        Registered mobile number
                        enter करें।
                      </p>
                    </div>

                    {/* =============================================
                        PASSWORD
                    ============================================= */}

                    <div>
                      <div className="mb-2.5 flex items-center justify-between gap-3">
                        <label
                          htmlFor="password"
                          className="block text-sm font-black text-slate-700"
                        >
                          Password
                        </label>

                        <button
                          type="button"
                          onClick={handleForgotPassword}
                          disabled={loading}
                          className="rounded-lg px-1 py-1 text-xs font-black text-red-700 transition hover:bg-red-50 hover:text-red-800 disabled:cursor-not-allowed disabled:opacity-50"
                        >
                          Forgot Password?
                        </button>
                      </div>

                      <div className="relative">
                        <LockKeyhole
                          size={18}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="password"
                          name="password"
                          type={
                            showPassword
                              ? "text"
                              : "password"
                          }
                          autoComplete="current-password"
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="Enter your password"
                          maxLength={
                            MAX_PASSWORD_LENGTH
                          }
                          required
                          disabled={loading}
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />

                        <button
                          type="button"
                          onClick={() =>
                            setShowPassword(
                              (previous) =>
                                !previous
                            )
                          }
                          disabled={loading}
                          className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                          aria-label={
                            showPassword
                              ? "Hide password"
                              : "Show password"
                          }
                        >
                          {showPassword ? (
                            <EyeOff size={18} />
                          ) : (
                            <Eye size={18} />
                          )}
                        </button>
                      </div>
                    </div>

                    {/* =============================================
                        LOGIN BUTTON
                    ============================================= */}

                    <button
                      type="submit"
                      disabled={loading}
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-xl hover:shadow-red-700/25 focus:outline-none focus:ring-4 focus:ring-red-100 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-red-400 disabled:shadow-none"
                    >
                      {loading ? (
                        <>
                          <Loader2
                            size={19}
                            className="animate-spin"
                          />

                          Logging in...
                        </>
                      ) : (
                        <>
                          Login

                          <ArrowRight
                            size={19}
                            className="transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </>
                      )}
                    </button>
                  </form>

                  {/* =================================================
                      SIGNUP
                  ================================================= */}

                  <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                    <p className="text-sm text-slate-500">
                      अभी तक account नहीं बनाया?
                    </p>

                    <Link
                      to="/signup"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-red-700 transition hover:text-red-800"
                    >
                      Create Student Account

                      <ArrowRight size={15} />
                    </Link>
                  </div>

                  {/* =================================================
                      SECURITY NOTE
                  ================================================= */}

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">
                    <div className="flex items-start gap-3">
                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                        <ShieldCheck size={18} />
                      </div>

                      <div>
                        <p className="text-xs font-black text-slate-700">
                          Secure Student Access
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          आपका authentication token
                          secure student session के
                          लिए use किया जाता है।
                        </p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}

/* =========================================================
   LOGIN FEATURE
========================================================= */

function LoginFeature({
  icon,
  iconClass,
  title,
  description,
}) {
  return (
    <div className="flex items-start gap-4">
      <div
        className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${iconClass}`}
      >
        {icon}
      </div>

      <div>
        <h3 className="font-black text-[#071b41]">
          {title}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>
      </div>
    </div>
  );
}

/* =========================================================
   TRUST BADGE
========================================================= */

function TrustBadge({ children }) {
  return (
    <div className="inline-flex items-center gap-1.5 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-xs font-bold text-slate-600 shadow-sm">
      {children}
    </div>
  );
}