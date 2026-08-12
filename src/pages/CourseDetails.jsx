import {
  Link,
  useNavigate,
  useParams,
} from "react-router-dom";

import {
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import {
  ArrowLeft,
  ArrowRight,
  BookOpen,
  Check,
  CheckCircle2,
  ChevronDown,
  Clock3,
  FileText,
  GraduationCap,
  Loader2,
  LockKeyhole,
  PlayCircle,
  ShieldCheck,
  Sparkles,
  Target,
  Users,
} from "lucide-react";

import {
  clearStudentAuth,
  getStoredStudent,
  getStudentToken,
} from "../utils/authStorage.js";

import {
  openRazorpayCheckout,
} from "../services/razorpayService.js";

import {
  API_URL,
} from "../config/api.js";


/* =========================================================
   DEFAULT FEATURES
========================================================= */

const defaultFeatures = [
  {
    icon: PlayCircle,
    title: "Quality Video Classes",
    description:
      "Topic-wise recorded video lectures for structured learning.",
  },
  {
    icon: FileText,
    title: "Notes & PDFs",
    description:
      "Subject-wise study material and revision resources.",
  },
  {
    icon: ShieldCheck,
    title: "Secure Access",
    description:
      "Purchased content is available only to authorized students.",
  },
];


/* =========================================================
   FAQ
========================================================= */

const faqs = [
  {
    question:
      "Course purchase करने के बाद content कब मिलेगा?",

    answer:
      "Payment successfully verify होने के बाद purchased course आपके student dashboard में available होगा.",
  },

  {
    question:
      "क्या video classes mobile पर देख सकते हैं?",

    answer:
      "हाँ। आप mobile, tablet और desktop से अपने purchased recorded classes access कर सकते हैं.",
  },

  {
    question:
      "क्या notes और PDFs भी मिलेंगे?",

    answer:
      "हाँ। जिस course में notes या PDFs उपलब्ध हैं, वे purchase के बाद आपके learning area में दिखाई देंगे.",
  },

  {
    question:
      "क्या paid content सभी students को दिखाई देगा?",

    answer:
      "नहीं। Paid videos, PDFs और notes केवल authorized students के लिए उपलब्ध होंगे.",
  },

  {
    question:
      "क्या मैं बाद में course continue कर सकता हूँ?",

    answer:
      "हाँ। Purchased course आपके student dashboard में रहेगा और आप अपनी सुविधा के अनुसार recorded classes continue कर सकते हैं.",
  },
];


/* =========================================================
   COURSE DETAILS
========================================================= */

export default function CourseDetails() {
  const {
    courseId,
  } = useParams();

  const navigate =
    useNavigate();

  // Hard lock to prevent duplicate purchase requests from rapid/multiple clicks.
  // State updates are asynchronous, so this ref blocks the request immediately.
  const purchaseLockRef = useRef(false);


  /* =======================================================
     STATE
  ======================================================= */

  const [
    course,
    setCourse,
  ] = useState(null);

  const [
    loading,
    setLoading,
  ] = useState(true);

  const [
    errorMessage,
    setErrorMessage,
  ] = useState("");

  const [
    openFaq,
    setOpenFaq,
  ] = useState(null);

  const [
    purchaseLoading,
    setPurchaseLoading,
  ] = useState(false);

  const [
    purchaseMessage,
    setPurchaseMessage,
  ] = useState("");

  const [
    purchaseError,
    setPurchaseError,
  ] = useState("");


  /* =======================================================
     FETCH COURSE
  ======================================================= */

  useEffect(() => {
    let cancelled = false;

    const fetchCourse =
      async () => {
        try {
          setLoading(true);

          setErrorMessage("");

          const response =
            await fetch(
              `${API_URL}/api/courses/${courseId}`,
              {
                method: "GET",

                headers: {
                  Accept:
                    "application/json",
                },
              }
            );

          const data =
            await parseJson(
              response
            );

          if (
            !response.ok
          ) {
            throw new Error(
              data?.message ||
                "Course not found."
            );
          }

          if (
            !data?.course
          ) {
            throw new Error(
              "Course data not found."
            );
          }

          if (
            !cancelled
          ) {
            setCourse(
              data.course
            );
          }
        } catch (error) {
          console.error(
            "Course Details Error:",
            error
          );

          if (
            !cancelled
          ) {
            setErrorMessage(
              error?.message ||
                "Unable to load course."
            );
          }
        } finally {
          if (
            !cancelled
          ) {
            setLoading(false);
          }
        }
      };


    if (courseId) {
      fetchCourse();
    } else {
      setLoading(false);

      setErrorMessage(
        "Course ID is missing."
      );
    }


    return () => {
      cancelled = true;
    };
  }, [
    courseId,
  ]);


  /* =======================================================
     BUY COURSE
     
     IMPORTANT:
     Existing payment flow intentionally preserved.
  ======================================================= */

  const handleBuyCourse =
    async () => {
      // Prevent duplicate POST /api/student/purchases requests.
      // This lock is synchronous and works even before React re-renders.
      if (purchaseLockRef.current || purchaseLoading) {
        return;
      }

      purchaseLockRef.current = true;

      setPurchaseMessage("");

      setPurchaseError("");


      const token =
        getStudentToken();


      /* ===================================================
         LOGIN CHECK
      =================================================== */

      if (!token) {
        navigate(
          `/login?redirect=/course/${courseId}`
        );

        return;
      }


      if (!courseId) {
        setPurchaseError(
          "Course ID is missing."
        );

        return;
      }


      try {
        setPurchaseLoading(
          true
        );


        /* =================================================
           CREATE PAYMENT ORDER
        ================================================= */

        const response =
          await fetch(
            `${API_URL}/api/student/purchases`,
            {
              method: "POST",

              headers: {
                "Content-Type":
                  "application/json",

                Authorization:
                  `Bearer ${token}`,
              },

              body:
                JSON.stringify({
                  courseId,
                }),
            }
          );


        const data =
          await parseJson(
            response
          );


        /* =================================================
           AUTH EXPIRED
        ================================================= */

        if (
          response.status ===
          401
        ) {
          clearStudentAuth();

          navigate(
            `/login?redirect=/course/${courseId}`
          );

          return;
        }


        /* =================================================
           API ERROR
        ================================================= */

        if (
          !response.ok
        ) {
          throw new Error(
            data?.message ||
              "Unable to create payment order."
          );
        }


        /* =================================================
           ALREADY PURCHASED
        ================================================= */

        if (
          data?.hasAccess ===
            true ||
          data?.purchase?.status ===
            "paid"
        ) {
          setPurchaseMessage(
            "You have already purchased this course."
          );

          navigate(
            `/learning/${courseId}`
          );

          return;
        }


        /* =================================================
           PURCHASE ID
        ================================================= */

        if (
          !data?.purchase?.id
        ) {
          throw new Error(
            "Purchase ID is missing."
          );
        }


        /* =================================================
           RAZORPAY ORDER
        ================================================= */

        if (
          !data?.razorpay?.orderId
        ) {
          throw new Error(
            "Razorpay order was not created."
          );
        }

        if (
          !data?.razorpay?.keyId
        ) {
          throw new Error(
            "Razorpay Key ID is missing."
          );
        }

        if (
          !data?.razorpay?.amount
        ) {
          throw new Error(
            "Razorpay order amount is missing."
          );
        }


        const student =
          getStoredStudent();


        /* =================================================
           OPEN RAZORPAY
        ================================================= */

        await openRazorpayCheckout({
          order: {
            keyId:
              data.razorpay.keyId,

            orderId:
              data.razorpay.orderId,

            amount:
              data.razorpay.amount,

            currency:
              data.razorpay.currency ||
              "INR",
          },

          student,

          course: {
            id:
              course?._id ||
              courseId,

            title:
              course?.title ||
              "Course Purchase",
          },


          /* ===============================================
             PAYMENT SUCCESS
          =============================================== */

          onSuccess:
            async (
              paymentResponse
            ) => {
              try {
                setPurchaseMessage(
                  "Payment received. Verifying payment..."
                );

                setPurchaseError("");


                if (
                  !paymentResponse
                    ?.razorpay_payment_id
                ) {
                  throw new Error(
                    "Razorpay payment ID is missing."
                  );
                }

                if (
                  !paymentResponse
                    ?.razorpay_order_id
                ) {
                  throw new Error(
                    "Razorpay order ID is missing."
                  );
                }

                if (
                  !paymentResponse
                    ?.razorpay_signature
                ) {
                  throw new Error(
                    "Razorpay payment signature is missing."
                  );
                }


                /* =========================================
                   VERIFY PAYMENT
                ========================================= */

                const verifyResponse =
                  await fetch(
                    `${API_URL}/api/student/purchases/verify`,
                    {
                      method:
                        "POST",

                      headers: {
                        "Content-Type":
                          "application/json",

                        Authorization:
                          `Bearer ${token}`,
                      },

                      body:
                        JSON.stringify({
                          purchaseId:
                            data.purchase.id,

                          razorpayPaymentId:
                            paymentResponse.razorpay_payment_id,

                          razorpayOrderId:
                            paymentResponse.razorpay_order_id,

                          razorpaySignature:
                            paymentResponse.razorpay_signature,
                        }),
                    }
                  );


                const verifyData =
                  await parseJson(
                    verifyResponse
                  );


                if (
                  verifyResponse.status ===
                  401
                ) {
                  clearStudentAuth();

                  navigate(
                    `/login?redirect=/course/${courseId}`
                  );

                  return;
                }


                if (
                  !verifyResponse.ok
                ) {
                  throw new Error(
                    verifyData?.message ||
                      "Payment verification failed."
                  );
                }


                if (
                  verifyData?.hasAccess !==
                  true
                ) {
                  throw new Error(
                    "Payment was received, but course access could not be confirmed."
                  );
                }


                if (
                  verifyData?.purchase
                    ?.status !==
                  "paid"
                ) {
                  throw new Error(
                    "Payment verification is incomplete."
                  );
                }


                setPurchaseError("");

                setPurchaseMessage(
                  "Payment successful! Your course is now unlocked."
                );


                setTimeout(
                  () => {
                    navigate(
                      `/learning/${courseId}`
                    );
                  },
                  700
                );
              } catch (error) {
                console.error(
                  "Payment Verification Error:",
                  error
                );

                setPurchaseError(
                  error?.message ||
                    "Payment verification failed. Please contact support if money was deducted."
                );

                setPurchaseMessage("");
              } finally {
                setPurchaseLoading(
                  false
                );
              }
            },


          /* ===============================================
             CHECKOUT CLOSED
          =============================================== */

          onDismiss:
            () => {
              setPurchaseLoading(
                false
              );

              setPurchaseMessage(
                "Payment window closed. Your purchase has not been completed."
              );
            },


          /* ===============================================
             PAYMENT ERROR
          =============================================== */

          onError:
            (error) => {
              console.error(
                "Razorpay Checkout Error:",
                error
              );

              setPurchaseLoading(
                false
              );

              setPurchaseMessage("");

              setPurchaseError(
                error?.message ||
                  "Payment failed. Please try again."
              );
            },
        });
      } catch (error) {
        console.error(
          "Buy Course Error:",
          error
        );

        setPurchaseMessage("");

        setPurchaseError(
          error?.message ||
            "Unable to start payment."
        );
      } finally {
        purchaseLockRef.current = false;

        setPurchaseLoading(
          false
        );
      }
    };


  /* =======================================================
     DERIVED COURSE DATA
  ======================================================= */

  const courseData =
    useMemo(() => {
      if (!course) {
        return {
          price: 0,
          oldPrice: 0,
          discount: 0,
          savings: 0,
          subjects: [],
          features: [],
          totalVideos: 0,
          totalNotes: 0,
        };
      }


      const price =
        Number(
          course.price
        ) || 0;


      const oldPrice =
        Number(
          course.oldPrice
        ) || 0;


      const discount =
        oldPrice > price &&
        oldPrice > 0
          ? Math.round(
              ((oldPrice -
                price) /
                oldPrice) *
                100
            )
          : 0;


      const savings =
        oldPrice > price
          ? oldPrice - price
          : 0;


      const subjects =
        Array.isArray(
          course.subjects
        )
          ? course.subjects
          : [];


      const features =
        Array.isArray(
          course.features
        ) &&
        course.features.length
          ? course.features
          : [];


      const totalVideos =
        Number(
          course.totalVideos
        ) ||
        (
          Array.isArray(
            course.lessons
          )
            ? course.lessons.length
            : 0
        );


      const totalNotes =
        Number(
          course.totalNotes
        ) ||
        (
          Array.isArray(
            course.materials
          )
            ? course.materials.length
            : 0
        );


      return {
        price,
        oldPrice,
        discount,
        savings,
        subjects,
        features,
        totalVideos,
        totalNotes,
      };
    }, [
      course,
    ]);


  /* =======================================================
     LOADING
  ======================================================= */

  if (loading) {
    return (
      <CourseLoading />
    );
  }


  /* =======================================================
     ERROR
  ======================================================= */

  if (
    errorMessage ||
    !course
  ) {
    return (
      <CourseError
        message={
          errorMessage ||
          "Requested course उपलब्ध नहीं है."
        }
      />
    );
  }


  const {
    price,
    oldPrice,
    discount,
    savings,
    subjects,
    features,
    totalVideos,
    totalNotes,
  } =
    courseData;


  /* =======================================================
     MAIN UI
  ======================================================= */

  return (
    <main className="min-h-screen bg-[#f7f9fc] pb-24 lg:pb-0">

      {/* =================================================
          HERO
      ================================================= */}

      <section className="relative overflow-hidden bg-[#071b41] text-white">

        <div className="pointer-events-none absolute -right-32 -top-32 h-80 w-80 rounded-full bg-blue-500/10 blur-3xl" />

        <div className="pointer-events-none absolute -bottom-40 left-0 h-96 w-96 rounded-full bg-red-500/10 blur-3xl" />

        <div className="container-main relative py-7 sm:py-10 lg:py-14">

          {/* BACK */}

          <Link
            to="/courses"
            className="mb-7 inline-flex items-center gap-2 rounded-xl border border-white/10 bg-white/5 px-3.5 py-2 text-xs font-black text-slate-300 transition hover:bg-white/10 hover:text-white"
          >
            <ArrowLeft
              size={15}
            />

            Back to Courses
          </Link>


          <div className="grid gap-9 lg:grid-cols-[minmax(0,1fr)_410px] lg:items-center">

            {/* LEFT */}

            <div>

              <div className="flex flex-wrap items-center gap-2">

                {discount >
                  0 && (
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-yellow-400 px-3.5 py-1.5 text-xs font-black text-[#071b41]">
                    <Sparkles
                      size={13}
                    />

                    {discount}% OFF
                  </span>
                )}


                {course.exam && (
                  <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white">
                    {course.exam}
                  </span>
                )}


                {course.language && (
                  <span className="rounded-full border border-white/10 bg-white/10 px-3.5 py-1.5 text-xs font-bold text-white">
                    {course.language}
                  </span>
                )}

              </div>


              <h1 className="mt-5 max-w-4xl text-3xl font-black leading-[1.08] tracking-tight sm:text-4xl lg:text-6xl">
                {course.title}
              </h1>


              {course.description && (
                <p className="mt-5 max-w-3xl text-sm leading-7 text-slate-300 sm:text-base sm:leading-8">
                  {course.description}
                </p>
              )}


              {course.fullDescription && (
                <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-400">
                  {course.fullDescription}
                </p>
              )}


              {/* HERO STATS */}

              <div className="mt-7 grid max-w-3xl grid-cols-2 gap-3 sm:grid-cols-4">

                <HeroStat
                  icon={
                    <PlayCircle
                      size={18}
                    />
                  }
                  value={
                    totalVideos
                  }
                  label="Videos"
                />

                <HeroStat
                  icon={
                    <FileText
                      size={18}
                    />
                  }
                  value={
                    totalNotes
                  }
                  label="Notes"
                />

                <HeroStat
                  icon={
                    <Clock3
                      size={18}
                    />
                  }
                  value={
                    course.duration ||
                    "Self-paced"
                  }
                  label="Duration"
                />

                <HeroStat
                  icon={
                    <ShieldCheck
                      size={18}
                    />
                  }
                  value="Secure"
                  label="Access"
                />

              </div>


              {/* TRUST */}

              <div className="mt-7 flex flex-wrap gap-x-6 gap-y-3 text-xs font-bold text-slate-300">

                <TrustItem>
                  <ShieldCheck
                    size={16}
                    className="text-green-400"
                  />

                  Secure Learning
                </TrustItem>


                <TrustItem>
                  <CheckCircle2
                    size={16}
                    className="text-green-400"
                  />

                  Student Dashboard
                </TrustItem>


                <TrustItem>
                  <LockKeyhole
                    size={16}
                    className="text-yellow-400"
                  />

                  Protected Content
                </TrustItem>

              </div>

            </div>


            {/* PURCHASE CARD */}

            <PurchaseCard
              course={
                course
              }
              price={
                price
              }
              oldPrice={
                oldPrice
              }
              discount={
                discount
              }
              savings={
                savings
              }
              purchaseLoading={
                purchaseLoading
              }
              purchaseMessage={
                purchaseMessage
              }
              purchaseError={
                purchaseError
              }
              onBuy={
                handleBuyCourse
              }
            />

          </div>

        </div>

      </section>


      {/* =================================================
          MAIN CONTENT
      ================================================= */}

      <section className="container-main py-12 sm:py-16 lg:py-20">

        <div className="grid gap-12 lg:grid-cols-[minmax(0,1fr)_330px]">

          <div className="min-w-0">

            {/* BENEFITS */}

            <section>

              <SectionHeading
                eyebrow="Course Benefits"
                title="इस Course में आपको क्या मिलेगा?"
                description="आपकी preparation को structured और focused बनाने के लिए course में ये learning resources शामिल हैं।"
              />


              <div className="mt-7 grid gap-4 sm:grid-cols-2">

                {features.length >
                0
                  ? features.map(
                      (
                        feature,
                        index
                      ) => (
                        <FeatureCard
                          key={`${feature}-${index}`}
                          icon={
                            defaultFeatures[
                              index %
                                defaultFeatures.length
                            ]
                              .icon
                          }
                          title={
                            feature
                          }
                          description="इस course में यह learning resource available रहेगा."
                        />
                      )
                    )
                  : defaultFeatures.map(
                      (
                        feature
                      ) => (
                        <FeatureCard
                          key={
                            feature.title
                          }
                          icon={
                            feature.icon
                          }
                          title={
                            feature.title
                          }
                          description={
                            feature.description
                          }
                        />
                      )
                    )}

              </div>

            </section>


            {/* SYLLABUS */}

            <section className="mt-14">

              <SectionHeading
                eyebrow="Syllabus"
                title="Course Subjects"
                description="Course में शामिल प्रमुख subjects और learning areas."
              />


              <div className="mt-7 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">

                {subjects.length >
                0 ? (
                  <div className="grid gap-px bg-slate-100 sm:grid-cols-2">

                    {subjects.map(
                      (
                        subject,
                        index
                      ) => (
                        <div
                          key={`${subject}-${index}`}
                          className="flex items-center gap-3 bg-white p-5 transition hover:bg-slate-50"
                        >

                          <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-600">

                            <Check
                              size={17}
                              strokeWidth={
                                3
                              }
                            />

                          </div>


                          <div className="min-w-0">

                            <p className="truncate text-sm font-black text-[#071b41]">
                              {
                                subject
                              }
                            </p>

                            <p className="mt-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                              Subject{" "}
                              {index +
                                1}
                            </p>

                          </div>

                        </div>
                      )
                    )}

                  </div>
                ) : (
                  <div className="p-7">

                    <p className="text-sm text-slate-500">
                      इस course के subjects अभी add नहीं किए गए हैं।
                    </p>

                  </div>
                )}

              </div>

            </section>


            {/* CONTENT */}

            <section className="mt-14">

              <SectionHeading
                eyebrow="Course Content"
                title="Learning Resources"
                description="Purchase के बाद यही resources आपके student learning area में उपलब्ध होंगे."
              />


              <div className="mt-7 grid gap-4 sm:grid-cols-3">

                <ContentCard
                  icon={
                    <PlayCircle
                      size={22}
                    />
                  }
                  value={
                    totalVideos
                  }
                  label="Recorded Videos"
                  className="bg-blue-50 text-blue-700"
                />


                <ContentCard
                  icon={
                    <FileText
                      size={22}
                    />
                  }
                  value={
                    totalNotes
                  }
                  label="Notes & PDFs"
                  className="bg-orange-50 text-orange-700"
                />


                <ContentCard
                  icon={
                    <ShieldCheck
                      size={22}
                    />
                  }
                  value="Secure"
                  label="Student Access"
                  className="bg-green-50 text-green-700"
                />

              </div>


              <div className="mt-5 rounded-3xl border border-yellow-200 bg-yellow-50 p-5 sm:p-6">

                <div className="flex items-start gap-4">

                  <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-yellow-100 text-yellow-700">

                    <LockKeyhole
                      size={21}
                    />

                  </div>


                  <div>

                    <h3 className="font-black text-yellow-950">
                      Paid Content Protected
                    </h3>

                    <p className="mt-1 text-sm leading-6 text-yellow-900/70">
                      Videos, PDFs और notes payment verification के बाद केवल authorized student account में available होंगे.
                    </p>

                  </div>

                </div>

              </div>

            </section>


            {/* HOW IT WORKS */}

            <section className="mt-14">

              <SectionHeading
                eyebrow="Learning Process"
                title="Course कैसे चलेगा?"
                description="Simple steps में अपनी preparation शुरू करें."
              />


              <div className="mt-7 grid gap-4 sm:grid-cols-2">

                <LearningStep
                  number="01"
                  title="Student Account बनाएं"
                  description="अपना student account create करके platform पर login करें."
                />


                <LearningStep
                  number="02"
                  title="Course Purchase करें"
                  description="अपनी जरूरत के अनुसार course select करके purchase process complete करें."
                />


                <LearningStep
                  number="03"
                  title="Content Unlock होगा"
                  description="Payment verification के बाद purchased course आपके dashboard में unlock होगा."
                />


                <LearningStep
                  number="04"
                  title="Recorded Classes देखें"
                  description="Video lectures देखें और available PDFs तथा notes से अपनी preparation करें."
                />

              </div>

            </section>


            {/* FAQ */}

            <section className="mt-14">

              <SectionHeading
                eyebrow="FAQ"
                title="Frequently Asked Questions"
                description="Course और access से जुड़े common questions."
              />


              <div className="mt-7 space-y-3">

                {faqs.map(
                  (
                    faq,
                    index
                  ) => {
                    const isOpen =
                      openFaq ===
                      index;


                    return (
                      <div
                        key={
                          faq.question
                        }
                        className={`overflow-hidden rounded-2xl border bg-white transition ${
                          isOpen
                            ? "border-[#071b41]/20 shadow-sm"
                            : "border-slate-200"
                        }`}
                      >

                        <button
                          type="button"
                          onClick={() =>
                            setOpenFaq(
                              isOpen
                                ? null
                                : index
                            )
                          }
                          className="flex w-full items-center justify-between gap-5 p-5 text-left sm:p-6"
                        >

                          <span className="text-sm font-black leading-6 text-[#071b41]">
                            {
                              faq.question
                            }
                          </span>


                          <span
                            className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition ${
                              isOpen
                                ? "bg-[#071b41] text-white"
                                : "bg-slate-100 text-slate-500"
                            }`}
                          >

                            <ChevronDown
                              size={17}
                              className={
                                isOpen
                                  ? "rotate-180 transition"
                                  : "transition"
                              }
                            />

                          </span>

                        </button>


                        {isOpen && (
                          <div className="border-t border-slate-100 px-5 pb-6 pt-4 sm:px-6">

                            <p className="max-w-3xl text-sm leading-7 text-slate-600">
                              {
                                faq.answer
                              }
                            </p>

                          </div>
                        )}

                      </div>
                    );
                  }
                )}

              </div>

            </section>

          </div>


          {/* DESKTOP SIDEBAR */}

          <aside className="hidden lg:block">

            <div className="sticky top-24 overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-lg shadow-slate-200/40">

              <div className="bg-[#071b41] p-6 text-white">

                <div className="flex items-center gap-3">

                  <div className="flex h-11 w-11 items-center justify-center rounded-xl bg-white/10 text-yellow-400">

                    <GraduationCap
                      size={22}
                    />

                  </div>


                  <div>

                    <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400">
                      Course Access
                    </p>

                    <p className="mt-0.5 font-black">
                      {course.duration ||
                        "Self Paced"}
                    </p>

                  </div>

                </div>

              </div>


              <div className="p-6">

                <div className="space-y-4">

                  <SideFeature
                    icon={
                      <PlayCircle
                        size={18}
                      />
                    }
                    text={`${totalVideos} Recorded Videos`}
                  />


                  <SideFeature
                    icon={
                      <FileText
                        size={18}
                      />
                    }
                    text={`${totalNotes} Notes & PDFs`}
                  />


                  <SideFeature
                    icon={
                      <Target
                        size={18}
                      />
                    }
                    text="Self-Paced Learning"
                  />


                  <SideFeature
                    icon={
                      <Users
                        size={18}
                      />
                    }
                    text="Student Dashboard"
                  />


                  <SideFeature
                    icon={
                      <ShieldCheck
                        size={18}
                      />
                    }
                    text="Protected Content"
                  />

                </div>


                <div className="my-6 border-t border-slate-100" />


                <div className="flex items-center justify-between">

                  <span className="text-sm font-bold text-slate-500">
                    Course Fee
                  </span>

                  <span className="text-2xl font-black text-[#071b41]">
                    ₹{price}
                  </span>

                </div>


                <button
                  type="button"
                  onClick={
                    handleBuyCourse
                  }
                  disabled={
                    purchaseLoading
                  }
                  className="mt-4 flex w-full items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3.5 text-sm font-black text-white shadow-md shadow-red-700/20 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
                >

                  {purchaseLoading ? (
                    <>
                      <Loader2
                        size={17}
                        className="animate-spin"
                      />

                      Processing...
                    </>
                  ) : (
                    <>
                      Buy Course

                      <ArrowRight
                        size={17}
                      />
                    </>
                  )}

                </button>


                <div className="mt-5 rounded-2xl bg-green-50 p-4">

                  <div className="flex items-start gap-2.5">

                    <ShieldCheck
                      size={17}
                      className="mt-0.5 shrink-0 text-green-700"
                    />

                    <p className="text-xs leading-5 text-green-800">
                      Paid content केवल authorized students को मिलेगा।
                    </p>

                  </div>

                </div>

              </div>

            </div>

          </aside>

        </div>

      </section>


      {/* =================================================
          FINAL CTA
      ================================================= */}

      <section className="container-main pb-8 lg:pb-16">

        <div className="relative overflow-hidden rounded-[28px] bg-[#071b41] p-7 text-white sm:p-10">

          <div className="pointer-events-none absolute -right-20 -top-20 h-60 w-60 rounded-full bg-blue-400/10 blur-3xl" />


          <div className="relative grid gap-7 lg:grid-cols-[1fr_auto] lg:items-center">

            <div>

              <div className="flex items-center gap-2 text-xs font-black uppercase tracking-[0.18em] text-yellow-400">

                <Sparkles
                  size={15}
                />

                Start Learning

              </div>


              <h2 className="mt-3 max-w-2xl text-3xl font-black leading-tight sm:text-4xl">
                अपनी preparation आज ही शुरू करें।
              </h2>


              <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-300">
                Course purchase करके अपने student dashboard से recorded learning content access करें।
              </p>

            </div>


            <button
              type="button"
              onClick={
                handleBuyCourse
              }
              disabled={
                purchaseLoading
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-700 px-6 py-3.5 text-sm font-black text-white shadow-lg shadow-red-900/20 transition hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
            >

              {purchaseLoading ? (
                <>
                  <Loader2
                    size={18}
                    className="animate-spin"
                  />

                  Processing...
                </>
              ) : (
                <>
                  Buy Now

                  <ArrowRight
                    size={18}
                  />
                </>
              )}

            </button>

          </div>

        </div>

      </section>


      {/* =================================================
          MOBILE PURCHASE BAR
      ================================================= */}

      <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-slate-200 bg-white/95 p-3 shadow-2xl backdrop-blur lg:hidden">

        <div className="mx-auto flex max-w-3xl items-center gap-3">

          <div className="min-w-0 flex-1">

            <p className="text-[9px] font-black uppercase tracking-wider text-slate-400">
              Course Fee
            </p>

            <div className="flex items-center gap-2">

              <span className="text-lg font-black text-[#071b41]">
                ₹{price}
              </span>


              {oldPrice >
                price && (
                <span className="text-xs font-bold text-slate-400 line-through">
                  ₹{oldPrice}
                </span>
              )}

            </div>

          </div>


          <button
            type="button"
            onClick={
              handleBuyCourse
            }
            disabled={
              purchaseLoading
            }
            className="flex shrink-0 items-center justify-center gap-2 rounded-xl bg-red-700 px-5 py-3 text-xs font-black text-white shadow-lg shadow-red-700/20 disabled:opacity-60"
          >

            {purchaseLoading ? (
              <Loader2
                size={16}
                className="animate-spin"
              />
            ) : (
              <>
                Buy Now

                <ArrowRight
                  size={16}
                />
              </>
            )}

          </button>

        </div>

      </div>

    </main>
  );
}


/* =========================================================
   PURCHASE CARD
========================================================= */

function PurchaseCard({
  course,
  price,
  oldPrice,
  discount,
  savings,
  purchaseLoading,
  purchaseMessage,
  purchaseError,
  onBuy,
}) {
  return (
    <div className="relative">

      <div className="absolute -inset-1 rounded-[28px] bg-gradient-to-r from-red-600/30 via-yellow-400/20 to-blue-500/30 blur-xl" />


      <div className="relative overflow-hidden rounded-[28px] border border-white/10 bg-white p-5 text-[#071b41] shadow-2xl sm:p-6">

        {/* THUMBNAIL */}

        <div className="group relative h-48 overflow-hidden rounded-2xl bg-gradient-to-br from-[#071b41] to-[#0b275d]">

          {course.thumbnail ? (
            <img
              src={
                course.thumbnail
              }
              alt={
                course.title
              }
              className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="flex h-full items-center justify-center">

              <BookOpen
                size={58}
                className="text-yellow-400"
              />

            </div>
          )}


          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />


          <div className="absolute bottom-4 left-4 right-4 flex items-center justify-between">

            <span className="rounded-full bg-black/40 px-3 py-1.5 text-[10px] font-bold text-white backdrop-blur">
              Recorded Course
            </span>


            {discount >
              0 && (
              <span className="rounded-full bg-yellow-400 px-3 py-1.5 text-[10px] font-black text-[#071b41]">
                Save {discount}%
              </span>
            )}

          </div>

        </div>


        {/* PRICE */}

        <div className="mt-6">

          <p className="text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
            Course Fee
          </p>


          <div className="mt-2 flex flex-wrap items-end gap-3">

            <span className="text-4xl font-black tracking-tight">
              ₹{price}
            </span>


            {oldPrice >
              price && (
              <span className="pb-1 text-base font-bold text-slate-400 line-through">
                ₹{oldPrice}
              </span>
            )}

          </div>


          {savings >
            0 && (
            <div className="mt-2 inline-flex items-center gap-1.5 rounded-lg bg-green-50 px-2.5 py-1.5 text-xs font-black text-green-700">

              <Check
                size={14}
              />

              You save ₹
              {savings}

            </div>
          )}

        </div>


        {/* SUCCESS */}

        {purchaseMessage && (
          <div className="mt-5 rounded-2xl border border-green-200 bg-green-50 p-4">

            <div className="flex items-start gap-2.5">

              <CheckCircle2
                size={19}
                className="mt-0.5 shrink-0 text-green-600"
              />

              <p className="text-sm font-bold leading-6 text-green-800">
                {
                  purchaseMessage
                }
              </p>

            </div>

          </div>
        )}


        {/* ERROR */}

        {purchaseError && (
          <div className="mt-5 rounded-2xl border border-red-200 bg-red-50 p-4">

            <p className="text-sm font-bold leading-6 text-red-700">
              {
                purchaseError
              }
            </p>

          </div>
        )}


        {/* BUY */}

        <button
          type="button"
          onClick={
            onBuy
          }
          disabled={
            purchaseLoading
          }
          className="mt-6 flex w-full items-center justify-center gap-2 rounded-2xl bg-red-700 px-5 py-4 text-sm font-black text-white shadow-lg shadow-red-700/20 transition duration-200 hover:-translate-y-0.5 hover:bg-red-800 disabled:cursor-not-allowed disabled:opacity-60"
        >

          {purchaseLoading ? (
            <>
              <Loader2
                size={19}
                className="animate-spin"
              />

              Processing...
            </>
          ) : (
            <>
              Buy Now

              <ArrowRight
                size={19}
              />
            </>
          )}

        </button>


        <Link
          to="/signup"
          className="mt-3 flex w-full items-center justify-center rounded-2xl border-2 border-[#071b41] px-5 py-3.5 text-sm font-black text-[#071b41] transition hover:bg-[#071b41] hover:text-white"
        >
          Create Student Account
        </Link>


        {/* SECURITY */}

        <div className="mt-5 flex items-start gap-3 border-t border-slate-100 pt-5">

          <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-green-50 text-green-700">

            <ShieldCheck
              size={18}
            />

          </div>


          <p className="text-xs leading-5 text-slate-500">
            Purchase के बाद paid content आपके authorized student account में securely available रहेगा।
          </p>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   SECTION HEADING
========================================================= */

function SectionHeading({
  eyebrow,
  title,
  description,
}) {
  return (
    <div>

      <p className="text-xs font-black uppercase tracking-[0.18em] text-red-700">
        {eyebrow}
      </p>


      <h2 className="mt-2 text-3xl font-black tracking-tight text-[#071b41] sm:text-4xl">
        {title}
      </h2>


      {description && (
        <p className="mt-3 max-w-2xl text-sm leading-6 text-slate-500">
          {description}
        </p>
      )}

    </div>
  );
}


/* =========================================================
   HERO STAT
========================================================= */

function HeroStat({
  icon,
  value,
  label,
}) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/[0.07] p-3.5 backdrop-blur">

      <div className="flex items-center gap-2">

        <div className="text-yellow-400">
          {icon}
        </div>

        <span className="truncate text-lg font-black text-white">
          {value}
        </span>

      </div>


      <p className="mt-1 text-[10px] font-semibold text-slate-400">
        {label}
      </p>

    </div>
  );
}


/* =========================================================
   TRUST ITEM
========================================================= */

function TrustItem({
  children,
}) {
  return (
    <div className="flex items-center gap-2">
      {children}
    </div>
  );
}


/* =========================================================
   FEATURE CARD
========================================================= */

function FeatureCard({
  icon: Icon,
  title,
  description,
}) {
  return (
    <div className="group rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:border-red-100 hover:shadow-xl hover:shadow-slate-200/50">

      <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-red-50 text-red-700 transition group-hover:bg-red-700 group-hover:text-white">

        <Icon
          size={22}
        />

      </div>


      <h3 className="mt-5 font-black text-[#071b41]">
        {title}
      </h3>


      <p className="mt-2 text-sm leading-6 text-slate-500">
        {description}
      </p>

    </div>
  );
}


/* =========================================================
   CONTENT CARD
========================================================= */

function ContentCard({
  icon,
  value,
  label,
  className,
}) {
  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex items-center gap-4">

        <div
          className={`flex h-12 w-12 items-center justify-center rounded-2xl ${className}`}
        >
          {icon}
        </div>


        <div>

          <p className="text-2xl font-black text-[#071b41]">
            {value}
          </p>

          <p className="mt-0.5 text-xs font-bold text-slate-500">
            {label}
          </p>

        </div>

      </div>

    </div>
  );
}


/* =========================================================
   LEARNING STEP
========================================================= */

function LearningStep({
  number,
  title,
  description,
}) {
  return (
    <div className="group flex gap-4 rounded-3xl border border-slate-200 bg-white p-5 shadow-sm transition duration-300 hover:-translate-y-1 hover:shadow-lg">

      <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-[#071b41] text-sm font-black text-yellow-400 transition group-hover:bg-red-700 group-hover:text-white">
        {number}
      </div>


      <div>

        <h3 className="font-black text-[#071b41]">
          {title}
        </h3>

        <p className="mt-1.5 text-sm leading-6 text-slate-500">
          {description}
        </p>

      </div>

    </div>
  );
}


/* =========================================================
   SIDE FEATURE
========================================================= */

function SideFeature({
  icon,
  text,
}) {
  return (
    <div className="flex items-center gap-3">

      <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-red-50 text-red-700">
        {icon}
      </div>

      <span className="text-sm font-bold text-slate-700">
        {text}
      </span>

    </div>
  );
}


/* =========================================================
   LOADING
========================================================= */

function CourseLoading() {
  return (
    <main className="min-h-screen bg-slate-50">

      <div className="h-[420px] animate-pulse bg-[#071b41]" />

      <div className="container-main -mt-16 pb-20">

        <div className="grid gap-7 lg:grid-cols-[1fr_400px]">

          <div className="h-72 rounded-3xl bg-white shadow-xl" />

          <div className="h-96 rounded-3xl bg-white shadow-xl" />

        </div>


        <div className="mt-12 grid gap-4 sm:grid-cols-2">

          {[1, 2, 3, 4].map(
            (item) => (
              <div
                key={item}
                className="h-40 animate-pulse rounded-3xl bg-white"
              />
            )
          )}

        </div>

      </div>

      <div className="flex items-center justify-center pb-10">

        <Loader2
          size={24}
          className="animate-spin text-red-700"
        />

      </div>

    </main>
  );
}


/* =========================================================
   ERROR
========================================================= */

function CourseError({
  message,
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-slate-50 px-5">

      <div className="w-full max-w-lg rounded-3xl border border-slate-200 bg-white p-8 text-center shadow-xl shadow-slate-200/50">

        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-red-50 text-red-700">

          <BookOpen
            size={28}
          />

        </div>


        <p className="mt-5 text-[10px] font-black uppercase tracking-[0.18em] text-red-700">
          Course
        </p>


        <h1 className="mt-2 text-2xl font-black text-[#071b41]">
          Course नहीं मिला
        </h1>


        <p className="mt-3 text-sm leading-6 text-slate-500">
          {message}
        </p>


        <Link
          to="/courses"
          className="mt-7 inline-flex items-center gap-2 rounded-xl bg-[#071b41] px-5 py-3 text-sm font-black text-white transition hover:bg-[#0b275d]"
        >

          View Courses

          <ArrowRight
            size={17}
          />

        </Link>

      </div>

    </main>
  );
}


/* =========================================================
   JSON PARSER
========================================================= */

async function parseJson(
  response
) {
  const text =
    await response.text();

  if (!text) {
    return {};
  }

  try {
    return JSON.parse(
      text
    );
  } catch {
    return {};
  }
}