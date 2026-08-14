import {
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  Link,
} from "react-router-dom";

import {
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  Filter,
  Loader2,
  PlayCircle,
  RefreshCw,
  Search,
  ShieldCheck,
  Sparkles,
  X,
} from "lucide-react";

import {
  API_URL,
} from "../config/api.js";

import SEO from "../components/SEO.jsx";


/* =========================================================
   COURSE FEATURES
========================================================= */

const courseFeatures = [
  "Complete Video Classes",
  "Subject-wise Notes & PDFs",
  "Structured Recorded Classes",
  "Exam-oriented Preparation",
];


/* =========================================================
   DISCOUNT
========================================================= */

function getDiscount(
  oldPrice,
  price
) {
  const oldValue =
    Number(oldPrice) || 0;

  const priceValue =
    Number(price) || 0;

  if (
    oldValue <= 0 ||
    priceValue >= oldValue
  ) {
    return 0;
  }

  return Math.round(
    ((oldValue -
      priceValue) /
      oldValue) *
      100
  );
}


/* =========================================================
   PRICE FORMAT
========================================================= */

function formatPrice(
  value
) {
  const number =
    Number(value);

  if (
    !Number.isFinite(number)
  ) {
    return "0";
  }

  return number.toLocaleString(
    "en-IN"
  );
}


/* =========================================================
   COURSE COUNTS
========================================================= */

function getVideoCount(
  course
) {
  if (
    Number(course?.totalVideos) >
    0
  ) {
    return Number(
      course.totalVideos
    );
  }

  if (
    Array.isArray(
      course?.lessons
    )
  ) {
    return course.lessons.length;
  }

  if (
    Array.isArray(
      course?.videos
    )
  ) {
    return course.videos.length;
  }

  return 0;
}


function getNotesCount(
  course
) {
  if (
    Number(course?.totalNotes) >
    0
  ) {
    return Number(
      course.totalNotes
    );
  }

  if (
    Array.isArray(
      course?.materials
    )
  ) {
    return course.materials.length;
  }

  if (
    Array.isArray(
      course?.notes
    )
  ) {
    return course.notes.length;
  }

  return 0;
}


/* =========================================================
   JSON PARSER
========================================================= */

async function parseJson(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return {};
  }
}


/* =========================================================
   MAIN COMPONENT
========================================================= */

