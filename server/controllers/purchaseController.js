import crypto from "crypto";
import mongoose from "mongoose";

import Course from "../models/Course.js";
import Purchase from "../models/Purchase.js";

import {
  createRazorpayOrder,
  fetchRazorpayOrder,
  fetchRazorpayPayment,
} from "../config/razorpay.js";

/* =========================================================
   CONSTANTS
========================================================= */

const PAYMENT_CURRENCY =
  "INR";

const PAYMENT_GATEWAY =
  "razorpay";

/* =========================================================
   HELPERS
========================================================= */

const isValidObjectId = (
  id
) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

/* =========================================================
   TIMING-SAFE SIGNATURE COMPARISON
========================================================= */

const safeSignatureCompare = (
  expected,
  received
) => {
  if (
    typeof expected !==
      "string" ||
    typeof received !==
      "string"
  ) {
    return false;
  }

  const expectedBuffer =
    Buffer.from(
      expected,
      "utf8"
    );

  const receivedBuffer =
    Buffer.from(
      received,
      "utf8"
    );

  if (
    expectedBuffer.length !==
    receivedBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    expectedBuffer,
    receivedBuffer
  );
};

/* =========================================================
   INR → PAISE
========================================================= */

const rupeesToPaise = (
  amount
) => {
  const numericAmount =
    Number(amount);

  if (
    !Number.isFinite(
      numericAmount
    ) ||
    numericAmount <= 0
  ) {
    return null;
  }

  return Math.round(
    numericAmount * 100
  );
};

/* =========================================================
   CREATE RAZORPAY SIGNATURE
========================================================= */

const createPaymentSignature = (
  orderId,
  paymentId,
  secret
) => {
  return crypto
    .createHmac(
      "sha256",
      secret
    )
    .update(
      `${orderId}|${paymentId}`
    )
    .digest("hex");
};

/* =========================================================
   CREATE PURCHASE + RAZORPAY ORDER

   POST /api/student/purchases

   Body:

   {
     courseId
   }

   IMPORTANT:

   The frontend NEVER controls the final amount.
   Price always comes from the published Course document.
========================================================= */

