const logger = require("../utils/logger");

function notFoundHandler(req, res) {
  if (req.path.startsWith("/api/")) {
    return res.status(404).json({
      success: false,
      error: {
        code: "RESOURCE_NOT_FOUND",
        message: `Endpoint ${req.method} ${req.path} not found.`,
        requestId: req.id
      }
    });
  }
  // For web requests, let SPA routing handle or return 404
  res.status(404).sendFile(require("path").join(__dirname, "..", "..", "public", "index.html"));
}

function errorHandler(err, req, res, next) {
  const reqId = req.id || "unknown";
  logger.error("Unhandled request error", {
    message: err.message,
    stack: process.env.NODE_ENV === "production" ? undefined : err.stack,
    path: req.originalUrl,
    method: req.method,
    requestId: reqId
  });

  // Handle express.json() bad syntax error
  if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
    return res.status(400).json({
      success: false,
      error: {
        code: "MALFORMED_JSON",
        message: "The request payload contains malformed JSON.",
        requestId: reqId
      }
    });
  }

  const statusCode = err.statusCode || err.status || 500;
  const isProd = process.env.NODE_ENV === "production";

  res.status(statusCode).json({
    success: false,
    error: {
      code: err.code || (statusCode === 500 ? "INTERNAL_SERVER_ERROR" : "REQUEST_FAILED"),
      message: statusCode === 500 && isProd
        ? "An internal server error occurred. Please try again later."
        : err.message || "An unexpected error occurred.",
      requestId: reqId
    }
  });
}

module.exports = {
  notFoundHandler,
  errorHandler
};
