import mongoose from "mongoose";

import Course from "../models/Course.js";

import cloudinary, {
  deleteCloudinaryVideo,
  deleteCloudinaryRaw,
} from "../config/cloudinary.js";

import {
  isAuthenticatedCloudinaryUrl,
} from "../utils/cloudinaryMedia.js";

/* =========================================================
   CONSTANTS
========================================================= */

const MAX_TITLE_LENGTH =
  200;

const MAX_DESCRIPTION_LENGTH =
  2000;

const MAX_URL_LENGTH =
  2048;

const MAX_PUBLIC_ID_LENGTH =
  500;

const MAX_FILE_SIZE_LENGTH =
  100;

const MAX_VIDEO_COUNT =
  2000;

const MAX_MATERIAL_COUNT =
  5000;

/* =========================================================
   HELPERS
========================================================= */

/* ---------------------------------------------------------
   OBJECT ID
--------------------------------------------------------- */

const isValidObjectId = (
  id
) => {
  return mongoose.Types.ObjectId.isValid(
    id
  );
};

/* ---------------------------------------------------------
   CLEAN STRING
--------------------------------------------------------- */

const cleanString = (
  value,
  maxLength = 500
) => {
  if (
    typeof value !==
    "string"
  ) {
    return "";
  }

  return value
    .trim()
    .slice(
      0,
      maxLength
    );
};

/* ---------------------------------------------------------
   BOOLEAN
--------------------------------------------------------- */

const normalizeBoolean = (
  value,
  defaultValue = false
) => {
  if (
    typeof value ===
    "boolean"
  ) {
    return value;
  }

  return defaultValue;
};

/* ---------------------------------------------------------
   FILE TYPE
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
    type ===
      "text/plain"
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
   TOTAL VIDEO COUNT
--------------------------------------------------------- */

const updateTotalVideos = (
  course
) => {
  if (
    !Array.isArray(
      course.lessons
    )
  ) {
    course.totalVideos =
      0;

    return;
  }

  course.totalVideos =
    course.lessons.filter(
      (lesson) =>
        lesson?.isPublished !==
        false
    ).length;
};

/* ---------------------------------------------------------
   TOTAL MATERIAL COUNT
--------------------------------------------------------- */

const updateTotalNotes = (
  course
) => {
  if (
    !Array.isArray(
      course.materials
    )
  ) {
    course.totalNotes =
      0;

    return;
  }

  course.totalNotes =
    course.materials.filter(
      (material) =>
        material?.isPublished !==
        false
    ).length;
};

/* =========================================================
   VERIFY AUTHENTICATED CLOUDINARY ASSET
=========================================================

   This is a server-side verification.

   We do NOT trust the URL/public ID sent by the admin
   blindly.

   Required:

   - HTTPS Cloudinary URL
   - authenticated delivery URL
   - valid Cloudinary asset
   - correct resource type

========================================================= */

const verifyAuthenticatedCloudinaryAsset =
  async ({
    publicId,
    resourceType,
    url,
  }) => {
    const cleanPublicId =
      cleanString(
        publicId,
        MAX_PUBLIC_ID_LENGTH
      );

    const cleanUrl =
      cleanString(
        url,
        MAX_URL_LENGTH
      );

    if (
      !cleanPublicId
    ) {
      return {
        valid:
          false,

        code:
          "CLOUDINARY_PUBLIC_ID_REQUIRED",

        message:
          "Cloudinary public ID is required.",
      };
    }

    if (
      !cleanUrl
    ) {
      return {
        valid:
          false,

        code:
          "CLOUDINARY_URL_REQUIRED",

        message:
          "Cloudinary media URL is required.",
      };
    }

    /* =====================================================
       URL MUST BE AUTHENTICATED
    ===================================================== */

    if (
      !isAuthenticatedCloudinaryUrl(
        cleanUrl
      )
    ) {
      return {
        valid:
          false,

        code:
          "CLOUDINARY_AUTHENTICATED_REQUIRED",

        message:
          "Course media must use authenticated Cloudinary delivery.",
      };
    }

    /* =====================================================
       CLOUDINARY ASSET MUST EXIST
    ===================================================== */

    try {
      await cloudinary.api.resource(
        cleanPublicId,
        {
          resource_type:
            resourceType,

          type:
            "authenticated",
        }
      );
    } catch (
      error
    ) {
      console.error(
        "Cloudinary Asset Verification Error:",
        error?.message ||
          error
      );

      return {
        valid:
          false,

        code:
          "CLOUDINARY_ASSET_NOT_FOUND",

        message:
          "The Cloudinary authenticated asset could not be verified.",
      };
    }

    return {
      valid:
        true,

      publicId:
        cleanPublicId,

      url:
        cleanUrl,
    };
  };

