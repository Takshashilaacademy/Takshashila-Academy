import {
  useCallback,
  useEffect,
  useMemo,
  useState,
} from "react";

import {
  ArrowLeft,
  CheckCircle2,
  FileText,
  Loader2,
  PlayCircle,
  RefreshCw,
  ShieldCheck,
  Trash2,
  Upload,
  Video,
  AlertTriangle,
  BookOpen,
  Eye,
  EyeOff,
  Clock3,
  HardDrive,
} from "lucide-react";

import {
  useNavigate,
  useParams,
} from "react-router-dom";

import { API_URL } from "../config/api.js";

import CloudinaryVideoUploader from "../components/admin/CloudinaryVideoUploader.jsx";

import CloudinaryDocumentUploader from "../components/admin/CloudinaryDocumentUploader.jsx";

/* =========================================================
   ADMIN TOKEN
========================================================= */

const getAdminToken = () => {
  try {
    return (
      localStorage.getItem(
        "takshashila_admin_token"
      ) || ""
    );
  } catch {
    return "";
  }
};

/* =========================================================
   ADMIN API REQUEST
========================================================= */

const adminRequest = async (
  endpoint,
  options = {}
) => {
  const token = getAdminToken();

  if (!token) {
    throw new Error(
      "Admin authentication required."
    );
  }

  const headers = {
    Accept: "application/json",
    ...(options.body
      ? {
          "Content-Type":
            "application/json",
        }
      : {}),
    ...(options.headers || {}),
    Authorization:
      `Bearer ${token}`,
  };

  let response;

  try {
    response = await fetch(
      `${API_URL}${endpoint}`,
      {
        ...options,
        headers,
      }
    );
  } catch (error) {
    throw new Error(
      "Server से connection नहीं हो पाया. Please check your backend server."
    );
  }

  let data = {};

  try {
    const text =
      await response.text();

    if (text) {
      try {
        data = JSON.parse(text);
      } catch {
        data = {
          message: text,
        };
      }
    }
  } catch {
    data = {};
  }

  if (!response.ok) {
    if (
      response.status === 401 ||
      response.status === 403
    ) {
      throw new Error(
        data?.message ||
          "Admin authentication expired. Please login again."
      );
    }

    throw new Error(
      data?.message ||
        data?.error ||
        "Request failed. Please try again."
    );
  }

  return data;
};

/* =========================================================
   NORMALIZE MATERIAL TYPE
========================================================= */

const normalizeMaterialFileType = (
  value
) => {
  const type = String(
    value || ""
  )
    .trim()
    .toLowerCase();

  if (
    type === "pdf" ||
    type === "application/pdf"
  ) {
    return "pdf";
  }

  if (
    type === "txt" ||
    type === "text/plain" ||
    type === "note"
  ) {
    return "note";
  }

  if (
    type === "doc" ||
    type === "docx" ||
    type === "document" ||
    type ===
      "application/msword" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }

  return "document";
};

/* =========================================================
   FORMAT BYTES
========================================================= */

const formatBytes = (
  bytes
) => {
  const value = Number(bytes);

  if (
    !Number.isFinite(value) ||
    value <= 0
  ) {
    return "";
  }

  if (
    value >=
    1024 * 1024 * 1024
  ) {
    return `${(
      value /
      (1024 * 1024 * 1024)
    ).toFixed(2)} GB`;
  }

  if (
    value >=
    1024 * 1024
  ) {
    return `${(
      value /
      (1024 * 1024)
    ).toFixed(2)} MB`;
  }

  if (
    value >= 1024
  ) {
    return `${(
      value / 1024
    ).toFixed(2)} KB`;
  }

  return `${value} B`;
};

/* =========================================================
   SAFE ARRAY
========================================================= */

const safeArray = (
  value
) => {
  return Array.isArray(value)
    ? value
    : [];
};

/* =========================================================
   PAGE
========================================================= */