export const createPurchase =
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         AUTHENTICATION
      =================================================== */

      if (!req.student) {
        return res.status(401).json({
          success: false,

          code:
            "AUTHENTICATION_REQUIRED",

          message:
            "Authentication required.",
        });
      }

      if (
        req.student.isActive !==
        true
      ) {
        return res.status(403).json({
          success: false,

          code:
            "STUDENT_ACCOUNT_INACTIVE",

          message:
            "Student account is inactive.",
        });
      }

      /* ===================================================
         COURSE ID
      =================================================== */

      const {
        courseId,
      } = req.body || {};

      if (!courseId) {
        return res.status(400).json({
          success: false,

          code:
            "COURSE_ID_REQUIRED",

          message:
            "Course ID is required.",
        });
      }

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      /* ===================================================
         FIND PUBLISHED COURSE

         NEVER TRUST FRONTEND PRICE.
      =================================================== */

      const course =
        await Course.findOne({
          _id: courseId,

          isPublished: true,
        }).select(
          [
            "_id",
            "title",
            "shortTitle",
            "exam",
            "price",
            "oldPrice",
            "thumbnail",
            "isPublished",
          ].join(" ")
        );

      if (!course) {
        return res.status(404).json({
          success: false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found or is not available for purchase.",
        });
      }

      /* ===================================================
         SERVER-SIDE PRICE
      =================================================== */

      const amount =
        Number(
          course.price
        );

      const amountInPaise =
        rupeesToPaise(
          amount
        );

      if (
        amountInPaise ===
          null ||
        amountInPaise <= 0
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_COURSE_PRICE",

          message:
            "Course has an invalid price.",
        });
      }

      /* ===================================================
         CHECK EXISTING PURCHASE

         Only one active purchase should normally exist
         for a student/course pair.
      =================================================== */

      let purchase =
        await Purchase.findOne({
          student:
            req.student._id,

          course:
            course._id,

          isActive:
            true,
        });

      /* ===================================================
         ALREADY PAID
      =================================================== */

      if (
        purchase?.status ===
        "paid"
      ) {
        return res.status(409).json({
          success: false,

          code:
            "COURSE_ALREADY_PURCHASED",

          message:
            "You have already purchased this course.",

          hasAccess:
            true,

          purchase: {
            id:
              purchase._id,

            amount:
              purchase.amount,

            currency:
              purchase.currency,

            status:
              purchase.status,

            purchasedAt:
              purchase.purchasedAt,
          },
        });
      }

      /* ===================================================
         REUSE VALID PENDING RAZORPAY ORDER
      =================================================== */

      let razorpayOrder =
        null;

      if (
        purchase?.status ===
          "pending" &&
        purchase.paymentOrderId
      ) {
        try {
          const existingOrder =
            await fetchRazorpayOrder(
              purchase.paymentOrderId
            );

          const existingOrderAmount =
            Number(
              existingOrder?.amount
            );

          const existingOrderCurrency =
            String(
              existingOrder?.currency ||
                ""
            ).toUpperCase();

          /*
           * Reuse only when the Razorpay order matches
           * the current server-side price and currency.
           */

          if (
            existingOrder &&
            existingOrder.status !==
              "paid" &&
            existingOrderAmount ===
              amountInPaise &&
            existingOrderCurrency ===
              PAYMENT_CURRENCY
          ) {
            razorpayOrder =
              existingOrder;
          }
        } catch (error) {
          console.warn(
            "Existing Razorpay order could not be reused:",
            error?.message ||
              error
          );
        }
      }

      /* ===================================================
         CREATE / UPDATE PURCHASE RECORD
      =================================================== */

      if (!purchase) {
        purchase =
          await Purchase.create({
            student:
              req.student._id,

            course:
              course._id,

            amount,

            currency:
              PAYMENT_CURRENCY,

            status:
              "pending",

            paymentGateway:
              PAYMENT_GATEWAY,

            paymentOrderId:
              "",

            paymentId:
              "",

            paymentSignature:
              "",

            purchasedAt:
              null,

            expiresAt:
              null,

            isActive:
              true,
          });
      } else {
        purchase.amount =
          amount;

        purchase.currency =
          PAYMENT_CURRENCY;

        purchase.status =
          "pending";

        purchase.paymentGateway =
          PAYMENT_GATEWAY;

        purchase.isActive =
          true;

        await purchase.save();
      }

      /* ===================================================
         CREATE NEW RAZORPAY ORDER
      =================================================== */

      if (!razorpayOrder) {
        const receipt =
          `ta_${purchase._id
            .toString()
            .slice(-24)}`;

        razorpayOrder =
          await createRazorpayOrder({
            amount:
  amount,

            currency:
              PAYMENT_CURRENCY,

            receipt,

            notes: {
              purchaseId:
                purchase._id.toString(),

              studentId:
                req.student._id.toString(),

              courseId:
                course._id.toString(),
            },
          });

        /* =================================================
           VERIFY CREATED ORDER

           Never blindly trust the helper response.
        ================================================= */

        if (
          !razorpayOrder?.id
        ) {
          throw new Error(
            "Razorpay did not return a valid order ID."
          );
        }

        if (
          Number(
            razorpayOrder.amount
          ) !==
          amountInPaise
        ) {
          throw new Error(
            "Razorpay order amount mismatch."
          );
        }

        if (
          String(
            razorpayOrder.currency ||
              ""
          ).toUpperCase() !==
          PAYMENT_CURRENCY
        ) {
          throw new Error(
            "Razorpay order currency mismatch."
          );
        }

        purchase.paymentOrderId =
          razorpayOrder.id;

        await purchase.save();
      }

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(201).json({
        success: true,

        message:
          "Payment order created successfully.",

        purchase: {
          id:
            purchase._id,

          amount:
            purchase.amount,

          currency:
            purchase.currency,

          status:
            purchase.status,

          paymentOrderId:
            purchase.paymentOrderId,
        },

        razorpay: {
          keyId:
            process.env
              .RAZORPAY_KEY_ID,

          orderId:
            razorpayOrder.id,

          amount:
            Number(
              razorpayOrder.amount
            ),

          currency:
            razorpayOrder.currency,
        },

        course: {
          id:
            course._id,

          title:
            course.title,

          shortTitle:
            course.shortTitle,

          thumbnail:
            course.thumbnail,
        },
      });
    } catch (error) {
      console.error(
        "Create Purchase Error:",
        error
      );

      /* =================================================
         DUPLICATE KEY
      ================================================= */

      if (
        error?.code ===
        11000
      ) {
        return res.status(409).json({
          success: false,

          code:
            "PURCHASE_ALREADY_EXISTS",

          message:
            "A purchase for this course already exists.",
        });
      }

      /* =================================================
         MONGOOSE VALIDATION
      ================================================= */

      if (
        error?.name ===
        "ValidationError"
      ) {
        const message =
          Object.values(
            error.errors || {}
          )
            .map(
              (
                item
              ) =>
                item.message
            )[0] ||
          "Invalid purchase data.";

        return res.status(400).json({
          success: false,

          message,
        });
      }

      /* =================================================
         SERVER ERROR
      ================================================= */

      return res.status(500).json({
        success: false,

        code:
          "PURCHASE_CREATE_ERROR",

        message:
          "Unable to create payment order.",
      });
    }
  };

