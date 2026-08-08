import multer from "multer";
import { imageFileFilter } from "../middlewares/upload-policy.middleware.js";

const upload = multer({
  storage: multer.memoryStorage(),
  fileFilter: imageFileFilter,
  limits: { fileSize: 5 * 1024 * 1024, files: 1 },
});

export default upload;
