import cloudinary from "../config/cloudinary.js";

/* =========================================================
   CLOUDINARY SECURE MEDIA HELPERS

   IMPORTANT:

   These helpers run ONLY on the backend.

   NEVER expose:
   - CLOUDINARY_API_SECRET
   - Cloudinary signing credentials
   - Backend Cloudinary configuration

   to the frontend.
========================================================= */

/* =========================================================
   ALLOWED RESOURCE TYPES
========================================================= */

const ALLOWED_RESOURCE_TYPES = [
  "image",
  "video",
  "raw",
];

/* =========================================================
   NORMALIZE RESOURCE TYPE
========================================================= */

const normalizeResourceType = (
  resourceType
) => {
  const normalized =
    String(
      resourceType || ""
    )
      .trim()
      .toLowerCase();

  if (
    !ALLOWED_RESOURCE_TYPES.includes(
      normalized
    )
  ) {
    throw new Error(
      "Invalid Cloudinary resource type."
    );
  }

  return normalized;
};

/* =========================================================
   NORMALIZE PUBLIC ID
========================================================= */

const normalizePublicId = (
  publicId
) => {
  if (
    typeof publicId !==
      "string" ||
    !publicId.trim()
  ) {
    throw new Error(
      "Cloudinary public ID is required."
    );
  }

  const normalized =
    publicId
      .trim()
      .replace(
        /^\/+/,
        ""
      );

  /*
   * Public IDs must not contain a full URL.

   * This prevents accidental misuse of this helper
   * with arbitrary external URLs.
   */

  if (
    /^https?:\/\//i.test(
      normalized
    )
  ) {
    throw new Error(
      "Cloudinary public ID must not be a full URL."
    );
  }

  return normalized;
};

/* =========================================================
   NORMALIZE FORMAT
========================================================= */

const normalizeFormat = (
  format
) => {
  if (
    format ===
      undefined ||
    format ===
      null ||
    format ===
      ""
  ) {
    return undefined;
  }

  if (
    typeof format !==
    "string"
  ) {
    throw new Error(
      "Invalid Cloudinary format."
    );
  }

  const normalized =
    format
      .trim()
      .replace(
        /^\./,
        ""
      )
      .toLowerCase();

  /*
   * Only simple file extensions are accepted.

   * Examples:
   * pdf
   * mp4
   * webm
   * jpg
   * png
   */

  if (
    !/^[a-z0-9]{1,10}$/.test(
      normalized
    )
  ) {
    throw new Error(
      "Invalid Cloudinary format."
    );
  }

  return normalized;
};

/* =========================================================
   CREATE AUTHENTICATED MEDIA URL

   Intended for assets uploaded with:

   type: "authenticated"

   Authenticated Cloudinary assets require signed
   delivery URLs.

   Example:

   {
     publicId: "courses/course-1/video-1",
     resourceType: "video"
   }

   IMPORTANT:

   The asset itself MUST have been uploaded as:

   type: "authenticated"

   Signing a normal public "upload" asset does NOT make
   that asset private.
========================================================= */

export const createAuthenticatedMediaUrl =
  ({
    publicId,
    resourceType,
    format = undefined,
  }) => {
    const normalizedPublicId =
      normalizePublicId(
        publicId
      );

    const normalizedResourceType =
      normalizeResourceType(
        resourceType
      );

    const normalizedFormat =
      normalizeFormat(
        format
      );

    const options = {
      resource_type:
        normalizedResourceType,

      type:
        "authenticated",

      sign_url:
        true,

      secure:
        true,
    };

    /* =====================================================
       FORMAT

       Useful for raw/document assets such as PDF files.
    ===================================================== */

    if (
      normalizedFormat
    ) {
      options.format =
        normalizedFormat;
    }

    const url =
      cloudinary.url(
        normalizedPublicId,
        options
      );

    if (
      typeof url !==
        "string" ||
      !url.trim()
    ) {
      throw new Error(
        "Cloudinary did not return a valid authenticated URL."
      );
    }

    return url;
  };

/* =========================================================
   CREATE SIGNED UPLOAD DELIVERY URL

   This helper is intentionally separate.

   IMPORTANT:

   type: "upload" assets are normally publicly deliverable.

   sign_url: true signs the generated URL, but signing a
   public upload asset does NOT convert it into an
   authenticated/private asset.

   Therefore this helper should NOT be used for paid
   course videos/PDFs.
========================================================= */

export const createSignedUploadUrl =
  ({
    publicId,
    resourceType,
    format = undefined,
  }) => {
    const normalizedPublicId =
      normalizePublicId(
        publicId
      );

    const normalizedResourceType =
      normalizeResourceType(
        resourceType
      );

    const normalizedFormat =
      normalizeFormat(
        format
      );

    const options = {
      resource_type:
        normalizedResourceType,

      type:
        "upload",

      sign_url:
        true,

      secure:
        true,
    };

    if (
      normalizedFormat
    ) {
      options.format =
        normalizedFormat;
    }

    const url =
      cloudinary.url(
        normalizedPublicId,
        options
      );

    if (
      typeof url !==
        "string" ||
      !url.trim()
    ) {
      throw new Error(
        "Cloudinary did not return a valid signed URL."
      );
    }

    return url;
  };

/* =========================================================
   DETECT CLOUDINARY DELIVERY TYPE

   Returns:

   "upload"
   "private"
   "authenticated"

   or:

   null
========================================================= */

export const getCloudinaryDeliveryType =
  (
    mediaUrl
  ) => {
    if (
      typeof mediaUrl !==
        "string" ||
      !mediaUrl.trim()
    ) {
      return null;
    }

    const match =
      mediaUrl.match(
        /\/(?:image|video|raw)\/(upload|private|authenticated)\//
      );

    if (!match) {
      return null;
    }

    return match[1];
  };

/* =========================================================
   CHECK AUTHENTICATED CLOUDINARY URL
========================================================= */

export const isAuthenticatedCloudinaryUrl =
  (
    mediaUrl
  ) => {
    return (
      getCloudinaryDeliveryType(
        mediaUrl
      ) ===
      "authenticated"
    );
  };

/* =========================================================
   CHECK CLOUDINARY DELIVERY URL
========================================================= */

export const isCloudinaryDeliveryUrl =
  (
    mediaUrl
  ) => {
    if (
      typeof mediaUrl !==
        "string" ||
      !mediaUrl.trim()
    ) {
      return false;
    }

    try {
      const parsed =
        new URL(
          mediaUrl
        );

      return (
        parsed.protocol ===
          "https:" &&
        parsed.hostname.endsWith(
          ".cloudinary.com"
        )
      );
    } catch {
      return false;
    }
  };

/* =========================================================
   CHECK SECURE AUTHENTICATED MEDIA URL

   Useful for backend validation/tests.

   A URL must:

   1. Be HTTPS
   2. Be a Cloudinary URL
   3. Use authenticated delivery type
========================================================= */

export const isSecureAuthenticatedMediaUrl =
  (
    mediaUrl
  ) => {
    return (
      isCloudinaryDeliveryUrl(
        mediaUrl
      ) &&
      isAuthenticatedCloudinaryUrl(
        mediaUrl
      )
    );
  };