/* =========================================================
   ADD VIDEO TO COURSE

   POST
   /api/admin/content/courses/:courseId/videos

   Body:

   {
     title,
     description,
     videoUrl,
     videoPublicId,
     duration,
     isPreview,
     isPublished
   }

========================================================= */

export const addVideoToCourse =
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         COURSE ID
      =================================================== */

      const {
        courseId,
      } =
        req.params;

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      /* ===================================================
         BODY
      =================================================== */

      const {
        title,
        description,
        videoUrl,
        videoPublicId,
        duration,
        isPreview,
        isPublished,
      } =
        req.body || {};

      /* ===================================================
         NORMALIZE
      =================================================== */

      const cleanTitle =
        cleanString(
          title,
          MAX_TITLE_LENGTH
        );

      const cleanDescription =
        cleanString(
          description,
          MAX_DESCRIPTION_LENGTH
        );

      const cleanVideoUrl =
        cleanString(
          videoUrl,
          MAX_URL_LENGTH
        );

      const cleanVideoPublicId =
        cleanString(
          videoPublicId,
          MAX_PUBLIC_ID_LENGTH
        );

      const cleanDuration =
        cleanString(
          duration,
          100
        );

      /* ===================================================
         TITLE
      =================================================== */

      if (
        !cleanTitle
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "VIDEO_TITLE_REQUIRED",

          message:
            "Video title is required.",
        });
      }

      /* ===================================================
         VIDEO URL
      =================================================== */

      if (
        !cleanVideoUrl
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "VIDEO_URL_REQUIRED",

          message:
            "Video URL is required.",
        });
      }

      /* ===================================================
         PUBLIC ID
      =================================================== */

      if (
        !cleanVideoPublicId
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "VIDEO_PUBLIC_ID_REQUIRED",

          message:
            "Cloudinary video public ID is required.",
        });
      }

      /* ===================================================
         AUTHENTICATED CLOUDINARY VERIFICATION
      =================================================== */

      const cloudinaryVerification =
        await verifyAuthenticatedCloudinaryAsset({
          publicId:
            cleanVideoPublicId,

          resourceType:
            "video",

          url:
            cleanVideoUrl,
        });

      if (
        !cloudinaryVerification.valid
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            cloudinaryVerification.code,

          message:
            cloudinaryVerification.message,
        });
      }

      /* ===================================================
         FIND COURSE
      =================================================== */

      const course =
        await Course.findById(
          courseId
        );

      if (
        !course
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         ENSURE LESSON ARRAY
      =================================================== */

      if (
        !Array.isArray(
          course.lessons
        )
      ) {
        course.lessons =
          [];
      }

      /* ===================================================
         LIMIT
      =================================================== */

      if (
        course.lessons.length >=
        MAX_VIDEO_COUNT
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "VIDEO_LIMIT_REACHED",

          message:
            "Maximum number of course videos reached.",
        });
      }

      /* ===================================================
         DUPLICATE PUBLIC ID CHECK
      =================================================== */

      const duplicateVideo =
        course.lessons.some(
          (
            lesson
          ) =>
            lesson?.videoPublicId ===
            cleanVideoPublicId
        );

      if (
        duplicateVideo
      ) {
        return res.status(409).json({
          success:
            false,

          code:
            "VIDEO_ALREADY_EXISTS",

          message:
            "This video is already added to this course.",
        });
      }

      /* ===================================================
         ADD VIDEO
      =================================================== */

      course.lessons.push({
        title:
          cleanTitle,

        description:
          cleanDescription,

        videoUrl:
          cleanVideoUrl,

        videoPublicId:
          cleanVideoPublicId,

        duration:
          cleanDuration,

        isPreview:
          normalizeBoolean(
            isPreview,
            false
          ),

        isPublished:
          normalizeBoolean(
            isPublished,
            true
          ),

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      });

      /* ===================================================
         UPDATE COUNT
      =================================================== */

      updateTotalVideos(
        course
      );

      /* ===================================================
         SAVE
      =================================================== */

      await course.save();

      const createdVideo =
        course.lessons[
          course.lessons.length -
            1
        ];

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(201).json({
        success:
          true,

        message:
          "Video added successfully.",

        video:
          createdVideo,

        course: {
          id:
            course._id,

          title:
            course.title,

          totalVideos:
            course.totalVideos,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Add Video Error:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        const message =
          Object.values(
            error.errors ||
              {}
          )[0]?.message ||
          "Invalid video data.";

        return res.status(400).json({
          success:
            false,

          code:
            "VIDEO_VALIDATION_ERROR",

          message,
        });
      }

      return res.status(500).json({
        success:
          false,

        code:
          "ADD_VIDEO_ERROR",

        message:
          "Unable to add video.",
      });
    }
  };

