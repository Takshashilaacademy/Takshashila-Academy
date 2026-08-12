import { useMemo, useState } from "react";
import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  FileText,
  GraduationCap,
  Loader2,
  LockKeyhole,
  Mail,
  Phone,
  ShieldCheck,
  UserRound,
} from "lucide-react";

import { API_URL } from "../config/api.js";

import {
  notifyStudentAuthChanged,
  saveStoredStudent,
  saveStudentToken,
} from "../utils/authStorage.js";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_NAME_LENGTH = 100;
const MAX_EMAIL_LENGTH = 150;
const MAX_PASSWORD_LENGTH = 128;
const REQUEST_TIMEOUT = 15000;

/* =========================================================
   SIGNUP PAGE
========================================================= */

export default function Signup() {
  const navigate = useNavigate();

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [formData, setFormData] = useState({
    name: "",
    mobile: "",
    email: "",
    password: "",
    confirmPassword: "",
  });

  /* =======================================================
     UI STATE
  ======================================================= */

  const [showPassword, setShowPassword] = useState(false);

  const [showConfirmPassword, setShowConfirmPassword] =
    useState(false);

  const [acceptedTerms, setAcceptedTerms] =
    useState(false);

  const [loading, setLoading] = useState(false);

  const [errorMessage, setErrorMessage] =
    useState("");

  const [successMessage, setSuccessMessage] =
    useState("");

  /* =======================================================
     PASSWORD STRENGTH
  ======================================================= */

  const passwordStrength = useMemo(() => {
    const password = formData.password;

    if (!password) {
      return {
        label: "",
        width: "w-0",
        text: "",
        className: "bg-slate-200",
      };
    }

    let score = 0;

    if (password.length >= 8) {
      score += 1;
    }

    if (/[a-z]/.test(password)) {
      score += 1;
    }

    if (/[A-Z]/.test(password)) {
      score += 1;
    }

    if (/\d/.test(password)) {
      score += 1;
    }

    if (/[^A-Za-z0-9]/.test(password)) {
      score += 1;
    }

    if (score <= 2) {
      return {
        label: "Weak",
        width: "w-1/3",
        text: "Use uppercase, lowercase, numbers and symbols.",
        className: "bg-red-500",
      };
    }

    if (score <= 4) {
      return {
        label: "Good",
        width: "w-2/3",
        text: "Good password. Add another character type for extra strength.",
        className: "bg-amber-500",
      };
    }

    return {
      label: "Strong",
      width: "w-full",
      text: "Strong password.",
      className: "bg-green-500",
    };
  }, [formData.password]);

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

    if (name === "name") {
      nextValue = value.slice(
        0,
        MAX_NAME_LENGTH
      );
    }

    if (name === "email") {
      nextValue = value
        .slice(0, MAX_EMAIL_LENGTH)
        .toLowerCase();
    }

    if (
      name === "password" ||
      name === "confirmPassword"
    ) {
      nextValue = value.slice(
        0,
        MAX_PASSWORD_LENGTH
      );
    }

    setFormData((previous) => ({
      ...previous,
      [name]: nextValue,
    }));

    setErrorMessage("");
    setSuccessMessage("");
  }

  /* =======================================================
     VALIDATE FORM
  ======================================================= */

  function validateForm() {
    const name = formData.name
      .trim()
      .replace(/\s+/g, " ");

    const mobile = formData.mobile.trim();

    const email = formData.email
      .trim()
      .toLowerCase();

    const password = formData.password;

    const confirmPassword =
      formData.confirmPassword;

    if (
      !name ||
      !mobile ||
      !email ||
      !password ||
      !confirmPassword
    ) {
      return "Please fill all required fields.";
    }

    if (name.length < 2) {
      return "Name must be at least 2 characters.";
    }

    if (name.length > MAX_NAME_LENGTH) {
      return `Name cannot exceed ${MAX_NAME_LENGTH} characters.`;
    }

    /*
     * Unicode-aware name validation.
     * Allows Indian/Hindi names as well as English names.
     */
    if (
      !/^[\p{L}\p{M}\s.'-]+$/u.test(name)
    ) {
      return "Please enter a valid name.";
    }

    if (!/^[6-9]\d{9}$/.test(mobile)) {
      return "Please enter a valid 10-digit Indian mobile number.";
    }

    if (
      !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
        email
      )
    ) {
      return "Please enter a valid email address.";
    }

    if (email.length > MAX_EMAIL_LENGTH) {
      return `Email cannot exceed ${MAX_EMAIL_LENGTH} characters.`;
    }

    if (password.length < 8) {
      return "Password must be at least 8 characters.";
    }

    if (password.length > MAX_PASSWORD_LENGTH) {
      return `Password cannot exceed ${MAX_PASSWORD_LENGTH} characters.`;
    }

    if (password !== confirmPassword) {
      return "Password and confirm password do not match.";
    }

    if (!acceptedTerms) {
      return "Please accept the Terms & Conditions and Privacy Policy.";
    }

    return "";
  }

  /* =======================================================
     SAFE RESPONSE PARSER
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

  function getSignupErrorMessage(
    response,
    data
  ) {
    if (response.status === 400) {
      return (
        data?.message ||
        "Please check the information you entered."
      );
    }

    if (response.status === 409) {
      return (
        data?.message ||
        "An account with these details already exists."
      );
    }

    if (response.status === 429) {
      return "Too many signup attempts. Please wait a little and try again.";
    }

    if (response.status >= 500) {
      return "Server error. Please try again in a moment.";
    }

    return (
      data?.message ||
      "Unable to create your account."
    );
  }

  /* =======================================================
     HANDLE SIGNUP
  ======================================================= */

  async function handleSubmit(event) {
    event.preventDefault();

    if (loading) {
      return;
    }

    setErrorMessage("");
    setSuccessMessage("");

    const validationError =
      validateForm();

    if (validationError) {
      setErrorMessage(
        validationError
      );

      return;
    }

    const name = formData.name
      .trim()
      .replace(/\s+/g, " ");

    const mobile =
      formData.mobile.trim();

    const email = formData.email
      .trim()
      .toLowerCase();

    const password =
      formData.password;

    const controller =
      new AbortController();

    let timeoutId = null;

    try {
      setLoading(true);

      timeoutId = window.setTimeout(() => {
        controller.abort();
      }, REQUEST_TIMEOUT);

      const response = await fetch(
        `${API_URL}/api/auth/signup`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",
            Accept:
              "application/json",
          },

          body: JSON.stringify({
            name,
            mobile,
            email,
            password,
          }),

          signal: controller.signal,
        }
      );

      const data =
        await parseResponse(response);

      /* =================================================
         API ERROR
      ================================================= */

      if (!response.ok) {
        let message =
          getSignupErrorMessage(
            response,
            data
          );

        if (
          data?.code ===
          "EMAIL_EXISTS"
        ) {
          message =
            "An account with this email already exists. Please login instead.";
        }

        if (
          data?.code ===
          "MOBILE_EXISTS"
        ) {
          message =
            "An account with this mobile number already exists. Please login instead.";
        }

        throw new Error(message);
      }

      /* =================================================
         TOKEN VALIDATION
      ================================================= */

      if (
        typeof data?.token !==
          "string" ||
        !data.token.trim()
      ) {
        throw new Error(
          "Account was created, but authentication could not be completed. Please login manually."
        );
      }

      /* =================================================
         SAVE AUTHENTICATION
      ================================================= */

      const tokenSaved =
        saveStudentToken(
          data.token
        );

      if (!tokenSaved) {
        throw new Error(
          "Account created, but secure login information could not be saved on this device."
        );
      }

      /* =================================================
         SAVE STUDENT PROFILE
      ================================================= */

      if (
        data?.student &&
        typeof data.student ===
          "object" &&
        !Array.isArray(
          data.student
        )
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
      ================================================= */

      try {
        notifyStudentAuthChanged();
      } catch (error) {
        /*
         * Authentication has already been saved.
         * Event failure should not turn a successful
         * signup into a failed signup.
         */
        console.warn(
          "Student auth change notification failed:",
          error
        );
      }

      /* =================================================
         SUCCESS
      ================================================= */

      setSuccessMessage(
        "Account created successfully! Opening your dashboard..."
      );

      setFormData({
        name: "",
        mobile: "",
        email: "",
        password: "",
        confirmPassword: "",
      });

      setAcceptedTerms(false);

      /* =================================================
         REDIRECT
      ================================================= */

      window.setTimeout(() => {
        navigate("/dashboard", {
          replace: true,
        });
      }, 700);
    } catch (error) {
      console.error(
        "Signup Error:",
        error
      );

      if (
        error?.name ===
        "AbortError"
      ) {
        setErrorMessage(
          "Signup request timed out. Please check your internet connection and try again."
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
            "Something went wrong while creating your account. Please try again."
        );
      }
    } finally {
      if (timeoutId) {
        window.clearTimeout(
          timeoutId
        );
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
          BACKGROUND DECORATION
      ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">
        <div className="absolute -left-40 top-20 h-80 w-80 rounded-full bg-red-100/50 blur-3xl" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

        <div className="absolute left-1/2 top-1/3 h-72 w-72 -translate-x-1/2 rounded-full bg-white/70 blur-3xl" />
      </div>

      <div className="container-main relative grid min-h-[calc(100vh-72px)] items-center gap-12 py-8 sm:py-12 lg:grid-cols-[minmax(0,1fr)_500px] lg:gap-16 lg:py-16">
        {/* =================================================
            LEFT INFORMATION
        ================================================= */}

        <section className="hidden lg:block">
          <div className="max-w-xl">
            <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm">
              <ShieldCheck size={16} />

              Secure Student Registration
            </div>

            <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight text-[#071b41] xl:text-6xl">
              अपनी तैयारी का

              <span className="block text-red-700">
                सही शुरुआत करें।
              </span>
            </h1>

            <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
              Takshashila Academy पर student
              account बनाकर अपने purchased
              courses, recorded lectures और
              study material को एक जगह से
              access करें।
            </p>

            <div className="mt-10 space-y-6">
              <Feature
                icon={
                  <GraduationCap size={21} />
                }
                iconClass="bg-blue-50 text-blue-700"
                title="Structured Learning"
                description="अपने courses और learning progress को एक organized dashboard से manage करें।"
              />

              <Feature
                icon={
                  <FileText size={20} />
                }
                iconClass="bg-orange-50 text-orange-700"
                title="Notes & Study Material"
                description="Purchased courses के notes, PDFs और revision material एक जगह access करें।"
              />

              <Feature
                icon={
                  <ShieldCheck size={20} />
                }
                iconClass="bg-green-50 text-green-700"
                title="Secure Student Account"
                description="आपका account authentication और protected access के साथ सुरक्षित रहेगा।"
              />
            </div>
          </div>
        </section>

        {/* =================================================
            SIGNUP CARD
        ================================================= */}

        <section className="mx-auto w-full max-w-[500px]">
          <div className="relative">
            <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-red-200/60 via-transparent to-blue-200/60 blur-xl" />

            <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">
              {/* =================================================
                  CARD HEADER
              ================================================= */}

              <div className="bg-[#071b41] px-6 py-7 text-white sm:px-8">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-yellow-400 ring-1 ring-white/10">
                      <GraduationCap size={25} />
                    </div>

                    <div>
                      <p className="text-xs font-bold text-slate-400">
                        Student Registration
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

              <div className="p-6 sm:p-8">
                {/* =================================================
                    TITLE
                ================================================= */}

                <div>
                  <h2 className="text-2xl font-black tracking-tight text-[#071b41]">
                    Create your account
                  </h2>

                  <p className="mt-2 text-sm leading-6 text-slate-500">
                    अपनी preparation journey शुरू करें।
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
                        size={20}
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
                  {/* FULL NAME */}

                  <FormField
                    label="Full Name"
                    htmlFor="signup-name"
                    icon={
                      <UserRound size={18} />
                    }
                  >
                    <input
                      id="signup-name"
                      name="name"
                      type="text"
                      autoComplete="name"
                      value={formData.name}
                      onChange={handleChange}
                      placeholder="Enter your full name"
                      disabled={loading}
                      maxLength={
                        MAX_NAME_LENGTH
                      }
                      required
                      className="signup-input pl-11"
                    />
                  </FormField>

                  {/* MOBILE */}

                  <FormField
                    label="Mobile Number"
                    htmlFor="signup-mobile"
                    icon={
                      <Phone size={18} />
                    }
                    hint="10 digit mobile number"
                  >
                    <input
                      id="signup-mobile"
                      name="mobile"
                      type="tel"
                      inputMode="numeric"
                      autoComplete="tel"
                      maxLength={10}
                      value={formData.mobile}
                      onChange={handleChange}
                      placeholder="Enter 10 digit mobile number"
                      disabled={loading}
                      required
                      className="signup-input pl-11"
                    />
                  </FormField>

                  {/* EMAIL */}

                  <FormField
                    label="Email Address"
                    htmlFor="signup-email"
                    icon={
                      <Mail size={18} />
                    }
                  >
                    <input
                      id="signup-email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="email"
                      value={formData.email}
                      onChange={handleChange}
                      placeholder="Enter your email address"
                      disabled={loading}
                      maxLength={
                        MAX_EMAIL_LENGTH
                      }
                      required
                      className="signup-input pl-11"
                    />
                  </FormField>

                  {/* PASSWORD */}

                  <div>
                    <label
                      htmlFor="signup-password"
                      className="mb-2.5 block text-sm font-black text-slate-700"
                    >
                      Create Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="signup-password"
                        name="password"
                        type={
                          showPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        value={formData.password}
                        onChange={handleChange}
                        placeholder="Create a strong password"
                        disabled={loading}
                        maxLength={
                          MAX_PASSWORD_LENGTH
                        }
                        required
                        className="signup-input pl-11 pr-12"
                      />

                      <PasswordToggle
                        visible={showPassword}
                        onClick={() =>
                          setShowPassword(
                            (previous) =>
                              !previous
                          )
                        }
                        disabled={loading}
                      />
                    </div>

                    {formData.password && (
                      <div className="mt-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-slate-500">
                            Password strength
                          </span>

                          <span className="text-[11px] font-black text-slate-700">
                            {
                              passwordStrength.label
                            }
                          </span>
                        </div>

                        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">
                          <div
                            className={`h-full rounded-full transition-all duration-300 ${passwordStrength.width} ${passwordStrength.className}`}
                          />
                        </div>

                        <p className="mt-2 text-[11px] leading-5 text-slate-400">
                          {
                            passwordStrength.text
                          }
                        </p>
                      </div>
                    )}
                  </div>

                  {/* CONFIRM PASSWORD */}

                  <div>
                    <label
                      htmlFor="signup-confirm-password"
                      className="mb-2.5 block text-sm font-black text-slate-700"
                    >
                      Confirm Password
                    </label>

                    <div className="relative">
                      <LockKeyhole
                        size={18}
                        className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                      />

                      <input
                        id="signup-confirm-password"
                        name="confirmPassword"
                        type={
                          showConfirmPassword
                            ? "text"
                            : "password"
                        }
                        autoComplete="new-password"
                        value={
                          formData.confirmPassword
                        }
                        onChange={handleChange}
                        placeholder="Confirm your password"
                        disabled={loading}
                        maxLength={
                          MAX_PASSWORD_LENGTH
                        }
                        required
                        className="signup-input pl-11 pr-12"
                      />

                      <PasswordToggle
                        visible={
                          showConfirmPassword
                        }
                        onClick={() =>
                          setShowConfirmPassword(
                            (previous) =>
                              !previous
                          )
                        }
                        disabled={loading}
                      />
                    </div>

                    {formData.confirmPassword && (
                      <div className="mt-2">
                        {formData.password ===
                        formData.confirmPassword ? (
                          <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600">
                            <CheckCircle2 size={14} />
                            Passwords match
                          </p>
                        ) : (
                          <p className="text-[11px] font-bold text-red-600">
                            Passwords do not match
                          </p>
                        )}
                      </div>
                    )}
                  </div>

                  {/* TERMS */}

                  <label className="flex cursor-pointer items-start gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4 transition hover:border-slate-200">
                    <input
                      type="checkbox"
                      checked={acceptedTerms}
                      onChange={(event) => {
                        setAcceptedTerms(
                          event.target.checked
                        );
                        setErrorMessage("");
                      }}
                      disabled={loading}
                      required
                      className="mt-0.5 h-4 w-4 shrink-0 cursor-pointer rounded border-slate-300 accent-red-700"
                    />

                    <span className="text-xs leading-5 text-slate-500">
                      मैं Takshashila Academy के
                      Terms & Conditions और
                      Privacy Policy को स्वीकार
                      करता/करती हूँ।
                    </span>
                  </label>

                  {/* SUBMIT */}

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

                        Creating Account...
                      </>
                    ) : (
                      <>
                        Create Student Account

                        <ArrowRight
                          size={19}
                          className="transition-transform duration-200 group-hover:translate-x-0.5"
                        />
                      </>
                    )}
                  </button>
                </form>

                {/* =================================================
                    LOGIN
                ================================================= */}

                <div className="mt-7 border-t border-slate-100 pt-6 text-center">
                  <p className="text-sm text-slate-500">
                    पहले से student account है?
                  </p>

                  <Link
                    to="/login"
                    className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-red-700 transition hover:text-red-800"
                  >
                    Login to Your Account
                    <ArrowRight size={15} />
                  </Link>
                </div>

                {/* =================================================
                    SECURITY
                ================================================= */}

                <div className="mt-6 flex items-start gap-3 rounded-2xl border border-green-100 bg-green-50/70 p-4">
                  <ShieldCheck
                    size={19}
                    className="mt-0.5 shrink-0 text-green-600"
                  />

                  <div>
                    <p className="text-xs font-black text-green-800">
                      Secure Registration
                    </p>

                    <p className="mt-1 text-[11px] leading-5 text-green-700">
                      आपका password secure
                      authentication system के
                      माध्यम से protected रहेगा।
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>
  );
}

/* =========================================================
   FORM FIELD
========================================================= */

function FormField({
  label,
  htmlFor,
  icon,
  hint,
  children,
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-center justify-between gap-3">
        <label
          htmlFor={htmlFor}
          className="text-sm font-black text-slate-700"
        >
          {label}
        </label>

        {hint && (
          <span className="text-[10px] font-bold text-slate-400">
            {hint}
          </span>
        )}
      </div>

      <div className="relative">
        <div className="pointer-events-none absolute left-3.5 top-1/2 z-10 -translate-y-1/2 text-slate-400">
          {icon}
        </div>

        {children}
      </div>
    </div>
  );
}

/* =========================================================
   PASSWORD TOGGLE
========================================================= */

function PasswordToggle({
  visible,
  onClick,
  disabled,
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-red-100 disabled:cursor-not-allowed disabled:opacity-50"
      aria-label={
        visible
          ? "Hide password"
          : "Show password"
      }
    >
      {visible ? (
        <EyeOff size={18} />
      ) : (
        <Eye size={18} />
      )}
    </button>
  );
}

/* =========================================================
   FEATURE
========================================================= */

function Feature({
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