import mongoose from "mongoose";

import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";

import {
  deleteCloudinaryImage,
} from "../config/cloudinary.js";

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
   NORMALIZE NUMBER

   Returns null for invalid numbers.
========================================================= */

const normalizeNumber = (
  value,
  {
    min = 0,
    max = Number.MAX_SAFE_INTEGER,
  } = {}
) => {
  if (
    value ===
      undefined ||
    value ===
      null ||
    value ===
      ""
  ) {
    return null;
  }

  const number =
    Number(value);

  if (
    !Number.isFinite(
      number
    ) ||
    number < min ||
    number > max
  ) {
    return null;
  }

  return number;
};

/* =========================================================
   NORMALIZE STRING
========================================================= */

const normalizeString = (
  value,
  fallback = ""
) => {
  if (
    typeof value !==
    "string"
  ) {
    return fallback;
  }

  return value.trim();
};

/* =========================================================
   NORMALIZE STRING ARRAY
========================================================= */

const normalizeStringArray = (
  value
) => {
  if (
    !Array.isArray(
      value
    )
  ) {
    return [];
  }

  return value
    .filter(
      (
        item
      ) =>
        typeof item ===
        "string"
    )
    .map(
      (
        item
      ) =>
        item.trim()
    )
    .filter(
      Boolean
    );
};

/* =========================================================
   CREATE COURSE

   POST /api/admin/courses
========================================================= */

export const createCourse =
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         REQUIRED FIELDS
      =================================================== */

      const title =
        normalizeString(
          req.body?.title
        );

      const exam =
        normalizeString(
          req.body?.exam
        );

      const description =
        normalizeString(
          req.body?.description
        );

      if (
        !title ||
        !exam ||
        !description
      ) {
        return res.status(400).json({
          success: false,

          code:
            "REQUIRED_FIELDS_MISSING",

          message:
            "Title, exam and description are required.",
        });
      }

      /* ===================================================
         PRICE
      =================================================== */

      const coursePrice =
        normalizeNumber(
          req.body?.price,
          {
            min: 0,
            max: 10000000,
          }
        );

      if (
        coursePrice ===
        null
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_PRICE",

          message:
            "Please enter a valid course price.",
        });
      }

      /* ===================================================
         OLD PRICE
      =================================================== */

      const rawOldPrice =
        req.body?.oldPrice;

      const courseOldPrice =
        rawOldPrice ===
            undefined ||
        rawOldPrice ===
            null ||
        rawOldPrice ===
            ""
          ? 0
          : normalizeNumber(
              rawOldPrice,
              {
                min: 0,
                max: 10000000,
              }
            );

      if (
        courseOldPrice ===
        null
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_OLD_PRICE",

          message:
            "Please enter a valid old price.",
        });
      }

      /* ===================================================
         OPTIONAL ARRAYS
      =================================================== */

      const subjects =
        normalizeStringArray(
          req.body?.subjects
        );

      const features =
        normalizeStringArray(
          req.body?.features
        );

      /* ===================================================
         COUNTS

         These are normalized here, but should ideally be
         recalculated by the course-content controller when
         lessons/materials are actually added.
      =================================================== */

      const totalVideos =
        normalizeNumber(
          req.body?.totalVideos ??
            0,
          {
            min: 0,
            max: 100000,
          }
        );

      const totalNotes =
        normalizeNumber(
          req.body?.totalNotes ??
            0,
          {
            min: 0,
            max: 100000,
          }
        );

      const totalTests =
        normalizeNumber(
          req.body?.totalTests ??
            0,
          {
            min: 0,
            max: 100000,
          }
        );

      /* ===================================================
         CREATE COURSE
      =================================================== */

      const course =
        await Course.create({
          title,

          shortTitle:
            normalizeString(
              req.body?.shortTitle
            ),

          exam,

          description,

          fullDescription:
            normalizeString(
              req.body?.fullDescription
            ),

          thumbnail:
            normalizeString(
              req.body?.thumbnail
            ),

          thumbnailPublicId:
            normalizeString(
              req.body
                ?.thumbnailPublicId
            ),

          price:
            coursePrice,

          oldPrice:
            courseOldPrice,

          duration:
            normalizeString(
              req.body?.duration,
              "Self Paced"
            ) ||
            "Self Paced",

          language:
            normalizeString(
              req.body?.language,
              "Hindi"
            ) ||
            "Hindi",

          subjects,

          features,

          totalVideos:
            totalVideos ??
            0,

          totalNotes:
            totalNotes ??
            0,

          totalTests:
            totalTests ??
            0,

          isPublished:
            typeof req.body
              ?.isPublished ===
            "boolean"
              ? req.body.isPublished
              : false,

          isFeatured:
            typeof req.body
              ?.isFeatured ===
            "boolean"
              ? req.body.isFeatured
              : false,
        });

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(201).json({
        success: true,

        message:
          "Course created successfully.",

        course,
      });
    } catch (error) {
      console.error(
        "Create Course Error:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,

          code:
            "COURSE_VALIDATION_ERROR",

          message:
            Object.values(
              error.errors || {}
            )[0]?.message ||
            "Invalid course data.",
        });
      }

      return res.status(500).json({
        success: false,

        code:
          "CREATE_COURSE_ERROR",

        message:
          "Unable to create course.",
      });
    }
  };

