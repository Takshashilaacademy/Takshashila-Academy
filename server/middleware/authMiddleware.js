import jwt from "jsonwebtoken";
import Student from "../models/Student.js";

/* =========================================================
   JWT CONFIGURATION
========================================================= */

const JWT_SECRET =
  process.env.JWT_SECRET;

const JWT_ISSUER =
  process.env.JWT_ISSUER ||
  "takshashila-academy";

const JWT_AUDIENCE =
  process.env.JWT_AUDIENCE ||
  "takshashila-students";

/* =========================================================
   JWT SECRET CHECK
========================================================= */

if (!JWT_SECRET) {
  console.error(
    "JWT_SECRET is missing from environment variables."
  );
}

/* =========================================================
   GET BEARER TOKEN
========================================================= */

const getBearerToken = (req) => {
  const authHeader =
    req.headers?.authorization;

  if (
    typeof authHeader !==
    "string"
  ) {
    return null;
  }

  if (
    !authHeader.startsWith(
      "Bearer "
    )
  ) {
    return null;
  }

  const token =
    authHeader
      .slice(7)
      .trim();

  if (!token) {
    return null;
  }

  return token;
};

/* =========================================================
   GET AUTHENTICATED STUDENT
========================================================= */

const findAuthenticatedStudent =
  async (decoded) => {
    if (
      !decoded ||
      typeof decoded !== "object" ||
      !decoded.id
    ) {
      return null;
    }

    const student =
      await Student.findById(
        decoded.id
      ).select(
        "-password"
      );

    return student;
  };

/* =========================================================
   ATTACH AUTH CONTEXT
========================================================= */

const attachAuthContext = (
  req,
  student,
  decoded
) => {
  req.student = student;

  /*
   * Generic alias for future controllers.
   */
  req.user = student;

  /*
   * Authentication metadata.
   */
  req.auth = {
    userId: student._id,

    role: student.role,

    /*
     * Token role is retained only as metadata.
     * Authorization decisions use the current database
     * role rather than trusting the token role.
     */
    tokenRole:
      decoded?.role || null,

    tokenIssuedAt:
      decoded?.iat
        ? new Date(
            decoded.iat * 1000
          )
        : null,

    tokenExpiresAt:
      decoded?.exp
        ? new Date(
            decoded.exp * 1000
          )
        : null,
  };
};

/* =========================================================
   VERIFY JWT TOKEN
========================================================= */

export const protect = async (
  req,
  res,
  next
) => {
  try {
    /* =====================================================
       JWT SECRET
    ===================================================== */

    if (!JWT_SECRET) {
      console.error(
        "Authentication failed: JWT_SECRET is not configured."
      );

      return res.status(500).json({
        success: false,
        message:
          "Server authentication configuration is missing.",
      });
    }

    /* =====================================================
       GET TOKEN
    ===================================================== */

    const token =
      getBearerToken(req);

    if (!token) {
      return res.status(401).json({
        success: false,
        code:
          "AUTHENTICATION_REQUIRED",
        message:
          "Authentication required. Please login first.",
      });
    }

    /* =====================================================
       VERIFY JWT
    ===================================================== */

    const decoded =
      jwt.verify(
        token,
        JWT_SECRET,
        {
          algorithms: [
            "HS256",
          ],

          issuer:
            JWT_ISSUER,

          audience:
            JWT_AUDIENCE,
        }
      );

    /* =====================================================
       VALIDATE PAYLOAD
    ===================================================== */

    if (
      !decoded ||
      typeof decoded !==
        "object" ||
      !decoded.id
    ) {
      return res.status(401).json({
        success: false,
        code:
          "INVALID_TOKEN",
        message:
          "Invalid authentication token.",
      });
    }

    /* =====================================================
       FIND CURRENT STUDENT
    ===================================================== */

    const student =
      await findAuthenticatedStudent(
        decoded
      );

    if (!student) {
      return res.status(401).json({
        success: false,
        code:
          "STUDENT_NOT_FOUND",
        message:
          "Student account not found.",
      });
    }

    /* =====================================================
       ACTIVE ACCOUNT CHECK
    ===================================================== */

    if (
      student.isActive !== true
    ) {
      return res.status(403).json({
        success: false,
        code:
          "ACCOUNT_INACTIVE",
        message:
          "Your account has been deactivated.",
      });
    }

    /* =====================================================
       ROLE CONSISTENCY CHECK
    ===================================================== */

    if (
      decoded.role &&
      decoded.role !==
        student.role
    ) {
      console.warn(
        `JWT role mismatch for student ${student._id}. Token role: ${decoded.role}, database role: ${student.role}`
      );

      return res.status(401).json({
        success: false,
        code:
          "AUTHENTICATION_STATE_CHANGED",
        message:
          "Your authentication session is no longer valid. Please login again.",
      });
    }

    /* =====================================================
       ATTACH USER
    ===================================================== */

    attachAuthContext(
      req,
      student,
      decoded
    );

    /* =====================================================
       CONTINUE
    ===================================================== */

    return next();
  } catch (error) {
    console.error(
      "Auth Middleware Error:",
      error?.message ||
        error
    );

    /* =====================================================
       TOKEN EXPIRED
    ===================================================== */

    if (
      error?.name ===
      "TokenExpiredError"
    ) {
      return res.status(401).json({
        success: false,
        code:
          "TOKEN_EXPIRED",
        message:
          "Your session has expired. Please login again.",
      });
    }

    /* =====================================================
       TOKEN NOT ACTIVE
    ===================================================== */

    if (
      error?.name ===
      "NotBeforeError"
    ) {
      return res.status(401).json({
        success: false,
        code:
          "TOKEN_NOT_ACTIVE",
        message:
          "Authentication token is not active yet.",
      });
    }

    /* =====================================================
       INVALID JWT
    ===================================================== */

    if (
      error?.name ===
      "JsonWebTokenError"
    ) {
      return res.status(401).json({
        success: false,
        code:
          "INVALID_TOKEN",
        message:
          "Invalid authentication token. Please login again.",
      });
    }

    /* =====================================================
       DATABASE / UNKNOWN ERROR
    ===================================================== */

    return res.status(500).json({
      success: false,
      message:
        "Authentication service temporarily unavailable.",
    });
  }
};

