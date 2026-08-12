import dotenv from "dotenv";
import bcrypt from "bcryptjs";

import connectDB from "../config/db.js";
import Student from "../models/Student.js";

dotenv.config();

/* =========================================================
   ADMIN CREATE / UPDATE SCRIPT

   Behavior:
   - If admin does not exist -> create admin
   - If admin already exists -> update credentials
   - Password is always stored as bcrypt hash
   - Password is NEVER printed
========================================================= */

const createOrUpdateAdmin = async () => {
  try {
    await connectDB();

    /* =======================================================
       READ ENVIRONMENT VARIABLES
    ======================================================= */

    const adminEmail = String(
      process.env.ADMIN_EMAIL || ""
    )
      .trim()
      .toLowerCase();

    const adminMobile = String(
      process.env.ADMIN_MOBILE || ""
    ).replace(/\D/g, "");

    const adminPassword = String(
      process.env.ADMIN_PASSWORD || ""
    );

    /* =======================================================
       VALIDATE ENVIRONMENT VARIABLES
    ======================================================= */

    if (
      !adminEmail ||
      !adminMobile ||
      !adminPassword
    ) {
      throw new Error(
        "ADMIN_EMAIL, ADMIN_MOBILE and ADMIN_PASSWORD must be configured in the server environment."
      );
    }

    /* =======================================================
       VALIDATE EMAIL
    ======================================================= */

    const emailRegex =
      /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

    if (!emailRegex.test(adminEmail)) {
      throw new Error(
        "ADMIN_EMAIL must be a valid email address."
      );
    }

    /* =======================================================
       VALIDATE MOBILE
    ======================================================= */

    if (
      adminMobile.length !== 10 ||
      !/^[6-9]\d{9}$/.test(adminMobile)
    ) {
      throw new Error(
        "ADMIN_MOBILE must be a valid 10-digit Indian mobile number."
      );
    }

    /* =======================================================
       VALIDATE PASSWORD
    ======================================================= */

    if (adminPassword.length < 12) {
      throw new Error(
        "ADMIN_PASSWORD must be at least 12 characters long."
      );
    }

    /* =======================================================
       FIND EXISTING ADMIN
    ======================================================= */

    const existingAdmin = await Student.findOne({
      role: "admin",
    });

    /* =======================================================
       CHECK EMAIL / MOBILE CONFLICT
    ======================================================= */

    const conflictQuery = {
      $or: [
        { email: adminEmail },
        { mobile: adminMobile },
      ],
    };

    if (existingAdmin) {
      conflictQuery._id = {
        $ne: existingAdmin._id,
      };
    }

    const conflictingUser = await Student.findOne(
      conflictQuery
    );

    if (conflictingUser) {
      throw new Error(
        "The requested admin email or mobile number is already used by another account."
      );
    }

    /* =======================================================
       HASH PASSWORD
    ======================================================= */

    const hashedPassword = await bcrypt.hash(
      adminPassword,
      12
    );

    /* =======================================================
       UPDATE EXISTING ADMIN
    ======================================================= */

    if (existingAdmin) {
      existingAdmin.email = adminEmail;
      existingAdmin.mobile = adminMobile;
      existingAdmin.password = hashedPassword;
      existingAdmin.role = "admin";
      existingAdmin.isActive = true;

      await existingAdmin.save();

      console.log("");
      console.log(
        "=============================================="
      );
      console.log(
        "       ADMIN ACCOUNT UPDATED"
      );
      console.log(
        "=============================================="
      );
      console.log(
        `Email  : ${existingAdmin.email}`
      );
      console.log(
        `Mobile : ${existingAdmin.mobile}`
      );
      console.log(
        `Role   : ${existingAdmin.role}`
      );
      console.log(
        "Password: updated securely"
      );
      console.log(
        "=============================================="
      );
      console.log("");

      process.exit(0);
    }

    /* =======================================================
       CREATE NEW ADMIN
    ======================================================= */

    const admin = await Student.create({
      name: "Takshashila Admin",
      email: adminEmail,
      mobile: adminMobile,
      password: hashedPassword,
      role: "admin",
      isActive: true,
    });

    console.log("");
    console.log(
      "=============================================="
    );
    console.log(
      "       ADMIN ACCOUNT CREATED"
    );
    console.log(
      "=============================================="
    );
    console.log(
      `Email  : ${admin.email}`
    );
    console.log(
      `Mobile : ${admin.mobile}`
    );
    console.log(
      `Role   : ${admin.role}`
    );
    console.log(
      "Password: stored securely as bcrypt hash"
    );
    console.log(
      "=============================================="
    );
    console.log("");
    console.log(
      "IMPORTANT: Keep ADMIN_PASSWORD private."
    );
    console.log("");

    process.exit(0);
  } catch (error) {
    console.error("");
    console.error(
      "=============================================="
    );
    console.error(
      "       ADMIN CREATE / UPDATE FAILED"
    );
    console.error(
      "=============================================="
    );
    console.error(
      error?.message || "Unknown error"
    );
    console.error(
      "=============================================="
    );
    console.error("");

    process.exit(1);
  }
};

createOrUpdateAdmin();