/* =========================================================
   ADD MATERIAL TO COURSE

   POST
   /api/admin/content/courses/:courseId/materials

========================================================= */

export const addMaterialToCourse =
  async (
    req,
    res
  ) => {
    try {
      /* ===================================================
         COURSE ID
      =================================================== */

      const {
        courseId,
      } =
        req.params;

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      /* ===================================================
         BODY
      =================================================== */

      const {
        title,
        description,
        fileUrl,
        filePublicId,
        fileType,
        fileSize,
        isPublished,
      } =
        req.body || {};

      /* ===================================================
         NORMALIZE
      =================================================== */

      const cleanTitle =
        cleanString(
          title,
          MAX_TITLE_LENGTH
        );

      const cleanDescription =
        cleanString(
          description,
          MAX_DESCRIPTION_LENGTH
        );

      const cleanFileUrl =
        cleanString(
          fileUrl,
          MAX_URL_LENGTH
        );

      const cleanFilePublicId =
        cleanString(
          filePublicId,
          MAX_PUBLIC_ID_LENGTH
        );

      const cleanFileSize =
        cleanString(
          fileSize,
          MAX_FILE_SIZE_LENGTH
        );

      const normalizedFileType =
        normalizeFileType(
          fileType
        );

      /* ===================================================
         TITLE
      =================================================== */

      if (
        !cleanTitle
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "MATERIAL_TITLE_REQUIRED",

          message:
            "Material title is required.",
        });
      }

      /* ===================================================
         FILE URL
      =================================================== */

      if (
        !cleanFileUrl
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "MATERIAL_URL_REQUIRED",

          message:
            "Material file URL is required.",
        });
      }

      /* ===================================================
         PUBLIC ID
      =================================================== */

      if (
        !cleanFilePublicId
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "MATERIAL_PUBLIC_ID_REQUIRED",

          message:
            "Cloudinary material public ID is required.",
        });
      }

      /* ===================================================
         AUTHENTICATED CLOUDINARY VERIFICATION
      =================================================== */

      const cloudinaryVerification =
        await verifyAuthenticatedCloudinaryAsset({
          publicId:
            cleanFilePublicId,

          resourceType:
            "raw",

          url:
            cleanFileUrl,
        });

      if (
        !cloudinaryVerification.valid
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            cloudinaryVerification.code,

          message:
            cloudinaryVerification.message,
        });
      }

      /* ===================================================
         FIND COURSE
      =================================================== */

      const course =
        await Course.findById(
          courseId
        );

      if (
        !course
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         ENSURE MATERIAL ARRAY
      =================================================== */

      if (
        !Array.isArray(
          course.materials
        )
      ) {
        course.materials =
          [];
      }

      /* ===================================================
         LIMIT
      =================================================== */

      if (
        course.materials.length >=
        MAX_MATERIAL_COUNT
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "MATERIAL_LIMIT_REACHED",

          message:
            "Maximum number of course materials reached.",
        });
      }

      /* ===================================================
         DUPLICATE PUBLIC ID
      =================================================== */

      const duplicateMaterial =
        course.materials.some(
          (
            material
          ) =>
            material?.filePublicId ===
            cleanFilePublicId
        );

      if (
        duplicateMaterial
      ) {
        return res.status(409).json({
          success:
            false,

          code:
            "MATERIAL_ALREADY_EXISTS",

          message:
            "This material is already added to this course.",
        });
      }

      /* ===================================================
         ADD MATERIAL
      =================================================== */

      course.materials.push({
        title:
          cleanTitle,

        description:
          cleanDescription,

        fileUrl:
          cleanFileUrl,

        filePublicId:
          cleanFilePublicId,

        fileType:
          normalizedFileType,

        fileSize:
          cleanFileSize,

        isPublished:
          normalizeBoolean(
            isPublished,
            true
          ),

        createdAt:
          new Date(),

        updatedAt:
          new Date(),
      });

      /* ===================================================
         UPDATE COUNT
      =================================================== */

      updateTotalNotes(
        course
      );

      /* ===================================================
         SAVE
      =================================================== */

      await course.save();

      const createdMaterial =
        course.materials[
          course.materials.length -
            1
        ];

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(201).json({
        success:
          true,

        message:
          "Study material added successfully.",

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
    } catch (
      error
    ) {
      console.error(
        "Add Material Error:",
        error
      );

      if (
        error?.name ===
        "ValidationError"
      ) {
        const message =
          Object.values(
            error.errors ||
              {}
          )[0]?.message ||
          "Invalid study material data.";

        return res.status(400).json({
          success:
            false,

          code:
            "MATERIAL_VALIDATION_ERROR",

          message,
        });
      }

      return res.status(500).json({
        success:
          false,

        code:
          "ADD_MATERIAL_ERROR",

        message:
          "Unable to add study material.",
      });
    }
  };

