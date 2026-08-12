import express from "express";

import {
  createCourse,
  getAdminCourses,
  getAdminCourseById,
  deleteCourse,
  updateCourse,
} from "../controllers/adminCourseController.js";

import {
  adminProtect,
  requireAdmin,
} from "../middleware/adminAuthMiddleware.js";

/* =========================================================
   ROUTER
========================================================= */

const router = express.Router();

/* =========================================================
   ADMIN COURSE ROUTES
=========================================================

   सभी routes के लिए:

   1. Admin JWT required
   2. JWT issuer verified
   3. JWT audience verified
   4. tokenType === "admin"
   5. role === "admin"
   6. Admin exists in database
   7. Admin account is active

========================================================= */

/* =========================================================
   CREATE COURSE

   POST /api/admin/courses

   Body:
   {
     title,
     shortTitle,
     exam,
     description,
     fullDescription,
     thumbnail,
     thumbnailPublicId,
     price,
     oldPrice,
     duration,
     language,
     subjects,
     features,
     totalVideos,
     totalNotes,
     totalTests,
     isPublished,
     isFeatured
   }
========================================================= */

router.post(
  "/",
  adminProtect,
  requireAdmin,
  createCourse
);

/* =========================================================
   GET ALL COURSES

   GET /api/admin/courses

   Admin dashboard course list.
========================================================= */

router.get(
  "/",
  adminProtect,
  requireAdmin,
  getAdminCourses
);

/* =========================================================
   GET SINGLE COURSE

   GET /api/admin/courses/:courseId

   Returns admin course details including:

   - Course information
   - Lessons
   - Videos
   - Materials
   - Other admin-managed content
========================================================= */

router.get(
  "/:courseId",
  adminProtect,
  requireAdmin,
  getAdminCourseById
);


/* =========================================================
   UPDATE COURSE

   PUT /api/admin/courses/:courseId
========================================================= */

router.put(
  "/:courseId",
  adminProtect,
  requireAdmin,
  updateCourse
);

/* =========================================================
   DELETE COURSE

   DELETE /api/admin/courses/:courseId
========================================================= */

router.delete(
  "/:courseId",
  adminProtect,
  requireAdmin,
  deleteCourse
);

/* =========================================================
   EXPORT
========================================================= */

export default router;