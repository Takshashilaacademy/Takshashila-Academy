import mongoose from "mongoose";

import Course from "../models/Course.js";

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

/* =========================================================
   PUBLIC COURSE FIELDS
=========================================================

   Safe fields for public course discovery.

   IMPORTANT:

   lessons/materials are intentionally excluded.

   Therefore:

   - videoUrl
   - videoPublicId
   - fileUrl
   - filePublicId

   are never returned by public course APIs.
========================================================= */

const PUBLIC_COURSE_FIELDS = [
  "title",
  "shortTitle",
  "exam",
  "description",
  "fullDescription",
  "thumbnail",
  "price",
  "oldPrice",
  "duration",
  "language",
  "subjects",
  "features",
  "totalVideos",
  "totalNotes",
  "totalTests",
  "isFeatured",
  "isPublished",
  "createdAt",
  "updatedAt",
].join(" ");

/* =========================================================
   GET ALL PUBLISHED COURSES

   GET /api/courses

   PUBLIC API
========================================================= */

export const getCourses =
  async (
    req,
    res
  ) => {
    try {
      const courses =
        await Course.find({
          isPublished:
            true,
        })
          .select(
            PUBLIC_COURSE_FIELDS
          )
          .sort({
            isFeatured:
              -1,

            createdAt:
              -1,
          })
          .lean();

      return res.status(200).json({
        success:
          true,

        count:
          courses.length,

        courses,
      });
    } catch (error) {
      console.error(
        "Get Courses Error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        code:
          "GET_COURSES_ERROR",

        message:
          "Unable to fetch courses.",
      });
    }
  };

/* =========================================================
   GET SINGLE PUBLISHED COURSE

   GET /api/courses/:courseId

   PUBLIC API

   IMPORTANT:

   Does NOT return:
   - lessons
   - materials
   - videoUrl
   - videoPublicId
   - fileUrl
   - filePublicId
========================================================= */

export const getCourseById =
  async (
    req,
    res
  ) => {
    try {
      const {
        courseId,
      } = req.params;

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      const course =
        await Course.findOne({
          _id:
            courseId,

          isPublished:
            true,
        })
          .select(
            PUBLIC_COURSE_FIELDS
          )
          .lean();

      if (!course) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      return res.status(200).json({
        success:
          true,

        course,
      });
    } catch (error) {
      console.error(
        "Get Course Error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        code:
          "GET_COURSE_ERROR",

        message:
          "Unable to fetch course.",
      });
    }
  };

/* =========================================================
   GET PROTECTED COURSE CONTENT

   GET /api/courses/:courseId/content

   REQUIRED MIDDLEWARE:

   protect
   requireCourseAccess

   IMPORTANT:

   This endpoint MUST NOT be mounted publicly.

   Expected flow:

   Student JWT
        ↓
   protect
        ↓
   requireCourseAccess
        ↓
   Paid purchase
        ↓
   getCourseContent

   IMPORTANT SECURITY RULE:

   Even an authorized student must NOT receive the
   Cloudinary public IDs or raw media URLs.

   Media must be requested through the protected media
   endpoint.
========================================================= */

