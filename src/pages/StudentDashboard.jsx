import {
  Link,
  useNavigate,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  LockKeyhole,
  LogOut,
  RefreshCw,
  ShieldCheck,
  Target,
  UserRound,
  Video,
  PlayCircle,
} from "lucide-react";

import { API_URL } from "../config/api.js";

import {
  clearStudentAuth,
  getStudentAuthHeaders,
  getStudentToken,
  saveStoredStudent,
} from "../utils/authStorage.js";

/* =========================================================
   STUDENT DASHBOARD
========================================================= */

export default function StudentDashboard() {
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [student, setStudent] = useState(
    () => {
      try {
        const raw =
          localStorage.getItem(
            "takshashila_student"
          );

        return raw
          ? JSON.parse(raw)
          : null;
      } catch {
        return null;
      }
    }
  );

  const [stats, setStats] = useState({
    purchasedCourses: 0,
    lessonsCompleted: 0,
    overallProgress: 0,
    totalVideos: 0,
    totalNotes: 0,
  });

  const [purchasedCourses, setPurchasedCourses] = useState([]);

  const [loading, setLoading] = useState(true);

  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = () => {
    clearStudentAuth();

    navigate("/login", {
      replace: true,
    });
  };

  /* =======================================================
     LOAD DASHBOARD
  ======================================================= */

  const loadDashboard = async (isRefresh = false) => {
    const token = getStudentToken();

    if (!token) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    try {
      if (isRefresh) {
        setRefreshing(true);
      } else {
        setLoading(true);
      }

      setErrorMessage("");

      const response = await fetch(
        `${API_URL}/api/student/dashboard`,
        {
          method: "GET",

          headers: {
            Accept: "application/json",
            ...getStudentAuthHeaders(),
          },
        }
      );

      let data = {};

      const responseText = await response.text();

      if (responseText) {
        try {
          data = JSON.parse(responseText);
        } catch {
          data = {};
        }
      }

      /* =================================================
         SESSION EXPIRED
      ================================================= */

      if (response.status === 401) {
        clearStudentAuth();

        navigate("/login", {
          replace: true,
        });

        return;
      }

      /* =================================================
         FORBIDDEN
      ================================================= */

      if (response.status === 403) {
        throw new Error(
          data?.message ||
            "You are not authorized to access this dashboard."
        );
      }

      /* =================================================
         OTHER API ERRORS
      ================================================= */

      if (!response.ok) {
        throw new Error(
          data?.message ||
            "Unable to load your dashboard."
        );
      }

      /* =================================================
         STUDENT
      ================================================= */

      if (data?.student) {
        setStudent(data.student);

        saveStoredStudent(data.student);
      }

      /* =================================================
         STATS
      ================================================= */

      if (data?.stats) {
        setStats({
          purchasedCourses:
            Number(
              data.stats.purchasedCourses
            ) || 0,

          lessonsCompleted:
            Number(
              data.stats.lessonsCompleted
            ) || 0,

          overallProgress:
            clampPercent(
              Number(
                data.stats.overallProgress
              ) || 0
            ),

          totalVideos:
            Number(
              data.stats.totalVideos
            ) || 0,

          totalNotes:
            Number(
              data.stats.totalNotes
            ) || 0,
        });
      }

      /* =================================================
         PURCHASED COURSES
      ================================================= */

      setPurchasedCourses(
        Array.isArray(
          data?.purchasedCourses
        )
          ? data.purchasedCourses
          : []
      );
    } catch (error) {
      console.error(
        "Student Dashboard Error:",
        error
      );

      setErrorMessage(
        error?.message ||
          "Dashboard load नहीं हो पाया. Please try again."
      );
    } finally {
      setLoading(false);

      setRefreshing(false);
    }
  };

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadDashboard();

    const handleAuthChanged = () => {
      loadDashboard(true);
    };

    window.addEventListener(
      "student-auth-changed",
      handleAuthChanged
    );

    return () => {
      window.removeEventListener(
        "student-auth-changed",
        handleAuthChanged
      );
    };
  }, []);

  /* =======================================================
     DERIVED VALUES
  ======================================================= */

  const studentName = useMemo(
    () =>
      student?.name?.trim() ||
      "Student",
    [student]
  );

  const firstName = useMemo(() => {
    return (
      studentName.split(" ")[0] ||
      "Student"
    );
  }, [studentName]);

  const overallProgress = clampPercent(
    stats.overallProgress
  );

  /* =======================================================
     INITIAL LOADING
  ======================================================= */

  if (loading && !student) {
    return <DashboardLoading />;
  }

  /* =======================================================
     FULL ERROR
  ======================================================= */

  if (errorMessage && !student) {
    return (
      <DashboardError
        message={errorMessage}
        onRetry={() => loadDashboard(true)}
        loading={refreshing}
      />
    );
  }

  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f6f8fc]">

      {/* =================================================
          HERO HEADER
      ================================================= */}

      <section className="relative overflow-hidden bg-[#071b41] text-white">

        {/* Background Decoration */}

        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-red-700/20 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-20 h-80 w-80 rounded-full bg-blue-400/10 blur-3xl" />

        <div className="container-main relative py-7 sm:py-9 lg:py-10">

          <div className="flex flex-col gap-7 lg:flex-row lg:items-center lg:justify-between">

            {/* STUDENT INFO */}

            <div className="flex items-center gap-4">

              <div className="relative">

                {student?.profileImage ? (
                  <img
                    src={student.profileImage}
                    alt={studentName}
                    className="h-14 w-14 rounded-2xl object-cover ring-2 ring-white/20 sm:h-16 sm:w-16"
                  />
                ) : (
                  <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-yellow-400 ring-1 ring-white/15 sm:h-16 sm:w-16">
                    <UserRound size={28} />
                  </div>
                )}

                <div className="absolute -bottom-1 -right-1 flex h-5 w-5 items-center justify-center rounded-full border-2 border-[#071b41] bg-green-500">
                  <span className="h-1.5 w-1.5 rounded-full bg-white" />
                </div>

              </div>

              <div>

                <p className="text-[11px] font-black uppercase tracking-[0.18em] text-yellow-400">
                  Student Dashboard
                </p>

                <h1 className="mt-1 text-2xl font-black tracking-tight sm:text-3xl">
                  Welcome, {firstName} 👋
                </h1>

                <p className="mt-1.5 max-w-xl text-sm text-slate-300">
                  अपनी learning journey वहीं से
                  continue करें जहाँ आपने छोड़ी थी।
                </p>

              </div>

            </div>

            {/* ACTIONS */}

            <div className="flex flex-wrap items-center gap-2">

              <button
                type="button"
                onClick={() => loadDashboard(true)}
                disabled={refreshing}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
              >
                <RefreshCw
                  size={16}
                  className={
                    refreshing
                      ? "animate-spin"
                      : ""
                  }
                />

                <span className="hidden sm:inline">
                  Refresh
                </span>
              </button>

              <button
                type="button"
                onClick={handleLogout}
                className="inline-flex h-11 items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 text-sm font-bold text-slate-200 transition hover:border-red-400/30 hover:bg-red-500/10 hover:text-white"
              >
                <LogOut size={16} />

                Logout
              </button>

            </div>

          </div>

        </div>

      </section>

      {/* =================================================
          ERROR BANNER
      ================================================= */}

      {errorMessage && (
        <section className="container-main pt-5">

          <div className="flex flex-col gap-3 rounded-2xl border border-red-200 bg-red-50 p-4 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-3">

              <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-100 font-black text-red-700">
                !
              </div>

              <div>

                <p className="text-sm font-black text-red-800">
                  Dashboard update failed
                </p>

                <p className="mt-1 text-xs leading-5 text-red-700">
                  {errorMessage}
                </p>

              </div>

            </div>

            <button
              type="button"
              onClick={() => loadDashboard(true)}
              disabled={refreshing}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-2.5 text-xs font-black text-white transition hover:bg-red-800 disabled:opacity-60"
            >
              <RefreshCw
                size={14}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Try Again
            </button>

          </div>

        </section>
      )}

      {/* =================================================
          STATS
      ================================================= */}

      <section className="border-b border-slate-200 bg-white">

        <div className="container-main grid grid-cols-2 divide-x divide-y divide-slate-200 sm:grid-cols-5 sm:divide-y-0">

          <DashboardStat
            value={stats.purchasedCourses}
            label="Purchased Courses"
            icon={<BookOpen size={19} />}
          />

          <DashboardStat
            value={stats.lessonsCompleted}
            label="Lessons Completed"
            icon={<CheckCircle2 size={19} />}
          />

          <DashboardStat
            value={`${overallProgress}%`}
            label="Overall Progress"
            icon={<Target size={19} />}
          />

          <DashboardStat
            value={stats.totalVideos}
            label="Recorded Videos"
            icon={<PlayCircle size={19} />}
          />

          <DashboardStat
            value={stats.totalNotes}
            label="Notes & PDFs"
            icon={<FileText size={19} />}
          />

        </div>

      </section>

      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="container-main py-8 sm:py-10 lg:py-12">

        {/* =================================================
            PROGRESS OVERVIEW
        ================================================= */}

        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

          <div className="grid lg:grid-cols-[1fr_300px]">

            <div className="p-6 sm:p-8">

              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">

                <div>

                  <div className="inline-flex items-center gap-2 rounded-full bg-red-50 px-3 py-1.5 text-[11px] font-black uppercase tracking-wider text-red-700">
                    <Target size={13} />
                    Learning Progress
                  </div>

                  <h2 className="mt-4 text-2xl font-black tracking-tight text-[#071b41] sm:text-3xl">
                    Keep going, {firstName}.
                  </h2>

                  <p className="mt-2 max-w-xl text-sm leading-6 text-slate-500">
                    आपकी overall course progress
                    नीचे दिखाई गई है। रोज़ थोड़ा-थोड़ा
                    study करके consistent रहें।
                  </p>

                </div>

                <div className="flex h-24 w-24 shrink-0 flex-col items-center justify-center rounded-full border-[7px] border-red-100 bg-white">

                  <span className="text-xl font-black text-[#071b41]">
                    {overallProgress}%
                  </span>

                  <span className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
                    Progress
                  </span>

                </div>

              </div>

              <div className="mt-7">

                <div className="mb-2 flex items-center justify-between text-xs font-bold">

                  <span className="text-slate-500">
                    Overall learning progress
                  </span>

                  <span className="text-[#071b41]">
                    {overallProgress}%
                  </span>

                </div>

                <div className="h-3 overflow-hidden rounded-full bg-slate-100">

                  <div
                    className="h-full rounded-full bg-gradient-to-r from-red-700 to-red-500 transition-all duration-700"
                    style={{
                      width: `${overallProgress}%`,
                    }}
                  />

                </div>

              </div>

            </div>

            <div className="border-t border-slate-100 bg-slate-50 p-6 lg:border-l lg:border-t-0 sm:p-8">

              <p className="text-xs font-black uppercase tracking-wider text-slate-400">
                Your Resources
              </p>

              <div className="mt-5 grid grid-cols-2 gap-3">

                <MiniResource
                  icon={<PlayCircle size={17} />}
                  value={stats.totalVideos}
                  label="Videos"
                  className="bg-blue-50 text-blue-700"
                />

                <MiniResource
                  icon={<FileText size={17} />}
                  value={stats.totalNotes}
                  label="Notes"
                  className="bg-orange-50 text-orange-700"
                />

              </div>

            </div>

          </div>

        </section>

        {/* =================================================
            COURSES HEADER
        ================================================= */}

        <div className="mt-10 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">

          <div>

            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">
              My Learning
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#071b41] sm:text-3xl">
              My Courses
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              आपके purchased courses और learning content।
            </p>

          </div>

          <Link
            to="/courses"
            className="group inline-flex items-center gap-1.5 text-sm font-black text-red-700 transition hover:text-red-800"
          >
            Explore More Courses

            <ArrowRight
              size={16}
              className="transition-transform group-hover:translate-x-0.5"
            />
          </Link>

        </div>

        {/* =================================================
            COURSES
        ================================================= */}

        {purchasedCourses.length > 0 ? (
          <div className="mt-6 grid gap-5 md:grid-cols-2 xl:grid-cols-3">

            {purchasedCourses.map(
              (purchase, index) => {
                const course =
                  purchase?.course;

                if (!course) {
                  return null;
                }

                const courseId =
                  course?._id ||
                  course?.id;

                const progress =
                  clampPercent(
                    Number(
                      purchase?.progress?.percent
                    ) || 0
                  );

                const videos =
                  Number(
                    course?.totalVideos
                  ) || 0;

                const notes =
                  Number(
                    course?.totalNotes
                  ) || 0;

                return (
                  <CourseCard
                    key={
                      purchase?.purchaseId ||
                      purchase?._id ||
                      courseId ||
                      index
                    }
                    purchase={purchase}
                    course={course}
                    courseId={courseId}
                    progress={progress}
                    videos={videos}
                    notes={notes}
                  />
                );
              }
            )}

          </div>
        ) : (
          <EmptyCourses />
        )}

        {/* =================================================
            RESOURCE SUMMARY
        ================================================= */}

        <section className="mt-10">

          <div>

            <p className="text-[11px] font-black uppercase tracking-[0.18em] text-red-700">
              Learning Content
            </p>

            <h2 className="mt-2 text-2xl font-black tracking-tight text-[#071b41]">
              Your Course Resources
            </h2>

          </div>

          <div className="mt-5 grid gap-4 sm:grid-cols-3">

            <ResourceCard
              icon={<PlayCircle size={21} />}
              value={stats.totalVideos}
              label="Recorded Videos"
              description="Watch your purchased video lessons."
              iconClass="bg-blue-50 text-blue-700"
            />

            <ResourceCard
              icon={<FileText size={21} />}
              value={stats.totalNotes}
              label="Notes & PDFs"
              description="Study material available with your courses."
              iconClass="bg-orange-50 text-orange-700"
            />

            <ResourceCard
              icon={<CheckCircle2 size={21} />}
              value={stats.lessonsCompleted}
              label="Completed Lessons"
              description="Your completed learning content."
              iconClass="bg-green-50 text-green-700"
            />

          </div>

        </section>

        {/* =================================================
            SECURITY
        ================================================= */}

        <section className="mt-10">

          <div className="overflow-hidden rounded-2xl border border-green-200 bg-green-50">

            <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-start sm:p-6">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                <ShieldCheck size={23} />
              </div>

              <div>

                <h3 className="font-black text-green-900">
                  Your Learning Content is Protected
                </h3>

                <p className="mt-2 max-w-3xl text-sm leading-6 text-green-800">
                  आपके purchased course का protected
                  content केवल authorized student account
                  से access किया जाना चाहिए।
                </p>

              </div>

            </div>

          </div>

        </section>

      </section>

    </main>
  );
}

