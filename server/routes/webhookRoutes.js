import express from "express";

import {
  razorpayWebhook,
} from "../controllers/razorpayWebhookController.js";

/* =========================================================
   WEBHOOK ROUTER
========================================================= */

const router =
  express.Router();

/* =========================================================
   RAZORPAY WEBHOOK
=========================================================

POST /api/webhooks/razorpay

IMPORTANT:

This route must receive the RAW request body.

The main server must mount this route BEFORE:

express.json()

Otherwise Razorpay webhook signature verification
will fail.

========================================================= */

router.post(
  "/razorpay",
  express.raw({
    type: "application/json",
    limit: "1mb",
  }),
  razorpayWebhook
);

/* =========================================================
   EXPORT
========================================================= */

export default router;