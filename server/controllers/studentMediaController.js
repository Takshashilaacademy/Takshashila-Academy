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
   GET PROTECTED COURSE MEDIA URL

   GET
   /api/student/courses/:courseId/media/:mediaType/:mediaId

   Requires:
   - Valid student JWT
   - Active student
   - Published course
   - Paid purchase
   - Active purchase
   - Non-expired access

   IMPORTANT:

   The frontend supplies ONLY:
   - courseId
   - mediaType
   - mediaId

   The frontend NEVER supplies the Cloudinary public ID.

   The backend gets the actual Cloudinary public ID from
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

      const {
        courseId,
        mediaType,
        mediaId,
      } =
        req.params;

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

         IMPORTANT:

         Never trust:
         - frontend hasAccess
         - localStorage
         - course ownership in frontend
         - payment status sent by frontend

         Database is the final authority.
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
         * Immediately revoke the active entitlement.
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

         IMPORTANT:

         The media ID is checked against the requested
         course itself.

         This prevents:

         Course A + Media ID from Course B
         
         from generating a URL.
      =================================================== */

      let media =
        null;

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
                  lesson._id?.toString() ===
                    mediaId &&
                  lesson.isPublished !==
                    false
              )
            : null;
      }

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
                  material._id?.toString() ===
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

         NEVER ACCEPT THIS VALUE FROM req.body,
         req.query OR req.params.
      =================================================== */

      const publicId =
        mediaType ===
        "video"
          ? media.videoPublicId
          : media.filePublicId;

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

      /* ===================================================
         RESOURCE TYPE
      =================================================== */

      const resourceType =
        mediaType ===
        "video"
          ? "video"
          : "raw";

      /* ===================================================
         FILE FORMAT

         Cloudinary raw PDF resources may require the
         explicit PDF format.
      =================================================== */

      let format;

      if (
        mediaType ===
          "material" &&
        String(
          media.fileType ||
            ""
        ).toLowerCase() ===
          "pdf"
      ) {
        format =
          "pdf";
      }

      /* ===================================================
         CREATE AUTHENTICATED MEDIA URL
      =================================================== */

      const signedUrl =
        createAuthenticatedMediaUrl({
          publicId:
            publicId.trim(),

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
          "Cloudinary authenticated media URL generation returned an invalid URL."
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
         RESPONSE

         Do not expose:
         - Cloudinary public ID
         - payment ID
         - payment signature
         - internal purchase fields
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
      console.error(
        "Get Protected Media URL Error:",
        error
      );

      /* =================================================
         INVALID OBJECT ID
      ================================================= */

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

      /* =================================================
         SERVER ERROR
      ================================================= */

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