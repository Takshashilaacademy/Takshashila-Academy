import { API_BASE } from "../config/api.js";
/* =========================================================
   CLOUDINARY SERVICE
========================================================= */

/*
  This service handles:

  1. Getting a secure upload signature from backend
  2. Uploading images
  3. Uploading protected course videos
  4. Uploading protected course materials
  5. Returning normalized Cloudinary information

  IMPORTANT:

  Cloudinary API SECRET is NEVER used here.

  The secret stays on the backend.
*/

/* =========================================================
   API BASE URL
========================================================= */

const API_BASE_URL =
  API_BASE;

/* =========================================================
   GET ADMIN TOKEN
========================================================= */

const getAdminToken = () => {
  /*
    Keep this compatible with common localStorage names.
  */

  return (
    localStorage.getItem(
      "adminToken"
    ) ||
    localStorage.getItem(
      "admin_token"
    ) ||
    localStorage.getItem(
      "token"
    ) ||
    ""
  );
};

/* =========================================================
   GET CLOUDINARY SIGNATURE
========================================================= */

const getUploadSignature =
  async ({
    category,
    resourceType,
    folder,
  }) => {
    const token =
      getAdminToken();

    if (!token) {
      throw new Error(
        "Admin authentication token is missing."
      );
    }

    const response =
      await fetch(
        `${API_BASE_URL}/admin/cloudinary/signature`,
        {
          method: "POST",

          headers: {
            "Content-Type":
              "application/json",

            Authorization:
              `Bearer ${token}`,
          },

          body: JSON.stringify({
            category,

            resourceType,

            folder,
          }),
        }
      );

    let data = null;

    try {
      data =
        await response.json();
    } catch {
      data = null;
    }

    if (!response.ok) {
      throw new Error(
        data?.message ||
          "Unable to create Cloudinary upload signature."
      );
    }

    if (
      !data?.success ||
      !data?.signature ||
      !data?.timestamp ||
      !data?.cloudName ||
      !data?.apiKey
    ) {
      throw new Error(
        "Invalid Cloudinary signature response."
      );
    }

    return data;
  };

/* =========================================================
   UPLOAD FILE TO CLOUDINARY
========================================================= */

