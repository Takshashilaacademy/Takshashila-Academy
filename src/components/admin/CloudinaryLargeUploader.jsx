import {
  useRef,
  useState,
} from "react";

import {
  AlertCircle,
  CheckCircle2,
  FileText,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

import { API_URL } from "../../config/api.js";

/* =========================================================
   UPLOAD LIMITS

   These are FRONTEND validation limits.

   IMPORTANT:
   Actual Cloudinary account limits still apply.
========================================================= */

const MAX_VIDEO_BYTES =
  5 * 1024 * 1024 * 1024; // 5 GB

const MAX_DOCUMENT_BYTES =
  500 * 1024 * 1024; // 500 MB

/* =========================================================
   CHUNK SIZE

   5 MB keeps each request below the current 10 MB
   limit shown by Cloudinary in your browser.

   This is especially important for your 20+ MB PDFs
   and long 1-2 hour videos. The browser sends the file
   directly to Cloudinary in small chunks; Render does not
   receive the actual file data.
========================================================= */

const CHUNK_SIZE =
  5 * 1024 * 1024; // 5 MB

/* =========================================================
   SIGNATURE REFRESH

   Cloudinary upload signatures are valid for 1 hour.

   We refresh before that so a very slow 5 GB upload does
   not continue using an old signature.
========================================================= */

const SIGNATURE_REFRESH_MS =
  45 * 60 * 1000;

/* =========================================================
   RETRY CONFIG
========================================================= */

const MAX_CHUNK_RETRIES = 3;

/* =========================================================
   FORMAT BYTES
========================================================= */

const formatBytes = (
  bytes
) => {
  const value =
    Number(bytes);

  if (
    !Number.isFinite(
      value
    ) ||
    value <= 0
  ) {
    return "0 B";
  }

  if (
    value >=
    1024 *
      1024 *
      1024
  ) {
    return `${(
      value /
      (1024 *
        1024 *
        1024)
    ).toFixed(2)} GB`;
  }

  if (
    value >=
    1024 *
      1024
  ) {
    return `${(
      value /
      (1024 *
        1024)
    ).toFixed(2)} MB`;
  }

  if (
    value >=
    1024
  ) {
    return `${(
      value /
      1024
    ).toFixed(2)} KB`;
  }

  return `${value} B`;
};

/* =========================================================
   GET ADMIN TOKEN
========================================================= */

const getAdminToken =
  () => {
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
   CREATE CLOUDINARY SIGNATURE

   Render backend receives only a tiny JSON request.

   The actual file NEVER goes to Render.
========================================================= */

const getUploadSignature =
  async (
    category
  ) => {
    const token =
      getAdminToken();

    if (!token) {
      throw new Error(
        "Admin authentication required. Please login again."
      );
    }

    let response;

    try {
      response =
        await fetch(
          `${API_URL}/api/admin/cloudinary/signature`,
          {
            method: "POST",

            headers: {
              "Content-Type":
                "application/json",

              Accept:
                "application/json",

              Authorization:
                `Bearer ${token}`,
            },

            body: JSON.stringify({
              category,
            }),
          }
        );
    } catch {
      throw new Error(
        "Backend se Cloudinary signature nahi mil saki."
      );
    }

    let data = {};

    try {
      const text =
        await response.text();

      data = text
        ? JSON.parse(text)
        : {};
    } catch {
      data = {};
    }

    if (!response.ok) {
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
        "Cloudinary signature response incomplete hai."
      );
    }

    return data;
  };

/* =========================================================
   CLOUDINARY CHUNK REQUEST

   Sends ONE chunk directly to Cloudinary.

   Render server is NOT involved in the file transfer.
========================================================= */

const uploadChunk =
  ({
    file,
    start,
    end,
    total,
    uploadId,
    signatureData,
    onProgress,
  }) => {
    return new Promise(
      (
        resolve,
        reject
      ) => {
        const chunk =
          file.slice(
            start,
            end + 1
          );

        const {
          signature,
          timestamp,
          cloudName,
          apiKey,
          folder,
          resourceType,
          type,
        } =
          signatureData;

        const formData =
          new FormData();

        formData.append(
          "file",
          chunk,
          file.name
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

        formData.append(
          "folder",
          folder
        );

        formData.append(
          "type",
          type
        );

        const endpoint =
          `https://api.cloudinary.com/v1_1/${encodeURIComponent(
            cloudName
          )}/${resourceType}/upload`;

        const xhr =
          new XMLHttpRequest();

        xhr.open(
          "POST",
          endpoint,
          true
        );

        /* -----------------------------------------------------
           CHUNK IDENTIFIER

           Same upload ID must be used for every chunk.
        ----------------------------------------------------- */

        xhr.setRequestHeader(
          "X-Unique-Upload-Id",
          uploadId
        );

        /* -----------------------------------------------------
           CONTENT RANGE

           Example:

           bytes 0-20971519/5242880000
        ----------------------------------------------------- */

        xhr.setRequestHeader(
          "Content-Range",
          `bytes ${start}-${end}/${total}`
        );

        /* -----------------------------------------------------
           PROGRESS

           Convert chunk progress into overall file progress.
        ----------------------------------------------------- */

        xhr.upload.onprogress =
          (
            event
          ) => {
            if (
              !event.lengthComputable
            ) {
              return;
            }

            const uploadedBefore =
              start;

            const uploadedCurrent =
              Math.min(
                event.loaded,
                end -
                  start +
                  1
              );

            const overall =
              Math.round(
                (
                  (
                    uploadedBefore +
                    uploadedCurrent
                  ) /
                  total
                ) *
                  100
              );

            if (
              typeof onProgress ===
              "function"
            ) {
              onProgress(
                Math.min(
                  99,
                  overall
                )
              );
            }
          };

        /* -----------------------------------------------------
           SUCCESS / RESPONSE
        ----------------------------------------------------- */

        xhr.onload =
          () => {
            let data = {};

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
                  "Cloudinary response invalid hai."
                )
              );

              return;
            }

            if (
              xhr.status >= 200 &&
              xhr.status < 300
            ) {
              resolve(
                data
              );

              return;
            }

            reject(
              new Error(
                data?.error?.message ||
                  `Cloudinary upload failed (${xhr.status}).`
              )
            );
          };

        /* -----------------------------------------------------
           NETWORK ERROR
        ----------------------------------------------------- */

        xhr.onerror =
          () => {
            reject(
              new Error(
                "Network error during Cloudinary upload."
              )
            );
          };

        /* -----------------------------------------------------
           ABORT
        ----------------------------------------------------- */

        xhr.onabort =
          () => {
            reject(
              new Error(
                "Upload cancelled."
              )
            );
          };

        xhr.send(
          formData
        );
      }
    );
  };

