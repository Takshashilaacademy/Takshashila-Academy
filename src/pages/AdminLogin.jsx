import { useState } from "react";
import { API_URL } from "../config/api.js";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  ShieldCheck,
  Loader2,
  ArrowRight,
} from "lucide-react";

export default function AdminLogin() {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [formData, setFormData] = useState({
    email: "",
    password: "",
  });

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState("");

  /* =========================================================
     HANDLE INPUT
  ========================================================= */

  const handleChange = (event) => {
    const { name, value } = event.target;

    setFormData((previous) => ({
      ...previous,
      [name]: value,
    }));

    setErrorMessage("");
  };

  /* =========================================================
     ADMIN LOGIN
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setErrorMessage("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    if (!email || !password) {
      setErrorMessage("Email and password are required.");
      return;
    }

    try {
      setLoading(true);

      const controller = new AbortController();
      const timeoutId = window.setTimeout(
        () => controller.abort(),
        15000
      );

      let response;

      try {
        response = await fetch(
          `${API_URL}/api/admin/login`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Accept: "application/json",
            },
            body: JSON.stringify({
              email,
              password,
            }),
            signal: controller.signal,
          }
        );
      } finally {
        window.clearTimeout(timeoutId);
      }

      const responseText = await response.text();

      let data = {};

      try {
        data = responseText
          ? JSON.parse(responseText)
          : {};
      } catch {
        data = {
          message: responseText,
        };
      }

      if (!response.ok) {
        throw new Error(
          data?.message || "Admin login failed."
        );
      }

      if (
        !data?.token ||
        !data?.admin ||
        data.admin.role !== "admin"
      ) {
        throw new Error(
          "Invalid admin authentication response."
        );
      }

      /* -----------------------------------------------------
         SAVE ADMIN AUTH DATA
      ----------------------------------------------------- */

      localStorage.setItem(
        "takshashila_admin_token",
        data.token
      );

      localStorage.setItem(
        "takshashila_admin",
        JSON.stringify(data.admin)
      );

      /* -----------------------------------------------------
         REDIRECT
      ----------------------------------------------------- */

      navigate("/admin/dashboard");

    } catch (error) {
      console.error("Admin Login Error:", error);

      setErrorMessage(
        error?.name === "AbortError"
          ? "Login request timed out. Please try again."
          : error?.message ||
            "Unable to login. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50">

      <div className="container-main flex min-h-[750px] items-center justify-center py-10">

        <section className="w-full max-w-md">

          <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-xl shadow-slate-200/50 sm:p-8">

            {/* =================================================
                HEADER
            ================================================= */}

            <div className="text-center">

              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-[#071b41] text-yellow-400 shadow-lg">
                <ShieldCheck size={30} />
              </div>

              <h1 className="mt-5 text-2xl font-black text-[#071b41]">
                Admin Login
              </h1>

              <p className="mt-2 text-sm text-slate-500">
                Takshashila Academy Administration
              </p>

            </div>

            {/* =================================================
                ERROR
            ================================================= */}

            {errorMessage && (
              <div className="mt-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold leading-6 text-red-700">
                {errorMessage}
              </div>
            )}

            {/* =================================================
                FORM
            ================================================= */}

            <form
              onSubmit={handleSubmit}
              className="mt-8 space-y-5"
            >

              {/* Email */}

              <div>

                <label
                  htmlFor="admin-email"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Admin Email
                </label>

                <div className="relative">

                  <Mail
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-email"
                    name="email"
                    type="email"
                    autoComplete="username"
                    value={formData.email}
                    onChange={handleChange}
                    placeholder="Enter admin email"
                    disabled={loading}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-4 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#071b41] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                </div>

              </div>

              {/* Password */}

              <div>

                <label
                  htmlFor="admin-password"
                  className="mb-2 block text-sm font-bold text-slate-700"
                >
                  Admin Password
                </label>

                <div className="relative">

                  <LockKeyhole
                    size={18}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                  <input
                    id="admin-password"
                    name="password"
                    type={
                      showPassword
                        ? "text"
                        : "password"
                    }
                    autoComplete="current-password"
                    value={formData.password}
                    onChange={handleChange}
                    placeholder="Enter admin password"
                    disabled={loading}
                    required
                    className="w-full rounded-xl border border-slate-200 bg-white py-3.5 pl-10 pr-11 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#071b41] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-100"
                  />

                  <button
                    type="button"
                    onClick={() =>
                      setShowPassword(
                        (previous) => !previous
                      )
                    }
                    disabled={loading}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-700"
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

              {/* Login */}

              <button
                type="submit"
                disabled={loading}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b41] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#0b2558] disabled:cursor-not-allowed disabled:opacity-70"
              >

                {loading ? (
                  <>
                    <Loader2
                      size={18}
                      className="animate-spin"
                    />
                    Signing In...
                  </>
                ) : (
                  <>
                    Admin Login
                    <ArrowRight size={18} />
                  </>
                )}

              </button>

            </form>

            {/* =================================================
                SECURITY MESSAGE
            ================================================= */}

            <div className="mt-6 flex items-start gap-3 rounded-xl bg-slate-50 p-4">

              <ShieldCheck
                size={18}
                className="mt-0.5 shrink-0 text-green-600"
              />

              <p className="text-xs leading-5 text-slate-500">
                यह login केवल authorized Takshashila Academy
                administrators के लिए है।
              </p>

            </div>

          </div>

        </section>

      </div>

    </main>
  );
}