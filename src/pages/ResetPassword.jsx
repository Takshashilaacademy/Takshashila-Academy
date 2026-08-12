import {
  Link,
  useNavigate,
  useSearchParams,
} from "react-router-dom";

import {
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  Eye,
  EyeOff,
  GraduationCap,
  KeyRound,
  Loader2,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { API_URL } from "../config/api.js";

/* =========================================================
   RESET PASSWORD PAGE
========================================================= */

export default function ResetPassword() {
  const navigate =
    useNavigate();

  const [
    searchParams,
  ] = useSearchParams();

  /* =======================================================
     RESET TOKEN
  ======================================================= */

  const token = useMemo(
    () =>
      (
        searchParams.get(
          "token"
        ) || ""
      ).trim(),
    [searchParams]
  );

  /* =======================================================
     FORM STATE
  ======================================================= */

  const [
    password,
    setPassword,
  ] = useState("");

  const [
    confirmPassword,
    setConfirmPassword,
  ] = useState("");

  /* =======================================================
     UI STATE
  ======================================================= */

  const [
    showPassword,
    setShowPassword,
  ] = useState(false);

  const [
    showConfirmPassword,
    setShowConfirmPassword,
  ] = useState(false);

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    completed,
    setCompleted,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* =======================================================
     PASSWORD STRENGTH
  ======================================================= */

  const passwordStrength =
    useMemo(() => {
      let score = 0;

      if (
        password.length >= 8
      ) {
        score += 1;
      }

      if (
        /[A-Z]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (
        /[a-z]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (
        /\d/.test(
          password
        )
      ) {
        score += 1;
      }

      if (
        /[^A-Za-z0-9]/.test(
          password
        )
      ) {
        score += 1;
      }

      if (!password) {
        return {
          label: "",
          width: "w-0",
          text: "",
        };
      }

      if (score <= 2) {
        return {
          label: "Weak",
          width: "w-1/3",
          text:
            "Use uppercase, lowercase, numbers and symbols.",
        };
      }

      if (score <= 4) {
        return {
          label: "Good",
          width: "w-2/3",
          text:
            "Password is getting stronger.",
        };
      }

      return {
        label: "Strong",
        width: "w-full",
        text:
          "Strong password.",
      };
    }, [
      password,
    ]);

  /* =======================================================
     PASSWORD CHANGE
  ======================================================= */

  const handlePasswordChange =
    (event) => {
      const value =
        event.target.value.slice(
          0,
          128
        );

      setPassword(
        value
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );
    };

  /* =======================================================
     CONFIRM PASSWORD CHANGE
  ======================================================= */

  const handleConfirmPasswordChange =
    (event) => {
      const value =
        event.target.value.slice(
          0,
          128
        );

      setConfirmPassword(
        value
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );
    };

  /* =======================================================
     SUBMIT
  ======================================================= */

  const handleSubmit =
    async (
      event
    ) => {
      event.preventDefault();

      if (
        loading ||
        completed
      ) {
        return;
      }

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      /* ===================================================
         TOKEN
      =================================================== */

      if (!token) {
        setErrorMessage(
          "Password reset link invalid है. कृपया नया reset link request करें."
        );

        return;
      }

      /* ===================================================
         PASSWORD
      =================================================== */

      if (!password) {
        setErrorMessage(
          "Please enter your new password."
        );

        return;
      }

      if (
        password.length <
        8
      ) {
        setErrorMessage(
          "Password must be at least 8 characters."
        );

        return;
      }

      if (
        password.length >
        128
      ) {
        setErrorMessage(
          "Password cannot exceed 128 characters."
        );

        return;
      }

      /* ===================================================
         CONFIRM PASSWORD
      =================================================== */

      if (
        !confirmPassword
      ) {
        setErrorMessage(
          "Please confirm your new password."
        );

        return;
      }

      if (
        password !==
        confirmPassword
      ) {
        setErrorMessage(
          "Passwords do not match."
        );

        return;
      }

      try {
        setLoading(
          true
        );

        /* =================================================
           API REQUEST
        ================================================= */

        const response =
          await fetch(
            `${API_URL}/api/auth/reset-password`,
            {
              method:
                "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Accept:
                  "application/json",
              },

              body:
                JSON.stringify({
                  token,
                  password,
                }),
            }
          );

        let data =
          {};

        const responseText =
          await response.text();

        if (
          responseText
        ) {
          try {
            data =
              JSON.parse(
                responseText
              );
          } catch {
            data =
              {};
          }
        }

        /* =================================================
           API ERROR
        ================================================= */

        if (
          !response.ok
        ) {
          let message =
            data?.message ||
            "Unable to reset your password.";

          if (
            response.status ===
            400 &&
            data?.code ===
              "INVALID_OR_EXPIRED_RESET_TOKEN"
          ) {
            message =
              "This reset link is invalid or has expired. Please request a new password reset link.";
          }

          throw new Error(
            message
          );
        }

        /* =================================================
           SUCCESS
        ================================================= */

        setSuccessMessage(
          data?.message ||
            "Password reset successful. Please login with your new password."
        );

        setPassword(
          ""
        );

        setConfirmPassword(
          ""
        );

        setCompleted(
          true
        );

        /*
         * Give the student enough time to see the
         * successful reset message.
         */

        window.setTimeout(
          () => {
            navigate(
              "/login",
              {
                replace:
                  true,
              }
            );
          },
          1800
        );
      } catch (
        error
      ) {
        console.error(
          "Reset Password Error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Unable to reset your password. Please try again."
        );
      } finally {
        setLoading(
          false
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <main className="min-h-[calc(100vh-72px)] overflow-hidden bg-slate-50">

      {/* =================================================
          BACKGROUND
      ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-red-100/50 blur-3xl" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

      </div>

      {/* =================================================
          MAIN
      ================================================= */}

      <div className="container-main relative flex min-h-[calc(100vh-72px)] items-center py-8 sm:py-12 lg:py-16">

        <div className="grid w-full items-center gap-10 lg:grid-cols-[minmax(0,1fr)_480px] lg:gap-16">

          {/* =================================================
              LEFT INFORMATION
          ================================================= */}

          <section className="hidden lg:block">

            <div className="max-w-xl">

              {/* BADGE */}

              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm">

                <Sparkles
                  size={15}
                />

                Account Security

              </div>

              {/* HEADING */}

              <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight text-[#071b41] xl:text-6xl">

                नया password

                <span className="block text-red-700">
                  सुरक्षित बनाएं।
                </span>

              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
                अपने Takshashila Academy student
                account के लिए नया secure password
                set करें और अपनी learning जारी रखें।
              </p>

              {/* FEATURES */}

              <div className="mt-10 space-y-6">

                <InfoFeature
                  icon={
                    <KeyRound
                      size={20}
                    />
                  }
                  iconClass="bg-blue-50 text-blue-700"
                  title="Strong Password"
                  description="कम से कम 8 characters का unique password रखें।"
                />

                <InfoFeature
                  icon={
                    <ShieldCheck
                      size={20}
                    />
                  }
                  iconClass="bg-green-50 text-green-700"
                  title="Secure Reset"
                  description="Reset token limited time के लिए valid है और successful reset के बाद expire हो जाता है।"
                />

                <InfoFeature
                  icon={
                    <LockKeyhole
                      size={20}
                    />
                  }
                  iconClass="bg-yellow-50 text-yellow-700"
                  title="Private Account"
                  description="अपना password किसी के साथ share न करें।"
                />

              </div>

            </div>

          </section>

          {/* =================================================
              CARD
          ================================================= */}

          <section className="mx-auto w-full max-w-[480px]">

            <div className="relative">

              <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-red-200/60 via-transparent to-blue-200/60 blur-xl" />

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">

                {/* =================================================
                    HEADER
                ================================================= */}

                <div className="bg-[#071b41] px-6 py-7 text-white sm:px-8">

                  <div className="flex items-center gap-3">

                    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/10 text-yellow-400 ring-1 ring-white/10">

                      <GraduationCap
                        size={25}
                      />

                    </div>

                    <div>

                      <p className="text-xs font-bold text-slate-400">
                        Account Security
                      </p>

                      <p className="mt-0.5 font-black">
                        Takshashila Academy
                      </p>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    BODY
                ================================================= */}

                <div className="p-6 sm:p-8">

                  {/* BACK */}

                  <Link
                    to="/login"
                    className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800"
                  >

                    <ArrowLeft
                      size={16}
                    />

                    Back to Login

                  </Link>

                  {/* TITLE */}

                  <div>

                    <h2 className="text-2xl font-black tracking-tight text-[#071b41]">
                      Reset Password
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      अपना नया password नीचे enter करें।
                    </p>

                  </div>

                  {/* =================================================
                      INVALID TOKEN
                  ================================================= */}

                  {!token && (
                    <div className="mt-6 rounded-2xl border border-red-200 bg-red-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-red-700">
                          !
                        </div>

                        <div>

                          <p className="text-sm font-black text-red-700">
                            Invalid Reset Link
                          </p>

                          <p className="mt-1 text-xs leading-5 text-red-600">
                            यह reset link missing है।
                            कृपया नया password reset link
                            request करें।
                          </p>

                          <Link
                            to="/forgot-password"
                            className="mt-3 inline-flex items-center gap-1 text-xs font-black text-red-700 transition hover:text-red-800"
                          >
                            Request New Link

                            <ArrowRight
                              size={14}
                            />

                          </Link>

                        </div>

                      </div>

                    </div>
                  )}

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

                        <div>

                          <p className="text-sm font-black text-green-700">
                            Password Updated
                          </p>

                          <p className="mt-1 text-xs leading-5 text-green-700">
                            {successMessage}
                          </p>

                          {completed && (
                            <p className="mt-2 text-[11px] font-bold text-green-600">
                              Redirecting you to login...
                            </p>
                          )}

                        </div>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================= */}

                  {token && (
                    <form
                      onSubmit={
                        handleSubmit
                      }
                      className="mt-7 space-y-5"
                      noValidate
                    >

                      {/* =============================================
                          NEW PASSWORD
                      ============================================= */}

                      <div>

                        <label
                          htmlFor="new-password"
                          className="mb-2.5 block text-sm font-black text-slate-700"
                        >
                          New Password
                        </label>

                        <div className="relative">

                          <LockKeyhole
                            size={18}
                            className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                          />

                          <input
                            id="new-password"
                            name="password"
                            type={
                              showPassword
                                ? "text"
                                : "password"
                            }
                            autoComplete="new-password"
                            value={
                              password
                            }
                            onChange={
                              handlePasswordChange
                            }
                            placeholder="Enter new password"
                            required
                            disabled={
                              loading ||
                              completed
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowPassword(
                                (
                                  previous
                                ) =>
                                  !previous
                              )
                            }
                            disabled={
                              loading ||
                              completed
                            }
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={
                              showPassword
                                ? "Hide password"
                                : "Show password"
                            }
                          >

                            {showPassword ? (
                              <EyeOff
                                size={18}
                              />
                            ) : (
                              <Eye
                                size={18}
                              />
                            )}

                          </button>

                        </div>

                        {/* PASSWORD STRENGTH */}

                        {password && (
                          <div className="mt-3">

                            <div className="flex items-center justify-between text-[11px] font-bold">

                              <span className="text-slate-500">
                                Password strength
                              </span>

                              <span className="text-slate-700">
                                {
                                  passwordStrength.label
                                }
                              </span>

                            </div>

                            <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

                              <div
                                className={`h-full rounded-full bg-red-600 transition-all duration-300 ${passwordStrength.width}`}
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

                      {/* =============================================
                          CONFIRM PASSWORD
                      ============================================= */}

                      <div>

                        <label
                          htmlFor="confirm-password"
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
                            id="confirm-password"
                            name="confirmPassword"
                            type={
                              showConfirmPassword
                                ? "text"
                                : "password"
                            }
                            autoComplete="new-password"
                            value={
                              confirmPassword
                            }
                            onChange={
                              handleConfirmPasswordChange
                            }
                            placeholder="Confirm new password"
                            required
                            disabled={
                              loading ||
                              completed
                            }
                            className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-12 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                          />

                          <button
                            type="button"
                            onClick={() =>
                              setShowConfirmPassword(
                                (
                                  previous
                                ) =>
                                  !previous
                              )
                            }
                            disabled={
                              loading ||
                              completed
                            }
                            className="absolute right-3.5 top-1/2 -translate-y-1/2 rounded-lg p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-700 disabled:cursor-not-allowed disabled:opacity-50"
                            aria-label={
                              showConfirmPassword
                                ? "Hide confirm password"
                                : "Show confirm password"
                            }
                          >

                            {showConfirmPassword ? (
                              <EyeOff
                                size={18}
                              />
                            ) : (
                              <Eye
                                size={18}
                              />
                            )}

                          </button>

                        </div>

                        {/* MATCH STATUS */}

                        {confirmPassword && (
                          <div className="mt-2">

                            {password ===
                            confirmPassword ? (
                              <p className="inline-flex items-center gap-1.5 text-[11px] font-bold text-green-600">

                                <CheckCircle2
                                  size={14}
                                />

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

                      {/* =============================================
                          SUBMIT
                      ============================================= */}

                      <button
                        type="submit"
                        disabled={
                          loading ||
                          completed
                        }
                        className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-xl hover:shadow-red-700/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-red-400 disabled:shadow-none"
                      >

                        {loading ? (
                          <>
                            <Loader2
                              size={19}
                              className="animate-spin"
                            />

                            Updating Password...
                          </>
                        ) : completed ? (
                          <>
                            <CheckCircle2
                              size={19}
                            />

                            Password Updated
                          </>
                        ) : (
                          <>
                            Reset Password

                            <ArrowRight
                              size={19}
                              className="transition-transform duration-200 group-hover:translate-x-0.5"
                            />
                          </>
                        )}

                      </button>

                    </form>
                  )}

                  {/* =================================================
                      SECURITY NOTE
                  ================================================= */}

                  <div className="mt-6 rounded-2xl border border-slate-100 bg-slate-50 p-4">

                    <div className="flex items-start gap-3">

                      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">

                        <ShieldCheck
                          size={18}
                        />

                      </div>

                      <div>

                        <p className="text-xs font-black text-slate-700">
                          Password Security
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Reset link one-time use के लिए है।
                          Password किसी के साथ share न करें।
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
   INFORMATION FEATURE
========================================================= */

function InfoFeature({
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