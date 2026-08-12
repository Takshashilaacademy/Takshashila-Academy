import { useState } from "react";
import { API_URL } from "../config/api.js";
import { useNavigate } from "react-router-dom";
import {
  ArrowLeft,
  BookOpen,
  CheckCircle2,
  Loader2,
  Save,
  X,
} from "lucide-react";

import CloudinaryUploader from "../components/admin/CloudinaryUploader";

const initialForm = {
  title: "",
  shortTitle: "",
  exam: "",
  description: "",
  fullDescription: "",
  thumbnail: "",
  thumbnailPublicId: "",
  price: "",
  oldPrice: "",
  duration: "Self Paced",
  language: "Hindi",
  subjects: "",
  features: "",
  totalVideos: "0",
  totalNotes: "0",
  totalTests: "0",
  isPublished: true,
  isFeatured: false,
};

export default function AdminCreateCourse() {
  const navigate = useNavigate();

  const [formData, setFormData] = useState(initialForm);

  const [loading, setLoading] = useState(false);

  const [successMessage, setSuccessMessage] =
    useState("");

  const [errorMessage, setErrorMessage] =
    useState("");

  /* =========================================================
     INPUT CHANGE
  ========================================================= */

  const handleChange = (event) => {
    const {
      name,
      value,
      type,
      checked,
    } = event.target;

    setFormData((previous) => ({
      ...previous,

      [name]:
        type === "checkbox"
          ? checked
          : value,
    }));

    setSuccessMessage("");
    setErrorMessage("");
  };

  /* =========================================================
     CLOUDINARY UPLOAD COMPLETE
  ========================================================= */

  const handleThumbnailUpload = (data) => {
    setFormData((previous) => ({
      ...previous,

      thumbnail: data.url || "",

      thumbnailPublicId:
        data.publicId || "",
    }));

    setErrorMessage("");
    setSuccessMessage(
      "Thumbnail uploaded. अब course create कर सकते हैं."
    );
  };

  /* =========================================================
     CREATE COURSE
  ========================================================= */

  const handleSubmit = async (event) => {
    event.preventDefault();

    setLoading(true);
    setSuccessMessage("");
    setErrorMessage("");

    const token = localStorage.getItem(
      "takshashila_admin_token"
    );

    if (!token) {
      navigate("/admin/login", {
        replace: true,
      });

      return;
    }

    const subjects = formData.subjects
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    const features = formData.features
      .split(",")
      .map((item) => item.trim())
      .filter(Boolean);

    try {
      const response = await fetch(
        `${API_URL}/api/admin/courses`,
        {
          method: "POST",

          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },

          body: JSON.stringify({
            title: formData.title,

            shortTitle:
              formData.shortTitle,

            exam: formData.exam,

            description:
              formData.description,

            fullDescription:
              formData.fullDescription,

            thumbnail:
              formData.thumbnail,

            thumbnailPublicId:
              formData.thumbnailPublicId,

            price:
              Number(formData.price),

            oldPrice:
              formData.oldPrice
                ? Number(formData.oldPrice)
                : 0,

            duration:
              formData.duration,

            language:
              formData.language,

            subjects,

            features,

            totalVideos:
              Number(formData.totalVideos) || 0,

            totalNotes:
              Number(formData.totalNotes) || 0,

            totalTests:
              Number(formData.totalTests) || 0,

            isPublished:
              formData.isPublished,

            isFeatured:
              formData.isFeatured,
          }),
        }
      );

      const data = await response.json();

      if (!response.ok) {
        if (response.status === 401) {
          localStorage.removeItem(
            "takshashila_admin_token"
          );

          localStorage.removeItem(
            "takshashila_admin"
          );

          navigate("/admin/login", {
            replace: true,
          });

          return;
        }

        throw new Error(
          data.message ||
            "Unable to create course."
        );
      }

      setSuccessMessage(
        "Course created successfully."
      );

      setFormData(initialForm);

    } catch (error) {
      console.error(
        "Create Course Error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Something went wrong while creating the course."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <main className="min-h-[calc(100vh-72px)] bg-slate-50">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <section className="border-b border-slate-200 bg-[#071b41] text-white">

        <div className="container-main py-7">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-center gap-4">

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-yellow-400 text-[#071b41]">
                <BookOpen size={25} />
              </div>

              <div>

                <p className="text-xs font-bold uppercase tracking-widest text-blue-200">
                  Admin Panel
                </p>

                <h1 className="mt-1 text-2xl font-black">
                  Create Course
                </h1>

              </div>

            </div>

            <button
              type="button"
              onClick={() =>
                navigate("/admin/dashboard")
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-white/20 px-4 py-2.5 text-sm font-black transition hover:bg-white/10"
            >
              <ArrowLeft size={17} />
              Back to Dashboard
            </button>

          </div>

        </div>

      </section>

      {/* =====================================================
          FORM
      ===================================================== */}

      <div className="container-main py-10">

        <form
          onSubmit={handleSubmit}
          className="mx-auto max-w-5xl"
        >

          {/* =================================================
              SUCCESS
          ================================================= */}

          {successMessage && (
            <div className="mb-6 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4 text-green-800">

              <CheckCircle2
                size={20}
                className="mt-0.5 shrink-0"
              />

              <div className="flex-1">

                <p className="text-sm font-black">
                  {successMessage}
                </p>

              </div>

              <button
                type="button"
                onClick={() =>
                  setSuccessMessage("")
                }
                className="text-green-700"
              >
                <X size={17} />
              </button>

            </div>
          )}

          {/* =================================================
              ERROR
          ================================================= */}

          {errorMessage && (
            <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-700">
              {errorMessage}
            </div>
          )}

          {/* =================================================
              BASIC INFORMATION
          ================================================= */}

          <FormSection
            title="Basic Course Information"
            description="Course की basic details भरें।"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <InputField
                label="Course Title"
                name="title"
                value={formData.title}
                onChange={handleChange}
                placeholder="e.g. SSC Complete Preparation"
                required
              />

              <InputField
                label="Short Title"
                name="shortTitle"
                value={formData.shortTitle}
                onChange={handleChange}
                placeholder="e.g. SSC 2026"
              />

              <InputField
                label="Exam"
                name="exam"
                value={formData.exam}
                onChange={handleChange}
                placeholder="e.g. SSC CGL"
                required
              />

              <InputField
                label="Language"
                name="language"
                value={formData.language}
                onChange={handleChange}
                placeholder="Hindi"
              />

              <InputField
                label="Duration"
                name="duration"
                value={formData.duration}
                onChange={handleChange}
                placeholder="e.g. 12 Months"
              />

            </div>

            {/* =================================================
                THUMBNAIL UPLOAD
            ================================================= */}

            <div className="mt-6">

              <CloudinaryUploader
                onUploadComplete={
                  handleThumbnailUpload
                }
              />

            </div>

            {/* =================================================
                THUMBNAIL URL
            ================================================= */}

            {formData.thumbnail && (
              <div className="mt-5 rounded-xl border border-green-200 bg-green-50 p-4">

                <p className="text-xs font-black uppercase tracking-wide text-green-700">
                  Cloudinary Thumbnail URL
                </p>

                <p className="mt-2 break-all text-xs leading-5 text-green-800">
                  {formData.thumbnail}
                </p>

                {formData.thumbnailPublicId && (
                  <p className="mt-2 break-all text-xs leading-5 text-green-700">
                    Public ID:{" "}
                    {formData.thumbnailPublicId}
                  </p>
                )}

              </div>
            )}

            <div className="mt-5">

              <TextAreaField
                label="Short Description"
                name="description"
                value={formData.description}
                onChange={handleChange}
                placeholder="Course के बारे में short description..."
                rows={4}
                required
              />

            </div>

            <div className="mt-5">

              <TextAreaField
                label="Full Description"
                name="fullDescription"
                value={formData.fullDescription}
                onChange={handleChange}
                placeholder="Course की complete details..."
                rows={6}
              />

            </div>

          </FormSection>

          {/* =================================================
              PRICING
          ================================================= */}

          <FormSection
            title="Pricing"
            description="Course की pricing information।"
          >

            <div className="grid gap-5 md:grid-cols-2">

              <InputField
                label="Course Price (₹)"
                name="price"
                type="number"
                min="0"
                value={formData.price}
                onChange={handleChange}
                placeholder="2499"
                required
              />

              <InputField
                label="Old Price (₹)"
                name="oldPrice"
                type="number"
                min="0"
                value={formData.oldPrice}
                onChange={handleChange}
                placeholder="4999"
              />

            </div>

          </FormSection>

          {/* =================================================
              SUBJECTS & FEATURES
          ================================================= */}

          <FormSection
            title="Subjects & Features"
            description="Multiple items comma से अलग करें।"
          >

            <TextAreaField
              label="Subjects"
              name="subjects"
              value={formData.subjects}
              onChange={handleChange}
              placeholder="Maths, Reasoning, English, General Knowledge"
              rows={3}
            />

            <div className="mt-5">

              <TextAreaField
                label="Course Features"
                name="features"
                value={formData.features}
                onChange={handleChange}
                placeholder="Recorded Videos, PDF Notes, Study Material"
                rows={3}
              />

            </div>

          </FormSection>

          {/* =================================================
              CONTENT COUNTS
          ================================================= */}

          <FormSection
            title="Course Content"
            description="Initial content count set करें।"
          >

            <div className="grid gap-5 md:grid-cols-3">

              <InputField
                label="Total Videos"
                name="totalVideos"
                type="number"
                min="0"
                value={formData.totalVideos}
                onChange={handleChange}
              />

              <InputField
                label="Total Notes"
                name="totalNotes"
                type="number"
                min="0"
                value={formData.totalNotes}
                onChange={handleChange}
              />

              <InputField
                label="Total Tests (Not used yet)"
                name="totalTests"
                type="number"
                min="0"
                value={formData.totalTests}
                onChange={handleChange}
              />

            </div>

          </FormSection>

          {/* =================================================
              SETTINGS
          ================================================= */}

          <FormSection
            title="Course Settings"
            description="Course visibility settings।"
          >

            <div className="grid gap-4 md:grid-cols-2">

              <CheckboxField
                name="isPublished"
                checked={formData.isPublished}
                onChange={handleChange}
                title="Publish Course"
                description="Published course students को दिखाई देगा।"
              />

              <CheckboxField
                name="isFeatured"
                checked={formData.isFeatured}
                onChange={handleChange}
                title="Featured Course"
                description="Course को featured courses में दिखाएँ।"
              />

            </div>

          </FormSection>

          {/* =================================================
              SUBMIT
          ================================================= */}

          <div className="mt-8 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">

            <button
              type="button"
              onClick={() =>
                navigate("/admin/dashboard")
              }
              disabled={loading}
              className="rounded-xl border border-slate-200 bg-white px-6 py-3.5 text-sm font-black text-slate-700 transition hover:bg-slate-50 disabled:opacity-50"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-[#071b41] px-7 py-3.5 text-sm font-black text-white shadow-lg shadow-blue-950/20 transition hover:bg-[#0b2558] disabled:cursor-not-allowed disabled:opacity-70"
            >

              {loading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Creating Course...
                </>
              ) : (
                <>
                  <Save size={18} />
                  Create Course
                </>
              )}

            </button>

          </div>

        </form>

      </div>

    </main>
  );
}


/* =========================================================
   FORM SECTION
========================================================= */

function FormSection({
  title,
  description,
  children,
}) {
  return (
    <section className="mb-6 rounded-2xl border border-slate-200 bg-white p-5 shadow-sm sm:p-7">

      <div className="mb-6">

        <h2 className="text-lg font-black text-[#071b41]">
          {title}
        </h2>

        <p className="mt-1 text-sm text-slate-500">
          {description}
        </p>

      </div>

      {children}

    </section>
  );
}


/* =========================================================
   INPUT
========================================================= */

function InputField({
  label,
  name,
  type = "text",
  value,
  onChange,
  placeholder,
  required = false,
  min,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <input
        id={name}
        name={name}
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        min={min}
        className="w-full rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#071b41] focus:ring-4 focus:ring-blue-50"
      />

    </div>
  );
}


/* =========================================================
   TEXTAREA
========================================================= */

function TextAreaField({
  label,
  name,
  value,
  onChange,
  placeholder,
  rows = 4,
  required = false,
}) {
  return (
    <div>

      <label
        htmlFor={name}
        className="mb-2 block text-sm font-bold text-slate-700"
      >
        {label}

        {required && (
          <span className="ml-1 text-red-500">
            *
          </span>
        )}
      </label>

      <textarea
        id={name}
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        rows={rows}
        required={required}
        className="w-full resize-y rounded-xl border border-slate-200 bg-white px-4 py-3.5 text-sm leading-6 text-slate-800 outline-none transition placeholder:text-slate-400 focus:border-[#071b41] focus:ring-4 focus:ring-blue-50"
      />

    </div>
  );
}


/* =========================================================
   CHECKBOX
========================================================= */

function CheckboxField({
  name,
  checked,
  onChange,
  title,
  description,
}) {
  return (
    <label className="flex cursor-pointer items-start gap-3 rounded-xl border border-slate-200 p-4 transition hover:border-blue-200 hover:bg-blue-50/30">

      <input
        type="checkbox"
        name={name}
        checked={checked}
        onChange={onChange}
        className="mt-1 h-4 w-4 accent-[#071b41]"
      />

      <span>

        <span className="block text-sm font-black text-slate-800">
          {title}
        </span>

        <span className="mt-1 block text-xs leading-5 text-slate-500">
          {description}
        </span>

      </span>

    </label>
  );
}