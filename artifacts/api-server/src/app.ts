import express, { type Express } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return {
          id: req.id,
          method: req.method,
          url: req.url?.split("?")[0],
        };
      },
      res(res) {
        return {
          statusCode: res.statusCode,
        };
      },
    },
  }),
);
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


