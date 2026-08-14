import mongoose from "mongoose";

/* =========================================================
   HELPERS
========================================================= */

/* ---------------------------------------------------------
   STRING CLEANER
--------------------------------------------------------- */

const trimString = (value) => {
  if (
    typeof value !== "string"
  ) {
    return value;
  }

  return value.trim();
};

/* ---------------------------------------------------------
   HTTP URL VALIDATOR
--------------------------------------------------------- */

const isValidHttpUrl = (
  value
) => {
  if (!value) {
    return true;
  }

  if (
    typeof value !== "string"
  ) {
    return false;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "http:" ||
      url.protocol ===
        "https:"
    );
  } catch {
    return false;
  }
};

/* ---------------------------------------------------------
   CLOUDINARY URL VALIDATOR

   Used only for protected media fields.
========================================================= */

const isCloudinaryUrl = (
  value
) => {
  if (!value) {
    return true;
  }

  if (
    typeof value !== "string"
  ) {
    return false;
  }

  try {
    const url =
      new URL(value);

    return (
      url.protocol ===
        "https:" &&
      (
        url.hostname ===
          "cloudinary.com" ||
        url.hostname.endsWith(
          ".cloudinary.com"
        )
      )
    );
  } catch {
    return false;
  }
};

/* =========================================================
   LESSON SCHEMA
========================================================= */

const lessonSchema =
  new mongoose.Schema(
    {
      /* ---------------------------------------------------
         TITLE
      --------------------------------------------------- */

      title: {
        type: String,

        required: [
          true,
          "Lesson title is required",
        ],

        trim: true,

        minlength: [
          1,
          "Lesson title cannot be empty",
        ],

        maxlength: [
          200,
          "Lesson title cannot exceed 200 characters",
        ],
      },

      /* ---------------------------------------------------
         DESCRIPTION
      --------------------------------------------------- */

      description: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          2000,
          "Lesson description cannot exceed 2000 characters",
        ],
      },

      /* ---------------------------------------------------
         VIDEO URL
      --------------------------------------------------- */

      videoUrl: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          2048,
          "Video URL is too long",
        ],

        validate: {
          validator:
            isCloudinaryUrl,

          message:
            "Video URL must be a valid Cloudinary HTTPS URL",
        },
      },

      /* ---------------------------------------------------
         CLOUDINARY VIDEO PUBLIC ID
      --------------------------------------------------- */

      videoPublicId: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          500,
          "Video public ID is too long",
        ],
      },

      /* ---------------------------------------------------
         DURATION
      --------------------------------------------------- */

      duration: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          100,
          "Video duration is too long",
        ],
      },

      /* ---------------------------------------------------
         PREVIEW
      --------------------------------------------------- */

      isPreview: {
        type: Boolean,

        default: false,
      },

      /* ---------------------------------------------------
         PUBLISHED
      --------------------------------------------------- */

      isPublished: {
        type: Boolean,

        default: true,

        index: true,
      },
    },
    {
      _id: true,

      timestamps: true,
    }
  );

/* =========================================================
   MATERIAL SCHEMA
========================================================= */

const materialSchema =
  new mongoose.Schema(
    {
      /* ---------------------------------------------------
         TITLE
      --------------------------------------------------- */

      title: {
        type: String,

        required: [
          true,
          "Material title is required",
        ],

        trim: true,

        minlength: [
          1,
          "Material title cannot be empty",
        ],

        maxlength: [
          200,
          "Material title cannot exceed 200 characters",
        ],
      },

      /* ---------------------------------------------------
         DESCRIPTION
      --------------------------------------------------- */

      description: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          2000,
          "Material description cannot exceed 2000 characters",
        ],
      },

      /* ---------------------------------------------------
         FILE URL
      --------------------------------------------------- */

      fileUrl: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          2048,
          "File URL is too long",
        ],

        validate: {
          validator:
            isCloudinaryUrl,

          message:
            "File URL must be a valid Cloudinary HTTPS URL",
        },
      },

      /* ---------------------------------------------------
         CLOUDINARY PUBLIC ID
      --------------------------------------------------- */

      filePublicId: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          500,
          "File public ID is too long",
        ],
      },

      /* ---------------------------------------------------
         FILE TYPE
      --------------------------------------------------- */

      fileType: {
        type: String,

        enum: {
          values: [
            "pdf",
            "note",
            "document",
          ],

          message:
            "Invalid material file type",
        },

        default: "pdf",

        lowercase: true,

        trim: true,
      },

      /* ---------------------------------------------------
         FILE SIZE
      --------------------------------------------------- */

      fileSize: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          100,
          "File size value is too long",
        ],
      },

      /* ---------------------------------------------------
         PUBLISHED
      --------------------------------------------------- */

      isPublished: {
        type: Boolean,

        default: true,

        index: true,
      },
    },
    {
      _id: true,

      timestamps: true,
    }
  );

/* =========================================================
   COURSE SCHEMA
========================================================= */

