import mongoose from "mongoose";

/* =========================================================
   PURCHASE SCHEMA

   One Purchase document represents one student's
   relationship with one course.

   IMPORTANT:

   A student can have only ONE purchase record for
   a particular course.

   Payment lifecycle:

   pending
      ↓
   paid

   OR

   pending
      ↓
   failed / cancelled

   paid
      ↓
   refunded
========================================================= */

const purchaseSchema = new mongoose.Schema(
  {
    /* =====================================================
       STUDENT
    ===================================================== */

    student: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Student",

      required: [
        true,
        "Student is required",
      ],

      index: true,
    },

    /* =====================================================
       COURSE
    ===================================================== */

    course: {
      type: mongoose.Schema.Types.ObjectId,

      ref: "Course",

      required: [
        true,
        "Course is required",
      ],

      index: true,
    },

    /* =====================================================
       PURCHASE AMOUNT

       Amount is stored in RUPEES.

       Example:

       999 = ₹999

       Razorpay receives:

       99900 paise
    ===================================================== */

    amount: {
      type: Number,

      required: [
        true,
        "Purchase amount is required",
      ],

      min: [
        0.01,
        "Purchase amount must be greater than zero",
      ],
    },

    /* =====================================================
       CURRENCY
    ===================================================== */

    currency: {
      type: String,

      enum: [
        "INR",
      ],

      default: "INR",

      uppercase: true,

      trim: true,
    },

    /* =====================================================
       PURCHASE STATUS
    ===================================================== */

    status: {
      type: String,

      enum: [
        "pending",
        "paid",
        "failed",
        "cancelled",
        "refunded",
      ],

      default: "pending",

      index: true,
    },

    /* =====================================================
       PAYMENT GATEWAY
    ===================================================== */

    paymentGateway: {
      type: String,

      enum: [
        "razorpay",
        "manual",
        "other",
      ],

      default: "razorpay",

      index: true,
    },

    /* =====================================================
       RAZORPAY ORDER ID
    ===================================================== */

    paymentOrderId: {
      type: String,

      default: "",

      trim: true,

      index: true,

      maxlength: [
        150,
        "Payment order ID is too long",
      ],
    },

    /* =====================================================
       RAZORPAY PAYMENT ID
    ===================================================== */

    paymentId: {
      type: String,

      default: "",

      trim: true,

      index: true,

      maxlength: [
        150,
        "Payment ID is too long",
      ],
    },

    /* =====================================================
       RAZORPAY SIGNATURE

       Stored only for payment audit/reference.

       It must NEVER replace server-side
       Razorpay signature verification.
    ===================================================== */

    paymentSignature: {
      type: String,

      default: "",

      trim: true,

      maxlength: [
        256,
        "Payment signature is too long",
      ],
    },

    /* =====================================================
       ACTUAL PAID AMOUNT

       Stored in RUPEES.
    ===================================================== */

    paidAmount: {
      type: Number,

      default: null,

      min: [
        0,
        "Paid amount cannot be negative",
      ],
    },

    /* =====================================================
       ACTUAL PAID CURRENCY
    ===================================================== */

    paidCurrency: {
      type: String,

      enum: [
        "",
        "INR",
      ],

      default: "",

      uppercase: true,

      trim: true,
    },

    /* =====================================================
       PAYMENT FAILURE REASON
    ===================================================== */

    failureReason: {
      type: String,

      default: "",

      trim: true,

      maxlength: [
        500,
        "Failure reason cannot exceed 500 characters",
      ],
    },

    /* =====================================================
       PURCHASE DATE

       Set only after successful payment verification.
    ===================================================== */

    purchasedAt: {
      type: Date,

      default: null,
    },

    /* =====================================================
       COURSE ACCESS EXPIRY

       null = lifetime access

       otherwise access expires at this date.
    ===================================================== */

    expiresAt: {
      type: Date,

      default: null,
    },

    /* =====================================================
       ACTIVE STATUS

       paid + isActive=true
       = normally accessible

       refunded/cancelled/expired
       = should not provide access.
    ===================================================== */

    isActive: {
      type: Boolean,

      default: true,

      index: true,
    },
  },

  /* =======================================================
     SCHEMA OPTIONS
  ======================================================= */

  {
    timestamps: true,

    versionKey: false,

    strict: true,
  }
);