/* =========================================================
   COMPONENT
========================================================= */

export default function CloudinaryLargeUploader({
  category,
  accept,
  label,
  description,
  maxBytes,
  maxLabel,
  icon = "file",
  onUploadComplete,
}) {
  const inputRef =
    useRef(null);

  const abortRef =
    useRef(null);

  const [file, setFile] =
    useState(null);

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

  const [
    uploadedBytes,
    setUploadedBytes,
  ] = useState(0);

  /* =======================================================
     FILE SELECT
  ======================================================= */

  const handleFileChange =
    (
      event
    ) => {
      const selectedFile =
        event.target
          ?.files?.[0];

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      setProgress(
        0
      );

      setUploadedBytes(
        0
      );

      if (!selectedFile) {
        setFile(
          null
        );

        return;
      }

      /* -----------------------------------------------------
         SIZE CHECK
      ----------------------------------------------------- */

      if (
        selectedFile.size >
        maxBytes
      ) {
        setFile(
          null
        );

        if (
          inputRef.current
        ) {
          inputRef.current.value =
            "";
        }

        setErrorMessage(
          `${label} ka maximum size ${maxLabel} hai. Selected file ${formatBytes(
            selectedFile.size
          )} hai.`
        );

        return;
      }

      setFile(
        selectedFile
      );
    };

  /* =======================================================
     REMOVE FILE
  ======================================================= */

  const handleRemove =
    () => {
      if (
        abortRef.current
      ) {
        try {
          abortRef.current();
        } catch {
          // Ignore abort errors.
        }
      }

      setFile(
        null
      );

      setProgress(
        0
      );

      setUploadedBytes(
        0
      );

      setErrorMessage(
        ""
      );

      setSuccessMessage(
        ""
      );

      if (
        inputRef.current
      ) {
        inputRef.current.value =
          "";
      }
    };

  /* =======================================================
     UPLOAD
  ======================================================= */

  const handleUpload =
    async () => {
      if (!file) {
        setErrorMessage(
          `Please select ${label.toLowerCase()} first.`
        );

        return;
      }

      if (uploading) {
        return;
      }

      try {
        setUploading(
          true
        );

        setProgress(
          0
        );

        setUploadedBytes(
          0
        );

        setErrorMessage(
          ""
        );

        setSuccessMessage(
          ""
        );

        /* ---------------------------------------------------
           UNIQUE UPLOAD ID

           crypto.randomUUID() is available in modern browsers.
        --------------------------------------------------- */

        const uploadId =
          globalThis.crypto?.randomUUID
            ? globalThis.crypto.randomUUID()
            : `${Date.now()}-${Math.random()
                .toString(36)
                .slice(2)}`;

        /* ---------------------------------------------------
           GET FIRST SIGNATURE
        --------------------------------------------------- */

        let signatureData =
          await getUploadSignature(
            category
          );

        let signatureCreatedAt =
          Date.now();

        let finalResponse =
          null;

        /* ---------------------------------------------------
           CHUNK LOOP
        --------------------------------------------------- */

        for (
          let start = 0;
          start < file.size;
          start += CHUNK_SIZE
        ) {
          /* -----------------------------------------------
             REFRESH SIGNATURE BEFORE EXPIRY

             Signed Cloudinary signatures are time-limited.
          ----------------------------------------------- */

          if (
            Date.now() -
              signatureCreatedAt >
            SIGNATURE_REFRESH_MS
          ) {
            signatureData =
              await getUploadSignature(
                category
              );

            signatureCreatedAt =
              Date.now();
          }

          const end =
            Math.min(
              start +
                CHUNK_SIZE -
                1,
              file.size -
                1
            );

          let response =
            null;

          let lastError =
            null;

          /* -----------------------------------------------
             RETRY SAME CHUNK

             Network failure should not restart the whole
             video.
          ----------------------------------------------- */

          for (
            let attempt = 1;
            attempt <=
              MAX_CHUNK_RETRIES;
            attempt++
          ) {
            try {
              response =
                await uploadChunk({
                  file,

                  start,

                  end,

                  total:
                    file.size,

                  uploadId,

                  signatureData,

                  onProgress:
                    (
                      value
                    ) => {
                      setProgress(
                        value
                      );
                    },
                });

              lastError =
                null;

              break;
            } catch (
              error
            ) {
              lastError =
                error;

              console.error(
                `Cloudinary chunk ${start}-${end} attempt ${attempt} failed:`,
                error
              );

              if (
                attempt <
                MAX_CHUNK_RETRIES
              ) {
                await new Promise(
                  (
                    resolve
                  ) =>
                    setTimeout(
                      resolve,
                      1000 *
                        attempt
                    )
                );
              }
            }
          }

          if (
            lastError
          ) {
            throw lastError;
          }

          finalResponse =
            response;

          const completedBytes =
            end + 1;

          setUploadedBytes(
            completedBytes
          );

          setProgress(
            Math.min(
              99,
              Math.round(
                (
                  completedBytes /
                  file.size
                ) *
                  100
              )
            )
          );
        }

        /* ---------------------------------------------------
           FINAL RESPONSE CHECK
        --------------------------------------------------- */

        if (
          !finalResponse
        ) {
          throw new Error(
            "Cloudinary upload response missing hai."
          );
        }

        if (
          finalResponse.done ===
          false
        ) {
          throw new Error(
            "Cloudinary ne upload complete confirm nahi kiya."
          );
        }

        const secureUrl =
          finalResponse.secure_url ||
          "";

        const publicId =
          finalResponse.public_id ||
          "";

        if (
          !secureUrl ||
          !publicId
        ) {
          throw new Error(
            "Cloudinary upload complete hua, lekin public ID ya secure URL missing hai."
          );
        }

        /* ---------------------------------------------------
           SUCCESS
        --------------------------------------------------- */

        setUploadedBytes(
          file.size
        );

        setProgress(
          100
        );

        setSuccessMessage(
          `${label} successfully uploaded.`
        );

        if (
          typeof onUploadComplete ===
          "function"
        ) {
          onUploadComplete({
            url:
              secureUrl,

            publicId,

            secureUrl,

            format:
              finalResponse.format ||
              "",

            bytes:
              finalResponse.bytes ||
              file.size,

            resourceType:
              finalResponse.resource_type ||
              "",

            duration:
              finalResponse.duration ||
              0,

            width:
              finalResponse.width ||
              0,

            height:
              finalResponse.height ||
              0,

            fileType:
              file.type ||
              "",
          });
        }
      } catch (
        error
      ) {
        console.error(
          "Large Cloudinary Upload Error:",
          error
        );

        setErrorMessage(
          error?.message ||
            `${label} upload failed.`
        );
      } finally {
        abortRef.current =
          null;

        setUploading(
          false
        );
      }
    };

  /* =======================================================
     UI
  ======================================================= */

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      {/* ===================================================
          HEADER
      =================================================== */}

      <div className="flex items-start gap-3">

        <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-blue-100 text-[#071b41]">

          {icon === "video" ? (
            <UploadCloud
              size={21}
            />
          ) : (
            <FileText
              size={21}
            />
          )}

        </div>

        <div className="min-w-0">

          <h3 className="text-sm font-black text-[#071b41]">
            {label}
          </h3>

          <p className="mt-1 text-xs leading-5 text-slate-500">
            {description}
          </p>

          <p className="mt-1 text-[11px] font-bold text-slate-400">
            Maximum size:{" "}
            {maxLabel}
          </p>

        </div>

      </div>

      {/* ===================================================
          SELECT
      =================================================== */}

      {!file && (
        <button
          type="button"
          onClick={() =>
            inputRef.current?.click()
          }
          disabled={
            uploading
          }
          className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-center transition hover:border-[#071b41] hover:bg-blue-50/30 disabled:cursor-not-allowed disabled:opacity-60"
        >

          <UploadCloud
            size={31}
            className="text-[#071b41]"
          />

          <span className="mt-3 text-sm font-black text-slate-700">
            Choose{" "}
            {label}
          </span>

          <span className="mt-1 text-xs text-slate-400">
            Click to select file
          </span>

        </button>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={
          handleFileChange
        }
        disabled={
          uploading
        }
        className="hidden"
      />

      {/* ===================================================
          SELECTED FILE
      =================================================== */}

      {file && (
        <div className="mt-5 rounded-xl border border-slate-200 bg-white p-4">

          <div className="flex items-start justify-between gap-3">

            <div className="min-w-0">

              <p className="truncate text-sm font-black text-slate-700">
                {file.name}
              </p>

              <p className="mt-1 text-xs font-semibold text-slate-400">
                {formatBytes(
                  file.size
                )}
              </p>

            </div>

            {!uploading && (
              <button
                type="button"
                onClick={
                  handleRemove
                }
                className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-slate-100 text-slate-600 transition hover:bg-red-50 hover:text-red-600"
                aria-label="Remove file"
              >
                <X
                  size={17}
                />
              </button>
            )}

          </div>

        </div>
      )}

      {/* ===================================================
          PROGRESS
      =================================================== */}

      {uploading && (
        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between gap-3 text-xs font-bold text-slate-500">

            <span>
              Uploading directly to Cloudinary...
            </span>

            <span>
              {progress}%
            </span>

          </div>

          <div className="h-3 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-[#071b41] transition-[width] duration-200"
              style={{
                width:
                  `${progress}%`,
              }}
            />

          </div>

          <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-slate-400">

            <span>
              {formatBytes(
                uploadedBytes
              )}
            </span>

            <span>
              of{" "}
              {formatBytes(
                file?.size
              )}
            </span>

          </div>

          <div className="mt-3 flex items-center gap-2 text-xs font-semibold text-slate-500">

            <Loader2
              size={14}
              className="animate-spin"
            />

            Large file upload is running in chunks.
            Please keep this tab open.

          </div>

        </div>
      )}

      {/* ===================================================
          ERROR
      =================================================== */}

      {errorMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-red-200 bg-red-50 p-4 text-sm font-semibold text-red-700">

          <AlertCircle
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {errorMessage}
          </span>

        </div>
      )}

      {/* ===================================================
          SUCCESS
      =================================================== */}

      {successMessage && (
        <div className="mt-5 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 text-sm font-semibold text-green-700">

          <CheckCircle2
            size={18}
            className="mt-0.5 shrink-0"
          />

          <span>
            {successMessage}
          </span>

        </div>
      )}

      {/* ===================================================
          UPLOAD BUTTON
      =================================================== */}

      {file && !successMessage && (
        <button
          type="button"
          onClick={
            handleUpload
          }
          disabled={
            uploading
          }
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b41] px-5 py-3.5 text-sm font-black text-white shadow-lg shadow-[#071b41]/15 transition hover:bg-[#0b275d] disabled:cursor-not-allowed disabled:opacity-60"
        >

          {uploading ? (
            <>
              <Loader2
                size={18}
                className="animate-spin"
              />

              Uploading...
            </>
          ) : (
            <>
              <UploadCloud
                size={18}
              />

              Upload to Cloudinary
            </>
          )}

        </button>
      )}

    </div>
  );
}

/* =========================================================
   EXPORTED LIMITS

   Useful if other admin components need these values.
========================================================= */

export {
  MAX_VIDEO_BYTES,
  MAX_DOCUMENT_BYTES,
  CHUNK_SIZE,
};