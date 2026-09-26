// AR-RAKSHAK Main Application Controller and Router

const appEl = document.getElementById("app");
let currentView = "home";

function shell(html) {
  if (appEl) {
    appEl.innerHTML = `<div class="container">${html}</div>`;
  }
}

// Online / Offline Indicator & Sync
function updateOnlineStatus() {
  const badge = document.getElementById("onlineBadge");
  const isOnline = navigator.onLine;

  if (badge) {
    if (isOnline) {
      badge.textContent = `● ${t("online")}`;
      badge.className = "badge online";
    } else {
      badge.textContent = `● ${t("offline")}`;
      badge.className = "badge offline";
    }
  }

  if (isOnline) {
    syncPendingData();
  }
}

window.addEventListener("online", updateOnlineStatus);
window.addEventListener("offline", updateOnlineStatus);

// Automatic Background Sync of Queued Offline Submissions
let isSyncing = false;
async function syncPendingData() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;

  try {
    const queue = await StorageLayer.getPendingSyncs();
    if (queue.length === 0) {
      isSyncing = false;
      return;
    }

    let syncedCount = 0;
    for (const item of queue) {
      try {
        if (item.type === "INCIDENT") {
          await API.post("/api/incidents", item.payload);
          await StorageLayer.removeSyncItem(item.id);
          syncedCount++;
        } else if (item.type === "PROGRESS") {
          await API.post("/api/progress", item.payload);
          await StorageLayer.removeSyncItem(item.id);
          syncedCount++;
        }
      } catch (err) {
        console.warn("Item sync postponed:", err.message);
      }
    }

    if (syncedCount > 0) {
      showToast(`${syncedCount} offline record(s) synchronized with central safety server.`, "success");
      // Refresh current view if needed
      if (currentView === "home") loadWorkerStats();
    }
  } catch (e) {
    console.error("Sync error:", e);
  } finally {
    isSyncing = false;
  }
}

// Navigation helpers
function updateNavButtons(activeNav) {
  currentView = activeNav;
  const buttons = document.querySelectorAll(".bottom-nav button");
  buttons.forEach(btn => {
    const target = btn.getAttribute("data-nav");
    if (target === activeNav) {
      btn.classList.add("active");
    } else {
      btn.classList.remove("active");
    }
  });
}

// Home View
async function showHome() {
  CameraManager.stopCamera();
  updateNavButtons("home");

  const worker = WorkerManager.cachedWorker || await WorkerManager.getCurrentWorker();

  shell(`
    <div class="hero">
      <div class="hero-content">
        <div class="pill pill-highlight">SIH 2026 • AR-RAKSHAK SAFETY SYSTEM</div>
        <h1>${t("homeTitle")}</h1>
        <p>${t("homeSubtitle")}</p>
        <div class="hero-buttons">
          <button class="btn green" onclick="showTraining()">
            ▶ ${t("startTraining")}
          </button>
          <button class="btn secondary" onclick="showScan()">
            ▣ ${t("scanZone")}
          </button>
        </div>
      </div>
      <div class="hero-art" aria-hidden="true">🦺</div>
    </div>

    <!-- Active Worker Profile Strip -->
    <div class="card worker-strip">
      <div class="worker-strip-info">
        <div class="worker-avatar">👷</div>
        <div>
          <b>${escapeHtml(worker.name)}</b>
          <span class="pill">${escapeHtml(worker.id)}</span>
          <span class="badge ${worker.risk === 'High' ? 'badge-danger' : worker.risk === 'Medium' ? 'badge-warning' : 'badge-success'}">
            Risk: ${escapeHtml(worker.risk || 'Low')}
          </span>
        </div>
      </div>
      <button class="btn secondary btn-sm" onclick="WorkerManager.showWorkerSelectorModal()">
        ${t("switchWorker")}
      </button>
    </div>

    <div class="grid stats-grid">
      <div class="card stat-card">
        <b id="homeScore">${worker.score !== undefined ? worker.score + "%" : "--"}</b>
        <span>${t("safetyScore")}</span>
      </div>
      <div class="card stat-card">
        <b id="homeCompleted">${worker.completed !== undefined ? worker.completed : "--"}</b>
        <span>${t("modulesCompleted")}</span>
      </div>
      <div class="card stat-card">
        <b class="stat-green">✓ Ready</b>
        <span>${t("offlineReady")}</span>
      </div>
      <div class="card stat-card">
        <b>${currentLanguage === 'Hindi' ? 'हिन्दी' : 'English'}</b>
        <span>${t("languageReady")}</span>
      </div>
    </div>

    <div class="section-title">
      <h2>📚 ${t("availableModules")}</h2>
      <button class="btn secondary btn-sm" onclick="showScan()">▣ ${t("scanZone")}</button>
    </div>

    <div id="moduleList"></div>

    <div class="card notice">
      <b>ℹ️ AR Safety Protocol:</b> Live camera view provides contextual visual boundaries on the phone screen for workers before hazardous entry. Always verify PPE physically before entering active mining or press stations.
    </div>
  `);

  TrainingManager.renderModulesList("moduleList");
  loadWorkerStats();
}

