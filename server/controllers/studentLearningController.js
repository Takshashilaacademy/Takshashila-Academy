import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";

/* =========================================================
   GET PURCHASED COURSE CONTENT

   GET /api/student/learning/:courseId

   Requires:
   1. Valid JWT
   2. Active student
   3. Paid + active purchase

   IMPORTANT:
   Course content केवल purchased student को मिलेगा.
========================================================= */

export const getPurchasedCourseContent = async (
  req,
  res
) => {
  try {
    const { courseId } = req.params;

    /* -------------------------------------------------------
       AUTHENTICATION CHECK
    ------------------------------------------------------- */

    if (!req.student) {
      return res.status(401).json({
        success: false,
        message: "Authentication required.",
      });
    }

    /* -------------------------------------------------------
       FIND COURSE
    ------------------------------------------------------- */

    const course = await Course.findOne({
      _id: courseId,
      isPublished: true,
    }).select(
      "title shortTitle exam description fullDescription thumbnail price oldPrice duration language subjects features totalVideos totalNotes totalTests isFeatured lessons materials"
    );

    if (!course) {
      return res.status(404).json({
        success: false,
        message: "Course not found.",
      });
    }

    /* -------------------------------------------------------
       CHECK PURCHASE

       Student must have:
       status = paid
       isActive = true
    ------------------------------------------------------- */

    const purchase = await Purchase.findOne({
      student: req.student._id,
      course: course._id,
      status: "paid",
      isActive: true,
    });

    if (!purchase) {
      return res.status(403).json({
        success: false,
        message:
          "You have not purchased this course.",
      });
    }

    /* -------------------------------------------------------
       CHECK EXPIRY

       If expiresAt exists and is already passed,
       access is denied.
    ------------------------------------------------------- */

    if (
      purchase.expiresAt &&
      new Date(purchase.expiresAt) < new Date()
    ) {
      return res.status(403).json({
        success: false,
        message:
          "Your course access has expired.",
      });
    }

    /* -------------------------------------------------------
       FILTER PUBLISHED LESSONS
    ------------------------------------------------------- */

    const lessons = course.lessons
      .filter(
        (lesson) =>
          lesson.isPublished !== false
      )
      .map((lesson) => ({
        id: lesson._id,
        title: lesson.title,
        description:
          lesson.description || "",
        /* Media URLs are intentionally NOT returned.
           Paid media is delivered through the protected
           media endpoint after access verification. */

        duration:
          lesson.duration || "",
        isPreview:
          lesson.isPreview === true,
        isPublished:
          lesson.isPublished !== false,
      }));

    /* -------------------------------------------------------
       FILTER PUBLISHED MATERIALS
    ------------------------------------------------------- */

    const materials = course.materials
      .filter(
        (material) =>
          material.isPublished !== false
      )
      .map((material) => ({
        id: material._id,
        title: material.title,
        description:
          material.description || "",
        /* Material URLs are intentionally NOT returned.
           Students receive a protected signed URL on demand. */

        fileType:
          material.fileType || "pdf",
        fileSize:
          material.fileSize || "",
        isPublished:
          material.isPublished !== false,
      }));

    /* -------------------------------------------------------
       COURSE RESPONSE
    ------------------------------------------------------- */

    const courseData = {
      id: course._id,
      title: course.title,
      shortTitle:
        course.shortTitle,
      exam: course.exam,
      description:
        course.description,
      fullDescription:
        course.fullDescription,
      thumbnail:
        course.thumbnail,
      price: course.price,
      oldPrice:
        course.oldPrice,
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
      isFeatured:
        course.isFeatured,

      lessons,
      materials,
    };

    /* -------------------------------------------------------
       PURCHASE RESPONSE
    ------------------------------------------------------- */

    const purchaseData = {
      id: purchase._id,
      amount:
        purchase.amount,
      currency:
        purchase.currency,
      status:
        purchase.status,
      purchasedAt:
        purchase.purchasedAt ||
        purchase.createdAt,
      expiresAt:
        purchase.expiresAt,
      isActive:
        purchase.isActive,
    };

    /* -------------------------------------------------------
       FINAL RESPONSE
    ------------------------------------------------------- */

    return res.status(200).json({
      success: true,

      course:
        courseData,

      purchase:
        purchaseData,
    });
  } catch (error) {
    console.error(
      "Get Purchased Course Content Error:",
      error
    );

    /* -------------------------------------------------------
       INVALID MONGODB ID
    ------------------------------------------------------- */

    if (
      error.name === "CastError"
    ) {
      return res.status(404).json({
        success: false,
        message:
          "Course not found.",
      });
    }

    /* -------------------------------------------------------
       SERVER ERROR
    ------------------------------------------------------- */

    return res.status(500).json({
      success: false,
      message:
        "Unable to load course content.",
    });
  }
};