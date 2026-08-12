/* =========================================================
   LIGHTWEIGHT AUTH RATE LIMITER

   Protects public authentication endpoints from repeated
   credential attempts without adding another dependency.

   For a multi-instance deployment, replace this with a
   shared Redis-backed limiter.
========================================================= */

const buckets = new Map();

const WINDOW_MS = 15 * 60 * 1000;
const MAX_REQUESTS = 25;

const getClientKey = (req) => {
  /*
   * Express only trusts proxy headers when "trust proxy" is
   * explicitly enabled. Using req.ip here prevents a client from
   * spoofing X-Forwarded-For to bypass the limiter.
   */
  return (
    req.ip ||
    req.socket?.remoteAddress ||
    "unknown"
  );
};

export const authRateLimit = (
  req,
  res,
  next
) => {
  const now =
    Date.now();

  const key =
    getClientKey(req);

  const current =
    buckets.get(key);

  if (
    !current ||
    now - current.startedAt >
      WINDOW_MS
  ) {
    buckets.set(
      key,
      {
        startedAt: now,
        count: 1,
      }
    );

    return next();
  }

  current.count += 1;

  if (
    current.count >
    MAX_REQUESTS
  ) {
    const retryAfter =
      Math.ceil(
        (WINDOW_MS -
          (now -
            current.startedAt)) /
          1000
      );

    res.setHeader(
      "Retry-After",
      String(
        retryAfter
      )
    );

    return res.status(429).json({
      success: false,
      code:
        "AUTH_RATE_LIMITED",
      message:
        "Too many authentication attempts. Please try again later.",
    });
  }

  return next();
};

/* Periodically remove old buckets. */
setInterval(
  () => {
    const cutoff =
      Date.now() -
      WINDOW_MS;

    for (
      const [
        key,
        value,
      ] of buckets
    ) {
      if (
        value.startedAt <
        cutoff
      ) {
        buckets.delete(
          key
        );
      }
    }
  },
  WINDOW_MS
).unref();
