
import { Link } from "react-router-dom";
import { ArrowLeft, FileText } from "lucide-react";

function Terms() {
  return (
    <main className="min-h-screen bg-slate-50">
      {/* Header */}
      <section className="border-b border-slate-200 bg-white">
        <div className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm font-semibold text-slate-600 transition hover:text-red-600"
          >
            <ArrowLeft size={17} />
            Back to Home
          </Link>

          <div className="mt-8 flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-600">
              <FileText size={24} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-red-600">
                Legal
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Terms & Conditions
              </h1>

              <p className="mt-3 text-sm text-slate-500">
                Last updated: August 14, 2026
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Content */}
      <section className="mx-auto max-w-6xl px-4 py-10 sm:px-6 sm:py-14 lg:px-8">
        <article className="mx-auto max-w-4xl rounded-3xl border border-slate-200 bg-white p-6 shadow-sm sm:p-10">
          <div className="space-y-10 text-sm leading-7 text-slate-600 sm:text-base">

            {/* 1 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                1. Acceptance of Terms
              </h2>

              <p className="mt-4">
                Welcome to Takshashila Academy. By accessing or using this
                website, creating an account, enrolling in a course or
                purchasing any educational service, you agree to follow these
                Terms & Conditions.
              </p>

              <p className="mt-4">
                If you do not agree with these terms, please do not use the
                website or purchase our services.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                2. About Our Services
              </h2>

              <p className="mt-4">
                Takshashila Academy provides educational content and learning
                services, which may include online courses, videos, notes,
                PDFs, study materials, practice content and related services.
              </p>

              <p className="mt-4">
                The availability, structure and content of courses may change
                from time to time.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                3. Student Account
              </h2>

              <p className="mt-4">
                Some features require you to create a student account. You are
                responsible for providing accurate information during
                registration and keeping your account information up to date.
              </p>

              <p className="mt-4">
                You are responsible for maintaining the confidentiality of your
                login credentials and for activity performed through your
                account.
              </p>

              <p className="mt-4">
                Account credentials should not be shared with another person.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                4. Course Enrollment
              </h2>

              <p className="mt-4">
                Access to a paid course is provided after successful enrollment
                and payment verification, where applicable.
              </p>

              <p className="mt-4">
                Course access may be linked to the student account used for the
                purchase and may not be transferred to another person without
                authorization.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                5. Payments
              </h2>

              <p className="mt-4">
                Course prices and applicable charges are displayed on the
                website at the time of purchase.
              </p>

              <p className="mt-4">
                Payments may be processed through third-party payment
                providers. A payment is considered successful only after the
                applicable payment verification process is completed.
              </p>

              <p className="mt-4">
                Payment processing may be subject to the terms and policies of
                the applicable payment provider.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                6. Course Content and Intellectual Property
              </h2>

              <p className="mt-4">
                Course videos, PDFs, notes, images, text, graphics, logos and
                other educational materials available through Takshashila
                Academy are intended for authorized educational use.
              </p>

              <p className="mt-4">
                Unless expressly permitted, you must not copy, reproduce,
                redistribute, publish, sell, upload, record, modify or
                commercially exploit our course materials.
              </p>

              <p className="mt-4">
                Unauthorized sharing or distribution of course content may
                result in suspension or termination of access and may lead to
                further action where appropriate.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                7. Prohibited Activities
              </h2>

              <p className="mt-4">
                You agree not to:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  Use the website for unlawful or fraudulent activities.
                </li>

                <li>
                  Attempt to gain unauthorized access to another user's
                  account or restricted areas.
                </li>

                <li>
                  Share paid course credentials with unauthorized users.
                </li>

                <li>
                  Copy, download, redistribute or commercially sell protected
                  course materials without permission.
                </li>

                <li>
                  Attempt to interfere with the security or normal operation
                  of the website.
                </li>

                <li>
                  Upload malicious code or content intended to damage or
                  disrupt our services.
                </li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                8. Course Access and Suspension
              </h2>

              <p className="mt-4">
                Takshashila Academy may restrict or suspend an account if there
                is reasonable evidence of unauthorized access, credential
                sharing, payment fraud, misuse of course content or violation
                of these Terms & Conditions.
              </p>

              <p className="mt-4">
                Where appropriate, we may investigate the issue before taking
                further action.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                9. Website Availability
              </h2>

              <p className="mt-4">
                We aim to keep the website and learning services available and
                reliable. However, temporary interruptions may occur because
                of maintenance, technical problems, third-party services,
                network issues or circumstances outside our reasonable
                control.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                10. Educational Disclaimer
              </h2>

              <p className="mt-4">
                Our courses and educational materials are provided to support
                learning and examination preparation.
              </p>

              <p className="mt-4">
                Course participation does not guarantee a particular exam
                result, rank, job, selection or other outcome. Individual
                results depend on many factors, including preparation,
                performance and applicable examination rules.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                11. Third-Party Services
              </h2>

              <p className="mt-4">
                The website may use third-party services such as payment
                processors, cloud storage, media hosting, email providers and
                analytics services.
              </p>

              <p className="mt-4">
                The use of such services may also be subject to the terms and
                policies of those third parties.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                12. Privacy
              </h2>

              <p className="mt-4">
                Your use of the website is also subject to our Privacy Policy,
                which explains how personal information may be collected, used
                and protected.
              </p>

              <Link
                to="/privacy-policy"
                className="mt-4 inline-flex font-bold text-red-700 underline decoration-red-200 underline-offset-4 transition hover:text-red-800"
              >
                Read Privacy Policy
              </Link>
            </section>

            {/* 13 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                13. Changes to These Terms
              </h2>

              <p className="mt-4">
                Takshashila Academy may update these Terms & Conditions from
                time to time to reflect changes in services, technology,
                policies or applicable requirements.
              </p>

              <p className="mt-4">
                Updated terms will be published on this page with a revised
                date.
              </p>
            </section>

            {/* 14 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                14. Contact Us
              </h2>

              <p className="mt-4">
                If you have questions about these Terms & Conditions, please
                contact Takshashila Academy using the contact details provided
                on the website.
              </p>

              <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
                <p className="font-bold text-slate-900">
                  Takshashila Academy
                </p>

                <p className="mt-2">
                  कॉलेज रोड, प्रतापपुर
                  <br />
                  जिला सूरजपुर, छत्तीसगढ़
                </p>

                <p className="mt-2">
                  Admission Enquiry: 6268274213 / 7354363973
                </p>
              </div>
            </section>

            {/* Final Notice */}
            <div className="border-t border-slate-200 pt-8 text-sm text-slate-500">
              By creating an account, purchasing a course or using Takshashila
              Academy services, you acknowledge that you have read and agreed
              to these Terms & Conditions.
            </div>

          </div>
        </article>
      </section>
    </main>
  );
}

export default Terms;
