import crypto from "crypto";

import Purchase from "../models/Purchase.js";
import Student from "../models/Student.js";

/* =========================================================
   CONFIGURATION
========================================================= */

const RAZORPAY_WEBHOOK_SECRET =
  process.env.RAZORPAY_WEBHOOK_SECRET;

/* =========================================================
   TIMING-SAFE SIGNATURE COMPARISON
========================================================= */

const safeCompare = (
  first,
  second
) => {
  if (
    typeof first !== "string" ||
    typeof second !== "string"
  ) {
    return false;
  }

  const firstBuffer =
    Buffer.from(first, "utf8");

  const secondBuffer =
    Buffer.from(second, "utf8");

  if (
    firstBuffer.length !==
    secondBuffer.length
  ) {
    return false;
  }

  return crypto.timingSafeEqual(
    firstBuffer,
    secondBuffer
  );
};

/* =========================================================
   VERIFY RAZORPAY WEBHOOK SIGNATURE
========================================================= */

const verifyWebhookSignature = (
  rawBody,
  signature
) => {
  if (
    !RAZORPAY_WEBHOOK_SECRET
  ) {
    throw new Error(
      "RAZORPAY_WEBHOOK_SECRET is not configured."
    );
  }

  if (
    !rawBody ||
    !signature
  ) {
    return false;
  }

  const expectedSignature =
    crypto
      .createHmac(
        "sha256",
        RAZORPAY_WEBHOOK_SECRET
      )
      .update(rawBody)
      .digest("hex");

  return safeCompare(
    expectedSignature,
    signature
  );
};

/* =========================================================
   GET PAYMENT AMOUNT
========================================================= */

const getPaymentAmount =
  (payment) => {
    const amount =
      Number(
        payment?.entity?.amount
      );

    if (
      !Number.isFinite(
        amount
      ) ||
      amount < 0
    ) {
      return null;
    }

    return amount / 100;
  };

/* =========================================================
   GET PAYMENT CURRENCY
========================================================= */

const getPaymentCurrency =
  (payment) => {
    return String(
      payment?.entity?.currency ||
        ""
    )
      .trim()
      .toUpperCase();
  };

/* =========================================================
   GET PAYMENT ID
========================================================= */

const getPaymentId =
  (payment) => {
    return String(
      payment?.entity?.id ||
        ""
    ).trim();
  };

/* =========================================================
   GET ORDER ID
========================================================= */

const getOrderId =
  (payment) => {
    return String(
      payment?.entity?.order_id ||
        ""
    ).trim();
  };

/* =========================================================
   PROCESS PAYMENT CAPTURED
========================================================= */

