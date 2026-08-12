import mongoose from "mongoose";

import Course from "../models/Course.js";

import {
  deleteCloudinaryRaw,
} from "../config/cloudinary.js";

/* =========================================================
   HELPERS
========================================================= */

/* ---------------------------------------------------------
   OBJECT ID VALIDATION
--------------------------------------------------------- */

const isValidObjectId = (
  value
) => {
  return mongoose.Types.ObjectId.isValid(
    value
  );
};

/* ---------------------------------------------------------
   CLOUDINARY URL VALIDATION
--------------------------------------------------------- */

/*
 * Course materials should come from Cloudinary.
 *
 * We do not allow arbitrary external file URLs.
 */

const isCloudinaryUrl = (
  value
) => {
  if (
    typeof value !== "string" ||
    !value.trim()
  ) {
    return false;
  }

  try {
    const url =
      new URL(
        value.trim()
      );

    return (
      url.protocol ===
        "https:" &&
      url.hostname.endsWith(
        "cloudinary.com"
      )
    );
  } catch {
    return false;
  }
};

/* ---------------------------------------------------------
   FILE TYPE NORMALIZER
--------------------------------------------------------- */

const normalizeFileType = (
  fileType
) => {
  const type =
    String(
      fileType || ""
    )
      .trim()
      .toLowerCase();

  if (
    type === "pdf" ||
    type ===
      "application/pdf"
  ) {
    return "pdf";
  }

  if (
    type === "note" ||
    type === "text/plain"
  ) {
    return "note";
  }

  if (
    type === "document" ||
    type ===
      "application/msword" ||
    type ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document"
  ) {
    return "document";
  }

  return "document";
};

/* ---------------------------------------------------------
   UPDATE TOTAL NOTES
--------------------------------------------------------- */

const updateTotalNotes = (
  course
) => {
  if (
    !Array.isArray(
      course.materials
    )
  ) {
    course.totalNotes = 0;

    return;
  }

  /*
   * Count only published materials.
   */

  course.totalNotes =
    course.materials.filter(
      (material) =>
        material.isPublished !==
        false
    ).length;
};

/* =========================================================
   ADD COURSE MATERIAL
=========================================================

POST /api/admin/content/courses/:courseId/materials

ADMIN ONLY

Expected body:

{
  title,
  description,
  fileUrl,
  filePublicId,
  fileType,
  fileSize,
  isPublished
}

========================================================= */

export const addCourseMaterial =
  async (
    req,
    res
  ) => {
    try {
      const {
        courseId,
      } = req.params;

      /* ---------------------------------------------------
         COURSE ID VALIDATION
      --------------------------------------------------- */

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid course ID.",
        });
      }

      /* ---------------------------------------------------
         REQUEST BODY
      --------------------------------------------------- */

      const {
        title,
        description,
        fileUrl,
        filePublicId,
        fileType,
        fileSize,
        isPublished,
      } = req.body || {};

      /* ---------------------------------------------------
         TITLE
      --------------------------------------------------- */

      const normalizedTitle =
        typeof title ===
        "string"
          ? title.trim()
          : "";

      if (
        !normalizedTitle
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Material title is required.",
        });
      }

      if (
        normalizedTitle.length >
        200
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Material title cannot exceed 200 characters.",
        });
      }

      /* ---------------------------------------------------
         FILE URL
      --------------------------------------------------- */

      const normalizedFileUrl =
        typeof fileUrl ===
        "string"
          ? fileUrl.trim()
          : "";

      if (
        !normalizedFileUrl
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Uploaded file URL is required.",
        });
      }

      if (
        !isCloudinaryUrl(
          normalizedFileUrl
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Material file must be hosted on Cloudinary.",
        });
      }

      /* ---------------------------------------------------
         CLOUDINARY PUBLIC ID
      --------------------------------------------------- */

      const normalizedPublicId =
        typeof filePublicId ===
        "string"
          ? filePublicId.trim()
          : "";

      if (
        !normalizedPublicId
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cloudinary public ID is required.",
        });
      }

      if (
        normalizedPublicId.length >
        500
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Cloudinary public ID is invalid.",
        });
      }

      /* ---------------------------------------------------
         FILE SIZE
      --------------------------------------------------- */

      let normalizedFileSize =
        "";

      if (
        fileSize !==
          undefined &&
        fileSize !== null
      ) {
        normalizedFileSize =
          String(
            fileSize
          ).trim();

        if (
          normalizedFileSize.length >
          100
        ) {
          return res.status(400).json({
            success: false,
            message:
              "File size information is invalid.",
          });
        }
      }

      /* ---------------------------------------------------
         FIND COURSE
      --------------------------------------------------- */

      const course =
        await Course.findById(
          courseId
        );

      if (!course) {
        return res.status(404).json({
          success: false,
          message:
            "Course not found.",
        });
      }

      /* ---------------------------------------------------
         MATERIAL LIMIT
      --------------------------------------------------- */

      /*
       * Prevent accidental massive payload growth.
       */

      if (
        Array.isArray(
          course.materials
        ) &&
        course.materials.length >=
          1000
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Maximum number of course materials reached.",
        });
      }

      /* ---------------------------------------------------
         MATERIAL OBJECT
      --------------------------------------------------- */

      const material = {
        title:
          normalizedTitle,

        description:
          typeof description ===
          "string"
            ? description
                .trim()
                .slice(0, 2000)
            : "",

        fileUrl:
          normalizedFileUrl,

        filePublicId:
          normalizedPublicId,

        fileType:
          normalizeFileType(
            fileType
          ),

        fileSize:
          normalizedFileSize,

        isPublished:
          isPublished !== false,

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      };

      /* ---------------------------------------------------
         MATERIALS ARRAY
      --------------------------------------------------- */

      if (
        !Array.isArray(
          course.materials
        )
      ) {
        course.materials = [];
      }

      course.materials.push(
        material
      );

      /* ---------------------------------------------------
         UPDATE COUNTER
      --------------------------------------------------- */

      updateTotalNotes(
        course
      );

      /* ---------------------------------------------------
         SAVE COURSE
      --------------------------------------------------- */

      await course.save();

      /* ---------------------------------------------------
         GET CREATED MATERIAL
      --------------------------------------------------- */

      const createdMaterial =
        course.materials[
          course.materials.length -
            1
        ];

      /* ---------------------------------------------------
         RESPONSE
      --------------------------------------------------- */

      return res.status(201).json({
        success: true,

        message:
          "Course material added successfully.",

        material:
          createdMaterial,

        course: {
          id:
            course._id,

          title:
            course.title,

          totalNotes:
            course.totalNotes,
        },
      });
    } catch (error) {
      console.error(
        "Add Course Material Error:",
        error
      );

      /* ---------------------------------------------------
         MONGOOSE VALIDATION
      --------------------------------------------------- */

      if (
        error?.name ===
        "ValidationError"
      ) {
        const message =
          Object.values(
            error.errors || {}
          )[0]?.message ||
          "Invalid course material.";

        return res.status(400).json({
          success: false,
          message,
        });
      }

      return res.status(500).json({
        success: false,
        message:
          "Unable to add course material.",
      });
    }
  };

