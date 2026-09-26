// Supervisor Dashboard with KPI Cards, Worker Risk Table, and Incident Management

const SupervisorDashboard = {
  async render() {
    CameraManager.stopCamera();

    const appEl = document.getElementById("app");
    renderLoading(appEl, "Loading supervisor metrics and compliance records...");

    try {
      const [stats, workers, incidents] = await Promise.all([
        API.get("/api/dashboard"),
        API.get("/api/workers"),
        API.get("/api/incidents")
      ]);

      this.renderView(stats, workers, incidents);
    } catch (err) {
      renderErrorState(appEl, "Failed to load supervisor dashboard data. Please check connection.", () => {
        SupervisorDashboard.render();
      });
    }
  },

  renderView(stats, workers = [], incidents = []) {
    shell(`
      <div class="section-title">
        <div>
          <h1>📊 ${t("supervisorDashboard")}</h1>
          <p class="muted">${t("supervisorSubtitle")}</p>
        </div>
        <div class="header-buttons">
          <button class="btn secondary" onclick="SupervisorDashboard.render()">🔄 Refresh</button>
          <button class="btn" onclick="showHome()">Worker Terminal</button>
        </div>
      </div>

      <div class="grid kpi-grid">
        <div class="card stat-card">
          <div class="stat-icon">👷</div>
          <b>${stats?.workers || 0}</b>
          <span>${t("totalWorkers")}</span>
        </div>
        <div class="card stat-card">
          <div class="stat-icon">🎓</div>
          <b>${stats?.completed || 0}</b>
          <span>${t("moduleCompletions")}</span>
        </div>
        <div class="card stat-card stat-danger">
          <div class="stat-icon">⚠️</div>
          <b>${stats?.highRisk || 0}</b>
          <span>${t("highRiskWorkers")}</span>
        </div>
        <div class="card stat-card stat-warning">
          <div class="stat-icon">🚨</div>
          <b>${stats?.openIncidents ?? stats?.incidents ?? 0}</b>
          <span>${t("openIncidentsCount")}</span>
        </div>
      </div>

      <div class="card">
        <div class="card-header-flex">
          <h2>🛡️ ${t("workforceRiskTable")}</h2>
          <button class="btn secondary btn-sm" onclick="WorkerManager.showWorkerSelectorModal()">+ Add / Switch Worker</button>
        </div>
        <div class="table-responsive">
          <table class="data-table">
            <thead>
              <tr>
                <th>${t("workerCol")}</th>
                <th>Role</th>
                <th>${t("scoreCol")}</th>
                <th>${t("riskCol")}</th>
                <th>${t("completedCol")}</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              ${workers.length === 0 ? `<tr><td colspan="6" class="text-center muted">No workers registered.</td></tr>` : ""}
              ${workers.map(w => `
                <tr>
                  <td>
                    <b>${escapeHtml(w.name)}</b>
                    <div class="muted small">${escapeHtml(w.id)}</div>
                  </td>
                  <td>${escapeHtml(w.role || "Worker")}</td>
                  <td><b>${w.score || 0}%</b></td>
                  <td>
                    <span class="badge ${w.risk === 'High' ? 'badge-danger' : w.risk === 'Medium' ? 'badge-warning' : 'badge-success'}">
                      ${w.risk === 'High' ? '⚠️ High' : w.risk === 'Medium' ? '🟡 Medium' : '🟢 Low'}
                    </span>
                  </td>
                  <td>${w.completed || 0} modules</td>
                  <td>
                    <button class="btn secondary btn-sm" onclick="WorkerManager.setWorker({ id: '${escapeHtml(w.id)}', name: '${escapeHtml(w.name)}', score: ${w.score || 0}, risk: '${escapeHtml(w.risk || 'New')}', completed: ${w.completed || 0} })">
                      Select
                    </button>
                  </td>
                </tr>
              `).join("")}
            </tbody>
          </table>
        </div>
      </div>

      <div class="card">
        <h2>⚠️ ${t("recentIncidents")}</h2>
        <div class="incident-list">
          ${incidents.length === 0 ? `<p class="muted">${t("noIncidents")}</p>` : ""}
          ${incidents.slice(0, 10).map(inc => `
            <div class="card incident-item ${inc.status === 'Resolved' ? 'incident-resolved' : ''}">
              <div class="incident-header">
                <div>
                  <b>${escapeHtml(inc.id)}</b> • <span class="pill">${escapeHtml(inc.type)}</span>
                  <span class="badge ${inc.severity === 'High' ? 'badge-danger' : inc.severity === 'Medium' ? 'badge-warning' : 'badge-success'}">
                    ${escapeHtml(inc.severity)}
                  </span>
                </div>
                <div>
                  <span class="badge ${inc.status === 'Resolved' ? 'badge-success' : 'badge-warning'}">
                    ${escapeHtml(inc.status || 'Open')}
                  </span>
                  ${inc.status !== 'Resolved' ? `
                    <button class="btn secondary btn-sm" onclick="SupervisorDashboard.resolveIncident('${escapeHtml(inc.id)}')">
                      ✓ ${t("markResolved")}
                    </button>
                  ` : ""}
                </div>
              </div>
              <p class="incident-desc">${escapeHtml(inc.description || "No description provided.")}</p>
              <div class="incident-meta muted small">
                <span>📍 Location: <b>${escapeHtml(inc.location)}</b></span> •
                <span>Reporter: <b>${escapeHtml(inc.worker)}</b></span> •
                <span>Time: ${new Date(inc.createdAt).toLocaleString()}</span>
              </div>
            </div>
          `).join("")}
        </div>
      </div>
    `);
  },

  async resolveIncident(incidentId) {
    try {
      await API.patch(`/api/incidents/${incidentId}/status`, { status: "Resolved" });
      showToast(`Incident ${incidentId} marked as Resolved`, "success");
      this.render();
    } catch (err) {
      showToast(err.message || "Failed to update incident status", "error");
    }
  }
};
