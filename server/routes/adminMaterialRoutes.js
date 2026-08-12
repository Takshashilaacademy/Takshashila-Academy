import express from "express";

/*
 * IMPORTANT
 *
 * Course materials are already handled by:
 *
 * server/routes/adminContentRoutes.js
 *
 * Therefore this router intentionally does NOT register
 * duplicate material endpoints.
 *
 * Keeping duplicate POST/DELETE routes here can cause:
 *
 * - confusing route architecture
 * - duplicate middleware execution
 * - controller inconsistency
 * - difficult debugging
 * - future security mistakes
 */

const router = express.Router();

/* =========================================================
   NO DUPLICATE MATERIAL ROUTES
========================================================= */

/*
 * Material routes are handled centrally by:
 *
 * /api/admin/content
 *
 * See:
 *
 * adminContentRoutes.js
 *
 * Endpoints:
 *
 * POST
 * /api/admin/content/courses/:courseId/materials
 *
 * DELETE
 * /api/admin/content/courses/:courseId/materials/:materialId
 */

/* =========================================================
   EXPORT
========================================================= */

export default router;