async function loadWorkerStats() {
  try {
    const worker = await WorkerManager.getCurrentWorker();
    const scoreEl = document.getElementById("homeScore");
    const compEl = document.getElementById("homeCompleted");
    if (scoreEl && worker) scoreEl.textContent = `${worker.score}%`;
    if (compEl && worker) compEl.textContent = `${worker.completed}`;
  } catch (e) {
    // Graceful offline fallback
  }
}

// Training View
function showTraining() {
  CameraManager.stopCamera();
  updateNavButtons("training");

  shell(`
    <div class="section-title">
      <div>
        <h1>📚 ${t("availableModules")}</h1>
        <p class="muted">Select a module to view safety guidelines, complete the AR inspection, and take the qualification quiz.</p>
      </div>
    </div>
    <div id="trainingModuleList"></div>
  `);

  TrainingManager.renderModulesList("trainingModuleList");
}

// Scan Zone View
function showScan() {
  CameraManager.stopCamera();
  updateNavButtons("scan");

  const modules = TrainingManager.modules || [];

  shell(`
    <div class="section-title">
      <div>
        <h1>▣ ${t("scanTitle")}</h1>
        <p class="muted">${t("scanSubtitle")}</p>
      </div>
    </div>

    <div class="card camera-wrapper">
      <div class="camera-header">
        <h3>QR / Safety Beacon Scanner</h3>
        <span class="badge badge-info" id="scanStatusBadge">Ready</span>
      </div>

      <div class="camera" id="scanViewport">
        <video id="scanVideo" autoplay playsinline muted class="camera-video"></video>
        <div class="ar-overlay">
          <div class="scan-box qr-scan-frame">
            <span class="scan-bracket top-left"></span>
            <span class="scan-bracket top-right"></span>
            <span class="scan-bracket bottom-left"></span>
            <span class="scan-bracket bottom-right"></span>
            <div class="scan-text">
              <b>ALIGN QR CODE</b>
              <small>Safety Marker</small>
            </div>
          </div>
          <div class="overlay-hazard-alert">
            Point camera at zone beacon or select a safety zone below:
          </div>
        </div>
      </div>

      <div class="camera-controls">
        <button class="btn secondary" id="btnToggleScanCam" onclick="toggleScanCamera()">
          🎥 Open Camera Scanner
        </button>
      </div>
    </div>

    <div class="section-title">
      <h3>Quick-Select Demo Safety Zones</h3>
    </div>

    <div class="grid">
      ${modules.map(m => `
        <button class="card zone-select-btn" onclick="TrainingManager.openModule('${escapeHtml(m.id)}')">
          <div class="zone-badge">📍 ${escapeHtml(m.zone)}</div>
          <b>${escapeHtml(m.title)}</b>
          <div class="muted small">${escapeHtml(m.sector)} • ${escapeHtml(m.duration)}</div>
        </button>
      `).join("")}
    </div>
  `);
}

async function toggleScanCamera() {
  const video = document.getElementById("scanVideo");
  const btn = document.getElementById("btnToggleScanCam");
  const badge = document.getElementById("scanStatusBadge");

  if (CameraManager.isCameraActive) {
    CameraManager.stopCamera();
    if (btn) btn.innerHTML = `🎥 Open Camera Scanner`;
    if (badge) { badge.textContent = "Inactive"; badge.className = "badge"; }
    return;
  }

  if (badge) { badge.textContent = "Opening..."; badge.className = "badge badge-warning"; }

  const success = await CameraManager.startCamera(video, (status) => {
    if (status.status === "active") {
      if (badge) { badge.textContent = "Scanner Active"; badge.className = "badge badge-success"; }
      if (btn) btn.innerHTML = `🛑 Stop Camera`;
    } else {
      if (badge) { badge.textContent = "Simulation"; badge.className = "badge badge-info"; }
      if (btn) btn.style.display = "none";
      showToast(status.message, "warning");
    }
  });

  if (!success && btn) {
    btn.innerHTML = `🎥 Open Camera Scanner`;
  }
}

// Report View
function showReport() {
  updateNavButtons("report");
  IncidentManager.renderForm();
}

// Supervisor Admin View
function showAdmin() {
  updateNavButtons("supervisor");
  SupervisorDashboard.render();
}

// Language Toggle
function toggleLang() {
  const newLang = toggleLanguage();
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.textContent = newLang === "English" ? "अ / English" : "A / हिन्दी";
  }
  showToast(`Language set to ${newLang}`, "info");

  // Re-render current view with updated language
  if (currentView === "training") {
    showTraining();
  } else if (currentView === "scan") {
    showScan();
  } else if (currentView === "report") {
    showReport();
  } else if (currentView === "supervisor") {
    showAdmin();
  } else {
    showHome();
  }
}

// Application Startup
async function initApp() {
  updateOnlineStatus();

  // Initialize offline storage
  await StorageLayer.init();

  // Load modules and worker
  await Promise.all([
    TrainingManager.loadModules(),
    WorkerManager.getCurrentWorker()
  ]);

  // Set language toggle button text
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.textContent = currentLanguage === "English" ? "अ / English" : "A / हिन्दी";
  }

  showHome();

  // Register service worker for offline caching if supported
  if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
    try {
      navigator.serviceWorker.register("/sw.js").then(() => {
        console.log("AR-RAKSHAK Service Worker registered.");
      }).catch(err => {
        console.warn("ServiceWorker registration skipped:", err.message);
      });
    } catch (e) {
      // Ignore
    }
  }
}

initApp();
