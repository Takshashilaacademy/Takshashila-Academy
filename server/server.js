import "dotenv/config";

import express from "express";
import cors from "cors";
import mongoose from "mongoose";

import connectDB from "./config/db.js";

import authRoutes from "./routes/authRoutes.js";
import studentRoutes from "./routes/studentRoutes.js";
import studentCourseRoutes from "./routes/studentCourseRoutes.js";
import studentMediaRoutes from "./routes/studentMediaRoutes.js";
import studentProgressRoutes from "./routes/studentProgressRoutes.js";
import purchaseRoutes from "./routes/purchaseRoutes.js";
import courseRoutes from "./routes/courseRoutes.js";

import adminRoutes from "./routes/adminRoutes.js";
import adminDashboardRoutes from "./routes/adminDashboardRoutes.js";
import adminCourseRoutes from "./routes/adminCourseRoutes.js";
import adminContentRoutes from "./routes/adminContentRoutes.js";
import cloudinaryRoutes from "./routes/cloudinaryRoutes.js";

import webhookRoutes from "./routes/webhookRoutes.js";

/* =========================================================
   ENVIRONMENT
========================================================= */

const NODE_ENV =
  process.env.NODE_ENV ||
  "development";

const PORT =
  Number(process.env.PORT) ||
  5000;

const IS_PRODUCTION =
  NODE_ENV === "production";

/* =========================================================
   FRONTEND ORIGINS
=========================================================

Development:

FRONTEND_URL=http://localhost:5173

Production:

FRONTEND_URL=https://yourdomain.com

Multiple origins:

FRONTEND_URL=https://yourdomain.com,https://www.yourdomain.com

IMPORTANT:
In production, FRONTEND_URL must be explicitly configured.
========================================================= */

const defaultDevelopmentOrigins = [
  "http://localhost:5173",
  "http://127.0.0.1:5173",
];

const configuredOrigins = (
  process.env.FRONTEND_URL || ""
)
  .split(",")
  .map((url) => url.trim())
  .filter(Boolean);

if (
  IS_PRODUCTION &&
  configuredOrigins.length === 0
) {
  console.error(
    "FRONTEND_URL is required in production."
  );

  process.exit(1);
}

const allowedOrigins =
  configuredOrigins.length > 0
    ? configuredOrigins
    : defaultDevelopmentOrigins;

/* =========================================================
   APP
========================================================= */

const app =
  express();

/* =========================================================
   BASIC APP CONFIGURATION
========================================================= */

app.disable(
  "x-powered-by"
);

/* =========================================================
   TRUST PROXY
=========================================================

Set:

TRUST_PROXY=1

when deployed behind a reverse proxy/load balancer.
========================================================= */

if (
  process.env.TRUST_PROXY ===
  "1"
) {
  app.set(
    "trust proxy",
    1
  );
}

/* =========================================================
   CORS
========================================================= */

app.use(
  cors({
    origin: (
      origin,
      callback
    ) => {
      /*
       * Requests from tools/server-to-server may not contain
       * an Origin header.
       */
      if (!origin) {
        return callback(
          null,
          true
        );
      }

      if (
        allowedOrigins.includes(
          origin
        )
      ) {
        return callback(
          null,
          true
        );
      }

      console.warn(
        `CORS blocked request from origin: ${origin}`
      );

      return callback(
        new Error(
          "Not allowed by CORS"
        )
      );
    },

    credentials: true,

    methods: [
      "GET",
      "POST",
      "PUT",
      "PATCH",
      "DELETE",
      "OPTIONS",
    ],

    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Accept",
      "Origin",
      "X-Requested-With",
    ],

    exposedHeaders: [
      "Content-Length",
      "Content-Type",
    ],

    optionsSuccessStatus: 204,
  })
);

/* =========================================================
   SECURITY HEADERS
========================================================= */

app.use(
  (
    req,
    res,
    next
  ) => {
    res.setHeader(
      "X-Content-Type-Options",
      "nosniff"
    );

    res.setHeader(
      "X-Frame-Options",
      "SAMEORIGIN"
    );

    res.setHeader(
      "Referrer-Policy",
      "strict-origin-when-cross-origin"
    );

    res.setHeader(
      "Permissions-Policy",
      "camera=(), microphone=(), geolocation=()"
    );

    res.setHeader(
      "X-DNS-Prefetch-Control",
      "off"
    );

    /*
     * Basic HSTS should only be enabled when the production
     * API is actually served over HTTPS.
     */
    if (
      IS_PRODUCTION
    ) {
      res.setHeader(
        "Strict-Transport-Security",
        "max-age=31536000; includeSubDomains"
      );
    }

    next();
  }
);

/* =========================================================
   RAZORPAY WEBHOOK
=========================================================

IMPORTANT:

Webhook routes MUST be registered before express.json()
because Razorpay signature verification needs the original
raw request body.

The webhook route itself is responsible for using:

express.raw({
  type: "application/json"
})

========================================================= */

