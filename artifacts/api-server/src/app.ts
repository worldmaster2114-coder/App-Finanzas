import express, { type Express } from "express";
import cors from "cors";
import router from "./routes";

const app: Express = express();

// Simple request logger (no pino workers that can crash in Docker)
app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url?.split("?")[0]}`);
  next();
});

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


import path from "path";

app.use("/api", router);

// Serve static frontend assets
// In Docker: FRONTEND_DIST=/app/artifacts/finanzas-hogar/dist/public (absolute)
// In local dev: relative fallback
const staticPath = process.env["FRONTEND_DIST"] ||
  path.resolve(__dirname, "../../../artifacts/finanzas-hogar/dist/public");

app.use(express.static(staticPath));

// SPA Fallback for client-side routing
app.get("*", (_req, res, next) => {
  res.sendFile(path.join(staticPath, "index.html"), (err) => {
    if (err) next();
  });
});

export default app;