export const getCourseContent =
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
          success:
            false,

          code:
            "AUTHENTICATION_REQUIRED",

          message:
            "Authentication required.",
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
          success:
            false,

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

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         PURCHASE / ACCESS CHECK
      =================================================== */

      if (
        !req.coursePurchase
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "COURSE_ACCESS_REQUIRED",

          message:
            "You do not have access to this course.",

          hasAccess:
            false,
        });
      }

      /* ===================================================
         COURSE PURCHASE OWNERSHIP SAFETY CHECK
      =================================================== */

      if (
        req.coursePurchase.student &&
        req.coursePurchase.student.toString() !==
          req.student._id.toString()
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "COURSE_ACCESS_DENIED",

          message:
            "You do not have access to this course.",

          hasAccess:
            false,
        });
      }

      if (
        req.coursePurchase.course &&
        req.coursePurchase.course.toString() !==
          courseId.toString()
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "COURSE_ACCESS_DENIED",

          message:
            "You do not have access to this course.",

          hasAccess:
            false,
        });
      }

      /* ===================================================
         PURCHASE STATUS
      =================================================== */

      if (
        req.coursePurchase.status &&
        req.coursePurchase.status !==
          "paid"
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "COURSE_ACCESS_DENIED",

          message:
            "You do not have access to this course.",

          hasAccess:
            false,
        });
      }

      if (
        req.coursePurchase.isActive ===
        false
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "COURSE_ACCESS_INACTIVE",

          message:
            "Your course access is inactive.",

          hasAccess:
            false,
        });
      }

      /* ===================================================
         EXPIRY CHECK
      =================================================== */

      if (
        req.coursePurchase.expiresAt &&
        new Date(
          req.coursePurchase.expiresAt
        ).getTime() <=
          Date.now()
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "COURSE_ACCESS_EXPIRED",

          message:
            "Your course access has expired.",

          hasAccess:
            false,
        });
      }

      /* ===================================================
         FIND PUBLISHED COURSE

         We intentionally load lessons/materials here
         because we need their metadata.

         We will sanitize them before sending the response.
      =================================================== */

      const course =
        await Course.findOne({
          _id:
            courseId,

          isPublished:
            true,
        })
          .select(
            [
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
              "totalVideos",
              "totalNotes",
              "totalTests",
              "lessons",
              "materials",
            ].join(" ")
          )
          .lean();

      /* ===================================================
         COURSE NOT FOUND
      =================================================== */

      if (!course) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         FILTER PUBLISHED LESSONS
      =================================================== */

      const publishedLessons =
        Array.isArray(
          course.lessons
        )
          ? course.lessons.filter(
              (
                lesson
              ) =>
                lesson &&
                lesson.isPublished !==
                  false
            )
          : [];

      /* ===================================================
         FILTER PUBLISHED MATERIALS
      =================================================== */

      const publishedMaterials =
        Array.isArray(
          course.materials
        )
          ? course.materials.filter(
              (
                material
              ) =>
                material &&
                material.isPublished !==
                  false
            )
          : [];

      /* ===================================================
         SANITIZE LESSONS

         NEVER SEND:

         - videoUrl
         - videoPublicId
         - Cloudinary signed URL
         - Cloudinary internal data

         Instead the frontend receives a protected
         endpoint it can call when the student actually
         opens the lesson.
      =================================================== */

      const lessons =
        publishedLessons.map(
          (
            lesson,
            index
          ) => ({
            _id:
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
              lesson.order ??
              index + 1,

            mediaUrl:
              `/api/student/courses/${course._id}/media/video/${lesson._id}`,
          })
        );

      /* ===================================================
         SANITIZE MATERIALS

         NEVER SEND:

         - fileUrl
         - filePublicId
         - Cloudinary internal data

         Frontend receives protected media endpoint.
      =================================================== */

      const materials =
        publishedMaterials.map(
          (
            material,
            index
          ) => ({
            _id:
              material._id,

            title:
              material.title ||
              "",

            description:
              material.description ||
              "",

            fileType:
              material.fileType ||
              "",

            fileSize:
              material.fileSize ||
              "",

            isPublished:
              material.isPublished !==
              false,

            order:
              material.order ??
              index + 1,

            mediaUrl:
              `/api/student/courses/${course._id}/media/material/${material._id}`,
          })
        );

      /* ===================================================
         RESPONSE

         ONLY SAFE COURSE CONTENT METADATA IS RETURNED.
      =================================================== */

      return res.status(200).json({
        success:
          true,

        access: {
          hasAccess:
            true,

          purchaseId:
            req.coursePurchase
              ._id,

          purchasedAt:
            req.coursePurchase
              .purchasedAt ||
            null,

          expiresAt:
            req.coursePurchase
              .expiresAt ||
            null,
        },

        course: {
          _id:
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

          /*
           * Use actual published content counts rather
           * than trusting stale admin-entered counters.
           */

          totalVideos:
            lessons.length,

          totalNotes:
            materials.length,

          totalTests:
            course.totalTests ??
            0,

          lessons,

          materials,
        },
      });
    } catch (error) {
      console.error(
        "Get Course Content Error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        code:
          "GET_COURSE_CONTENT_ERROR",

        message:
          "Unable to fetch course content.",
      });
    }
  };