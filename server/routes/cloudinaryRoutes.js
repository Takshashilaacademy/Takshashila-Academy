import express from "express";

import {
  createUploadSignature,
} from "../controllers/cloudinaryController.js";

import {
  adminProtect,
  requireAdmin,
} from "../middleware/adminAuthMiddleware.js";

/* =========================================================
   CLOUDINARY ADMIN ROUTER
========================================================= */

const router =
  express.Router();

/* =========================================================
   CREATE CLOUDINARY UPLOAD SIGNATURE

   POST /api/admin/cloudinary/signature

   Required:

   Authorization: Bearer <admin-token>

   Flow:

   Admin JWT
      ↓
   adminProtect
      ↓
   requireAdmin
      ↓
   createUploadSignature

   IMPORTANT:

   The controller decides:

   course-video
      → video
      → authenticated

   course-material
      → raw
      → authenticated

   course-thumbnail
      → image
      → upload

   Frontend must NOT be trusted to choose an arbitrary
   protected-media configuration.
========================================================= */

router.post(
  "/signature",

  adminProtect,

  requireAdmin,

  createUploadSignature
);

/* =========================================================
   EXPORT
========================================================= */

export default router;