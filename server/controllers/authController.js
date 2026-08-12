import bcrypt from "bcryptjs";
import crypto from "crypto";
import jwt from "jsonwebtoken";

import Student from "../models/Student.js";

import {
  sendPasswordResetEmail,
  checkEmailConfig,
} from "../services/emailService.js";

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
  "takshashila-students";

/* =========================================================
   PASSWORD RESET CONFIGURATION
========================================================= */

const PASSWORD_RESET_EXPIRES_MINUTES =
  Math.max(
    5,
    Number(
      process.env
        .PASSWORD_RESET_EXPIRES_MINUTES || 15
    )
  );

const PASSWORD_RESET_COOLDOWN_MS =
  60 * 1000;

/* =========================================================
   CREATE STUDENT JWT
========================================================= */

const createToken = (
  studentId,
  role = "student"
) => {
  if (!JWT_SECRET) {
    throw new Error(
      "JWT_SECRET is not configured."
    );
  }

  return jwt.sign(
    {
      id: studentId,
      role,
      tokenType: "student",
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
   SAFE STUDENT RESPONSE

   NEVER return:
   - password
   - reset token
   - internal sensitive fields
========================================================= */

const getStudentResponse = (
  student
) => {
  if (!student) {
    return null;
  }

  return {
    id: student._id,
    name: student.name,
    email: student.email,
    mobile: student.mobile,
    profileImage:
      student.profileImage || null,
    role:
      student.role || "student",
  };
};

/* =========================================================
   JWT CONFIGURATION CHECK
========================================================= */

const ensureJwtConfiguration = (
  res
) => {
  if (!JWT_SECRET) {
    console.error(
      "JWT_SECRET is missing from environment variables."
    );

    res.status(500).json({
      success: false,
      message:
        "Authentication service is not configured correctly.",
    });

    return false;
  }

  return true;
};

/* =========================================================
   NORMALIZE EMAIL
========================================================= */

const normalizeEmail = (
  email
) => {
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
   NORMALIZE MOBILE
========================================================= */

const normalizeMobile = (
  mobile
) => {
  if (
    typeof mobile !== "string"
  ) {
    return "";
  }

  return mobile
    .trim()
    .replace(
      /[\s\-()]/g,
      ""
    );
};

/* =========================================================
   EMAIL VALIDATION
========================================================= */

const isValidEmail = (
  email
) => {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(
    email
  );
};

/* =========================================================
   MOBILE VALIDATION
========================================================= */

const isValidMobile = (
  mobile
) => {
  return /^[6-9]\d{9}$/.test(
    mobile
  );
};

/* =========================================================
   NAME VALIDATION

   Supports:
   - English
   - Hindi / Devanagari
   - Other Unicode letters
========================================================= */

const isValidName = (
  name
) => {
  return /^[\p{L}\p{M}\s.'-]+$/u.test(
    name
  );
};

/* =========================================================
   PASSWORD VALIDATION
========================================================= */

const validatePassword = (
  password
) => {
  if (
    typeof password !==
    "string"
  ) {
    return {
      valid: false,
      message:
        "Password is required.",
    };
  }

  if (
    password.length < 8
  ) {
    return {
      valid: false,
      message:
        "Password must be at least 8 characters.",
    };
  }

  if (
    password.length > 128
  ) {
    return {
      valid: false,
      message:
        "Password cannot exceed 128 characters.",
    };
  }

  return {
    valid: true,
    message: "",
  };
};

/* =========================================================
   HASH RESET TOKEN
========================================================= */

const hashResetToken = (
  token
) => {
  return crypto
    .createHash("sha256")
    .update(token)
    .digest("hex");
};

/* =========================================================
   GENERATE RESET TOKEN
========================================================= */

const generateResetToken = () => {
  return crypto
    .randomBytes(32)
    .toString("hex");
};

/* =========================================================
   PASSWORD RESET URL
========================================================= */

const buildPasswordResetUrl = (
  token
) => {
  const frontendUrl = String(
  process.env.FRONTEND_URL ||
    "http://localhost:5173"
)
  .split(",")[0]
  .trim()
  .replace(/\/+$/, "");

  return `${frontendUrl}/reset-password?token=${encodeURIComponent(
    token
  )}`;
};

/* =========================================================
   STUDENT SIGNUP
========================================================= */

export const signup = async (
  req,
  res
) => {
  try {
    /* =====================================================
       JWT CONFIG
    ===================================================== */

    if (
      !ensureJwtConfiguration(
        res
      )
    ) {
      return;
    }

    /* =====================================================
       REQUEST BODY
    ===================================================== */

    const {
      name,
      email,
      mobile,
      password,
    } = req.body || {};

    if (
      !name ||
      !email ||
      !mobile ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name, email, mobile and password are required.",
      });
    }

    /* =====================================================
       NORMALIZE DATA
    ===================================================== */

    const normalizedName =
      typeof name === "string"
        ? name
            .trim()
            .replace(/\s+/g, " ")
        : "";

    const normalizedEmail =
      normalizeEmail(email);

    const normalizedMobile =
      normalizeMobile(mobile);

    /* =====================================================
       NAME VALIDATION
    ===================================================== */

    if (
      normalizedName.length < 2
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name must contain at least 2 characters.",
      });
    }

    if (
      normalizedName.length > 100
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Name cannot exceed 100 characters.",
      });
    }

    if (
      !isValidName(
        normalizedName
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid name.",
      });
    }

    /* =====================================================
       EMAIL VALIDATION
    ===================================================== */

    if (
      !isValidEmail(
        normalizedEmail
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid email address.",
      });
    }

    if (
      normalizedEmail.length > 150
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Email address cannot exceed 150 characters.",
      });
    }

    /* =====================================================
       MOBILE VALIDATION
    ===================================================== */

    if (
      !isValidMobile(
        normalizedMobile
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit mobile number.",
      });
    }

    /* =====================================================
       PASSWORD VALIDATION
    ===================================================== */

    const passwordValidation =
      validatePassword(password);

    if (
      !passwordValidation.valid
    ) {
      return res.status(400).json({
        success: false,
        message:
          passwordValidation.message,
      });
    }

    /* =====================================================
       EXISTING STUDENT CHECK

       We intentionally check both email and mobile.
    ===================================================== */

    const existingStudent =
      await Student.findOne({
        $or: [
          {
            email:
              normalizedEmail,
          },
          {
            mobile:
              normalizedMobile,
          },
        ],
      }).select(
        "email mobile"
      );

    if (
      existingStudent?.email ===
      normalizedEmail
    ) {
      return res.status(409).json({
        success: false,
        code:
          "EMAIL_EXISTS",
        message:
          "An account with this email already exists.",
      });
    }

    if (
      existingStudent?.mobile ===
      normalizedMobile
    ) {
      return res.status(409).json({
        success: false,
        code:
          "MOBILE_EXISTS",
        message:
          "An account with this mobile number already exists.",
      });
    }

    /* =====================================================
       HASH PASSWORD
    ===================================================== */

    const hashedPassword =
      await bcrypt.hash(
        password,
        12
      );

    /* =====================================================
       CREATE STUDENT
    ===================================================== */

    const student =
      await Student.create({
        name:
          normalizedName,

        email:
          normalizedEmail,

        mobile:
          normalizedMobile,

        password:
          hashedPassword,

        role:
          "student",

        isActive:
          true,
      });

    /* =====================================================
       CREATE AUTH TOKEN
    ===================================================== */

    const token =
      createToken(
        student._id.toString(),
        student.role
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(201).json({
      success: true,

      message:
        "Student account created successfully.",

      token,

      student:
        getStudentResponse(
          student
        ),
    });
  } catch (error) {
    console.error(
      "Signup Error:",
      error
    );

    /* =====================================================
       MONGODB DUPLICATE KEY
    ===================================================== */

    if (
      error?.code === 11000
    ) {
      const duplicateFields =
        Object.keys(
          error.keyPattern ||
            {}
        );

      if (
        duplicateFields.includes(
          "email"
        )
      ) {
        return res.status(409).json({
          success: false,
          code:
            "EMAIL_EXISTS",
          message:
            "An account with this email already exists.",
        });
      }

      if (
        duplicateFields.includes(
          "mobile"
        )
      ) {
        return res.status(409).json({
          success: false,
          code:
            "MOBILE_EXISTS",
          message:
            "An account with this mobile number already exists.",
        });
      }

      return res.status(409).json({
        success: false,
        message:
          "Email or mobile number already exists.",
      });
    }

    /* =====================================================
       MONGOOSE VALIDATION ERROR
    ===================================================== */

    if (
      error?.name ===
      "ValidationError"
    ) {
      const messages =
        Object.values(
          error.errors || {}
        ).map(
          (item) =>
            item.message
        );

      return res.status(400).json({
        success: false,
        message:
          messages[0] ||
          "Invalid student data.",
      });
    }

    /* =====================================================
       GENERIC SERVER ERROR
    ===================================================== */

    return res.status(500).json({
      success: false,
      message:
        "Server error while creating student account.",
    });
  }
};

