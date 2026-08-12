import { useRef, useState } from "react";
import { API_URL } from "../../config/api.js";
import {
  CheckCircle2,
  Image as ImageIcon,
  Loader2,
  UploadCloud,
  X,
} from "lucide-react";

export default function CloudinaryUploader({
  onUploadComplete,
}) {
  const fileInputRef = useRef(null);

  const [file, setFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState("");
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState("");
  const [successMessage, setSuccessMessage] =
    useState("");

  /* =========================================================
     SELECT FILE
  ========================================================= */

  const handleFileChange = (event) => {
    const selectedFile = event.target.files?.[0];

    setErrorMessage("");
    setSuccessMessage("");
    setProgress(0);

    if (!selectedFile) {
      return;
    }

    /* -------------------------------------------------------
       IMAGE TYPE CHECK
    ------------------------------------------------------- */

    const allowedTypes = [
      "image/jpeg",
      "image/jpg",
      "image/png",
      "image/webp",
    ];

    if (!allowedTypes.includes(selectedFile.type)) {
      setErrorMessage(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      );

      event.target.value = "";
      return;
    }

    /* -------------------------------------------------------
       IMAGE SIZE CHECK
    ------------------------------------------------------- */

    const maxSize =
      5 * 1024 * 1024;

    if (selectedFile.size > maxSize) {
      setErrorMessage(
        "Image size must be less than 5 MB."
      );

      event.target.value = "";
      return;
    }

    setFile(selectedFile);

    const objectUrl =
      URL.createObjectURL(selectedFile);

    setPreviewUrl(objectUrl);
  };

  /* =========================================================
     GET CLOUDINARY SIGNATURE
  ========================================================= */

  const getUploadSignature = async () => {
    const token = localStorage.getItem(
      "takshashila_admin_token"
    );

    if (!token) {
      throw new Error(
        "Admin session not found. Please login again."
      );
    }

    const response = await fetch(
      `${API_URL}/api/admin/cloudinary/signature`,
      {
        method: "POST",

        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },

        body: JSON.stringify({
          category: "course-thumbnail",
          resourceType: "image",
          folder:
            "takshashila-academy/course-thumbnails",
        }),
      }
    );

    const data = await response.json();

    if (!response.ok) {
      throw new Error(
        data.message ||
          "Unable to create Cloudinary signature."
      );
    }

    return data;
  };

  /* =========================================================
     DIRECT CLOUDINARY UPLOAD
  ========================================================= */

  const uploadToCloudinary = ({
    signature,
    timestamp,
    cloudName,
    apiKey,
    folder,
  }) => {
    return new Promise(
      (resolve, reject) => {
        const formData = new FormData();

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
          timestamp
        );

        formData.append(
          "signature",
          signature
        );

        formData.append(
          "folder",
          folder
        );

        const xhr = new XMLHttpRequest();

        xhr.open(
          "POST",
          `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`
        );

        /* ---------------------------------------------------
           UPLOAD PROGRESS
        --------------------------------------------------- */

        xhr.upload.onprogress = (
          event
        ) => {
          if (event.lengthComputable) {
            const percentage = Math.round(
              (event.loaded /
                event.total) *
                100
            );

            setProgress(
              percentage
            );
          }
        };

        /* ---------------------------------------------------
           SUCCESS
        --------------------------------------------------- */

        xhr.onload = () => {
          try {
            const data =
              JSON.parse(
                xhr.responseText
              );

            if (
              xhr.status >= 200 &&
              xhr.status < 300
            ) {
              resolve(data);
            } else {
              reject(
                new Error(
                  data.error?.message ||
                    "Cloudinary upload failed."
                )
              );
            }
          } catch {
            reject(
              new Error(
                "Invalid Cloudinary response."
              )
            );
          }
        };

        /* ---------------------------------------------------
           NETWORK ERROR
        --------------------------------------------------- */

        xhr.onerror = () => {
          reject(
            new Error(
              "Cloudinary upload failed due to a network error."
            )
          );
        };

        xhr.onabort = () => {
          reject(
            new Error(
              "Upload was cancelled."
            )
          );
        };

        xhr.send(formData);
      }
    );
  };

  /* =========================================================
     UPLOAD
  ========================================================= */

  const handleUpload = async () => {
    if (!file) {
      setErrorMessage(
        "Please select an image first."
      );

      return;
    }

    try {
      setUploading(true);
      setProgress(0);
      setErrorMessage("");
      setSuccessMessage("");

      /* -----------------------------------------------------
         GET SIGNATURE
      ----------------------------------------------------- */

      const signatureData =
        await getUploadSignature();

      /* -----------------------------------------------------
         DIRECT UPLOAD
      ----------------------------------------------------- */

      const uploadedFile =
        await uploadToCloudinary(
          signatureData
        );

      /* -----------------------------------------------------
         SUCCESS
      ----------------------------------------------------- */

      setProgress(100);

      setSuccessMessage(
        "Image uploaded successfully."
      );

      if (
        typeof onUploadComplete ===
        "function"
      ) {
        onUploadComplete({
          url: uploadedFile.secure_url,
          publicId:
            uploadedFile.public_id,
          width:
            uploadedFile.width,
          height:
            uploadedFile.height,
          format:
            uploadedFile.format,
          bytes:
            uploadedFile.bytes,
        });
      }

    } catch (error) {
      console.error(
        "Cloudinary Upload Error:",
        error
      );

      setErrorMessage(
        error.message ||
          "Image upload failed."
      );
    } finally {
      setUploading(false);
    }
  };

  /* =========================================================
     REMOVE SELECTED FILE
  ========================================================= */

  const handleRemove = () => {
    setFile(null);
    setPreviewUrl("");
    setProgress(0);
    setErrorMessage("");
    setSuccessMessage("");

    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-5">

      {/* =====================================================
          HEADER
      ===================================================== */}

      <div className="flex items-center gap-3">

        <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-100 text-[#071b41]">
          <ImageIcon size={20} />
        </div>

        <div>
          <h3 className="text-sm font-black text-[#071b41]">
            Course Thumbnail
          </h3>

          <p className="mt-1 text-xs text-slate-500">
            JPG, PNG, WEBP — Maximum 5 MB
          </p>
        </div>

      </div>

      {/* =====================================================
          PREVIEW
      ===================================================== */}

      {previewUrl && (
        <div className="relative mt-5 overflow-hidden rounded-xl border border-slate-200 bg-white">

          <img
            src={previewUrl}
            alt="Selected course thumbnail"
            className="h-56 w-full object-cover"
          />

          {!uploading && (
            <button
              type="button"
              onClick={handleRemove}
              className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full bg-white text-slate-700 shadow-lg transition hover:bg-red-50 hover:text-red-600"
              aria-label="Remove image"
            >
              <X size={18} />
            </button>
          )}

        </div>
      )}

      {/* =====================================================
          FILE SELECT
      ===================================================== */}

      {!file && (
        <button
          type="button"
          onClick={() =>
            fileInputRef.current?.click()
          }
          disabled={uploading}
          className="mt-5 flex w-full flex-col items-center justify-center rounded-xl border-2 border-dashed border-slate-300 bg-white px-5 py-10 text-center transition hover:border-[#071b41] hover:bg-blue-50/30 disabled:cursor-not-allowed disabled:opacity-60"
        >

          <UploadCloud
            size={30}
            className="text-[#071b41]"
          />

          <span className="mt-3 text-sm font-black text-slate-700">
            Choose Thumbnail
          </span>

          <span className="mt-1 text-xs text-slate-400">
            Click to select image
          </span>

        </button>
      )}

      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {/* =====================================================
          FILE NAME
      ===================================================== */}

      {file && (
        <div className="mt-4 rounded-xl bg-white p-4">

          <p className="truncate text-sm font-bold text-slate-700">
            {file.name}
          </p>

          <p className="mt-1 text-xs text-slate-400">
            {(file.size / 1024 / 1024).toFixed(2)} MB
          </p>

        </div>
      )}

      {/* =====================================================
          PROGRESS
      ===================================================== */}

      {uploading && (
        <div className="mt-5">

          <div className="mb-2 flex items-center justify-between text-xs font-bold text-slate-500">

            <span>
              Uploading to Cloudinary...
            </span>

            <span>
              {progress}%
            </span>

          </div>

          <div className="h-2 overflow-hidden rounded-full bg-slate-200">

            <div
              className="h-full rounded-full bg-[#071b41] transition-all duration-300"
              style={{
                width: `${progress}%`,
              }}
            />

          </div>

        </div>
      )}

      {/* =====================================================
          ERROR
      ===================================================== */}

      {errorMessage && (
        <div className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-semibold text-red-700">
          {errorMessage}
        </div>
      )}

      {/* =====================================================
          SUCCESS
      ===================================================== */}

      {successMessage && (
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm font-bold text-green-700">

          <CheckCircle2 size={18} />

          {successMessage}

        </div>
      )}

      {/* =====================================================
          UPLOAD BUTTON
      ===================================================== */}

      {file && (
        <button
          type="button"
          onClick={handleUpload}
          disabled={uploading}
          className="mt-5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#071b41] px-5 py-3.5 text-sm font-black text-white shadow-lg transition hover:bg-[#0b2558] disabled:cursor-not-allowed disabled:opacity-70"
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
              <UploadCloud size={18} />

              Upload to Cloudinary
            </>
          )}

        </button>
      )}

    </div>
  );
}