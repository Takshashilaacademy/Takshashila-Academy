import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

import { API_URL } from "../config/api.js";

import {
  BookOpen,
  FileText,
  IndianRupee,
  Loader2,
  LogOut,
  Plus,
  RefreshCw,
  ShieldCheck,
  Users,
  Video,
  ArrowRight,
  Search,
  Eye,
  EyeOff,
  Trash2,
} from "lucide-react";

const getAdminToken = () =>
  localStorage.getItem(
    "takshashila_admin_token"
  ) || "";

const clearAdmin = () => {
  localStorage.removeItem(
    "takshashila_admin_token"
  );
  localStorage.removeItem(
    "takshashila_admin"
  );
};

const adminRequest = async (
  endpoint,
  options = {}
) => {
  const token =
    getAdminToken();

  const response =
    await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers: {
          "Content-Type":
            "application/json",
          ...(token
            ? {
                Authorization:
                  `Bearer ${token}`,
              }
            : {}),
          ...(options.headers || {}),
        },
      }
    );

  const data =
    await response
      .json()
      .catch(() => ({}));

  if (
    response.status === 401 ||
    response.status === 403
  ) {
    clearAdmin();
    throw new Error(
      "Admin session expired. Please login again."
    );
  }

  if (!response.ok) {
    throw new Error(
      data?.message ||
        "Request failed."
    );
  }

  return data;
};

