import multer from "multer";
import path from "path";
import fs from "fs";
import { UPLOAD_PATH, UPLOAD_MAX_SIZE } from "../config/constants";

// Ensure uploads directory exists
const uploadDir = path.resolve(UPLOAD_PATH);
if (!fs.existsSync(uploadDir)) {
  fs.mkdirSync(uploadDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Generate unique filename: timestamp-random-originalname
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    const ext = path.extname(file.originalname);
    const basename = path.basename(file.originalname, ext);
    cb(null, `${basename}-${uniqueSuffix}${ext}`);
  },
});

// File filter - only images
const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    cb(null, true);
  } else {
    cb(new Error("Faqat rasm fayllari (jpeg, jpg, png, gif, webp) yuklash mumkin"));
  }
};

// Multer instance
export const upload = multer({
  storage,
  limits: {
    fileSize: UPLOAD_MAX_SIZE, // 10MB default
  },
  fileFilter,
});

// Middleware for single avatar upload
export const uploadAvatar = upload.single("avatar");

// Middleware for single image upload
export const uploadImage = upload.single("image");

// Middleware for multiple images (for portfolio)
export const uploadImages = upload.array("images", 10); // Max 10 images

