import env from "./config/env.js";
import app from "./app.js";
import { connectDb } from "./db/connect.js";

async function start() {
  try {
    console.log("Connecting to MongoDB...");
    await connectDb();
    console.log("✓ MongoDB connected");
    
    app.listen(env.port, () => {
      console.log(`✓ API running on http://localhost:${env.port}`);
      console.log(`✓ Environment: ${env.nodeEnv}`);
    });
  } catch (err) {
    console.error("✗ Failed to start server:", err.message);
    process.exit(1);
  }
}

start();
