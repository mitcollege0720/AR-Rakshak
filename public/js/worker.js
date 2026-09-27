// Worker Profile & Switching Management

const WorkerManager = {
  currentWorkerId: localStorage.getItem("arr_worker") || "W001",
  cachedWorker: null,

  async getCurrentWorker() {
    try {
      const workers = await API.get("/api/workers");
      const found = (workers || []).find(w => w.id === this.currentWorkerId) || workers?.[0];
      if (found) {
        this.currentWorkerId = found.id;
        this.cachedWorker = found;
        localStorage.setItem("arr_worker", found.id);
        StorageLayer.setCache("current_worker", found);
        return found;
      }
    } catch (e) {
      // Fallback to cache if offline
      const cached = StorageLayer.getCache("current_worker");
      if (cached) {
        this.cachedWorker = cached;
        return cached;
      }
    }

    return {
      id: this.currentWorkerId,
      name: "Demo Worker",
      language: currentLanguage,
      score: 80,
      risk: "Low",
      completed: 2
    };
  },

  setWorker(worker) {
    if (!worker || !worker.id) return;
    this.currentWorkerId = worker.id;
    this.cachedWorker = worker;
    localStorage.setItem("arr_worker", worker.id);
    StorageLayer.setCache("current_worker", worker);
    showToast(`Active worker set to ${worker.name} (${worker.id})`, "info");
    if (typeof refreshCurrentView === "function") refreshCurrentView();
  },

  async showWorkerSelectorModal() {
    let workers = [];
    try {
      workers = await API.get("/api/workers");
    } catch (e) {
      workers = [this.cachedWorker || { id: "W001", name: "Demo Worker", score: 80, risk: "Low", completed: 2 }];
    }

    const modal = document.createElement("div");
    modal.className = "modal-backdrop";
    modal.id = "workerModal";
    modal.setAttribute("role", "dialog");
    modal.setAttribute("aria-modal", "true");
    modal.setAttribute("aria-labelledby", "modalTitle");

    modal.innerHTML = `
      <div class="modal-box">
        <div class="modal-header">
          <h2 id="modalTitle">${t("workerProfile")} / ${t("switchWorker")}</h2>
          <button class="close-btn" aria-label="Close" onclick="document.getElementById('workerModal').remove()">✕</button>
        </div>
        <div class="modal-body">
          <p class="muted">Select an existing worker profile or register a new worker for this training terminal.</p>
          <div class="worker-list">
            ${workers.map(w => `
              <div class="card worker-select-card ${w.id === this.currentWorkerId ? 'active-worker-card' : ''}" onclick="WorkerManager.setWorker({ id: '${escapeHtml(w.id)}', name: '${escapeHtml(w.name)}', score: ${w.score || 0}, risk: '${escapeHtml(w.risk || 'New')}', completed: ${w.completed || 0} }); document.getElementById('workerModal').remove();">
                <div class="worker-select-info">
                  <b>${escapeHtml(w.name)}</b> <span class="pill">${escapeHtml(w.id)}</span>
                  <div class="muted">Score: ${w.score || 0}% • Completed: ${w.completed || 0} modules</div>
                </div>
                <span class="badge ${w.risk === 'High' ? 'badge-danger' : w.risk === 'Medium' ? 'badge-warning' : 'badge-success'}">${escapeHtml(w.risk || 'New')}</span>
              </div>
            `).join("")}
          </div>

          <div class="divider"></div>
          <h3>${t("createWorker")}</h3>
          <form onsubmit="WorkerManager.handleCreateWorker(event)">
            <label for="newWorkerName">${t("workerNameLabel")}</label>
            <input id="newWorkerName" required placeholder="e.g. Ramesh Kumar" minlength="2" maxlength="50">
            <button class="btn green full" type="submit">+ ${t("createWorker")}</button>
          </form>
        </div>
      </div>
    `;

    document.body.appendChild(modal);
  },

  async handleCreateWorker(e) {
    e.preventDefault();
    const input = document.getElementById("newWorkerName");
    const name = input ? input.value.trim() : "";
    if (!name) return;

    try {
      const created = await API.post("/api/workers", {
        name,
        language: currentLanguage,
        role: "Worker"
      });

      showToast(`Worker ${created.name} registered!`, "success");
      const modal = document.getElementById("workerModal");
      if (modal) modal.remove();
      this.setWorker(created);
    } catch (err) {
      showToast(err.message || "Failed to create worker", "error");
    }
  }
};
