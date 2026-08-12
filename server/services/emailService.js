import nodemailer from "nodemailer";

/* =========================================================
   EMAIL CONFIGURATION
========================================================= */

const SMTP_HOST =
  process.env.SMTP_HOST || "";

const SMTP_PORT =
  Number(
    process.env.SMTP_PORT || 587
  );

const SMTP_USER =
  process.env.SMTP_USER || "";

const SMTP_PASSWORD =
  process.env.SMTP_PASSWORD || "";

const EMAIL_FROM =
  process.env.EMAIL_FROM ||
  SMTP_USER ||
  "";

/* =========================================================
   EMAIL CONFIGURATION STATUS
========================================================= */

const isEmailConfigured =
  Boolean(
    SMTP_HOST &&
      SMTP_PORT &&
      SMTP_USER &&
      SMTP_PASSWORD &&
      EMAIL_FROM
  );

/* =========================================================
   SMTP TRANSPORTER
=========================================================

   Transporter is created only when SMTP credentials exist.

   This prevents the entire backend from crashing when
   email configuration has not been added yet.
========================================================= */

const transporter =
  isEmailConfigured
    ? nodemailer.createTransport({
        host:
          SMTP_HOST,

        port:
          SMTP_PORT,

        secure:
          SMTP_PORT === 465,

        auth: {
          user:
            SMTP_USER,

          pass:
            SMTP_PASSWORD,
        },

        connectionTimeout:
          10000,

        greetingTimeout:
          10000,

        socketTimeout:
          15000,
      })
    : null;

/* =========================================================
   CHECK EMAIL CONFIGURATION
========================================================= */

export const checkEmailConfig =
  () => {
    if (
      !isEmailConfigured
    ) {
      console.warn("");
      console.warn(
        "⚠️ EMAIL CONFIGURATION IS MISSING"
      );

      console.warn(
        "Password reset emails will not be sent until SMTP is configured."
      );

      console.warn(
        "Required environment variables:"
      );

      console.warn(
        "SMTP_HOST"
      );

      console.warn(
        "SMTP_PORT"
      );

      console.warn(
        "SMTP_USER"
      );

      console.warn(
        "SMTP_PASSWORD"
      );

      console.warn(
        "EMAIL_FROM"
      );

      console.warn("");

      return false;
    }

    console.log(
      "Email configuration loaded successfully."
    );

    return true;
  };

/* =========================================================
   VERIFY SMTP CONNECTION
========================================================= */

export const verifyEmailConnection =
  async () => {
    if (
      !isEmailConfigured ||
      !transporter
    ) {
      return false;
    }

    try {
      await transporter.verify();

      console.log(
        "SMTP email connection verified successfully."
      );

      return true;
    } catch (error) {
      console.error(
        "SMTP email connection verification failed:",
        error?.message ||
          error
      );

      return false;
    }
  };

/* =========================================================
   SEND EMAIL
========================================================= */

export const sendEmail =
  async ({
    to,
    subject,
    text,
    html,
  }) => {
    if (
      !isEmailConfigured ||
      !transporter
    ) {
      throw new Error(
        "Email service is not configured."
      );
    }

    if (
      typeof to !==
        "string" ||
      !to.trim()
    ) {
      throw new Error(
        "Recipient email is required."
      );
    }

    if (
      typeof subject !==
        "string" ||
      !subject.trim()
    ) {
      throw new Error(
        "Email subject is required."
      );
    }

    if (
      !text &&
      !html
    ) {
      throw new Error(
        "Email content is required."
      );
    }

    const mailOptions = {
      from:
        EMAIL_FROM,

      to:
        to.trim(),

      subject:
        subject.trim(),

      ...(text
        ? {
            text,
          }
        : {}),

      ...(html
        ? {
            html,
          }
        : {}),
    };

    const info =
      await transporter.sendMail(
        mailOptions
      );

    return {
      messageId:
        info.messageId,

      accepted:
        info.accepted,

      rejected:
        info.rejected,

      response:
        info.response,
    };
  };

/* =========================================================
   SEND PASSWORD RESET EMAIL
========================================================= */