export default function AdminDashboard() {
  const navigate =
    useNavigate();

  const [admin, setAdmin] =
    useState(null);

  const [stats, setStats] =
    useState(null);

  const [courses, setCourses] =
    useState([]);

  const [loading, setLoading] =
    useState(true);

  const [refreshing, setRefreshing] =
    useState(false);

  const [error, setError] =
    useState("");

  const [search, setSearch] =
    useState("");

  const loadDashboard =
    async (
      silent = false
    ) => {
      try {
        if (silent) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setError("");

        const [
          meData,
          statsData,
          coursesData,
        ] = await Promise.all([
          adminRequest(
            "/api/admin/me"
          ),
          adminRequest(
            "/api/admin/dashboard/stats"
          ),
          adminRequest(
            "/api/admin/courses"
          ),
        ]);

        setAdmin(
          meData?.admin ||
            null
        );

        setStats(
          statsData?.stats ||
            null
        );

        setCourses(
          Array.isArray(
            coursesData?.courses
          )
            ? coursesData.courses
            : []
        );
      } catch (err) {
        console.error(
          "Admin Dashboard Error:",
          err
        );

        if (
          /session expired|login/i.test(
            err.message
          )
        ) {
          clearAdmin();
          navigate(
            "/admin/login",
            {
              replace: true,
            }
          );
          return;
        }

        setError(
          err.message ||
            "Unable to load admin dashboard."
        );
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    };

  useEffect(() => {
    loadDashboard();
  }, []);

  const filteredCourses =
    useMemo(() => {
      const query =
        search
          .trim()
          .toLowerCase();

      if (!query) {
        return courses;
      }

      return courses.filter(
        (course) =>
          course.title
            ?.toLowerCase()
            .includes(query) ||
          course.exam
            ?.toLowerCase()
            .includes(query)
      );
    }, [
      courses,
      search,
    ]);

  const handleTogglePublish = async (course) => {
    try {
      await adminRequest(
        `/api/admin/courses/${course._id}`,
        {
          method: "PUT",
          body: JSON.stringify({
            isPublished:
              !course.isPublished,
          }),
        }
      );

      await loadDashboard(true);
    } catch (err) {
      setError(
        err.message ||
          "Unable to update course status."
      );
    }
  };

  const handleLogout = () => {
    clearAdmin();
    navigate(
      "/admin/login",
      {
        replace: true,
      }
    );
  };

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-950 px-4">
        <div className="flex min-h-screen items-center justify-center">
          <div className="flex items-center gap-3 rounded-2xl bg-white px-6 py-5 shadow-xl">
            <Loader2
              size={22}
              className="animate-spin text-red-700"
            />
            <span className="text-sm font-bold text-slate-700">
              Admin dashboard loading...
            </span>
          </div>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-50">
      <section className="overflow-hidden bg-[#071b41] text-white">
        <div className="container-main relative py-8 sm:py-10">
          <div className="absolute -right-24 -top-32 h-72 w-72 rounded-full bg-blue-400/10 blur-3xl" />

          <div className="relative flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-yellow-400 text-[#071b41] shadow-lg">
                <ShieldCheck
                  size={27}
                />
              </div>

              <div>
                <p className="text-[11px] font-black uppercase tracking-[0.2em] text-blue-200">
                  Owner Console
                </p>

                <h1 className="mt-1 text-2xl font-black sm:text-3xl">
                  Admin Dashboard
                </h1>

                <p className="mt-1 text-sm text-blue-100/70">
                  {admin?.name ||
                    "Academy Owner"}
                </p>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <button
                type="button"
                onClick={() =>
                  loadDashboard(
                    true
                  )
                }
                disabled={
                  refreshing
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black transition hover:bg-white/10 disabled:opacity-60"
              >
                <RefreshCw
                  size={17}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />
                Refresh
              </button>

              <button
                type="button"
                onClick={
                  handleLogout
                }
                className="inline-flex items-center gap-2 rounded-xl border border-white/15 bg-white/5 px-4 py-2.5 text-sm font-black transition hover:bg-white/10"
              >
                <LogOut
                  size={17}
                />
                Logout
              </button>
            </div>
          </div>
        </div>
      </section>

      <div className="container-main py-8 sm:py-10">
        {error && (
          <div className="mb-6 flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm font-bold text-red-700">
              {error}
            </p>
            <button
              type="button"
              onClick={() =>
                loadDashboard()
              }
              className="rounded-xl bg-red-700 px-4 py-2 text-xs font-black text-white"
            >
              Retry
            </button>
          </div>
        )}

        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
          <StatCard
            icon={
              <BookOpen
                size={20}
              />
            }
            label="Courses"
            value={
              stats?.totalCourses ??
              0
            }
            helper={`${stats?.publishedCourses ?? 0} published`}
          />

          <StatCard
            icon={
              <Users
                size={20}
              />
            }
            label="Students"
            value={
              stats?.totalStudents ??
              0
            }
            helper={`${stats?.activeStudents ?? 0} active`}
          />

          <StatCard
            icon={
              <Video
                size={20}
              />
            }
            label="Recorded Videos"
            value={
              stats?.totalVideos ??
              0
            }
            helper="Published lessons"
          />

          <StatCard
            icon={
              <FileText
                size={20}
              />
            }
            label="Study Materials"
            value={
              stats?.totalMaterials ??
              0
            }
            helper="PDFs & notes"
          />
        </div>

        <div className="mt-5 grid gap-4 lg:grid-cols-3">
          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Paid Purchases
            </p>
            <p className="mt-2 text-3xl font-black text-[#071b41]">
              {stats?.paidPurchases ??
                0}
            </p>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
            <p className="text-xs font-black uppercase tracking-wider text-slate-400">
              Pending Purchases
            </p>
            <p className="mt-2 text-3xl font-black text-[#071b41]">
              {stats?.pendingPurchases ??
                0}
            </p>
          </div>

          <div className="rounded-2xl border border-green-200 bg-green-50 p-5 shadow-sm">
            <div className="flex items-center gap-2 text-green-700">
              <IndianRupee
                size={18}
              />
              <p className="text-xs font-black uppercase tracking-wider">
                Recorded Revenue
              </p>
            </div>
            <p className="mt-2 text-3xl font-black text-green-800">
              ₹
              {Number(
                stats?.revenue || 0
              ).toLocaleString(
                "en-IN"
              )}
            </p>
            <p className="mt-1 text-xs font-semibold text-green-700/70">
              Based on verified paid purchases
            </p>
          </div>
        </div>

        <section className="mt-8 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
          <div className="flex flex-col gap-4 border-b border-slate-100 p-5 sm:flex-row sm:items-center sm:justify-between sm:p-6">
            <div>
              <h2 className="text-xl font-black text-[#071b41]">
                Course Library
              </h2>
              <p className="mt-1 text-sm text-slate-500">
                Courses, publishing status और content manage करें।
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                navigate(
                  "/admin/create-course"
                )
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-800"
            >
              <Plus size={17} />
              Create Course
            </button>
          </div>

          <div className="border-b border-slate-100 p-4 sm:p-5">
            <div className="relative max-w-md">
              <Search
                size={17}
                className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400"
              />
              <input
                value={search}
                onChange={(e) =>
                  setSearch(
                    e.target.value
                  )
                }
                placeholder="Search course or exam..."
                className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-10 pr-4 text-sm font-semibold outline-none focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
              />
            </div>
          </div>

          {filteredCourses.length ===
          0 ? (
            <div className="px-6 py-14 text-center">
              <BookOpen
                size={30}
                className="mx-auto text-slate-300"
              />
              <h3 className="mt-4 font-black text-slate-700">
                No courses found
              </h3>
              <p className="mt-1 text-sm text-slate-500">
                Create your first course to start building the academy.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {filteredCourses.map(
                (course) => (
                  <div
                    key={
                      course._id
                    }
                    className="flex flex-col gap-4 p-5 transition hover:bg-slate-50/80 sm:flex-row sm:items-center"
                  >
                    <div className="h-16 w-24 shrink-0 overflow-hidden rounded-xl bg-slate-100">
                      {course.thumbnail ? (
                        <img
                          src={
                            course.thumbnail
                          }
                          alt=""
                          className="h-full w-full object-cover"
                        />
                      ) : (
                        <div className="flex h-full items-center justify-center text-slate-300">
                          <BookOpen
                            size={22}
                          />
                        </div>
                      )}
                    </div>

                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="truncate font-black text-[#071b41]">
                          {
                            course.title
                          }
                        </h3>

                        <span
                          className={`rounded-full px-2.5 py-1 text-[10px] font-black ${
                            course.isPublished
                              ? "bg-green-100 text-green-700"
                              : "bg-slate-100 text-slate-500"
                          }`}
                        >
                          {course.isPublished
                            ? "Published"
                            : "Draft"}
                        </span>
                      </div>

                      <p className="mt-1 text-xs font-semibold text-slate-500">
                        {course.exam ||
                          "Course"}{" "}
                        •{" "}
                        {course.totalVideos ||
                          0}{" "}
                        videos •{" "}
                        {course.totalNotes ||
                          0}{" "}
                        materials
                      </p>
                    </div>

                    <div className="flex flex-wrap gap-2">
                      <button
                        type="button"
                        onClick={() =>
                          handleTogglePublish(
                            course
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-white"
                      >
                        {course.isPublished ? (
                          <EyeOff size={14} />
                        ) : (
                          <Eye size={14} />
                        )}
                        {course.isPublished
                          ? "Unpublish"
                          : "Publish"}
                      </button>

                      <button
                        type="button"
                        onClick={() =>
                          navigate(
                            `/admin/course-content/${course._id}`
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 px-3 py-2 text-xs font-black text-slate-700 hover:bg-white"
                      >
                        Manage Content
                        <ArrowRight
                          size={14}
                        />
                      </button>
                    </div>
                  </div>
                )
              )}
            </div>
          )}
        </section>
      </div>
    </main>
  );
}

function StatCard({
  icon,
  label,
  value,
  helper,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 text-blue-700">
          {icon}
        </div>
      </div>

      <p className="mt-5 text-xs font-black uppercase tracking-wider text-slate-400">
        {label}
      </p>

      <p className="mt-1 text-3xl font-black text-[#071b41]">
        {value}
      </p>

      <p className="mt-1 text-xs font-semibold text-slate-400">
        {helper}
      </p>
    </div>
  );
}