/* =========================================================
   COURSE CARD
========================================================= */

function CourseCard({
  course,
  courseId,
  progress,
  videos,
  notes,
}) {
  const canContinue = Boolean(courseId);

  return (
    <article className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:border-slate-300 hover:shadow-xl">

      {/* IMAGE */}

      <div className="relative h-48 overflow-hidden bg-gradient-to-br from-[#071b41] to-[#0b275d]">

        {course?.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title || "Course"}
            loading="lazy"
            className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="flex h-full items-center justify-center">
            <BookOpen
              size={52}
              className="text-white/20"
            />
          </div>
        )}

        <div className="absolute inset-x-0 bottom-0 h-24 bg-gradient-to-t from-black/60 to-transparent" />

        {/* PURCHASED */}

        <div className="absolute left-4 top-4 inline-flex items-center gap-1.5 rounded-full bg-green-500 px-3 py-1.5 text-[10px] font-black text-white shadow-lg">

          <CheckCircle2 size={13} />

          Purchased

        </div>

        {/* PROGRESS */}

        <div className="absolute bottom-3 left-4 right-4">

          <div className="flex items-center justify-between text-[10px] font-black text-white">

            <span>
              Course Progress
            </span>

            <span>
              {progress}%
            </span>

          </div>

          <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-white/25">

            <div
              className="h-full rounded-full bg-yellow-400 transition-all duration-500"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>

      </div>

      {/* CONTENT */}

      <div className="p-5">

        <div className="flex items-center justify-between gap-3">

          <p className="truncate text-[10px] font-black uppercase tracking-[0.16em] text-red-700">
            {course?.exam || "Course"}
          </p>

          {course?.duration && (
            <span className="inline-flex shrink-0 items-center gap-1 text-[10px] font-bold text-slate-400">

              <Clock3 size={12} />

              {course.duration}

            </span>
          )}

        </div>

        <h3 className="mt-2 line-clamp-2 min-h-[52px] text-lg font-black leading-6 text-[#071b41]">
          {course?.title || "Untitled Course"}
        </h3>

        <p className="mt-2 line-clamp-2 min-h-[42px] text-sm leading-6 text-slate-500">
          {course?.description ||
            "Continue learning from your purchased course."}
        </p>

        {/* CONTENT STATS */}

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-5">

          <ContentStat
            icon={<Video size={15} />}
            value={videos}
            label="Recorded Videos"
          />

          <ContentStat
            icon={<FileText size={15} />}
            value={notes}
            label="Notes / PDFs"
          />

        </div>

        {/* CTA */}

        {canContinue ? (
          <Link
            to={`/learning/${courseId}`}
            className="group/button mt-5 flex items-center justify-center gap-2 rounded-xl bg-red-700 px-4 py-3.5 text-sm font-black text-white shadow-md shadow-red-700/10 transition hover:bg-red-800 hover:shadow-lg"
          >

            {progress > 0
              ? "Continue Learning"
              : "Start Learning"}

            <ArrowRight
              size={16}
              className="transition-transform group-hover/button:translate-x-0.5"
            />

          </Link>
        ) : (
          <button
            type="button"
            disabled
            className="mt-5 flex w-full cursor-not-allowed items-center justify-center gap-2 rounded-xl bg-slate-200 px-4 py-3.5 text-sm font-black text-slate-500"
          >
            Course Unavailable
          </button>
        )}

      </div>

    </article>
  );
}

