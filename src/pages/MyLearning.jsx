import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  Download,
  FileText,
  Loader2,
  LockKeyhole,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
} from "lucide-react";

import { API_URL } from "../config/api.js";

import {
  clearStudentAuth,
  getStudentAuthHeaders,
  getStudentToken,
} from "../utils/authStorage.js";


/* =========================================================
   MY LEARNING
========================================================= */

export default function MyLearning() {
  const { courseId } = useParams();
  const navigate = useNavigate();

  const videoRef = useRef(null);
  const mountedRef = useRef(true);
  const progressTimerRef = useRef(null);
  const lastProgressSaveRef = useRef(0);
  const resumeLessonRef = useRef("");

  /* =======================================================
     STATE
  ======================================================= */

  const [course, setCourse] = useState(null);
  const [purchase, setPurchase] = useState(null);
  const [progress, setProgress] = useState(null);

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const [errorMessage, setErrorMessage] = useState("");

  const [activeTab, setActiveTab] =
    useState("videos");

  const [selectedLesson, setSelectedLesson] =
    useState(null);

  const [protectedMediaUrl, setProtectedMediaUrl] =
    useState("");

  const [mediaLoading, setMediaLoading] =
    useState(false);

  const [mediaError, setMediaError] =
    useState("");

  const [materialLoading, setMaterialLoading] =
    useState("");

  const [lessonSaving, setLessonSaving] =
    useState(false);

  const [switchingLesson, setSwitchingLesson] =
    useState(false);

  const [openChapter, setOpenChapter] =
    useState(true);


  /* =======================================================
     NORMALIZED DATA
  ======================================================= */

  const lessons = useMemo(() => {
    return Array.isArray(course?.lessons)
      ? course.lessons
      : [];
  }, [course]);

  const materials = useMemo(() => {
    return Array.isArray(course?.materials)
      ? course.materials
      : [];
  }, [course]);

  const progressRows = useMemo(() => {
    return Array.isArray(progress?.progress)
      ? progress.progress
      : [];
  }, [progress]);

  const progressByLesson = useMemo(() => {
    const map = new Map();

    progressRows.forEach((item) => {
      const lessonId = getId(item?.lesson);

      if (lessonId) {
        map.set(lessonId, item);
      }
    });

    return map;
  }, [progressRows]);

  const currentLessonIndex = useMemo(() => {
    const currentId = getId(selectedLesson);

    if (!currentId) {
      return -1;
    }

    return lessons.findIndex(
      (lesson) =>
        getId(lesson) === currentId
    );
  }, [lessons, selectedLesson]);

  const completedLessons = Math.max(
    0,
    Number(progress?.completedLessons) || 0
  );

  const totalLessons = Math.max(
    0,
    Number(progress?.totalLessons) ||
      lessons.length
  );

  const overallProgress = clampPercent(
    Number(progress?.overallProgress) || 0
  );


  /* =======================================================
     AUTH REDIRECT
  ======================================================= */

  const redirectToLogin = useCallback(() => {
    clearStudentAuth();

    navigate(
      `/login?redirect=${encodeURIComponent(
        `/learning/${courseId || ""}`
      )}`,
      {
        replace: true,
      }
    );
  }, [navigate, courseId]);


  /* =======================================================
     LOAD COURSE + PROGRESS
  ======================================================= */

  const loadLearning = useCallback(
    async (isRefresh = false) => {
      if (!courseId) {
        setErrorMessage(
          "Course ID is missing."
        );

        setLoading(false);
        return;
      }

      const token = getStudentToken();

      if (!token) {
        redirectToLogin();
        return;
      }

      try {
        if (isRefresh) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }

        setErrorMessage("");

        const headers = {
          Accept: "application/json",
          ...getStudentAuthHeaders(),
        };

        const [
          courseResponse,
          progressResponse,
        ] = await Promise.all([
          fetch(
            `${API_URL}/api/student/learning/${courseId}`,
            {
              method: "GET",
              headers,
            }
          ),

          fetch(
            `${API_URL}/api/student/courses/${courseId}/progress`,
            {
              method: "GET",
              headers,
            }
          ),
        ]);

        const courseData =
          await parseJson(
            courseResponse
          );

        const progressData =
          await parseJson(
            progressResponse
          );

        if (
          courseResponse.status === 401 ||
          progressResponse.status === 401
        ) {
          redirectToLogin();
          return;
        }

        if (!courseResponse.ok) {
          throw new Error(
            courseData?.message ||
              "Unable to load your course."
          );
        }

        if (!courseData?.course) {
          throw new Error(
            "Course content was not found."
          );
        }

        if (!mountedRef.current) {
          return;
        }

        const loadedCourse =
          courseData.course;

        const loadedLessons =
          Array.isArray(
            loadedCourse.lessons
          )
            ? loadedCourse.lessons
            : [];

        setCourse(
          loadedCourse
        );

        setPurchase(
          courseData.purchase ||
            null
        );

        if (progressResponse.ok) {
          setProgress(
            progressData
          );
        }

        const lastWatchedId =
          normalizeId(
            progressData?.lastWatchedLessonId
          );

        const resumeLesson =
          lastWatchedId
            ? loadedLessons.find(
                (lesson) =>
                  getId(lesson) ===
                  lastWatchedId
              )
            : null;

        setSelectedLesson(
          (current) => {
            const currentId =
              getId(current);

            const stillExists =
              currentId
                ? loadedLessons.find(
                    (lesson) =>
                      getId(lesson) ===
                      currentId
                  )
                : null;

            return (
              stillExists ||
              resumeLesson ||
              loadedLessons[0] ||
              null
            );
          }
        );
      } catch (error) {
        console.error(
          "My Learning Error:",
          error
        );

        if (mountedRef.current) {
          setErrorMessage(
            error?.message ||
              "Unable to load your course."
          );
        }
      } finally {
        if (mountedRef.current) {
          setLoading(false);
          setRefreshing(false);
        }
      }
    },
    [courseId, redirectToLogin]
  );


  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    mountedRef.current = true;

    loadLearning();

    return () => {
      mountedRef.current = false;

      if (progressTimerRef.current) {
        clearTimeout(
          progressTimerRef.current
        );

        progressTimerRef.current = null;
      }
    };
  }, [loadLearning]);


  /* =======================================================
     LOAD PROTECTED VIDEO
  ======================================================= */

  const loadProtectedVideo =
    useCallback(async () => {
      const token =
        getStudentToken();

      const lessonId =
        getId(selectedLesson);

      if (
        !token ||
        !courseId ||
        !lessonId
      ) {
        setProtectedMediaUrl("");
        return;
      }

      try {
        setMediaLoading(true);
        setMediaError("");
        setProtectedMediaUrl("");

        const response =
          await fetch(
            `${API_URL}/api/student/courses/${courseId}/media/video/${lessonId}`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                ...getStudentAuthHeaders(),
              },
            }
          );

        const data =
          await parseJson(
            response
          );

        if (
          response.status === 401
        ) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to load this video."
          );
        }

        const url =
          data?.media?.url ||
          data?.url ||
          data?.mediaUrl ||
          "";

        if (!url) {
          throw new Error(
            "Protected video URL was not returned."
          );
        }

        if (mountedRef.current) {
          setProtectedMediaUrl(
            url
          );
        }
      } catch (error) {
        console.error(
          "Protected Video Error:",
          error
        );

        if (mountedRef.current) {
          setMediaError(
            error?.message ||
              "Unable to load this video."
          );
        }
      } finally {
        if (mountedRef.current) {
          setMediaLoading(false);
        }
      }
    }, [
      courseId,
      selectedLesson,
      redirectToLogin,
    ]);


  useEffect(() => {
    resumeLessonRef.current = "";

    loadProtectedVideo();
  }, [
    loadProtectedVideo,
  ]);


  /* =======================================================
     SAVE PROGRESS
  ======================================================= */

  const saveProgress =
    useCallback(
      async ({
        watchedSeconds = 0,
        durationSeconds = 0,
        completed = false,
        silent = false,
      }) => {
        const lessonId =
          getId(selectedLesson);

        const token =
          getStudentToken();

        if (
          !lessonId ||
          !courseId ||
          !token
        ) {
          return;
        }

        try {
          if (!silent) {
            setLessonSaving(true);
          }

          const watched =
            Math.max(
              0,
              Number(watchedSeconds) || 0
            );

          const duration =
            Math.max(
              0,
              Number(durationSeconds) || 0
            );

          const response =
            await fetch(
              `${API_URL}/api/student/courses/${courseId}/progress/${lessonId}`,
              {
                method: "PUT",

                headers: {
                  "Content-Type":
                    "application/json",

                  Accept:
                    "application/json",

                  ...getStudentAuthHeaders(),
                },

                body:
                  JSON.stringify({
                    watchedSeconds:
                      Math.floor(
                        watched
                      ),

                    durationSeconds:
                      Math.floor(
                        duration
                      ),

                    completed:
                      Boolean(
                        completed
                      ),
                  }),
              }
            );

          const data =
            await parseJson(
              response
            );

          if (
            response.status === 401
          ) {
            redirectToLogin();
            return;
          }

          if (!response.ok) {
            throw new Error(
              data?.message ||
                "Unable to save progress."
            );
          }

          if (
            data?.progress
          ) {
            setProgress(
              data.progress
            );
          } else {
            setProgress(
              (previous) => {
                const rows =
                  Array.isArray(
                    previous?.progress
                  )
                    ? previous.progress
                    : [];

                const savedRow = {
                  lesson:
                    lessonId,

                  watchedSeconds:
                    watched,

                  durationSeconds:
                    duration,

                  completed:
                    Boolean(
                      completed
                    ),

                  progressPercent:
                    duration > 0
                      ? Math.min(
                          100,
                          Math.round(
                            (watched /
                              duration) *
                              100
                          )
                        )
                      : completed
                      ? 100
                      : 0,
                };

                const filtered =
                  rows.filter(
                    (item) =>
                      getId(
                        item?.lesson
                      ) !== lessonId
                  );

                const nextRows = [
                  ...filtered,
                  savedRow,
                ];

                const total =
                  Math.max(
                    Number(
                      previous?.totalLessons
                    ) ||
                      lessons.length ||
                      0,
                    0
                  );

                const completedCount =
                  nextRows.filter(
                    (item) =>
                      Boolean(
                        item?.completed
                      )
                  ).length;

                return {
                  ...(previous || {}),

                  totalLessons:
                    total,

                  completedLessons:
                    completedCount,

                  overallProgress:
                    total > 0
                      ? Math.round(
                          (completedCount /
                            total) *
                            100
                        )
                      : 0,

                  lastWatchedLessonId:
                    lessonId,

                  progress:
                    nextRows,
                };
              }
            );
          }
        } catch (error) {
          console.error(
            "Save Progress Error:",
            error
          );
        } finally {
          if (
            !silent &&
            mountedRef.current
          ) {
            setLessonSaving(false);
          }
        }
      },
      [
        selectedLesson,
        courseId,
        lessons.length,
        redirectToLogin,
      ]
    );


  /* =======================================================
     RESTORE VIDEO POSITION
  ======================================================= */

  const handleVideoLoadedMetadata =
    () => {
      const video =
        videoRef.current;

      const lessonId =
        getId(selectedLesson);

      if (
        !video ||
        !lessonId
      ) {
        return;
      }

      if (
        resumeLessonRef.current ===
        lessonId
      ) {
        return;
      }

      const saved =
        progressByLesson.get(
          lessonId
        );

      const savedSeconds =
        Math.max(
          0,
          Number(
            saved?.watchedSeconds
          ) || 0
        );

      const duration =
        Number(
          video.duration
        ) || 0;

      if (
        savedSeconds > 0 &&
        duration > 0 &&
        savedSeconds <
          duration - 2
      ) {
        try {
          video.currentTime =
            Math.min(
              savedSeconds,
              duration - 1
            );
        } catch {
          // Browser may reject seeking before media is ready.
        }
      }

      resumeLessonRef.current =
        lessonId;
    };


  /* =======================================================
     VIDEO PROGRESS
  ======================================================= */

  const handleTimeUpdate =
    () => {
      const video =
        videoRef.current;

      if (!video) {
        return;
      }

      const now =
        Date.now();

      if (
        now -
          lastProgressSaveRef.current <
        5000
      ) {
        return;
      }

      if (
        progressTimerRef.current
      ) {
        return;
      }

      progressTimerRef.current =
        setTimeout(() => {
          progressTimerRef.current =
            null;

          lastProgressSaveRef.current =
            Date.now();

          saveProgress({
            watchedSeconds:
              video.currentTime,

            durationSeconds:
              video.duration,

            completed:
              false,

            silent:
              true,
          });
        }, 1000);
    };


  /* =======================================================
     VIDEO ENDED
  ======================================================= */

  const handleVideoEnded =
    async () => {
      const video =
        videoRef.current;

      await saveProgress({
        watchedSeconds:
          video?.duration || 0,

        durationSeconds:
          video?.duration || 0,

        completed:
          true,
      });
    };


  /* =======================================================
     MARK COMPLETE
  ======================================================= */

  const handleMarkComplete =
    async () => {
      const video =
        videoRef.current;

      await saveProgress({
        watchedSeconds:
          video?.currentTime || 0,

        durationSeconds:
          video?.duration || 0,

        completed:
          true,
      });
    };


  /* =======================================================
     SELECT LESSON
  ======================================================= */

  const selectLesson =
    async (lesson) => {
      const nextId =
        getId(lesson);

      const currentId =
        getId(selectedLesson);

      if (
        !nextId ||
        nextId === currentId
      ) {
        return;
      }

      try {
        setSwitchingLesson(true);

        const video =
          videoRef.current;

        if (
          video &&
          selectedLesson
        ) {
          await saveProgress({
            watchedSeconds:
              video.currentTime,

            durationSeconds:
              video.duration,

            completed:
              false,

            silent:
              true,
          });
        }

        if (
          mountedRef.current
        ) {
          setSelectedLesson(
            lesson
          );

          resumeLessonRef.current =
            "";

          setProtectedMediaUrl(
            ""
          );

          setMediaError("");

          window.scrollTo({
            top: 0,
            behavior: "smooth",
          });
        }
      } finally {
        if (
          mountedRef.current
        ) {
          setSwitchingLesson(
            false
          );
        }
      }
    };


  /* =======================================================
     NEXT / PREVIOUS
  ======================================================= */

  const handleNextLesson =
    async () => {
      if (
        currentLessonIndex <
          0 ||
        currentLessonIndex >=
          lessons.length - 1
      ) {
        return;
      }

      await selectLesson(
        lessons[
          currentLessonIndex + 1
        ]
      );
    };

  const handlePreviousLesson =
    async () => {
      if (
        currentLessonIndex <=
        0
      ) {
        return;
      }

      await selectLesson(
        lessons[
          currentLessonIndex - 1
        ]
      );
    };


  /* =======================================================
     OPEN MATERIAL
  ======================================================= */

  const handleOpenMaterial =
    async (material) => {
      const materialId =
        getId(material);

      const token =
        getStudentToken();

      if (
        !materialId ||
        !courseId ||
        !token
      ) {
        return;
      }

      try {
        setMaterialLoading(
          materialId
        );

        const response =
          await fetch(
            `${API_URL}/api/student/courses/${courseId}/media/material/${materialId}`,
            {
              method: "GET",

              headers: {
                Accept:
                  "application/json",

                ...getStudentAuthHeaders(),
              },
            }
          );

        const data =
          await parseJson(
            response
          );

        if (
          response.status === 401
        ) {
          redirectToLogin();
          return;
        }

        if (!response.ok) {
          throw new Error(
            data?.message ||
              "Unable to open this material."
          );
        }

        const url =
          data?.media?.url ||
          data?.url ||
          data?.mediaUrl ||
          "";

        if (!url) {
          throw new Error(
            "Study material URL was not returned."
          );
        }

        window.open(
          url,
          "_blank",
          "noopener,noreferrer"
        );
      } catch (error) {
        console.error(
          "Material Error:",
          error
        );

        setErrorMessage(
          error?.message ||
            "Unable to open study material."
        );
      } finally {
        if (
          mountedRef.current
        ) {
          setMaterialLoading("");
        }
      }
    };


  /* =======================================================
     CLEANUP SAVE
  ======================================================= */

  useEffect(() => {
    return () => {
      if (
        progressTimerRef.current
      ) {
        clearTimeout(
          progressTimerRef.current
        );
      }
    };
  }, []);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <LearningLoading />
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    errorMessage ||
    !course
  ) {
    return (
      <LearningError
        message={
          errorMessage ||
          "Course content unavailable."
        }
        onRetry={() =>
          loadLearning(true)
        }
      />
    );
  }


  /* =======================================================
     CURRENT LESSON
  ======================================================= */

  const currentProgress =
    selectedLesson
      ? progressByLesson.get(
          getId(selectedLesson)
        )
      : null;

  const currentPercent =
    clampPercent(
      Number(
        currentProgress?.progressPercent
      ) || 0
    );


  return (
    <main className="min-h-screen bg-[#f6f8fc]">

      {/* =================================================
          HEADER
      ================================================= */}

      <section className="bg-[#071b41] text-white">

        <div className="container-main py-6">

          <div className="flex flex-wrap items-center justify-between gap-4">

            <Link
              to="/student-dashboard"
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
            >
              <ArrowLeft
                size={15}
              />

              Dashboard
            </Link>


            <button
              type="button"
              onClick={() =>
                loadLearning(true)
              }
              disabled={
                refreshing
              }
              className="inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white disabled:opacity-50"
            >
              <RefreshCw
                size={15}
                className={
                  refreshing
                    ? "animate-spin"
                    : ""
                }
              />

              Refresh
            </button>

          </div>


          <div className="mt-7 max-w-4xl">

            <div className="flex flex-wrap items-center gap-2">

              <span className="rounded-full bg-green-500/15 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-green-300">
                Purchased Course
              </span>

              {purchase?.status && (
                <span className="rounded-full bg-white/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-slate-300">
                  {purchase.status}
                </span>
              )}

            </div>


            <h1 className="mt-4 text-3xl font-black tracking-tight sm:text-4xl">
              {course.title}
            </h1>


            {course.description && (
              <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-400">
                {course.description}
              </p>
            )}


            {/* PROGRESS */}

            <div className="mt-7 max-w-2xl">

              <div className="flex items-center justify-between text-xs font-bold">

                <span className="text-slate-400">
                  Overall Progress
                </span>

                <span className="text-yellow-400">
                  {overallProgress}%
                </span>

              </div>


              <div className="mt-2 h-2 overflow-hidden rounded-full bg-white/10">

                <div
                  className="h-full rounded-full bg-yellow-400 transition-all duration-500"
                  style={{
                    width:
                      `${overallProgress}%`,
                  }}
                />

              </div>


              <p className="mt-2 text-[10px] font-semibold text-slate-500">
                {completedLessons} of{" "}
                {totalLessons} lessons completed
              </p>

            </div>

          </div>

        </div>

      </section>


      {/* =================================================
          MAIN
      ================================================= */}

      <section className="container-main py-8 lg:py-10">

        <div className="grid gap-7 lg:grid-cols-[minmax(0,1fr)_340px]">

          {/* =================================================
              VIDEO AREA
          ================================================= */}

          <div className="min-w-0">

            <div className="overflow-hidden rounded-3xl border border-slate-200 bg-[#06152f] shadow-xl">

              <div className="relative aspect-video">

                {mediaLoading ? (
                  <div className="flex h-full flex-col items-center justify-center text-white">

                    <Loader2
                      size={32}
                      className="animate-spin text-yellow-400"
                    />

                    <p className="mt-4 text-sm font-bold text-slate-400">
                      Loading protected video...
                    </p>

                  </div>
                ) : mediaError ? (
                  <div className="flex h-full flex-col items-center justify-center px-6 text-center text-white">

                    <LockKeyhole
                      size={38}
                      className="text-red-400"
                    />

                    <h2 className="mt-4 text-lg font-black">
                      Video unavailable
                    </h2>

                    <p className="mt-2 max-w-md text-sm leading-6 text-slate-400">
                      {mediaError}
                    </p>

                    <button
                      type="button"
                      onClick={
                        loadProtectedVideo
                      }
                      className="mt-5 inline-flex items-center gap-2 rounded-xl bg-white px-4 py-2.5 text-xs font-black text-[#071b41]"
                    >
                      <RefreshCw
                        size={15}
                      />
                      Try Again
                    </button>

                  </div>
                ) : protectedMediaUrl ? (
                  <video
                    ref={videoRef}
                    key={
                      getId(
                        selectedLesson
                      )
                    }
                    src={
                      protectedMediaUrl
                    }
                    controls
                    playsInline
                    preload="metadata"
                    onLoadedMetadata={
                      handleVideoLoadedMetadata
                    }
                    onTimeUpdate={
                      handleTimeUpdate
                    }
                    onEnded={
                      handleVideoEnded
                    }
                    className="h-full w-full bg-black object-contain"
                  />
                ) : (
                  <div className="flex h-full flex-col items-center justify-center text-white">

                    <PlayCircle
                      size={44}
                      className="text-yellow-400"
                    />

                    <p className="mt-4 text-sm font-bold text-slate-400">
                      Select a lesson to start learning
                    </p>

                  </div>
                )}

              </div>

            </div>


            {/* =================================================
                CURRENT LESSON
            ================================================= */}

            <div className="mt-5 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm sm:p-6">

              <div className="flex flex-col gap-5">

                <div>

                  <div className="flex flex-wrap items-center gap-2">

                    <span className="rounded-full bg-blue-50 px-3 py-1.5 text-[10px] font-black uppercase tracking-wider text-blue-700">
                      Lesson{" "}
                      {currentLessonIndex >=
                      0
                        ? currentLessonIndex +
                          1
                        : 0}
                    </span>


                    {currentProgress?.completed && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-green-50 px-3 py-1.5 text-[10px] font-black text-green-700">
                        <Check
                          size={12}
                        />
                        Completed
                      </span>
                    )}

                  </div>


                  <h2 className="mt-3 text-xl font-black text-[#071b41] sm:text-2xl">
                    {selectedLesson?.title ||
                      "Select a lesson"}
                  </h2>


                  {selectedLesson?.description && (
                    <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                      {
                        selectedLesson.description
                      }
                    </p>
                  )}


                  {currentPercent > 0 && (
                    <p className="mt-2 text-[10px] font-bold text-blue-600">
                      Video resume position:
                      {" "}
                      {currentPercent}%
                    </p>
                  )}

                </div>


                <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-100 pt-4">

                  <div className="text-xs font-bold text-slate-400">

                    {currentLessonIndex >=
                      0 &&
                      `${currentLessonIndex + 1} / ${lessons.length}`}

                  </div>


                  <div className="flex flex-wrap gap-2">

                    <button
                      type="button"
                      onClick={
                        handlePreviousLesson
                      }
                      disabled={
                        switchingLesson ||
                        currentLessonIndex <=
                          0
                      }
                      className="inline-flex items-center gap-2 rounded-xl border border-slate-200 px-3.5 py-3 text-xs font-black text-slate-600 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      <ArrowLeft
                        size={15}
                      />
                      Previous
                    </button>


                    <button
                      type="button"
                      onClick={
                        handleMarkComplete
                      }
                      disabled={
                        lessonSaving ||
                        !selectedLesson
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-green-600 px-4 py-3 text-xs font-black text-white transition hover:bg-green-700 disabled:cursor-not-allowed disabled:opacity-50"
                    >
                      {lessonSaving ? (
                        <Loader2
                          size={15}
                          className="animate-spin"
                        />
                      ) : (
                        <CheckCircle2
                          size={15}
                        />
                      )}

                      Mark Complete
                    </button>


                    <button
                      type="button"
                      onClick={
                        handleNextLesson
                      }
                      disabled={
                        switchingLesson ||
                        currentLessonIndex <
                          0 ||
                        currentLessonIndex >=
                          lessons.length -
                            1
                      }
                      className="inline-flex items-center gap-2 rounded-xl bg-red-700 px-3.5 py-3 text-xs font-black text-white transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-40"
                    >
                      Next
                      <ArrowRight
                        size={15}
                      />
                    </button>

                  </div>

                </div>

              </div>

            </div>


            {/* =================================================
                TABS
            ================================================= */}

            <div className="mt-6 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

              <div className="flex border-b border-slate-100">

                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "videos"
                    )
                  }
                  className={`flex-1 px-4 py-4 text-xs font-black transition ${
                    activeTab ===
                    "videos"
                      ? "border-b-2 border-red-700 text-red-700"
                      : "text-slate-500 hover:text-[#071b41]"
                  }`}
                >
                  Videos
                </button>


                <button
                  type="button"
                  onClick={() =>
                    setActiveTab(
                      "materials"
                    )
                  }
                  className={`flex-1 px-4 py-4 text-xs font-black transition ${
                    activeTab ===
                    "materials"
                      ? "border-b-2 border-red-700 text-red-700"
                      : "text-slate-500 hover:text-[#071b41]"
                  }`}
                >
                  Notes & PDFs
                </button>

              </div>


              {activeTab ===
              "videos" ? (
                <div className="p-4 sm:p-5">

                  <button
                    type="button"
                    onClick={() =>
                      setOpenChapter(
                        (value) =>
                          !value
                      )
                    }
                    className="flex w-full items-center justify-between rounded-2xl bg-slate-50 p-4 text-left"
                  >

                    <div className="flex items-center gap-3">

                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#071b41] text-yellow-400">
                        <BookOpen
                          size={18}
                        />
                      </div>

                      <div>

                        <p className="text-sm font-black text-[#071b41]">
                          Course Lessons
                        </p>

                        <p className="mt-0.5 text-[10px] font-bold text-slate-400">
                          {lessons.length} recorded lessons
                        </p>

                      </div>

                    </div>


                    <ChevronDown
                      size={18}
                      className={
                        openChapter
                          ? "rotate-180 transition"
                          : "transition"
                      }
                    />

                  </button>


                  {openChapter && (
                    <div className="mt-3 space-y-2">

                      {lessons.length ===
                      0 ? (
                        <EmptyState
                          icon={
                            <PlayCircle
                              size={25}
                            />
                          }
                          title="No lessons available"
                          description="Recorded lessons अभी admin द्वारा add नहीं किए गए हैं।"
                        />
                      ) : (
                        lessons.map(
                          (
                            lesson,
                            index
                          ) => {
                            const id =
                              getId(
                                lesson
                              );

                            const itemProgress =
                              progressByLesson.get(
                                id
                              );

                            const percent =
                              clampPercent(
                                Number(
                                  itemProgress?.progressPercent
                                ) || 0
                              );

                            const selected =
                              getId(
                                selectedLesson
                              ) === id;

                            return (
                              <button
                                type="button"
                                key={
                                  id ||
                                  index
                                }
                                onClick={() =>
                                  selectLesson(
                                    lesson
                                  )
                                }
                                className={`w-full rounded-2xl border p-4 text-left transition ${
                                  selected
                                    ? "border-red-200 bg-red-50"
                                    : "border-slate-100 bg-white hover:border-slate-200 hover:bg-slate-50"
                                }`}
                              >

                                <div className="flex items-start gap-3">

                                  <div
                                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${
                                      itemProgress?.completed
                                        ? "bg-green-100 text-green-700"
                                        : selected
                                        ? "bg-red-700 text-white"
                                        : "bg-slate-100 text-slate-500"
                                    }`}
                                  >

                                    {itemProgress?.completed ? (
                                      <Check
                                        size={17}
                                      />
                                    ) : (
                                      <PlayCircle
                                        size={18}
                                      />
                                    )}

                                  </div>


                                  <div className="min-w-0 flex-1">

                                    <div className="flex items-start justify-between gap-3">

                                      <p className="text-sm font-black text-[#071b41]">
                                        {index +
                                          1}
                                        .{" "}
                                        {lesson.title ||
                                          "Untitled Lesson"}
                                      </p>


                                      {itemProgress?.completed && (
                                        <CheckCircle2
                                          size={17}
                                          className="shrink-0 text-green-600"
                                        />
                                      )}

                                    </div>


                                    <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-slate-100">

                                      <div
                                        className="h-full rounded-full bg-red-600 transition-all"
                                        style={{
                                          width:
                                            `${percent}%`,
                                        }}
                                      />

                                    </div>


                                    <div className="mt-2 flex items-center justify-between text-[10px] font-bold text-slate-400">

                                      <span>
                                        {percent}% watched
                                      </span>

                                      {lesson.duration && (
                                        <span>
                                          {lesson.duration}
                                        </span>
                                      )}

                                    </div>

                                  </div>

                                </div>

                              </button>
                            );
                          }
                        )
                      )}

                    </div>
                  )}

                </div>
              ) : (
                <MaterialsList
                  materials={
                    materials
                  }
                  materialLoading={
                    materialLoading
                  }
                  onOpen={
                    handleOpenMaterial
                  }
                />
              )}

            </div>

          </div>


          {/* =================================================
              SIDEBAR
          ================================================= */}

          <aside>

            <div className="space-y-5 lg:sticky lg:top-24">

              {/* COURSE STATS */}

              <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm">

                <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
                  Your Learning
                </p>


                <h3 className="mt-2 text-xl font-black text-[#071b41]">
                  Course Overview
                </h3>


                <div className="mt-5 space-y-3">

                  <StatRow
                    icon={
                      <PlayCircle
                        size={17}
                      />
                    }
                    label="Recorded Lessons"
                    value={
                      lessons.length
                    }
                  />


                  <StatRow
                    icon={
                      <CheckCircle2
                        size={17}
                      />
                    }
                    label="Completed"
                    value={
                      completedLessons
                    }
                  />


                  <StatRow
                    icon={
                      <FileText
                        size={17}
                      />
                    }
                    label="Notes / PDFs"
                    value={
                      materials.length
                    }
                  />


                  <StatRow
                    icon={
                      <Clock3
                        size={17}
                      />
                    }
                    label="Progress"
                    value={`${overallProgress}%`}
                  />

                </div>

              </div>


              {/* SECURITY */}

              <div className="rounded-3xl border border-green-200 bg-green-50 p-5">

                <div className="flex items-start gap-3">

                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
                    <ShieldCheck
                      size={19}
                    />
                  </div>


                  <div>

                    <h3 className="text-sm font-black text-green-950">
                      Protected Learning
                    </h3>

                    <p className="mt-1 text-xs leading-5 text-green-800">
                      आपके purchased course का content केवल authorized student account में available है।
                    </p>

                  </div>

                </div>

              </div>


              {/* SCOPE */}

              <div className="rounded-3xl border border-slate-200 bg-[#071b41] p-5 text-white">

                <div className="flex items-center gap-3">

                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-yellow-400">
                    <BookOpen
                      size={19}
                    />
                  </div>


                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                      Learning Mode
                    </p>

                    <p className="mt-1 text-sm font-black">
                      Recorded Course
                    </p>

                  </div>

                </div>


                <div className="mt-5 space-y-2.5">

                  <ScopeItem text="Recorded Video Classes" />
                  <ScopeItem text="Notes & PDFs" />
                  <ScopeItem text="Self-paced Learning" />
                  <ScopeItem text="Progress Tracking" />

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>

    </main>
  );
}


/* =========================================================
   MATERIALS LIST
========================================================= */

function MaterialsList({
  materials,
  materialLoading,
  onOpen,
}) {
  if (!materials.length) {
    return (
      <div className="p-5">
        <EmptyState
          icon={
            <FileText
              size={25}
            />
          }
          title="No notes or PDFs available"
          description="इस course के study materials अभी available नहीं हैं।"
        />
      </div>
    );
  }

  return (
    <div className="space-y-2 p-4 sm:p-5">

      {materials.map(
        (
          material,
          index
        ) => {
          const id =
            getId(
              material
            );

          const title =
            material.title ||
            material.name ||
            `Study Material ${index + 1}`;

          const type =
            material.type ||
            material.format ||
            "PDF";

          const loading =
            materialLoading ===
            id;

          return (
            <div
              key={
                id ||
                index
              }
              className="flex items-center gap-3 rounded-2xl border border-slate-100 bg-white p-4 transition hover:border-slate-200 hover:bg-slate-50"
            >

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-orange-50 text-orange-700">
                <FileText
                  size={20}
                />
              </div>


              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-black text-[#071b41]">
                  {title}
                </p>

                <p className="mt-1 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {type}
                </p>

              </div>


              <button
                type="button"
                onClick={() =>
                  onOpen(
                    material
                  )
                }
                disabled={
                  loading
                }
                className="inline-flex shrink-0 items-center gap-2 rounded-xl bg-[#071b41] px-3.5 py-2.5 text-xs font-black text-white transition hover:bg-[#0b275d] disabled:opacity-50"
              >

                {loading ? (
                  <Loader2
                    size={15}
                    className="animate-spin"
                  />
                ) : (
                  <Download
                    size={15}
                  />
                )}

                Open

              </button>

            </div>
          );
        }
      )}

    </div>
  );
}


/* =========================================================
   STAT ROW
========================================================= */

function StatRow({
  icon,
  label,
  value,
}) {
  return (
    <div className="flex items-center justify-between rounded-2xl bg-slate-50 p-3">

      <div className="flex min-w-0 items-center gap-3">

        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-red-700 shadow-sm">
          {icon}
        </div>

        <span className="truncate text-xs font-bold text-slate-600">
          {label}
        </span>

      </div>


      <span className="ml-3 text-sm font-black text-[#071b41]">
        {value}
      </span>

    </div>
  );
}


/* =========================================================
   SCOPE ITEM
========================================================= */

function ScopeItem({
  text,
}) {
  return (
    <div className="flex items-center gap-2.5">

      <div className="flex h-5 w-5 items-center justify-center rounded-full bg-green-500/15 text-green-300">
        <Check
          size={12}
        />
      </div>

      <span className="text-xs font-bold text-slate-300">
        {text}
      </span>

    </div>
  );
}


/* =========================================================
   EMPTY STATE
========================================================= */

function EmptyState({
  icon,
  title,
  description,
}) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-200 bg-slate-50 p-8 text-center">

      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-white text-slate-400 shadow-sm">
        {icon}
      </div>


      <h3 className="mt-4 text-sm font-black text-[#071b41]">
        {title}
      </h3>


      <p className="mx-auto mt-2 max-w-md text-xs leading-5 text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function LearningLoading() {
  return (
    <main className="min-h-screen bg-slate-50">

      <div className="h-72 animate-pulse bg-[#071b41]" />

      <div className="container-main -mt-12 pb-16">

        <div className="grid gap-6 lg:grid-cols-[1fr_340px]">

          <div className="space-y-5">

            <div className="aspect-video animate-pulse rounded-3xl bg-slate-800" />

            <div className="h-40 animate-pulse rounded-3xl bg-white" />

            <div className="h-72 animate-pulse rounded-3xl bg-white" />

          </div>


          <div className="space-y-5">

            <div className="h-64 animate-pulse rounded-3xl bg-white" />

            <div className="h-48 animate-pulse rounded-3xl bg-white" />

          </div>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   ERROR
========================================================= */

function LearningError({
  message,
  onRetry,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">
          <LockKeyhole
            size={28}
          />
        </div>


        <h1 className="mt-5 text-2xl font-black text-[#071b41]">
          Learning Area unavailable
        </h1>


        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message}
        </p>


        <div className="mt-6 flex flex-wrap justify-center gap-3">

          <button
            type="button"
            onClick={
              onRetry
            }
            className="inline-flex items-center gap-2 rounded-xl bg-[#071b41] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b275d]"
          >
            <RefreshCw
              size={16}
            />
            Try Again
          </button>


          <Link
            to="/student-dashboard"
            className="inline-flex items-center gap-2 rounded-xl border-2 border-[#071b41] px-5 py-3 text-sm font-black text-[#071b41] transition hover:bg-[#071b41] hover:text-white"
          >
            Dashboard
          </Link>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   HELPERS
========================================================= */

function getId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  if (
    typeof value ===
    "string" ||
    typeof value ===
    "number"
  ) {
    return normalizeId(
      value
    );
  }

  if (
    typeof value ===
    "object"
  ) {
    if (
      value._id !==
      undefined
    ) {
      return normalizeId(
        value._id
      );
    }

    if (
      value.id !==
      undefined
    ) {
      return normalizeId(
        value.id
      );
    }

    if (
      value.$oid !==
      undefined
    ) {
      return normalizeId(
        value.$oid
      );
    }
  }

  return "";
}


function normalizeId(value) {
  if (
    value === null ||
    value === undefined
  ) {
    return "";
  }

  return String(
    value
  ).trim();
}


function clampPercent(value) {
  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    )
  ) {
    return 0;
  }

  return Math.min(
    100,
    Math.max(
      0,
      number
    )
  );
}


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