export default function Courses() {

  const [
    courses,
    setCourses,
  ] = useState([]);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    error,
    setError,
  ] = useState("");

  const [
    search,
    setSearch,
  ] = useState("");

  const [
    examFilter,
    setExamFilter,
  ] = useState("All");

  const [
    sortBy,
    setSortBy,
  ] = useState("featured");

  const [
    showFilters,
    setShowFilters,
  ] = useState(false);


  /* =======================================================
     LOAD PUBLIC COURSES
  ======================================================= */

  const loadCourses =
    async () => {
      try {
        setLoading(true);
        setError("");

        const response =
          await fetch(
            `${API_URL}/api/courses`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",
              },
            }
          );

        const data =
          await parseJson(
            response
          );

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to load courses."
          );
        }

        const publicCourses =
          Array.isArray(
            data?.courses
          )
            ? data.courses
            : [];

        setCourses(
          publicCourses
        );
      } catch (err) {
        console.error(
          "Public Courses Error:",
          err
        );

        setError(
          err?.message ||
            "Courses load नहीं हो पाए।"
        );
      } finally {
        setLoading(false);
      }
    };


  useEffect(() => {
    loadCourses();
  }, []);


  /* =======================================================
     EXAM OPTIONS
  ======================================================= */

  const examOptions =
    useMemo(() => {

      const values =
        courses
          .map(
            (course) =>
              course?.exam
          )
          .filter(
            Boolean
          );

      return [
        "All",
        ...Array.from(
          new Set(values)
        ).sort(
          (a, b) =>
            String(a).localeCompare(
              String(b)
            )
        ),
      ];

    }, [
      courses,
    ]);


  /* =======================================================
     COURSE STATISTICS
  ======================================================= */

  const statistics =
    useMemo(() => {

      const examCount =
        new Set(
          courses
            .map(
              (course) =>
                course?.exam
            )
            .filter(Boolean)
        ).size;

      const videoCount =
        courses.reduce(
          (
            total,
            course
          ) =>
            total +
            getVideoCount(
              course
            ),
          0
        );

      const notesCount =
        courses.reduce(
          (
            total,
            course
          ) =>
            total +
            getNotesCount(
              course
            ),
          0
        );

      return {
        examCount,
        videoCount,
        notesCount,
      };

    }, [
      courses,
    ]);


  /* =======================================================
     FILTER + SEARCH
  ======================================================= */

  const filteredCourses =
    useMemo(() => {

      const query =
        search
          .trim()
          .toLowerCase();

      const result =
        courses.filter(
          (course) => {

            const title =
              String(
                course?.title ||
                  ""
              ).toLowerCase();

            const exam =
              String(
                course?.exam ||
                  ""
              ).toLowerCase();

            const description =
              String(
                course?.description ||
                  ""
              ).toLowerCase();

            const matchesExam =
              examFilter ===
                "All" ||
              course?.exam ===
                examFilter;

            const matchesSearch =
              !query ||
              title.includes(
                query
              ) ||
              exam.includes(
                query
              ) ||
              description.includes(
                query
              );

            return (
              matchesExam &&
              matchesSearch
            );
          }
        );


      if (
        sortBy ===
        "price-low"
      ) {
        return [
          ...result,
        ].sort(
          (a, b) =>
            Number(
              a?.price
            ) -
            Number(
              b?.price
            )
        );
      }


      if (
        sortBy ===
        "price-high"
      ) {
        return [
          ...result,
        ].sort(
          (a, b) =>
            Number(
              b?.price
            ) -
            Number(
              a?.price
            )
        );
      }


      if (
        sortBy ===
        "discount"
      ) {
        return [
          ...result,
        ].sort(
          (a, b) =>
            getDiscount(
              b?.oldPrice,
              b?.price
            ) -
            getDiscount(
              a?.oldPrice,
              a?.price
            )
        );
      }


      return result;

    }, [
      courses,
      search,
      examFilter,
      sortBy,
    ]);


  /* =======================================================
     CLEAR FILTERS
  ======================================================= */

  const clearFilters =
    () => {
      setSearch("");
      setExamFilter(
        "All"
      );
      setSortBy(
        "featured"
      );
    };


  const hasFilters =
    Boolean(
      search.trim()
    ) ||
    examFilter !==
      "All" ||
    sortBy !==
      "featured";


  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <>
      <SEO
        title="Courses | Competitive Exam Courses"
        description="Explore Takshashila Academy courses for SSC and other competitive exams with recorded video classes, notes, PDFs and structured exam preparation."
        path="/courses"
      />

      <main className="min-h-screen bg-[#f7f9fc]">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative overflow-hidden bg-[#071b41] text-white">

        <div className="pointer-events-none absolute -right-32 -top-32 h-96 w-96 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 -left-20 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />


        <div className="container-main relative py-12 sm:py-16 lg:py-20">

          <div className="max-w-3xl">

            <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.07] px-4 py-2 text-xs font-black uppercase tracking-[0.16em] text-yellow-400 backdrop-blur">

              <Sparkles
                size={14}
              />

              Takshashila Academy

            </div>


            <h1 className="mt-6 text-4xl font-black leading-[1.08] tracking-tight sm:text-5xl lg:text-6xl">

              अपने लक्ष्य के लिए
              <span className="block text-yellow-400">
                सही Course चुनें
              </span>

            </h1>


            <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
              Competitive exams की तैयारी के लिए
              recorded video classes, notes और PDFs
              के साथ structured learning शुरू करें।
            </p>

          </div>


          {/* HERO STATS */}

          <div className="mt-9 grid max-w-4xl grid-cols-2 gap-3 sm:grid-cols-4">

            <HeroStat
              icon={
                <BookOpen
                  size={20}
                />
              }
              value={
                statistics.examCount
                  ? `${statistics.examCount}+`
                  : "—"
              }
              label="Exam Categories"
            />


            <HeroStat
              icon={
                <PlayCircle
                  size={20}
                />
              }
              value={
                statistics.videoCount
                  ? `${statistics.videoCount}+`
                  : "—"
              }
              label="Recorded Videos"
            />


            <HeroStat
              icon={
                <FileText
                  size={20}
                />
              }
              value={
                statistics.notesCount
                  ? `${statistics.notesCount}+`
                  : "—"
              }
              label="Study Resources"
            />


            <HeroStat
              icon={
                <ShieldCheck
                  size={20}
                />
              }
              value="Secure"
              label="Student Access"
            />

          </div>

        </div>

      </section>


      {/* =================================================
          COURSE SECTION
      ================================================= */}

      <section className="container-main py-10 sm:py-14 lg:py-16">

        {/* HEADER */}

        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">

          <div>

            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Available Courses
            </p>


            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#071b41] sm:text-4xl">
              अपनी Preparation शुरू करें
            </h2>


            <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
              अपनी परीक्षा के अनुसार course चुनें।
              Purchase के बाद recorded videos,
              notes और PDFs आपके student account में
              available होंगे।
            </p>

          </div>


          <div className="flex items-center gap-3">

            <div className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#071b41] shadow-sm">

              {loading
                ? "Loading..."
                : `${filteredCourses.length} ${
                    filteredCourses.length ===
                    1
                      ? "Course"
                      : "Courses"
                  }`}

            </div>


            <button
              type="button"
              onClick={
                () =>
                  setShowFilters(
                    (value) =>
                      !value
                  )
              }
              className="inline-flex items-center gap-2 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-black text-[#071b41] shadow-sm transition hover:border-[#071b41] lg:hidden"
            >

              <Filter
                size={16}
              />

              Filters

            </button>

          </div>

        </div>


        {/* =================================================
            FILTER BAR
        ================================================= */}

        {!loading &&
          !error &&
          courses.length >
            0 && (

          <div
            className={`mt-7 rounded-3xl border border-slate-200 bg-white p-4 shadow-sm sm:p-5 ${
              showFilters
                ? "block"
                : "hidden lg:block"
            }`}
          >

            <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_210px_210px_auto] lg:items-end">

              {/* SEARCH */}

              <div>

                <label
                  htmlFor="course-search"
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
                >
                  Search Courses
                </label>


                <div className="relative">

                  <Search
                    size={18}
                    className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />


                  <input
                    id="course-search"
                    type="search"
                    value={
                      search
                    }
                    onChange={(
                      event
                    ) =>
                      setSearch(
                        event
                          .target
                          .value
                      )
                    }
                    placeholder="Course, exam या topic search करें..."
                    className="w-full rounded-xl border border-slate-200 bg-slate-50 py-3 pl-11 pr-4 text-sm font-semibold text-[#071b41] outline-none transition placeholder:text-slate-400 focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
                  />

                </div>

              </div>


              {/* EXAM */}

              <div>

                <label
                  htmlFor="exam-filter"
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
                >
                  Exam
                </label>


                <div className="relative">

                  <select
                    id="exam-filter"
                    value={
                      examFilter
                    }
                    onChange={(
                      event
                    ) =>
                      setExamFilter(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-bold text-[#071b41] outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
                  >

                    {examOptions.map(
                      (
                        exam
                      ) => (
                        <option
                          key={
                            exam
                          }
                          value={
                            exam
                          }
                        >
                          {exam ===
                          "All"
                            ? "All Exams"
                            : exam}
                        </option>
                      )
                    )}

                  </select>


                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>


              {/* SORT */}

              <div>

                <label
                  htmlFor="course-sort"
                  className="mb-2 block text-[10px] font-black uppercase tracking-[0.16em] text-slate-500"
                >
                  Sort By
                </label>


                <div className="relative">

                  <select
                    id="course-sort"
                    value={
                      sortBy
                    }
                    onChange={(
                      event
                    ) =>
                      setSortBy(
                        event
                          .target
                          .value
                      )
                    }
                    className="w-full appearance-none rounded-xl border border-slate-200 bg-slate-50 px-4 py-3 pr-10 text-sm font-bold text-[#071b41] outline-none transition focus:border-red-500 focus:bg-white focus:ring-4 focus:ring-red-50"
                  >

                    <option value="featured">
                      Featured
                    </option>

                    <option value="price-low">
                      Price: Low to High
                    </option>

                    <option value="price-high">
                      Price: High to Low
                    </option>

                    <option value="discount">
                      Highest Discount
                    </option>

                  </select>


                  <ChevronDown
                    size={17}
                    className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-slate-400"
                  />

                </div>

              </div>


              {/* CLEAR */}

              <button
                type="button"
                onClick={
                  clearFilters
                }
                disabled={
                  !hasFilters
                }
                className="inline-flex min-h-[46px] items-center justify-center gap-2 rounded-xl border border-slate-200 px-4 text-sm font-black text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-700 disabled:cursor-not-allowed disabled:opacity-40"
              >

                <X
                  size={16}
                />

                Clear

              </button>

            </div>


            {/* ACTIVE FILTERS */}

            {hasFilters && (
              <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-slate-100 pt-4">

                <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">
                  Active:
                </span>


                {search.trim() && (
                  <button
                    type="button"
                    onClick={() =>
                      setSearch(
                        ""
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-red-50 px-3 py-1.5 text-xs font-bold text-red-700"
                  >
                    Search:{" "}
                    {search}

                    <X
                      size={13}
                    />

                  </button>
                )}


                {examFilter !==
                  "All" && (
                  <button
                    type="button"
                    onClick={() =>
                      setExamFilter(
                        "All"
                      )
                    }
                    className="inline-flex items-center gap-1.5 rounded-full bg-blue-50 px-3 py-1.5 text-xs font-bold text-blue-700"
                  >
                    {examFilter}

                    <X
                      size={13}
                    />

                  </button>
                )}

              </div>
            )}

          </div>
        )}


        {/* =================================================
            LOADING
        ================================================= */}

        {loading && (
          <CourseSkeleton />
        )}


        {/* =================================================
            ERROR
        ================================================= */}

        {!loading &&
          error && (
          <div className="mt-9 rounded-3xl border border-red-200 bg-white p-8 text-center shadow-sm sm:p-12">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">

              <BookOpen
                size={28}
              />

            </div>


            <h3 className="mt-5 text-xl font-black text-[#071b41]">
              Courses load नहीं हो पाए
            </h3>


            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {error}
            </p>


            <button
              type="button"
              onClick={
                loadCourses
              }
              className="mt-6 inline-flex items-center gap-2 rounded-xl bg-[#071b41] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b275d]"
            >

              <RefreshCw
                size={16}
              />

              Try Again

            </button>

          </div>
        )}


        {/* =================================================
            EMPTY
        ================================================= */}

        {!loading &&
          !error &&
          filteredCourses.length ===
            0 && (
          <div className="mt-9 rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center sm:p-14">

            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-slate-100 text-slate-400">

              <Search
                size={28}
              />

            </div>


            <h3 className="mt-5 text-xl font-black text-[#071b41]">
              {courses.length ===
              0
                ? "अभी कोई course उपलब्ध नहीं है।"
                : "कोई matching course नहीं मिला।"}
            </h3>


            <p className="mx-auto mt-2 max-w-xl text-sm leading-6 text-slate-500">
              {courses.length ===
              0
                ? "Published courses admin panel से add होने के बाद यहाँ दिखाई देंगे।"
                : "Search या filters बदलकर available courses देखें।"}
            </p>


            {hasFilters && (
              <button
                type="button"
                onClick={
                  clearFilters
                }
                className="mt-6 inline-flex items-center gap-2 rounded-xl border-2 border-[#071b41] px-5 py-3 text-sm font-black text-[#071b41] transition hover:bg-[#071b41] hover:text-white"
              >

                <X
                  size={16}
                />

                Clear Filters

              </button>
            )}

          </div>
        )}


        {/* =================================================
            COURSE GRID
        ================================================= */}

        {!loading &&
          !error &&
          filteredCourses.length >
            0 && (
          <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

            {filteredCourses.map(
              (course) => (
                <CourseCard
                  key={
                    course?._id ||
                    course?.id
                  }
                  course={
                    course
                  }
                />
              )
            )}

          </div>
        )}

      </section>


      {/* =================================================
          HOW IT WORKS
      ================================================= */}

      <section className="border-t border-slate-200 bg-white py-14 sm:py-16">

        <div className="container-main">

          <div className="mx-auto max-w-3xl text-center">

            <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
              Simple Learning Journey
            </p>


            <h2 className="mt-2 text-3xl font-black tracking-tight text-[#071b41] sm:text-4xl">
              Course खरीदने के बाद क्या मिलेगा?
            </h2>


            <p className="mt-3 text-sm leading-6 text-slate-500">
              Simple process के साथ अपना course शुरू करें।
            </p>

          </div>


          <div className="mt-10 grid gap-5 md:grid-cols-3">

            <ProcessCard
              number="01"
              icon={
                <BookOpen
                  size={21}
                />
              }
              title="Student Signup / Login"
              description="अपना student account बनाकर platform पर login करें।"
            />


            <ProcessCard
              number="02"
              icon={
                <CheckCircle2
                  size={21}
                />
              }
              title="Course Purchase"
              description="अपनी जरूरत का course select करके purchase process complete करें।"
            />


            <ProcessCard
              number="03"
              icon={
                <PlayCircle
                  size={21}
                />
              }
              title="Content Unlock"
              description="Payment verification के बाद videos, notes और PDFs student dashboard में available होंगे।"
            />

          </div>

        </div>

      </section>


      {/* =================================================
          SECURITY
      ================================================= */}

      <section className="container-main py-10 sm:py-14">

        <div className="rounded-3xl border border-green-200 bg-green-50 p-6 sm:p-8">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-start">

            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">

              <ShieldCheck
                size={25}
              />

            </div>


            <div>

              <h3 className="text-lg font-black text-green-950">
                Protected Learning Content
              </h3>


              <p className="mt-2 max-w-4xl text-sm leading-6 text-green-800">
                Paid course के videos, notes और PDFs केवल
                authorized students के learning area में
                available होंगे। Backend purchase verification
                के बाद ही purchased content access किया जाएगा।
              </p>

            </div>

          </div>

        </div>

      </section>

    </main>
    </>
  );
}


/* =========================================================
   COURSE CARD
========================================================= */

function CourseCard({
  course,
}) {
  const courseId =
    course?._id ||
    course?.id;

  const price =
    Number(
      course?.price
    ) || 0;

  const oldPrice =
    Number(
      course?.oldPrice
    ) || 0;

  const discount =
    getDiscount(
      oldPrice,
      price
    );

  const videoCount =
    getVideoCount(
      course
    );

  const notesCount =
    getNotesCount(
      course
    );


  return (
    <article className="group flex h-full flex-col overflow-hidden rounded-[26px] border border-slate-200 bg-white shadow-sm transition duration-300 hover:-translate-y-1.5 hover:border-slate-300 hover:shadow-2xl hover:shadow-slate-200/60">

      {/* =================================================
          IMAGE / BANNER
      ================================================= */}

      <div className="relative h-56 overflow-hidden bg-[#071b41]">

        {course?.thumbnail ? (
          <img
            src={
              course.thumbnail
            }
            alt={
              course.title ||
              "Course"
            }
            loading="lazy"
            className="absolute inset-0 h-full w-full object-cover transition duration-500 group-hover:scale-105"
          />
        ) : (
          <div className="absolute inset-0 flex items-center justify-center bg-gradient-to-br from-[#071b41] via-[#0b275d] to-[#123a7a]">

            <BookOpen
              size={58}
              className="text-yellow-400"
            />

          </div>
        )}


        <div className="absolute inset-0 bg-gradient-to-t from-[#071b41]/95 via-[#071b41]/35 to-transparent" />


        {/* DISCOUNT */}

        <div className="absolute left-4 top-4">

          <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-[#071b41] shadow-lg">

            {discount >
            0 ? (
              <>
                <Sparkles
                  size={12}
                />

                {discount}% OFF
              </>
            ) : (
              "COURSE"
            )}

          </span>

        </div>


        {/* EXAM */}

        {course?.exam && (
          <div className="absolute bottom-4 left-4">

            <span className="rounded-full border border-white/15 bg-black/30 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-white backdrop-blur-md">
              {course.exam}
            </span>

          </div>
        )}


        {/* BOOK ICON */}

        {!course?.thumbnail && (
          <div className="absolute bottom-4 right-4 flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white backdrop-blur">
            <BookOpen
              size={18}
            />
          </div>
        )}

      </div>


      {/* =================================================
          BODY
      ================================================= */}

      <div className="flex flex-1 flex-col p-5 sm:p-6">

        {/* TITLE */}

        <h3 className="line-clamp-2 min-h-[58px] text-xl font-black leading-7 text-[#071b41] transition group-hover:text-red-700">

          {course?.title ||
            "Untitled Course"}

        </h3>


        {/* DESCRIPTION */}

        <p className="mt-3 line-clamp-3 min-h-[66px] text-sm leading-6 text-slate-500">

          {course?.description ||
            "Structured recorded learning course with videos, notes and study material."}

        </p>


        {/* =================================================
            FEATURES
        ================================================= */}

        <div className="mt-5 space-y-2.5">

          {courseFeatures
            .slice(
              0,
              3
            )
            .map(
              (
                feature
              ) => (
                <div
                  key={
                    feature
                  }
                  className="flex items-center gap-2.5"
                >

                  <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-green-50 text-green-600">

                    <Check
                      size={12}
                      strokeWidth={
                        3
                      }
                    />

                  </span>


                  <span className="text-xs font-bold text-slate-600">
                    {feature}
                  </span>

                </div>
              )
            )}

        </div>


        {/* =================================================
            COURSE INFO
        ================================================= */}

        <div className="mt-5 grid grid-cols-2 gap-2 border-t border-slate-100 pt-5">

          <InfoPill
            icon={
              <PlayCircle
                size={15}
              />
            }
            value={
              videoCount
                ? `${videoCount} Videos`
                : "Recorded Videos"
            }
          />


          <InfoPill
            icon={
              <FileText
                size={15}
              />
            }
            value={
              notesCount
                ? `${notesCount} Notes`
                : "Notes & PDFs"
            }
          />


          <InfoPill
            icon={
              <Clock3
                size={15}
              />
            }
            value={
              course?.duration ||
              "Self-paced"
            }
          />


          <InfoPill
            icon={
              <ShieldCheck
                size={15}
              />
            }
            value="Secure Access"
          />

        </div>


        {/* =================================================
            PRICE
        ================================================= */}

        <div className="mt-5 flex items-end justify-between gap-3">

          <div>

            <p className="text-[10px] font-black uppercase tracking-[0.16em] text-slate-400">
              Course Fee
            </p>


            <div className="mt-1 flex items-center gap-2">

              <span className="text-2xl font-black text-[#071b41]">
                ₹
                {formatPrice(
                  price
                )}
              </span>


              {oldPrice >
                price && (
                <span className="text-sm font-bold text-slate-400 line-through">
                  ₹
                  {formatPrice(
                    oldPrice
                  )}
                </span>
              )}

            </div>

          </div>


          {discount >
            0 && (
            <span className="rounded-lg bg-green-50 px-2.5 py-1.5 text-[10px] font-black text-green-700">
              Save{" "}
              {discount}%
            </span>
          )}

        </div>


        {/* =================================================
            BUTTONS
        ================================================= */}

        <div className="mt-6 grid grid-cols-2 gap-3">

          <Link
            to={
              courseId
                ? `/course/${courseId}`
                : "/courses"
            }
            className="inline-flex items-center justify-center rounded-xl border-2 border-[#071b41] px-3 py-3 text-center text-xs font-black text-[#071b41] transition hover:bg-[#071b41] hover:text-white sm:text-sm"
          >
            View Details
          </Link>


          <Link
            to={
              courseId
                ? `/course/${courseId}`
                : "/courses"
            }
            className="inline-flex items-center justify-center gap-1.5 rounded-xl bg-red-700 px-3 py-3 text-xs font-black text-white shadow-md shadow-red-700/10 transition hover:bg-red-800 sm:text-sm"
          >
            Buy Course

            <ArrowRight
              size={15}
            />

          </Link>

        </div>

      </div>

    </article>
  );
}


/* =========================================================
   HERO STAT
========================================================= */

function HeroStat({
  icon,
  value,
  label,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-4 backdrop-blur">

      <div className="flex items-center gap-2">

        <span className="text-yellow-400">
          {icon}
        </span>


        <span className="text-lg font-black text-white">
          {value}
        </span>

      </div>


      <p className="mt-1 text-[10px] font-bold text-slate-400">
        {label}
      </p>

    </div>
  );
}


/* =========================================================
   INFO PILL
========================================================= */

function InfoPill({
  icon,
  value,
}) {
  return (
    <div className="flex min-w-0 items-center gap-2 rounded-xl bg-slate-50 px-3 py-2.5">

      <span className="shrink-0 text-slate-400">
        {icon}
      </span>


      <span className="truncate text-[10px] font-bold text-slate-500">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   PROCESS CARD
========================================================= */

function ProcessCard({
  number,
  icon,
  title,
  description,
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-slate-50 p-6 transition duration-300 hover:-translate-y-1 hover:bg-white hover:shadow-xl">

      <div className="flex items-center gap-3">

        <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-[#071b41] text-yellow-400">
          {icon}
        </div>


        <span className="text-xs font-black tracking-widest text-red-700">
          STEP {number}
        </span>

      </div>


      <h3 className="mt-5 text-lg font-black text-[#071b41]">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   SKELETON
========================================================= */

function CourseSkeleton() {
  return (
    <div className="mt-8 grid gap-6 sm:grid-cols-2 xl:grid-cols-3">

      {[1, 2, 3, 4, 5, 6].map(
        (item) => (
          <div
            key={
              item
            }
            className="overflow-hidden rounded-[26px] border border-slate-200 bg-white"
          >

            <div className="h-56 animate-pulse bg-slate-200" />


            <div className="space-y-4 p-6">

              <div className="h-6 w-4/5 animate-pulse rounded-lg bg-slate-200" />

              <div className="h-4 w-full animate-pulse rounded-lg bg-slate-100" />

              <div className="h-4 w-5/6 animate-pulse rounded-lg bg-slate-100" />


              <div className="space-y-2 pt-2">

                <div className="h-4 w-3/4 animate-pulse rounded-lg bg-slate-100" />

                <div className="h-4 w-2/3 animate-pulse rounded-lg bg-slate-100" />

              </div>


              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

              <div className="h-12 animate-pulse rounded-xl bg-slate-100" />

            </div>

          </div>
        )
      )}

    </div>
  );
}