/* =========================================================
   OPTIONAL AUTHENTICATION
========================================================= */

export const optionalProtect =
  async (
    req,
    res,
    next
  ) => {
    try {
      /* ===================================================
         DEFAULT GUEST STATE
      =================================================== */

      req.student = null;
      req.user = null;
      req.auth = null;

      /* ===================================================
         GET TOKEN
      =================================================== */

      const token =
        getBearerToken(req);

      /*
       * No token means guest.
       */

      if (!token) {
        return next();
      }

      /*
       * Missing secret means we cannot authenticate.
       * Public endpoint can still continue as guest.
       */

      if (!JWT_SECRET) {
        return next();
      }

      /* ===================================================
         VERIFY TOKEN
      =================================================== */

      const decoded =
        jwt.verify(
          token,
          JWT_SECRET,
          {
            algorithms: [
              "HS256",
            ],

            issuer:
              JWT_ISSUER,

            audience:
              JWT_AUDIENCE,
          }
        );

      if (
        !decoded ||
        typeof decoded !==
          "object" ||
        !decoded.id
      ) {
        return next();
      }

      /* ===================================================
         FIND STUDENT
      =================================================== */

      const student =
        await findAuthenticatedStudent(
          decoded
        );

      /*
       * Invalid/deleted user behaves like guest.
       */

      if (!student) {
        return next();
      }

      /* ===================================================
         ACTIVE ACCOUNT
      =================================================== */

      if (
        student.isActive !== true
      ) {
        return next();
      }

      /* ===================================================
         ROLE CONSISTENCY
      =================================================== */

      if (
        decoded.role &&
        decoded.role !==
          student.role
      ) {
        return next();
      }

      /* ===================================================
         ATTACH AUTH
      =================================================== */

      attachAuthContext(
        req,
        student,
        decoded
      );

      return next();
    } catch {
      /*
       * Optional authentication must never break
       * a public endpoint because of an invalid token.
       */

      req.student = null;
      req.user = null;
      req.auth = null;

      return next();
    }
  };

/* =========================================================
   ADMIN ONLY
========================================================= */

export const adminOnly = (
  req,
  res,
  next
) => {
  /* =======================================================
     AUTHENTICATION
  ======================================================= */

  const user =
    req.student ||
    req.user;

  if (!user) {
    return res.status(401).json({
      success: false,
      code:
        "AUTHENTICATION_REQUIRED",
      message:
        "Authentication required.",
    });
  }

  /* =======================================================
     ACTIVE ACCOUNT
  ======================================================= */

  if (
    user.isActive !== true
  ) {
    return res.status(403).json({
      success: false,
      code:
        "ACCOUNT_INACTIVE",
      message:
        "Admin account is inactive.",
    });
  }

  /* =======================================================
     ROLE
  ======================================================= */

  if (
    user.role !==
    "admin"
  ) {
    return res.status(403).json({
      success: false,
      code:
        "ADMIN_ACCESS_REQUIRED",
      message:
        "Admin access required.",
    });
  }

  return next();
};

/* =========================================================
   ROLE-BASED ACCESS
========================================================= */

export const allowRoles = (
  ...allowedRoles
) => {
  return (
    req,
    res,
    next
  ) => {
    /* =====================================================
       AUTHENTICATION
    ===================================================== */

    const user =
      req.student ||
      req.user;

    if (!user) {
      return res.status(401).json({
        success: false,
        code:
          "AUTHENTICATION_REQUIRED",
        message:
          "Authentication required.",
      });
    }

    /* =====================================================
       VALID ROLE CONFIGURATION
    ===================================================== */

    if (
      !Array.isArray(
        allowedRoles
      ) ||
      allowedRoles.length === 0
    ) {
      console.error(
        "allowRoles() was used without specifying allowed roles."
      );

      return res.status(500).json({
        success: false,
        message:
          "Authorization configuration error.",
      });
    }

    /* =====================================================
       ACTIVE ACCOUNT
    ===================================================== */

    if (
      user.isActive !== true
    ) {
      return res.status(403).json({
        success: false,
        code:
          "ACCOUNT_INACTIVE",
        message:
          "Your account is inactive.",
      });
    }

    /* =====================================================
       ROLE CHECK
    ===================================================== */

    if (
      !allowedRoles.includes(
        user.role
      )
    ) {
      return res.status(403).json({
        success: false,
        code:
          "INSUFFICIENT_PERMISSIONS",
        message:
          "You do not have permission to access this resource.",
      });
    }

    return next();
  };
};

/* =========================================================
   REQUIRE ADMIN
========================================================= */

export const requireAdmin =
  adminOnly;

/* =========================================================
   DEFAULT EXPORT
========================================================= */

export default {
  protect,
  optionalProtect,
  adminOnly,
  allowRoles,
  requireAdmin,
};