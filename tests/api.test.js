const { describe, it, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.DATA_DIR = require("path").join(__dirname, "..", "data_test");
process.env.DATA_FILE = require("path").join(__dirname, "..", "data_test", "db.test.json");

const app = require("../src/app");

describe("AR Rakshak API & Security Test Suite", () => {
  it("GET /api/health returns 200 and healthy status", async () => {
    const res = await request(app).get("/api/health");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.service, "AR Rakshak");
    assert.strictEqual(res.body.data.status, "healthy");
  });

  it("Security headers should be present on responses", async () => {
    const res = await request(app).get("/api/health");
    assert.strictEqual(res.headers["x-content-type-options"], "nosniff");
    assert.strictEqual(res.headers["x-frame-options"], "SAMEORIGIN");
    assert.ok(res.headers["content-security-policy"]);
    assert.ok(res.headers["x-request-id"]);
  });

  it("GET /api/modules returns modules with correct properties", async () => {
    const res = await request(app).get("/api/modules");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 3);

    const m = res.body.data[0];
    assert.ok(m.id);
    assert.ok(m.title);
    assert.ok(m.zone);
    assert.ok(Array.isArray(m.steps));
    assert.ok(Array.isArray(m.quiz));
  });

  it("GET /api/modules/:id returns single module or 404", async () => {
    const res = await request(app).get("/api/modules/M001");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.data.id, "M001");

    const notFound = await request(app).get("/api/modules/M999");
    assert.strictEqual(notFound.status, 404);
    assert.strictEqual(notFound.body.success, false);
    assert.strictEqual(notFound.body.error.code, "MODULE_NOT_FOUND");
  });

  it("POST /api/workers creates worker and rejects invalid names", async () => {
    const valid = await request(app)
      .post("/api/workers")
      .send({ name: "Amit Kumar", language: "Hindi", role: "Safety Officer" });
    assert.strictEqual(valid.status, 201);
    assert.strictEqual(valid.body.success, true);
    assert.strictEqual(valid.body.data.name, "Amit Kumar");
    assert.strictEqual(valid.body.data.language, "Hindi");
    assert.strictEqual(valid.body.data.risk, "New");

    const invalid = await request(app)
      .post("/api/workers")
      .send({ name: " " });
    assert.strictEqual(invalid.status, 400);
    assert.strictEqual(invalid.body.success, false);
    assert.strictEqual(invalid.body.error.code, "VALIDATION_ERROR");
  });

  it("POST /api/progress accurately calculates score, risk, and updates completion", async () => {
    // Submit score 90 for M001
    const res = await request(app)
      .post("/api/progress")
      .send({ workerId: "W001", moduleId: "M001", score: 90 });

    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.strictEqual(res.body.data.passed, true);
    assert.strictEqual(res.body.data.worker.scores["M001"], 90);
    // Score should be accurate, not halved
    assert.ok(res.body.data.worker.score >= 80);
    assert.strictEqual(res.body.data.worker.risk, "Low");
  });

  it("POST /api/progress rejects invalid score or invalid module", async () => {
    const badScore = await request(app)
      .post("/api/progress")
      .send({ workerId: "W001", moduleId: "M001", score: 150 });
    assert.strictEqual(badScore.status, 400);
    assert.strictEqual(badScore.body.error.code, "VALIDATION_ERROR");

    const badMod = await request(app)
      .post("/api/progress")
      .send({ workerId: "W001", moduleId: "M999", score: 80 });
    assert.strictEqual(badMod.status, 404);
    assert.strictEqual(badMod.body.error.code, "MODULE_NOT_FOUND");
  });

  it("POST /api/incidents creates incident and prevents rapid duplicates", async () => {
    const payload = {
      worker: "Demo Worker",
      type: "Hazard",
      location: "GAS-CHECK",
      severity: "High",
      description: "Gas detector sensor battery low in zone B."
    };

    const first = await request(app).post("/api/incidents").send(payload);
    assert.strictEqual(first.status, 201);
    assert.strictEqual(first.body.success, true);
    assert.ok(first.body.data.id.startsWith("INC-"));

    // Submitting duplicate immediately should be safely deduplicated
    const dup = await request(app).post("/api/incidents").send(payload);
    assert.strictEqual(dup.status, 201);
    assert.strictEqual(dup.body.data.id, first.body.data.id);
  });

  it("PATCH /api/incidents/:id/status updates incident status safely", async () => {
    const listRes = await request(app).get("/api/incidents");
    const firstInc = listRes.body.data[0];

    const patchRes = await request(app)
      .patch(`/api/incidents/${firstInc.id}/status`)
      .send({ status: "Resolved" });

    assert.strictEqual(patchRes.status, 200);
    assert.strictEqual(patchRes.body.data.status, "Resolved");
  });

  it("GET /api/dashboard returns correct aggregated metrics", async () => {
    const res = await request(app).get("/api/dashboard");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(typeof res.body.data.workers === "number");
    assert.ok(typeof res.body.data.completed === "number");
    assert.ok(typeof res.body.data.incidents === "number");
    assert.ok(typeof res.body.data.highRisk === "number");
  });

  it("GET /api/certificate/:workerId/:moduleId returns certificate", async () => {
    const res = await request(app).get("/api/certificate/W001/M001");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(res.body.data.certificateId.startsWith("ARR-"));
    assert.strictEqual(res.body.data.workerId, "W001");
    assert.strictEqual(res.body.data.moduleId, "M001");
  });

  it("Malformed JSON body returns 400 with clean JSON error", async () => {
    const res = await request(app)
      .post("/api/workers")
      .set("Content-Type", "application/json")
      .send('{"name": "broken');

    assert.strictEqual(res.status, 400);
    assert.strictEqual(res.body.success, false);
    assert.strictEqual(res.body.error.code, "MALFORMED_JSON");
  });
});
