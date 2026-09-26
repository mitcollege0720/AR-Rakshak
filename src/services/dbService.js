const { fileStorage } = require("../utils/fileStorage");
const logger = require("../utils/logger");
const crypto = require("crypto");

class DBService {
  constructor(storage = fileStorage) {
    this.storage = storage;
  }

  getDB() {
    return this.storage.read();
  }

  async saveDB(data) {
    await this.storage.write(data);
  }

  getModules() {
    const db = this.getDB();
    return db.modules || [];
  }

  getModuleById(id) {
    const db = this.getDB();
    return (db.modules || []).find(m => m.id === id) || null;
  }

  getWorkers() {
    const db = this.getDB();
    return db.workers || [];
  }

  getWorkerById(id) {
    const db = this.getDB();
    return (db.workers || []).find(w => w.id === id) || null;
  }

  async createWorker({ name, language = "English", role = "Worker" }) {
    const db = this.getDB();
    const id = "W" + crypto.randomInt(1000, 9999).toString();
    const newWorker = {
      id,
      name: name.trim(),
      language: language === "Hindi" ? "Hindi" : "English",
      role: role.trim() || "Worker",
      score: 0,
      risk: "New",
      completed: 0,
      completedModules: [],
      scores: {},
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    db.workers.push(newWorker);
    await this.saveDB(db);
    logger.info("New worker created", { workerId: id, name: newWorker.name });
    return newWorker;
  }

  async recordProgress(workerId, moduleId, score) {
    const db = this.getDB();
    const cleanScore = Math.max(0, Math.min(100, Math.round(Number(score) || 0)));

    let worker = (db.workers || []).find(w => w.id === workerId);
    if (!worker) {
      worker = {
        id: workerId || "W" + crypto.randomInt(1000, 9999),
        name: "Demo Worker",
        language: "English",
        role: "Worker",
        score: 0,
        risk: "New",
        completed: 0,
        completedModules: [],
        scores: {},
        createdAt: new Date().toISOString()
      };
      db.workers.push(worker);
    }

    if (!worker.completedModules) worker.completedModules = [];
    if (!worker.scores) worker.scores = {};

    // Record or update score for this module
    worker.scores[moduleId] = cleanScore;
    if (!worker.completedModules.includes(moduleId)) {
      worker.completedModules.push(moduleId);
    }

    // Accurate calculation: average of all assessed modules
    const scoreList = Object.values(worker.scores);
    const avgScore = scoreList.length > 0
      ? Math.round(scoreList.reduce((acc, curr) => acc + curr, 0) / scoreList.length)
      : cleanScore;

    worker.score = avgScore;
    worker.completed = worker.completedModules.length;

    // Standardized risk tiers
    if (worker.completed === 0) {
      worker.risk = "New";
    } else if (worker.score >= 75) {
      worker.risk = "Low";
    } else if (worker.score >= 50) {
      worker.risk = "Medium";
    } else {
      worker.risk = "High";
    }

    worker.updatedAt = new Date().toISOString();
    await this.saveDB(db);

    logger.info("Worker training progress updated", {
      workerId: worker.id,
      moduleId,
      score: cleanScore,
      overallScore: worker.score,
      risk: worker.risk
    });

    return worker;
  }

  getIncidents() {
    const db = this.getDB();
    return db.incidents || [];
  }

  async createIncident({ worker, type, location, description, severity, idempotencyKey }) {
    const db = this.getDB();
    if (!db.incidents) db.incidents = [];

    // Deduplication check: check if an identical incident was filed within last 30 seconds
    const thirtySecsAgo = new Date(Date.now() - 30000).toISOString();
    const isDuplicate = db.incidents.some(inc => {
      if (idempotencyKey && inc.idempotencyKey === idempotencyKey) return true;
      return (
        inc.worker === worker &&
        inc.type === type &&
        inc.location === location &&
        inc.description === description &&
        inc.createdAt >= thirtySecsAgo
      );
    });

    if (isDuplicate) {
      logger.warn("Duplicate incident submission ignored", { worker, type, location });
      const existing = db.incidents.find(inc =>
        (idempotencyKey && inc.idempotencyKey === idempotencyKey) ||
        (inc.worker === worker && inc.type === type && inc.location === location)
      );
      return existing || db.incidents[0];
    }

    const incidentId = "INC-" + crypto.randomBytes(3).toString("hex").toUpperCase();
    const newIncident = {
      id: incidentId,
      idempotencyKey: idempotencyKey || null,
      worker: worker.trim(),
      type,
      location: location.trim(),
      description: description.trim(),
      severity: ["High", "Medium", "Low"].includes(severity) ? severity : "Medium",
      status: "Open",
      createdAt: new Date().toISOString()
    };

    db.incidents.unshift(newIncident);
    await this.saveDB(db);

    logger.info("Incident report created", {
      incidentId: newIncident.id,
      severity: newIncident.severity,
      location: newIncident.location
    });

    return newIncident;
  }

  async updateIncidentStatus(incidentId, status) {
    const validStatuses = ["Open", "Investigating", "Resolved"];
    if (!validStatuses.includes(status)) {
      throw new Error(`Invalid status. Must be one of: ${validStatuses.join(", ")}`);
    }

    const db = this.getDB();
    const incident = (db.incidents || []).find(i => i.id === incidentId);
    if (!incident) return null;

    incident.status = status;
    incident.updatedAt = new Date().toISOString();
    await this.saveDB(db);
    logger.info("Incident status updated", { incidentId, status });
    return incident;
  }

  getDashboardStats() {
    const db = this.getDB();
    const workers = db.workers || [];
    const incidents = db.incidents || [];
    const modules = db.modules || [];

    const totalWorkers = workers.length;
    const completedTrainings = workers.reduce((acc, w) => acc + (w.completed || 0), 0);
    const highRiskCount = workers.filter(w => w.risk === "High").length;
    const mediumRiskCount = workers.filter(w => w.risk === "Medium").length;
    const lowRiskCount = workers.filter(w => w.risk === "Low").length;
    const openIncidents = incidents.filter(i => i.status === "Open").length;

    // Average score across workers
    const assessedWorkers = workers.filter(w => (w.completed || 0) > 0);
    const avgSafetyScore = assessedWorkers.length > 0
      ? Math.round(assessedWorkers.reduce((acc, w) => acc + w.score, 0) / assessedWorkers.length)
      : 0;

    return {
      workers: totalWorkers,
      completed: completedTrainings,
      incidents: incidents.length,
      openIncidents,
      highRisk: highRiskCount,
      mediumRisk: mediumRiskCount,
      lowRisk: lowRiskCount,
      avgScore: avgSafetyScore,
      modules: modules.length
    };
  }

  getCertificateData(workerId, moduleId) {
    const db = this.getDB();
    const worker = (db.workers || []).find(w => w.id === workerId);
    const moduleItem = (db.modules || []).find(m => m.id === moduleId);

    if (!moduleItem) return null;

    const workerName = worker ? worker.name : "Worker " + workerId;
    const moduleScore = (worker && worker.scores && worker.scores[moduleId] !== undefined)
      ? worker.scores[moduleId]
      : (worker ? worker.score : 80);

    const certificateId = "ARR-" + crypto.createHash("sha256")
      .update(`${workerId}-${moduleId}-${Date.now().toString().slice(0, 7)}`)
      .digest("hex")
      .slice(0, 10)
      .toUpperCase();

    return {
      certificateId,
      worker: workerName,
      workerId: worker ? worker.id : workerId,
      module: moduleItem.title,
      moduleId: moduleItem.id,
      sector: moduleItem.sector,
      zone: moduleItem.zone,
      score: moduleScore,
      issued: new Date().toISOString().split("T")[0],
      statement: "Has successfully completed the AR-RAKSHAK safety training simulation and passed the interactive safety assessment.",
      verificationUrl: `/api/certificate/${workerId}/${moduleId}`
    };
  }
}

const dbService = new DBService();

module.exports = {
  DBService,
  dbService
};
