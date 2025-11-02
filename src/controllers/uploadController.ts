import { Response } from "express";
import { asyncHandler } from "../utils/asyncHandler";
import { AuthRequest } from "../middleware/auth";
import path from "path";
import { UPLOAD_PATH } from "../config/constants";

export const uploadController = {
  // Upload avatar/image and return URL
  uploadFile: asyncHandler(async (req: AuthRequest, res: Response) => {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: "Fayl yuklanmadi. Iltimos, rasm faylini tanlang.",
      });
    }

    // Return file URL (relative path that frontend can access)
    const fileUrl = `/uploads/${req.file.filename}`;
    
    res.status(200).json({
      success: true,
      data: {
        url: fileUrl,
        filename: req.file.filename,
        originalName: req.file.originalname,
        size: req.file.size,
        mimetype: req.file.mimetype,
      },
    });
  }),

  // Delete uploaded file
  deleteFile: asyncHandler(async (req: AuthRequest, res: Response) => {
    const { filename } = req.params;
    
    if (!filename) {
      return res.status(400).json({
        success: false,
        error: "Fayl nomi ko'rsatilmagan",
      });
    }

    const fs = require("fs");
    const filePath = path.join(UPLOAD_PATH, filename);
    
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        res.status(200).json({
          success: true,
          message: "Fayl muvaffaqiyatli o'chirildi",
        });
      } else {
        res.status(404).json({
          success: false,
          error: "Fayl topilmadi",
        });
      }
    } catch (error) {
      res.status(500).json({
        success: false,
        error: "Fayl o'chirishda xatolik yuz berdi",
      });
    }
  }),
};

