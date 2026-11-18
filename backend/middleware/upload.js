const multer = require('multer');
const { MAX_PROFILE_PICTURE_BYTES, ALLOWED_MIME_TYPES } = require('../utils/profilePicture');

const UNSUPPORTED_TYPE_MESSAGE = 'Please choose a JPG, PNG or WebP image.';

// Keep the upload in memory (max 2 MB). Nothing is written to disk until the
// controller has checked the real file content.
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: MAX_PROFILE_PICTURE_BYTES, files: 1 },
  fileFilter(req, file, cb) {
    // First quick check on the type the browser claims. It is not trusted:
    // the controller checks the real file header afterwards.
    if (ALLOWED_MIME_TYPES.includes(file.mimetype)) return cb(null, true);

    // Reject with an error (not cb(null, false)), so the user gets a clear 415
    // instead of a confusing "Please choose an image".
    const err = new Error(UNSUPPORTED_TYPE_MESSAGE);
    err.code = 'UNSUPPORTED_FILE_TYPE';
    return cb(err);
  },
});

function sendUploadError(res, status, message) {
  return res.status(status).json({
    success: false,
    message,
    errors: [{ field: 'profilePicture', message }],
  });
}

// Reads one file from the "profilePicture" form field and turns upload
// problems into friendly messages.
function handleProfilePictureUpload(req, res, next) {
  upload.single('profilePicture')(req, res, (err) => {
    if (!err) return next();

    if (err.code === 'UNSUPPORTED_FILE_TYPE') {
      return sendUploadError(res, 415, UNSUPPORTED_TYPE_MESSAGE);
    }
    if (err.code === 'LIMIT_FILE_SIZE') {
      return sendUploadError(res, 413, 'Image must be 2 MB or smaller.');
    }
    // Wrong field name, more than one file, etc.
    if (err instanceof multer.MulterError) {
      return sendUploadError(res, 400, 'Please choose an image to upload.');
    }
    return next(err);
  });
}

module.exports = handleProfilePictureUpload;
