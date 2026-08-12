import { v2 as cloudinary } from "cloudinary";
import dotenv from "dotenv";

dotenv.config();

/* =========================================================
   ENVIRONMENT VARIABLES
========================================================= */

const CLOUDINARY_CLOUD_NAME =
  process.env.CLOUDINARY_CLOUD_NAME?.trim();

const CLOUDINARY_API_KEY =
  process.env.CLOUDINARY_API_KEY?.trim();

const CLOUDINARY_API_SECRET =
  process.env.CLOUDINARY_API_SECRET?.trim();

/* =========================================================
   CLOUDINARY CONFIGURATION
========================================================= */

cloudinary.config({
  cloud_name:
    CLOUDINARY_CLOUD_NAME,

  api_key:
    CLOUDINARY_API_KEY,

  api_secret:
    CLOUDINARY_API_SECRET,

  secure:
    true,
});

/* =========================================================
   CHECK CLOUDINARY CONFIGURATION
=========================================================

   Checks whether all required environment variables exist.

   IMPORTANT:

   Never print:
   - API key
   - API secret
   - full Cloudinary configuration

   to logs.
========================================================= */

export const checkCloudinaryConfig =
  () => {
    const {
      cloud_name,
      api_key,
      api_secret,
    } =
      cloudinary.config();

    const isConfigured =
      Boolean(
        cloud_name &&
        api_key &&
        api_secret
      );

    if (!isConfigured) {
      console.warn(
        ""
      );

      console.warn(
        "⚠️ CLOUDINARY CONFIGURATION IS MISSING"
      );

      console.warn(
        "Required environment variables:"
      );

      console.warn(
        "CLOUDINARY_CLOUD_NAME"
      );

      console.warn(
        "CLOUDINARY_API_KEY"
      );

      console.warn(
        "CLOUDINARY_API_SECRET"
      );

      console.warn(
        ""
      );

      return false;
    }

    return true;
  };

/* =========================================================
   VERIFY CLOUDINARY CONNECTION
=========================================================

   This performs a real Cloudinary API request.

   Use during:
   - server startup
   - deployment health checks
   - diagnostics

   Do NOT call this on every user request.
========================================================= */

export const verifyCloudinaryConnection =
  async () => {
    try {
      const configured =
        checkCloudinaryConfig();

      if (!configured) {
        return false;
      }

      await cloudinary.api.ping();

      console.log(
        "Cloudinary API connection verified successfully."
      );

      return true;
    } catch (error) {
      console.error(
        "Cloudinary API connection failed:",
        error?.message ||
          error
      );

      return false;
    }
  };

/* =========================================================
   DELETE CLOUDINARY ASSET
=========================================================

   Supported resource types:

   image
   video
   raw

   IMPORTANT:

   This helper deletes the asset from Cloudinary.

   The database document should only be removed/updated
   after the application has handled the Cloudinary result
   appropriately.
========================================================= */

export const deleteCloudinaryAsset =
  async (
    publicId,
    {
      resourceType =
        "image",

      invalidate =
        true,

      type =
        "upload",
    } = {}
  ) => {
    try {
      /* ===================================================
         PUBLIC ID
      =================================================== */

      if (
        typeof publicId !==
          "string" ||
        !publicId.trim()
      ) {
        return {
          success:
            false,

          message:
            "Cloudinary public ID is required.",
        };
      }

      /* ===================================================
         RESOURCE TYPE
      =================================================== */

      const allowedResourceTypes =
        [
          "image",
          "video",
          "raw",
        ];

      if (
        !allowedResourceTypes.includes(
          resourceType
        )
      ) {
        return {
          success:
            false,

          message:
            "Invalid Cloudinary resource type.",
        };
      }

      /* ===================================================
         DELIVERY TYPE
      ===================================================

         Cloudinary assets can use different delivery types.

         We support:

         upload
         authenticated
         private

         The delete request needs the correct asset type
         when deleting authenticated/private assets.
      =================================================== */

      const allowedTypes =
        [
          "upload",
          "authenticated",
          "private",
        ];

      if (
        !allowedTypes.includes(
          type
        )
      ) {
        return {
          success:
            false,

          message:
            "Invalid Cloudinary delivery type.",
        };
      }

      /* ===================================================
         CONFIG
      =================================================== */

      if (
        !checkCloudinaryConfig()
      ) {
        return {
          success:
            false,

          message:
            "Cloudinary is not configured.",
        };
      }

      /* ===================================================
         DELETE
      =================================================== */

      const result =
        await cloudinary.uploader.destroy(
          publicId.trim(),
          {
            resource_type:
              resourceType,

            type,

            invalidate:
              Boolean(
                invalidate
              ),
          }
        );

      /* ===================================================
         SUCCESS
      =================================================== */

      if (
        result?.result ===
        "ok"
      ) {
        return {
          success:
            true,

          result:
            result.result,
        };
      }

      /* ===================================================
         ALREADY DELETED
      =================================================== */

      if (
        result?.result ===
        "not found"
      ) {
        return {
          success:
            true,

          alreadyDeleted:
            true,

          result:
            result.result,
        };
      }

      /* ===================================================
         OTHER CLOUDINARY RESULT
      =================================================== */

      return {
        success:
          false,

        result:
          result?.result ||
          "unknown",
      };
    } catch (error) {
      console.error(
        "Cloudinary Asset Delete Error:",
        error?.message ||
          error
      );

      return {
        success:
          false,

        message:
          error?.message ||
          "Unable to delete Cloudinary asset.",
      };
    }
  };

/* =========================================================
   DELETE IMAGE
========================================================= */

export const deleteCloudinaryImage =
  async (
    publicId,
    options = {}
  ) => {
    return deleteCloudinaryAsset(
      publicId,
      {
        ...options,

        resourceType:
          "image",
      }
    );
  };

/* =========================================================
   DELETE VIDEO
========================================================= */

export const deleteCloudinaryVideo =
  async (
    publicId,
    options = {}
  ) => {
    return deleteCloudinaryAsset(
      publicId,
      {
        ...options,

        resourceType:
          "video",
      }
    );
  };

/* =========================================================
   DELETE RAW FILE
========================================================= */

export const deleteCloudinaryRaw =
  async (
    publicId,
    options = {}
  ) => {
    return deleteCloudinaryAsset(
      publicId,
      {
        ...options,

        resourceType:
          "raw",
      }
    );
  };

/* =========================================================
   CLOUDINARY CONFIG STATUS

   Useful for internal server diagnostics.

   Returns only safe boolean information.
========================================================= */

export const isCloudinaryConfigured =
  () => {
    return checkCloudinaryConfig();
  };

/* =========================================================
   EXPORT CLOUDINARY INSTANCE
========================================================= */

export default cloudinary;