/* =========================================================
   VERIFY RAZORPAY PAYMENT

   POST /api/student/purchases/verify
========================================================= */

export const verifyPurchasePayment =
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         AUTHENTICATION
      =================================================== */

      if (!req.student) {
        return res.status(401).json({
          success: false,

          code:
            "AUTHENTICATION_REQUIRED",

          message:
            "Authentication required.",
        });
      }

      if (
        req.student.isActive !==
        true
      ) {
        return res.status(403).json({
          success: false,

          code:
            "STUDENT_ACCOUNT_INACTIVE",

          message:
            "Student account is inactive.",
        });
      }

      /* ===================================================
         REQUEST BODY
      =================================================== */

      const {
        purchaseId,
        razorpayPaymentId,
        razorpayOrderId,
        razorpaySignature,
      } =
        req.body || {};

      if (
        !purchaseId ||
        !razorpayPaymentId ||
        !razorpayOrderId ||
        !razorpaySignature
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_DATA_REQUIRED",

          message:
            "Complete payment verification data is required.",
        });
      }

      /* ===================================================
         PURCHASE ID
      =================================================== */

      if (
        !isValidObjectId(
          purchaseId
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_PURCHASE_ID",

          message:
            "Invalid purchase ID.",
        });
      }

      /* ===================================================
         FIND PURCHASE

         Student ownership is mandatory.
      =================================================== */

      const purchase =
        await Purchase.findOne({
          _id:
            purchaseId,

          student:
            req.student._id,

          paymentGateway:
            PAYMENT_GATEWAY,
        });

      if (!purchase) {
        return res.status(404).json({
          success: false,

          code:
            "PURCHASE_NOT_FOUND",

          message:
            "Purchase not found.",
        });
      }

      /* ===================================================
         ALREADY PAID / IDEMPOTENCY
      =================================================== */

      if (
        purchase.status ===
        "paid"
      ) {
        /*
         * Only return success when the supplied payment
         * identifiers are consistent with the stored
         * successful transaction.
         */

        if (
          purchase.paymentId &&
          purchase.paymentId !==
            razorpayPaymentId
        ) {
          return res.status(409).json({
            success: false,

            code:
              "PURCHASE_ALREADY_COMPLETED",

            message:
              "This purchase has already been completed with a different payment.",
          });
        }

        return res.status(200).json({
          success: true,

          message:
            "Payment has already been verified.",

          hasAccess:
            true,

          purchase: {
            id:
              purchase._id,

            courseId:
              purchase.course,

            status:
              purchase.status,

            amount:
              purchase.amount,

            currency:
              purchase.currency,

            paymentOrderId:
              purchase.paymentOrderId,

            paymentId:
              purchase.paymentId,

            purchasedAt:
              purchase.purchasedAt,

            expiresAt:
              purchase.expiresAt,

            isActive:
              purchase.isActive,
          },
        });
      }

      /* ===================================================
         ORDER ID REQUIRED
      =================================================== */

      if (
        !purchase.paymentOrderId
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_ORDER_MISSING",

          message:
            "Payment order is missing for this purchase.",
        });
      }

      /* ===================================================
         ORDER ID MATCH
      =================================================== */

      if (
        purchase.paymentOrderId !==
        razorpayOrderId
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_ORDER_MISMATCH",

          message:
            "Payment order does not match this purchase.",
        });
      }

      /* ===================================================
         RAZORPAY SECRET
      =================================================== */

      const razorpaySecret =
        process.env
          .RAZORPAY_KEY_SECRET;

      if (!razorpaySecret) {
        console.error(
          "RAZORPAY_KEY_SECRET is missing."
        );

        return res.status(500).json({
          success: false,

          code:
            "PAYMENT_CONFIGURATION_ERROR",

          message:
            "Payment service is not configured.",
        });
      }

      /* ===================================================
         SIGNATURE VERIFICATION
      =================================================== */

      const generatedSignature =
        createPaymentSignature(
          razorpayOrderId,
          razorpayPaymentId,
          razorpaySecret
        );

      if (
        !safeSignatureCompare(
          generatedSignature,
          razorpaySignature
        )
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_PAYMENT_SIGNATURE",

          message:
            "Payment signature verification failed.",
        });
      }

      /* ===================================================
         FETCH RAZORPAY ORDER
      =================================================== */

      const razorpayOrder =
        await fetchRazorpayOrder(
          razorpayOrderId
        );

      if (
        !razorpayOrder
      ) {
        return res.status(400).json({
          success: false,

          code:
            "RAZORPAY_ORDER_NOT_FOUND",

          message:
            "Razorpay order could not be found.",
        });
      }

      /* ===================================================
         ORDER STATUS

         A verified payment must belong to a valid order.
      =================================================== */

      if (
        razorpayOrder.status ===
        "paid"
      ) {
        /*
         * Fine.
         *
         * Continue to verify the actual payment below.
         */
      } else if (
        razorpayOrder.status !==
          "created" &&
        razorpayOrder.status !==
          "attempted"
      ) {
        return res.status(400).json({
          success: false,

          code:
            "INVALID_RAZORPAY_ORDER_STATUS",

          message:
            "Razorpay order is not in a valid payment state.",
        });
      }

      /* ===================================================
         VERIFY ORDER AMOUNT
      =================================================== */

      const expectedAmount =
        rupeesToPaise(
          purchase.amount
        );

      if (
        expectedAmount ===
          null ||
        Number(
          razorpayOrder.amount
        ) !==
          expectedAmount
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_AMOUNT_MISMATCH",

          message:
            "Payment amount does not match the purchase amount.",
        });
      }

      /* ===================================================
         VERIFY ORDER CURRENCY
      =================================================== */

      if (
        String(
          razorpayOrder.currency ||
            ""
        ).toUpperCase() !==
        PAYMENT_CURRENCY
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_CURRENCY_MISMATCH",

          message:
            "Payment currency is invalid.",
        });
      }

      /* ===================================================
         VERIFY RAZORPAY PAYMENT
      =================================================== */

      const razorpayPayment =
        await fetchRazorpayPayment(
          razorpayPaymentId
        );

      if (
        !razorpayPayment
      ) {
        return res.status(400).json({
          success: false,

          code:
            "RAZORPAY_PAYMENT_NOT_FOUND",

          message:
            "Razorpay payment could not be found.",
        });
      }

      /* ===================================================
         PAYMENT ORDER MATCH
      =================================================== */

      if (
        razorpayPayment.order_id !==
        razorpayOrderId
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_ORDER_MISMATCH",

          message:
            "Payment does not belong to this order.",
        });
      }

      /* ===================================================
         PAYMENT AMOUNT MATCH
      =================================================== */

      if (
        Number(
          razorpayPayment.amount
        ) !==
        expectedAmount
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_AMOUNT_MISMATCH",

          message:
            "Paid amount does not match the purchase amount.",
        });
      }

      /* ===================================================
         PAYMENT CURRENCY MATCH
      =================================================== */

      if (
        String(
          razorpayPayment.currency ||
            ""
        ).toUpperCase() !==
        PAYMENT_CURRENCY
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_CURRENCY_MISMATCH",

          message:
            "Payment currency does not match.",
        });
      }

      /* ===================================================
         CAPTURED PAYMENT REQUIRED
      =================================================== */

      if (
        razorpayPayment.status !==
        "captured"
      ) {
        return res.status(400).json({
          success: false,

          code:
            "PAYMENT_NOT_CAPTURED",

          message:
            "Payment has not been captured yet.",
        });
      }

      /* ===================================================
         SAVE VERIFIED PAYMENT
      =================================================== */

      purchase.paymentId =
        razorpayPaymentId;

      purchase.paymentSignature =
        razorpaySignature;

      purchase.paidAmount =
        Number(
          razorpayPayment.amount
        ) / 100;

      purchase.paidCurrency =
        String(
          razorpayPayment.currency ||
            ""
        ).toUpperCase();

      purchase.failureReason =
        "";

      purchase.status =
        "paid";

      purchase.purchasedAt =
        purchase.purchasedAt ||
        new Date();

      purchase.isActive =
        true;

      await purchase.save();

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(200).json({
        success: true,

        message:
          "Payment verified successfully.",

        hasAccess:
          true,

        purchase: {
          id:
            purchase._id,

          courseId:
            purchase.course,

          amount:
            purchase.amount,

          currency:
            purchase.currency,

          status:
            purchase.status,

          paymentOrderId:
            purchase.paymentOrderId,

          paymentId:
            purchase.paymentId,

          purchasedAt:
            purchase.purchasedAt,

          expiresAt:
            purchase.expiresAt,

          isActive:
            purchase.isActive,
        },
      });
    } catch (error) {
      console.error(
        "Verify Purchase Payment Error:",
        error
      );

      return res.status(500).json({
        success: false,

        code:
          "PAYMENT_VERIFICATION_ERROR",

        message:
          "Unable to verify payment.",
      });
    }
  };