export default function AdminCourseContent() {
  const navigate =
    useNavigate();

  const { courseId } =
    useParams();

  /* =======================================================
     COURSE
  ======================================================= */

  const [
    course,
    setCourse,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    refreshing,
    setRefreshing,
  ] = useState(false);

  const [
    error,
    setError,
  ] = useState("");

  /* =======================================================
     ACTION STATES
  ======================================================= */

  const [
    videoLoading,
    setVideoLoading,
  ] = useState(false);

  const [
    materialLoading,
    setMaterialLoading,
  ] = useState(false);

  const [
    deleteLoading,
    setDeleteLoading,
  ] = useState("");

  /* =======================================================
     UPLOADER RESET KEYS
  ======================================================= */

  const [
    videoUploaderKey,
    setVideoUploaderKey,
  ] = useState(0);

  const [
    materialUploaderKey,
    setMaterialUploaderKey,
  ] = useState(0);

  /* =======================================================
     VIDEO FORM
  ======================================================= */

  const [
    videoForm,
    setVideoForm,
  ] = useState({
    title: "",
    description: "",
    videoUrl: "",
    videoPublicId: "",
    duration: "",
    isPreview: false,
    isPublished: true,
  });

  /* =======================================================
     MATERIAL FORM
  ======================================================= */

  const [
    materialForm,
    setMaterialForm,
  ] = useState({
    title: "",
    description: "",
    fileUrl: "",
    filePublicId: "",
    fileType: "pdf",
    fileSize: "",
    isPublished: true,
  });

  /* =======================================================
     LOAD COURSE
  ======================================================= */

  const loadCourse =
    useCallback(
      async (
        showFullLoader = false
      ) => {
        if (!courseId) {
          setError(
            "Course ID is missing."
          );
          setLoading(false);
          return;
        }

        try {
          if (
            showFullLoader
          ) {
            setLoading(true);
          } else {
            setRefreshing(true);
          }

          setError("");

          const data =
            await adminRequest(
              `/api/admin/courses/${courseId}`
            );

          const loadedCourse =
            data?.course;

          if (
            !loadedCourse ||
            typeof loadedCourse !==
              "object"
          ) {
            throw new Error(
              "Course data could not be loaded."
            );
          }

          setCourse(
            loadedCourse
          );
        } catch (err) {
          console.error(
            "Admin Course Load Error:",
            err
          );

          setError(
            err?.message ||
              "Unable to load course."
          );
        } finally {
          setLoading(false);
          setRefreshing(false);
        }
      },
      [courseId]
    );

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadCourse(true);
  }, [loadCourse]);

  /* =======================================================
     VIDEO FORM CHANGE
  ======================================================= */

  const handleVideoChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setVideoForm(
        (previous) => ({
          ...previous,
          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };

  /* =======================================================
     MATERIAL FORM CHANGE
  ======================================================= */

  const handleMaterialChange =
    (event) => {
      const {
        name,
        value,
        type,
        checked,
      } = event.target;

      setMaterialForm(
        (previous) => ({
          ...previous,
          [name]:
            type ===
            "checkbox"
              ? checked
              : value,
        })
      );
    };

  /* =======================================================
     VIDEO UPLOAD COMPLETE
  ======================================================= */

  const handleVideoUploadComplete =
    (uploadedVideo) => {
      if (
        !uploadedVideo?.url ||
        !uploadedVideo?.publicId
      ) {
        window.alert(
          "Video upload complete hua, lekin Cloudinary information incomplete hai."
        );
        return;
      }

      setVideoForm(
        (previous) => ({
          ...previous,

          videoUrl:
            uploadedVideo.url,

          videoPublicId:
            uploadedVideo.publicId,

          duration:
            uploadedVideo.duration
              ? `${Math.round(
                  Number(
                    uploadedVideo.duration
                  )
                )} sec`
              : previous.duration,
        })
      );
    };

  /* =======================================================
     MATERIAL UPLOAD COMPLETE
  ======================================================= */

  const handleMaterialUploadComplete =
    (uploadedFile) => {
      if (
        !uploadedFile?.url ||
        !uploadedFile?.publicId
      ) {
        window.alert(
          "Document upload complete hua, lekin Cloudinary information incomplete hai."
        );
        return;
      }

      setMaterialForm(
        (previous) => ({
          ...previous,

          fileUrl:
            uploadedFile.url,

          filePublicId:
            uploadedFile.publicId,

          fileType:
            normalizeMaterialFileType(
              uploadedFile.fileType ||
                uploadedFile.format
            ),

          fileSize:
            formatBytes(
              uploadedFile.bytes
            ) ||
            previous.fileSize,
        })
      );
    };

  /* =======================================================
     RESET VIDEO FORM
  ======================================================= */

  const resetVideoForm =
    () => {
      setVideoForm({
        title: "",
        description: "",
        videoUrl: "",
        videoPublicId: "",
        duration: "",
        isPreview: false,
        isPublished: true,
      });

      setVideoUploaderKey(
        (previous) =>
          previous + 1
      );
    };

  /* =======================================================
     RESET MATERIAL FORM
  ======================================================= */

  const resetMaterialForm =
    () => {
      setMaterialForm({
        title: "",
        description: "",
        fileUrl: "",
        filePublicId: "",
        fileType: "pdf",
        fileSize: "",
        isPublished: true,
      });

      setMaterialUploaderKey(
        (previous) =>
          previous + 1
      );
    };

  /* =======================================================
     ADD VIDEO
  ======================================================= */

  const handleAddVideo =
    async (event) => {
      event.preventDefault();

      if (videoLoading) {
        return;
      }

      const title =
        videoForm.title.trim();

      const description =
        videoForm.description.trim();

      const videoUrl =
        videoForm.videoUrl.trim();

      const videoPublicId =
        videoForm.videoPublicId.trim();

      const duration =
        videoForm.duration.trim();

      if (!title) {
        window.alert(
          "Video title is required."
        );
        return;
      }

      if (title.length > 200) {
        window.alert(
          "Video title 200 characters से ज्यादा नहीं हो सकता."
        );
        return;
      }

      if (description.length > 2000) {
        window.alert(
          "Video description बहुत लंबा है."
        );
        return;
      }

      if (!videoUrl) {
        window.alert(
          "Please upload a video to Cloudinary first."
        );
        return;
      }

      if (!videoPublicId) {
        window.alert(
          "Cloudinary video public ID missing hai."
        );
        return;
      }

      try {
        setVideoLoading(
          true
        );

        await adminRequest(
          `/api/admin/content/courses/${courseId}/videos`,
          {
            method: "POST",

            body: JSON.stringify({
              title,
              description,
              videoUrl,
              videoPublicId,
              duration,
              isPreview:
                Boolean(
                  videoForm.isPreview
                ),
              isPublished:
                Boolean(
                  videoForm.isPublished
                ),
            }),
          }
        );

        window.alert(
          "Video lesson successfully add ho gaya."
        );

        resetVideoForm();

        await loadCourse();
      } catch (err) {
        console.error(
          "Add Video Error:",
          err
        );

        window.alert(
          err?.message ||
            "Unable to add video."
        );
      } finally {
        setVideoLoading(
          false
        );
      }
    };

  /* =======================================================
     ADD MATERIAL
  ======================================================= */

  const handleAddMaterial =
    async (event) => {
      event.preventDefault();

      if (
        materialLoading
      ) {
        return;
      }

      const title =
        materialForm.title.trim();

      const description =
        materialForm.description.trim();

      const fileUrl =
        materialForm.fileUrl.trim();

      const filePublicId =
        materialForm.filePublicId.trim();

      const fileSize =
        materialForm.fileSize.trim();

      if (!title) {
        window.alert(
          "Material title is required."
        );
        return;
      }

      if (title.length > 200) {
        window.alert(
          "Material title 200 characters से ज्यादा नहीं हो सकता."
        );
        return;
      }

      if (description.length > 2000) {
        window.alert(
          "Material description बहुत लंबा है."
        );
        return;
      }

      if (!fileUrl) {
        window.alert(
          "Please upload the study material first."
        );
        return;
      }

      if (!filePublicId) {
        window.alert(
          "Cloudinary material public ID missing hai."
        );
        return;
      }

      try {
        setMaterialLoading(
          true
        );

        await adminRequest(
          `/api/admin/content/courses/${courseId}/materials`,
          {
            method: "POST",

            body: JSON.stringify({
              title,
              description,
              fileUrl,
              filePublicId,
              fileType:
                normalizeMaterialFileType(
                  materialForm.fileType
                ),
              fileSize,
              isPublished:
                Boolean(
                  materialForm.isPublished
                ),
            }),
          }
        );

        window.alert(
          "Study material successfully add ho gaya."
        );

        resetMaterialForm();

        await loadCourse();
      } catch (err) {
        console.error(
          "Add Material Error:",
          err
        );

        window.alert(
          err?.message ||
            "Unable to add study material."
        );
      } finally {
        setMaterialLoading(
          false
        );
      }
    };

  /* =======================================================
     DELETE VIDEO
  ======================================================= */

  const handleDeleteVideo =
    async (
      videoId
    ) => {
      if (
        !videoId ||
        deleteLoading
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Video permanently delete karna hai?\n\nYe action database se video lesson remove karega."
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleteLoading(
          `video-${videoId}`
        );

        await adminRequest(
          `/api/admin/content/courses/${courseId}/videos/${videoId}`,
          {
            method: "DELETE",
          }
        );

        await loadCourse();

        window.alert(
          "Video successfully delete ho gaya."
        );
      } catch (err) {
        console.error(
          "Delete Video Error:",
          err
        );

        window.alert(
          err?.message ||
            "Unable to delete video."
        );
      } finally {
        setDeleteLoading(
          ""
        );
      }
    };

  /* =======================================================
     DELETE MATERIAL
  ======================================================= */

  const handleDeleteMaterial =
    async (
      materialId
    ) => {
      if (
        !materialId ||
        deleteLoading
      ) {
        return;
      }

      const confirmed =
        window.confirm(
          "Study material permanently delete karna hai?\n\nYe action database se material remove karega."
        );

      if (!confirmed) {
        return;
      }

      try {
        setDeleteLoading(
          `material-${materialId}`
        );

        await adminRequest(
          `/api/admin/content/courses/${courseId}/materials/${materialId}`,
          {
            method: "DELETE",
          }
        );

        await loadCourse();

        window.alert(
          "Study material successfully delete ho gaya."
        );
      } catch (err) {
        console.error(
          "Delete Material Error:",
          err
        );

        window.alert(
          err?.message ||
            "Unable to delete study material."
        );
      } finally {
        setDeleteLoading(
          ""
        );
      }
    };

  /* =======================================================
     COURSE DATA
  ======================================================= */

  const lessons = useMemo(
    () =>
      safeArray(
        course?.lessons
      ),
    [course]
  );

  const materials = useMemo(
    () =>
      safeArray(
        course?.materials
      ),
    [course]
  );

  const publishedVideos =
    useMemo(
      () =>
        lessons.filter(
          (item) =>
            item?.isPublished !==
            false
        ).length,
      [lessons]
    );

  const previewVideos =
    useMemo(
      () =>
        lessons.filter(
          (item) =>
            item?.isPreview ===
            true
        ).length,
      [lessons]
    );

  const publishedMaterials =
    useMemo(
      () =>
        materials.filter(
          (item) =>
            item?.isPublished !==
            false
        ).length,
      [materials]
    );

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <main className="min-h-screen bg-slate-50">
        <div className="flex min-h-screen items-center justify-center px-5">
          <div className="flex w-full max-w-md items-center gap-4 rounded-3xl border border-slate-200 bg-white p-6 shadow-xl">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071b41] text-white">
              <Loader2
                size={23}
                className="animate-spin"
              />
            </div>

            <div>
              <p className="font-black text-[#071b41]">
                Course content loading...
              </p>

              <p className="mt-1 text-xs text-slate-500">
                Admin course data fetch ho raha hai.
              </p>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     ERROR
  ======================================================= */

  if (
    error ||
    !course
  ) {
    return (
      <main className="min-h-screen bg-slate-50 px-5 py-12">
        <div className="mx-auto max-w-xl">
          <div className="overflow-hidden rounded-3xl border border-red-200 bg-white shadow-xl">
            <div className="bg-[#071b41] p-7 text-white">
              <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-500/20 text-red-300">
                <AlertTriangle
                  size={24}
                />
              </div>

              <h1 className="mt-5 text-2xl font-black">
                Unable to load course
              </h1>

              <p className="mt-2 text-sm leading-6 text-slate-300">
                Admin course content page course data load nahi kar pa raha hai.
              </p>
            </div>

            <div className="p-7">
              <div className="rounded-2xl border border-red-200 bg-red-50 p-4">
                <p className="text-sm font-bold leading-6 text-red-700">
                  {error ||
                    "Course not found."}
                </p>
              </div>

              <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={() =>
                    loadCourse(
                      true
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#071b41] px-5 py-3.5 text-sm font-black text-white transition hover:bg-[#0b275d]"
                >
                  <RefreshCw
                    size={17}
                  />
                  Try Again
                </button>

                <button
                  type="button"
                  onClick={() =>
                    navigate(
                      "/admin/dashboard"
                    )
                  }
                  className="inline-flex flex-1 items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50"
                >
                  <ArrowLeft
                    size={17}
                  />
                  Dashboard
                </button>
              </div>
            </div>
          </div>
        </div>
      </main>
    );
  }

  /* =======================================================
     PAGE
  ======================================================= */

  return (
    <main className="min-h-screen bg-slate-50">
      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="relative overflow-hidden bg-[#071b41] text-white">
        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-1/3 h-80 w-80 rounded-full bg-red-500/10 blur-3xl" />

        <div className="container-main relative py-7 sm:py-9">
          <button
            type="button"
            onClick={() =>
              navigate(
                "/admin/dashboard"
              )
            }
            className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-sm font-bold text-slate-300 transition hover:bg-white/5 hover:text-white"
          >
            <ArrowLeft
              size={17}
            />
            Back to Dashboard
          </button>

          <div className="mt-7 flex flex-col gap-7 lg:flex-row lg:items-end lg:justify-between">
            <div className="min-w-0">
              <div className="inline-flex items-center gap-2 rounded-full border border-yellow-400/20 bg-yellow-400/10 px-3 py-1.5 text-[10px] font-black uppercase tracking-widest text-yellow-300">
                <ShieldCheck
                  size={14}
                />
                Admin Content Manager
              </div>

              <h1 className="mt-4 break-words text-3xl font-black tracking-tight sm:text-4xl">
                {course.title}
              </h1>

              {course.exam && (
                <p className="mt-2 text-sm font-semibold text-slate-300">
                  {course.exam}
                </p>
              )}

              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-400">
                Protected course videos aur study materials manage karein.
              </p>
            </div>

            <button
              type="button"
              onClick={() =>
                loadCourse()
              }
              disabled={
                refreshing
              }
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-2xl border border-white/10 bg-white/5 px-5 py-3 text-sm font-black text-white transition hover:bg-white/10 disabled:cursor-not-allowed disabled:opacity-60"
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
          </div>

          {/* =================================================
              STATS
          ================================================= */}

          <div className="mt-8 grid grid-cols-2 gap-3 sm:grid-cols-4">
            <StatCard
              icon={
                <Video
                  size={18}
                />
              }
              label="Total Videos"
              value={
                lessons.length
              }
            />

            <StatCard
              icon={
                <Eye
                  size={18}
                />
              }
              label="Preview Videos"
              value={
                previewVideos
              }
            />

            <StatCard
              icon={
                <FileText
                  size={18}
                />
              }
              label="Materials"
              value={
                materials.length
              }
            />

            <StatCard
              icon={
                <CheckCircle2
                  size={18}
                />
              }
              label="Published"
              value={
                publishedVideos +
                publishedMaterials
              }
            />
          </div>
        </div>
      </section>

      {/* =====================================================
          MAIN
      ===================================================== */}

      <section className="container-main py-8 sm:py-10">
        {/* ===================================================
            ADD CONTENT
        =================================================== */}

        <div className="grid gap-7 xl:grid-cols-2">
          {/* =================================================
              VIDEO FORM
          ================================================= */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-red-50 to-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-100 text-red-700">
                  <Video
                    size={23}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-red-700">
                    Course Video
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[#071b41]">
                    Add Video Lesson
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Cloudinary protected video upload karke lesson create karein.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={
                handleAddVideo
              }
              className="space-y-5 p-6"
            >
              <Input
                label="Video Title"
                name="title"
                value={
                  videoForm.title
                }
                onChange={
                  handleVideoChange
                }
                placeholder="Example: General Knowledge - Introduction"
                required
                disabled={
                  videoLoading
                }
              />

              <Textarea
                label="Description"
                name="description"
                value={
                  videoForm.description
                }
                onChange={
                  handleVideoChange
                }
                placeholder="Video description"
                disabled={
                  videoLoading
                }
              />

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Course Video
                </label>

                <CloudinaryVideoUploader
                  key={
                    videoUploaderKey
                  }
                  onUploadComplete={
                    handleVideoUploadComplete
                  }
                />
              </div>

              {videoForm.videoPublicId && (
                <UploadSuccess
                  title="Video uploaded successfully"
                  publicId={
                    videoForm.videoPublicId
                  }
                />
              )}

              <Input
                label="Duration"
                name="duration"
                value={
                  videoForm.duration
                }
                onChange={
                  handleVideoChange
                }
                placeholder="Automatically filled after upload"
                disabled={
                  videoLoading
                }
              />

              <div className="grid gap-3 sm:grid-cols-2">
                <Checkbox
                  label="Preview Video"
                  description="Students can watch before purchase."
                  name="isPreview"
                  checked={
                    videoForm.isPreview
                  }
                  onChange={
                    handleVideoChange
                  }
                  disabled={
                    videoLoading
                  }
                />

                <Checkbox
                  label="Publish Video"
                  description="Make this lesson visible."
                  name="isPublished"
                  checked={
                    videoForm.isPublished
                  }
                  onChange={
                    handleVideoChange
                  }
                  disabled={
                    videoLoading
                  }
                />
              </div>

              <button
                type="submit"
                disabled={
                  videoLoading
                }
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-700/20 transition hover:-translate-y-0.5 hover:bg-red-800 hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {videoLoading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Adding Video...
                  </>
                ) : (
                  <>
                    <Upload
                      size={18}
                    />
                    Add Video Lesson
                  </>
                )}
              </button>
            </form>
          </div>

          {/* =================================================
              MATERIAL FORM
          ================================================= */}

          <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
            <div className="border-b border-slate-100 bg-gradient-to-r from-blue-50 to-white p-6">
              <div className="flex items-start gap-4">
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-100 text-blue-700">
                  <FileText
                    size={23}
                  />
                </div>

                <div>
                  <p className="text-[10px] font-black uppercase tracking-widest text-blue-700">
                    Study Material
                  </p>

                  <h2 className="mt-1 text-xl font-black text-[#071b41]">
                    Add Study Material
                  </h2>

                  <p className="mt-1 text-xs leading-5 text-slate-500">
                    Protected PDF, DOC, DOCX ya TXT material upload karein.
                  </p>
                </div>
              </div>
            </div>

            <form
              onSubmit={
                handleAddMaterial
              }
              className="space-y-5 p-6"
            >
              <Input
                label="Material Title"
                name="title"
                value={
                  materialForm.title
                }
                onChange={
                  handleMaterialChange
                }
                placeholder="Example: General Knowledge Notes"
                required
                disabled={
                  materialLoading
                }
              />

              <Textarea
                label="Description"
                name="description"
                value={
                  materialForm.description
                }
                onChange={
                  handleMaterialChange
                }
                placeholder="Material description"
                disabled={
                  materialLoading
                }
              />

              <div>
                <label className="mb-2 block text-sm font-black text-slate-700">
                  Study Material
                </label>

                <CloudinaryDocumentUploader
                  key={
                    materialUploaderKey
                  }
                  onUploadComplete={
                    handleMaterialUploadComplete
                  }
                />
              </div>

              {materialForm.filePublicId && (
                <UploadSuccess
                  title="Study material uploaded successfully"
                  publicId={
                    materialForm.filePublicId
                  }
                />
              )}

              <div>
                <label
                  htmlFor="fileType"
                  className="mb-2 block text-sm font-black text-slate-700"
                >
                  File Type
                </label>

                <select
                  id="fileType"
                  name="fileType"
                  value={
                    materialForm.fileType
                  }
                  onChange={
                    handleMaterialChange
                  }
                  disabled={
                    materialLoading
                  }
                  className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition focus:border-[#071b41] focus:ring-4 focus:ring-blue-50 disabled:bg-slate-50"
                >
                  <option value="pdf">
                    PDF
                  </option>

                  <option value="note">
                    Note / TXT
                  </option>

                  <option value="document">
                    DOC / DOCX
                  </option>
                </select>
              </div>

              <Input
                label="File Size"
                name="fileSize"
                value={
                  materialForm.fileSize
                }
                onChange={
                  handleMaterialChange
                }
                placeholder="Automatically filled after upload"
                disabled={
                  materialLoading
                }
              />

              <Checkbox
                label="Publish Material"
                description="Make this material visible to students."
                name="isPublished"
                checked={
                  materialForm.isPublished
                }
                onChange={
                  handleMaterialChange
                }
                disabled={
                  materialLoading
                }
              />

              <button
                type="submit"
                disabled={
                  materialLoading
                }
                className="group flex w-full items-center justify-center gap-2 rounded-2xl bg-[#071b41] px-5 py-4 text-sm font-black text-white shadow-lg shadow-[#071b41]/20 transition hover:-translate-y-0.5 hover:bg-[#0b275d] hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60"
              >
                {materialLoading ? (
                  <>
                    <Loader2
                      size={19}
                      className="animate-spin"
                    />
                    Adding Material...
                  </>
                ) : (
                  <>
                    <Upload
                      size={18}
                    />
                    Add Study Material
                  </>
                )}
              </button>
            </form>
          </div>
        </div>

        {/* ===================================================
            VIDEO LIST
        =================================================== */}

        <section className="mt-10">
          <SectionHeader
            icon={
              <Video
                size={20}
              />
            }
            eyebrow="Course Videos"
            title="Video Lessons"
            count={`${lessons.length} videos`}
          />

          <div className="mt-5 space-y-4">
            {lessons.length ===
            0 ? (
              <EmptyState
                icon={
                  <PlayCircle
                    size={27}
                  />
                }
                title="No videos added yet"
                description="Upload your first protected video lesson using the form above."
              />
            ) : (
              lessons.map(
                (
                  lesson,
                  index
                ) => (
                  <VideoCard
                    key={
                      lesson?._id ||
                      `lesson-${index}`
                    }
                    lesson={
                      lesson
                    }
                    index={
                      index
                    }
                    deleting={
                      deleteLoading ===
                      `video-${lesson?._id}`
                    }
                    onDelete={() =>
                      handleDeleteVideo(
                        lesson?._id
                      )
                    }
                  />
                )
              )
            )}
          </div>
        </section>

        {/* ===================================================
            MATERIAL LIST
        =================================================== */}

        <section className="mt-10">
          <SectionHeader
            icon={
              <FileText
                size={20}
              />
            }
            eyebrow="Study Materials"
            title="PDFs & Notes"
            count={`${materials.length} materials`}
            blue
          />

          <div className="mt-5 space-y-4">
            {materials.length ===
            0 ? (
              <EmptyState
                icon={
                  <FileText
                    size={27}
                  />
                }
                title="No study material added yet"
                description="Upload your first protected PDF or document using the form above."
              />
            ) : (
              materials.map(
                (
                  material,
                  index
                ) => (
                  <MaterialCard
                    key={
                      material?._id ||
                      `material-${index}`
                    }
                    material={
                      material
                    }
                    index={
                      index
                    }
                    deleting={
                      deleteLoading ===
                      `material-${material?._id}`
                    }
                    onDelete={() =>
                      handleDeleteMaterial(
                        material?._id
                      )
                    }
                  />
                )
              )
            )}
          </div>
        </section>

        {/* ===================================================
            SECURITY NOTICE
        =================================================== */}

        <section className="mt-10">
          <div className="overflow-hidden rounded-3xl border border-green-200 bg-white shadow-sm">
            <div className="flex items-start gap-4 bg-green-50 p-6">
              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl bg-green-100 text-green-700">
                <ShieldCheck
                  size={22}
                />
              </div>

              <div>
                <h3 className="font-black text-green-900">
                  Protected Course Content
                </h3>

                <p className="mt-1 text-sm leading-6 text-green-800">
                  Admin authentication required hai.
                  Paid course videos aur materials
                  protected Cloudinary delivery flow ke
                  through serve hone chahiye.
                </p>
              </div>
            </div>

            <div className="grid gap-4 border-t border-green-100 p-6 sm:grid-cols-3">
              <SecurityItem
                icon={
                  <ShieldCheck
                    size={17}
                  />
                }
                title="Admin Protected"
                text="Only authorized admin content management."
              />

              <SecurityItem
                icon={
                  <Video
                    size={17}
                  />
                }
                title="Protected Videos"
                text="Course video public access ke liye expose nahi kiya jana chahiye."
              />

              <SecurityItem
                icon={
                  <FileText
                    size={17}
                  />
                }
                title="Protected Materials"
                text="Paid study material student access ke through serve hona chahiye."
              />
            </div>
          </div>
        </section>
      </section>
    </main>
  );
}

/* =========================================================
   STAT CARD
========================================================= */

function StatCard({
  icon,
  label,
  value,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 p-4 backdrop-blur-sm">
      <div className="flex items-center gap-2 text-slate-400">
        {icon}

        <span className="text-[10px] font-black uppercase tracking-wider">
          {label}
        </span>
      </div>

      <p className="mt-2 text-2xl font-black text-yellow-300">
        {value}
      </p>
    </div>
  );
}

/* =========================================================
   SECTION HEADER
========================================================= */

function SectionHeader({
  icon,
  eyebrow,
  title,
  count,
  blue = false,
}) {
  return (
    <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
      <div className="flex items-start gap-3">
        <div
          className={`flex h-11 w-11 shrink-0 items-center justify-center rounded-2xl ${
            blue
              ? "bg-blue-100 text-blue-700"
              : "bg-red-100 text-red-700"
          }`}
        >
          {icon}
        </div>

        <div>
          <p
            className={`text-[10px] font-black uppercase tracking-widest ${
              blue
                ? "text-blue-700"
                : "text-red-700"
            }`}
          >
            {eyebrow}
          </p>

          <h2 className="mt-1 text-2xl font-black tracking-tight text-[#071b41]">
            {title}
          </h2>
        </div>
      </div>

      <div className="text-sm font-black text-slate-500">
        {count}
      </div>
    </div>
  );
}

/* =========================================================
   VIDEO CARD
========================================================= */

function VideoCard({
  lesson,
  index,
  deleting,
  onDelete,
}) {
  const published =
    lesson?.isPublished !==
    false;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-red-50 text-red-700">
              <PlayCircle
                size={23}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                  #{index + 1}
                </span>

                {lesson?.isPreview && (
                  <span className="inline-flex items-center gap-1 rounded-full bg-yellow-100 px-2.5 py-1 text-[10px] font-black text-yellow-800">
                    <Eye
                      size={12}
                    />
                    PREVIEW
                  </span>
                )}

                {published ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black text-green-800">
                    <CheckCircle2
                      size={12}
                    />
                    PUBLISHED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                    <EyeOff
                      size={12}
                    />
                    DRAFT
                  </span>
                )}
              </div>

              <h3 className="mt-3 break-words text-base font-black text-[#071b41] sm:text-lg">
                {lesson?.title ||
                  "Untitled Video"}
              </h3>

              {lesson?.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {
                    lesson.description
                  }
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {lesson?.duration && (
                  <InfoBadge
                    icon={
                      <Clock3
                        size={13}
                      />
                    }
                    text={
                      lesson.duration
                    }
                  />
                )}

                {lesson?.videoPublicId && (
                  <InfoBadge
                    icon={
                      <CheckCircle2
                        size={13}
                      />
                    }
                    text="Cloudinary Connected"
                    green
                  />
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-700 transition hover:bg-red-50 lg:w-auto disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Trash2
                size={16}
              />
            )}

            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   MATERIAL CARD
========================================================= */

function MaterialCard({
  material,
  index,
  deleting,
  onDelete,
}) {
  const published =
    material?.isPublished !==
    false;

  return (
    <article className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm transition hover:border-slate-300 hover:shadow-md">
      <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-blue-50 text-blue-700">
              <FileText
                size={23}
              />
            </div>

            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                  #{index + 1}
                </span>

                <span className="rounded-full bg-blue-100 px-2.5 py-1 text-[10px] font-black uppercase text-blue-800">
                  {material?.fileType ||
                    "document"}
                </span>

                {published ? (
                  <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-1 text-[10px] font-black text-green-800">
                    <CheckCircle2
                      size={12}
                    />
                    PUBLISHED
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2.5 py-1 text-[10px] font-black text-slate-600">
                    <EyeOff
                      size={12}
                    />
                    DRAFT
                  </span>
                )}
              </div>

              <h3 className="mt-3 break-words text-base font-black text-[#071b41] sm:text-lg">
                {material?.title ||
                  "Untitled Material"}
              </h3>

              {material?.description && (
                <p className="mt-2 max-w-3xl text-sm leading-6 text-slate-500">
                  {
                    material.description
                  }
                </p>
              )}

              <div className="mt-4 flex flex-wrap gap-2">
                {material?.fileSize && (
                  <InfoBadge
                    icon={
                      <HardDrive
                        size={13}
                      />
                    }
                    text={
                      material.fileSize
                    }
                  />
                )}

                {material?.filePublicId && (
                  <InfoBadge
                    icon={
                      <CheckCircle2
                        size={13}
                      />
                    }
                    text="Cloudinary Connected"
                    green
                  />
                )}
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={onDelete}
            disabled={deleting}
            className="inline-flex w-full shrink-0 items-center justify-center gap-2 rounded-2xl border border-red-200 bg-white px-4 py-3 text-xs font-black text-red-700 transition hover:bg-red-50 lg:w-auto disabled:cursor-not-allowed disabled:opacity-50"
          >
            {deleting ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <Trash2
                size={16}
              />
            )}

            {deleting
              ? "Deleting..."
              : "Delete"}
          </button>
        </div>
      </div>
    </article>
  );
}

/* =========================================================
   INFO BADGE
========================================================= */

function InfoBadge({
  icon,
  text,
  green = false,
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-[11px] font-bold ${
        green
          ? "bg-green-50 text-green-700"
          : "bg-slate-100 text-slate-600"
      }`}
    >
      {icon}
      {text}
    </span>
  );
}

/* =========================================================
   UPLOAD SUCCESS
========================================================= */

function UploadSuccess({
  title,
  publicId,
}) {
  return (
    <div className="rounded-2xl border border-green-200 bg-green-50 p-4">
      <div className="flex items-start gap-3">
        <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
          <CheckCircle2
            size={18}
          />
        </div>

        <div className="min-w-0">
          <p className="text-xs font-black text-green-800">
            {title}
          </p>

          <p className="mt-1 break-all text-[11px] leading-5 text-green-700">
            Public ID:{" "}
            {publicId}
          </p>
        </div>
      </div>
    </div>
  );
}

/* =========================================================
   INPUT
========================================================= */

function Input({
  label,
  name,
  value,
  onChange,
  placeholder,
  required = false,
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-black text-slate-700"
      >
        {label}
        {required && (
          <span className="ml-1 text-red-600">
            *
          </span>
        )}
      </label>

      <input
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        disabled={disabled}
        className="w-full rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-[#071b41] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  );
}

/* =========================================================
   TEXTAREA
========================================================= */

function Textarea({
  label,
  name,
  value,
  onChange,
  placeholder,
  disabled = false,
}) {
  return (
    <div>
      <label
        htmlFor={name}
        className="mb-2 block text-sm font-black text-slate-700"
      >
        {label}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={3}
        disabled={disabled}
        className="w-full resize-none rounded-2xl border border-slate-200 bg-white px-4 py-3.5 text-sm font-semibold text-slate-800 outline-none transition placeholder:font-medium placeholder:text-slate-400 hover:border-slate-300 focus:border-[#071b41] focus:ring-4 focus:ring-blue-50 disabled:cursor-not-allowed disabled:bg-slate-50"
      />
    </div>
  );
}

/* =========================================================
   CHECKBOX
========================================================= */

function Checkbox({
  label,
  description,
  name,
  checked,
  onChange,
  disabled = false,
}) {
  return (
    <label
      className={`flex cursor-pointer items-start gap-3 rounded-2xl border p-4 transition ${
        checked
          ? "border-[#071b41]/10 bg-slate-50"
          : "border-slate-100 bg-white"
      } ${
        disabled
          ? "cursor-not-allowed opacity-60"
          : "hover:border-slate-200 hover:bg-slate-50"
      }`}
    >
      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        disabled={disabled}
        className="mt-0.5 h-4 w-4 rounded border-slate-300 text-[#071b41] focus:ring-[#071b41]"
      />

      <span className="min-w-0">
        <span className="block text-sm font-black text-slate-700">
          {label}
        </span>

        {description && (
          <span className="mt-1 block text-[11px] leading-5 text-slate-500">
            {description}
          </span>
        )}
      </span>
    </label>
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
    <div className="rounded-3xl border border-dashed border-slate-300 bg-white p-10 text-center">
      <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-slate-100 text-slate-500">
        {icon}
      </div>

      <h3 className="mt-5 font-black text-[#071b41]">
        {title}
      </h3>

      <p className="mx-auto mt-2 max-w-md text-sm leading-6 text-slate-500">
        {description}
      </p>
    </div>
  );
}

/* =========================================================
   SECURITY ITEM
========================================================= */

function SecurityItem({
  icon,
  title,
  text,
}) {
  return (
    <div className="flex items-start gap-3">
      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-100 text-green-700">
        {icon}
      </div>

      <div>
        <p className="text-xs font-black text-slate-800">
          {title}
        </p>

        <p className="mt-1 text-[11px] leading-5 text-slate-500">
          {text}
        </p>
      </div>
    </div>
  );
}