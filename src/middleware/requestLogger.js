const logger = require("../utils/logger");

function requestLogger(req, res, next) {
  const start = Date.now();
  const path = req.originalUrl || req.url;

  res.on("finish", () => {
    const duration = Date.now() - start;
    const statusCode = res.statusCode;
    const ip = req.ip || req.socket.remoteAddress || "unknown";

    const meta = {
      method: req.method,
      path,
      statusCode,
      durationMs: duration,
      ip,
      requestId: req.id
    };

    if (statusCode >= 500) {
      logger.error(`HTTP ${req.method} ${path} ${statusCode} - ${duration}ms`, meta);
    } else if (statusCode >= 400) {
      logger.warn(`HTTP ${req.method} ${path} ${statusCode} - ${duration}ms`, meta);
    } else {
      // In production, avoid noisy static asset logs, log API requests
      if (path.startsWith("/api") || process.env.NODE_ENV !== "production") {
        logger.info(`HTTP ${req.method} ${path} ${statusCode} - ${duration}ms`, meta);
      }
    }
  });

  next();
}

module.exports = {
  requestLogger
};
