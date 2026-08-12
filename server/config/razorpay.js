import Razorpay from "razorpay";

/* =========================================================
   RAZORPAY ENVIRONMENT VARIABLES
========================================================= */

const RAZORPAY_KEY_ID =
  process.env.RAZORPAY_KEY_ID;

const RAZORPAY_KEY_SECRET =
  process.env.RAZORPAY_KEY_SECRET;

/* =========================================================
   CONFIGURATION CHECK
========================================================= */

const isRazorpayConfigured =
  Boolean(
    RAZORPAY_KEY_ID &&
      RAZORPAY_KEY_SECRET
  );

/* =========================================================
   RAZORPAY INSTANCE
========================================================= */

const razorpay =
  isRazorpayConfigured
    ? new Razorpay({
        key_id:
          RAZORPAY_KEY_ID,

        key_secret:
          RAZORPAY_KEY_SECRET,
      })
    : null;

/* =========================================================
   CHECK RAZORPAY CONFIGURATION
========================================================= */

export const checkRazorpayConfig =
  () => {
    if (
      !RAZORPAY_KEY_ID ||
      !RAZORPAY_KEY_SECRET
    ) {
      return false;
    }

    return true;
  };

/* =========================================================
   GET RAZORPAY KEY ID
=========================================================

   Safe to send to frontend.

   NEVER expose:

   RAZORPAY_KEY_SECRET

========================================================= */

export const getRazorpayKeyId =
  () => {
    return (
      RAZORPAY_KEY_ID ||
      null
    );
  };

/* =========================================================
   CREATE RAZORPAY ORDER
=========================================================

   amount is supplied in INR.

   Example:

   499
   ↓
   49900 paise

========================================================= */

export const createRazorpayOrder =
  async ({
    amount,
    currency = "INR",
    receipt,
    notes = {},
  }) => {
    if (
      !isRazorpayConfigured ||
      !razorpay
    ) {
      throw new Error(
        "Razorpay is not configured."
      );
    }

    /* -----------------------------------------------------
       AMOUNT VALIDATION
    ----------------------------------------------------- */

    if (
      typeof amount !==
        "number" ||
      !Number.isFinite(
        amount
      ) ||
      amount <= 0
    ) {
      throw new Error(
        "Invalid Razorpay order amount."
      );
    }

    /* -----------------------------------------------------
       INR → PAISE
    ----------------------------------------------------- */

    const amountInSubunits =
      Math.round(
        amount * 100
      );

    if (
      !Number.isSafeInteger(
        amountInSubunits
      ) ||
      amountInSubunits <= 0
    ) {
      throw new Error(
        "Invalid payment amount."
      );
    }

    /* -----------------------------------------------------
       CURRENCY
    ----------------------------------------------------- */

    const normalizedCurrency =
      String(
        currency || "INR"
      )
        .trim()
        .toUpperCase();

    if (
      normalizedCurrency !==
      "INR"
    ) {
      throw new Error(
        "Only INR payments are currently supported."
      );
    }

    /* -----------------------------------------------------
       RECEIPT
    ----------------------------------------------------- */

    const normalizedReceipt =
      String(
        receipt || ""
      )
        .trim()
        .slice(0, 40);

    if (
      !normalizedReceipt
    ) {
      throw new Error(
        "Razorpay receipt is required."
      );
    }

    /* -----------------------------------------------------
       SAFE NOTES
    ----------------------------------------------------- */

    const safeNotes = {};

    if (
      notes &&
      typeof notes ===
        "object" &&
      !Array.isArray(notes)
    ) {
      for (
        const [key, value] of
          Object.entries(
            notes
          )
      ) {
        if (
          typeof value ===
            "string" ||
          typeof value ===
            "number" ||
          typeof value ===
            "boolean"
        ) {
          const safeKey =
            String(key)
              .trim()
              .slice(0, 100);

          if (!safeKey) {
            continue;
          }

          safeNotes[
            safeKey
          ] = String(
            value
          ).slice(
            0,
            256
          );
        }
      }
    }

    /* -----------------------------------------------------
       CREATE RAZORPAY ORDER
    ----------------------------------------------------- */

    const order =
      await razorpay.orders.create(
        {
          amount:
            amountInSubunits,

          currency:
            normalizedCurrency,

          receipt:
            normalizedReceipt,

          notes:
            safeNotes,
        }
      );

    /* -----------------------------------------------------
       VALIDATE RAZORPAY RESPONSE
    ----------------------------------------------------- */

    if (
      !order ||
      !order.id
    ) {
      throw new Error(
        "Razorpay returned an invalid order response."
      );
    }

    /* -----------------------------------------------------
       NORMALIZED RESPONSE
    ----------------------------------------------------- */

    return {
      id:
        order.id,

      amount:
        order.amount,

      amountDue:
        order.amount_due,

      amountPaid:
        order.amount_paid,

      currency:
        order.currency,

      status:
        order.status,

      receipt:
        order.receipt,

      createdAt:
        order.created_at,
    };
  };

/* =========================================================
   FETCH RAZORPAY ORDER
========================================================= */

export const fetchRazorpayOrder =
  async (
    orderId
  ) => {
    if (
      !isRazorpayConfigured ||
      !razorpay
    ) {
      throw new Error(
        "Razorpay is not configured."
      );
    }

    if (
      typeof orderId !==
        "string" ||
      !orderId.trim()
    ) {
      throw new Error(
        "Razorpay order ID is required."
      );
    }

    const normalizedOrderId =
      orderId.trim();

    const order =
      await razorpay.orders.fetch(
        normalizedOrderId
      );

    if (
      !order ||
      !order.id
    ) {
      throw new Error(
        "Razorpay returned an invalid order."
      );
    }

    return order;
  };

/* =========================================================
   FETCH RAZORPAY PAYMENT
========================================================= */

export const fetchRazorpayPayment =
  async (
    paymentId
  ) => {
    if (
      !isRazorpayConfigured ||
      !razorpay
    ) {
      throw new Error(
        "Razorpay is not configured."
      );
    }

    if (
      typeof paymentId !==
        "string" ||
      !paymentId.trim()
    ) {
      throw new Error(
        "Razorpay payment ID is required."
      );
    }

    const normalizedPaymentId =
      paymentId.trim();

    const payment =
      await razorpay.payments.fetch(
        normalizedPaymentId
      );

    if (
      !payment ||
      !payment.id
    ) {
      throw new Error(
        "Razorpay returned an invalid payment."
      );
    }

    return payment;
  };

/* =========================================================
   EXPORT RAZORPAY INSTANCE
========================================================= */

export default razorpay;