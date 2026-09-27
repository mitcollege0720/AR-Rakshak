// Safety Training Modules, AR Simulation, Quiz, and Assessment Engine

const TrainingManager = {
  modules: [],
  currentModule: null,
  currentStep: 0,
  quizIndex: 0,
  answers: {},
  isSubmitting: false,

  async loadModules() {
    try {
      const data = await API.get("/api/modules");
      if (Array.isArray(data) && data.length > 0) {
        this.modules = data;
        StorageLayer.setCache("modules", data);
      }
    } catch (err) {
      const cached = StorageLayer.getCache("modules");
      if (cached && cached.length > 0) {
        this.modules = cached;
      }
    }
    return this.modules;
  },

  renderModulesList(containerId = "moduleList") {
    const el = document.getElementById(containerId);
    if (!el) return;

    if (!this.modules || this.modules.length === 0) {
      el.innerHTML = `
        <div class="card empty-card">
          <p class="muted">No training modules available right now.</p>
        </div>
      `;
      return;
    }

    el.innerHTML = this.modules.map(m => `
      <div class="card module-card">
        <div class="module-info">
          <div class="module-tags">
            <span class="pill pill-sector">${escapeHtml(m.sector)}</span>
            <span class="pill pill-zone">📍 ${escapeHtml(m.zone)}</span>
            <span class="pill pill-time">⏱ ${escapeHtml(m.duration)}</span>
          </div>
          <h3>${escapeHtml(m.title)}</h3>
          <p class="muted module-hazard">${escapeHtml(m.hazard)}</p>
          <div class="module-ppe-preview">
            <small><b>Required PPE:</b></small>
            ${(m.ppe || []).slice(0, 4).map(p => `<span class="pill pill-ppe">✓ ${escapeHtml(p)}</span>`).join("")}
          </div>
        </div>
        <div class="module-action">
          <button class="btn green" onclick="TrainingManager.openModule('${escapeHtml(m.id)}')">
            ${t("startTraining")} →
          </button>
        </div>
      </div>
    `).join("");
  },

  openModule(moduleId) {
    CameraManager.stopCamera();
    this.currentModule = this.modules.find(m => m.id === moduleId);
    if (!this.currentModule) {
      showToast("Module not found", "error");
      return;
    }
    this.currentStep = 0;
    this.quizIndex = 0;
    this.answers = {};
    this.renderStep();
  },

  renderStep() {
    CameraManager.stopCamera(); // Stop camera on any step transition

    if (!this.currentModule) return;

    if (this.currentStep === 0) {
      this.renderModuleOverview();
    } else if (this.currentStep === 1) {
      this.renderSafetySteps();
    } else if (this.currentStep === 2) {
      this.renderQuizQuestion();
    }
  },

  renderModuleOverview() {
    const m = this.currentModule;
    shell(`
      <div class="section-title">
        <div>
          <span class="pill pill-sector">${escapeHtml(m.sector)}</span>
          <span class="pill pill-zone">📍 Zone: ${escapeHtml(m.zone)}</span>
          <h1>${escapeHtml(m.title)}</h1>
          <p class="muted">${escapeHtml(m.hazard)}</p>
        </div>
      </div>

      <div class="card">
        <h3>🦺 ${t("requiredPPE")}</h3>
        <p class="muted">Verify that you are wearing and properly inspecting all mandatory safety equipment:</p>
        <div class="ppe-checklist">
          ${m.ppe.map((item, idx) => `
            <label class="checkbox-label" for="ppe_${idx}">
              <input type="checkbox" id="ppe_${idx}" checked aria-label="${escapeHtml(item)}">
              <span><b>${escapeHtml(item)}</b> — Inspected and fitted</span>
            </label>
          `).join("")}
        </div>
      </div>

      <div class="card camera-wrapper">
        <div class="camera-header">
          <h3>📷 ${t("arViewTitle")}</h3>
          <span class="badge badge-info" id="camStatusBadge">Ready</span>
        </div>

        <div class="camera" id="cameraViewport">
          <video id="arVideo" autoplay playsinline muted class="camera-video"></video>
          <div class="ar-overlay" id="arOverlay">
            <div class="scan-box" id="scanBox">
              <span class="scan-bracket top-left"></span>
              <span class="scan-bracket top-right"></span>
              <span class="scan-bracket bottom-left"></span>
              <span class="scan-bracket bottom-right"></span>
              <div class="scan-text">
                <b>SAFE WORK ZONE</b>
                <small>${escapeHtml(m.zone)}</small>
              </div>
            </div>
            <div class="overlay-hazard-alert">
              ⚠️ HAZARD BOUNDARY ACTIVE • AUTHORIZED PERSONNEL ONLY
            </div>
          </div>
        </div>

        <div class="camera-controls">
          <button class="btn secondary" id="btnToggleCam" onclick="TrainingManager.toggleCameraFeed()">
            🎥 ${t("enableCamera")}
          </button>
          <p class="muted small-note" id="camNote">${t("demoNote")}</p>
        </div>
      </div>

      <div class="action-bar">
        <button class="btn full green" onclick="TrainingManager.goToStep(1)">
          ${t("beginSteps")} →
        </button>
      </div>
    `);
  },

  async toggleCameraFeed() {
    const video = document.getElementById("arVideo");
    const btn = document.getElementById("btnToggleCam");
    const badge = document.getElementById("camStatusBadge");
    const note = document.getElementById("camNote");

    if (CameraManager.isCameraActive) {
      CameraManager.stopCamera();
      if (btn) btn.innerHTML = `🎥 ${t("enableCamera")}`;
      if (badge) { badge.textContent = "Inactive"; badge.className = "badge"; }
      return;
    }

    if (badge) { badge.textContent = "Connecting..."; badge.className = "badge badge-warning"; }

    const success = await CameraManager.startCamera(video, (status) => {
      if (status.status === "active") {
        if (badge) { badge.textContent = "Live Camera"; badge.className = "badge badge-success"; }
        if (btn) btn.innerHTML = `🛑 ${t("stopCamera")}`;
      } else if (status.status === "denied" || status.status === "unsupported" || status.status === "not_found") {
        if (badge) { badge.textContent = "Simulation"; badge.className = "badge badge-info"; }
        if (btn) btn.style.display = "none";
        if (note) note.textContent = status.message;
        showToast(status.message, "warning");
      }
    });

    if (!success && btn) {
      btn.innerHTML = `🎥 ${t("enableCamera")}`;
    }
  },

  goToStep(stepNumber) {
    CameraManager.stopCamera();
    this.currentStep = stepNumber;
    this.renderStep();
  },

  renderSafetySteps() {
    const m = this.currentModule;
    shell(`
      <div class="section-title">
        <div>
          <span class="pill pill-sector">${escapeHtml(m.sector)}</span>
          <h1>${t("safetyProcedure")}</h1>
          <p class="muted">${escapeHtml(m.title)} • Follow all steps in strict sequence.</p>
        </div>
      </div>

      <div class="steps-container">
        ${m.steps.map((step, idx) => `
          <div class="card step-card">
            <div class="step-num">${idx + 1}</div>
            <div class="step-body">
              <h4>${t("step")} ${idx + 1}</h4>
              <p>${escapeHtml(step)}</p>
            </div>
          </div>
        `).join("")}
      </div>

      <div class="action-bar">
        <button class="btn secondary" onclick="TrainingManager.goToStep(0)">← ${t("requiredPPE")}</button>
        <button class="btn green" onclick="TrainingManager.goToStep(2)">${t("startAssessment")} →</button>
      </div>
    `);
  },

  renderQuizQuestion() {
    const m = this.currentModule;
    const questions = m.quiz || [];
    const total = questions.length;

    if (total === 0) {
      this.finishAssessment();
      return;
    }

    if (this.quizIndex >= total) {
      this.finishAssessment();
      return;
    }

    const currentQ = questions[this.quizIndex];
    const selectedAnswer = this.answers[this.quizIndex];
    const progressPercent = Math.round(((this.quizIndex + 1) / total) * 100);

    shell(`
      <div class="section-title">
        <div>
          <h1>${t("assessmentTitle")}</h1>
          <p class="muted">${escapeHtml(m.title)}</p>
        </div>
        <span class="pill pill-zone">${t("question")} ${this.quizIndex + 1} / ${total}</span>
      </div>

      <div class="progress" role="progressbar" aria-valuenow="${progressPercent}" aria-valuemin="0" aria-valuemax="100">
        <div style="width: ${progressPercent}%"></div>
      </div>

      <div class="card question-card">
        <h3 class="question-text">${this.quizIndex + 1}. ${escapeHtml(currentQ.q)}</h3>
        <div class="options-group" role="radiogroup" aria-label="Answer options">
          ${currentQ.options.map((opt, optIdx) => `
            <button
              type="button"
              class="option-btn ${selectedAnswer === optIdx ? 'selected' : ''}"
              role="radio"
              aria-checked="${selectedAnswer === optIdx}"
              onclick="TrainingManager.selectAnswer(${this.quizIndex}, ${optIdx})"
            >
              <span class="option-key">${String.fromCharCode(65 + optIdx)}</span>
              <span class="option-label">${escapeHtml(opt)}</span>
            </button>
          `).join("")}
        </div>
      </div>

      <div class="action-bar">
        ${this.quizIndex > 0 ? `<button class="btn secondary" onclick="TrainingManager.prevQuestion()">← Previous</button>` : `<div></div>`}
        ${selectedAnswer !== undefined ? `
          <button class="btn green" onclick="TrainingManager.nextQuestion()">
            ${this.quizIndex === total - 1 ? t("finishQuiz") : t("nextQuestion")} →
          </button>
        ` : `
          <button class="btn secondary" disabled style="opacity: 0.5;">
            Select an answer to continue
          </button>
        `}
      </div>
    `);
  },

  selectAnswer(qIndex, optIndex) {
    this.answers[qIndex] = optIndex;

    const optionsGroup = document.querySelector(".options-group");
    if (optionsGroup) {
      optionsGroup.querySelectorAll(".option-btn").forEach((btn, idx) => {
        const isSelected = idx === optIndex;
        btn.classList.toggle("selected", isSelected);
        btn.setAttribute("aria-checked", isSelected);
      });
    }

    const actionBar = document.querySelector(".action-bar");
    if (actionBar) {
      const total = (this.currentModule?.quiz || []).length;
      const isLast = this.quizIndex === total - 1;
      actionBar.innerHTML = `
        ${this.quizIndex > 0 ? `<button class="btn secondary" onclick="TrainingManager.prevQuestion()">← Previous</button>` : `<div></div>`}
        <button class="btn green" onclick="TrainingManager.nextQuestion()">
          ${isLast ? t("finishQuiz") : t("nextQuestion")} →
        </button>
      `;
    }
  },

  prevQuestion() {
    if (this.quizIndex > 0) {
      this.quizIndex--;
      this.renderQuizQuestion();
    }
  },

  nextQuestion() {
    const questions = this.currentModule?.quiz || [];
    if (this.quizIndex < questions.length - 1) {
      this.quizIndex++;
      this.renderQuizQuestion();
    } else {
      this.finishAssessment();
    }
  },

  async finishAssessment() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;

    const m = this.currentModule;
    const questions = m.quiz || [];
    let correct = 0;

    questions.forEach((q, idx) => {
      if (this.answers[idx] === q.answer) correct++;
    });

    const score = questions.length > 0 ? Math.round((correct / questions.length) * 100) : 100;
    const passed = score >= 70;
    const workerId = WorkerManager.currentWorkerId;

    // Save offline record
    await StorageLayer.enqueueSync("PROGRESS", {
      workerId,
      moduleId: m.id,
      score,
      date: new Date().toISOString()
    });

    let syncSucceeded = false;
    try {
      if (navigator.onLine) {
        await API.post("/api/progress", {
          workerId,
          moduleId: m.id,
          score
        });
        syncSucceeded = true;
      }
    } catch (err) {
      console.warn("Server progress sync failed, queued offline:", err.message);
    } finally {
      this.isSubmitting = false;
    }

    shell(`
      <div class="card result-card" style="text-align: center;">
        <div class="result-badge ${passed ? 'badge-pass' : 'badge-fail'}">
          ${passed ? '🎉' : '⚠️'}
        </div>
        <h1>${t("trainingComplete")}</h1>
        <p class="result-score">${t("yourScore")}: <b>${score}%</b></p>
        <p class="muted">${passed ? t("passedMessage") : t("failedMessage")}</p>

        <div class="sync-status-indicator">
          ${syncSucceeded
            ? `<span class="badge badge-success">● Synced with Central Safety Server</span>`
            : `<span class="badge badge-warning">● Saved Locally (Will sync when online)</span>`
          }
        </div>

        <div class="action-bar-centered">
          ${passed ? `
            <button class="btn green" onclick="CertificateManager.show('${escapeHtml(workerId)}', '${escapeHtml(m.id)}')">
              📜 ${t("viewCertificate")}
            </button>
          ` : `
            <button class="btn" onclick="TrainingManager.openModule('${escapeHtml(m.id)}')">
              🔁 Retry Assessment
            </button>
          `}
          <button class="btn secondary" onclick="showTraining()">
            ${t("backToTraining")}
          </button>
        </div>
      </div>
    `);
  }
};
