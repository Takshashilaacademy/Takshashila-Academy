import Student from "../models/Student.js";
import Purchase from "../models/Purchase.js";
import LessonProgress from "../models/LessonProgress.js";

/* =========================================================
   GET STUDENT DASHBOARD

   GET /api/student/dashboard

   Recorded-course product only:
   - purchased courses
   - video/material counts
   - real lesson progress
========================================================= */

export const getStudentDashboard = async (
  req,
  res
) => {
  try {
    if (!req.student) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    const student =
      await Student.findById(
        req.student._id
      ).select(
        "_id name email mobile profileImage role purchasedCourses isActive lastLogin createdAt"
      );

    if (!student) {
      return res.status(404).json({
        success: false,
        message:
          "Student account not found.",
      });
    }

    if (!student.isActive) {
      return res.status(403).json({
        success: false,
        message:
          "Student account is inactive.",
      });
    }

    const purchases =
      await Purchase.find({
        student: student._id,
        status: "paid",
        isActive: true,
      })
        .populate({
          path: "course",
          select:
            "title shortTitle exam description thumbnail price oldPrice duration language totalVideos totalNotes isPublished lessons",
        })
        .sort({
          purchasedAt: -1,
          createdAt: -1,
        });

    const validPurchases =
      purchases.filter(
        (purchase) =>
          purchase.course &&
          purchase.course.isPublished !==
            false &&
          !(
            purchase.expiresAt &&
            new Date(
              purchase.expiresAt
            ).getTime() <= Date.now()
          )
      );

    const courseIds =
      validPurchases.map(
        (purchase) =>
          purchase.course._id
      );

    const progressRows =
      courseIds.length > 0
        ? await LessonProgress.find({
            student: student._id,
            course: {
              $in: courseIds,
            },
          })
            .select(
              "course lesson progressPercent completed lastWatchedAt"
            )
            .sort({
              lastWatchedAt: -1,
            })
            .lean()
        : [];

    let totalVideos = 0;
    let totalNotes = 0;
    let lessonsCompleted = 0;
    let totalPublishedLessons = 0;

    const purchasedCourses =
      validPurchases.map(
        (purchase) => {
          const course =
            purchase.course;

          const courseProgress =
            progressRows.filter(
              (item) =>
                item.course?.toString() ===
                course._id.toString()
            );

          const completed =
            courseProgress.filter(
              (item) =>
                item.completed
            ).length;

          const totalLessons =
            Array.isArray(
              course.lessons
            )
              ? course.lessons.filter(
                  (lesson) =>
                    lesson.isPublished !==
                    false
                ).length
              : 0;

          const percent =
            totalLessons > 0
              ? Math.round(
                  (completed /
                    totalLessons) *
                    100
                )
              : 0;

          totalVideos +=
            Number(
              course.totalVideos
            ) || 0;

          totalNotes +=
            Number(
              course.totalNotes
            ) || 0;

          lessonsCompleted +=
            completed;

          totalPublishedLessons +=
            totalLessons;

          return {
            purchaseId:
              purchase._id,

            purchaseStatus:
              purchase.status,

            purchasedAt:
              purchase.purchasedAt ||
              purchase.createdAt,

            amount:
              purchase.amount,

            course: {
              ...course.toObject(),
              lessons: undefined,
            },

            progress: {
              completedLessons:
                completed,
              totalLessons:
                totalLessons,
              percent,
            },
          };
        }
      );

    const overallProgress =
      totalPublishedLessons > 0
        ? Math.round(
            (lessonsCompleted /
              totalPublishedLessons) *
              100
          )
        : 0;

    const lastWatched =
      progressRows[0] || null;

    const stats = {
      purchasedCourses:
        purchasedCourses.length,

      lessonsCompleted,

      overallProgress,

      totalVideos,

      totalNotes,

      /*
       * Tests are intentionally not part of the
       * current product scope.
       */
      totalTests: 0,
      testsAttempted: 0,

      lastWatchedLessonId:
        lastWatched?.lesson ||
        null,

      lastWatchedCourseId:
        lastWatched?.course ||
        null,
    };

    const studentData = {
      id: student._id,
      name: student.name,
      email: student.email,
      mobile: student.mobile,
      profileImage:
        student.profileImage ||
        null,
      role: student.role,
      isActive:
        student.isActive,
      lastLogin:
        student.lastLogin,
      createdAt:
        student.createdAt,
    };

    return res.status(200).json({
      success: true,
      student:
        studentData,
      stats,
      purchasedCourses,
    });
  } catch (error) {
    console.error(
      "Student Dashboard Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to load student dashboard.",
    });
  }
};
