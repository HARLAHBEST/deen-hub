import { Router } from "express";

const router = Router();

router.get("/", (req, res) => {
  res.json({ ok: true, service: "deens-hub-api", timestamp: new Date().toISOString() });
});

export default router;
