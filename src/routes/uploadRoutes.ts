import { Router } from "express";
import { uploadController } from "../controllers/uploadController";
import { authenticate } from "../middleware/auth";
import { uploadAvatar, uploadImage } from "../middleware/upload";

const router = Router();

// Upload avatar/image (single file)
router.post("/avatar", authenticate, uploadAvatar, uploadController.uploadFile);
router.post("/image", authenticate, uploadImage, uploadController.uploadFile);

// Delete file
router.delete("/:filename", authenticate, uploadController.deleteFile);

export default router;

