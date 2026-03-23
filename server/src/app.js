import express from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import env from "./config/env.js";
import healthRoutes from "./routes/health.js";
import authRoutes from "./routes/auth.js";
import itemRoutes from "./routes/items.js";
import settingRoutes from "./routes/settings.js";
import uploadRoutes from "./routes/upload.js";
import { errorHandler, notFound } from "./middleware/errors.js";

const app = express();

app.use(helmet());
app.use(
  cors({
    origin: env.clientOrigin,
    credentials: true
  })
);
app.use(express.json({ limit: "2mb" }));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 600 }));

app.use("/api/health", healthRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/items", itemRoutes);
app.use("/api/settings", settingRoutes);
app.use("/api/upload", uploadRoutes);

app.use(notFound);
app.use(errorHandler);

export default app;
