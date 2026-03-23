import { Router } from "express";
import { Item } from "../models/Item.js";
import { authRequired } from "../middleware/auth.js";

const router = Router();

function parseLimit(raw, fallback = 50) {
  const n = Number(raw);
  if (!Number.isFinite(n)) return fallback;
  return Math.min(Math.max(n, 1), 200);
}

function toNumber(value, fallback = 0) {
  const n = Number(value);
  return Number.isFinite(n) ? n : fallback;
}

function calculateCostFromBid(bid) {
  return Math.round((bid + 2.5 + bid * 0.18) * 1.11 * 100) / 100;
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

router.post("/", authRequired, async (req, res, next) => {
  try {
    const body = req.body || {};
    const uid = String(body.uid || "").trim();
    const lot = String(body.lot || "").trim();
    const inv = String(body.inv || "").trim();
    const date = String(body.date || "").trim();
    const desc = String(body.desc || "").trim();
    const cat = String(body.cat || "Other").trim();

    if (!uid || !lot || !inv || !date || !desc || !cat) {
      return res.status(400).json({ message: "uid, lot, inv, date, desc, and cat are required" });
    }

    const bid = toNumber(body.bid, 0);
    const cost = body.cost !== undefined ? toNumber(body.cost, 0) : calculateCostFromBid(bid);
    const hot = Boolean(body.hot);
    const customPrice = String(body.customPrice || "").trim();
    const photoUrl = String(body.photoUrl || "").trim();
    const status = String(body.status || "In Stock").trim();

    const existing = await Item.findOne({ uid }).lean();
    if (existing) {
      return res.status(409).json({ message: "Item with this uid already exists" });
    }

    const created = await Item.create({
      uid,
      lot,
      inv,
      date,
      desc,
      bid,
      cost,
      cat,
      status,
      hot,
      customPrice,
      photoUrl
    });

    res.status(201).json(created);
  } catch (err) {
    next(err);
  }
});

router.post("/import/facebook", authRequired, async (req, res, next) => {
  try {
    const rows = Array.isArray(req.body?.items) ? req.body.items : [];
    if (!rows.length) {
      return res.status(400).json({ message: "items array is required" });
    }

    const nowIso = new Date().toISOString().slice(0, 10);

    const mapped = rows
      .map((row, index) => {
        const ref = String(row.id || row.listing_id || row.sku || row.uid || `fb-${Date.now()}-${index}`).trim();
        const title = String(row.title || row.name || row.desc || row.description || "Untitled listing").trim();
        const category = String(row.category || "Other").trim() || "Other";
        const price = toNumber(row.price || row.amount || 0, 0);
        const statusRaw = String(row.status || row.availability || "In Stock").toLowerCase();
        const status = statusRaw.includes("sold") ? "Sold" : "In Stock";

        return {
          uid: `fb|${ref}`,
          lot: String(row.lot || ref).slice(0, 40),
          inv: String(row.inv || "FB-MARKETPLACE").slice(0, 60),
          date: String(row.date || nowIso).slice(0, 30),
          desc: title,
          bid: price,
          cost: price,
          cat: category,
          status,
          hot: Boolean(row.hot),
          customPrice: String(row.customPrice || row.priceLabel || "").trim(),
          photoUrl: String(row.photo || row.photoUrl || row.image || "").trim()
        };
      })
      .filter((it) => it.uid && it.desc);

    if (!mapped.length) {
      return res.status(400).json({ message: "No valid Facebook listings to import" });
    }

    const ops = mapped.map((row) => ({
      updateOne: {
        filter: { uid: row.uid },
        update: { $set: row },
        upsert: true
      }
    }));

    const result = await Item.bulkWrite(ops, { ordered: false });
    res.json({ message: "Facebook listings imported", imported: mapped.length, result });
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
    const allowed = [
      "status",
      "hot",
      "customPrice",
      "photoUrl",
      "cat",
      "desc",
      "lot",
      "inv",
      "date",
      "bid",
      "cost"
    ];
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

router.delete("/:uid", authRequired, async (req, res, next) => {
  try {
    const uid = req.params.uid;
    const deleted = await Item.findOneAndDelete({ uid }).lean();
    if (!deleted) {
      return res.status(404).json({ message: "Item not found" });
    }

    res.json({ message: "Item deleted", uid });
  } catch (err) {
    next(err);
  }
});

export default router;
