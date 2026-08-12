import {
  useRef,
  useState,
} from "react";

import {
  CheckCircle2,
  Film,
  FileVideo,
  Loader2,
  UploadCloud,
  X,
  AlertCircle,
} from "lucide-react";

import { API_URL } from "../../config/api.js";

/* =========================================================
   CLOUDINARY VIDEO UPLOADER

   Flow:

   Admin Browser
        ↓
   Backend signature
        ↓
   Cloudinary signed upload
        ↓
   Parent component receives media metadata

   IMPORTANT:

   The frontend does NOT decide:
   - Cloudinary folder
   - Cloudinary resource type
   - delivery type

   Backend decides those values from:
   category = "course-video"
========================================================= */

export default function CloudinaryVideoUploader({
  onUploadComplete,
}) {
  const fileInputRef =
    useRef(null);

  /* =======================================================
     STATE
  ======================================================= */

  const [
    file,
    setFile,
  ] = useState(null);

  const [
    uploading,
    setUploading,
  ] = useState(false);

  const [
    progress,
    setProgress,
  ] = useState(0);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    successMessage,
    setSuccessMessage,
  ] = useState("");

  /* =======================================================
     CONSTANTS
  ======================================================= */

  /*
   * Regular browser Cloudinary upload should not be presented
   * as a multi-GB uploader.
   *
   * For the current upload endpoint we keep the browser
   * selection limit conservative.
   *
   * A future chunked uploader can be added separately for
   * very large lecture recordings.
   */

  const MAX_FILE_SIZE =
    100 * 1024 * 1024;

  /* =======================================================
     RESET MESSAGES
  ======================================================= */

  const clearMessages = () => {
    setErrorMessage("");
    setSuccessMessage("");
  };

  /* =======================================================
     SELECT FILE
  ======================================================= */

  const handleFileChange = (
    event
  ) => {
    const selectedFile =
      event.target.files?.[0];

    clearMessages();

    setProgress(0);

    if (!selectedFile) {
      return;
    }

    /* =====================================================
       VIDEO TYPE
    ===================================================== */

    if (
      !selectedFile.type.startsWith(
        "video/"
      )
    ) {
      setErrorMessage(
        "Please select a valid video file."
      );

      event.target.value =
        "";

      return;
    }

    /* =====================================================
       FILE SIZE
    ===================================================== */

    if (
      selectedFile.size >
      MAX_FILE_SIZE
    ) {
      setErrorMessage(
        "This uploader supports videos up to 100 MB. For larger lecture videos, use the large-video uploader."
      );

      event.target.value =
        "";

      return;
    }

    setFile(
      selectedFile
    );
  };

  /* =======================================================
     GET ADMIN TOKEN
     
     Kept compatible with the existing project contract.
  ======================================================= */

  const getAdminToken = () => {
    try {
      const token =
        localStorage.getItem(
          "takshashila_admin_token"
        );

      if (
        typeof token !==
          "string" ||
        !token.trim()
      ) {
        return "";
      }

      return token.trim();
    } catch (
      error
    ) {
      console.error(
        "Get Admin Token Error:",
        error
      );

      return "";
    }
  };

  /* =======================================================
     GET CLOUDINARY SIGNATURE
     
     Backend controls:
     - folder
     - resource type
     - delivery type
  ======================================================= */

  const getUploadSignature =
    async () => {
      const token =
        getAdminToken();

      if (!token) {
        throw new Error(
          "Admin session not found. Please login again."
        );
      }

      const response =
        await fetch(
          `${API_URL}/api/admin/cloudinary/signature`,
          {
            method:
              "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body:
              JSON.stringify({
                category:
                  "course-video",
              }),
          }
        );

      let data =
        {};

      const responseText =
        await response.text();

      if (
        responseText
      ) {
        try {
          data =
            JSON.parse(
              responseText
            );
        } catch {
          data =
            {};
        }
      }

      if (
        !response.ok
      ) {
        throw new Error(
          data?.message ||
            "Unable to create Cloudinary upload signature."
        );
      }

      if (
        !data?.signature ||
        !data?.timestamp ||
        !data?.cloudName ||
        !data?.apiKey ||
        !data?.folder ||
        !data?.resourceType ||
        !data?.type
      ) {
        throw new Error(
          "Cloudinary signature response is incomplete."
        );
      }

      /*
       * Extra safety:
       *
       * This uploader is specifically for course videos.
       *
       * If the backend accidentally returns another
       * configuration, refuse the upload.
       */

      if (
        data.category !==
        "course-video"
      ) {
        throw new Error(
          "Invalid Cloudinary media category returned by server."
        );
      }

      if (
        data.resourceType !==
        "video"
      ) {
        throw new Error(
          "Cloudinary returned an invalid video resource type."
        );
      }

      if (
        data.type !==
        "authenticated"
      ) {
        throw new Error(
          "Course video must use authenticated Cloudinary delivery."
        );
      }

      return data;
    };

  /* =======================================================
     DIRECT CLOUDINARY UPLOAD
  ======================================================= */

  const uploadToCloudinary =
    ({
      signature,
      timestamp,
      cloudName,
      apiKey,
      folder,
      type,
    }) => {
      return new Promise(
        (
          resolve,
          reject
        ) => {
          if (!file) {
            reject(
              new Error(
                "Video file is missing."
              )
            );

            return;
          }

          /* =================================================
             FORM DATA
          ================================================= */

          const formData =
            new FormData();

          formData.append(
            "file",
            file
          );

          formData.append(
            "api_key",
            apiKey
          );

          formData.append(
            "timestamp",
            String(
              timestamp
            )
          );

          formData.append(
            "signature",
            signature
          );

          /*
           * These values are returned by the backend.
           *
           * We use them exactly as signed.
           */

          formData.append(
            "folder",
            folder
          );

          formData.append(
            "type",
            type
          );

          /* =================================================
             XHR
          ================================================= */

          const xhr =
            new XMLHttpRequest();

          xhr.open(
            "POST",
            `https://api.cloudinary.com/v1_1/${encodeURIComponent(
              cloudName
            )}/video/upload`
          );

          xhr.responseType =
            "text";

          /* =================================================
             PROGRESS
          ================================================= */

          xhr.upload.onprogress =
            (
              event
            ) => {
              if (
                event.lengthComputable
              ) {
                const percentage =
                  Math.min(
                    99,
                    Math.round(
                      (
                        event.loaded /
                        event.total
                      ) *
                        100
                    )
                  );

                setProgress(
                  percentage
                );
              }
            };

          /* =================================================
             SUCCESS
          ================================================= */

          xhr.onload =
            () => {
              let data =
                {};

              try {
                data =
                  xhr.responseText
                    ? JSON.parse(
                        xhr.responseText
                      )
                    : {};
              } catch {
                reject(
                  new Error(
                    "Cloudinary returned an invalid response."
                  )
                );

                return;
              }

              if (
                xhr.status >=
                  200 &&
                xhr.status <
                  300
              ) {
                resolve(
                  data
                );

                return;
              }

              reject(
                new Error(
                  data?.error?.message ||
                    "Cloudinary video upload failed."
                )
              );
            };

          /* =================================================
             NETWORK ERROR
          ================================================= */

          xhr.onerror =
            () => {
              reject(
                new Error(
                  "Video upload failed because of a network error."
                )
              );
            };

          /* =================================================
             ABORT
          ================================================= */

          xhr.onabort =
            () => {
              reject(
                new Error(
                  "Video upload was cancelled."
                )
              );
            };

          /* =================================================
             SEND
          ================================================= */

          xhr.send(
            formData
          );
        }
      );
    };

  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleUpload =
    async () => {
      if (
        !file
      ) {
        setErrorMessage(
          "Please select a video first."
        );

        return;
      }

      if (
        uploading
      ) {
        return;
      }

      try {
        setUploading(
          true
        );

        setProgress(
          0
        );

        clearMessages();

        /* =================================================
           SIGNATURE
        ================================================= */

        const signatureData =
          await getUploadSignature();

        /* =================================================
           CLOUDINARY UPLOAD
        ================================================= */

        const uploadedVideo =
          await uploadToCloudinary(
            signatureData
          );

        /* =================================================
           VALIDATE CLOUDINARY RESPONSE
        ================================================= */

        if (
          !uploadedVideo?.public_id
        ) {
          throw new Error(
            "Cloudinary upload succeeded but public ID was not returned."
          );
        }

        if (
          !uploadedVideo?.secure_url
        ) {
          throw new Error(
            "Cloudinary upload succeeded but secure URL was not returned."
          );
        }

        /* =================================================
           COMPLETE
        ================================================= */

        setProgress(
          100
        );

        setSuccessMessage(
          "Course video uploaded successfully."
        );

        /* =================================================
           SEND MEDIA TO PARENT
        ================================================= */

        if (
          typeof onUploadComplete ===
          "function"
        ) {
          onUploadComplete({
            url:
              uploadedVideo.secure_url,

            publicId:
              uploadedVideo.public_id,

            resourceType:
              uploadedVideo.resource_type ||
              "video",

            format:
              uploadedVideo.format ||
              "",

            bytes:
              uploadedVideo.bytes ||
              file.size,

            width:
              uploadedVideo.width ||
              null,

            height:
              uploadedVideo.height ||
              null,

            duration:
              uploadedVideo.duration ||
              null,

            originalFilename:
              uploadedVideo.original_filename ||
              file.name,

            deliveryType:
              signatureData.type,

            category:
              "course-video",
          });
        }
      } catch (
        error
      ) {
        console.error(
          "Cloudinary Video Upload Error:",
          error
        );

        setProgress(
          0
        );

        setErrorMessage(
          error?.message ||
            "Video upload failed."
        );
      } finally {
        setUploading(
          false
        );
      }
    };

  /* =======================================================
     REMOVE FILE
  ======================================================= */

  const handleRemove =
    () => {
      if (
        uploading
      ) {
        return;
      }

      setFile(
        null
      );

      setProgress(
        0
      );

      clearMessages();

      if (
        fileInputRef.current
      ) {
        fileInputRef.current.value =
          "";
      }
    };

  /* =======================================================
     FORMAT FILE SIZE
  ======================================================= */

  const formatFileSize =
    (
      bytes
    ) => {
      if (
        !bytes ||
        bytes <= 0
      ) {
        return "0 MB";
      }

      const mb =
        bytes /
        (
          1024 *
          1024
        );

      if (
        mb >=
        1024
      ) {
        return `${(
          mb / 1024
        ).toFixed(
          2
        )} GB`;
      }

      return `${mb.toFixed(
        2
      )} MB`;
    };

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="border-b border-slate-100 bg-gradient-to-br from-[#071b41] via-[#0b2558] to-[#102f68] px-5 py-5 sm:px-6">

        <div className="flex items-center gap-4">

          <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-white/10 text-blue-200 ring-1 ring-white/10">
            <Film
              size={22}
            />
          </div>

          <div className="min-w-0">

            <h3 className="text-sm font-black text-white sm:text-base">
              Course Video
            </h3>

            <p className="mt-1 text-xs leading-5 text-slate-300">
              Upload protected course video directly to Cloudinary.
            </p>

          </div>

        </div>

      </div>

      {/* ===================================================
          BODY
      =================================================== */}

      <div className="p-5 sm:p-6">

        {/* =================================================
            EMPTY STATE
        ================================================= */}

        {!file && (
          <button
            type="button"
            onClick={() =>
              fileInputRef.current?.click()
            }
            disabled={
              uploading
            }
            className="group flex w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-slate-300 bg-slate-50 px-5 py-12 text-center transition hover:border-[#071b41] hover:bg-blue-50/40 disabled:cursor-not-allowed disabled:opacity-60"
          >

            <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-white text-[#071b41] shadow-sm ring-1 ring-slate-200 transition group-hover:scale-105">

              <UploadCloud
                size={30}
              />

            </div>

            <span className="mt-5 text-sm font-black text-slate-800">
              Choose Course Video
            </span>

            <span className="mt-2 max-w-md text-xs leading-5 text-slate-400">
              MP4, MOV, WEBM and other browser-supported video formats.
            </span>

            <span className="mt-3 rounded-full bg-white px-3 py-1.5 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
              Maximum 100 MB
            </span>

          </button>
        )}

        <input
          ref={
            fileInputRef
          }
          type="file"
          accept="video/*"
          onChange={
            handleFileChange
          }
          disabled={
            uploading
          }
          className="hidden"
        />

        {/* =================================================
            SELECTED FILE
        ================================================= */}

        {file && (
          <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <div className="flex items-start gap-4">

              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#071b41]">
                <FileVideo
                  size={21}
                />
              </div>

              <div className="min-w-0 flex-1">

                <p className="truncate text-sm font-black text-slate-800">
                  {file.name}
                </p>

                <div className="mt-2 flex flex-wrap gap-2">

                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                    {formatFileSize(
                      file.size
                    )}
                  </span>

                  <span className="rounded-full bg-white px-2.5 py-1 text-[11px] font-bold text-slate-500 ring-1 ring-slate-200">
                    {file.type ||
                      "Video"}
                  </span>

                </div>

              </div>

              {!uploading && (
                <button
                  type="button"
                  onClick={
                    handleRemove
                  }
                  className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-slate-500 ring-1 ring-slate-200 transition hover:bg-red-50 hover:text-red-600 hover:ring-red-200"
                  aria-label="Remove selected video"
                >
                  <X
                    size={17}
                  />
                </button>
              )}

            </div>

          </div>
        )}

        {/* =================================================
            SECURITY INFO
        ================================================= */}

        {file && !uploading && (
          <div className="mt-4 flex items-start gap-3 rounded-2xl border border-blue-100 bg-blue-50/60 p-4">

            <div className="mt-0.5 shrink-0 text-blue-700">
              <CheckCircle2
                size={17}
              />
            </div>

            <div>

              <p className="text-xs font-black text-blue-900">
                Protected course media
              </p>

              <p className="mt-1 text-[11px] leading-5 text-blue-700">
                This course video will use authenticated Cloudinary delivery.
              </p>

            </div>

          </div>
        )}

        {/* =================================================
            PROGRESS
        ================================================= */}

        {uploading && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-4">

            <div className="flex items-center justify-between gap-4">

              <div className="flex min-w-0 items-center gap-3">

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-[#071b41] text-white">

                  <Loader2
                    size={17}
                    className="animate-spin"
                  />

                </div>

                <div className="min-w-0">

                  <p className="text-xs font-black text-slate-700">
                    Uploading video...
                  </p>

                  <p className="mt-1 text-[11px] text-slate-400">
                    Direct browser-to-Cloudinary upload
                  </p>

                </div>

              </div>

              <span className="shrink-0 text-sm font-black text-[#071b41]">
                {progress}%
              </span>

            </div>

            <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">

              <div
                className="h-full rounded-full bg-[#071b41] transition-[width] duration-200"
                style={{
                  width:
                    `${progress}%`,
                }}
              />

            </div>

          </div>
        )}

        {/* =================================================
            ERROR
        ================================================= */}

        {errorMessage && (
          <div
            role="alert"
            aria-live="polite"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-red-200 bg-red-50 p-4"
          >

            <AlertCircle
              size={18}
              className="mt-0.5 shrink-0 text-red-600"
            />

            <p className="text-xs font-bold leading-5 text-red-700">
              {errorMessage}
            </p>

          </div>
        )}

        {/* =================================================
            SUCCESS
        ================================================= */}

        {successMessage && (
          <div
            role="status"
            aria-live="polite"
            className="mt-4 flex items-start gap-3 rounded-2xl border border-green-200 bg-green-50 p-4"
          >

            <CheckCircle2
              size={18}
              className="mt-0.5 shrink-0 text-green-600"
            />

            <p className="text-xs font-bold leading-5 text-green-700">
              {successMessage}
            </p>

          </div>
        )}

        {/* =================================================
            ACTIONS
        ================================================= */}

        {file && (
          <div className="mt-5 flex flex-col gap-3 sm:flex-row">

            {!uploading && (
              <button
                type="button"
                onClick={
                  handleRemove
                }
                className="order-2 inline-flex items-center justify-center gap-2 rounded-2xl border border-slate-200 bg-white px-5 py-3.5 text-sm font-black text-slate-600 transition hover:border-red-200 hover:bg-red-50 hover:text-red-600 sm:order-1"
              >
                <X
                  size={17}
                />

                Remove
              </button>
            )}

            <button
              type="button"
              onClick={
                handleUpload
              }
              disabled={
                uploading
              }
              className="order-1 inline-flex flex-1 items-center justify-center gap-2 rounded-2xl bg-[#071b41] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-slate-900/10 transition hover:-translate-y-0.5 hover:bg-[#0b2558] hover:shadow-xl disabled:cursor-not-allowed disabled:translate-y-0 disabled:opacity-60 sm:order-2"
            >

              {uploading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Uploading {progress}%
                </>
              ) : (
                <>
                  <UploadCloud
                    size={18}
                  />

                  Upload Video
                </>
              )}

            </button>

          </div>
        )}

      </div>

    </div>
  );
}