app.use(
  "/api/webhooks",
  webhookRoutes
);

/* =========================================================
   NORMAL REQUEST BODY PARSERS
========================================================= */

app.use(
  express.json({
    limit: "2mb",
  })
);

app.use(
  express.urlencoded({
    extended: true,
    limit: "2mb",
  })
);

/* =========================================================
   DEVELOPMENT REQUEST LOGGER
========================================================= */

if (
  !IS_PRODUCTION
) {
  app.use(
    (
      req,
      res,
      next
    ) => {
      const startedAt =
        Date.now();

      res.on(
        "finish",
        () => {
          const duration =
            Date.now() -
            startedAt;

          console.log(
            `${req.method} ${req.originalUrl} ${res.statusCode} - ${duration}ms`
          );
        }
      );

      next();
    }
  );
}

/* =========================================================
   ROOT API
========================================================= */

app.get(
  "/",
  (
    req,
    res
  ) => {
    return res.status(200).json({
      success: true,

      message:
        "Takshashila Academy API is running.",

      environment:
        NODE_ENV,

      version:
        "1.0.0",
    });
  }
);

/* =========================================================
   HEALTH CHECK
========================================================= */

app.get(
  "/api/health",
  (
    req,
    res
  ) => {
    const databaseReady =
      mongoose.connection.readyState === 1;

    return res.status(databaseReady ? 200 : 503).json({
      success: true,

      message:
        "Backend API is working.",

      service:
        "takshashila-academy-api",

      environment:
        NODE_ENV,

      database:
        databaseReady
          ? "connected"
          : "disconnected",

      timestamp:
        new Date().toISOString(),

      uptime:
        Math.floor(
          process.uptime()
        ),
    });
  }
);

/* =========================================================
   API INFORMATION
========================================================= */

app.get(
  "/api",
  (
    req,
    res
  ) => {
    return res.status(200).json({
      success: true,

      name:
        "Takshashila Academy API",

      version:
        "1.0.0",

      environment:
        NODE_ENV,
    });
  }
);

/* =========================================================
   STUDENT AUTH
========================================================= */

app.use(
  "/api/auth",
  authRoutes
);

/* =========================================================
   STUDENT ROUTES
========================================================= */

app.use(
  "/api/student",
  studentRoutes
);

app.use(
  "/api/student/courses",
  studentCourseRoutes
);

app.use(
  "/api/student",
  studentMediaRoutes
);

app.use(
  "/api/student/courses",
  studentProgressRoutes
);

/* =========================================================
   STUDENT PURCHASES
========================================================= */

app.use(
  "/api/student/purchases",
  purchaseRoutes
);

/* =========================================================
   PUBLIC COURSES
========================================================= */

app.use(
  "/api/courses",
  courseRoutes
);

/* =========================================================
   ADMIN AUTH
========================================================= */

app.use(
  "/api/admin",
  adminRoutes
);

/* =========================================================
   ADMIN DASHBOARD
========================================================= */

app.use(
  "/api/admin/dashboard",
  adminDashboardRoutes
);

/* =========================================================
   ADMIN COURSE MANAGEMENT
========================================================= */

app.use(
  "/api/admin/courses",
  adminCourseRoutes
);

/* =========================================================
   ADMIN CONTENT MANAGEMENT
========================================================= */

app.use(
  "/api/admin/content",
  adminContentRoutes
);

/* =========================================================
   CLOUDINARY ADMIN ROUTES
========================================================= */

app.use(
  "/api/admin/cloudinary",
  cloudinaryRoutes
);

/* =========================================================
   API 404 HANDLER
========================================================= */

app.use(
  (
    req,
    res
  ) => {
    return res.status(404).json({
      success: false,

      message:
        "API route not found.",

      path:
        req.originalUrl,
    });
  }
);

/* =========================================================
   GLOBAL ERROR HANDLER
========================================================= */

app.use(
  (
    err,
    req,
    res,
    next
  ) => {
    console.error(
      "=============================================="
    );

    console.error(
      "GLOBAL SERVER ERROR"
    );

    console.error(
      "=============================================="
    );

    console.error(
      err?.stack ||
        err?.message ||
        err
    );

    console.error(
      "=============================================="
    );

    /* -----------------------------------------------------
       CORS ERROR
    ----------------------------------------------------- */

    if (
      err?.message ===
      "Not allowed by CORS"
    ) {
      return res.status(403).json({
        success: false,

        message:
          "Request origin is not allowed.",
      });
    }

    /* -----------------------------------------------------
       INVALID JSON
    ----------------------------------------------------- */

    if (
      err instanceof
        SyntaxError &&
      err.status === 400 &&
      "body" in err
    ) {
      return res.status(400).json({
        success: false,

        message:
          "Invalid JSON request body.",
      });
    }

    /* -----------------------------------------------------
       PAYLOAD TOO LARGE
    ----------------------------------------------------- */

    if (
      err?.type ===
      "entity.too.large"
    ) {
      return res.status(413).json({
        success: false,

        message:
          "Request payload is too large.",
      });
    }

    /* -----------------------------------------------------
       ERROR STATUS
    ----------------------------------------------------- */

    const statusCode =
      Number(
        err?.statusCode ||
          err?.status
      ) || 500;

    /* -----------------------------------------------------
       SAFE PRODUCTION MESSAGE
    ----------------------------------------------------- */

    const responseMessage =
      IS_PRODUCTION
        ? "Internal server error."
        : err?.message ||
          "Internal server error.";

    return res
      .status(statusCode)
      .json({
        success: false,

        message:
          responseMessage,
      });
  }
);