/* =========================================================
   ADMIN GET ALL COURSES

   GET /api/admin/courses
========================================================= */

export const getAdminCourses =
  async (
    req,
    res
  ) => {
    try {
      const courses =
        await Course.find({})
          .select(
            [
              "title",
              "shortTitle",
              "exam",
              "description",
              "thumbnail",
              "thumbnailPublicId",
              "price",
              "oldPrice",
              "duration",
              "language",
              "subjects",
              "features",
              "totalVideos",
              "totalNotes",
              "totalTests",
              "isPublished",
              "isFeatured",
              "lessons",
              "materials",
              "createdAt",
              "updatedAt",
            ].join(" ")
          )
          .sort({
            createdAt:
              -1,
          })
          .lean();

      return res.status(200).json({
        success: true,

        count:
          courses.length,

        courses,
      });
    } catch (error) {
      console.error(
        "Get Admin Courses Error:",
        error
      );

      return res.status(500).json({
        success: false,

        code:
          "GET_ADMIN_COURSES_ERROR",

        message:
          "Unable to fetch admin courses.",
      });
    }
  };

/* =========================================================
   ADMIN GET SINGLE COURSE

   GET /api/admin/courses/:courseId
========================================================= */

export const getAdminCourseById =
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
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      const course =
        await Course.findById(
          courseId
        );

      if (!course) {
        return res.status(404).json({
          success: false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      return res.status(200).json({
        success: true,

        course,
      });
    } catch (error) {
      console.error(
        "Get Admin Course Error:",
        error
      );

      return res.status(500).json({
        success: false,

        code:
          "GET_ADMIN_COURSE_ERROR",

        message:
          "Unable to fetch admin course.",
      });
    }
  };

/* =========================================================
   UPDATE COURSE

   PUT /api/admin/courses/:courseId
========================================================= */

export const updateCourse =
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
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      const course =
        await Course.findById(
          courseId
        );

      if (!course) {
        return res.status(404).json({
          success: false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         ALLOWED METADATA
      =================================================== */

      const body =
        req.body || {};

      if (
        body.title !==
        undefined
      ) {
        const value =
          normalizeString(
            body.title
          );

        if (!value) {
          return res.status(400).json({
            success: false,

            code:
              "INVALID_TITLE",

            message:
              "Course title is required.",
          });
        }

        course.title =
          value;
      }

      if (
        body.shortTitle !==
        undefined
      ) {
        course.shortTitle =
          normalizeString(
            body.shortTitle
          );
      }

      if (
        body.exam !==
        undefined
      ) {
        const value =
          normalizeString(
            body.exam
          );

        if (!value) {
          return res.status(400).json({
            success: false,

            code:
              "INVALID_EXAM",

            message:
              "Exam is required.",
          });
        }

        course.exam =
          value;
      }

      if (
        body.description !==
        undefined
      ) {
        const value =
          normalizeString(
            body.description
          );

        if (!value) {
          return res.status(400).json({
            success: false,

            code:
              "INVALID_DESCRIPTION",

            message:
              "Course description is required.",
          });
        }

        course.description =
          value;
      }

      if (
        body.fullDescription !==
        undefined
      ) {
        course.fullDescription =
          normalizeString(
            body.fullDescription
          );
      }

      if (
        body.thumbnail !==
        undefined
      ) {
        course.thumbnail =
          normalizeString(
            body.thumbnail
          );
      }

      if (
        body.thumbnailPublicId !==
        undefined
      ) {
        course.thumbnailPublicId =
          normalizeString(
            body.thumbnailPublicId
          );
      }

      /* ===================================================
         PRICE
      =================================================== */

      if (
        body.price !==
        undefined
      ) {
        const price =
          normalizeNumber(
            body.price,
            {
              min: 0,
              max: 10000000,
            }
          );

        if (
          price ===
          null
        ) {
          return res.status(400).json({
            success: false,

            code:
              "INVALID_PRICE",

            message:
              "Please enter a valid course price.",
          });
        }

        course.price =
          price;
      }

      /* ===================================================
         OLD PRICE
      =================================================== */

      if (
        body.oldPrice !==
        undefined
      ) {
        const oldPrice =
          normalizeNumber(
            body.oldPrice,
            {
              min: 0,
              max: 10000000,
            }
          );

        if (
          oldPrice ===
          null
        ) {
          return res.status(400).json({
            success: false,

            code:
              "INVALID_OLD_PRICE",

            message:
              "Please enter a valid old price.",
          });
        }

        course.oldPrice =
          oldPrice;
      }

      /* ===================================================
         OTHER METADATA
      =================================================== */

      if (
        body.duration !==
        undefined
      ) {
        course.duration =
          normalizeString(
            body.duration
          );
      }

      if (
        body.language !==
        undefined
      ) {
        course.language =
          normalizeString(
            body.language
          );
      }

      if (
        body.subjects !==
        undefined
      ) {
        course.subjects =
          normalizeStringArray(
            body.subjects
          );
      }

      if (
        body.features !==
        undefined
      ) {
        course.features =
          normalizeStringArray(
            body.features
          );
      }

      /* ===================================================
         PUBLISH STATE
      =================================================== */

      if (
        typeof body.isPublished ===
        "boolean"
      ) {
        course.isPublished =
          body.isPublished;
      }

      if (
        typeof body.isFeatured ===
        "boolean"
      ) {
        course.isFeatured =
          body.isFeatured;
      }

      /* ===================================================
         SAVE
      =================================================== */

      await course.save();

      return res.status(200).json({
        success: true,

        message:
          "Course updated successfully.",

        course,
      });
    } catch (error) {
      console.error(
        "Update Course Error:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        return res.status(400).json({
          success: false,

          code:
            "COURSE_VALIDATION_ERROR",

          message:
            Object.values(
              error.errors || {}
            )[0]?.message ||
            "Invalid course data.",
        });
      }

      return res.status(500).json({
        success: false,

        code:
          "UPDATE_COURSE_ERROR",

        message:
          "Unable to update course.",
      });
    }
  };

