import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";

function RefundPolicy() {
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
              <RefreshCcw size={24} />
            </div>

            <div>
              <p className="text-sm font-bold uppercase tracking-widest text-red-600">
                Legal
              </p>

              <h1 className="mt-2 text-3xl font-black tracking-tight text-slate-900 sm:text-4xl">
                Refund & Cancellation Policy
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
                This Refund & Cancellation Policy explains the conditions
                applicable to course purchases made through Takshashila
                Academy.
              </p>

              <p className="mt-4">
                Please read this policy carefully before purchasing any course
                or educational service.
              </p>
            </section>

            {/* 2 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                2. Course Purchase
              </h2>

              <p className="mt-4">
                Before completing a purchase, students should carefully review
                the course name, description, price and other available course
                information.
              </p>

              <p className="mt-4">
                Once a payment has been successfully verified and course access
                has been provided, the purchase may not be eligible for a
                refund except where specifically permitted under this policy or
                required by applicable law.
              </p>
            </section>

            {/* 3 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                3. Cancellation Before Payment
              </h2>

              <p className="mt-4">
                A course order that has not been successfully paid for may
                generally be cancelled without a refund request because no
                successful payment has been completed.
              </p>
            </section>

            {/* 4 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                4. Refund Eligibility
              </h2>

              <p className="mt-4">
                Refund requests may be considered in situations such as:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  A duplicate payment was successfully charged for the same
                  purchase.
                </li>

                <li>
                  Payment was successfully deducted but the corresponding
                  course enrollment was not created because of a technical
                  issue.
                </li>

                <li>
                  A payment was incorrectly processed due to a verified
                  technical or transaction error.
                </li>

                <li>
                  A refund is otherwise required under applicable law or an
                  authorized decision by Takshashila Academy.
                </li>
              </ul>
            </section>

            {/* 5 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                5. Non-Refundable Situations
              </h2>

              <p className="mt-4">
                Refunds may generally not be available in situations including:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>
                  Change of mind after purchasing a course.
                </li>

                <li>
                  Failure to attend or use the course after purchase.
                </li>

                <li>
                  Failure to complete the course within the available access
                  period, where applicable.
                </li>

                <li>
                  Lack of expected examination, career or educational results.
                </li>

                <li>
                  Sharing or misuse of course access by the student.
                </li>

                <li>
                  Dissatisfaction based only on personal expectations when the
                  purchased course and access have been correctly provided.
                </li>
              </ul>
            </section>

            {/* 6 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                6. Duplicate or Failed Transactions
              </h2>

              <p className="mt-4">
                If an amount is deducted from your bank account but the payment
                status is not successfully completed, please allow reasonable
                processing time for the payment provider or bank to update the
                transaction status.
              </p>

              <p className="mt-4">
                If the amount remains unresolved, please contact Takshashila
                Academy with the relevant transaction details.
              </p>
            </section>

            {/* 7 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                7. Refund Request Process
              </h2>

              <p className="mt-4">
                To request a refund or report a payment issue, contact
                Takshashila Academy using the official contact details
                available on the website.
              </p>

              <p className="mt-4">
                Please provide the following information where available:
              </p>

              <ul className="mt-4 list-disc space-y-2 pl-6">
                <li>Student name.</li>
                <li>Registered mobile number or email address.</li>
                <li>Course name.</li>
                <li>Payment or order ID.</li>
                <li>Date and approximate time of payment.</li>
                <li>A brief description of the issue.</li>
              </ul>
            </section>

            {/* 8 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                8. Refund Processing
              </h2>

              <p className="mt-4">
                Approved refunds will generally be processed through the
                applicable payment method or payment provider.
              </p>

              <p className="mt-4">
                The time required for the refunded amount to appear in the
                student's bank account or payment account may depend on the
                payment provider, bank or financial institution.
              </p>
            </section>

            {/* 9 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                9. Course Access After Refund
              </h2>

              <p className="mt-4">
                If a refund is approved for a course purchase, access to the
                associated paid course or learning materials may be suspended
                or removed after the refund is processed.
              </p>
            </section>

            {/* 10 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                10. Unauthorized Transactions
              </h2>

              <p className="mt-4">
                If you believe a transaction was made without your
                authorization, contact your bank or payment provider promptly
                and also notify Takshashila Academy with the relevant
                transaction information.
              </p>
            </section>

            {/* 11 */}
            <section>
              <h2 className="text-xl font-black text-slate-900">
                11. Policy Changes
              </h2>

              <p className="mt-4">
                Takshashila Academy may update this Refund & Cancellation
                Policy from time to time to reflect changes in services,
                payment processes or applicable requirements.
              </p>

              <p className="mt-4">
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
                For refund, cancellation or payment-related questions, please
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
              By purchasing a course from Takshashila Academy, you acknowledge
              that you have read and understood this Refund & Cancellation
              Policy.
            </div>

          </div>
        </article>
      </section>
    </main>
  );
}

export default RefundPolicy;