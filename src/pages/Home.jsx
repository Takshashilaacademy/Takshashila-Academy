import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  CheckCircle2,
  Clock3,
  FileText,
  Loader2,
  PlayCircle,
  ShieldCheck,
  Users,
} from "lucide-react";

import { API_BASE } from "../config/api.js";

const courseFeatures = [
  "Complete Video Classes",
  "Subject-wise Notes & PDFs",
  "Structured Recorded Classes",
  "Exam-oriented Preparation",
];

const fallbackColors = [
  "from-blue-900 via-blue-800 to-indigo-900",
  "from-red-800 via-red-700 to-orange-700",
  "from-emerald-800 via-emerald-700 to-teal-700",
  "from-purple-900 via-purple-800 to-indigo-800",
  "from-slate-900 via-slate-800 to-blue-900",
  "from-orange-800 via-orange-700 to-red-700",
];

function getDiscount(oldPrice, price) {
  const oldValue = Number(oldPrice);
  const currentValue = Number(price);

  if (
    !Number.isFinite(oldValue) ||
    !Number.isFinite(currentValue) ||
    oldValue <= 0 ||
    currentValue < 0 ||
    currentValue >= oldValue
  ) {
    return 0;
  }

  return Math.max(
    0,
    Math.round(
      ((oldValue - currentValue) / oldValue) * 100
    )
  );
}

function normalizeCourse(course, index) {
  const id =
    course?._id ||
    course?.id ||
    `course-${index}`;

  const price = Number(course?.price) || 0;

  const oldPrice =
    Number(course?.oldPrice) || price;

  return {
    ...course,

    id,

    title:
      course?.title ||
      course?.shortTitle ||
      "Untitled Course",

    exam:
      course?.exam ||
      "Competitive Exam",

    description:
      course?.description ||
      course?.fullDescription ||
      "Structured preparation course.",

    price,

    oldPrice,

    duration:
      course?.duration ||
      "Self-paced",

    totalVideos:
      Number(course?.totalVideos) || 0,

    totalNotes:
      Number(course?.totalNotes) || 0,

    totalTests:
      Number(course?.totalTests) || 0,

    color:
      course?.color ||
      fallbackColors[
        index % fallbackColors.length
      ],
  };
}