const courseSchema =
  new mongoose.Schema(
    {
      /* ===================================================
         COURSE TITLE
      =================================================== */

      title: {
        type: String,

        required: [
          true,
          "Course title is required",
        ],

        trim: true,

        minlength: [
          2,
          "Course title must be at least 2 characters",
        ],

        maxlength: [
          200,
          "Course title cannot exceed 200 characters",
        ],
      },

      /* ===================================================
         SHORT TITLE
      =================================================== */

      shortTitle: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          100,
          "Short title cannot exceed 100 characters",
        ],
      },

      /* ===================================================
         EXAM
      =================================================== */

      exam: {
        type: String,

        required: [
          true,
          "Exam name is required",
        ],

        trim: true,

        minlength: [
          2,
          "Exam name must be at least 2 characters",
        ],

        maxlength: [
          150,
          "Exam name cannot exceed 150 characters",
        ],
      },

      /* ===================================================
         SHORT DESCRIPTION
      =================================================== */

      description: {
        type: String,

        required: [
          true,
          "Course description is required",
        ],

        trim: true,

        minlength: [
          10,
          "Course description must be at least 10 characters",
        ],

        maxlength: [
          2000,
          "Course description cannot exceed 2000 characters",
        ],
      },

      /* ===================================================
         FULL DESCRIPTION
      =================================================== */

      fullDescription: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          10000,
          "Full description cannot exceed 10000 characters",
        ],
      },

      /* ===================================================
         THUMBNAIL
      =================================================== */

      thumbnail: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          2048,
          "Thumbnail URL is too long",
        ],

        validate: {
          validator:
            isCloudinaryUrl,

          message:
            "Thumbnail must be a valid Cloudinary HTTPS URL",
        },
      },

      /* ===================================================
         THUMBNAIL CLOUDINARY PUBLIC ID
      =================================================== */

      thumbnailPublicId: {
        type: String,

        default: "",

        trim: true,

        maxlength: [
          500,
          "Thumbnail public ID is too long",
        ],
      },

      /* ===================================================
         PRICE
      =================================================== */

      price: {
        type: Number,

        required: [
          true,
          "Course price is required",
        ],

        min: [
          0,
          "Course price cannot be negative",
        ],
      },

      /* ===================================================
         OLD PRICE
      =================================================== */

      oldPrice: {
        type: Number,

        default: 0,

        min: [
          0,
          "Old price cannot be negative",
        ],
      },

      /* ===================================================
         DURATION
      =================================================== */

      duration: {
        type: String,

        default: "Self Paced",

        trim: true,

        maxlength: [
          100,
          "Duration cannot exceed 100 characters",
        ],
      },

      /* ===================================================
         LANGUAGE
      =================================================== */

      language: {
        type: String,

        default: "Hindi",

        trim: true,

        maxlength: [
          100,
          "Language cannot exceed 100 characters",
        ],
      },

      /* ===================================================
         SUBJECTS
      =================================================== */

      subjects: [
        {
          type: String,

          trim: true,

          maxlength: [
            150,
            "Subject name cannot exceed 150 characters",
          ],
        },
      ],

      /* ===================================================
         FEATURES
      =================================================== */

      features: [
        {
          type: String,

          trim: true,

          maxlength: [
            300,
            "Feature cannot exceed 300 characters",
          ],
        },
      ],

      /* ===================================================
         LESSONS / VIDEOS
      =================================================== */

      lessons: {
        type: [
          lessonSchema,
        ],

        default: [],
      },

      /* ===================================================
         STUDY MATERIALS
      =================================================== */

      materials: {
        type: [
          materialSchema,
        ],

        default: [],
      },

      /* ===================================================
         TOTAL VIDEOS
      =================================================== */

      totalVideos: {
        type: Number,

        default: 0,

        min: [
          0,
          "Total videos cannot be negative",
        ],
      },

      /* ===================================================
         TOTAL NOTES
      =================================================== */

      totalNotes: {
        type: Number,

        default: 0,

        min: [
          0,
          "Total notes cannot be negative",
        ],
      },

      /* ===================================================
         TOTAL TESTS
      =================================================== */

      totalTests: {
        type: Number,

        default: 0,

        min: [
          0,
          "Total tests cannot be negative",
        ],
      },

      /* ===================================================
         PUBLISHED
      =================================================== */

      isPublished: {
        type: Boolean,

        default: true,

        index: true,
      },

      /* ===================================================
         FEATURED
      =================================================== */

      isFeatured: {
        type: Boolean,

        default: false,

        index: true,
      },
    },

    {
      timestamps: true,
    }
  );

/* =========================================================
   COURSE INDEXES
========================================================= */

courseSchema.index({
  isPublished: 1,
  isFeatured: 1,
});

courseSchema.index({
  createdAt: -1,
});

courseSchema.index({
  exam: 1,
  isPublished: 1,
});

courseSchema.index({
  title: 1,
});

/* =========================================================
   JSON TRANSFORMATION
========================================================= */

courseSchema.set(
  "toJSON",
  {
    transform: (
      doc,
      ret
    ) => {
      delete ret.__v;

      return ret;
    },
  }
);

/* =========================================================
   PRE-VALIDATE COUNTERS

   IMPORTANT:

   Only PUBLISHED lessons/materials are counted.

   This keeps the counters consistent with the public
   course API and admin dashboard.

   IMPORTANT FIX:
   This middleware uses promise-style execution.
   Do NOT use next() here.
========================================================= */

courseSchema.pre(
  "validate",
  function () {
    /* -----------------------------------------------------
       TOTAL PUBLISHED VIDEOS
    ----------------------------------------------------- */

    if (
      Array.isArray(
        this.lessons
      )
    ) {
      this.totalVideos =
        this.lessons.filter(
          (lesson) =>
            lesson.isPublished !==
            false
        ).length;
    } else {
      this.totalVideos = 0;
    }

    /* -----------------------------------------------------
       TOTAL PUBLISHED MATERIALS
    ----------------------------------------------------- */

    if (
      Array.isArray(
        this.materials
      )
    ) {
      this.totalNotes =
        this.materials.filter(
          (material) =>
            material.isPublished !==
            false
        ).length;
    } else {
      this.totalNotes = 0;
    }

    /* -----------------------------------------------------
       TOTAL TESTS

       Tests will have their own system.

       Therefore totalTests is intentionally NOT
       automatically calculated here.
    ----------------------------------------------------- */
  }
);

/* =========================================================
   MODEL
========================================================= */

const Course =
  mongoose.models.Course ||
  mongoose.model(
    "Course",
    courseSchema
  );

export default Course;