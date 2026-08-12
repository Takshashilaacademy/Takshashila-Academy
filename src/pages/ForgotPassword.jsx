import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  CheckCircle2,
  GraduationCap,
  Loader2,
  Mail,
  ShieldCheck,
  Sparkles,
} from "lucide-react";

import { API_URL } from "../config/api.js";

/* =========================================================
   FORGOT PASSWORD PAGE
========================================================= */

export default function ForgotPassword() {
  const navigate =
    useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [
    email,
    setEmail,
  ] = useState("");

  const [
    loading,
    setLoading,
  ] = useState(false);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  const [
    resetUrl,
    setResetUrl,
  ] = useState("");

  const [
    requestSent,
    setRequestSent,
  ] = useState(false);

  /* =======================================================
     HANDLE EMAIL CHANGE
  ======================================================= */

  const handleEmailChange =
    (event) => {
      const value =
        event.target.value
          .slice(0, 150);

      setEmail(
        value
      );

      if (
        errorMessage
      ) {
        setErrorMessage(
          ""
        );
      }

      if (
        successMessage
      ) {
        setSuccessMessage(
          ""
        );
      }

      if (
        requestSent
      ) {
        setRequestSent(
          false
        );
      }

      if (
        resetUrl
      ) {
        setResetUrl(
          ""
        );
      }
    };

  /* =======================================================
     VALIDATE EMAIL
  ======================================================= */

  const validateEmail =
    () => {
      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      if (
        !normalizedEmail
      ) {
        return "Please enter your registered email address.";
      }

      if (
        !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
          normalizedEmail
        )
      ) {
        return "Please enter a valid email address.";
      }

      return "";
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
        loading
      ) {
        return;
      }

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      setResetUrl(
        ""
      );

      const validationError =
        validateEmail();

      if (
        validationError
      ) {
        setErrorMessage(
          validationError
        );

        return;
      }

      const normalizedEmail =
        email
          .trim()
          .toLowerCase();

      try {
        setLoading(
          true
        );

        const response =
          await fetch(
            `${API_URL}/api/auth/forgot-password`,
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
                  email:
                    normalizedEmail,
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
          throw new Error(
            data?.message ||
              "Unable to process your password reset request."
          );
        }

        /* =================================================
           SUCCESS
        ================================================= */

        setRequestSent(
          true
        );

        setSuccessMessage(
          data?.message ||
            "If an account exists with this email, a password reset link has been sent."
        );

        /*
         * Development fallback:
         *
         * The backend only returns resetUrl when:
         *
         * NODE_ENV !== production
         * AND SMTP is not configured.
         *
         * With Gmail SMTP configured this should normally
         * remain empty.
         */

        if (
          data?.developmentOnly ===
            true &&
          typeof data?.resetUrl ===
            "string" &&
          data.resetUrl.trim()
        ) {
          setResetUrl(
            data.resetUrl
          );
        }

        /*
         * Clear the entered email after successful
         * submission so the user does not accidentally
         * submit the same request again.
         */

        setEmail(
          normalizedEmail
        );
      } catch (
        error
      ) {
        console.error(
          "Forgot Password Error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Unable to process your password reset request. Please try again."
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
          BACKGROUND DECORATION
      ================================================= */}

      <div className="pointer-events-none fixed inset-0 overflow-hidden">

        <div className="absolute -left-40 top-10 h-80 w-80 rounded-full bg-red-100/50 blur-3xl" />

        <div className="absolute -bottom-40 right-0 h-96 w-96 rounded-full bg-blue-100/60 blur-3xl" />

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

              {/* BADGE */}

              <div className="inline-flex items-center gap-2 rounded-full border border-red-100 bg-white px-4 py-2 text-xs font-black text-red-700 shadow-sm">

                <Sparkles
                  size={15}
                />

                Account Recovery

              </div>

              {/* HEADING */}

              <h1 className="mt-7 text-5xl font-black leading-[1.08] tracking-tight text-[#071b41] xl:text-6xl">

                Password भूल गए?

                <span className="block text-red-700">
                  कोई चिंता नहीं।
                </span>

              </h1>

              <p className="mt-6 max-w-lg text-base leading-8 text-slate-600">
                अपने registered email address से
                password reset process शुरू करें।
                आपको एक secure reset link email के
                माध्यम से भेजा जाएगा।
              </p>

              {/* FEATURES */}

              <div className="mt-10 space-y-6">

                <InfoFeature
                  icon={
                    <Mail
                      size={20}
                    />
                  }
                  iconClass="bg-blue-50 text-blue-700"
                  title="Registered Email"
                  description="वही email address इस्तेमाल करें जो आपके student account में registered है।"
                />

                <InfoFeature
                  icon={
                    <ShieldCheck
                      size={20}
                    />
                  }
                  iconClass="bg-green-50 text-green-700"
                  title="Secure Reset"
                  description="Reset token securely generated होता है और limited time के लिए valid रहता है।"
                />

                <InfoFeature
                  icon={
                    <CheckCircle2
                      size={20}
                    />
                  }
                  iconClass="bg-yellow-50 text-yellow-700"
                  title="One-Time Link"
                  description="Password बदलने के बाद reset link दोबारा इस्तेमाल नहीं किया जा सकेगा।"
                />

              </div>

            </div>

          </section>

          {/* =================================================
              CARD
          ================================================= */}

          <section className="mx-auto w-full max-w-[480px]">

            <div className="relative">

              {/* GLOW */}

              <div className="absolute -inset-1 rounded-[32px] bg-gradient-to-r from-red-200/60 via-transparent to-blue-200/60 blur-xl" />

              {/* CARD */}

              <div className="relative overflow-hidden rounded-[28px] border border-slate-200 bg-white shadow-2xl shadow-slate-300/40">

                {/* =================================================
                    CARD HEADER
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
                        Account Recovery
                      </p>

                      <p className="mt-0.5 font-black">
                        Takshashila Academy
                      </p>

                    </div>

                  </div>

                </div>

                {/* =================================================
                    CARD BODY
                ================================================= */}

                <div className="p-6 sm:p-8">

                  {/* BACK */}

                  <button
                    type="button"
                    onClick={() =>
                      navigate(
                        "/login"
                      )
                    }
                    disabled={
                      loading
                    }
                    className="mb-6 inline-flex items-center gap-2 rounded-xl px-2 py-1 text-sm font-bold text-slate-500 transition hover:bg-slate-100 hover:text-slate-800 disabled:cursor-not-allowed disabled:opacity-50"
                  >

                    <ArrowLeft
                      size={16}
                    />

                    Back to Login

                  </button>

                  {/* TITLE */}

                  <div>

                    <h2 className="text-2xl font-black tracking-tight text-[#071b41]">
                      Forgot Password?
                    </h2>

                    <p className="mt-2 text-sm leading-6 text-slate-500">
                      अपना registered email डालें।
                      हम आपके account के लिए secure
                      password reset email भेजेंगे।
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
                          {
                            errorMessage
                          }
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

                          <p className="text-sm font-bold leading-5 text-green-700">
                            {
                              successMessage
                            }
                          </p>

                          <p className="mt-2 text-xs leading-5 text-green-700/80">
                            अगर email तुरंत दिखाई नहीं दे,
                            तो Spam, Promotions या Updates
                            folder भी check करें।
                          </p>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      DEVELOPMENT FALLBACK
                  ================================================= */}

                  {resetUrl && (
                    <div className="mt-5 rounded-2xl border border-yellow-200 bg-yellow-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">

                          <ShieldCheck
                            size={17}
                          />

                        </div>

                        <div className="min-w-0">

                          <p className="text-xs font-black text-yellow-800">
                            Development Mode
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-yellow-700">
                            Email service configured
                            नहीं है। Local testing के लिए
                            temporary reset link नीचे दिया गया है।
                          </p>

                          <a
                            href={
                              resetUrl
                            }
                            className="mt-3 block break-all rounded-xl border border-yellow-200 bg-white p-3 text-xs font-bold text-red-700 transition hover:border-red-200 hover:bg-red-50"
                          >
                            {
                              resetUrl
                            }
                          </a>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      FORM
                  ================================================= */}

                  <form
                    onSubmit={
                      handleSubmit
                    }
                    className="mt-7 space-y-5"
                    noValidate
                  >

                    {/* EMAIL */}

                    <div>

                      <label
                        htmlFor="forgot-password-email"
                        className="mb-2.5 block text-sm font-black text-slate-700"
                      >
                        Registered Email
                      </label>

                      <div className="relative">

                        <Mail
                          size={18}
                          className="pointer-events-none absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
                        />

                        <input
                          id="forgot-password-email"
                          name="email"
                          type="email"
                          inputMode="email"
                          autoComplete="email"
                          maxLength={
                            150
                          }
                          value={
                            email
                          }
                          onChange={
                            handleEmailChange
                          }
                          placeholder="Enter your email address"
                          required
                          disabled={
                            loading
                          }
                          className="w-full rounded-2xl border border-slate-200 bg-white py-3.5 pl-11 pr-4 text-sm font-semibold text-slate-800 outline-none transition duration-200 placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-red-500 focus:ring-4 focus:ring-red-50 disabled:cursor-not-allowed disabled:bg-slate-50"
                        />

                      </div>

                      <p className="mt-2 text-[11px] font-medium leading-5 text-slate-400">
                        Reset instructions आपके
                        registered email account पर भेजी जाएंगी।
                      </p>

                    </div>

                    {/* SUBMIT */}

                    <button
                      type="submit"
                      disabled={
                        loading
                      }
                      className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-xl hover:shadow-red-700/25 disabled:cursor-not-allowed disabled:translate-y-0 disabled:bg-red-400 disabled:shadow-none"
                    >

                      {loading ? (
                        <>
                          <Loader2
                            size={19}
                            className="animate-spin"
                          />

                          Sending Reset Email...
                        </>
                      ) : (
                        <>
                          Send Reset Link

                          <ArrowRight
                            size={19}
                            className="transition-transform duration-200 group-hover:translate-x-0.5"
                          />
                        </>
                      )}

                    </button>

                  </form>

                  {/* =================================================
                      AFTER SUCCESS
                  ================================================= */}

                  {requestSent && (
                    <div className="mt-6 rounded-2xl border border-blue-100 bg-blue-50 p-4">

                      <div className="flex items-start gap-3">

                        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-blue-700">

                          <Mail
                            size={18}
                          />

                        </div>

                        <div>

                          <p className="text-xs font-black text-blue-900">
                            Email check करें
                          </p>

                          <p className="mt-1 text-[11px] leading-5 text-blue-800/80">
                            अपना inbox और Spam/Promotions
                            folders check करें। Reset link
                            limited time के लिए valid रहेगा।
                          </p>

                        </div>

                      </div>

                    </div>
                  )}

                  {/* =================================================
                      LOGIN LINK
                  ================================================= */}

                  <div className="mt-7 border-t border-slate-100 pt-6 text-center">

                    <p className="text-sm text-slate-500">
                      Password याद आ गया?
                    </p>

                    <Link
                      to="/login"
                      className="mt-2 inline-flex items-center gap-1.5 text-sm font-black text-red-700 transition hover:text-red-800"
                    >
                      Back to Student Login

                      <ArrowRight
                        size={15}
                      />

                    </Link>

                  </div>

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
                          Secure Password Recovery
                        </p>

                        <p className="mt-1 text-[11px] leading-5 text-slate-500">
                          Reset token limited time के लिए
                          valid रहता है और successful password
                          reset के बाद automatically invalidate हो जाता है।
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