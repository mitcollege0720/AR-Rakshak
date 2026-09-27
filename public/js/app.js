// AR Rakshak Main Application Controller and Router Integration

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
    if (isOnline) { badge.textContent = `● ${t("online")}`; badge.className = "badge online"; }
    else { badge.textContent = `● ${t("offline")}`; badge.className = "badge offline"; }
  }
  if (isOnline) syncPendingData();
}

window.addEventListener("online", () => { updateOnlineStatus(); syncAllPending(); });
window.addEventListener("offline", updateOnlineStatus);

let isSyncing = false;
async function syncPendingData() {
  if (isSyncing || !navigator.onLine) return;
  isSyncing = true;
  try {
    const queue = await StorageLayer.getPendingSyncs();
    if (queue.length === 0) { isSyncing = false; return; }
    let syncedCount = 0;
    for (const item of queue) {
      try {
        if (item.type === "INCIDENT") { await API.post("/api/incidents", item.payload); await StorageLayer.removeSyncItem(item.id); syncedCount++; }
        else if (item.type === "PROGRESS") { await API.post("/api/progress", item.payload); await StorageLayer.removeSyncItem(item.id); syncedCount++; }
      } catch (err) { console.warn("Item sync postponed:", err.message); }
    }
    if (syncedCount > 0) { showToastMsg(`${syncedCount} offline record(s) synchronized.`, "success"); if (currentView === "home") loadWorkerStats(); }
  } catch (e) { console.error("Sync error:", e); }
  finally { isSyncing = false; }
}

async function syncAllPending() {
  syncPendingData();
  if (typeof GPSManager !== "undefined") GPSManager.syncPendingTracks();
  if (typeof SOSManager !== "undefined") SOSManager.syncPendingSOS();
  if (typeof ChecklistManager !== "undefined") ChecklistManager.syncPending();
}

// Navigation helpers
function updateNavButtons(activeNav) {
  currentView = activeNav;
  document.querySelectorAll(".bottom-nav button").forEach(btn => {
    btn.classList.toggle("active", btn.getAttribute("data-nav") === activeNav);
  });
}

function refreshCurrentView() {
  switch (currentView) {
    case "training": showTraining(); break;
    case "scan": showScan(); break;
    case "report": showReport(); break;
    case "supervisor": showAdmin(); break;
    default: showHome();
  }
}

// === LANDING PAGE ===
function showLanding() {
  CameraManager.stopCamera();
  updateNavButtons("home");
  shell(`
    <div class="landing-hero">
      <div class="brand-mark" style="display:inline-block;margin-bottom:16px;">AR</div>
      <h1>AR Rakshak Safety System</h1>
      <p>AI-Powered Safety and Emergency Response for High-Risk Industries</p>
      <button class="btn green" style="font-size:18px;padding:14px 32px;" onclick="Router.navigate('home')">${t("enterSystem")} →</button>
    </div>
    <div class="landing-features">
      <div class="card landing-feature"><div class="landing-feature-icon">🤖</div><b>AI Assistant</b><p>Voice-guided safety help</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">📡</div><b>Offline GPS</b><p>Track workers anywhere</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">⚠</div><b>Incident Detection</b><p>Report hazards instantly</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">🆘</div><b>One-Tap SOS</b><p>Emergency alerts</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">🚨</div><b>Hazard Reporting</b><p>Works offline</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">📚</div><b>Safety Training</b><p>Interactive modules</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">▤</div><b>Supervisor Center</b><p>Command dashboard</p></div>
      <div class="card landing-feature"><div class="landing-feature-icon">🌐</div><b>Multilingual</b><p>11 languages</p></div>
    </div>
  `);
}

