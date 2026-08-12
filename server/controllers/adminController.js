import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";

import Student from "../models/Student.js";

/* =========================================================
   CONFIGURATION
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET;

const JWT_EXPIRES_IN =
  process.env.JWT_EXPIRES_IN || "7d";

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  "takshashila-academy";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE ||
  "takshashila-admin";

/* =========================================================
   CREATE ADMIN JWT
========================================================= */

const createAdminToken = (adminId) => {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      id: adminId,
      role: "admin",
      tokenType: "admin",
    },
    JWT_SECRET,
    {
      expiresIn: JWT_EXPIRES_IN,
      issuer: JWT_ISSUER,
      audience: JWT_AUDIENCE,
    }
  );
};

/* =========================================================
   SAFE ADMIN RESPONSE
========================================================= */

const getAdminResponse = (admin) => {
  return {
    id: admin._id,
    name: admin.name,
    email: admin.email,
    mobile: admin.mobile,
    role: admin.role,

    profileImage:
      admin.profileImage || null,

    lastLogin:
      admin.lastLogin || null,

    createdAt:
      admin.createdAt || null,

    updatedAt:
      admin.updatedAt || null,
  };
};

/* =========================================================
   NORMALIZE EMAIL
========================================================= */

const normalizeEmail = (email) => {
  if (
    typeof email !== "string"
  ) {
    return "";
  }

  return email
    .trim()
    .toLowerCase();
};

/* =========================================================
   ADMIN LOGIN

   POST /api/admin/login

   Body:

   {
     "email": "admin@example.com",
     "password": "********"
   }

========================================================= */

export const adminLogin = async (
  req,
  res
) => {
  try {
    /* ---------------------------------------------------
       JWT CONFIGURATION
    --------------------------------------------------- */

    if (!JWT_SECRET) {
      console.error(
        "Admin login failed: JWT_SECRET is missing."
      );

      return res.status(500).json({
        success: false,
        code: "AUTH_NOT_CONFIGURED",
        message:
          "Authentication service is not configured correctly.",
      });
    }

    /* ---------------------------------------------------
       REQUEST BODY
    --------------------------------------------------- */

    const {
      email,
      password,
    } = req.body || {};

    /* ---------------------------------------------------
       BASIC VALIDATION
    --------------------------------------------------- */

    if (
      typeof email !== "string" ||
      typeof password !== "string"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email and password are required.",
      });
    }

    const normalizedEmail =
      normalizeEmail(email);

    if (!normalizedEmail) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (!password.trim()) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required.",
      });
    }

    /* ---------------------------------------------------
       EMAIL LENGTH
    --------------------------------------------------- */

    if (
      normalizedEmail.length > 254
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email address is too long.",
      });
    }

    /* ---------------------------------------------------
       PASSWORD LENGTH
    ---------------------------------------------------

       This is only a request validation limit.

       Actual password validation is handled by bcrypt.
    --------------------------------------------------- */

    if (password.length > 200) {
      return res.status(400).json({
        success: false,
        message:
          "Password is invalid.",
      });
    }

    /* ---------------------------------------------------
       FIND ADMIN
    ---------------------------------------------------

       Only a database record with role === "admin"
       can authenticate here.

       Password has select:false in Student schema,
       therefore it MUST be explicitly selected here.

       Never trust role from frontend.
    --------------------------------------------------- */

    const admin =
      await Student.findOne({
        email: normalizedEmail,
        role: "admin",
      }).select("+password");

    /* ---------------------------------------------------
       INVALID ADMIN
    --------------------------------------------------- */

    if (!admin) {
      return res.status(401).json({
        success: false,
        code:
          "INVALID_ADMIN_CREDENTIALS",
        message:
          "Invalid admin credentials.",
      });
    }

    /* ---------------------------------------------------
       ACTIVE STATUS
    --------------------------------------------------- */

    if (!admin.isActive) {
      return res.status(403).json({
        success: false,
        code:
          "ADMIN_ACCOUNT_INACTIVE",
        message:
          "Admin account is inactive.",
      });
    }

    /* ---------------------------------------------------
       PASSWORD
    --------------------------------------------------- */

    if (
      typeof admin.password !== "string" ||
      !admin.password
    ) {
      console.error(
        "Admin login failed: password hash is missing."
      );

      return res.status(500).json({
        success: false,
        code:
          "ADMIN_PASSWORD_NOT_CONFIGURED",
        message:
          "Admin authentication is temporarily unavailable.",
      });
    }

    const passwordMatched =
      await bcrypt.compare(
        password,
        admin.password
      );

    if (!passwordMatched) {
      return res.status(401).json({
        success: false,
        code:
          "INVALID_ADMIN_CREDENTIALS",
        message:
          "Invalid admin credentials.",
      });
    }

    /* ---------------------------------------------------
       UPDATE LAST LOGIN
    --------------------------------------------------- */

    admin.lastLogin =
      new Date();

    await admin.save();

    /* ---------------------------------------------------
       CREATE ADMIN JWT
    --------------------------------------------------- */

    const token =
      createAdminToken(
        admin._id.toString()
      );

    /* ---------------------------------------------------
       RESPONSE
    --------------------------------------------------- */

    return res.status(200).json({
      success: true,
      message:
        "Admin login successful.",
      token,
      admin:
        getAdminResponse(admin),
    });
  } catch (error) {
    console.error(
      "Admin Login Error:",
      error
    );

    /* ---------------------------------------------------
       JWT CONFIG ERROR
    --------------------------------------------------- */

    if (
      error?.message ===
      "JWT_SECRET is not configured."
    ) {
      return res.status(500).json({
        success: false,
        code:
          "AUTH_NOT_CONFIGURED",
        message:
          "Authentication service is not configured correctly.",
      });
    }

    /* ---------------------------------------------------
       MONGOOSE VALIDATION
    --------------------------------------------------- */

    if (
      error?.name ===
      "ValidationError"
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Invalid admin account data.",
      });
    }

    /* ---------------------------------------------------
       SERVER ERROR
    --------------------------------------------------- */

    return res.status(500).json({
      success: false,
      message:
        "Server error during admin login.",
    });
  }
};

/* =========================================================
   GET CURRENT ADMIN

   GET /api/admin/me

   Requires:

   adminProtect
   requireAdmin

========================================================= */

export const getAdminMe = async (
  req,
  res
) => {
  try {
    /* ---------------------------------------------------
       AUTH CHECK
    --------------------------------------------------- */

    if (!req.admin) {
      return res.status(401).json({
        success: false,
        code:
          "ADMIN_AUTH_REQUIRED",
        message:
          "Admin authentication required.",
      });
    }

    /* ---------------------------------------------------
       RESPONSE
    --------------------------------------------------- */

    return res.status(200).json({
      success: true,
      admin:
        getAdminResponse(
          req.admin
        ),
    });
  } catch (error) {
    console.error(
      "Get Admin Me Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch admin profile.",
    });
  }
};