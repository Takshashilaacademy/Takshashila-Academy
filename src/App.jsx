import {
  Navigate,
  Route,
  Routes,
  useLocation,
} from "react-router-dom";

import Navbar from "./components/Navbar";
import Footer from "./components/Footer";

import Home from "./pages/Home";
import Courses from "./pages/Courses";
import CourseDetails from "./pages/CourseDetails";

import Login from "./pages/Login";
import Signup from "./pages/Signup";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";

import StudentDashboard from "./pages/StudentDashboard";
import MyLearning from "./pages/MyLearning";

import AdminLogin from "./pages/AdminLogin";
import AdminDashboard from "./pages/AdminDashboard";
import AdminCreateCourse from "./pages/AdminCreateCourse";
import AdminCourseContent from "./pages/AdminCourseContent";

import React from "react";
import { isStudentLoggedIn } from "./utils/authStorage.js";


class AppErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError() {
    return { hasError: true };
  }

  componentDidCatch(error, info) {
    console.error("Application render error:", error, info);
  }

  handleReload = () => {
    window.location.reload();
  };

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-50 px-4 py-16">
        <section className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl shadow-slate-200/50 sm:p-9">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-sm font-black text-red-700">
            Error
          </div>
          <h1 className="mt-5 text-2xl font-black tracking-tight text-slate-900">
            Something went wrong
          </h1>
          <p className="mt-2 text-sm leading-6 text-slate-500">
            Please reload the page. Your account and course data are kept safe on the server.
          </p>
          <button
            type="button"
            onClick={this.handleReload}
            className="mt-6 inline-flex items-center justify-center rounded-xl bg-[#071b41] px-5 py-3 text-sm font-black text-white shadow-lg shadow-blue-950/10 hover:bg-[#0b2557]"
          >
            Reload Page
          </button>
        </section>
      </main>
    );
  }
}

/* =========================================================
   STUDENT ROUTE GUARD
========================================================= */

function StudentRoute({ children }) {
  const location = useLocation();

  const isLoggedIn = isStudentLoggedIn();

  if (!isLoggedIn) {
    const redirect = `${location.pathname}${location.search}`;

    return (
      <Navigate
        to={`/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   ADMIN ROUTE GUARD
========================================================= */

function AdminRoute({ children }) {
  const location = useLocation();

  let token = "";
  let admin = null;

  try {
    token =
      localStorage.getItem("takshashila_admin_token") || "";

    const rawAdmin =
      localStorage.getItem("takshashila_admin");

    admin = rawAdmin ? JSON.parse(rawAdmin) : null;
  } catch (error) {
    console.error(
      "Unable to read admin authentication data:",
      error
    );

    token = "";
    admin = null;
  }

  const isValidAdmin =
    Boolean(token) &&
    Boolean(admin) &&
    admin.role === "admin";

  if (!isValidAdmin) {
    const redirect = `${location.pathname}${location.search}`;

    return (
      <Navigate
        to={`/admin/login?redirect=${encodeURIComponent(redirect)}`}
        replace
      />
    );
  }

  return children;
}

/* =========================================================
   404 PAGE
========================================================= */

function NotFound() {
  return (
    <section className="flex min-h-[70vh] items-center justify-center px-6 py-20">
      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50 sm:p-10">
        <div className="mx-auto flex h-20 w-20 items-center justify-center rounded-3xl bg-slate-100 text-3xl font-bold text-slate-700">
          404
        </div>

        <h1 className="mt-6 text-2xl font-bold tracking-tight text-slate-900 sm:text-3xl">
          Page not found
        </h1>

        <p className="mx-auto mt-3 max-w-md text-sm leading-6 text-slate-500 sm:text-base">
          The page you are looking for does not exist or may
          have been moved.
        </p>

        <a
          href="/"
          className="mt-7 inline-flex items-center justify-center rounded-xl bg-slate-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-900/30"
        >
          Go to Home
        </a>
      </div>
    </section>
  );
}

/* =========================================================
   APP
========================================================= */

function App() {
  const location = useLocation();

  const isAdminArea =
    location.pathname === "/admin" ||
    location.pathname.startsWith("/admin/");

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900">
      {/* =================================================
          PUBLIC NAVBAR
      ================================================= */}

      {!isAdminArea && <Navbar />}

      {/* =================================================
          APPLICATION ROUTES
      ================================================= */}

      <main className="min-h-[calc(100vh-1px)]">
        <Routes>

          {/* =================================================
              PUBLIC ROUTES
          ================================================= */}

          <Route
            path="/"
            element={<Home />}
          />

          <Route
            path="/courses"
            element={<Courses />}
          />

          <Route
            path="/course/:courseId"
            element={<CourseDetails />}
          />

          {/* =================================================
              STUDENT AUTH ROUTES
          ================================================= */}

          <Route
            path="/login"
            element={<Login />}
          />

          <Route
            path="/signup"
            element={<Signup />}
          />

          <Route
            path="/forgot-password"
            element={<ForgotPassword />}
          />

          <Route
            path="/reset-password"
            element={<ResetPassword />}
          />

          {/* =================================================
              STUDENT PROTECTED ROUTES
          ================================================= */}

          <Route
            path="/dashboard"
            element={
              <StudentRoute>
                <StudentDashboard />
              </StudentRoute>
            }
          />

          <Route
            path="/learning/:courseId"
            element={
              <StudentRoute>
                <MyLearning />
              </StudentRoute>
            }
          />

          {/* =================================================
              ADMIN AUTH
          ================================================= */}

          <Route
            path="/admin/login"
            element={<AdminLogin />}
          />

          {/* =================================================
              ADMIN PROTECTED ROUTES
          ================================================= */}

          <Route
            path="/admin/dashboard"
            element={
              <AdminRoute>
                <AdminDashboard />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/create-course"
            element={
              <AdminRoute>
                <AdminCreateCourse />
              </AdminRoute>
            }
          />

          <Route
            path="/admin/course-content/:courseId"
            element={
              <AdminRoute>
                <AdminCourseContent />
              </AdminRoute>
            }
          />

          {/* =================================================
              FALLBACK / 404
          ================================================= */}

          <Route
            path="*"
            element={<NotFound />}
          />

        </Routes>
      </main>

      {/* =================================================
          PUBLIC FOOTER
      ================================================= */}

      {!isAdminArea && <Footer />}
    </div>
  );
}
export default function AppWithErrorBoundary() {
  return (
    <AppErrorBoundary>
      <App />
    </AppErrorBoundary>
  );
}