/* =========================================================
   DELETE VIDEO

   DELETE
   /api/admin/content/courses/:courseId/videos/:videoId

========================================================= */

export const deleteVideoFromCourse =
  async (
    req,
    res
  ) => {
    try {
      const {
        courseId,
        videoId,
      } =
        req.params;

      /* ===================================================
         VALIDATE IDs
      =================================================== */

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      if (
        !isValidObjectId(
          videoId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_VIDEO_ID",

          message:
            "Invalid video ID.",
        });
      }

      /* ===================================================
         FIND COURSE
      =================================================== */

      const course =
        await Course.findById(
          courseId
        );

      if (
        !course
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         LESSON ARRAY
      =================================================== */

      if (
        !Array.isArray(
          course.lessons
        )
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "NO_VIDEOS_FOUND",

          message:
            "No course videos found.",
        });
      }

      /* ===================================================
         FIND VIDEO
      =================================================== */

      const videoIndex =
        course.lessons.findIndex(
          (
            video
          ) =>
            video?._id?.toString() ===
            videoId
        );

      if (
        videoIndex ===
        -1
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "VIDEO_NOT_FOUND",

          message:
            "Video not found.",
        });
      }

      /* ===================================================
         SAVE PUBLIC ID
      =================================================== */

      const deletedVideo =
        course.lessons[
          videoIndex
        ];

      const videoPublicId =
        deletedVideo
          ?.videoPublicId
          ?.toString()
          .trim();

      /* ===================================================
         REMOVE FROM DATABASE
      =================================================== */

      course.lessons.splice(
        videoIndex,
        1
      );

      updateTotalVideos(
        course
      );

      await course.save();

      /* ===================================================
         DELETE AUTHENTICATED CLOUDINARY VIDEO
      =================================================== */

      let cloudinaryDelete =
        null;

      if (
        videoPublicId
      ) {
        cloudinaryDelete =
          await deleteCloudinaryVideo(
            videoPublicId,
            {
              type:
                "authenticated",
            }
          );
      }

      const cleanupFailed =
        Boolean(
          cloudinaryDelete &&
            !cloudinaryDelete.success
        );

      if (
        cleanupFailed
      ) {
        console.error(
          "Cloudinary video cleanup failed:",
          cloudinaryDelete
        );
      }

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(200).json({
        success:
          true,

        message:
          "Video deleted successfully.",

        deletedVideo: {
          id:
            deletedVideo?._id,

          title:
            deletedVideo?.title,

          duration:
            deletedVideo?.duration,
        },

        cloudinary: {
          deleted:
            cloudinaryDelete
              ? cloudinaryDelete.success
              : false,

          cleanupPending:
            cleanupFailed,
        },

        course: {
          id:
            course._id,

          title:
            course.title,

          totalVideos:
            course.totalVideos,
        },
      });
    } catch (
      error
    ) {
      console.error(
        "Delete Video Error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        code:
          "DELETE_VIDEO_ERROR",

        message:
          "Unable to delete video.",
      });
    }
  };

