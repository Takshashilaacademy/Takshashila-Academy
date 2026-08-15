import mongoose from "mongoose";

import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";

import {
  createAuthenticatedMediaUrl,
} from "../utils/cloudinaryMedia.js";

/* =========================================================
   CONSTANTS
========================================================= */

const ALLOWED_MEDIA_TYPES = [
  "video",
  "material",
];

/* =========================================================
   NORMALIZE MEDIA TYPE

   Supports BOTH route styles:

   1. /media/:mediaType/:mediaId

   2. /media/video/:mediaId
      /media/material/:mediaId

   Your current router uses the second style.
========================================================= */

const getRequestedMediaType = (
  req
) => {
  const directMediaType =
    String(
      req.params?.mediaType || ""
    )
      .trim()
      .toLowerCase();

  /* -------------------------------------------------------
     If :mediaType exists, use it.
  ------------------------------------------------------- */

  if (
    ALLOWED_MEDIA_TYPES.includes(
      directMediaType
    )
  ) {
    return directMediaType;
  }

  /* -------------------------------------------------------
     Current route style:

     /courses/:courseId/media/video/:mediaId
     /courses/:courseId/media/material/:mediaId

     Detect media type from request path.
  ------------------------------------------------------- */

  const path = String(
    req.path ||
      req.originalUrl ||
      ""
  ).toLowerCase();

  if (
    path.includes(
      "/media/video/"
    )
  ) {
    return "video";
  }

  if (
    path.includes(
      "/media/material/"
    )
  ) {
    return "material";
  }

  return "";
};

/* =========================================================
   GET PROTECTED COURSE MEDIA URL

   GET

   Current supported routes:

   /api/student/courses/:courseId/media/video/:mediaId

   /api/student/courses/:courseId/media/material/:mediaId

   Also supports:

   /api/student/courses/:courseId/media/:mediaType/:mediaId

   Requires:

   - Valid student JWT
   - Active student
   - Published course
   - Paid purchase
   - Active purchase
   - Non-expired access

   IMPORTANT:

   Frontend supplies ONLY:

   - courseId
   - mediaId
   - media type through route

   Frontend NEVER supplies Cloudinary public ID.

   Backend gets the actual Cloudinary public ID from
   the trusted Course document.
========================================================= */

