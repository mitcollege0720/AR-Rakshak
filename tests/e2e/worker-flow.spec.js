const { describe, it } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");

process.env.NODE_ENV = "test";
process.env.DATA_DIR = require("path").join(__dirname, "..", "..", "data_e2e");
process.env.DATA_FILE = require("path").join(__dirname, "..", "..", "data_e2e", "db.e2e.json");

const app = require("../../src/app");

describe("E2E User Journey Test: Worker Full Training & Certification Flow", () => {
  let selectedModule = null;
  let calculatedScore = null;
  const workerId = "W001";

  it("Step 1: Open website (Verify HTML Shell and Navigation)", async () => {
    const res = await request(app).get("/");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.headers["content-type"].includes("text/html"), true);
    assert.strictEqual(res.text.includes("AR Rakshak"), true);
    assert.strictEqual(res.text.includes("topbar"), true);
    assert.strictEqual(res.text.includes("bottom-nav"), true);
  });

  it("Step 2: Start Training (Fetch Training Modules List)", async () => {
    const res = await request(app).get("/api/modules");
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);
    assert.ok(Array.isArray(res.body.data));
    assert.ok(res.body.data.length >= 3);

    // Pick first module
    selectedModule = res.body.data.find(m => m.id === "M001");
    assert.ok(selectedModule);
    assert.strictEqual(selectedModule.id, "M001");
    assert.strictEqual(selectedModule.zone, "MINE-ENTRANCE");
  });

  it("Step 3: Select Module & Inspect Safety Steps and PPE", async () => {
    const res = await request(app).get(`/api/modules/${selectedModule.id}`);
    assert.strictEqual(res.status, 200);
    assert.strictEqual(res.body.success, true);

    const mod = res.body.data;
    assert.ok(Array.isArray(mod.ppe));
    assert.ok(mod.ppe.includes("Helmet"));
    assert.ok(Array.isArray(mod.steps));
    assert.ok(mod.steps.length >= 4);
    assert.ok(Array.isArray(mod.quiz));
    assert.ok(mod.quiz.length >= 2);
  });

  it("Step 4: Take Quiz and Calculate Verified Score", async () => {
    const questions = selectedModule.quiz;
    const workerAnswers = {};

    // Simulate answering all questions correctly
    questions.forEach((q, idx) => {
      workerAnswers[idx] = q.answer;
    });

    let correctCount = 0;
    questions.forEach((q, idx) => {
      if (workerAnswers[idx] === q.answer) correctCount++;
    });

    calculatedScore = Math.round((correctCount / questions.length) * 100);
    assert.strictEqual(calculatedScore, 100);
  });

  it("Step 5: Submit Assessment Progress to Server", async () => {
    const progressRes = await request(app)
      .post("/api/progress")
      .send({
        workerId,
        moduleId: selectedModule.id,
        score: calculatedScore
      });

    assert.strictEqual(progressRes.status, 200);
    assert.strictEqual(progressRes.body.success, true);
    assert.strictEqual(progressRes.body.data.passed, true);
    assert.strictEqual(progressRes.body.data.recordedScore, 100);

    const updatedWorker = progressRes.body.data.worker;
    assert.strictEqual(updatedWorker.id, workerId);
    assert.strictEqual(updatedWorker.risk, "Low");
    assert.ok(updatedWorker.completedModules.includes(selectedModule.id));
  });

  it("Step 6: Retrieve and Verify Official Certificate of Completion", async () => {
    const certRes = await request(app).get(`/api/certificate/${workerId}/${selectedModule.id}`);
    assert.strictEqual(certRes.status, 200);
    assert.strictEqual(certRes.body.success, true);

    const cert = certRes.body.data;
    assert.ok(cert.certificateId.startsWith("ARR-"));
    assert.strictEqual(cert.workerId, workerId);
    assert.strictEqual(cert.moduleId, selectedModule.id);
    assert.strictEqual(cert.module, selectedModule.title);
    assert.strictEqual(cert.sector, selectedModule.sector);
    assert.strictEqual(cert.score, 100);
    assert.ok(cert.issued);
    assert.ok(cert.statement.includes("successfully completed"));
  });

  it("Step 7: Verify Supervisor Dashboard Reflects Verified Completion", async () => {
    const dashRes = await request(app).get("/api/dashboard");
    assert.strictEqual(dashRes.status, 200);
    assert.strictEqual(dashRes.body.success, true);

    const stats = dashRes.body.data;
    assert.ok(stats.workers >= 1);
    assert.ok(stats.completed >= 1);
  });
});
