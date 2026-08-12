import mongoose from "mongoose";

import Purchase from "../models/Purchase.js";

/* =========================================================
   COURSE ACCESS MIDDLEWARE
=========================================================

   PURPOSE:

   Student JWT
        ↓
   Student account
        ↓
   Course ID
        ↓
   Paid Purchase
        ↓
   Active entitlement
        ↓
   Allow protected content

   IMPORTANT:

   Login alone does NOT give course access.

========================================================= */

/* =========================================================
   VALIDATE OBJECT ID
========================================================= */

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

/* =========================================================
   REQUIRE COURSE ACCESS
=========================================================

   Usage:

   router.get(
     "/courses/:courseId/content",
     protect,
     requireCourseAccess,
     controller
   );

   Course ID can come from:

   req.params.courseId

   or:

   req.body.courseId

   or:

   req.query.courseId

========================================================= */

export const requireCourseAccess =
  async (
    req,
    res,
    next
  ) => {
    try {
      /* ---------------------------------------------------
         STUDENT AUTHENTICATION
      --------------------------------------------------- */

      if (!req.student) {
        return res.status(401).json({
          success: false,
          message:
            "Authentication required.",
        });
      }

      /* ---------------------------------------------------
         ACCOUNT STATUS
      --------------------------------------------------- */

      if (
        !req.student.isActive
      ) {
        return res.status(403).json({
          success: false,
          message:
            "Student account is inactive.",
        });
      }

      /* ---------------------------------------------------
         GET COURSE ID
      --------------------------------------------------- */

      const courseId =
        req.params?.courseId ||
        req.body?.courseId ||
        req.query?.courseId;

      /* ---------------------------------------------------
         COURSE ID REQUIRED
      --------------------------------------------------- */

      if (!courseId) {
        return res.status(400).json({
          success: false,
          message:
            "Course ID is required.",
        });
      }

      /* ---------------------------------------------------
         VALIDATE COURSE ID
      --------------------------------------------------- */

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid course ID.",
        });
      }

      /* ---------------------------------------------------
         FIND ACTIVE PAID PURCHASE
      --------------------------------------------------- */

      const purchase =
        await Purchase.findOne({
          student:
            req.student._id,

          course:
            courseId,

          status: "paid",

          isActive: true,
        }).select(
          "_id student course amount currency status purchasedAt expiresAt isActive"
        );

      /* ---------------------------------------------------
         NO ACCESS
      --------------------------------------------------- */

      if (!purchase) {
        return res.status(403).json({
          success: false,

          code:
            "COURSE_ACCESS_REQUIRED",

          message:
            "You do not have access to this course. Please purchase the course first.",
        });
      }

      /* ---------------------------------------------------
         EXPIRY CHECK
      ---------------------------------------------------

         Normally paid lifetime courses have:

         expiresAt = null

         But if future subscriptions or time-limited
         courses use expiresAt, enforce it here.
      --------------------------------------------------- */

      if (
        purchase.expiresAt &&
        purchase.expiresAt <=
          new Date()
      ) {
        /*
         * Disable expired entitlement.
         */

        purchase.isActive =
          false;

        purchase.status =
          "cancelled";

        purchase.failureReason =
          "Course access expired.";

        await purchase.save();

        return res.status(403).json({
          success: false,

          code:
            "COURSE_ACCESS_EXPIRED",

          message:
            "Your course access has expired.",
        });
      }

      /* ---------------------------------------------------
         ATTACH PURCHASE
      ---------------------------------------------------

         Controllers can use:

         req.coursePurchase

         instead of querying MongoDB again.
      --------------------------------------------------- */

      req.coursePurchase =
        purchase;

      /* ---------------------------------------------------
         ACCESS GRANTED
      --------------------------------------------------- */

      return next();
    } catch (error) {
      console.error(
        "Course Access Middleware Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to verify course access.",
      });
    }
  };

/* =========================================================
   OPTIONAL COURSE ACCESS HELPER
========================================================= */

/*
 * Useful when a controller needs to check access without
 * immediately returning an HTTP response.

 * Returns:

   {
     hasAccess: true,
     purchase
   }

   OR:

   {
     hasAccess: false,
     purchase: null
   }
*/

export const getCourseAccess =
  async (
    studentId,
    courseId
  ) => {
    try {
      if (
        !studentId ||
        !courseId
      ) {
        return {
          hasAccess: false,

          purchase: null,
        };
      }

      if (
        !isValidObjectId(
          studentId
        ) ||
        !isValidObjectId(
          courseId
        )
      ) {
        return {
          hasAccess: false,

          purchase: null,
        };
      }

      const purchase =
        await Purchase.findOne({
          student:
            studentId,

          course:
            courseId,

          status: "paid",

          isActive: true,
        });

      if (!purchase) {
        return {
          hasAccess: false,

          purchase: null,
        };
      }

      /* ---------------------------------------------------
         EXPIRY
      --------------------------------------------------- */

      if (
        purchase.expiresAt &&
        purchase.expiresAt <=
          new Date()
      ) {
        purchase.isActive =
          false;

        purchase.status =
          "cancelled";

        purchase.failureReason =
          "Course access expired.";

        await purchase.save();

        return {
          hasAccess: false,

          purchase: null,
        };
      }

      return {
        hasAccess: true,

        purchase,
      };
    } catch (error) {
      console.error(
        "Get Course Access Error:",
        error
      );

      return {
        hasAccess: false,

        purchase: null,
      };
    }
  };