/* =========================================================
   DELETE COURSE

   DELETE /api/admin/courses/:courseId

   SAFETY:

   A course with paid students cannot be hard deleted.

   It should be unpublished instead.
========================================================= */

export const deleteCourse =
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
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      /* ===================================================
         FIND COURSE
      =================================================== */

      const course =
        await Course.findById(
          courseId
        );

      if (!course) {
        return res.status(404).json({
          success: false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         PAID PURCHASE SAFETY CHECK
      =================================================== */

      const paidPurchaseCount =
        await Purchase.countDocuments({
          course:
            course._id,

          status:
            "paid",
        });

      if (
        paidPurchaseCount >
        0
      ) {
        return res.status(409).json({
          success: false,

          code:
            "COURSE_HAS_PAID_PURCHASES",

          message:
            "This course has paid students. Unpublish it instead of deleting it.",

          paidPurchaseCount,
        });
      }

      /* ===================================================
         DELETE COURSE
      =================================================== */

      await Course.deleteOne({
        _id:
          course._id,
      });

      /* ===================================================
         THUMBNAIL CLEANUP
      =================================================== */

      if (
        course.thumbnailPublicId
      ) {
        try {
          const cleanup =
            await deleteCloudinaryImage(
              course.thumbnailPublicId
            );

          if (
            !cleanup.success
          ) {
            console.warn(
              "Course thumbnail cleanup failed:",
              cleanup
            );
          }
        } catch (
          cleanupError
        ) {
          console.warn(
            "Course thumbnail cleanup exception:",
            cleanupError
          );
        }
      }

      /*
       * IMPORTANT:
       *
       * Lessons/videos/materials are intentionally NOT
       * deleted here because their exact Cloudinary
       * delivery type and upload implementation must be
       * verified first.
       *
       * Once the authenticated upload controller is
       * confirmed, media cleanup can safely be added.
       */

      return res.status(200).json({
        success: true,

        message:
          "Course deleted successfully.",
      });
    } catch (error) {
      console.error(
        "Delete Course Error:",
        error
      );

      return res.status(500).json({
        success: false,

        code:
          "DELETE_COURSE_ERROR",

        message:
          "Unable to delete course.",
      });
    }
  };