/* =========================================================
   UNIQUE STUDENT + COURSE RELATIONSHIP

   One student cannot create multiple Purchase documents
   for the same course.

   Database-level protection against duplicate purchases.
========================================================= */

purchaseSchema.index(
  {
    student: 1,
    course: 1,
  },
  {
    unique: true,

    name:
      "unique_student_course_purchase",
  }
);

/* =========================================================
   STUDENT PURCHASE LOOKUP
========================================================= */

purchaseSchema.index(
  {
    student: 1,
    status: 1,
    isActive: 1,
    createdAt: -1,
  },
  {
    name:
      "student_purchase_status_lookup",
  }
);

/* =========================================================
   COURSE PURCHASE LOOKUP
========================================================= */

purchaseSchema.index(
  {
    course: 1,
    status: 1,
    isActive: 1,
  },
  {
    name:
      "course_purchase_status_lookup",
  }
);

/* =========================================================
   PAYMENT ORDER LOOKUP

   Razorpay order → Purchase lookup.
========================================================= */

purchaseSchema.index(
  {
    paymentOrderId: 1,
  },
  {
    name:
      "payment_order_lookup",
  }
);

/* =========================================================
   PAYMENT ID LOOKUP

   Razorpay payment → Purchase lookup.
========================================================= */

purchaseSchema.index(
  {
    paymentId: 1,
  },
  {
    name:
      "payment_id_lookup",
  }
);

/* =========================================================
   PRE-VALIDATION

   IMPORTANT:

   This uses async middleware instead of callback-style
   next().

   This avoids:

   TypeError: next is not a function

   and remains compatible with the current Mongoose
   middleware execution.
========================================================= */

purchaseSchema.pre(
  "validate",
  async function () {
    /* -----------------------------------------------------
       NORMALIZE CURRENCY
    ----------------------------------------------------- */

    if (
      typeof this.currency ===
      "string"
    ) {
      this.currency =
        this.currency
          .trim()
          .toUpperCase();
    }

    if (
      typeof this.paidCurrency ===
      "string"
    ) {
      this.paidCurrency =
        this.paidCurrency
          .trim()
          .toUpperCase();
    }

    /* -----------------------------------------------------
       NORMALIZE PURCHASE AMOUNT
    ----------------------------------------------------- */

    if (
      this.amount !== undefined &&
      this.amount !== null
    ) {
      this.amount =
        Number(
          Number(
            this.amount
          ).toFixed(2)
        );
    }

    /* -----------------------------------------------------
       NORMALIZE PAID AMOUNT
    ----------------------------------------------------- */

    if (
      this.paidAmount !== undefined &&
      this.paidAmount !== null
    ) {
      this.paidAmount =
        Number(
          Number(
            this.paidAmount
          ).toFixed(2)
        );
    }

    /* -----------------------------------------------------
       PAID PURCHASE CONSISTENCY
    ----------------------------------------------------- */

    if (
      this.status === "paid"
    ) {
      if (
        !this.paymentOrderId
      ) {
        throw new Error(
          "Paid purchase requires a payment order ID."
        );
      }

      if (
        !this.paymentId
      ) {
        throw new Error(
          "Paid purchase requires a payment ID."
        );
      }

      if (
        !this.paymentSignature
      ) {
        throw new Error(
          "Paid purchase requires a payment signature."
        );
      }

      if (
        this.paidAmount ===
          null ||
        this.paidAmount ===
          undefined
      ) {
        throw new Error(
          "Paid purchase requires paid amount."
        );
      }

      if (
        this.paidCurrency !==
        "INR"
      ) {
        throw new Error(
          "Paid purchase requires INR paid currency."
        );
      }

      if (
        !this.purchasedAt
      ) {
        throw new Error(
          "Paid purchase requires purchasedAt."
        );
      }
    }
  }
);

/* =========================================================
   MODEL

   Reuse an already compiled model.

   Prevents:

   OverwriteModelError:
   Cannot overwrite `Purchase` model once compiled.
========================================================= */

const Purchase =
  mongoose.models.Purchase ||
  mongoose.model(
    "Purchase",
    purchaseSchema
  );

/* =========================================================
   EXPORT
========================================================= */

export default Purchase;