export const sendPasswordResetEmail =
  async ({
    to,
    resetUrl,
    expiresInMinutes = 15,
  }) => {
    if (
      typeof resetUrl !==
        "string" ||
      !resetUrl.trim()
    ) {
      throw new Error(
        "Password reset URL is required."
      );
    }

    const safeResetUrl =
      resetUrl.trim();

    const subject =
      "Reset your Takshashila Academy password";

    /* =====================================================
       PLAIN TEXT EMAIL
    ===================================================== */

    const text = `
Takshashila Academy

Password Reset Request

We received a request to reset the password for your student account.

Use the link below to create a new password:

${safeResetUrl}

This password reset link will expire in ${expiresInMinutes} minutes.

If you did not request a password reset, you can safely ignore this email.

For your security, never share this reset link or your password with anyone.

Takshashila Academy
    `.trim();

    /* =====================================================
       HTML EMAIL
    ===================================================== */

    const html = `
<!DOCTYPE html>

<html lang="en">

<head>
  <meta charset="UTF-8" />

  <meta
    name="viewport"
    content="width=device-width, initial-scale=1.0"
  />

  <title>
    Reset your Takshashila Academy password
  </title>
</head>

<body
  style="
    margin:0;
    padding:0;
    background:#f8fafc;
    font-family:Arial,Helvetica,sans-serif;
    color:#0f172a;
  "
>

  <div
    style="
      width:100%;
      padding:40px 16px;
      box-sizing:border-box;
    "
  >

    <div
      style="
        max-width:560px;
        margin:0 auto;
        background:#ffffff;
        border:1px solid #e2e8f0;
        border-radius:20px;
        overflow:hidden;
        box-shadow:0 10px 30px rgba(15,23,42,0.08);
      "
    >

      <!-- HEADER -->

      <div
        style="
          background:#071b41;
          padding:28px 32px;
          color:#ffffff;
        "
      >

        <div
          style="
            font-size:13px;
            font-weight:700;
            color:#cbd5e1;
            margin-bottom:6px;
          "
        >
          Student Account Security
        </div>

        <div
          style="
            font-size:24px;
            font-weight:800;
          "
        >
          Takshashila Academy
        </div>

      </div>

      <!-- CONTENT -->

      <div
        style="
          padding:32px;
        "
      >

        <h1
          style="
            margin:0 0 14px;
            font-size:24px;
            line-height:1.3;
            color:#071b41;
          "
        >
          Reset your password
        </h1>

        <p
          style="
            margin:0 0 18px;
            font-size:15px;
            line-height:1.7;
            color:#475569;
          "
        >
          We received a request to reset the
          password for your Takshashila Academy
          student account.
        </p>

        <p
          style="
            margin:0 0 24px;
            font-size:15px;
            line-height:1.7;
            color:#475569;
          "
        >
          Click the button below to create a new
          password.
        </p>

        <!-- BUTTON -->

        <div
          style="
            text-align:center;
            margin:28px 0;
          "
        >

          <a
            href="${safeResetUrl}"
            target="_blank"
            rel="noopener noreferrer"
            style="
              display:inline-block;
              background:#b91c1c;
              color:#ffffff;
              text-decoration:none;
              font-size:14px;
              font-weight:700;
              padding:14px 24px;
              border-radius:10px;
            "
          >
            Reset Password
          </a>

        </div>

        <!-- FALLBACK URL -->

        <p
          style="
            margin:0 0 8px;
            font-size:12px;
            font-weight:700;
            color:#64748b;
          "
        >
          If the button does not work, copy and
          paste this link into your browser:
        </p>

        <p
          style="
            margin:0 0 24px;
            padding:12px;
            background:#f8fafc;
            border:1px solid #e2e8f0;
            border-radius:8px;
            font-size:11px;
            line-height:1.6;
            color:#475569;
            word-break:break-all;
          "
        >
          ${safeResetUrl}
        </p>

        <!-- EXPIRY -->

        <div
          style="
            background:#fff7ed;
            border:1px solid #fed7aa;
            border-radius:10px;
            padding:14px;
            margin-bottom:20px;
          "
        >

          <p
            style="
              margin:0;
              font-size:12px;
              line-height:1.6;
              color:#9a3412;
            "
          >
            This password reset link will expire
            in ${expiresInMinutes} minutes.
          </p>

        </div>

        <!-- SECURITY -->

        <p
          style="
            margin:0;
            font-size:12px;
            line-height:1.7;
            color:#64748b;
          "
        >
          If you did not request this password reset,
          you can safely ignore this email.
          Never share your password or reset link
          with anyone.
        </p>

      </div>

      <!-- FOOTER -->

      <div
        style="
          padding:20px 32px;
          background:#f8fafc;
          border-top:1px solid #e2e8f0;
        "
      >

        <p
          style="
            margin:0;
            font-size:11px;
            line-height:1.6;
            color:#94a3b8;
            text-align:center;
          "
        >
          This is an automated security email from
          Takshashila Academy.
        </p>

      </div>

    </div>

  </div>

</body>

</html>
    `.trim();

    return sendEmail({
      to,
      subject,
      text,
      html,
    });
  };

/* =========================================================
   EXPORT DEFAULT
========================================================= */

export default transporter;