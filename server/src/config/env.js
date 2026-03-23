import dotenv from "dotenv";

dotenv.config();

const env = {
  nodeEnv: process.env.NODE_ENV || "development",
  port: Number(process.env.PORT || 5000),
  mongoUri: process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/deens-daily-hub",
  jwtSecret: process.env.JWT_SECRET || "change_this_super_secret_key",
  clientOrigin: process.env.CLIENT_ORIGIN || "http://localhost:5173",
  adminEmail: process.env.ADMIN_EMAIL || "admin@deenshub.local",
  adminPassword: process.env.ADMIN_PASSWORD || "deens2026",
  cloudinaryName: process.env.CLOUDINARY_CLOUD_NAME || "",
  cloudinaryApiKey: process.env.CLOUDINARY_API_KEY || "",
  cloudinaryApiSecret: process.env.CLOUDINARY_API_SECRET || ""
};

export default env;
