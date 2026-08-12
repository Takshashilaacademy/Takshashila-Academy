import mongoose from "mongoose";

import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (
  id
) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

/* =========================================================
   CHECK ACTIVE PURCHASE

   Backend is the final authority for course access.

   Requirements:
   - authenticated student
   - matching course
   - paid purchase
   - active purchase
   - non-expired access
========================================================= */

const findActivePurchase = async (
  studentId,
  courseId
) => {
  const purchase =
    await Purchase.findOne({
      student:
        studentId,

      course:
        courseId,

      status:
        "paid",

      isActive:
        true,
    }).select(
      [
        "_id",
        "student",
        "course",
        "amount",
        "currency",
        "status",
        "paymentGateway",
        "paymentOrderId",
        "paymentId",
        "purchasedAt",
        "expiresAt",
        "isActive",
        "createdAt",
        "updatedAt",
      ].join(" ")
    );

  if (!purchase) {
    return {
      purchase: null,
      expired: false,
    };
  }

  /* =======================================================
     EXPIRY CHECK
  ======================================================= */

  if (
    purchase.expiresAt &&
    new Date(
      purchase.expiresAt
    ).getTime() <=
      Date.now()
  ) {
    /*
     * Revoke active entitlement at database level.
     */

    await Purchase.updateOne(
      {
        _id:
          purchase._id,

        student:
          studentId,

        course:
          courseId,
      },
      {
        $set: {
          isActive:
            false,
        },
      }
    );

    return {
      purchase: null,
      expired: true,
    };
  }

  return {
    purchase,
    expired: false,
  };
};

/* =========================================================
   GET PROTECTED COURSE CONTENT

   GET /api/student/courses/:courseId/content

   Requires:
   - Valid student JWT
   - Active student
   - Published course
   - Paid purchase
   - Active purchase
   - Non-expired access

   IMPORTANT:

   This endpoint returns course structure/content metadata.

   It intentionally does NOT generate public media URLs.

   Video/PDF delivery should happen through protected
   media endpoints.
========================================================= */

export const getProtectedCourseContent =
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
         COURSE ID
      =================================================== */

      const {
        courseId,
      } = req.params;

      if (!courseId) {
        return res.status(400).json({
          success: false,

          code:
            "COURSE_ID_REQUIRED",

          message:
            "Course ID is required.",
        });
      }

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
            "shortTitle",
            "exam",
            "description",
            "fullDescription",
            "thumbnail",
            "duration",
            "language",
            "subjects",
            "features",
            "lessons",
            "materials",
            "totalVideos",
            "totalNotes",
            "totalTests",
            "isPublished",
            "isFeatured",
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
         VERIFY PURCHASE
      =================================================== */

      const {
        purchase,
        expired,
      } =
        await findActivePurchase(
          req.student._id,
          course._id
        );

      /* ===================================================
         EXPIRED
      =================================================== */

      if (expired) {
        return res.status(403).json({
          success: false,

          code:
            "COURSE_ACCESS_EXPIRED",

          message:
            "Your access to this course has expired.",

          hasAccess:
            false,
        });
      }

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
         PREPARE LESSONS

         IMPORTANT:

         Do NOT expose Cloudinary public IDs or direct
         media URLs through this endpoint.

         The frontend should request media through a
         protected backend endpoint.
      =================================================== */

      const lessons =
        Array.isArray(
          course.lessons
        )
          ? course.lessons
              .filter(
                (
                  lesson
                ) =>
                  lesson &&
                  lesson.isPublished !==
                    false
              )
              .map(
                (
                  lesson,
                  index
                ) => ({
                  id:
                    lesson._id,

                  title:
                    lesson.title ||
                    "",

                  description:
                    lesson.description ||
                    "",

                  duration:
                    lesson.duration ||
                    "",

                  isPreview:
                    lesson.isPreview ===
                    true,

                  isPublished:
                    lesson.isPublished !==
                    false,

                  order:
                    index + 1,

                  /*
                   * Protected media endpoints should use
                   * lesson ID instead of exposing the
                   * Cloudinary public ID.
                   */
                  mediaUrl:
                    `/api/student/courses/${course._id}/lessons/${lesson._id}/media`,
                })
              )
          : [];

      /* ===================================================
         PREPARE MATERIALS

         Do NOT expose filePublicId.

         PDF/document delivery must go through protected
         backend media endpoint.
      =================================================== */

      const materials =
        Array.isArray(
          course.materials
        )
          ? course.materials
              .filter(
                (
                  material
                ) =>
                  material &&
                  material.isPublished !==
                    false
              )
              .map(
                (
                  material,
                  index
                ) => ({
                  id:
                    material._id,

                  title:
                    material.title ||
                    "",

                  description:
                    material.description ||
                    "",

                  fileType:
                    material.fileType ||
                    "document",

                  fileSize:
                    material.fileSize ||
                    "",

                  isPublished:
                    material.isPublished !==
                    false,

                  order:
                    index + 1,

                  /*
                   * Protected document endpoint.
                   */
                  mediaUrl:
                    `/api/student/courses/${course._id}/materials/${material._id}/media`,
                })
              )
          : [];

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(200).json({
        success:
          true,

        hasAccess:
          true,

        message:
          "Course access granted.",

        course: {
          id:
            course._id,

          title:
            course.title,

          shortTitle:
            course.shortTitle,

          exam:
            course.exam,

          description:
            course.description,

          fullDescription:
            course.fullDescription,

          thumbnail:
            course.thumbnail,

          duration:
            course.duration,

          language:
            course.language,

          subjects:
            course.subjects,

          features:
            course.features,

          totalVideos:
            course.totalVideos,

          totalNotes:
            course.totalNotes,

          totalTests:
            course.totalTests,

          isPublished:
            course.isPublished,

          isFeatured:
            course.isFeatured,

          lessons,

          materials,
        },

        purchase: {
          id:
            purchase._id,

          amount:
            purchase.amount,

          currency:
            purchase.currency,

          status:
            purchase.status,

          paymentGateway:
            purchase.paymentGateway,

          purchasedAt:
            purchase.purchasedAt,

          expiresAt:
            purchase.expiresAt,

          isActive:
            purchase.isActive,
        },
      });
    } catch (error) {
      console.error(
        "Get Protected Course Content Error:",
        error
      );

      if (
        error?.name ===
        "CastError"
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      if (
        error?.name ===
        "ValidationError"
      ) {
        const message =
          Object.values(
            error.errors || {}
          )
            .map(
              (
                item
              ) =>
                item.message
            )[0] ||
          "Invalid course data.";

        return res.status(400).json({
          success: false,

          message,
        });
      }

      return res.status(500).json({
        success: false,

        code:
          "COURSE_CONTENT_ERROR",

        message:
          "Unable to load course content.",
      });
    }
  };

