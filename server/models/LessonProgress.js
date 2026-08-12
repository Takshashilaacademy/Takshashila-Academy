import mongoose from "mongoose";

/* =========================================================
   LESSON PROGRESS

   One progress document per student + course + lesson.
========================================================= */

const lessonProgressSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Student",
      required: true,
      index: true,
    },

    course: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Course",
      required: true,
      index: true,
    },

    lesson: {
      type: mongoose.Schema.Types.ObjectId,
      required: true,
      index: true,
    },

    watchedSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    durationSeconds: {
      type: Number,
      default: 0,
      min: 0,
    },

    progressPercent: {
      type: Number,
      default: 0,
      min: 0,
      max: 100,
    },

    completed: {
      type: Boolean,
      default: false,
      index: true,
    },

    lastWatchedAt: {
      type: Date,
      default: null,
      index: true,
    },
  },
  {
    timestamps: true,
  }
);

lessonProgressSchema.index(
  { student: 1, course: 1, lesson: 1 },
  { unique: true }
);

lessonProgressSchema.index({
  student: 1,
  course: 1,
  lastWatchedAt: -1,
});

const LessonProgress =
  mongoose.models.LessonProgress ||
  mongoose.model(
    "LessonProgress",
    lessonProgressSchema
  );

export default LessonProgress;
