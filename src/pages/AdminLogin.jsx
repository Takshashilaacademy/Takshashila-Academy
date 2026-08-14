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

    if (loading) {
      return;
    }

    setErrorMessage("");

    const email = formData.email.trim().toLowerCase();
    const password = formData.password;

    /* =======================================================
       VALIDATION
    ======================================================= */

    if (!email) {
      setErrorMessage("Admin email is required.");
      return;
    }

    if (!password) {
      setErrorMessage("Admin password is required.");
      return;
    }

    try {
      setLoading(true);

      console.log("======================================");
      console.log("ADMIN LOGIN REQUEST");
      console.log("API URL:", API_URL);
      console.log(
        "Endpoint:",
        `${API_URL}/api/admin/login`
      );
      console.log("Email:", email);
      console.log("======================================");

      /* =====================================================
         LOGIN REQUEST
      ===================================================== */

      const response = await fetch(
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
        }
      );

      /* =====================================================
         READ RESPONSE SAFELY
      ===================================================== */

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

      console.log(
        "Admin Login HTTP Status:",
        response.status
      );

      console.log(
        "Admin Login Response:",
        data
      );

      /* =====================================================
         API ERROR
      ===================================================== */

      if (!response.ok) {
        if (response.status === 400) {
          throw new Error(
            data?.message ||
              "Please check your admin login details."
          );
        }

        if (response.status === 401) {
          throw new Error(
            data?.message ||
              "Invalid admin email or password."
          );
        }

        if (response.status === 403) {
          throw new Error(
            data?.message ||
              "Admin access is not authorized."
          );
        }

        if (response.status === 404) {
          throw new Error(
            data?.message ||
              "Admin login endpoint was not found."
          );
        }

        if (response.status >= 500) {
          throw new Error(
            data?.message ||
              "Server error while logging in. Please check the backend."
          );
        }

        throw new Error(
          data?.message ||
            "Admin login failed."
        );
      }

      /* =====================================================
         VALIDATE AUTH RESPONSE
      ===================================================== */

      if (
        typeof data?.token !== "string" ||
        !data.token.trim()
      ) {
        throw new Error(
          "Login succeeded, but authentication token was not returned by the server."
        );
      }

      if (
        !data?.admin ||
        typeof data.admin !== "object"
      ) {
        throw new Error(
          "Login succeeded, but admin account information was not returned."
        );
      }

      if (data.admin.role !== "admin") {
        throw new Error(
          "This account does not have administrator access."
        );
      }

      /* =====================================================
         SAVE ADMIN AUTH DATA
      ===================================================== */

      localStorage.setItem(
        "takshashila_admin_token",
        data.token
      );

      localStorage.setItem(
        "takshashila_admin",
        JSON.stringify(data.admin)
      );

      /* =====================================================
         SUCCESS
      ===================================================== */

      console.log(
        "Admin login successful."
      );

      navigate(
        "/admin/dashboard",
        {
          replace: true,
        }
      );
    } catch (error) {
      console.error(
        "Admin Login Error:",
        error
      );

      /* =====================================================
         NETWORK ERROR
      ===================================================== */

      if (
        error instanceof TypeError
      ) {
        setErrorMessage(
          "Unable to connect to the backend server. Please make sure the backend is running and API_URL is correct."
        );

        return;
      }

      /* =====================================================
         NORMAL ERROR
      ===================================================== */

      setErrorMessage(
        error?.message ||
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

              {/* =================================================
                  TAKSHASHILA ACADEMY LOGO
              ================================================= */}

              <div className="mx-auto flex h-24 w-24 items-center justify-center overflow-hidden rounded-2xl bg-[#071b41] p-2 shadow-lg shadow-blue-950/20">

                <img
                  src="/logo.jpeg"
                  alt="Takshashila Academy"
                  className="h-full w-full object-contain"
                />

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

              {/* EMAIL */}

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

              {/* PASSWORD */}

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

              {/* LOGIN BUTTON */}

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