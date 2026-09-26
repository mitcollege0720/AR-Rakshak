const app = require("./src/app");
const config = require("./src/config");
const logger = require("./src/utils/logger");

const server = app.listen(config.port, config.host, () => {
  logger.info(`AR-RAKSHAK safety server listening on http://${config.host}:${config.port}`, {
    env: config.env,
    port: config.port
  });
});

// Graceful shutdown handling
function gracefulShutdown(signal) {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);
  server.close(() => {
    logger.info("AR-RAKSHAK HTTP server closed gracefully.");
    process.exit(0);
  });

  // Force close if server hanging
  setTimeout(() => {
    logger.error("Could not close connections in time, forcefully shutting down");
    process.exit(1);
  }, 10000);
}

process.on("SIGTERM", () => gracefulShutdown("SIGTERM"));
process.on("SIGINT", () => gracefulShutdown("SIGINT"));

// Catch uncaught exceptions and unhandled promise rejections
process.on("uncaughtException", (err) => {
  logger.error("Uncaught Exception detected", { message: err.message, stack: err.stack });
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection detected", { reason: String(reason) });
});

module.exports = server;
