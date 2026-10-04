import "dotenv/config";
import express from "express";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import path from "node:path";
import { router } from "./routes/api.js";
import {
  requestLogger,
  networkAccess,
  errorHandler,
} from "./middleware/http.js";
export const app = express();
app.disable("x-powered-by");
app.use(
  requestLogger,
  networkAccess,
  express.json({ limit: "1mb" }),
  cookieParser(),
);
app.get("/api/health", (_req, res) =>
  res.json({
    database: mongoose.connection.readyState === 1,
    ai: Boolean(process.env.GEMINI_API_KEY),
    auth: Boolean(process.env.JWT_SECRET?.length >= 32),
  }),
);
app.use("/api", router);
app.use("/api", (_req, res) =>
  res.status(404).json({ error: "Endpoint not found." }),
);
if (process.env.NODE_ENV === "production") {
  app.use(express.static(path.resolve("dist")));
  app.get("/{*path}", (_req, res) =>
    res.sendFile(path.resolve("dist/index.html")),
  );
}
app.use(errorHandler);
