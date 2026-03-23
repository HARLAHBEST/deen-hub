import { Router } from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import env from "../config/env.js";
import { User } from "../models/User.js";

const router = Router();

router.post("/seed-default-admin", async (req, res, next) => {
  try {
    const existing = await User.findOne({ email: env.adminEmail.toLowerCase() });
    if (existing) {
      return res.json({ message: "Default admin already exists" });
    }

    const passwordHash = await bcrypt.hash(env.adminPassword, 12);
    await User.create({ email: env.adminEmail.toLowerCase(), passwordHash, role: "admin" });
    res.status(201).json({ message: "Default admin seeded" });
  } catch (err) {
    next(err);
  }
});

router.post("/login", async (req, res, next) => {
  try {
    const email = String(req.body?.email || "").trim().toLowerCase();
    const password = String(req.body?.password || "");

    if (!email || !password) {
      return res.status(400).json({ message: "Email and password are required" });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    const token = jwt.sign({ userId: user._id.toString(), role: user.role, email: user.email }, env.jwtSecret, {
      expiresIn: "7d"
    });

    res.json({ token, user: { email: user.email, role: user.role } });
  } catch (err) {
    next(err);
  }
});

export default router;
