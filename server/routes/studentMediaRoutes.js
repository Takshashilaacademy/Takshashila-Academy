import express from "express";

import {
  getProtectedMediaUrl,
} from "../controllers/studentMediaController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

/* =========================================================
   STUDENT PROTECTED MEDIA ROUTER

   Handles:

   VIDEO:
   /api/student/courses/:courseId/media/video/:mediaId

   MATERIAL:
   /api/student/courses/:courseId/media/material/:mediaId

   The route uses :mediaType so the controller receives:

   req.params.mediaType

   as:

   "video"
   or
   "material"
========================================================= */

const router =
  express.Router();

/* =========================================================
   GET PROTECTED MEDIA URL

   Supported media types:

   video
   material

   Requires:
   - Valid student JWT
   - Active student
   - Published course
   - Paid purchase
   - Active purchase
========================================================= */

router.get(
  "/courses/:courseId/media/:mediaType/:mediaId",
  protect,
  getProtectedMediaUrl
);

/* =========================================================
   EXPORT
========================================================= */

export default router;