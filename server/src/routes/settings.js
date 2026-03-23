import { Router } from "express";
import { Setting } from "../models/Setting.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

const DEFAULT_SETTINGS = {
  wa: "14385403074",
  fb: "https://m.me/your-fb-page",
  email: "zydtech1@gmail.com"
};

async function getOrCreateSettings() {
  let doc = await Setting.findOne({ key: "site_settings" });
  if (!doc) {
    doc = await Setting.create({ key: "site_settings", value: DEFAULT_SETTINGS });
  }
  return doc;
}

router.get("/", async (req, res, next) => {
  try {
    const doc = await getOrCreateSettings();
    res.json(doc.value);
  } catch (err) {
    next(err);
  }
});

router.patch("/", authRequired, async (req, res, next) => {
  try {
    const payload = req.body || {};
    const doc = await getOrCreateSettings();
    doc.value = { ...doc.value, ...payload };
    await doc.save();
    res.json(doc.value);
  } catch (err) {
    next(err);
  }
});

export default router;