/* =========================================================
   STUDENT LOGIN
========================================================= */

export const login = async (
  req,
  res
) => {
  try {
    /* =====================================================
       JWT CONFIG
    ===================================================== */

    if (
      !ensureJwtConfiguration(
        res
      )
    ) {
      return;
    }

    const {
      mobile,
      password,
    } = req.body || {};

    /* =====================================================
       REQUIRED FIELDS
    ===================================================== */

    if (
      !mobile ||
      !password
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Mobile number and password are required.",
      });
    }

    /* =====================================================
       NORMALIZE MOBILE
    ===================================================== */

    const normalizedMobile =
      normalizeMobile(mobile);

    if (
      !isValidMobile(
        normalizedMobile
      )
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Please enter a valid 10-digit mobile number.",
      });
    }

    if (
      typeof password !==
        "string" ||
      !password.length
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password is required.",
      });
    }

    if (
      password.length > 128
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Password cannot exceed 128 characters.",
      });
    }

    /* =====================================================
       FIND STUDENT

       IMPORTANT:
       +password is required when the Student model
       defines password with select:false.
    ===================================================== */

    const student =
      await Student.findOne({
        mobile:
          normalizedMobile,
      }).select(
        "+password"
      );

    /* =====================================================
       INVALID CREDENTIALS

       Do not reveal whether the mobile exists.
    ===================================================== */

    if (!student) {
      return res.status(401).json({
        success: false,
        code:
          "INVALID_CREDENTIALS",
        message:
          "Invalid mobile number or password.",
      });
    }

    /* =====================================================
       ACCOUNT STATUS
    ===================================================== */

    if (
      student.isActive === false
    ) {
      return res.status(403).json({
        success: false,
        code:
          "ACCOUNT_INACTIVE",
        message:
          "Your student account is inactive. Please contact support.",
      });
    }

    /* =====================================================
       PASSWORD CHECK
    ===================================================== */

    if (
      typeof student.password !==
      "string"
    ) {
      console.error(
        `Student ${student._id} does not have a usable password hash.`
      );

      return res.status(500).json({
        success: false,
        message:
          "Authentication service is temporarily unavailable.",
      });
    }

    const passwordMatch =
      await bcrypt.compare(
        password,
        student.password
      );

    if (!passwordMatch) {
      return res.status(401).json({
        success: false,
        code:
          "INVALID_CREDENTIALS",
        message:
          "Invalid mobile number or password.",
      });
    }

    /* =====================================================
       UPDATE LAST LOGIN

       Avoid making login fail if lastLogin cannot be
       persisted, because credentials have already passed.
    ===================================================== */

    try {
      student.lastLogin =
        new Date();

      await student.save();
    } catch (lastLoginError) {
      console.warn(
        "Unable to update student lastLogin:",
        lastLoginError
      );
    }

    /* =====================================================
       CREATE JWT
    ===================================================== */

    const token =
      createToken(
        student._id.toString(),
        student.role ||
          "student"
      );

    /* =====================================================
       RESPONSE
    ===================================================== */

    return res.status(200).json({
      success: true,

      message:
        "Login successful.",

      token,

      student:
        getStudentResponse(
          student
        ),
    });
  } catch (error) {
    console.error(
      "Login Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Server error while logging in.",
    });
  }
};