/* =========================================================
   CHECK COURSE ACCESS ONLY

   GET /api/student/courses/:courseId/access

   Does NOT return paid course content.
========================================================= */

export const checkStudentCourseAccess =
  async (
    req,
    res
  ) => {
    try {
      /* =================================================
         AUTHENTICATION
      ================================================= */

      if (!req.student) {
        return res.status(401).json({
          success: false,

          code:
            "AUTHENTICATION_REQUIRED",

          message:
            "Student authentication required.",
        });
      }

      /* =================================================
         ACTIVE STUDENT
      ================================================= */

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

          hasAccess:
            false,
        });
      }

      /* =================================================
         COURSE ID
      ================================================= */

      const {
        courseId,
      } = req.params;

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

          hasAccess:
            false,
        });
      }

      /* =================================================
         COURSE EXISTS
      ================================================= */

      const courseExists =
        await Course.exists({
          _id:
            courseId,

          isPublished:
            true,
        });

      if (!courseExists) {
        return res.status(404).json({
          success: false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",

          hasAccess:
            false,
        });
      }

      /* =================================================
         PURCHASE CHECK
      ================================================= */

      const {
        purchase,
        expired,
      } =
        await findActivePurchase(
          req.student._id,
          courseId
        );

      /* =================================================
         EXPIRED
      ================================================= */

      if (expired) {
        return res.status(200).json({
          success:
            true,

          hasAccess:
            false,

          reason:
            "COURSE_ACCESS_EXPIRED",
        });
      }

      /* =================================================
         NOT PURCHASED
      ================================================= */

      if (!purchase) {
        return res.status(200).json({
          success:
            true,

          hasAccess:
            false,

          reason:
            "COURSE_NOT_PURCHASED",
        });
      }

      /* =================================================
         ACCESS GRANTED
      ================================================= */

      return res.status(200).json({
        success:
          true,

        hasAccess:
          true,

        purchasedAt:
          purchase.purchasedAt,

        expiresAt:
          purchase.expiresAt,
      });
    } catch (error) {
      console.error(
        "Check Student Course Access Error:",
        error
      );

      return res.status(500).json({
        success: false,

        hasAccess:
          false,

        code:
          "COURSE_ACCESS_CHECK_ERROR",

        message:
          "Unable to check course access.",
      });
    }
  };