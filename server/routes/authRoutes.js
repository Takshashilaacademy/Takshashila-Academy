import express from "express";

import {
  signup,
  login,
  getMe,
  forgotPassword,
  resetPassword,
} from "../controllers/authController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

import {
  authRateLimit,
} from "../middleware/rateLimitMiddleware.js";

/* =========================================================
   AUTH ROUTER

   Base route:

   /api/auth
========================================================= */

const router = express.Router();

/* =========================================================
   STUDENT SIGNUP

   POST /api/auth/signup

   Body:
   {
     name,
     email,
     mobile,
     password
   }

   Public endpoint.
========================================================= */

router.post(
  "/signup",
  authRateLimit,
  signup
);

/* =========================================================
   STUDENT LOGIN

   POST /api/auth/login

   Body:
   {
     mobile,
     password
   }

   Public endpoint.
========================================================= */

router.post(
  "/login",
  authRateLimit,
  login
);

/* =========================================================
   FORGOT PASSWORD

   POST /api/auth/forgot-password

   Body:
   {
     email
   }

   Public endpoint.

   The controller intentionally avoids revealing
   whether the email exists.
========================================================= */

router.post(
  "/forgot-password",
  authRateLimit,
  forgotPassword
);

/* =========================================================
   RESET PASSWORD

   POST /api/auth/reset-password

   Body:
   {
     token,
     password
   }

   Public endpoint.

   The reset token itself authorizes this operation.
   It is:
   - hashed before database lookup
   - time limited
   - single use
========================================================= */

router.post(
  "/reset-password",
  authRateLimit,
  resetPassword
);

/* =========================================================
   CURRENT STUDENT

   GET /api/auth/me

   Header:

   Authorization: Bearer <student-token>

   Protected endpoint.
========================================================= */

router.get(
  "/me",
  protect,
  getMe
);

/* =========================================================
   EXPORT
========================================================= */

export default router;