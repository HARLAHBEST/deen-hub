import app from "../server/src/app.js";
import { connectDb } from "../server/src/db/connect.js";

let dbConnectionPromise;

async function ensureDbConnection() {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDb().catch((err) => {
      console.error("Database connection error:", err);
      dbConnectionPromise = undefined;
      throw err;
    });
  }
  await dbConnectionPromise;
}

export default async function handler(req, res) {
  try {
    await ensureDbConnection();
    return new Promise((resolve, reject) => {
      app(req, res, (err) => {
        if (err) reject(err);
        else resolve();
      });
    });
  } catch (error) {
    console.error("Handler error:", error);
    res.status(500).json({ error: error.message || "Internal server error" });
  }
}
