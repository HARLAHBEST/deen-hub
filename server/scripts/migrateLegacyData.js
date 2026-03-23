import fs from "fs";
import path from "path";
import vm from "vm";
import { fileURLToPath } from "url";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { Item } from "../src/models/Item.js";

dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

function extractRawArray(sourceText) {
  const startMarker = "var RAW=";
  const endMarker = "// Build items from RAW";
  const start = sourceText.indexOf(startMarker);
  const end = sourceText.indexOf(endMarker);

  if (start === -1 || end === -1 || end <= start) {
    throw new Error("Could not find RAW block in legacy app.js");
  }

  const rawLiteral = sourceText
    .slice(start + startMarker.length, end)
    .trim()
    .replace(/;\s*$/, "");

  return rawLiteral;
}

function buildItems(rawInvoices) {
  const rows = [];

  for (const inv of rawInvoices) {
    const invCode = inv[0];
    const date = inv[1];
    const items = inv[3] || [];

    for (const it of items) {
      const bid = Number(it[2]);
      const cost = Math.round((bid + 2.5 + bid * 0.18) * 1.11 * 100) / 100;
      rows.push({
        uid: `${invCode}|${it[0]}`,
        lot: String(it[0]),
        inv: invCode,
        date,
        desc: String(it[1]),
        bid,
        cost,
        cat: String(it[4] || "Other"),
        status: "In Stock",
        hot: false,
        customPrice: "",
        photoUrl: ""
      });
    }
  }

  return rows;
}

async function main() {
  const mongoUri = process.env.MONGODB_URI || "mongodb://127.0.0.1:27017/deens-daily-hub";
  const legacyAppPath = path.resolve(__dirname, "../../app.js");

  if (!fs.existsSync(legacyAppPath)) {
    throw new Error(`Legacy app.js not found at ${legacyAppPath}`);
  }

  const source = fs.readFileSync(legacyAppPath, "utf8");
  const rawLiteral = extractRawArray(source);
  const rawInvoices = vm.runInNewContext(`(${rawLiteral})`);

  if (!Array.isArray(rawInvoices)) {
    throw new Error("Parsed RAW is not an array");
  }

  const rows = buildItems(rawInvoices);
  await mongoose.connect(mongoUri);

  const ops = rows.map((row) => ({
    updateOne: {
      filter: { uid: row.uid },
      update: { $set: row },
      upsert: true
    }
  }));

  if (ops.length) {
    await Item.bulkWrite(ops, { ordered: false });
  }

  await mongoose.disconnect();
  console.log(`Migrated ${rows.length} items from legacy app.js`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
