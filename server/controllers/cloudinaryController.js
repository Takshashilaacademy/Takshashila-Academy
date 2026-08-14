import cloudinary from "../config/cloudinary.js";

/* =========================================================
   CLOUDINARY UPLOAD SIGNATURE CONTROLLER

   POST /api/admin/cloudinary/signature

   IMPORTANT:
   - CLOUDINARY_API_SECRET is NEVER sent to frontend.
   - Course videos use authenticated delivery.
   - Course materials use authenticated delivery.
   - Thumbnails/images use normal upload delivery.
   - Frontend cannot choose arbitrary resource type.
   - Frontend cannot choose arbitrary folder.
========================================================= */


/* =========================================================
   ENVIRONMENT
========================================================= */

const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET;

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME;

const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY;


/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_MEDIA_CATEGORIES = [
  "course-video",
  "course-material",
  "course-thumbnail",
  "image",
];


const CATEGORY_CONFIG = {
  "course-video": {
    resourceType:
      "video",

    deliveryType:
      "authenticated",

    folder:
      "takshashila-academy/courses/videos",
  },


  "course-material": {
    resourceType:
      "raw",

    deliveryType:
      "authenticated",

    folder:
      "takshashila-academy/courses/materials",
  },


  "course-thumbnail": {
    resourceType:
      "image",

    deliveryType:
      "upload",

    folder:
      "takshashila-academy/courses/images",
  },


  image: {
    resourceType:
      "image",

    deliveryType:
      "upload",

    folder:
      "takshashila-academy/courses/images",
  },
};


/* =========================================================
   NORMALIZE STRING
========================================================= */

const normalizeString = (
  value
) => {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value.trim();
};


/* =========================================================
   VALIDATE ADMIN
========================================================= */

const validateAdmin = (
  req
) => {
  if (
    !req ||
    !req.admin
  ) {
    return false;
  }


  if (
    req.admin.role !==
    "admin"
  ) {
    return false;
  }


  if (
    req.admin.isActive ===
    false
  ) {
    return false;
  }


  return true;
};


/* =========================================================
   CHECK CLOUDINARY CONFIG
========================================================= */

const isCloudinaryConfigured =
  () => {
    return Boolean(
      CLOUDINARY_API_SECRET &&
      CLOUDINARY_CLOUD_NAME &&
      CLOUDINARY_API_KEY
    );
  };


/* =========================================================
   GET CATEGORY CONFIG
========================================================= */

const getCategoryConfig = (
  category
) => {
  const normalizedCategory =
    normalizeString(
      category
    ).toLowerCase();


  if (
    !ALLOWED_MEDIA_CATEGORIES.includes(
      normalizedCategory
    )
  ) {
    return null;
  }


  return {
    category:
      normalizedCategory,

    ...CATEGORY_CONFIG[
      normalizedCategory
    ],
  };
};


/* =========================================================
   CREATE UPLOAD SIGNATURE
========================================================= */

export const createUploadSignature =
  async (
    req,
    res
  ) => {
    try {

      /* ===================================================
         ADMIN CHECK
      =================================================== */

      if (
        !validateAdmin(
          req
        )
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "ADMIN_ACCESS_REQUIRED",

          message:
            "Active admin access is required.",
        });
      }


      /* ===================================================
         CLOUDINARY CONFIG CHECK
      =================================================== */

      if (
        !isCloudinaryConfigured()
      ) {
        console.error(
          "Cloudinary signature failed: required environment variables are missing."
        );

        return res.status(500).json({
          success:
            false,

          code:
            "CLOUDINARY_NOT_CONFIGURED",

          message:
            "Cloudinary service is not configured.",
        });
      }


      /* ===================================================
         REQUEST BODY
      =================================================== */

      const category =
        normalizeString(
          req.body?.category
        ).toLowerCase();


      /* ===================================================
         CATEGORY REQUIRED
      =================================================== */

      if (
        !category
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "MEDIA_CATEGORY_REQUIRED",

          message:
            "Media category is required.",
        });
      }


      /* ===================================================
         CATEGORY CONFIG
      =================================================== */

      const config =
        getCategoryConfig(
          category
        );


      if (
        !config
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_MEDIA_CATEGORY",

          message:
            "Invalid media category.",
        });
      }


      /* ===================================================
         PROTECTED MEDIA
      =================================================== */

      const isProtectedMedia =
        category ===
          "course-video" ||
        category ===
          "course-material";


      if (
        isProtectedMedia &&
        config.deliveryType !==
          "authenticated"
      ) {
        console.error(
          "Cloudinary security configuration error:",
          category
        );

        return res.status(500).json({
          success:
            false,

          code:
            "INVALID_PROTECTED_MEDIA_CONFIGURATION",

          message:
            "Protected media configuration is invalid.",
        });
      }


      /* ===================================================
         TIMESTAMP
      =================================================== */

      const timestamp =
        Math.floor(
          Date.now() /
            1000
        );


      /* ===================================================
         SIGNED PARAMETERS
         
         IMPORTANT FIX
         ----------------
         
         For normal image uploads:
         
           type = upload
         
         is Cloudinary's normal default and your current
         frontend uploader does NOT send `type`.

         Therefore we DO NOT include `type` in the
         signature for normal image uploads.

         For protected media:
         
           type = authenticated
         
         IS explicitly signed because authenticated delivery
         is part of the security configuration.
      =================================================== */

      const paramsToSign = {
        timestamp,

        folder:
          config.folder,
      };


      /* ===================================================
         SIGN TYPE ONLY FOR AUTHENTICATED MEDIA
      =================================================== */

      if (
        config.deliveryType ===
        "authenticated"
      ) {
        paramsToSign.type =
          config.deliveryType;
      }


      /* ===================================================
         CREATE CLOUDINARY SIGNATURE
      =================================================== */

      const signature =
        cloudinary.utils.api_sign_request(
          paramsToSign,

          CLOUDINARY_API_SECRET
        );


      /* ===================================================
         DEBUG LOG
         
         Do NOT log API secret.
         
         These values are safe enough for server logs and
         are useful for diagnosing future signature issues.
      =================================================== */

      console.log(
        "Cloudinary Signature Created:",
        {
          category:
            config.category,

          resourceType:
            config.resourceType,

          deliveryType:
            config.deliveryType,

          folder:
            config.folder,

          timestamp,

          signedParameters:
            Object.keys(
              paramsToSign
            ),
        }
      );


      /* ===================================================
         RESPONSE
         
         NEVER return CLOUDINARY_API_SECRET
      =================================================== */

      return res.status(200).json({
        success:
          true,

        signature,

        timestamp,

        cloudName:
          CLOUDINARY_CLOUD_NAME,

        apiKey:
          CLOUDINARY_API_KEY,

        folder:
          config.folder,

        resourceType:
          config.resourceType,

        type:
          config.deliveryType,

        category:
          config.category,

        isProtected:
          isProtectedMedia,
      });

    } catch (
      error
    ) {

      console.error(
        "Cloudinary Signature Error:",
        error
      );


      return res.status(500).json({
        success:
          false,

        code:
          "CLOUDINARY_SIGNATURE_ERROR",

        message:
          "Unable to create Cloudinary upload signature.",
      });
    }
  };


/* =========================================================
   EXPORT CONFIGURATION
========================================================= */

export {
  ALLOWED_MEDIA_CATEGORIES,
  CATEGORY_CONFIG,
};