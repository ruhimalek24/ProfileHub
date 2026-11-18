const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

// Uploaded pictures live here. This folder is NOT served as static files;
// pictures are only sent through the protected GET /api/users/me/profile-picture.
const PROFILE_PICTURE_DIR = path.join(__dirname, '..', 'uploads', 'profile-pictures');

const MAX_PROFILE_PICTURE_BYTES = 2 * 1024 * 1024; // 2 MB
const ALLOWED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];
const CONTENT_TYPES = { jpg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };

// Only names we create ourselves: <uuid>.<jpg|png|webp>
const SAFE_FILE_NAME = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\.(jpg|png|webp)$/;

// Looks at the first bytes of the file (the "file header") to find out if it
// is really a JPEG, PNG or WebP, no matter what the filename or browser says.
// Returns 'jpg', 'png', 'webp' or null.
// NOTE: this checks only the header. It does NOT decode or fully validate the
// image, so a file with a valid header but broken content can still pass.
// That is acceptable here because pictures are only ever served as images
// (with nosniff and a strict CSP), and the frontend shows the default avatar
// if an image cannot be displayed.
function detectImageType(buffer) {
  if (!buffer || buffer.length < 12) return null;

  // JPEG: FF D8 FF
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) return 'jpg';

  // PNG: 89 50 4E 47 0D 0A 1A 0A
  const pngSignature = [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a];
  if (pngSignature.every((byte, i) => buffer[i] === byte)) return 'png';

  // WebP: "RIFF" at bytes 0-3 and "WEBP" at bytes 8-11
  if (buffer.toString('ascii', 0, 4) === 'RIFF' && buffer.toString('ascii', 8, 12) === 'WEBP') {
    return 'webp';
  }

  return null;
}

function isSafeFileName(fileName) {
  return typeof fileName === 'string' && SAFE_FILE_NAME.test(fileName);
}

// Full path on disk. basename() is an extra guard against "../" tricks.
function getPicturePath(fileName) {
  return path.join(PROFILE_PICTURE_DIR, path.basename(fileName));
}

function getContentType(fileName) {
  return CONTENT_TYPES[path.extname(fileName).slice(1)];
}

// The random part of the filename. The frontend adds it to the image URL,
// so a new upload gets a new URL and the browser never shows an old cached image.
// null means "no picture": show the default avatar.
function getPictureVersion(fileName) {
  return isSafeFileName(fileName) ? fileName.split('.')[0] : null;
}

// Saves the image with a new random name. Never overwrites an existing file.
async function savePicture(buffer, extension) {
  await fs.promises.mkdir(PROFILE_PICTURE_DIR, { recursive: true });
  const fileName = `${crypto.randomUUID()}.${extension}`;
  await fs.promises.writeFile(getPicturePath(fileName), buffer, { flag: 'wx' });
  return fileName;
}

// Deletes a picture file. A missing file is fine. Other errors are only logged,
// because a leftover file is harmless (nothing points to it and it is never served).
async function deletePicture(fileName) {
  if (!isSafeFileName(fileName)) return;
  try {
    await fs.promises.unlink(getPicturePath(fileName));
  } catch (err) {
    if (err.code !== 'ENOENT') console.error('Could not delete a profile picture file:', err.code);
  }
}

module.exports = {
  MAX_PROFILE_PICTURE_BYTES,
  ALLOWED_MIME_TYPES,
  detectImageType,
  isSafeFileName,
  getPicturePath,
  getContentType,
  getPictureVersion,
  savePicture,
  deletePicture,
};