/* =========================================================
   EMPTY COURSES
========================================================= */

function EmptyCourses() {
  return (
    <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      <div className="relative overflow-hidden bg-gradient-to-br from-[#071b41] to-[#0b275d] p-6 text-white sm:p-8">

        <div className="pointer-events-none absolute -right-16 -top-16 h-48 w-48 rounded-full bg-red-600/20 blur-3xl" />

        <div className="relative flex flex-col gap-6 md:flex-row md:items-center md:justify-between">

          <div>

            <div className="inline-flex rounded-full bg-yellow-400 px-3 py-1 text-[10px] font-black tracking-wider text-[#071b41]">
              START LEARNING
            </div>

            <h3 className="mt-4 max-w-xl text-2xl font-black tracking-tight sm:text-3xl">
              अभी कोई purchased course नहीं है।
            </h3>

            <p className="mt-2 max-w-xl text-sm leading-6 text-slate-300">
              Courses explore करें और अपनी preparation
              शुरू करें।
            </p>

          </div>

          <Link
            to="/courses"
            className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-white px-5 py-3.5 text-sm font-black text-[#071b41] transition hover:-translate-y-0.5 hover:bg-slate-100"
          >
            Explore Courses

            <ArrowRight size={17} />
          </Link>

        </div>

      </div>

      <div className="grid gap-3 p-5 sm:grid-cols-3 sm:p-6">

        <LockedResource
          icon={<PlayCircle size={20} />}
          title="Recorded Videos"
          description="Available after course purchase"
          className="bg-blue-50 text-blue-700"
        />

        <LockedResource
          icon={<FileText size={20} />}
          title="Notes & PDFs"
          description="Available with purchased courses"
          className="bg-orange-50 text-orange-700"
        />

        <LockedResource
          icon={<LockKeyhole size={19} />}
          title="Protected Content"
          description="Accessible to enrolled students"
          className="bg-green-50 text-green-700"
        />

      </div>

    </div>
  );
}

/* =========================================================
   DASHBOARD STAT
========================================================= */

function DashboardStat({
  value,
  label,
  icon,
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-5 sm:px-6 sm:py-6">

      <div className="hidden h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700 sm:flex">
        {icon}
      </div>

      <div className="min-w-0">

        <p className="truncate text-xl font-black text-[#071b41] sm:text-2xl">
          {value}
        </p>

        <p className="mt-0.5 truncate text-[10px] font-bold text-slate-500 sm:text-xs">
          {label}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   CONTENT STAT
========================================================= */

function ContentStat({
  icon,
  value,
  label,
}) {
  return (
    <div className="flex items-center gap-2">

      <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 text-slate-500">
        {icon}
      </div>

      <div>

        <p className="text-sm font-black text-[#071b41]">
          {value}
        </p>

        <p className="text-[9px] font-bold uppercase tracking-wide text-slate-400">
          {label}
        </p>

      </div>

    </div>
  );
}

/* =========================================================
   MINI RESOURCE
========================================================= */

function MiniResource({
  icon,
  value,
  label,
  className,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4">

      <div
        className={`flex h-9 w-9 items-center justify-center rounded-xl ${className}`}
      >
        {icon}
      </div>

      <p className="mt-3 text-xl font-black text-[#071b41]">
        {value}
      </p>

      <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wide text-slate-400">
        {label}
      </p>

    </div>
  );
}

/* =========================================================
   RESOURCE CARD
========================================================= */

function ResourceCard({
  icon,
  value,
  label,
  description,
  iconClass,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">

      <div className="flex items-start justify-between gap-4">

        <div
          className={`flex h-11 w-11 items-center justify-center rounded-xl ${iconClass}`}
        >
          {icon}
        </div>

        <span className="text-2xl font-black text-[#071b41]">
          {value}
        </span>

      </div>

      <h3 className="mt-4 text-sm font-black text-[#071b41]">
        {label}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   LOCKED RESOURCE
========================================================= */

function LockedResource({
  icon,
  title,
  description,
  className,
}) {
  return (
    <div className="rounded-2xl border border-slate-200 p-4">

      <div
        className={`flex h-10 w-10 items-center justify-center rounded-xl ${className}`}
      >
        {icon}
      </div>

      <h3 className="mt-4 text-sm font-black text-[#071b41]">
        {title}
      </h3>

      <p className="mt-1 text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}

/* =========================================================
   LOADING
========================================================= */

function DashboardLoading() {
  return (
    <main className="min-h-screen bg-[#f6f8fc]">

      <div className="h-44 animate-pulse bg-[#071b41]" />

      <div className="container-main -mt-6 pb-12">

        <div className="rounded-3xl bg-white p-6 shadow-sm">

          <div className="flex items-center gap-4">

            <div className="h-16 w-16 animate-pulse rounded-2xl bg-slate-200" />

            <div className="flex-1">

              <div className="h-4 w-32 animate-pulse rounded bg-slate-200" />

              <div className="mt-3 h-7 w-56 animate-pulse rounded bg-slate-200" />

            </div>

          </div>

        </div>

        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-24 animate-pulse rounded-2xl bg-white"
              />
            )
          )}

        </div>

        <div className="flex items-center justify-center py-8">

          <Loader2
            size={22}
            className="animate-spin text-red-700"
          />

        </div>

      </div>

    </main>
  );
}

/* =========================================================
   ERROR SCREEN
========================================================= */

function DashboardError({
  message,
  onRetry,
  loading,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-[#f6f8fc] px-5">

      <div className="w-full max-w-md rounded-3xl border border-slate-200 bg-white p-7 text-center shadow-xl">

        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          !
        </div>

        <h1 className="mt-5 text-xl font-black text-[#071b41]">
          Dashboard Load नहीं हुआ
        </h1>

        <p className="mt-2 text-sm leading-6 text-slate-500">
          {message}
        </p>

        <button
          type="button"
          onClick={onRetry}
          disabled={loading}
          className="mt-6 inline-flex items-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800 disabled:opacity-60"
        >

          <RefreshCw
            size={16}
            className={
              loading
                ? "animate-spin"
                : ""
            }
          />

          Try Again

        </button>

      </div>

    </main>
  );
}

/* =========================================================
   HELPER
========================================================= */

function clampPercent(value) {
  if (!Number.isFinite(value)) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(0, value)
  );
}