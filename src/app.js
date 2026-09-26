const express = require("express");
const path = require("path");

const { securityHeaders } = require("./middleware/security");
const { requestId } = require("./middleware/requestId");
const { requestLogger } = require("./middleware/requestLogger");
const { errorHandler, notFoundHandler } = require("./middleware/errorHandler");
const apiRouter = require("./routes/api");

const app = express();

// Disable X-Powered-By
app.disable("x-powered-by");

// Trust first proxy if behind reverse proxy (e.g., NGINX, Cloudflare, Heroku)
app.set("trust proxy", 1);

// Global middleware
app.use(requestId);
app.use(securityHeaders);
app.use(requestLogger);

// Body parsing with safe size limit (prevents payload-based DoS)
app.use(express.json({ limit: "1mb" }));
app.use(express.urlencoded({ extended: false, limit: "1mb" }));

// Static assets
const publicDir = path.join(__dirname, "..", "public");
app.use(express.static(publicDir, {
  maxAge: process.env.NODE_ENV === "production" ? "1d" : 0,
  etag: true
}));

// API Routes
app.use("/api", apiRouter);

// SPA fallback for HTML5 navigation
app.get("*", (req, res, next) => {
  if (req.path.startsWith("/api/")) {
    return next();
  }
  res.sendFile(path.join(publicDir, "index.html"), (err) => {
    if (err) next(err);
  });
});

// Centralized 404 and Error handling
app.use(notFoundHandler);
app.use(errorHandler);

module.exports = app;
