import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
} from "lucide-react";

const exams = [
  "CG Vyapam",
  "SSC",
  "CG Police",
  "CGPSC",
  "Banking",
  "Railway",
  "Agniveer",
  "Teacher Bharti",
];

export default function Footer() {
  return (
    <footer className="bg-[#061633] text-white">

      {/* =====================================================
          MAIN FOOTER
      ===================================================== */}

      <div className="container-main py-14 sm:py-16">

        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.4fr_1fr_1fr_1.2fr]">

          {/* =================================================
              BRAND
          ================================================= */}

          <div>

            <Link
              to="/"
              className="inline-flex items-center gap-3"
            >
              <div className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-xl bg-white">
                <img
                  src="/logo.jpeg"
                  alt="Takshashila Academy"
                  className="h-full w-full object-contain"
                />
              </div>

              <div className="leading-none">
                <h2 className="text-lg font-black tracking-wide">
                  TAKSHASHILA
                </h2>

                <p className="mt-1 text-[10px] font-bold tracking-[0.25em] text-yellow-400">
                  ACADEMY
                </p>
              </div>
            </Link>

            <p className="mt-5 max-w-sm text-sm leading-7 text-slate-300">
              मेहनत आपकी, सफलता हमारी प्राथमिकता!
              प्रतियोगी परीक्षाओं की बेहतर एवं व्यवस्थित तैयारी
              के लिए Takshashila Academy से जुड़ें।
            </p>

          </div>


          {/* =================================================
              QUICK LINKS
          ================================================= */}

          <div>

            <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400">
              Quick Links
            </h3>

            <div className="mt-5 space-y-3">

              <FooterLink
                to="/"
                text="Home"
              />

              <FooterLink
                to="/courses"
                text="All Courses"
              />

              <FooterLink
                to="/login"
                text="Student Login"
              />

              <FooterLink
                to="/signup"
                text="Student Signup"
              />

              <FooterLink
                to="/dashboard"
                text="Student Dashboard"
              />

            </div>

          </div>


          {/* =================================================
              EXAMS
          ================================================= */}

          <div>

            <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400">
              Exam Preparation
            </h3>

            <div className="mt-5 grid grid-cols-2 gap-x-5 gap-y-3">

              {exams.map((exam) => (
                <Link
                  key={exam}
                  to="/courses"
                  className="text-sm text-slate-300 transition hover:text-white"
                >
                  {exam}
                </Link>
              ))}

            </div>

          </div>


          {/* =================================================
              CONTACT
          ================================================= */}

          <div>

            <h3 className="text-sm font-black uppercase tracking-widest text-yellow-400">
              Contact Us
            </h3>

            <div className="mt-5 space-y-5">

              {/* Address */}

              <a
                href="https://www.google.com/maps/search/?api=1&query=College+Road+Pratappur+Surajpur+Chhattisgarh"
                target="_blank"
                rel="noopener noreferrer"
                className="group flex items-start gap-3"
              >

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-red-400">
                  <MapPin size={18} />
                </div>

                <div>

                  <p className="text-xs font-bold text-slate-400">
                    Academy Address
                  </p>

                  <p className="mt-1 text-sm leading-6 text-slate-200 group-hover:text-white">
                    कॉलेज रोड, प्रतापपुर
                    <br />
                    जिला सूरजपुर, छत्तीसगढ़
                  </p>

                </div>

              </a>


              {/* Shrawan  */}

              <a
                href="tel:7804891281"
                className="group flex items-start gap-3"
              >

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-green-400">
                  <Phone size={18} />
                </div>

                <div>

                  <p className="text-xs font-bold text-slate-400">
                    Admission Enquiry
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-200 group-hover:text-white">
                    Shrawan Suryavanshi
                  </p>

                  <p className="text-sm text-slate-300">
                    7804891281
                  </p>

                </div>

              </a>


              {/* Manoj */}

              <a
                href="tel:7354363973"
                className="group flex items-start gap-3"
              >

                <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-white/5 text-green-400">
                  <Phone size={18} />
                </div>

                <div>

                  <p className="text-xs font-bold text-slate-400">
                    Admission Enquiry
                  </p>

                  <p className="mt-1 text-sm font-bold text-slate-200 group-hover:text-white">
                    Manoj Kumar
                  </p>

                  <p className="text-sm text-slate-300">
                    7354363973
                  </p>

                </div>

              </a>

            </div>

          </div>

        </div>


        {/* =====================================================
            CTA
        ===================================================== */}

        <div className="mt-12 overflow-hidden rounded-2xl border border-white/10 bg-white/5 p-5 sm:p-6">

          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">

            <div className="flex items-start gap-4">

              <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-red-600 text-white">
                <BookOpen size={21} />
              </div>

              <div>

                <h3 className="font-black">
                  अपनी तैयारी आज ही शुरू करें
                </h3>

                <p className="mt-1 text-sm text-slate-400">
                  सही course चुनें और अपनी competitive exam preparation
                  शुरू करें।
                </p>

              </div>

            </div>

            <Link
              to="/courses"
              className="inline-flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-sm font-black text-white transition hover:bg-red-800"
            >
              Explore Courses
              <ArrowRight size={17} />
            </Link>

          </div>

        </div>


        {/* =====================================================
            SECURITY
        ===================================================== */}

        <div className="mt-8 flex items-start gap-3 rounded-xl border border-green-900/40 bg-green-950/20 p-4">

          <ShieldCheck
            size={19}
            className="mt-0.5 shrink-0 text-green-400"
          />

          <p className="text-xs leading-5 text-slate-400">
            Purchased courses के videos, notes और PDFs केवल
            authorized students को उपलब्ध कराए जाएंगे।
          </p>

        </div>

      </div>


      {/* =====================================================
          BOTTOM BAR
      ===================================================== */}

      <div className="border-t border-white/10">

        <div className="container-main flex flex-col gap-3 py-5 text-center sm:flex-row sm:items-center sm:justify-between sm:text-left">

          <p className="text-xs text-slate-500">
            © 2026 Takshashila Academy. All rights reserved.
          </p>

          <div className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-xs text-slate-500 sm:justify-end">

            <Link
              to="/privacy-policy"
              className="transition hover:text-slate-300"
            >
              Privacy Policy
            </Link>

            <Link
              to="/terms"
              className="transition hover:text-slate-300"
            >
              Terms & Conditions
            </Link>

            <Link
              to="/refund-policy"
              className="transition hover:text-slate-300"
            >
              Refund Policy
            </Link>

          </div>

        </div>

      </div>

    </footer>
  );
}


/* =========================================================
   FOOTER LINK
========================================================= */

function FooterLink({ to, text }) {
  return (
    <Link
      to={to}
      className="block text-sm text-slate-300 transition hover:translate-x-1 hover:text-white"
    >
      {text}
    </Link>
  );
}