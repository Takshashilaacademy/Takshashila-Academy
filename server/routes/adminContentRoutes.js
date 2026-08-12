import express from "express";

import {
  addVideoToCourse,
  addMaterialToCourse,
  deleteVideoFromCourse,
  deleteMaterialFromCourse,
} from "../controllers/adminContentController.js";

import {
  adminProtect,
  requireAdmin,
} from "../middleware/adminAuthMiddleware.js";

/* =========================================================
   ADMIN CONTENT ROUTER
=========================================================

   Every route below requires:

   1. Valid JWT
   2. Correct JWT signature
   3. Correct JWT issuer
   4. Correct admin JWT audience
   5. tokenType === "admin"
   6. role === "admin"
   7. Admin exists in database
   8. Admin account is active

========================================================= */

const router = express.Router();

/* =========================================================
   ADD VIDEO
=========================================================

   POST
   /api/admin/content/courses/:courseId/videos

   Body:

   {
     title,
     description,
     videoUrl,
     videoPublicId,
     duration,
     isPreview,
     isPublished
   }

========================================================= */

router.post(
  "/courses/:courseId/videos",

  adminProtect,

  requireAdmin,

  addVideoToCourse
);

/* =========================================================
   DELETE VIDEO
=========================================================

   DELETE
   /api/admin/content/courses/:courseId/videos/:videoId

========================================================= */

router.delete(
  "/courses/:courseId/videos/:videoId",

  adminProtect,

  requireAdmin,

  deleteVideoFromCourse
);

/* =========================================================
   ADD COURSE MATERIAL
=========================================================

   POST
   /api/admin/content/courses/:courseId/materials

   Used for:

   - PDF
   - Notes
   - Study material

========================================================= */

router.post(
  "/courses/:courseId/materials",

  adminProtect,

  requireAdmin,

  addMaterialToCourse
);

/* =========================================================
   DELETE COURSE MATERIAL
=========================================================

   DELETE
   /api/admin/content/courses/:courseId/materials/:materialId

========================================================= */

router.delete(
  "/courses/:courseId/materials/:materialId",

  adminProtect,

  requireAdmin,

  deleteMaterialFromCourse
);

/* =========================================================
   EXPORT
========================================================= */

export default router;