export const getProtectedMediaUrl =
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         AUTHENTICATION
      =================================================== */

      if (!req.student) {
        return res.status(401).json({
          success: false,

          code:
            "AUTHENTICATION_REQUIRED",

          message:
            "Student authentication required.",
        });
      }

      /* ===================================================
         ACTIVE STUDENT
      =================================================== */

      if (
        req.student.isActive !==
        true
      ) {
        return res.status(403).json({
          success: false,

          code:
            "STUDENT_ACCOUNT_INACTIVE",

          message:
            "Your student account is inactive.",
        });
      }

      /* ===================================================
         PARAMS
      =================================================== */

      const courseId =
        req.params?.courseId;

      const mediaId =
        req.params?.mediaId;

      /*
       * IMPORTANT FIX
       *
       * Your current router does NOT contain:
       *
       * :mediaType
       *
       * It uses:
       *
       * /media/video/:mediaId
       * /media/material/:mediaId
       *
       * Therefore media type is detected safely from
       * the request path.
       */

      const mediaType =
        getRequestedMediaType(
          req
        );

      /* ===================================================
         COURSE ID
      =================================================== */

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      /* ===================================================
         MEDIA ID
      =================================================== */

      if (
        !isValidObjectId(
          mediaId
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_MEDIA_ID",

          message:
            "Invalid media ID.",
        });
      }

      /* ===================================================
         MEDIA TYPE
      =================================================== */

      if (
        !ALLOWED_MEDIA_TYPES.includes(
          mediaType
        )
      ) {
        console.error(
          "Invalid media type request:",
          {
            path:
              req.path,

            originalUrl:
              req.originalUrl,

            params:
              req.params,
          }
        );

        return res.status(400).json({
          success: false,

          code:
            "INVALID_MEDIA_TYPE",

          message:
            "Invalid media type.",
        });
      }

      /* ===================================================
         FIND PUBLISHED COURSE
      =================================================== */

      const course =
        await Course.findOne({
          _id:
            courseId,

          isPublished:
            true,
        }).select(
          [
            "_id",
            "title",
            "lessons",
            "materials",
          ].join(" ")
        );

      if (!course) {
        return res.status(404).json({
          success: false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found or is not available.",
        });
      }

      /* ===================================================
         VERIFY PAID PURCHASE

         NEVER TRUST:

         - frontend hasAccess
         - localStorage
         - frontend ownership
         - payment status from frontend

         Database is final authority.
      =================================================== */

      const purchase =
        await Purchase.findOne({
          student:
            req.student._id,

          course:
            course._id,

          status:
            "paid",

          isActive:
            true,
        }).select(
          [
            "_id",
            "purchasedAt",
            "expiresAt",
            "status",
            "isActive",
          ].join(" ")
        );

      /* ===================================================
         ACCESS DENIED
      =================================================== */

      if (!purchase) {
        return res.status(403).json({
          success: false,

          code:
            "COURSE_ACCESS_DENIED",

          message:
            "You do not have access to this course.",

          hasAccess:
            false,
        });
      }

      /* ===================================================
         CHECK EXPIRY
      =================================================== */

      if (
        purchase.expiresAt &&
        new Date(
          purchase.expiresAt
        ).getTime() <=
          Date.now()
      ) {
        /*
         * Immediately revoke expired entitlement.
         */

        await Purchase.updateOne(
          {
            _id:
              purchase._id,

            student:
              req.student._id,

            course:
              course._id,
          },
          {
            $set: {
              isActive:
                false,
            },
          }
        );

        return res.status(403).json({
          success: false,

          code:
            "COURSE_ACCESS_EXPIRED",

          message:
            "Your course access has expired.",

          hasAccess:
            false,

          expiresAt:
            purchase.expiresAt,
        });
      }

      /* ===================================================
         FIND REQUESTED MEDIA
      =================================================== */

      let media =
        null;

      /* ===================================================
         VIDEO
      =================================================== */

      if (
        mediaType ===
        "video"
      ) {
        media =
          Array.isArray(
            course.lessons
          )
            ? course.lessons.find(
                (
                  lesson
                ) =>
                  lesson &&
                  lesson._id
                    ?.toString() ===
                    mediaId &&
                  lesson.isPublished !==
                    false
              )
            : null;
      }

      /* ===================================================
         MATERIAL
      =================================================== */

      if (
        mediaType ===
        "material"
      ) {
        media =
          Array.isArray(
            course.materials
          )
            ? course.materials.find(
                (
                  material
                ) =>
                  material &&
                  material._id
                    ?.toString() ===
                    mediaId &&
                  material.isPublished !==
                    false
              )
            : null;
      }

      /* ===================================================
         MEDIA NOT FOUND
      =================================================== */

      if (!media) {
        return res.status(404).json({
          success: false,

          code:
            "MEDIA_NOT_FOUND",

          message:
            "Course media not found.",
        });
      }

      /* ===================================================
         GET CLOUDINARY PUBLIC ID

         NEVER accept this from:

         - req.body
         - req.query
         - frontend
         - URL query parameters

         Always use trusted Course document.
      =================================================== */

      const publicId =
        mediaType ===
        "video"
          ? media.videoPublicId
          : media.filePublicId;

      /* ===================================================
         PUBLIC ID VALIDATION
      =================================================== */

      if (
        typeof publicId !==
          "string" ||
        !publicId.trim()
      ) {
        console.error(
          `Missing Cloudinary public ID for ${mediaType} ${mediaId} in course ${courseId}`
        );

        return res.status(404).json({
          success: false,

          code:
            "MEDIA_NOT_CONFIGURED",

          message:
            "This course media is not configured correctly.",
        });
      }

      const normalizedPublicId =
        publicId.trim();

      /* ===================================================
         RESOURCE TYPE
      =================================================== */

      const resourceType =
        mediaType ===
        "video"
          ? "video"
          : "raw";

      /* ===================================================
         FORMAT

         IMPORTANT PDF FIX

         Your Cloudinary PDF public ID already contains
         the .pdf extension.

         Example:

         courses/materials/example.pdf

         If we send:

         format: "pdf"

         Cloudinary can generate:

         example.pdf.pdf

         which causes:

         HTTP 404

         Therefore:

         DO NOT send format for raw materials.

         The stored public ID is used exactly as it is.
      =================================================== */

      const format =
        undefined;

      /* ===================================================
         CREATE AUTHENTICATED CLOUDINARY URL
      =================================================== */

      const signedUrl =
        createAuthenticatedMediaUrl({
          publicId:
            normalizedPublicId,

          resourceType,

          format,
        });

      /* ===================================================
         URL GENERATION FAILURE
      =================================================== */

      if (
        typeof signedUrl !==
          "string" ||
        !signedUrl.trim()
      ) {
        console.error(
          "Cloudinary authenticated media URL generation returned an invalid URL.",
          {
            mediaType,
            resourceType,
          }
        );

        return res.status(500).json({
          success: false,

          code:
            "MEDIA_URL_GENERATION_FAILED",

          message:
            "Unable to generate protected media URL.",
        });
      }

      /* ===================================================
         DEBUG LOG

         Does NOT expose Cloudinary secret.

         Useful for checking whether PDF/video URL
         generation is correct.
      =================================================== */

      console.log(
        "Protected media URL generated:",
        {
          mediaType,

          resourceType,

          mediaId,

          courseId,

          hasUrl:
            Boolean(
              signedUrl
            ),

          publicIdHasPdfExtension:
            /\.pdf$/i.test(
              normalizedPublicId
            ),
        }
      );

      /* ===================================================
         RESPONSE

         Do NOT expose:

         - payment ID
         - payment signature
         - internal purchase data
         - Cloudinary API secret
      =================================================== */

      return res.status(200).json({
        success:
          true,

        hasAccess:
          true,

        media: {
          id:
            media._id,

          type:
            mediaType,

          title:
            media.title ||
            "",

          description:
            media.description ||
            "",

          duration:
            media.duration ||
            "",

          fileType:
            media.fileType ||
            "",

          fileSize:
            media.fileSize ||
            "",

          url:
            signedUrl,

          expiresAt:
            purchase.expiresAt ||
            null,
        },
      });
    } catch (error) {
      /* ===================================================
         SERVER ERROR LOG
      =================================================== */

      console.error(
        "Get Protected Media URL Error:",
        error
      );

      /* ===================================================
         INVALID OBJECT ID
      =================================================== */

      if (
        error?.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_MEDIA_REQUEST",

          message:
            "Invalid media request.",
        });
      }

      /* ===================================================
         SERVER ERROR
      =================================================== */

      return res.status(500).json({
        success: false,

        code:
          "PROTECTED_MEDIA_ERROR",

        message:
          "Unable to generate protected media URL.",
      });
    }
  };

/* =========================================================
   OBJECT ID HELPER
========================================================= */

const isValidObjectId = (
  id
) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};