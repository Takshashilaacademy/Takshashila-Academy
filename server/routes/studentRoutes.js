import express from "express";

import {
  getStudentDashboard,
} from "../controllers/studentController.js";

import {
  getPurchasedCourseContent,
} from "../controllers/studentLearningController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

const router = express.Router();

/* =========================================================
   STUDENT DASHBOARD

   GET /api/student/dashboard

   Requires:
   Valid JWT
========================================================= */

router.get(
  "/dashboard",
  protect,
  getStudentDashboard
);

/* =========================================================
   PURCHASED COURSE CONTENT

   GET /api/student/learning/:courseId

   Requires:
   1. Valid JWT
   2. Active student
   3. Paid purchase
========================================================= */

router.get(
  "/learning/:courseId",
  protect,
  getPurchasedCourseContent
);

export default router;