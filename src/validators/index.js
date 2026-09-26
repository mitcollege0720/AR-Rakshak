const { sanitizeString } = require("../utils/sanitize");

const VALID_INCIDENT_TYPES = [
  "Hazard",
  "Injury",
  "Near Miss",
  "Equipment Failure",
  "Gas Alarm",
  "Fall",
  "Unsafe Labour Concern",
  "Other"
];

const VALID_SEVERITIES = ["High", "Medium", "Low"];
const VALID_LANGUAGES = ["English", "Hindi"];

function validateWorkerCreate(req, res, next) {
  const { name, language, role } = req.body || {};
  const errors = [];

  const cleanName = sanitizeString(name, 100);
  if (!cleanName || cleanName.length < 2) {
    errors.push("Worker name is required and must be between 2 and 100 characters.");
  }

  if (language && !VALID_LANGUAGES.includes(language)) {
    errors.push(`Language must be one of: ${VALID_LANGUAGES.join(", ")}`);
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid worker creation parameters",
        details: errors
      }
    });
  }

  req.validatedBody = {
    name: cleanName,
    language: language || "English",
    role: sanitizeString(role, 50) || "Worker"
  };
  next();
}

function validateProgress(req, res, next) {
  const { workerId, moduleId, score } = req.body || {};
  const errors = [];

  const cleanWorkerId = sanitizeString(workerId, 32);
  if (!cleanWorkerId) {
    errors.push("workerId is required.");
  }

  const cleanModuleId = sanitizeString(moduleId, 32);
  if (!cleanModuleId) {
    errors.push("moduleId is required.");
  }

  const numScore = Number(score);
  if (score === undefined || isNaN(numScore) || numScore < 0 || numScore > 100) {
    errors.push("Score must be a number between 0 and 100.");
  }

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid progress submission",
        details: errors
      }
    });
  }

  req.validatedBody = {
    workerId: cleanWorkerId,
    moduleId: cleanModuleId,
    score: Math.round(numScore)
  };
  next();
}

function validateIncident(req, res, next) {
  const { worker, type, location, description, severity, idempotencyKey } = req.body || {};
  const errors = [];

  const cleanWorker = sanitizeString(worker, 100);
  if (!cleanWorker) {
    errors.push("Worker name/identifier is required.");
  }

  if (!type || !VALID_INCIDENT_TYPES.includes(type)) {
    errors.push(`Incident type must be one of: ${VALID_INCIDENT_TYPES.join(", ")}`);
  }

  const cleanLocation = sanitizeString(location, 100);
  if (!cleanLocation) {
    errors.push("Location / safety zone is required.");
  }

  if (severity && !VALID_SEVERITIES.includes(severity)) {
    errors.push(`Severity must be one of: ${VALID_SEVERITIES.join(", ")}`);
  }

  const cleanDescription = sanitizeString(description, 1000);

  if (errors.length > 0) {
    return res.status(400).json({
      success: false,
      error: {
        code: "VALIDATION_ERROR",
        message: "Invalid incident report parameters",
        details: errors
      }
    });
  }

  req.validatedBody = {
    worker: cleanWorker,
    type,
    location: cleanLocation,
    description: cleanDescription,
    severity: severity || "Medium",
    idempotencyKey: idempotencyKey ? sanitizeString(idempotencyKey, 64) : null
  };
  next();
}

module.exports = {
  validateWorkerCreate,
  validateProgress,
  validateIncident,
  VALID_INCIDENT_TYPES,
  VALID_SEVERITIES,
  VALID_LANGUAGES
};