/* =========================================================
   FORGOT PASSWORD
========================================================= */

export const forgotPassword =
  async (
    req,
    res
  ) => {
    const genericMessage =
      "If an account exists with this email, a password reset link will be sent shortly.";

    try {
      const email =
        normalizeEmail(
          req.body?.email
        );

      /* =====================================================
         EMAIL VALIDATION
      ===================================================== */

      if (
        !isValidEmail(email)
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Please enter a valid email address.",
        });
      }

      /* =====================================================
         FIND STUDENT
      ===================================================== */

      const student =
        await Student.findOne({
          email,
        }).select(
          "+passwordResetTokenHash +passwordResetExpiresAt +passwordResetRequestedAt"
        );

      /*
       * Do not reveal whether the email exists.
       */

      if (!student) {
        return res.status(200).json({
          success: true,
          message:
            genericMessage,
        });
      }

      /* =====================================================
         REQUEST COOLDOWN
      ===================================================== */

      const now = Date.now();

      const lastRequested =
        student.passwordResetRequestedAt
          ? new Date(
              student.passwordResetRequestedAt
            ).getTime()
          : 0;

      if (
        lastRequested &&
        now -
          lastRequested <
          PASSWORD_RESET_COOLDOWN_MS
      ) {
        return res.status(200).json({
          success: true,
          message:
            genericMessage,
        });
      }

      /* =====================================================
         CHECK EMAIL CONFIGURATION
      ===================================================== */

      let emailConfigured =
        false;

      try {
        emailConfigured =
          Boolean(
            checkEmailConfig()
          );
      } catch (configError) {
        console.error(
          "Email configuration check failed:",
          configError
        );

        emailConfigured = false;
      }

      /*
       * Production must have real email delivery.
       */

      if (
        !emailConfigured &&
        process.env.NODE_ENV ===
          "production"
      ) {
        console.error(
          "Password reset requested but SMTP/email service is not configured."
        );

        return res.status(503).json({
          success: false,
          message:
            "Password reset service is temporarily unavailable. Please try again later.",
        });
      }

      /* =====================================================
         GENERATE RESET TOKEN
      ===================================================== */

      const resetToken =
        generateResetToken();

      const tokenHash =
        hashResetToken(
          resetToken
        );

      const expiresAt =
        new Date(
          now +
            PASSWORD_RESET_EXPIRES_MINUTES *
              60 *
              1000
        );

      student.passwordResetTokenHash =
        tokenHash;

      student.passwordResetExpiresAt =
        expiresAt;

      student.passwordResetRequestedAt =
        new Date();

      await student.save();

      /* =====================================================
         RESET URL
      ===================================================== */

      const resetUrl =
        buildPasswordResetUrl(
          resetToken
        );

      /* =====================================================
         SEND EMAIL
      ===================================================== */

      if (
        emailConfigured
      ) {
        try {
          await sendPasswordResetEmail({
            to: email,
            resetUrl,
            expiresInMinutes:
              PASSWORD_RESET_EXPIRES_MINUTES,
          });

          console.log(
            "Password reset email sent successfully."
          );

          /*
           * Never return the reset URL to the client
           * when real email delivery is enabled.
           */

          return res.status(200).json({
            success: true,
            message:
              genericMessage,
          });
        } catch (
          emailError
        ) {
          console.error(
            "Password reset email failed:",
            emailError
          );

          /*
           * Invalidate token if delivery failed.
           */

          student.passwordResetTokenHash =
            null;

          student.passwordResetExpiresAt =
            null;

          student.passwordResetRequestedAt =
            null;

          await student.save();

          if (
            process.env.NODE_ENV ===
            "development"
          ) {
            return res.status(503).json({
              success: false,
              message:
                "Password reset email could not be sent. Check SMTP configuration.",
            });
          }

          return res.status(503).json({
            success: false,
            message:
              "Password reset service is temporarily unavailable. Please try again later.",
          });
        }
      }

      /* =====================================================
         DEVELOPMENT-ONLY FALLBACK
      ===================================================== */

      if (
        process.env.NODE_ENV !==
        "production"
      ) {
        console.warn(
          "SMTP is not configured. Development-only reset URL generated."
        );

        return res.status(200).json({
          success: true,

          message:
            genericMessage,

          developmentOnly:
            true,

          resetUrl,

          expiresAt,
        });
      }

      /* =====================================================
         FINAL PRODUCTION RESPONSE
      ===================================================== */

      return res.status(200).json({
        success: true,
        message:
          genericMessage,
      });
    } catch (error) {
      console.error(
        "Forgot Password Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to process password reset request.",
      });
    }
  };

