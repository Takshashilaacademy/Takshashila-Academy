import { Link, NavLink } from "react-router-dom";
import { useState } from "react";
import {
  BookOpen,
  ChevronDown,
  Menu,
  Phone,
  UserRound,
  X,
} from "lucide-react";

const navLinks = [
  {
    label: "Home",
    to: "/",
  },
  {
    label: "Courses",
    to: "/courses",
  },
];

const examLinks = [
  "CG Vyapam",
  "SSC",
  "CG Police",
  "CGPSC",
  "Banking",
  "Railway",
  "Agniveer",
  "Teacher Bharti",
];

export default function Navbar() {
  const [mobileOpen, setMobileOpen] = useState(false);
  const [examOpen, setExamOpen] = useState(false);

  const closeMobile = () => {
    setMobileOpen(false);
    setExamOpen(false);
  };

  return (
    <header className="sticky top-0 z-50 border-b border-slate-200 bg-white/95 shadow-sm backdrop-blur">

      {/* =====================================================
          DESKTOP / MAIN NAVBAR
      ===================================================== */}
      <div className="container-main">

        <div className="flex h-[72px] items-center justify-between gap-4">

          {/* =================================================
              LOGO
          ================================================= */}
          <Link
            to="/"
            onClick={closeMobile}
            className="flex shrink-0 items-center gap-3"
          >

            <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-xl bg-white shadow-sm ring-1 ring-slate-200">
              <img
                src="/logo.jpeg"
                alt="Takshashila Academy Logo"
                className="h-full w-full object-contain"
              />
            </div>

            <div className="hidden leading-none sm:block">

              <h1 className="text-[15px] font-black tracking-wide text-[#071b41]">
                TAKSHASHILA
              </h1>

              <p className="mt-1 text-[9px] font-black tracking-[0.28em] text-red-700">
                ACADEMY
              </p>

            </div>

          </Link>

          {/* =================================================
              DESKTOP NAVIGATION
          ================================================= */}
          <nav className="hidden items-center gap-1 lg:flex">

            {navLinks.map((link) => (
              <NavItem
                key={link.to}
                to={link.to}
                label={link.label}
              />
            ))}

            {/* Exams Dropdown */}
            <div
              className="relative"
              onMouseEnter={() => setExamOpen(true)}
              onMouseLeave={() => setExamOpen(false)}
            >

              <button
                type="button"
                onClick={() => setExamOpen((previous) => !previous)}
                className="flex items-center gap-1 rounded-lg px-4 py-2.5 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#071b41]"
              >
                Exams
                <ChevronDown
                  size={15}
                  className={`transition ${
                    examOpen ? "rotate-180" : ""
                  }`}
                />
              </button>

              {examOpen && (
                <div className="absolute left-0 top-full w-56 pt-2">

                  <div className="overflow-hidden rounded-xl border border-slate-200 bg-white p-2 shadow-xl">

                    {examLinks.map((exam) => (
                      <Link
                        key={exam}
                        to="/courses"
                        onClick={() => setExamOpen(false)}
                        className="flex items-center justify-between rounded-lg px-3 py-2.5 text-sm font-semibold text-slate-600 transition hover:bg-red-50 hover:text-red-700"
                      >
                        {exam}
                        <span className="text-xs text-slate-300">
                          →
                        </span>
                      </Link>
                    ))}

                  </div>

                </div>
              )}

            </div>

            <NavItem
              to="/courses"
              label="Study Material"
            />

          </nav>

          {/* =================================================
              DESKTOP ACTIONS
          ================================================= */}
          <div className="hidden items-center gap-2 lg:flex">

            <a
              href="tel:6268274213"
              className="mr-1 flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-bold text-slate-600 transition hover:bg-slate-50 hover:text-[#071b41]"
            >
              <Phone size={16} className="text-green-600" />
              <span>Call</span>
            </a>

            <Link
              to="/login"
              className="flex items-center gap-2 rounded-lg border border-[#071b41] px-4 py-2.5 text-sm font-black text-[#071b41] transition hover:bg-[#071b41] hover:text-white"
            >
              <UserRound size={16} />
              Login
            </Link>

            <Link
              to="/signup"
              className="rounded-lg bg-red-700 px-4 py-2.5 text-sm font-black text-white shadow-sm transition hover:bg-red-800"
            >
              Signup
            </Link>

          </div>

          {/* =================================================
              MOBILE MENU BUTTON
          ================================================= */}
          <button
            type="button"
            onClick={() => setMobileOpen((previous) => !previous)}
            className="flex h-10 w-10 items-center justify-center rounded-lg border border-slate-200 text-[#071b41] lg:hidden"
            aria-label={
              mobileOpen ? "Close navigation" : "Open navigation"
            }
          >
            {mobileOpen ? (
              <X size={22} />
            ) : (
              <Menu size={22} />
            )}
          </button>

        </div>

        {/* =====================================================
            MOBILE MENU
        ===================================================== */}
        {mobileOpen && (
          <div className="border-t border-slate-100 pb-5 pt-3 lg:hidden">

            <nav className="space-y-1">

              <MobileNavItem
                to="/"
                label="Home"
                onClick={closeMobile}
              />

              <MobileNavItem
                to="/courses"
                label="Courses"
                onClick={closeMobile}
              />

              {/* Mobile Exams */}
              <div>

                <button
                  type="button"
                  onClick={() =>
                    setExamOpen((previous) => !previous)
                  }
                  className="flex w-full items-center justify-between rounded-lg px-3 py-3 text-left text-sm font-bold text-slate-700 hover:bg-slate-50"
                >
                  <span className="flex items-center gap-2">
                    <BookOpen size={17} />
                    Exams
                  </span>

                  <ChevronDown
                    size={16}
                    className={`transition ${
                      examOpen ? "rotate-180" : ""
                    }`}
                  />
                </button>

                {examOpen && (
                  <div className="ml-4 mt-1 space-y-1 border-l-2 border-red-100 pl-3">

                    {examLinks.map((exam) => (
                      <Link
                        key={exam}
                        to="/courses"
                        onClick={closeMobile}
                        className="block rounded-lg px-3 py-2 text-sm font-semibold text-slate-600 hover:bg-red-50 hover:text-red-700"
                      >
                        {exam}
                      </Link>
                    ))}

                  </div>
                )}

              </div>

              <MobileNavItem
                to="/courses"
                label="Study Material"
                onClick={closeMobile}
              />

            </nav>

            {/* Mobile actions */}
            <div className="mt-4 grid grid-cols-2 gap-2 border-t border-slate-100 pt-4">

              <Link
                to="/login"
                onClick={closeMobile}
                className="flex items-center justify-center gap-2 rounded-lg border border-[#071b41] px-4 py-3 text-sm font-black text-[#071b41]"
              >
                <UserRound size={16} />
                Login
              </Link>

              <Link
                to="/signup"
                onClick={closeMobile}
                className="flex items-center justify-center rounded-lg bg-red-700 px-4 py-3 text-sm font-black text-white"
              >
                Signup
              </Link>

            </div>

            {/* Mobile call */}
            <a
              href="tel:7808491281"
              className="mt-2 flex items-center justify-center gap-2 rounded-lg bg-green-50 px-4 py-3 text-sm font-black text-green-700"
            >
              <Phone size={17} />
              Call: 7808491281
            </a>

          </div>
        )}

      </div>

    </header>
  );
}


/* =========================================================
   DESKTOP NAV ITEM
   ========================================================= */

function NavItem({ to, label }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      className={({ isActive }) =>
        `rounded-lg px-4 py-2.5 text-sm font-bold transition ${
          isActive
            ? "bg-red-50 text-red-700"
            : "text-slate-600 hover:bg-slate-50 hover:text-[#071b41]"
        }`
      }
    >
      {label}
    </NavLink>
  );
}


/* =========================================================
   MOBILE NAV ITEM
   ========================================================= */

function MobileNavItem({ to, label, onClick }) {
  return (
    <NavLink
      to={to}
      end={to === "/"}
      onClick={onClick}
      className={({ isActive }) =>
        `block rounded-lg px-3 py-3 text-sm font-bold transition ${
          isActive
            ? "bg-red-50 text-red-700"
            : "text-slate-700 hover:bg-slate-50"
        }`
      }
    >
      {label}
    </NavLink>
  );
}