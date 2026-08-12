import multer from "multer";

/* =========================================================
   MEMORY STORAGE
========================================================= */

/*
  यह middleware केवल छोटे files के लिए है।

  IMPORTANT:
  Large videos को इस middleware से upload नहीं करेंगे।
  Large videos direct Cloudinary पर जाएँगी ताकि Node server
  unnecessary file upload/storage load न ले।
*/

const storage = multer.memoryStorage();

/* =========================================================
   FILE FILTER
========================================================= */

const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(
      new Error(
        "Only JPG, JPEG, PNG and WEBP images are allowed."
      ),
      false
    );
  }
};

/* =========================================================
   MULTER CONFIGURATION
========================================================= */

const upload = multer({
  storage,

  limits: {
    /*
      Thumbnail के लिए maximum 5 MB
    */
    fileSize: 5 * 1024 * 1024,
  },

  fileFilter,
});

/* =========================================================
   SINGLE THUMBNAIL UPLOAD
========================================================= */

export const uploadThumbnail = upload.single(
  "thumbnail"
);

/* =========================================================
   MULTIPLE IMAGE UPLOAD
========================================================= */

export const uploadImages = upload.array(
  "images",
  10
);

/* =========================================================
   ERROR HANDLER
========================================================= */

export const handleUploadError = (
  error,
  req,
  res,
  next
) => {
  if (!error) {
    return next();
  }

  if (error instanceof multer.MulterError) {

    if (error.code === "LIMIT_FILE_SIZE") {
      return res.status(400).json({
        success: false,
        message:
          "Image size must be less than 5 MB.",
      });
    }

    return res.status(400).json({
      success: false,
      message: error.message,
    });
  }

  return res.status(400).json({
    success: false,
    message:
      error.message ||
      "File upload failed.",
  });
};