// === HOME / DASHBOARD ===
async function showHome() {
  CameraManager.stopCamera();
  updateNavButtons("home");

  const worker = WorkerManager.cachedWorker || await WorkerManager.getCurrentWorker();
  let stats = { workers: 0, completed: 0, highRisk: 0, openIncidents: 0 };
  let isDemo = true;
  try {
    stats = await API.get("/api/dashboard");
    isDemo = false;
  } catch(e) {}

  shell(`
    <div class="dashboard-hero">
      <h1>AR Rakshak</h1>
      <small>Safety System</small>
      <div class="system-status">🟢 ${t("systemOperational")}</div>
    </div>

    <div class="grid stats-grid">
      <div class="card stat-card">
        <div class="stat-icon">👷</div>
        <b>${stats.workers || 0}</b>
        <span>${t("totalWorkers")}</span>
      </div>
      <div class="card stat-card stat-warning">
        <div class="stat-icon">⚠️</div>
        <b>${stats.openIncidents ?? stats.incidents ?? 0}</b>
        <span>${t("activeHazards")}</span>
      </div>
      <div class="card stat-card stat-danger">
        <div class="stat-icon">🚨</div>
        <b>${stats.highRisk || 0}</b>
        <span>${t("criticalIncidents")}</span>
      </div>
      <div class="card stat-card stat-green">
        <div class="stat-icon">🎓</div>
        <b>${stats.completed || 0}</b>
        <span>${t("trainingCompletion")}</span>
      </div>
    </div>
    ${isDemo ? '<div class="notice"><b>Demo Data:</b> Showing seed data. Register workers and complete training to see real metrics.</div>' : ''}

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
      <button class="btn secondary btn-sm" onclick="WorkerManager.showWorkerSelectorModal()">${t("switchWorker")}</button>
    </div>

    <div class="grid stats-grid">
      <div class="card stat-card"><b id="homeScore">${worker.score !== undefined ? worker.score + "%" : "--"}</b><span>${t("safetyScore")}</span></div>
      <div class="card stat-card"><b id="homeCompleted">${worker.completed !== undefined ? worker.completed : "--"}</b><span>${t("modulesCompleted")}</span></div>
      <div class="card stat-card"><b class="stat-green">✓ Ready</b><span>${t("offlineReady")}</span></div>
      <div class="card stat-card"><b>${SUPPORTED_LANGUAGES.find(l=>l.code===currentLanguage)?.short || "EN"}</b><span>${t("languageReady")}</span></div>
    </div>

    <div class="section-title"><h2>📚 ${t("availableModules")}</h2></div>
    <div id="moduleList"></div>
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
  } catch (e) {}
}

// === TRAINING VIEW ===
function showTraining() {
  CameraManager.stopCamera();
  updateNavButtons("training");
  shell(`<div class="section-title"><div><h1>📚 ${t("availableModules")}</h1><p class="muted">Select a module to view safety guidelines, complete the AR inspection, and take the qualification q[...]
  TrainingManager.renderModulesList("trainingModuleList");
}

// === SCAN VIEW ===
function showScan() {
  CameraManager.stopCamera();
  updateNavButtons("scan");
  const modules = TrainingManager.modules || [];
  shell(`
    <div class="section-title"><div><h1>▣ ${t("scanTitle")}</h1><p class="muted">${t("scanSubtitle")}</p></div></div>
    <div class="card camera-wrapper">
      <div class="camera-header"><h3>QR / Safety Beacon Scanner</h3><span class="badge badge-info" id="scanStatusBadge">Ready</span></div>
      <div class="camera" id="scanViewport">
        <video id="scanVideo" autoplay playsinline muted class="camera-video"></video>
        <div class="ar-overlay">
          <div class="scan-box qr-scan-frame">
            <span class="scan-bracket top-left"></span><span class="scan-bracket top-right"></span>
            <span class="scan-bracket bottom-left"></span><span class="scan-bracket bottom-right"></span>
            <div class="scan-text"><b>ALIGN QR CODE</b><small>Safety Marker</small></div>
          </div>
          <div class="overlay-hazard-alert">Point camera at zone beacon or select a safety zone below:</div>
        </div>
      </div>
      <div class="camera-controls"><button class="btn secondary" id="btnToggleScanCam" onclick="toggleScanCamera()">🎥 Open Camera Scanner</button></div>
    </div>
    <div class="section-title"><h3>Quick-Select Demo Safety Zones</h3></div>
    <div class="grid">
      ${modules.map(m => `<button class="card zone-select-btn" onclick="TrainingManager.openModule('${escapeHtml(m.id)}')"><div class="zone-badge">📍 ${escapeHtml(m.zone)}</div><b>${escapeHtml([...]
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
    if (status.status === "active") { if (badge) { badge.textContent = "Scanner Active"; badge.className = "badge badge-success"; } if (btn) btn.innerHTML = `🛑 Stop Camera`; }
    else { if (badge) { badge.textContent = "Simulation"; badge.className = "badge badge-info"; } if (btn) btn.style.display = "none"; showToastMsg(status.message, "warning"); }
  });
  if (!success && btn) btn.innerHTML = `🎥 Open Camera Scanner`;
}

// === REPORT VIEW ===
function showReport() { updateNavButtons("report"); IncidentManager.renderForm(); }

// === SUPERVISOR VIEW ===
function showAdmin() { updateNavButtons("supervisor"); SupervisorDashboard.render(); }

// === AUTH VIEWS ===
function showLogin() {
  CameraManager.stopCamera();
  updateNavButtons("login");
  shell(`
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="brand-mark">AR</span>
          <h1>AR Rakshak</h1>
          <small>Safety System</small>
        </div>
        <div id="loginError"></div>
        <form onsubmit="handleLogin(event)">
          <label for="loginEmail">${t("email")}</label>
          <input id="loginEmail" type="email" required placeholder="you@example.com" autocomplete="email">
          <label for="loginPassword">${t("password")}</label>
          <input id="loginPassword" type="password" required placeholder="••••••••" autocomplete="current-password">
          <button class="btn full" type="submit" id="btnLogin">${t("signIn")}</button>
        </form>
        <div class="auth-divider">OR</div>
        <button class="btn secondary full" onclick="handleGoogleLogin()" id="btnGoogle">${t("continueWithGoogle")}</button>
        <div class="auth-links">
          <a onclick="Router.navigate('forgot-password')">${t("forgotPassword")}</a>
          <a onclick="Router.navigate('register')">${t("register")}</a>
        </div>
      </div>
    </div>
  `);
}

function showRegister() {
  CameraManager.stopCamera();
  updateNavButtons("register");
  shell(`
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo">
          <span class="brand-mark">AR</span>
          <h1>AR Rakshak</h1>
          <small>Create Account</small>
        </div>
        <div id="regError"></div>
        <form onsubmit="handleRegister(event)">
          <label for="regName">${t("fullName")}</label>
          <input id="regName" type="text" required minlength="2" maxlength="100" placeholder="Full Name">
          <label for="regUsername">${t("username")}</label>
          <input id="regUsername" type="text" required minlength="3" maxlength="50" placeholder="username">
          <label for="regEmail">${t("email")}</label>
          <input id="regEmail" type="email" required placeholder="you@example.com">
          <div class="form-row">
            <div>
              <label for="regPassword">${t("password")}</label>
              <input id="regPassword" type="password" required minlength="8" placeholder="Min 8 characters">
            </div>
            <div>
              <label for="regConfirm">${t("confirmPassword")}</label>
              <input id="regConfirm" type="password" required minlength="8" placeholder="Confirm">
            </div>
          </div>
          <label for="regRole">${t("role")}</label>
          <select id="regRole">
            <option value="worker">${t("roleWorker")}</option>
            <option value="supervisor">${t("roleSupervisor")}</option>
          </select>
          <button class="btn green full" type="submit" id="btnRegister">${t("signUp")}</button>
        </form>
        <div class="auth-links">
          <a onclick="Router.navigate('login')">${t("signIn")}</a>
        </div>
      </div>
    </div>
  `);
}

function showForgotPassword() {
  CameraManager.stopCamera();
  updateNavButtons("forgot-password");
  shell(`
    <div class="auth-container">
      <div class="auth-card">
        <div class="auth-logo"><span class="brand-mark">AR</span><h1>AR Rakshak</h1><small>Reset Password</small></div>
        <div id="fpError"></div>
        <form onsubmit="handleForgotPassword(event)">
          <label for="fpEmail">${t("email")}</label>
          <input id="fpEmail" type="email" required placeholder="you@example.com">
          <button class="btn full" type="submit" id="btnFP">Send Reset Link</button>
        </form>
        <div class="auth-links"><a onclick="Router.navigate('login')">${t("signIn")}</a></div>
      </div>
    </div>
  `);
}

function showProfile() {
  CameraManager.stopCamera();
  updateNavButtons("profile");
  const user = AuthManager.isAuthenticated() ? AuthManager.getUser() : { fullName: "Demo Worker", email: "", role: "worker" };
  shell(`
    <div class="page-header"><h1>👤 ${t("navProfile")}</h1></div>
    <div class="card" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
      <div style="width:64px;height:64px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:32px;">👤</div>
      <div><h2>${escapeHtml(user.fullName || "Worker")}</h2><p class="muted">${escapeHtml(user.email || "")}</p><span class="badge badge-info">${escapeHtml(user.role || "worker")}</span></div>
    </div>
    <div class="card">
      <h3>Account Information</h3>
      <p><b>Username:</b> ${escapeHtml(user.username || "N/A")}</p>
      <p><b>Role:</b> ${escapeHtml(user.role || "worker")}</p>
      <p><b>Language:</b> ${escapeHtml(currentLanguage)}</p>
    </div>
    <div class="card">
      <h3>Quick Actions</h3>
      <button class="btn secondary" onclick="showLanguageSelector()">🌐 Change Language</button>
      <button class="btn secondary" onclick="ThemeManager.toggle()">☾ Toggle Theme</button>
      <button class="btn red" onclick="AuthManager.signOut().then(()=>Router.navigate('login'))">🚪 Logout</button>
    </div>
  `);
}

// === AUTH HANDLERS ===
async function handleLogin(e) {
  e.preventDefault();
  const email = document.getElementById("loginEmail")?.value.trim();
  const password = document.getElementById("loginPassword")?.value;
  const errEl = document.getElementById("loginError");
  const btn = document.getElementById("btnLogin");
  if (btn) { btn.disabled = true; btn.textContent = "Signing in..."; }
  try {
    await AuthManager.signIn(email, password);
    if (errEl) errEl.innerHTML = '';
    showToastMsg("Welcome back!", "success");
    Router.navigate("home");
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="auth-error">${escapeHtml(err.message || "Login failed")}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = t("signIn"); }
  }
}

async function handleRegister(e) {
  e.preventDefault();
  const name = document.getElementById("regName")?.value.trim();
  const username = document.getElementById("regUsername")?.value.trim();
  const email = document.getElementById("regEmail")?.value.trim();
  const password = document.getElementById("regPassword")?.value;
  const confirm = document.getElementById("regConfirm")?.value;
  const role = document.getElementById("regRole")?.value || "worker";
  const errEl = document.getElementById("regError");
  const btn = document.getElementById("btnRegister");
  if (password !== confirm) { if (errEl) errEl.innerHTML = '<div class="auth-error">Passwords do not match</div>'; return; }
  if (password.length < 8) { if (errEl) errEl.innerHTML = '<div class="auth-error">Password must be at least 8 characters</div>'; return; }
  if (btn) { btn.disabled = true; btn.textContent = "Creating account..."; }
  try {
    await AuthManager.signUp(name, username, email, password, role);
    showToastMsg("Account created! Please sign in.", "success");
    Router.navigate("login");
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="auth-error">${escapeHtml(err.message || "Registration failed")}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = t("signUp"); }
  }
}

