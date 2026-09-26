// Incident and Hazard Reporting Flow with Offline Queue and Idempotency Protection

const IncidentManager = {
  isSubmitting: false,

  renderForm() {
    CameraManager.stopCamera();
    const currentWorker = WorkerManager.cachedWorker?.name || "Demo Worker";

    shell(`
      <div class="section-title">
        <div>
          <h1>🚨 ${t("reportTitle")}</h1>
          <p class="muted">${t("reportSubtitle")}</p>
        </div>
      </div>

      <form class="card incident-form" id="incidentForm" onsubmit="IncidentManager.handleSubmit(event)">
        <div class="form-group">
          <label for="incWorker">${t("workerNameLabel")}</label>
          <input id="incWorker" name="worker" value="${escapeHtml(currentWorker)}" required maxlength="100">
        </div>

        <div class="form-row">
          <div class="form-group">
            <label for="incType">${t("incidentTypeLabel")}</label>
            <select id="incType" name="type" required>
              <option value="Hazard">Hazard (Unsafe Condition)</option>
              <option value="Gas Alarm">Gas / Environmental Alarm</option>
              <option value="Equipment Failure">Equipment / Machine Failure</option>
              <option value="Near Miss">Near Miss Incident</option>
              <option value="Fall">Fall / Slips / Barrier Breach</option>
              <option value="Injury">Worker Injury</option>
              <option value="Unsafe Labour Concern">Unsafe Labour Concern</option>
            </select>
          </div>

          <div class="form-group">
            <label for="incSeverity">${t("severityLabel")}</label>
            <select id="incSeverity" name="severity" required>
              <option value="High">🔴 High (Immediate Danger / Stop Work)</option>
              <option value="Medium" selected>🟡 Medium (Caution / Remediation Needed)</option>
              <option value="Low">🟢 Low (Advisory / Minor Inspection)</option>
            </select>
          </div>
        </div>

        <div class="form-group">
          <label for="incLocation">${t("zoneLocationLabel")}</label>
          <input id="incLocation" name="location" value="MINE-ENTRANCE" required maxlength="100" placeholder="e.g. MINE-ENTRANCE, PRESS-STATION, GAS-CHECK">
        </div>

        <div class="form-group">
          <label for="incDesc">${t("descriptionLabel")}</label>
          <textarea id="incDesc" name="description" placeholder="${t("descriptionPlaceholder")}" maxlength="1000" rows="4"></textarea>
        </div>

        <div class="form-actions">
          <button type="submit" class="btn red full" id="btnSubmitIncident">
            🚨 ${t("submitReport")}
          </button>
        </div>
      </form>

      <div class="notice card">
        <b>Emergency Protocol:</b> In the event of an active fire, high methane/CO alarm, or severe injury, sound the site alarm horn immediately and evacuate to the designated assembly zone.
      </div>
    `);
  },

  async handleSubmit(e) {
    e.preventDefault();
    if (this.isSubmitting) return;

    const btn = document.getElementById("btnSubmitIncident");
    const worker = document.getElementById("incWorker")?.value.trim();
    const type = document.getElementById("incType")?.value;
    const location = document.getElementById("incLocation")?.value.trim();
    const severity = document.getElementById("incSeverity")?.value;
    const description = document.getElementById("incDesc")?.value.trim() || "";

    if (!worker || !location) {
      showToast("Worker name and location are required.", "error");
      return;
    }

    this.isSubmitting = true;
    if (btn) {
      btn.disabled = true;
      btn.textContent = "Submitting Safety Report...";
    }

    const idempotencyKey = "INC_IDEM_" + Date.now() + "_" + Math.random().toString(36).slice(2, 8);
    const incidentPayload = {
      worker,
      type,
      location,
      severity,
      description,
      idempotencyKey,
      clientTimestamp: new Date().toISOString()
    };

    let incidentId = null;
    let isOffline = !navigator.onLine;

    try {
      if (!isOffline) {
        const res = await API.post("/api/incidents", incidentPayload);
        incidentId = res.id;
      }
    } catch (err) {
      console.warn("Direct incident submission failed, falling back to offline queue:", err.message);
      isOffline = true;
    }

    if (isOffline) {
      incidentId = "LOCAL-INC-" + Math.random().toString(36).slice(2, 8).toUpperCase();
      incidentPayload.localId = incidentId;
      await StorageLayer.enqueueSync("INCIDENT", incidentPayload);
    }

    this.isSubmitting = false;

    shell(`
      <div class="card success-card" style="text-align: center;">
        <div class="result-badge badge-pass">✓</div>
        <h1>${t("reportSuccess")}</h1>
        <p class="incident-id">${t("reportId")}: <b>${escapeHtml(incidentId)}</b></p>
        <p class="muted">
          ${isOffline
            ? t("reportOfflineNotice")
            : "The incident report is logged on the central safety dashboard for supervisor investigation."
          }
        </p>

        <div class="action-bar-centered">
          <button class="btn green" onclick="showHome()">
            ${t("returnHome")}
          </button>
          <button class="btn secondary" onclick="IncidentManager.renderForm()">
            Report Another Incident
          </button>
        </div>
      </div>
    `);
  }
};
