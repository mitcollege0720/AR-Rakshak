const path = require("path");

const config = {
  env: process.env.NODE_ENV || "development",
  port: parseInt(process.env.PORT, 10) || 3000,
  host: process.env.HOST || "0.0.0.0",
  dataDir: process.env.DATA_DIR || path.join(__dirname, "..", "..", "data"),
  dataFile: process.env.DATA_FILE || path.join(__dirname, "..", "..", "data", "db.json"),
  corsOrigin: process.env.CORS_ORIGIN || "*",
  rateLimit: {
    windowMs: 60 * 1000, // 1 minute
    maxRequests: parseInt(process.env.RATE_LIMIT_MAX, 10) || 120, // 120 requests per minute general
    incidentMax: parseInt(process.env.RATE_LIMIT_INCIDENT_MAX, 10) || 30, // 30 incidents per minute
    progressMax: parseInt(process.env.RATE_LIMIT_PROGRESS_MAX, 10) || 60 // 60 progress submissions per minute
  },
  logLevel: process.env.LOG_LEVEL || (process.env.NODE_ENV === "production" ? "INFO" : "DEBUG")
};

module.exports = config;
