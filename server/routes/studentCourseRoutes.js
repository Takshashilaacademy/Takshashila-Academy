import express from "express";

import {
  getProtectedCourseContent,
  checkStudentCourseAccess,
} from "../controllers/studentCourseController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

/* =========================================================
   STUDENT COURSE ROUTER

   Base route:

   /api/student/courses
========================================================= */

const router =
  express.Router();

/* =========================================================
   GET PROTECTED COURSE CONTENT

   GET /api/student/courses/:courseId/content

   Requires:
   - Valid student JWT
   - Active student
   - Existing course
   - Published course
   - Paid purchase
   - Active purchase

   Returns:
   - Course information
   - Authorized lessons
   - Authorized materials
   - Purchase information

   IMPORTANT:

   protect only verifies authentication.

   The controller MUST independently verify that the
   logged-in student owns an active paid purchase for
   this exact course.

   Never trust:
   - frontend hasAccess
   - localStorage purchase data
   - courseId supplied by frontend
   - client-side payment state
========================================================= */

router.get(
  "/:courseId/content",
  protect,
  getProtectedCourseContent
);

/* =========================================================
   CHECK STUDENT COURSE ACCESS

   GET /api/student/courses/:courseId/access

   Requires:
   - Valid student JWT
   - Active student

   Returns:

   {
     success: true,
     hasAccess: true
   }

   OR:

   {
     success: true,
     hasAccess: false
   }

   IMPORTANT:

   Backend/database remains the final authority for
   course ownership.
========================================================= */

router.get(
  "/:courseId/access",
  protect,
  checkStudentCourseAccess
);

/* =========================================================
   EXPORT
========================================================= */

export default router;