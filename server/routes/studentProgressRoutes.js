import express from "express";

import {
  getCourseProgress,
  updateLessonProgress,
} from "../controllers/studentProgressController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router =
  express.Router();

/* =========================================================
   GET COURSE PROGRESS

   GET /api/student/courses/:courseId/progress
========================================================= */

router.get(
  "/:courseId/progress",
  protect,
  getCourseProgress
);

/* =========================================================
   UPDATE LESSON PROGRESS

   PUT /api/student/courses/:courseId/progress/:lessonId
========================================================= */

router.put(
  "/:courseId/progress/:lessonId",
  protect,
  updateLessonProgress
);

export default router;