/* =========================================================
   DELETE COURSE MATERIAL
=========================================================

DELETE
/api/admin/content/courses/:courseId/materials/:materialId

ADMIN ONLY

IMPORTANT:

1. Find material
2. Remove database reference
3. Save course
4. Delete Cloudinary asset

If Cloudinary deletion fails after DB deletion, the material
is already removed from the application and a warning is
returned/logged so the orphan asset can be cleaned later.

========================================================= */

export const deleteCourseMaterial =
  async (
    req,
    res
  ) => {
    try {
      const {
        courseId,
        materialId,
      } = req.params;

      /* ---------------------------------------------------
         COURSE ID
      --------------------------------------------------- */

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid course ID.",
        });
      }

      /* ---------------------------------------------------
         MATERIAL ID
      --------------------------------------------------- */

      if (
        !isValidObjectId(
          materialId
        )
      ) {
        return res.status(400).json({
          success: false,
          message:
            "Invalid material ID.",
        });
      }

      /* ---------------------------------------------------
         FIND COURSE
      --------------------------------------------------- */

      const course =
        await Course.findById(
          courseId
        );

      if (!course) {
        return res.status(404).json({
          success: false,
          message:
            "Course not found.",
        });
      }

      /* ---------------------------------------------------
         CHECK MATERIALS
      --------------------------------------------------- */

      if (
        !Array.isArray(
          course.materials
        ) ||
        course.materials.length ===
          0
      ) {
        return res.status(404).json({
          success: false,
          message:
            "No course materials found.",
        });
      }

      /* ---------------------------------------------------
         FIND MATERIAL
      --------------------------------------------------- */

      const materialIndex =
        course.materials.findIndex(
          (material) =>
            material?._id?.toString() ===
            materialId
        );

      if (
        materialIndex ===
        -1
      ) {
        return res.status(404).json({
          success: false,
          message:
            "Course material not found.",
        });
      }

      /* ---------------------------------------------------
         GET MATERIAL
      --------------------------------------------------- */

      const deletedMaterial =
        course.materials[
          materialIndex
        ];

      const publicId =
        deletedMaterial
          ?.filePublicId
          ?.toString()
          .trim();

      /* ---------------------------------------------------
         REMOVE MATERIAL
      --------------------------------------------------- */

      course.materials.splice(
        materialIndex,
        1
      );

      /* ---------------------------------------------------
         UPDATE COUNTER
      --------------------------------------------------- */

      updateTotalNotes(
        course
      );

      /* ---------------------------------------------------
         SAVE DATABASE FIRST
      --------------------------------------------------- */

      await course.save();

      /* ---------------------------------------------------
         DELETE CLOUDINARY ASSET
      --------------------------------------------------- */

      let cloudinaryDelete =
        null;

      if (publicId) {
        cloudinaryDelete =
          await deleteCloudinaryRaw(
            publicId
          );
      }

      /* ---------------------------------------------------
         CLOUDINARY CLEANUP RESULT
      --------------------------------------------------- */

      const cloudinaryCleanupFailed =
        Boolean(
          cloudinaryDelete &&
            !cloudinaryDelete.success
        );

      if (
        cloudinaryCleanupFailed
      ) {
        console.error(
          "Cloudinary material cleanup failed:",
          cloudinaryDelete
        );
      }

      /* ---------------------------------------------------
         RESPONSE
      --------------------------------------------------- */

      return res.status(200).json({
        success: true,

        message:
          "Course material deleted successfully.",

        deletedMaterial: {
          id:
            deletedMaterial?._id,

          title:
            deletedMaterial?.title,

          fileType:
            deletedMaterial?.fileType,
        },

        cloudinary: {
          deleted:
            cloudinaryDelete
              ? cloudinaryDelete.success
              : false,

          cleanupPending:
            cloudinaryCleanupFailed,
        },

        course: {
          id:
            course._id,

          title:
            course.title,

          totalNotes:
            course.totalNotes,
        },
      });
    } catch (error) {
      console.error(
        "Delete Course Material Error:",
        error
      );

      return res.status(500).json({
        success: false,
        message:
          "Unable to delete course material.",
      });
    }
  };