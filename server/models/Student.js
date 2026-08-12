import mongoose from "mongoose";

/* =========================================================
   STUDENT SCHEMA
========================================================= */

const studentSchema = new mongoose.Schema(
  {
    /* =======================================================
       BASIC INFORMATION
    ======================================================= */

    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
      minlength: [2, "Name must be at least 2 characters"],
      maxlength: [100, "Name cannot exceed 100 characters"],
    },

    /* =======================================================
       EMAIL
    ======================================================= */

    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
      maxlength: [150, "Email cannot exceed 150 characters"],
      index: true,
    },

    /* =======================================================
       MOBILE
    ======================================================= */

    mobile: {
      type: String,
      required: [true, "Mobile number is required"],
      unique: true,
      trim: true,
      index: true,
    },

    /* =======================================================
       PASSWORD
    =======================================================

       Password is ALWAYS stored as a bcrypt hash.

       select:false prevents the password hash from being
       returned by normal MongoDB queries.

       Login explicitly requests it with:

       .select("+password")
    ======================================================= */

    password: {
      type: String,
      required: [true, "Password is required"],
      minlength: [8, "Password must be at least 8 characters"],
      maxlength: [128, "Password cannot exceed 128 characters"],
      select: false,
    },

    /* =======================================================
       PASSWORD RESET TOKEN HASH
    =======================================================

       Only SHA-256 hash is stored.

       The original reset token is never stored in MongoDB.
    ======================================================= */

    passwordResetTokenHash: {
      type: String,
      default: null,
      select: false,
    },

    /* =======================================================
       PASSWORD RESET EXPIRY
    ======================================================= */

    passwordResetExpiresAt: {
      type: Date,
      default: null,
      select: false,
    },

    /* =======================================================
       PASSWORD RESET REQUEST TIME
    =======================================================

       Used to prevent repeated password reset requests.
    ======================================================= */

    passwordResetRequestedAt: {
      type: Date,
      default: null,
      select: false,
    },

    /* =======================================================
       PROFILE IMAGE
    ======================================================= */

    profileImage: {
      type: String,
      default: "",
      trim: true,
    },

    /* =======================================================
       ROLE
    ======================================================= */

    role: {
      type: String,
      enum: {
        values: ["student", "admin"],
        message: "Role must be either student or admin.",
      },
      default: "student",
      index: true,
    },

    /* =======================================================
       PURCHASED COURSES
    =======================================================

       Kept compatible with the existing platform structure.

       Later, if a dedicated Purchase/Order model is used,
       payment ownership should be verified from that backend
       record rather than trusting this array alone.
    ======================================================= */

    purchasedCourses: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Course",
      },
    ],

    /* =======================================================
       ACCOUNT STATUS
    ======================================================= */

    isActive: {
      type: Boolean,
      default: true,
      index: true,
    },

    /* =======================================================
       LAST LOGIN
    ======================================================= */

    lastLogin: {
      type: Date,
      default: null,
    },
  },

  /* =========================================================
     SCHEMA OPTIONS
  ========================================================= */

  {
    timestamps: true,

    /*
     * Prevent accidental storage of unknown fields when
     * using strict Mongoose operations.
     */
    strict: true,
  }
);

/* =========================================================
   STUDENT MODEL

   Reuse the existing model when it has already been
   compiled.

   Prevents:

   OverwriteModelError:
   Cannot overwrite `Student` model once compiled.
========================================================= */

const Student =
  mongoose.models.Student ||
  mongoose.model("Student", studentSchema);

export default Student;