const uploadToCloudinary =
  async ({
    file,
    category,
    resourceType,
    folder,
    onProgress,
  }) => {
    /* -----------------------------------------------------
       FILE VALIDATION
    ----------------------------------------------------- */

    if (!(file instanceof File)) {
      throw new Error(
        "A valid file is required."
      );
    }

    /* -----------------------------------------------------
       RESOURCE TYPE
    ----------------------------------------------------- */

    const normalizedResourceType =
      String(
        resourceType || ""
      )
        .trim()
        .toLowerCase();

    if (
      ![
        "image",
        "video",
        "raw",
      ].includes(
        normalizedResourceType
      )
    ) {
      throw new Error(
        "Invalid Cloudinary resource type."
      );
    }

    /* -----------------------------------------------------
       GET SIGNATURE
    ----------------------------------------------------- */

    const signature =
      await getUploadSignature({
        category,

        resourceType:
          normalizedResourceType,

        folder,
      });

    /* -----------------------------------------------------
       CLOUDINARY UPLOAD URL
    ----------------------------------------------------- */

    const uploadUrl =
      `https://api.cloudinary.com/v1_1/${encodeURIComponent(
        signature.cloudName
      )}/${normalizedResourceType}/upload`;

    /* -----------------------------------------------------
       FORM DATA
    ----------------------------------------------------- */

    const formData =
      new FormData();

    formData.append(
      "file",
      file
    );

    formData.append(
      "api_key",
      signature.apiKey
    );

    formData.append(
      "timestamp",
      String(
        signature.timestamp
      )
    );

    formData.append(
      "signature",
      signature.signature
    );

    formData.append(
      "folder",
      signature.folder
    );

    /*
      Backend decides whether this is:

      upload
      OR
      authenticated
    */

    if (signature.type) {
      formData.append(
        "type",
        signature.type
      );
    }

    /* -----------------------------------------------------
       XHR

       XMLHttpRequest is used instead of fetch so that
       upload progress can be displayed in the admin UI.
    ----------------------------------------------------- */

    const result =
      await new Promise(
        (
          resolve,
          reject
        ) => {
          const xhr =
            new XMLHttpRequest();

          xhr.open(
            "POST",
            uploadUrl
          );

          /* -----------------------------------------------
             PROGRESS
          ------------------------------------------------ */

          xhr.upload.onprogress =
            (
              event
            ) => {
              if (
                !event.lengthComputable
              ) {
                return;
              }

              const percentage =
                Math.round(
                  (
                    event.loaded /
                    event.total
                  ) *
                    100
                );

              if (
                typeof onProgress ===
                "function"
              ) {
                onProgress(
                  percentage
                );
              }
            };

          /* -----------------------------------------------
             SUCCESS
          ------------------------------------------------ */

          xhr.onload =
            () => {
              let data =
                null;

              try {
                data =
                  JSON.parse(
                    xhr.responseText
                  );
              } catch {
                data = null;
              }

              if (
                xhr.status >=
                  200 &&
                xhr.status <
                  300 &&
                data?.secure_url
              ) {
                resolve(
                  data
                );

                return;
              }

              reject(
                new Error(
                  data?.error
                    ?.message ||
                    "Cloudinary upload failed."
                )
              );
            };

          /* -----------------------------------------------
             NETWORK ERROR
          ------------------------------------------------ */

          xhr.onerror =
            () => {
              reject(
                new Error(
                  "Network error while uploading to Cloudinary."
                )
              );
            };

          /* -----------------------------------------------
             ABORT
          ------------------------------------------------ */

          xhr.onabort =
            () => {
              reject(
                new Error(
                  "Cloudinary upload was cancelled."
                )
              );
            };

          /* -----------------------------------------------
             SEND
          ------------------------------------------------ */

          xhr.send(
            formData
          );
        }
      );

    /* -----------------------------------------------------
       NORMALIZED RESPONSE
    ----------------------------------------------------- */

    return {
      success: true,

      secureUrl:
        result.secure_url,

      publicId:
        result.public_id,

      resourceType:
        result.resource_type,

      type:
        result.type ||
        signature.type ||
        null,

      format:
        result.format ||
        null,

      bytes:
        result.bytes ||
        file.size,

      originalFilename:
        file.name,

      duration:
        result.duration ||
        null,

      width:
        result.width ||
        null,

      height:
        result.height ||
        null,
    };
  };

/* =========================================================
   UPLOAD COURSE VIDEO
========================================================= */

export const uploadCourseVideo =
  async ({
    file,
    courseId,
    onProgress,
  }) => {
    if (!courseId) {
      throw new Error(
        "Course ID is required."
      );
    }

    if (
      !file?.type?.startsWith(
        "video/"
      )
    ) {
      throw new Error(
        "Please select a valid video file."
      );
    }

    return uploadToCloudinary({
      file,

      category:
        "course-video",

      resourceType:
        "video",

      folder:
        `takshashila-academy/courses/${courseId}/videos`,

      onProgress,
    });
  };

/* =========================================================
   UPLOAD COURSE MATERIAL
========================================================= */

export const uploadCourseMaterial =
  async ({
    file,
    courseId,
    onProgress,
  }) => {
    if (!courseId) {
      throw new Error(
        "Course ID is required."
      );
    }

    if (!file) {
      throw new Error(
        "Material file is required."
      );
    }

    return uploadToCloudinary({
      file,

      category:
        "course-material",

      resourceType:
        "raw",

      folder:
        `takshashila-academy/courses/${courseId}/materials`,

      onProgress,
    });
  };

/* =========================================================
   UPLOAD COURSE THUMBNAIL
========================================================= */

export const uploadCourseThumbnail =
  async ({
    file,
    courseId,
    onProgress,
  }) => {
    if (!courseId) {
      throw new Error(
        "Course ID is required."
      );
    }

    if (
      !file?.type?.startsWith(
        "image/"
      )
    ) {
      throw new Error(
        "Please select a valid image file."
      );
    }

    return uploadToCloudinary({
      file,

      category:
        "course-thumbnail",

      resourceType:
        "image",

      folder:
        `takshashila-academy/courses/${courseId}/images`,

      onProgress,
    });
  };

/* =========================================================
   EXPORT DEFAULT
========================================================= */

const cloudinaryService = {
  uploadCourseVideo,

  uploadCourseMaterial,

  uploadCourseThumbnail,
};

export default cloudinaryService;