async function handleGoogleLogin() {
  try { await AuthManager.signInWithGoogle(); }
  catch (err) { showToastMsg(err.message || "Google login failed", "error"); }
}

async function handleForgotPassword(e) {
  e.preventDefault();
  const email = document.getElementById("fpEmail")?.value.trim();
  const errEl = document.getElementById("fpError");
  const btn = document.getElementById("btnFP");
  if (btn) { btn.disabled = true; btn.textContent = "Sending..."; }
  try {
    await AuthManager.resetPassword(email);
    if (errEl) errEl.innerHTML = '<div class="auth-success">Reset link sent. Check your email.</div>';
  } catch (err) {
    if (errEl) errEl.innerHTML = `<div class="auth-error">${escapeHtml(err.message || "Reset failed")}</div>`;
    if (btn) { btn.disabled = false; btn.textContent = "Send Reset Link"; }
  }
}

// Language Toggle
function toggleLang() {
  const newLang = toggleLanguage();
  const langBtn = document.getElementById("langToggleBtn");
  if (langBtn) {
    langBtn.textContent = newLang === "English" ? "अ / English" : "A / हिन्दी";
  }
  showToast(`Language set to ${newLang}`, "info");

  // Re-render whatever view is currently active with the updated language
  refreshCurrentView();
}