/* =========================================================
   GET MY PURCHASES

   GET /api/student/purchases
========================================================= */

export const getMyPurchases =
  async (
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

      const purchases =
        await Purchase.find({
          student:
            req.student._id,
        })
          .populate({
            path:
              "course",

            select:
              "title shortTitle exam thumbnail price duration isPublished",
          })
          .sort({
            createdAt:
              -1,
          });

      /*
       * Return a controlled response rather than blindly
       * exposing every Purchase document field.
       */

      const safePurchases =
        purchases.map(
          (
            purchase
          ) => ({
            id:
              purchase._id,

            course:
              purchase.course,

            amount:
              purchase.amount,

            currency:
              purchase.currency,

            status:
              purchase.status,

            paymentGateway:
              purchase.paymentGateway,

            paymentOrderId:
              purchase.paymentOrderId,

            paymentId:
              purchase.paymentId,

            purchasedAt:
              purchase.purchasedAt,

            expiresAt:
              purchase.expiresAt,

            isActive:
              purchase.isActive,
          })
        );

      return res.status(200).json({
        success: true,

        count:
          safePurchases.length,

        purchases:
          safePurchases,
      });
    } catch (error) {
      console.error(
        "Get My Purchases Error:",
        error
      );

      return res.status(500).json({
        success: false,

        message:
          "Unable to fetch purchases.",
      });
    }
  };

