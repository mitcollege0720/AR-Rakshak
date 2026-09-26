const config = require("../config");

const LOG_LEVELS = {
  DEBUG: 10,
  INFO: 20,
  WARN: 30,
  ERROR: 40
};

const currentLevelValue = LOG_LEVELS[config.logLevel.toUpperCase()] || LOG_LEVELS.INFO;

function formatLog(level, message, meta = {}) {
  const timestamp = new Date().toISOString();
  // Safe serialization without leaking circular structures or sensitive tokens
  const safeMeta = { ...meta };
  delete safeMeta.password;
  delete safeMeta.token;
  delete safeMeta.authorization;

  const logObj = {
    timestamp,
    level,
    message,
    ...(Object.keys(safeMeta).length > 0 ? { meta: safeMeta } : {})
  };

  if (process.env.NODE_ENV === "production") {
    return JSON.stringify(logObj);
  }
  const metaStr = Object.keys(safeMeta).length > 0 ? " " + JSON.stringify(safeMeta) : "";
  const reqIdStr = safeMeta.requestId ? ` [${safeMeta.requestId}]` : "";
  return `[${timestamp}] [${level}]${reqIdStr}: ${message}${metaStr}`;
}

const logger = {
  debug(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.DEBUG) {
      console.log(formatLog("DEBUG", message, meta));
    }
  },
  info(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.INFO) {
      console.log(formatLog("INFO", message, meta));
    }
  },
  warn(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.WARN) {
      console.warn(formatLog("WARN", message, meta));
    }
  },
  error(message, meta) {
    if (currentLevelValue <= LOG_LEVELS.ERROR) {
      console.error(formatLog("ERROR", message, meta));
    }
  }
};

module.exports = logger;