// === UPDATE USER MENU ===
function updateUserMenu() {
  const menu = document.getElementById("userMenu");
  const nameEl = document.getElementById("userMenuName");
  const roleEl = document.getElementById("userMenuRole");
  const navSup = document.getElementById("navSupervisor");
  if (AuthManager.isAuthenticated()) {
    const user = AuthManager.getUser();
    if (menu) menu.style.display = "block";
    if (nameEl) nameEl.textContent = `👤 ${user.fullName || "User"}`;
    if (roleEl) roleEl.textContent = user.role || "worker";
    if (navSup) navSup.style.display = AuthManager.isSupervisor() ? "flex" : "none";
  } else {
    if (menu) menu.style.display = "none";
    if (navSup) navSup.style.display = "none";
  }
}

// === ROUTE REGISTRATION ===
function registerRoutes() {
  Router.register("home", () => showHome());
  Router.register("training", () => showTraining());
  Router.register("scan", () => showScan());
  Router.register("report", () => showReport());
  Router.register("supervisor", () => { if (AuthManager.isSupervisor()) showAdmin(); else Router.navigate("home"); });
  Router.register("gps", () => GPSManager.renderView());
  Router.register("sos", () => SOSManager.renderView());
  Router.register("assistant", () => RakshakAssistant.renderView());
  Router.register("checklist", () => ChecklistManager.renderView());
  Router.register("passport", () => PassportManager.renderView());
  Router.register("simulator", () => SimulatorManager.renderView());
  Router.register("analytics", () => { if (AuthManager.isSupervisor()) AnalyticsManager.renderView(); else Router.navigate("home"); });
  Router.register("login", () => showLogin());
  Router.register("register", () => showRegister());
  Router.register("forgot-password", () => showForgotPassword());
  Router.register("profile", () => showProfile());
  Router.register("landing", () => showLanding());
}

