import express from "express";

import {
  createPurchase,
  verifyPurchasePayment,
  getMyPurchases,
  checkCourseAccess,
} from "../controllers/purchaseController.js";

import {
  protect,
} from "../middleware/authMiddleware.js";

/* =========================================================
   STUDENT PURCHASE ROUTER

   Base route:

   /api/student/purchases
========================================================= */

const router =
  express.Router();

/* =========================================================
   CREATE PURCHASE

   POST /api/student/purchases

   Body:
   {
     "courseId": "COURSE_ID"
   }

   Requires:
   - Valid student JWT
   - Active student
   - Published course

   Flow:

   Student
      ↓
   Course validation
      ↓
   Existing purchase check
      ↓
   Razorpay order
      ↓
   Pending purchase
      ↓
   Frontend payment checkout
========================================================= */

router.post(
  "/",
  protect,
  createPurchase
);

/* =========================================================
   VERIFY PURCHASE PAYMENT

   POST /api/student/purchases/verify

   Body:
   {
     "purchaseId": "PURCHASE_ID",
     "razorpayPaymentId": "PAYMENT_ID",
     "razorpayOrderId": "ORDER_ID",
     "razorpaySignature": "SIGNATURE"
   }

   Requires:
   - Valid student JWT
   - Purchase belongs to logged-in student

   Controller MUST verify:
   - Razorpay signature
   - Purchase ownership
   - Razorpay order ID
   - Expected amount
   - Currency
   - Payment status/capture
   - Course ownership
========================================================= */

router.post(
  "/verify",
  protect,
  verifyPurchasePayment
);

/* =========================================================
   GET MY PURCHASES

   GET /api/student/purchases

   Returns only purchases belonging to the authenticated
   student.

   Possible statuses may include:
   - pending
   - paid
   - failed
   - cancelled
   - refunded
========================================================= */

router.get(
  "/",
  protect,
  getMyPurchases
);

/* =========================================================
   CHECK COURSE ACCESS

   GET /api/student/purchases/access/:courseId

   Returns:

   {
     "success": true,
     "hasAccess": true
   }

   OR:

   {
     "success": true,
     "hasAccess": false
   }

   Access should only be granted when the backend confirms:

   purchase.status === "paid"

   AND

   purchase.isActive === true

   AND

   purchase belongs to the authenticated student

   AND

   purchase belongs to the requested course.
========================================================= */

router.get(
  "/access/:courseId",
  protect,
  checkCourseAccess
);

/* =========================================================
   EXPORT
========================================================= */

export default router;