const processPaymentCaptured =
  async (
    payment
  ) => {
    const paymentId =
      getPaymentId(
        payment
      );

    const orderId =
      getOrderId(
        payment
      );

    const paidAmount =
      getPaymentAmount(
        payment
      );

    const paidCurrency =
      getPaymentCurrency(
        payment
      );

    /* -----------------------------------------------------
       BASIC PAYMENT VALIDATION
    ----------------------------------------------------- */

    if (
      !paymentId ||
      !orderId
    ) {
      throw new Error(
        "Webhook payment/order ID is missing."
      );
    }

    if (
      paidAmount === null
    ) {
      throw new Error(
        "Webhook payment amount is invalid."
      );
    }

    if (
      paidCurrency !==
      "INR"
    ) {
      throw new Error(
        "Unsupported payment currency."
      );
    }

    /* -----------------------------------------------------
       FIND PURCHASE BY RAZORPAY ORDER
    ----------------------------------------------------- */

    const purchase =
      await Purchase.findOne({
        paymentOrderId:
          orderId,
      });

    if (!purchase) {
      /*
       * Do not create a purchase from webhook data.
       *
       * The purchase must already exist in our database.
       */

      throw new Error(
        "Purchase associated with Razorpay order was not found."
      );
    }

    /* -----------------------------------------------------
       IDEMPOTENCY
    ----------------------------------------------------- */

    if (
      purchase.status ===
        "paid" &&
      purchase.isActive
    ) {
      /*
       * Webhooks may be delivered more than once.
       *
       * Already-paid purchase is therefore treated as
       * successfully processed.
       */

      return {
        alreadyProcessed:
          true,

        purchase,
      };
    }

    /* -----------------------------------------------------
       PURCHASE MUST BE PENDING
    ----------------------------------------------------- */

    if (
      purchase.status !==
      "pending"
    ) {
      throw new Error(
        `Purchase is not pending. Current status: ${purchase.status}`
      );
    }

    /* -----------------------------------------------------
       VERIFY AMOUNT
    ----------------------------------------------------- */

    const expectedAmount =
      Number(
        purchase.amount
      );

    if (
      !Number.isFinite(
        expectedAmount
      ) ||
      expectedAmount !==
        paidAmount
    ) {
      throw new Error(
        "Webhook payment amount does not match purchase amount."
      );
    }

    /* -----------------------------------------------------
       VERIFY CURRENCY
    ----------------------------------------------------- */

    const expectedCurrency =
      String(
        purchase.currency ||
          "INR"
      )
        .trim()
        .toUpperCase();

    if (
      expectedCurrency !==
      paidCurrency
    ) {
      throw new Error(
        "Webhook payment currency does not match purchase currency."
      );
    }

    /* -----------------------------------------------------
       CHECK PAYMENT ID DUPLICATE
    ----------------------------------------------------- */

    const existingPayment =
      await Purchase.findOne({
        paymentId:
          paymentId,

        _id: {
          $ne:
            purchase._id,
        },
      });

    if (
      existingPayment
    ) {
      /*
       * Same Razorpay payment cannot belong to another
       * purchase.
       */

      throw new Error(
        "This Razorpay payment is already linked to another purchase."
      );
    }

    /* -----------------------------------------------------
       UPDATE PURCHASE
    ----------------------------------------------------- */

    purchase.paymentId =
      paymentId;

    purchase.paidAmount =
      paidAmount;

    purchase.paidCurrency =
      paidCurrency;

    purchase.status =
      "paid";

    purchase.purchasedAt =
      purchase.purchasedAt ||
      new Date();

    purchase.expiresAt =
      null;

    purchase.failureReason =
      "";

    purchase.isActive =
      true;

    await purchase.save();

    /* -----------------------------------------------------
       UPDATE STUDENT ENTITLEMENT
    ----------------------------------------------------- */

    await Student.updateOne(
      {
        _id:
          purchase.student,
      },
      {
        $addToSet: {
          purchasedCourses:
            purchase.course,
        },
      }
    );

    return {
      alreadyProcessed:
        false,

      purchase,
    };
  };

/* =========================================================
   PROCESS PAYMENT FAILED
========================================================= */

const processPaymentFailed =
  async (
    payment
  ) => {
    const paymentId =
      getPaymentId(
        payment
      );

    const orderId =
      getOrderId(
        payment
      );

    if (
      !orderId
    ) {
      throw new Error(
        "Failed payment order ID is missing."
      );
    }

    const purchase =
      await Purchase.findOne({
        paymentOrderId:
          orderId,
      });

    /*
     * A failed webhook should never create a purchase.
     */

    if (!purchase) {
      throw new Error(
        "Purchase associated with failed Razorpay order was not found."
      );
    }

    /* -----------------------------------------------------
       ALREADY FINALIZED
    ----------------------------------------------------- */

    if (
      purchase.status ===
        "paid" &&
      purchase.isActive
    ) {
      return {
        alreadyProcessed:
          true,

        purchase,
      };
    }

    /* -----------------------------------------------------
       DO NOT OVERWRITE SUCCESS
    ----------------------------------------------------- */

    if (
      purchase.status !==
      "pending"
    ) {
      return {
        alreadyProcessed:
          true,

        purchase,
      };
    }

    /* -----------------------------------------------------
       MARK FAILED
    ----------------------------------------------------- */

    purchase.status =
      "failed";

    purchase.isActive =
      false;

    if (
      paymentId
    ) {
      purchase.paymentId =
        paymentId;
    }

    purchase.failureReason =
      "Razorpay reported that the payment failed.";

    await purchase.save();

    return {
      alreadyProcessed:
        false,

      purchase,
    };
  };

