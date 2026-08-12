import express from "express";

import {
  getProtectedMediaUrl,
} from "../controllers/studentMediaController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

/* =========================================================
   STUDENT PROTECTED MEDIA ROUTER
========================================================= */

const router =
  express.Router();

/* =========================================================
   GET PROTECTED VIDEO URL

   GET
   /api/student/courses/:courseId/media/video/:mediaId

   Requires:
   - Valid student JWT
   - Active student
   - Published course
   - Paid purchase
   - Active purchase

========================================================= */

router.get(
  "/courses/:courseId/media/video/:mediaId",
  protect,
  getProtectedMediaUrl
);

/* =========================================================
   GET PROTECTED MATERIAL URL

   GET
   /api/student/courses/:courseId/media/material/:mediaId

   Requires:
   - Valid student JWT
   - Active student
   - Published course
   - Paid purchase
   - Active purchase

========================================================= */

router.get(
  "/courses/:courseId/media/material/:mediaId",
  protect,
  getProtectedMediaUrl
);

/* =========================================================
   EXPORT
========================================================= */

export default router;