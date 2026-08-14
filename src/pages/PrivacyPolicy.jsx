import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck } from "lucide-react";

function PrivacyPolicy() {
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
              <ShieldCheck size={24} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-red-600">
                Legal
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Privacy Policy
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
                1. Introduction
              </h2>

              <p className="mt-4">
                Takshashila Academy respects your privacy and is committed to
                protecting the personal information of students, visitors and
                customers who use this website and our educational services.
              </p>

              <p className="mt-4">
                This Privacy Policy explains what information we may collect,
                how we use it, how we protect it and the choices available to
                you when you use Takshashila Academy services.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                2. Information We Collect
              </h2>

              <p className="mt-4">
                Depending on how you use our website, we may collect:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Your name and profile information.</li>
                <li>Your mobile number and email address.</li>
                <li>Account and authentication information.</li>
                <li>Course enrollment and purchase information.</li>
                <li>Learning progress and course activity.</li>
                <li>Information submitted through enquiry forms.</li>
                <li>
                  Basic technical information such as browser, device and
                  website usage information.
                </li>
              </ul>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                3. How We Use Your Information
              </h2>

              <p className="mt-4">
                We may use your information to:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Create and manage your account.</li>
                <li>Provide purchased courses and learning materials.</li>
                <li>Process and verify payments.</li>
                <li>Track enrollment and learning progress.</li>
                <li>Respond to enquiries and provide support.</li>
                <li>Send important account and service notifications.</li>
                <li>Improve our website and services.</li>
                <li>Prevent fraud, misuse and unauthorized access.</li>
              </ul>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                4. Payments
              </h2>

              <p className="mt-4">
                Course payments may be processed through third-party payment
                providers such as Razorpay. Payment information is handled by
                the applicable payment provider according to its own privacy
                and security practices.
              </p>

              <p className="mt-4">
                Takshashila Academy does not intentionally store complete
                debit card, credit card or banking credentials on its own
                servers.
              </p>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                5. Course Content and Account Access
              </h2>

              <p className="mt-4">
                Course videos, notes, PDFs and other learning materials may be
                restricted to authorized students. Account information may be
                used to verify enrollment and provide access to purchased
                content.
              </p>

              <p className="mt-4">
                Students are responsible for keeping their login credentials
                confidential and should not share their account with another
                person.
              </p>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                6. Third-Party Services
              </h2>

              <p className="mt-4">
                We may use trusted third-party services for payment processing,
                media hosting, email delivery, analytics, website
                infrastructure and security.
              </p>

              <p className="mt-4">
                These third-party providers may process information according
                to their own terms and privacy policies.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                7. Cookies and Similar Technologies
              </h2>

              <p className="mt-4">
                The website may use cookies, local storage or similar
                technologies to maintain login sessions, remember preferences,
                improve functionality and understand website usage.
              </p>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                8. Data Security
              </h2>

              <p className="mt-4">
                We take reasonable technical and organizational measures to
                protect information against unauthorized access, misuse,
                alteration or disclosure.
              </p>

              <p className="mt-4">
                However, no internet-based service can guarantee absolute
                security.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                9. Data Retention
              </h2>

              <p className="mt-4">
                We may retain account, purchase, learning and transaction
                information for as long as reasonably necessary to provide
                services, maintain records, comply with applicable requirements
                and resolve disputes.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                10. Your Choices
              </h2>

              <p className="mt-4">
                You may contact Takshashila Academy regarding your personal
                information, account details or questions about this Privacy
                Policy.
              </p>

              <p className="mt-4">
                Reasonable verification may be required before making
                account-related changes.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                11. Changes to This Policy
              </h2>

              <p className="mt-4">
                We may update this Privacy Policy from time to time to reflect
                changes in our services, technology or applicable requirements.
                Updated versions will be published on this page with a revised
                date.
              </p>
            </section>

            {/* 12 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                12. Contact Us
              </h2>

              <p className="mt-4">
                For privacy-related questions or requests, please contact
                Takshashila Academy using the contact details provided on the
                website.
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

          </div>
        </article>
      </section>
    </main>
  );
}

export default PrivacyPolicy;