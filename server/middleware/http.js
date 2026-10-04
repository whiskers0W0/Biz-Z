import { z } from "zod";
export function requestLogger(req, res, next) {
  const start = Date.now();
  res.on("finish", () => {
    if (process.env.NODE_ENV !== "test")
      console.log(
        `${req.method} ${req.path} ${res.statusCode} ${Date.now() - start}ms`,
      );
  });
  next();
}
export function networkAccess(req, res, next) {
  const origin = req.headers.origin;
  const allowed = (
    process.env.CLIENT_ORIGINS ||
    "http://127.0.0.1:5173,http://127.0.0.1:5174,http://localhost:5173"
  )
    .split(",")
    .map((s) => s.trim());
  let same = false;
  try {
    same =
      !!origin &&
      new URL(origin).origin === `${req.protocol}://${req.headers.host}`;
  } catch {
    /* Reject invalid origins. */
  }
  if (origin && !same && !allowed.includes(origin))
    return res.status(403).json({ error: "Request origin is not allowed." });
  if (origin) {
    res.set("Access-Control-Allow-Origin", origin);
    res.set("Vary", "Origin");
    res.set("Access-Control-Allow-Credentials", "true");
  }
  if (req.method === "OPTIONS") {
    res.set("Access-Control-Allow-Methods", "GET,POST,PUT,DELETE,OPTIONS");
    res.set("Access-Control-Allow-Headers", "Content-Type");
    return res.sendStatus(204);
  }
  next();
}
export function errorHandler(err, _req, res, _next) {
  if (err instanceof z.ZodError)
    return res.status(400).json({
      error: err.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    });
  if (
    ["ValidationError", "CastError"].includes(err.name) ||
    err.type === "entity.parse.failed"
  )
    return res
      .status(400)
      .json({ error: "Please check the submitted fields and try again." });
  if (err.code === 11000)
    return res.status(409).json({ error: "That record already exists." });
  res.status(err.status || 500).json({
    error: err.status ? err.message : "Something went wrong. Please try again.",
  });
}