/* =========================================================
   DELETE MATERIAL

   DELETE
   /api/admin/content/courses/:courseId/materials/:materialId

========================================================= */

export const deleteMaterialFromCourse =
  async (
    req,
    res
  ) => {
    try {
      const {
        courseId,
        materialId,
      } =
        req.params;

      /* ===================================================
         VALIDATE IDs
      =================================================== */

      if (
        !isValidObjectId(
          courseId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_COURSE_ID",

          message:
            "Invalid course ID.",
        });
      }

      if (
        !isValidObjectId(
          materialId
        )
      ) {
        return res.status(400).json({
          success:
            false,

          code:
            "INVALID_MATERIAL_ID",

          message:
            "Invalid material ID.",
        });
      }

      /* ===================================================
         FIND COURSE
      =================================================== */

      const course =
        await Course.findById(
          courseId
        );

      if (
        !course
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "COURSE_NOT_FOUND",

          message:
            "Course not found.",
        });
      }

      /* ===================================================
         MATERIAL ARRAY
      =================================================== */

      if (
        !Array.isArray(
          course.materials
        )
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "NO_MATERIALS_FOUND",

          message:
            "No course materials found.",
        });
      }

      /* ===================================================
         FIND MATERIAL
      =================================================== */

      const materialIndex =
        course.materials.findIndex(
          (
            material
          ) =>
            material?._id?.toString() ===
            materialId
        );

      if (
        materialIndex ===
        -1
      ) {
        return res.status(404).json({
          success:
            false,

          code:
            "MATERIAL_NOT_FOUND",

          message:
            "Study material not found.",
        });
      }

      /* ===================================================
         SAVE PUBLIC ID
      =================================================== */

      const deletedMaterial =
        course.materials[
          materialIndex
        ];

      const filePublicId =
        deletedMaterial
          ?.filePublicId
          ?.toString()
          .trim();

      /* ===================================================
         REMOVE FROM DATABASE
      =================================================== */

      course.materials.splice(
        materialIndex,
        1
      );

      updateTotalNotes(
        course
      );

      await course.save();

      /* ===================================================
         DELETE AUTHENTICATED CLOUDINARY RAW ASSET
      =================================================== */

      let cloudinaryDelete =
        null;

      if (
        filePublicId
      ) {
        cloudinaryDelete =
          await deleteCloudinaryRaw(
            filePublicId,
            {
              type:
                "authenticated",
            }
          );
      }

      const cleanupFailed =
        Boolean(
          cloudinaryDelete &&
            !cloudinaryDelete.success
        );

      if (
        cleanupFailed
      ) {
        console.error(
          "Cloudinary material cleanup failed:",
          cloudinaryDelete
        );
      }

      /* ===================================================
         RESPONSE
      =================================================== */

      return res.status(200).json({
        success:
          true,

        message:
          "Study material deleted successfully.",

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
            cleanupFailed,
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
    } catch (
      error
    ) {
      console.error(
        "Delete Material Error:",
        error
      );

      return res.status(500).json({
        success:
          false,

        code:
          "DELETE_MATERIAL_ERROR",

        message:
          "Unable to delete study material.",
      });
    }
  };