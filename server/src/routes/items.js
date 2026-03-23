import { Router } from "express";
import { Item } from "../models/Item.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

function parseLimit(raw, fallback = 50) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 1), 200);
}

router.get("/", async (req, res, next) => {
  try {
    const search = String(req.query.search || "").trim();
    const category = String(req.query.category || "").trim();
    const hotRaw = String(req.query.hot || "").trim().toLowerCase();
    const status = String(req.query.status || "In Stock").trim();
    const limit = parseLimit(req.query.limit, 60);

    const query = {};
    if (status) query.status = status;
    if (category) query.cat = category;
    if (hotRaw === "true") query.hot = true;
    if (hotRaw === "false") query.hot = false;
    if (search) query.$text = { $search: search };

    const items = await Item.find(query)
      .sort({ updatedAt: -1 })
      .limit(limit)
      .lean();

    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.get("/all", authRequired, async (req, res, next) => {
  try {
    const limit = parseLimit(req.query.limit, 120);
    const items = await Item.find({}).sort({ updatedAt: -1 }).limit(limit).lean();
    res.json(items);
  } catch (err) {
    next(err);
  }
});

router.post("/bulk-upsert", authRequired, async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rows.length) {
      return res.status(400).json({ message: "items array is required" });
    }

    const ops = rows
      .filter((row) => row && row.uid)
      .map((row) => ({
        updateOne: {
          filter: { uid: row.uid },
          update: { $set: row },
          upsert: true
        }
      }));

    if (!ops.length) {
      return res.status(400).json({ message: "No valid items to upsert" });
    }

    const result = await Item.bulkWrite(ops, { ordered: false });
    res.json({ message: "Bulk upsert complete", result });
  } catch (err) {
    next(err);
  }
});

router.patch("/:uid", authRequired, async (req, res, next) => {
  try {
    const uid = req.params.uid;
    const allowed = ["status", "hot", "customPrice", "photoUrl", "cat", "desc"];
    const updates = {};

    for (const key of allowed) {
      if (Object.prototype.hasOwnProperty.call(req.body, key)) {
        updates[key] = req.body[key];
      }
    }

    const updated = await Item.findOneAndUpdate({ uid }, { $set: updates }, { new: true }).lean();
    if (!updated) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json(updated);
  } catch (err) {
    next(err);
  }
});

export default router;
