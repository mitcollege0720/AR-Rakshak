const { dbService } = require("../services/dbService");
const logger = require("../utils/logger");

const healthController = (req, res) => {
  res.json({
    success: true,
    data: {
      service: "AR Rakshak",
      status: "healthy",
      version: "1.0.0",
      timestamp: new Date().toISOString(),
      uptimeSeconds: Math.floor(process.uptime())
    }
  });
};

const getModules = (req, res) => {
  const modules = dbService.getModules();
  res.json({
    success: true,
    data: modules
  });
};

const getModuleById = (req, res) => {
  const mod = dbService.getModuleById(req.params.id);
  if (!mod) {
    return res.status(404).json({
      success: false,
      error: {
        code: "MODULE_NOT_FOUND",
        message: `Safety module ${req.params.id} does not exist.`
      }
    });
  }
  res.json({
    success: true,
    data: mod
  });
};

const getWorkers = (req, res) => {
  const workers = dbService.getWorkers();
  res.json({
    success: true,
    data: workers
  });
};

const getWorkerById = (req, res) => {
  const worker = dbService.getWorkerById(req.params.id);
  if (!worker) {
    return res.status(404).json({
      success: false,
      error: {
        code: "WORKER_NOT_FOUND",
        message: `Worker with ID ${req.params.id} not found.`
      }
    });
  }
  res.json({
    success: true,
    data: worker
  });
};

const createWorker = async (req, res, next) => {
  try {
    const worker = await dbService.createWorker(req.validatedBody);
    res.status(201).json({
      success: true,
      data: worker
    });
  } catch (err) {
    next(err);
  }
};

const recordProgress = async (req, res, next) => {
  try {
    const { workerId, moduleId, score } = req.validatedBody;

    // Verify module exists
    const mod = dbService.getModuleById(moduleId);
    if (!mod) {
      return res.status(404).json({
        success: false,
        error: {
          code: "MODULE_NOT_FOUND",
          message: `Module with ID '${moduleId}' does not exist.`
        }
      });
    }

    const worker = await dbService.recordProgress(workerId, moduleId, score);
    res.json({
      success: true,
      data: {
        worker,
        moduleId,
        recordedScore: score,
        passed: score >= 70
      }
    });
  } catch (err) {
    next(err);
  }
};

const getIncidents = (req, res) => {
  const incidents = dbService.getIncidents();
  res.json({
    success: true,
    data: incidents
  });
};

const createIncident = async (req, res, next) => {
  try {
    const incident = await dbService.createIncident(req.validatedBody);
    res.status(201).json({
      success: true,
      data: incident
    });
  } catch (err) {
    next(err);
  }
};

const updateIncidentStatus = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    const updated = await dbService.updateIncidentStatus(id, status);
    if (!updated) {
      return res.status(404).json({
        success: false,
        error: {
          code: "INCIDENT_NOT_FOUND",
          message: `Incident ${id} not found.`
        }
      });
    }
    res.json({
      success: true,
      data: updated
    });
  } catch (err) {
    next(err);
  }
};

const getDashboard = (req, res) => {
  const stats = dbService.getDashboardStats();
  res.json({
    success: true,
    data: stats
  });
};

const getCertificate = (req, res) => {
  const { workerId, moduleId } = req.params;
  const cert = dbService.getCertificateData(workerId, moduleId);
  if (!cert) {
    return res.status(404).json({
      success: false,
      error: {
        code: "CERTIFICATE_NOT_FOUND",
        message: `Safety module ${moduleId} not found for certificate generation.`
      }
    });
  }
  res.json({
    success: true,
    data: cert
  });
};

module.exports = {
  healthController,
  getModules,
  getModuleById,
  getWorkers,
  getWorkerById,
  createWorker,
  recordProgress,
  getIncidents,
  createIncident,
  updateIncidentStatus,
  getDashboard,
  getCertificate
};
