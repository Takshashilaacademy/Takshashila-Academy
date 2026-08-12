import express from "express";

import {
  getCourses,
  getCourseById,
  getCourseContent,
} from "../controllers/courseController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  requireCourseAccess,
} from "../middleware/courseAccessMiddleware.js";

/* =========================================================
   ROUTER
========================================================= */

const router = express.Router();

/* =========================================================
   GET ALL PUBLISHED COURSES

   GET /api/courses

   PUBLIC

   Anyone can browse available courses.

   Does NOT return:
   - lesson video URLs
   - material URLs
   - Cloudinary private/public IDs
========================================================= */

router.get(
  "/",
  getCourses
);

/* =========================================================
   GET PROTECTED COURSE CONTENT

   GET /api/courses/:courseId/content

   REQUIRED:
   1. Student JWT
   2. Active student
   3. Paid purchase
   4. Active entitlement

   IMPORTANT:

   This route MUST come before:

   /:courseId

   Otherwise "content" could be interpreted as a
   courseId parameter.
========================================================= */

router.get(
  "/:courseId/content",

  protect,

  requireCourseAccess,

  getCourseContent
);

/* =========================================================
   GET SINGLE PUBLISHED COURSE

   GET /api/courses/:courseId

   PUBLIC

   Returns course landing/details information only.

   Paid lessons/materials are NOT returned.
========================================================= */

router.get(
  "/:courseId",
  getCourseById
);

/* =========================================================
   EXPORT
========================================================= */

export default router;