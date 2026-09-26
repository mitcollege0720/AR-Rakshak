const express = require("express");
const router = express.Router();

const controllers = require("../controllers");
const validators = require("../validators");
const { createRateLimiter } = require("../middleware/rateLimiter");
const config = require("../config");

// Rate limiters for write actions
const incidentLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.incidentMax,
  message: "Incident submission rate limit exceeded. Please wait a moment."
});

const progressLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: config.rateLimit.progressMax,
  message: "Progress update rate limit exceeded. Please wait a moment."
});

const workerCreateLimiter = createRateLimiter({
  windowMs: config.rateLimit.windowMs,
  max: 20,
  message: "Worker creation rate limit exceeded."
});

// Health check
router.get("/health", controllers.healthController);

// Safety modules
router.get("/modules", controllers.getModules);
router.get("/modules/:id", controllers.getModuleById);

// Workers
router.get("/workers", controllers.getWorkers);
router.get("/workers/:id", controllers.getWorkerById);
router.post("/workers", workerCreateLimiter, validators.validateWorkerCreate, controllers.createWorker);

// Progress
router.post("/progress", progressLimiter, validators.validateProgress, controllers.recordProgress);

// Incidents
router.get("/incidents", controllers.getIncidents);
router.post("/incidents", incidentLimiter, validators.validateIncident, controllers.createIncident);
router.patch("/incidents/:id/status", controllers.updateIncidentStatus);

// Supervisor Dashboard
router.get("/dashboard", controllers.getDashboard);

// Certificate
router.get("/certificate/:workerId/:moduleId", controllers.getCertificate);

module.exports = router;
