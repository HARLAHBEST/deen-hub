import { Router } from "express";
import multer from "multer";
import { v2 as cloudinary } from "cloudinary";
import env from "../config/env.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();
const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 5 * 1024 * 1024 } });

if (env.cloudinaryName && env.cloudinaryApiKey && env.cloudinaryApiSecret) {
  cloudinary.config({
    cloud_name: env.cloudinaryName,
    api_key: env.cloudinaryApiKey,
    api_secret: env.cloudinaryApiSecret
  });
}

router.post("/image", authRequired, upload.single("image"), async (req, res, next) => {
  try {
    if (!req.file) {
      return res.status(400).json({ message: "Missing image file" });
    }

    if (!env.cloudinaryName || !env.cloudinaryApiKey || !env.cloudinaryApiSecret) {
      return res.status(501).json({ message: "Cloudinary is not configured" });
    }

    const dataUri = `data:${req.file.mimetype};base64,${req.file.buffer.toString("base64")}`;
    const result = await cloudinary.uploader.upload(dataUri, { folder: "deens-hub" });
    res.json({ url: result.secure_url });
  } catch (err) {
    next(err);
  }
});

export default router;