/* =========================================================
   CHECK COURSE ACCESS

   GET /api/student/purchases/access/:courseId

   Backend is the final authority for course access.
========================================================= */

export const checkCourseAccess =
  async (
    req,
    res
  ) => {
    try {
      if (!req.student) {
        return res.status(401).json({
          success: false,

          hasAccess:
            false,

          message:
            "Authentication required.",
        });
      }

      if (
        req.student.isActive !==
        true
      ) {
        return res.status(403).json({
          success: false,

          hasAccess:
            false,

          code:
            "STUDENT_ACCOUNT_INACTIVE",

          message:
            "Student account is inactive.",
        });
      }

      const {
        courseId,
      } = req.params;

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success: false,

          hasAccess:
            false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      /* ===================================================
         VERIFY COURSE EXISTS
      =================================================== */

      const courseExists =
        await Course.exists({
          _id: courseId,

          isPublished: true,
        });

      if (
        !courseExists
      ) {
        return res.status(404).json({
          success: false,

          hasAccess:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found or is not available.",
        });
      }

      /* ===================================================
         FIND PAID ACTIVE PURCHASE
      =================================================== */

      const purchase =
        await Purchase.findOne({
          student:
            req.student._id,

          course:
            courseId,

          status:
            "paid",

          isActive:
            true,
        }).select(
          "expiresAt purchasedAt"
        );

      if (!purchase) {
        return res.status(200).json({
          success: true,

          hasAccess:
            false,

          reason:
            "COURSE_NOT_PURCHASED",
        });
      }

      /* ===================================================
         EXPIRY CHECK
      =================================================== */

      if (
        purchase.expiresAt &&
        new Date(
          purchase.expiresAt
        ).getTime() <=
          Date.now()
      ) {
        /*
         * Mark expired access inactive so future checks
         * don't continue treating it as active.
         */

        await Purchase.updateOne(
          {
            _id:
              purchase._id,
          },
          {
            $set: {
              isActive:
                false,
            },
          }
        );

        return res.status(200).json({
          success: true,

          hasAccess:
            false,

          reason:
            "COURSE_ACCESS_EXPIRED",

          expiresAt:
            purchase.expiresAt,
        });
      }

      /* ===================================================
         ACCESS GRANTED
      =================================================== */

      return res.status(200).json({
        success: true,

        hasAccess:
          true,

        purchasedAt:
          purchase.purchasedAt,

        expiresAt:
          purchase.expiresAt,
      });
    } catch (error) {
      console.error(
        "Check Course Access Error:",
        error
      );

      return res.status(500).json({
        success: false,

        hasAccess:
          false,

        message:
          "Unable to check course access.",
      });
    }
  };