const ALLOWED_IMAGE_TYPES = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
]);

export function validateUploadMime(file) {
  return ALLOWED_IMAGE_TYPES.has(file?.mimetype);
}

export function imageFileFilter(_request, file, callback) {
  if (validateUploadMime(file)) return callback(null, true);
  const error = new Error("Unsupported image type");
  error.status = 415;
  return callback(error);
}

export default { validateUploadMime, imageFileFilter };