/* =========================================================
   HTTP SERVER
========================================================= */

let server = null;

/* =========================================================
   START SERVER
========================================================= */

const startServer =
  async () => {
    try {
      /* ---------------------------------------------------
         DATABASE FIRST
      --------------------------------------------------- */

      await connectDB();

      /* ---------------------------------------------------
         START HTTP SERVER
      --------------------------------------------------- */

      server =
        app.listen(
          PORT,
          "0.0.0.0",
          () => {
            console.log("");

            console.log(
              "=================================================="
            );

            console.log(
              "        TAKSHASHILA ACADEMY BACKEND"
            );

            console.log(
              "=================================================="
            );

            console.log(
              `Environment    : ${NODE_ENV}`
            );

            console.log(
              `Port           : ${PORT}`
            );

            console.log(
              `Local API      : http://localhost:${PORT}`
            );

            console.log(
              `Health         : http://localhost:${PORT}/api/health`
            );

            console.log(
              `Webhook        : /api/webhooks/razorpay`
            );

            console.log(
              "Allowed Origins:"
            );

            allowedOrigins.forEach(
              (
                origin
              ) => {
                console.log(
                  `  - ${origin}`
                );
              }
            );

            console.log(
              "=================================================="
            );

            console.log("");

            console.log(
              "Takshashila Academy API started successfully."
            );

            console.log("");
          }
        );

      /* ---------------------------------------------------
         SERVER ERROR
      --------------------------------------------------- */

      server.on(
        "error",
        (
          error
        ) => {
          console.error(
            "HTTP SERVER ERROR:",
            error
          );

          if (
            error.code ===
            "EADDRINUSE"
          ) {
            console.error(
              `Port ${PORT} is already in use.`
            );
          }

          process.exit(
            1
          );
        }
      );
    } catch (error) {
      console.error("");

      console.error(
        "=================================================="
      );

      console.error(
        "       TAKSHASHILA SERVER STARTUP FAILED"
      );

      console.error(
        "=================================================="
      );

      console.error(
        error?.stack ||
          error?.message ||
          error
      );

      console.error(
        "=================================================="
      );

      console.error("");

      process.exit(
        1
      );
    }
  };

/* =========================================================
   GRACEFUL SHUTDOWN
========================================================= */

const gracefulShutdown =
  (
    signal
  ) => {
    console.log("");

    console.log(
      `${signal} received. Shutting down server...`
    );

    /* -----------------------------------------------------
       SERVER NOT STARTED
    ----------------------------------------------------- */

    if (!server) {
      process.exit(
        0
      );

      return;
    }

    /* -----------------------------------------------------
       CLOSE HTTP SERVER
    ----------------------------------------------------- */

    server.close(
      () => {
        console.log(
          "HTTP server closed successfully."
        );

        process.exit(
          0
        );
      }
    );

    /* -----------------------------------------------------
       SAFETY TIMEOUT
    ----------------------------------------------------- */

    setTimeout(
      () => {
        console.error(
          "Forced shutdown after timeout."
        );

        process.exit(
          1
        );
      },
      10000
    );
  };

/* =========================================================
   PROCESS SIGNALS
========================================================= */

process.on(
  "SIGTERM",
  () =>
    gracefulShutdown(
      "SIGTERM"
    )
);

process.on(
  "SIGINT",
  () =>
    gracefulShutdown(
      "SIGINT"
    )
);

/* =========================================================
   UNHANDLED PROMISE REJECTION
========================================================= */

process.on(
  "unhandledRejection",
  (
    reason
  ) => {
    console.error(
      "UNHANDLED REJECTION:",
      reason
    );

    /*
     * An unknown async failure in production can leave the
     * application in an uncertain state, so gracefully
     * restart through the hosting process manager.
     */

    if (
      IS_PRODUCTION
    ) {
      gracefulShutdown(
        "UNHANDLED_REJECTION"
      );
    }
  }
);

/* =========================================================
   UNCAUGHT EXCEPTION
========================================================= */

process.on(
  "uncaughtException",
  (
    error
  ) => {
    console.error(
      "UNCAUGHT EXCEPTION:",
      error
    );

    gracefulShutdown(
      "UNCAUGHT_EXCEPTION"
    );
  }
);

/* =========================================================
   START APPLICATION
========================================================= */

startServer();

/* =========================================================
   EXPORT APP
========================================================= */

export default app;