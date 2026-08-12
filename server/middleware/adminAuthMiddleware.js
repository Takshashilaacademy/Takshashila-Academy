import jwt from "jsonwebtoken";
import mongoose from "mongoose";

import Student from "../models/Student.js";

/* =========================================================
   ADMIN JWT CONFIGURATION
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET;

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  "takshashila-academy";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE ||
  "takshashila-admin";

/* =========================================================
   GET BEARER TOKEN
========================================================= */

const getBearerToken = (
  req
) => {
  const authorization =
    req?.headers?.authorization;

  if (
    typeof authorization !==
      "string" ||
    !authorization.trim()
  ) {
    return null;
  }

  if (
    !authorization.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authorization
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  return token;
};

/* =========================================================
   ADMIN PROTECT

   Security checks:

   1. JWT secret configured
   2. Bearer token exists
   3. JWT signature valid
   4. issuer valid
   5. audience valid
   6. tokenType === admin
   7. role === admin
   8. admin ID valid
   9. admin exists in database
   10. admin account active
========================================================= */

export const adminProtect =
  async (
    req,
    res,
    next
  ) => {
    try {
      /* ===================================================
         JWT CONFIGURATION
      =================================================== */

      if (
        !JWT_SECRET
      ) {
        console.error(
          "Admin authentication failed: JWT_SECRET is missing."
        );

        return res.status(500).json({
          success:
            false,

          code:
            "ADMIN_AUTH_NOT_CONFIGURED",

          message:
            "Admin authentication service is not configured.",
        });
      }

      /* ===================================================
         GET TOKEN
      =================================================== */

      const token =
        getBearerToken(
          req
        );

      if (!token) {
        return res.status(401).json({
          success:
            false,

          code:
            "ADMIN_AUTH_REQUIRED",

          message:
            "Admin authentication required.",
        });
      }

      /* ===================================================
         VERIFY JWT
         
         issuer + audience are intentionally enforced.
      =================================================== */

      const decoded =
        jwt.verify(
          token,
          JWT_SECRET,
          {
            issuer:
              JWT_ISSUER,

            audience:
              JWT_AUDIENCE,
          }
        );

      /* ===================================================
         PAYLOAD VALIDATION
      =================================================== */

      if (
        !decoded ||
        typeof decoded !==
          "object" ||
        !decoded.id
      ) {
        return res.status(401).json({
          success:
            false,

          code:
            "INVALID_ADMIN_TOKEN",

          message:
            "Invalid admin authentication token.",
        });
      }

      /* ===================================================
         TOKEN TYPE
      =================================================== */

      if (
        decoded.tokenType !==
        "admin"
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "INVALID_ADMIN_TOKEN_TYPE",

          message:
            "This token cannot be used for admin access.",
        });
      }

      /* ===================================================
         ROLE
      =================================================== */

      if (
        decoded.role !==
        "admin"
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "ADMIN_ACCESS_REQUIRED",

          message:
            "Admin access required.",
        });
      }

      /* ===================================================
         ADMIN ID VALIDATION
      =================================================== */

      if (
        !mongoose.Types.ObjectId.isValid(
          decoded.id
        )
      ) {
        return res.status(401).json({
          success:
            false,

          code:
            "INVALID_ADMIN_ID",

          message:
            "Invalid admin authentication identity.",
        });
      }

      /* ===================================================
         DATABASE LOOKUP
         
         JWT alone is never trusted.

         Database state remains the source of truth.
      =================================================== */

      const admin =
        await Student.findOne({
          _id:
            decoded.id,

          role:
            "admin",
        }).select(
          "-password"
        );

      /* ===================================================
         ADMIN NOT FOUND
      =================================================== */

      if (!admin) {
        return res.status(401).json({
          success:
            false,

          code:
            "ADMIN_NOT_FOUND",

          message:
            "Admin account not found.",
        });
      }

      /* ===================================================
         ACTIVE ADMIN CHECK
      =================================================== */

      if (
        admin.isActive !==
        true
      ) {
        return res.status(403).json({
          success:
            false,

          code:
            "ADMIN_ACCOUNT_INACTIVE",

          message:
            "Admin account is inactive.",
        });
      }

      /* ===================================================
         ATTACH ADMIN
         
         Existing controllers can use:
         
         req.admin
         req.user
      =================================================== */

      req.admin =
        admin;

      req.user =
        admin;

      /* ===================================================
         AUTH INFORMATION
         
         Useful for logging/auditing.
      =================================================== */

      req.auth = {
        userId:
          admin._id,

        role:
          admin.role,

        tokenType:
          decoded.tokenType,

        issuer:
          decoded.iss,

        audience:
          decoded.aud,

        tokenIssuedAt:
          decoded.iat
            ? new Date(
                decoded.iat *
                  1000
              )
            : null,

        tokenExpiresAt:
          decoded.exp
            ? new Date(
                decoded.exp *
                  1000
              )
            : null,
      };

      /* ===================================================
         CONTINUE
      =================================================== */

      return next();
    } catch (
      error
    ) {
      /* ===================================================
         TOKEN EXPIRED
      =================================================== */

      if (
        error?.name ===
        "TokenExpiredError"
      ) {
        return res.status(401).json({
          success:
            false,

          code:
            "ADMIN_TOKEN_EXPIRED",

          message:
            "Admin session expired. Please login again.",
        });
      }

      /* ===================================================
         TOKEN NOT ACTIVE
      =================================================== */

      if (
        error?.name ===
        "NotBeforeError"
      ) {
        return res.status(401).json({
          success:
            false,

          code:
            "ADMIN_TOKEN_NOT_ACTIVE",

          message:
            "Admin authentication token is not active yet.",
        });
      }

      /* ===================================================
         INVALID JWT
      =================================================== */

      if (
        error?.name ===
        "JsonWebTokenError"
      ) {
        return res.status(401).json({
          success:
            false,

          code:
            "INVALID_ADMIN_TOKEN",

          message:
            "Invalid admin authentication token.",
        });
      }

      /* ===================================================
         SERVER ERROR
      =================================================== */

      console.error(
        "Admin Auth Middleware Error:",
        error?.message ||
          error
      );

      return res.status(500).json({
        success:
          false,

        code:
          "ADMIN_AUTH_ERROR",

        message:
          "Admin authentication service is temporarily unavailable.",
      });
    }
  };

/* =========================================================
   REQUIRE ADMIN

   Second authorization layer.

   Usage:

   adminProtect,
   requireAdmin,
   controller
========================================================= */

export const requireAdmin = (
  req,
  res,
  next
) => {
  const admin =
    req.admin ||
    req.user;

  /* =======================================================
     AUTH CHECK
  ======================================================= */

  if (!admin) {
    return res.status(401).json({
      success:
        false,

      code:
        "ADMIN_AUTH_REQUIRED",

      message:
        "Admin authentication required.",
    });
  }

  /* =======================================================
     ROLE CHECK
  ======================================================= */

  if (
    admin.role !==
    "admin"
  ) {
    return res.status(403).json({
      success:
        false,

      code:
        "ADMIN_ACCESS_REQUIRED",

      message:
        "Admin access required.",
    });
  }

  /* =======================================================
     ACTIVE CHECK
  ======================================================= */

  if (
    admin.isActive !==
    true
  ) {
    return res.status(403).json({
      success:
        false,

      code:
        "ADMIN_ACCOUNT_INACTIVE",

      message:
        "Admin account is inactive.",
    });
  }

  /* =======================================================
     CONTINUE
  ======================================================= */

  return next();
};