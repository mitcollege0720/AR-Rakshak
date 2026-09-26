const logger = require("../utils/logger");

function createRateLimiter({ windowMs = 60 * 1000, max = 60, message = "Too many requests. Please try again later." }) {
  const requests = new Map();

  // Periodic cleanup every minute to prevent memory leak
  const interval = setInterval(() => {
    const now = Date.now();
    for (const [key, record] of requests.entries()) {
      if (now - record.startTime > windowMs) {
        requests.delete(key);
      }
    }
  }, Math.max(windowMs, 30000));

  // Ensure interval does not prevent node from exiting cleanly
  if (interval.unref) interval.unref();

  return function rateLimiterMiddleware(req, res, next) {
    const ip = req.ip || req.socket.remoteAddress || "client";
    const key = `${ip}:${req.baseUrl || req.path}`;
    const now = Date.now();

    let record = requests.get(key);

    if (!record || now - record.startTime > windowMs) {
      record = { count: 1, startTime: now };
      requests.set(key, record);
    } else {
      record.count += 1;
    }

    const remaining = Math.max(0, max - record.count);
    const resetTimeSeconds = Math.ceil((record.startTime + windowMs - now) / 1000);

    res.setHeader("X-RateLimit-Limit", max);
    res.setHeader("X-RateLimit-Remaining", remaining);
    res.setHeader("X-RateLimit-Reset", resetTimeSeconds);

    if (record.count > max) {
      logger.warn("Rate limit exceeded", { ip, key, count: record.count, max });
      res.setHeader("Retry-After", resetTimeSeconds);
      return res.status(429).json({
        success: false,
        error: {
          code: "RATE_LIMIT_EXCEEDED",
          message,
          retryAfterSeconds: resetTimeSeconds
        }
      });
    }

    next();
  };
}

module.exports = {
  createRateLimiter
};
