import env from "./config/env.js";
import app from "./app.js";
import { connectDb } from "./db/connect.js";

async function start() {
  try {
    await connectDb();
    app.listen(env.port, () => {
      console.log(`API running on http://localhost:${env.port}`);
    });
  } catch (err) {
    console.error("Failed to start server", err);
    process.exit(1);
  }
}

start();
