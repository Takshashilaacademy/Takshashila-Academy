import express from "express";

import {
  adminLogin,
  getAdminMe,
} from "../controllers/adminController.js";

import {
  adminProtect,
  requireAdmin,
} from "../middleware/adminAuthMiddleware.js";

/* =========================================================
   ADMIN ROUTER
========================================================= */

import { authRateLimit } from "../middleware/rateLimitMiddleware.js";

const router =
  express.Router();

/* =========================================================
   ADMIN LOGIN
=========================================================

POST /api/admin/login

PUBLIC ROUTE

Body:

{
  "email": "admin@example.com",
  "password": "********"
}

IMPORTANT:

No admin middleware is required here because this
endpoint creates the admin authentication token.

========================================================= */

router.post(
  "/login",
  authRateLimit,
  adminLogin
);

/* =========================================================
   CURRENT ADMIN
=========================================================

GET /api/admin/me

PROTECTED

Header:

Authorization: Bearer <admin-token>

Authentication:

1. adminProtect
2. requireAdmin

========================================================= */

router.get(
  "/me",

  adminProtect,

  requireAdmin,

  getAdminMe
);

/* =========================================================
   EXPORT
========================================================= */

export default router;