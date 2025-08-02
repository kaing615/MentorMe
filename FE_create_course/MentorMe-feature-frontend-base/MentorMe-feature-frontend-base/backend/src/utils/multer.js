import multer from "multer";

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { 
    fileSize: 50 * 1024 * 1024, // 50MB limit
    files: 11 // Max 11 files (1 image + 10 course files)
  },
  fileFilter: (req, file, cb) => {
    // Allow images for course image
    if (file.fieldname === 'image') {
      if (file.mimetype.startsWith("image/")) {
        cb(null, true);
      } else {
        cb(new Error("Course image must be an image file!"), false);
      }
    }
    // Allow various file types for course files
    else if (file.fieldname === 'files') {
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/jpg',
        'application/pdf',
        'video/mp4', 'video/avi', 'video/mov', 'video/quicktime'
      ];
      
      if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
      } else {
        cb(new Error("File type not allowed! Allowed: JPG, PNG, PDF, MP4, AVI, MOV"), false);
      }
    } else {
      cb(new Error("Unexpected field"), false);
    }
  }
});

export { upload };
export default upload;
