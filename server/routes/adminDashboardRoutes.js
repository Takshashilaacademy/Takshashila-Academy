import express from "express";

import {
  getAdminDashboardStats,
} from "../controllers/adminDashboardController.js";

import {
  adminProtect,
  requireAdmin,
} from "../middleware/adminAuthMiddleware.js";

const router =
  express.Router();

router.get(
  "/stats",
  adminProtect,
  requireAdmin,
  getAdminDashboardStats
);

export default router;
