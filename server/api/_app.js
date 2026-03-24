import app from "../src/app.js";
import { connectDb } from "../src/db/connect.js";

let dbConnectionPromise;

async function ensureDbConnection() {
  if (!dbConnectionPromise) {
    dbConnectionPromise = connectDb().catch((err) => {
      dbConnectionPromise = undefined;
      throw err;
    });
  }

  await dbConnectionPromise;
}

export default async function handler(req, res) {
  await ensureDbConnection();
  return app(req, res);
}