// === APP INIT ===
async function initApp() {
  try {
    ThemeManager.init();
    updateOnlineStatus();
    await StorageLayer.init();

    // Load modules and worker in parallel — these have graceful fallbacks
    await Promise.all([
      TrainingManager.loadModules().catch(() => {}),
      WorkerManager.getCurrentWorker().catch(() => {})
    ]);

    if (typeof GPSManager !== "undefined") GPSManager.init();
    if (typeof ChecklistManager !== "undefined") ChecklistManager.init();
    if (typeof RakshakAssistant !== "undefined") RakshakAssistant.init();

    await AuthManager.init().catch(() => {});

    AuthManager.onAuthChange = (event) => {
      updateUserMenu();
      if (event === "SIGNED_IN" || event === "INITIAL_SESSION") {
        const r = Router.getCurrentRoute();
        if (r === "login" || r === "register" || r === "forgot-password" || r === "landing") {
          Router.navigate("home");
        }
      }
    };
    updateUserMenu();

    registerRoutes();

    const langBtn = document.getElementById("langToggleBtn");
    if (langBtn) { const l = SUPPORTED_LANGUAGES.find(l => l.code === currentLanguage); langBtn.textContent = l ? l.short : "EN"; }

    // Initialize router - all protection logic is handled by individual route handlers
    Router.init();

    if ("serviceWorker" in navigator && window.location.protocol.startsWith("http")) {
      navigator.serviceWorker.register("/sw.js").then(() => console.log("AR Rakshak Service Worker registered.")).catch(err => console.warn("ServiceWorker skipped:", err.message));
    }
  } catch (err) {
    console.error("AR Rakshak init error:", err);
    // Render a fallback so the screen is never blank
    if (appEl) {
      appEl.innerHTML = `<div class="container"><div class="card error-card" role="alert"><h2>Unable to start AR Rakshak</h2><p class="muted">${escapeHtml(err.message || "Unknown error")}</p><button class="btn" onclick="location.reload()">Retry</button></div></div>`;
    }
  }
}

// Global error handler to prevent blank screens from uncaught errors
window.addEventListener("error", (e) => {
  console.error("Uncaught error:", e.error || e.message);
});

window.addEventListener("unhandledrejection", (e) => {
  console.error("Unhandled promise rejection:", e.reason);
});

initApp();
