/* =========================================================
   RAZORPAY SERVICE
========================================================= */

/*
  IMPORTANT:

  Razorpay KEY SECRET is NEVER used here.

  Frontend only receives the public KEY ID
  from our backend.

  Payment order is created by backend.
  Payment verification is also done by backend.
*/

/* =========================================================
   LOAD RAZORPAY CHECKOUT SCRIPT
========================================================= */

export const loadRazorpayScript =
  () => {
    return new Promise(
      (resolve) => {
        /* -------------------------------------------------
           ALREADY LOADED
        ------------------------------------------------- */

        if (
          window.Razorpay
        ) {
          resolve(true);
          return;
        }

        /* -------------------------------------------------
           CHECK EXISTING SCRIPT
        ------------------------------------------------- */

        const existingScript =
          document.querySelector(
            'script[src="https://checkout.razorpay.com/v1/checkout.js"]'
          );

        if (existingScript) {
          existingScript.addEventListener(
            "load",
            () => resolve(true)
          );

          existingScript.addEventListener(
            "error",
            () => resolve(false)
          );

          return;
        }

        /* -------------------------------------------------
           CREATE SCRIPT
        ------------------------------------------------- */

        const script =
          document.createElement(
            "script"
          );

        script.src =
          "https://checkout.razorpay.com/v1/checkout.js";

        script.async = true;

        script.onload =
          () => {
            resolve(
              Boolean(
                window.Razorpay
              )
            );
          };

        script.onerror =
          () => {
            resolve(false);
          };

        document.body.appendChild(
          script
        );
      }
    );
  };

/* =========================================================
   OPEN RAZORPAY CHECKOUT
========================================================= */

export const openRazorpayCheckout =
  async ({
    order,
    student,
    course,
    onSuccess,
    onDismiss,
    onError,
  }) => {
    /* -----------------------------------------------------
       VALIDATE ORDER
    ----------------------------------------------------- */

    if (
      !order?.keyId
    ) {
      throw new Error(
        "Razorpay Key ID is missing."
      );
    }

    if (
      !order?.orderId
    ) {
      throw new Error(
        "Razorpay Order ID is missing."
      );
    }

    if (
      !order?.amount
    ) {
      throw new Error(
        "Razorpay order amount is missing."
      );
    }

    /* -----------------------------------------------------
       LOAD CHECKOUT
    ----------------------------------------------------- */

    const loaded =
      await loadRazorpayScript();

    if (!loaded) {
      throw new Error(
        "Unable to load Razorpay Checkout. Please check your internet connection and try again."
      );
    }

    /* -----------------------------------------------------
       STUDENT DETAILS
    ----------------------------------------------------- */

    const studentName =
      student?.name ||
      student?.fullName ||
      "";

    const studentEmail =
      student?.email ||
      "";

    const studentMobile =
      student?.mobile ||
      student?.phone ||
      "";

    /* -----------------------------------------------------
       CHECKOUT OPTIONS
    ----------------------------------------------------- */

    const options = {
      key:
        order.keyId,

      amount:
        order.amount,

      currency:
        order.currency ||
        "INR",

      name:
        "Takshashila Academy",

      description:
        course?.title ||
        "Course Purchase",

      order_id:
        order.orderId,

      prefill: {
        name:
          studentName,

        email:
          studentEmail,

        contact:
          studentMobile,
      },

      notes: {
        course:
          course?.title ||
          "",

        courseId:
          course?.id ||
          course?._id ||
          "",
      },

      theme: {
        color:
          "#071b41",
      },

      modal: {
        confirm_close:
          true,

        escape:
          true,

        backdropclose:
          false,

        animation:
          true,

        ondismiss:
          () => {
            if (
              typeof onDismiss ===
              "function"
            ) {
              onDismiss();
            }
          },
      },

      retry: {
        enabled:
          true,
      },

      handler:
        async (
          response
        ) => {
          /*
           * IMPORTANT:
           *
           * These values are NOT trusted directly.
           *
           * They are sent to our backend.
           *
           * Backend verifies the signature
           * using Razorpay Secret.
           */

          try {
            if (
              typeof onSuccess ===
              "function"
            ) {
              await onSuccess(
                response
              );
            }
          } catch (error) {
            console.error(
              "Razorpay Success Handler Error:",
              error
            );

            if (
              typeof onError ===
              "function"
            ) {
              onError(
                error
              );
            }
          }
        },
    };

    /* -----------------------------------------------------
       CREATE CHECKOUT INSTANCE
    ----------------------------------------------------- */

    const razorpay =
      new window.Razorpay(
        options
      );

    /* -----------------------------------------------------
       PAYMENT FAILED
    ----------------------------------------------------- */

    razorpay.on(
      "payment.failed",
      (
        response
      ) => {
        console.error(
          "Razorpay Payment Failed:",
          response
        );

        if (
          typeof onError ===
          "function"
        ) {
          const description =
            response?.error
              ?.description ||
            "Payment failed.";

          onError(
            new Error(
              description
            )
          );
        }
      }
    );

    /* -----------------------------------------------------
       OPEN CHECKOUT
    ----------------------------------------------------- */

    razorpay.open();

    return razorpay;
  };

/* =========================================================
   EXPORT DEFAULT
========================================================= */

const razorpayService = {
  loadRazorpayScript,

  openRazorpayCheckout,
};

export default razorpayService;