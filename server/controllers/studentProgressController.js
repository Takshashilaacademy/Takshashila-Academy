import mongoose from "mongoose";

import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";
import LessonProgress from "../models/LessonProgress.js";

/* =========================================================
   HELPERS
========================================================= */

const hasActivePurchase = async (
  studentId,
  courseId
) => {
  const purchase =
    await Purchase.findOne({
      student: studentId,
      course: courseId,
      status: "paid",
      isActive: true,
    }).select(
      "expiresAt purchasedAt"
    );

  if (!purchase) {
    return null;
  }

  if (
    purchase.expiresAt &&
    new Date(purchase.expiresAt).getTime() <=
      Date.now()
  ) {
    return null;
  }

  return purchase;
};

const clampNumber = (
  value,
  min,
  max
) => {
  const number =
    Number(value);

  if (!Number.isFinite(number)) {
    return min;
  }

  return Math.min(
    max,
    Math.max(min, number)
  );
};

/* =========================================================
   GET COURSE PROGRESS

   GET /api/student/courses/:courseId/progress
========================================================= */

export const getCourseProgress = async (
  req,
  res
) => {
  try {
    if (!req.student) {
      return res.status(401).json({
        success: false,
        message:
          "Student authentication required.",
      });
    }

    const { courseId } =
      req.params;

    if (
      !mongoose.Types.ObjectId.isValid(
        courseId
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid course ID.",
      });
    }

    const course =
      await Course.findOne({
        _id: courseId,
        isPublished: true,
      }).select(
        "_id lessons"
      );

    if (!course) {
      return res.status(404).json({
        success: false,
        message:
          "Course not found.",
      });
    }

    const purchase =
      await hasActivePurchase(
        req.student._id,
        course._id
      );

    if (!purchase) {
      return res.status(403).json({
        success: false,
        code:
          "COURSE_ACCESS_DENIED",
        message:
          "You do not have access to this course.",
      });
    }

    const progress =
      await LessonProgress.find({
        student:
          req.student._id,
        course:
          course._id,
      })
        .select(
          "lesson watchedSeconds durationSeconds progressPercent completed lastWatchedAt"
        )
        .sort({
          lastWatchedAt: -1,
        })
        .lean();

    const publishedLessons =
      Array.isArray(
        course.lessons
      )
        ? course.lessons.filter(
            (lesson) =>
              lesson.isPublished !==
              false
          )
        : [];

    const completedCount =
      progress.filter(
        (item) =>
          item.completed
      ).length;

    const totalLessons =
      publishedLessons.length;

    const overallProgress =
      totalLessons > 0
        ? Math.round(
            (completedCount /
              totalLessons) *
              100
          )
        : 0;

    const lastWatched =
      progress[0] || null;

    return res.status(200).json({
      success: true,
      courseId:
        course._id,
      totalLessons,
      completedLessons:
        completedCount,
      overallProgress,
      lastWatchedLessonId:
        lastWatched?.lesson ||
        null,
      progress,
    });
  } catch (error) {
    console.error(
      "Get Course Progress Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load course progress.",
    });
  }
};

/* =========================================================
   UPDATE LESSON PROGRESS

   PUT /api/student/courses/:courseId/progress/:lessonId
========================================================= */

export const updateLessonProgress =
  async (
    req,
    res
  ) => {
    try {
      if (!req.student) {
        return res.status(401).json({
          success: false,
          message:
            "Student authentication required.",
        });
      }

      const {
        courseId,
        lessonId,
      } = req.params;

      if (
        !mongoose.Types.ObjectId.isValid(
          courseId
        ) ||
        !mongoose.Types.ObjectId.isValid(
          lessonId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid course or lesson ID.",
        });
      }

      const course =
        await Course.findOne({
          _id: courseId,
          isPublished: true,
        }).select(
          "_id lessons"
        );

      if (!course) {
        return res.status(404).json({
          success: false,
          message:
            "Course not found.",
        });
      }

      const purchase =
        await hasActivePurchase(
          req.student._id,
          course._id
        );

      if (!purchase) {
        return res.status(403).json({
          success: false,
          code:
            "COURSE_ACCESS_DENIED",
          message:
            "You do not have access to this course.",
        });
      }

      const lesson =
        course.lessons?.find(
          (item) =>
            item._id?.toString() ===
              lessonId &&
            item.isPublished !==
              false
        );

      if (!lesson) {
        return res.status(404).json({
          success: false,
          message:
            "Lesson not found.",
        });
      }

      const watchedSeconds =
        clampNumber(
          req.body?.watchedSeconds,
          0,
          24 * 60 * 60
        );

      const durationSeconds =
        clampNumber(
          req.body?.durationSeconds,
          0,
          24 * 60 * 60
        );

      const requestedCompleted =
        req.body?.completed ===
        true;

      const calculatedPercent =
        durationSeconds > 0
          ? Math.round(
              Math.min(
                100,
                (watchedSeconds /
                  durationSeconds) *
                  100
              )
            )
          : 0;

      /*
       * A lesson is considered completed when the
       * student explicitly completes it OR reaches
       * at least 90% of the known duration.
       */
      const completed =
        requestedCompleted ||
        calculatedPercent >= 90;

      const finalPercent =
        completed
          ? 100
          : calculatedPercent;

      const updated =
        await LessonProgress.findOneAndUpdate(
          {
            student:
              req.student._id,
            course:
              course._id,
            lesson:
              lesson._id,
          },
          {
            $set: {
              watchedSeconds,
              durationSeconds,
              progressPercent:
                finalPercent,
              completed,
              lastWatchedAt:
                new Date(),
            },
          },
          {
            new: true,
            upsert: true,
            setDefaultsOnInsert:
              true,
          }
        ).lean();

      return res.status(200).json({
        success: true,
        message:
          completed
            ? "Lesson completed."
            : "Lesson progress saved.",
        progress: updated,
      });
    } catch (error) {
      console.error(
        "Update Lesson Progress Error:",
        error
      );

      if (
        error?.code === 11000
      ) {
        return res.status(409).json({
          success: false,
          message:
            "Progress update conflict. Please try again.",
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to save lesson progress.",
      });
    }
  };