/* =========================================================
   RESET PASSWORD
========================================================= */

export const resetPassword =
  async (
    req,
    res
  ) => {
    try {
      const {
        token,
        password,
      } = req.body || {};

      /* =====================================================
         TOKEN VALIDATION
      ===================================================== */

      if (
        typeof token !==
          "string" ||
        !token.trim()
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Password reset token is required.",
        });
      }

      /*
       * Reset tokens generated by crypto.randomBytes(32)
       * are 64 hex characters.
       */

      if (
        !/^[a-f0-9]{64}$/i.test(
          token.trim()
        )
      ) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_RESET_TOKEN",
          message:
            "This password reset link is invalid or has expired.",
        });
      }

      /* =====================================================
         PASSWORD VALIDATION
      ===================================================== */

      const passwordValidation =
        validatePassword(
          password
        );

      if (
        !passwordValidation.valid
      ) {
        return res.status(400).json({
          success: false,
          message:
            passwordValidation.message,
        });
      }

      /* =====================================================
         HASH TOKEN
      ===================================================== */

      const tokenHash =
        hashResetToken(
          token.trim()
        );

      /* =====================================================
         FIND VALID TOKEN
      ===================================================== */

      const student =
        await Student.findOne({
          passwordResetTokenHash:
            tokenHash,

          passwordResetExpiresAt: {
            $gt: new Date(),
          },
        }).select(
          "+passwordResetTokenHash +passwordResetExpiresAt +passwordResetRequestedAt"
        );

      /* =====================================================
         INVALID / EXPIRED TOKEN
      ===================================================== */

      if (!student) {
        return res.status(400).json({
          success: false,
          code:
            "INVALID_OR_EXPIRED_RESET_TOKEN",
          message:
            "This password reset link is invalid or has expired. Please request a new one.",
        });
      }

      /* =====================================================
         HASH NEW PASSWORD
      ===================================================== */

      const hashedPassword =
        await bcrypt.hash(
          password,
          12
        );

      student.password =
        hashedPassword;

      /* =====================================================
         INVALIDATE RESET TOKEN

         Reset tokens are single-use.
      ===================================================== */

      student.passwordResetTokenHash =
        null;

      student.passwordResetExpiresAt =
        null;

      student.passwordResetRequestedAt =
        null;

      await student.save();

      console.log(
        `Password reset completed for student ${student._id}`
      );

      /* =====================================================
         RESPONSE
      ===================================================== */

      return res.status(200).json({
        success: true,

        message:
          "Password reset successful. Please login with your new password.",
      });
    } catch (error) {
      console.error(
        "Reset Password Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to reset password.",
      });
    }
  };

/* =========================================================
   GET CURRENT STUDENT
========================================================= */

export const getMe = async (
  req,
  res
) => {
  try {
    if (!req.student) {
      return res.status(401).json({
        success: false,
        message:
          "Authentication required.",
      });
    }

    return res.status(200).json({
      success: true,

      student:
        getStudentResponse(
          req.student
        ),
    });
  } catch (error) {
    console.error(
      "Get Me Error:",
      error
    );

    return res.status(500).json({
      success: false,
      message:
        "Unable to fetch student profile.",
    });
  }
};