/* =========================================================
   RAZORPAY WEBHOOK
=========================================================

POST /api/webhooks/razorpay

IMPORTANT:

This route MUST receive the RAW request body.

Do NOT place express.json() before the webhook route.

========================================================= */

export const razorpayWebhook =
  async (
    req,
    res
  ) => {
    try {
      /* ---------------------------------------------------
         WEBHOOK SECRET
      --------------------------------------------------- */

      if (
        !RAZORPAY_WEBHOOK_SECRET
      ) {
        console.error(
          "Razorpay webhook failed: RAZORPAY_WEBHOOK_SECRET is missing."
        );

        return res.status(500).json({
          success: false,

          message:
            "Webhook service is not configured.",
        });
      }

      /* ---------------------------------------------------
         SIGNATURE
      --------------------------------------------------- */

      const signature =
        req.headers[
          "x-razorpay-signature"
        ];

      if (
        typeof signature !==
        "string"
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Webhook signature is missing.",
        });
      }

      /* ---------------------------------------------------
         RAW BODY
      --------------------------------------------------- */

      const rawBody =
        req.body;

      if (
        !Buffer.isBuffer(
          rawBody
        )
      ) {
        console.error(
          "Razorpay webhook received without raw request body."
        );

        return res.status(400).json({
          success: false,

          message:
            "Invalid webhook body.",
        });
      }

      /* ---------------------------------------------------
         VERIFY SIGNATURE
      --------------------------------------------------- */

      const signatureValid =
        verifyWebhookSignature(
          rawBody,
          signature
        );

      if (
        !signatureValid
      ) {
        console.warn(
          "Invalid Razorpay webhook signature."
        );

        return res.status(400).json({
          success: false,

          message:
            "Invalid webhook signature.",
        });
      }

      /* ---------------------------------------------------
         PARSE JSON
      --------------------------------------------------- */

      let event;

      try {
        event =
          JSON.parse(
            rawBody.toString(
              "utf8"
            )
          );
      } catch (error) {
        console.error(
          "Razorpay webhook JSON parse error:",
          error
        );

        return res.status(400).json({
          success: false,

          message:
            "Invalid webhook JSON.",
        });
      }

      /* ---------------------------------------------------
         EVENT TYPE
      --------------------------------------------------- */

      const eventType =
        String(
          event?.event ||
            ""
        ).trim();

      if (
        !eventType
      ) {
        return res.status(400).json({
          success: false,

          message:
            "Webhook event type is missing.",
        });
      }

      console.log(
        `Razorpay webhook received: ${eventType}`
      );

      /* ---------------------------------------------------
         PAYMENT CAPTURED
      --------------------------------------------------- */

      if (
        eventType ===
        "payment.captured"
      ) {
        const result =
          await processPaymentCaptured(
            event.payload
              ?.payment
          );

        /*
         * IMPORTANT:
         *
         * Razorpay should receive a successful HTTP response
         * when the webhook has been safely processed.
         */

        return res.status(200).json({
          success: true,

          message:
            result.alreadyProcessed
              ? "Webhook already processed."
              : "Payment captured successfully.",
        });
      }

      /* ---------------------------------------------------
         PAYMENT FAILED
      --------------------------------------------------- */

      if (
        eventType ===
        "payment.failed"
      ) {
        const result =
          await processPaymentFailed(
            event.payload
              ?.payment
          );

        return res.status(200).json({
          success: true,

          message:
            result.alreadyProcessed
              ? "Payment failure already processed."
              : "Payment failure processed.",
        });
      }

      /* ---------------------------------------------------
         OTHER EVENTS
      ---------------------------------------------------

         Signature was valid, but this event is not currently
         required by our application.

         Return 200 so Razorpay does not repeatedly retry an
         intentionally ignored event.
      --------------------------------------------------- */

      return res.status(200).json({
        success: true,

        message:
          "Webhook received.",
      });
    } catch (error) {
      console.error(
        "Razorpay Webhook Error:",
        error
      );

      /*
       * Returning 500 tells Razorpay that processing failed
       * and allows webhook retry according to Razorpay's
       * delivery mechanism.
       */

      return res.status(500).json({
        success: false,

        message:
          "Webhook processing failed.",
      });
    }
  };