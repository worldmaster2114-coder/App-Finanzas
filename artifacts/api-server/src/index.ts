import app from "./app";
import { initDatabase } from "@workspace/db";

const port = Number(process.env["PORT"] || "5000");

// Initialize PostgreSQL schema/tables if connected
initDatabase()
  .then(() => {
    console.log("[SERVER] Database tables checked/initialized.");
  })
  .catch((err) => {
    console.error("[SERVER] Database init warning:", err);
  });

app.listen(port, "0.0.0.0", () => {
  console.log(`[SERVER] 50-30-20 Finanzas running on http://0.0.0.0:${port}`);
});