export default function Courses() {
  const [courses, setCourses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    let isMounted = true;

    const controller =
      new AbortController();

    const loadCourses = async () => {
      try {
        setLoading(true);
        setError("");

        const response = await fetch(
          `${API_BASE}/courses`,
          {
            method: "GET",

            headers: {
              Accept:
                "application/json",
            },

            signal:
              controller.signal,
          }
        );

        let data = null;

        try {
          data = await response.json();
        } catch {
          throw new Error(
            "Invalid response received from courses server."
          );
        }

        if (
          !response.ok ||
          !data?.success
        ) {
          throw new Error(
            data?.message ||
              "Unable to load courses."
          );
        }

        const fetchedCourses =
          Array.isArray(
            data?.courses
          )
            ? data.courses
            : [];

        if (isMounted) {
          setCourses(
            fetchedCourses.map(
              normalizeCourse
            )
          );
        }
      } catch (fetchError) {
        if (
          fetchError?.name ===
          "AbortError"
        ) {
          return;
        }

        console.error(
          "Home Courses Error:",
          fetchError
        );

        if (isMounted) {
          setCourses([]);

          setError(
            fetchError?.message ||
              "Courses could not be loaded."
          );
        }
      } finally {
        if (isMounted) {
          setLoading(false);
        }
      }
    };

    loadCourses();

    return () => {
      isMounted = false;
      controller.abort();
    };
  }, []);

  const courseCountLabel =
    useMemo(() => {
      if (loading) {
        return "Loading...";
      }

      return `${courses.length} ${
        courses.length === 1
          ? "Course"
          : "Courses"
      } Available`;
    }, [
      courses.length,
      loading,
    ]);

  return (
    <main className="min-h-screen bg-slate-50">

      {/* =====================================================
          PAGE HEADER
      ===================================================== */}

      <section className="bg-[#071b41] py-14 text-white sm:py-16">
        <div className="container-main">

          <div className="max-w-3xl">

            <p className="text-sm font-black uppercase tracking-[0.18em] text-yellow-400">
              Takshashila Academy
            </p>

            <h1 className="mt-3 text-4xl font-black sm:text-5xl">
              Competitive Exam Courses
            </h1>

            <p className="mt-5 text-sm leading-7 text-slate-300 sm:text-base">
              अपनी परीक्षा के अनुसार सही course चुनें और structured
              preparation के साथ अपनी तैयारी शुरू करें।
            </p>

          </div>

          {/* Small Stats */}

          <div className="mt-9 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <BookOpen
                className="text-yellow-400"
                size={22}
              />

              <p className="mt-2 text-lg font-black">
                8+
              </p>

              <p className="text-xs text-slate-400">
                Exam Categories
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <PlayCircle
                className="text-yellow-400"
                size={22}
              />

              <p className="mt-2 text-lg font-black">
                Video
              </p>

              <p className="text-xs text-slate-400">
                Classes
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <FileText
                className="text-yellow-400"
                size={22}
              />

              <p className="mt-2 text-lg font-black">
                Notes
              </p>

              <p className="text-xs text-slate-400">
                Study Material
              </p>
            </div>

            <div className="rounded-xl border border-white/10 bg-white/5 p-4">
              <ShieldCheck
                className="text-yellow-400"
                size={22}
              />

              <p className="mt-2 text-lg font-black">
                Secure
              </p>

              <p className="text-xs text-slate-400">
                Student Access
              </p>
            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          COURSES
      ===================================================== */}

      <section className="container-main py-12 sm:py-16">

        {/* Top row */}

        <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-end">

          <div>

            <p className="text-sm font-black uppercase tracking-widest text-red-700">
              Available Courses
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#071b41]">
              अपना Course चुनें
            </h2>

            <p className="mt-2 text-sm text-slate-500">
              Course purchase करने के बाद ही paid learning content unlock होगा।
            </p>

          </div>

          <div className="rounded-lg bg-white px-4 py-2 text-sm font-bold text-slate-600 shadow-sm ring-1 ring-slate-200">
            {courseCountLabel}
          </div>

        </div>

        {/* =====================================================
            LOADING STATE
        ===================================================== */}

        {loading && (
          <div className="mt-9 flex min-h-[260px] items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">

            <div className="flex flex-col items-center gap-3 text-center">

              <Loader2
                size={32}
                className="animate-spin text-[#071b41]"
              />

              <p className="text-sm font-semibold text-slate-600">
                Courses load हो रहे हैं...
              </p>

            </div>

          </div>
        )}

        {/* =====================================================
            ERROR STATE
        ===================================================== */}

        {!loading && error && (
          <div className="mt-9 rounded-2xl border border-red-200 bg-red-50 p-6 text-center">

            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full bg-red-100">

              <BookOpen
                size={23}
                className="text-red-700"
              />

            </div>

            <h3 className="mt-4 text-lg font-black text-red-900">
              Courses load नहीं हो पाए
            </h3>

            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-red-700">
              {error}
            </p>

            <button
              type="button"
              onClick={() => {
                window.location.reload();
              }}
              className="mt-5 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800"
            >
              Retry
            </button>

          </div>
        )}

        {/* =====================================================
            EMPTY STATE
        ===================================================== */}

        {!loading &&
          !error &&
          courses.length === 0 && (
            <div className="mt-9 rounded-2xl border border-slate-200 bg-white p-8 text-center shadow-sm sm:p-12">

              <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-full bg-slate-100">

                <BookOpen
                  size={26}
                  className="text-slate-500"
                />

              </div>

              <h3 className="mt-5 text-xl font-black text-[#071b41]">
                अभी कोई course available नहीं है
              </h3>

              <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
                Published course उपलब्ध होने के बाद वह यहाँ दिखाई देगा।
              </p>

            </div>
          )}

        {/* =====================================================
            COURSE GRID
        ===================================================== */}

        {!loading &&
          !error &&
          courses.length > 0 && (
            <div className="mt-9 grid gap-6 md:grid-cols-2 lg:grid-cols-3">

              {courses.map(
                (course) => {

                  const discount =
                    getDiscount(
                      course.oldPrice,
                      course.price
                    );

                  return (
                    <article
                      key={course.id}
                      className="group overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-xl"
                    >

                      {/* Course Banner */}

                      <div
                        className={`relative overflow-hidden bg-gradient-to-br ${course.color} p-6 text-white`}
                      >

                        {/* Discount */}

                        {discount > 0 && (
                          <div className="absolute right-4 top-4 rounded-full bg-yellow-400 px-3 py-1 text-xs font-black text-[#071b41]">
                            {discount}% OFF
                          </div>
                        )}

                        <div className="relative z-10">

                          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-white/10 ring-1 ring-white/20">

                            <BookOpen
                              size={25}
                              className="text-yellow-300"
                            />

                          </div>

                          <p className="mt-5 text-xs font-black uppercase tracking-widest text-yellow-300">
                            {course.exam}
                          </p>

                          <h3 className="mt-2 min-h-[58px] text-xl font-black leading-7">
                            {course.title}
                          </h3>

                        </div>

                        {/* Decorative circles */}

                        <div className="absolute -bottom-10 -right-10 h-32 w-32 rounded-full bg-white/5" />

                        <div className="absolute -right-4 top-20 h-20 w-20 rounded-full bg-white/5" />

                      </div>

                      {/* Course Body */}

                      <div className="p-6">

                        <p className="min-h-[72px] text-sm leading-6 text-slate-600">
                          {course.description}
                        </p>

                        {/* Course Features */}

                        <div className="mt-5 space-y-2.5">

                          {courseFeatures.map(
                            (feature) => (
                              <div
                                key={feature}
                                className="flex items-center gap-2 text-sm text-slate-600"
                              >

                                <CheckCircle2
                                  size={16}
                                  className="shrink-0 text-green-600"
                                />

                                <span>
                                  {feature}
                                </span>

                              </div>
                            )
                          )}

                        </div>

                        {/* Info */}

                        <div className="mt-5 flex flex-wrap items-center gap-4 border-t border-slate-100 pt-5 text-xs font-semibold text-slate-500">

                          <div className="flex items-center gap-1.5">
                            <Clock3 size={15} />
                            {course.duration}
                          </div>

                          <div className="flex items-center gap-1.5">
                            <Users size={15} />
                            Students
                          </div>

                        </div>

                        {/* Price */}

                        <div className="mt-5 flex items-end gap-2">

                          <span className="text-2xl font-black text-[#071b41]">
                            ₹{course.price}
                          </span>

                          {course.oldPrice >
                            course.price && (
                            <span className="pb-0.5 text-sm font-semibold text-slate-400 line-through">
                              ₹{course.oldPrice}
                            </span>
                          )}

                        </div>

                        {/* Buttons */}

                        <div className="mt-5 grid grid-cols-2 gap-3">

                          {/* IMPORTANT:
                              Actual App route is:
                              /course/:courseId
                          */}

                          <Link
                            to={`/course/${course.id}`}
                            className="rounded-xl border-2 border-[#071b41] px-3 py-3 text-center text-sm font-black text-[#071b41] transition hover:bg-[#071b41] hover:text-white"
                          >
                            View Details
                          </Link>

                          <Link
                            to="/login"
                            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-700 px-3 py-3 text-sm font-black text-white transition hover:bg-red-800"
                          >
                            Buy Now

                            <ArrowRight
                              size={16}
                            />

                          </Link>

                        </div>

                      </div>

                    </article>
                  );
                }
              )}

            </div>
          )}

      </section>

      {/* =====================================================
          PURCHASE FLOW INFO
      ===================================================== */}

      <section className="border-t border-slate-200 bg-white py-14 sm:py-16">

        <div className="container-main">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-sm font-black uppercase tracking-widest text-red-700">
              How It Works
            </p>

            <h2 className="mt-2 text-3xl font-black text-[#071b41]">
              Course खरीदने के बाद क्या मिलेगा?
            </h2>

            <p className="mt-3 text-sm leading-6 text-slate-500">
              आपका purchased content आपके student account में securely
              available रहेगा।
            </p>

          </div>

          <div className="mt-10 grid gap-5 md:grid-cols-3">

            {/* Step 1 */}

            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071b41] text-sm font-black text-yellow-400">
                01
              </div>

              <h3 className="mt-5 text-lg font-black text-[#071b41]">
                Student Signup / Login
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                अपना student account बनाकर platform पर login करें।
              </p>

            </div>

            {/* Step 2 */}

            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071b41] text-sm font-black text-yellow-400">
                02
              </div>

              <h3 className="mt-5 text-lg font-black text-[#071b41]">
                Course Purchase
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                अपनी जरूरत का course select करके secure payment करें।
              </p>

            </div>

            {/* Step 3 */}

            <div className="relative rounded-2xl border border-slate-200 bg-slate-50 p-6">

              <div className="flex h-11 w-11 items-center justify-center rounded-full bg-[#071b41] text-sm font-black text-yellow-400">
                03
              </div>

              <h3 className="mt-5 text-lg font-black text-[#071b41]">
                Content Unlock
              </h3>

              <p className="mt-2 text-sm leading-6 text-slate-600">
                Payment verify होने के बाद videos, notes और PDFs
                student dashboard में unlock होंगे।
              </p>

            </div>

          </div>

        </div>
      </section>

      {/* =====================================================
          SECURITY NOTICE
      ===================================================== */}

      <section className="container-main py-12">

        <div className="rounded-2xl border border-green-200 bg-green-50 p-6 sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
              <ShieldCheck size={26} />
            </div>

            <div>

              <h3 className="text-lg font-black text-green-900">
                Protected Learning Content
              </h3>

              <p className="mt-2 max-w-3xl text-sm leading-6 text-green-800">
                Paid course के videos, notes और PDFs public नहीं रखे जाएंगे।
                Final system में backend purchase verification और secure
                media access के बाद ही purchased content student को मिलेगा।
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
  );
}