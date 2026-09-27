// AR Rakshak SOS Manager - One-Tap Emergency with GPS Capture
const SOSManager = {
  isConfirming: false, isSending: false, countdownInterval: null, countdownSeconds: 3,

  renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    el.innerHTML = `<div class="container">
      <div class="page-header"><h1>🆘 Emergency SOS</h1><p class="muted">One-tap emergency alert with GPS location capture.</p></div>
      <div class="card" style="text-align:center;padding:40px;">
        <button class="sos-button ${this.isConfirming ? 'confirming' : ''}" onclick="SOSManager.handleSOSPress()" aria-label="Emergency SOS">
          ${this.isConfirming ? `<span id="sosCountdown">${this.countdownSeconds}</span>` : '🆘'}
        </button>
        <p style="margin-top:16px;">${this.isConfirming ? 'Press again to CANCEL' : 'Press and hold to activate SOS'}</p>
      </div>
      <div class="card">
        <h3>What happens when SOS is activated?</h3>
        <ol style="padding-left:20px;line-height:2;">
          <li>Your current GPS location is captured immediately.</li>
          <li>An emergency event is created with timestamp and device info.</li>
          <li>If online, your supervisor is notified instantly.</li>
          <li>If offline, the event is stored locally and syncs automatically.</li>
          <li>Verified emergency guidance is displayed on screen.</li>
        </ol>
        <div class="notice"><b>⚠️ Important:</b> SOS should only be used in genuine emergencies.</div>
      </div>
      <div class="card"><h3>Recent SOS Events</h3><div id="sosHistoryList"><p class="muted">Loading recent events...</p></div></div>
    </div>`;
    this.loadHistory();
  },

  handleSOSPress() {
    if (this.isSending) return;
    if (!this.isConfirming) {
      this.isConfirming = true; this.countdownSeconds = 3; this.renderView(); this.startCountdown();
    } else { this.cancelSOS(); }
  },

  startCountdown() {
    this.countdownInterval = setInterval(() => {
      this.countdownSeconds--;
      const el = document.getElementById("sosCountdown");
      if (el) el.textContent = this.countdownSeconds;
      if (this.countdownSeconds <= 0) { clearInterval(this.countdownInterval); this.activateSOS(); }
    }, 1000);
  },

  cancelSOS() {
    clearInterval(this.countdownInterval);
    this.isConfirming = false; this.countdownSeconds = 3;
    this.renderView();
    showToastMsg("SOS cancelled.", "info");
  },

  async activateSOS() {
    this.isConfirming = false; this.isSending = true;
    let loc = null;
    try { loc = await this.getCurrentLocation(); } catch(e) { console.warn("GPS capture failed:", e.message); }
    const evt = { latitude: loc?.latitude || null, longitude: loc?.longitude || null, altitude: loc?.altitude || null, accuracy: loc?.accuracy || null, device_info: { userAgent: navigator.userAgent, platform: navigator.platform, online: navigator.onLine, timestamp: new Date().toISOString() }, created_at: new Date().toISOString(), status: "active", synced: false };
    let offline = !navigator.onLine;
    if (!offline && supabase && AuthManager.isAuthenticated()) {
      try {
        const { data } = await supabase.from("sos_events").insert({ user_id: AuthManager.user.id, latitude: evt.latitude, longitude: evt.longitude, altitude: evt.altitude, accuracy: evt.accuracy, status: "active", device_info: evt.device_info }).select().maybeSingle();
        if (data) { evt.synced = true; evt.id = data.id; }
      } catch(e) { offline = true; }
    }
    if (offline) {
      evt.localId = "SOS_LOCAL_" + Date.now();
      try { const q = JSON.parse(localStorage.getItem("arr_sos_queue") || "[]"); q.push(evt); localStorage.setItem("arr_sos_queue", JSON.stringify(q)); } catch(e) {}
    }
    this.isSending = false;
    this.showResult(evt, offline);
  },

  showResult(evt, offline) {
    const el = document.getElementById("app");
    if (!el) return;
    el.innerHTML = `<div class="container">
      <div class="card" style="text-align:center;padding:32px;">
        <div style="font-size:48px;">🆘</div>
        <h1>SOS Activated</h1>
        <p class="muted">${offline ? "Your emergency event is stored locally. Your supervisor will be notified when connection returns." : "Your supervisor has been notified of this emergency."}</p>
        <div style="text-align:left;margin:20px 0;">
          <p><b>Timestamp:</b> ${new Date(evt.created_at).toLocaleString()}</p>
          ${evt.latitude ? `<p><b>Location:</b> ${evt.latitude.toFixed(6)}, ${evt.longitude.toFixed(6)}</p>` : `<p><b>Location:</b> GPS unavailable</p>`}
          <p><b>Status:</b> <span class="badge badge-danger">ACTIVE — Awaiting response</span></p>
          <p><b>Sync:</b> <span class="badge ${evt.synced ? 'badge-success' : 'badge-warning'}">${evt.synced ? 'Sent to server' : 'Stored locally'}</span></p>
        </div>
        <div class="card" style="background:var(--bg-card);margin:16px 0;">
          <h3>Emergency Guidance</h3>
          <p>1. Move to a safe location if possible.</p>
          <p>2. Wait for supervisor response.</p>
          <p>3. If in immediate danger, call site emergency number.</p>
          <p>4. Do not move if injured — wait for help.</p>
          <p class="muted small" style="margin-top:8px;">These are general safety guidelines. Always follow your site-specific emergency procedures and supervisor instructions.</p>
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn" onclick="SOSManager.renderView()">Back to SOS</button>
          <button class="btn secondary" onclick="Router.navigate('home')">Return Home</button>
        </div>
      </div>
    </div>`;
  },

  getCurrentLocation() {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) { reject(new Error("GPS not supported")); return; }
      navigator.geolocation.getCurrentPosition(p => resolve(p.coords), e => reject(e), { enableHighAccuracy: true, timeout: 10000, maximumAge: 0 });
    });
  },

  async loadHistory() {
    const el = document.getElementById("sosHistoryList");
    if (!el) return;
    let events = [];
    if (supabase && AuthManager.isAuthenticated()) {
      try { const { data } = await supabase.from("sos_events").select("*").order("created_at", { ascending: false }).limit(10); events = data || []; } catch(e) {}
    }
    try { events = [...events, ...JSON.parse(localStorage.getItem("arr_sos_queue") || "[]")]; } catch(e) {}
    if (!events.length) { el.innerHTML = '<p class="muted">No SOS events recorded.</p>'; return; }
    el.innerHTML = events.map(e => `<div style="padding:8px 0;border-bottom:1px solid var(--border);"><span class="badge ${e.status === 'active' ? 'badge-danger' : e.status === 'acknowledged' ? 'badge-warning' : 'badge-success'}">${e.status || 'active'}</span> <span class="muted small">${new Date(e.created_at).toLocaleString()}</span> ${e.latitude ? `<span class="muted small">📍 ${e.latitude.toFixed(4)}, ${e.longitude.toFixed(4)}</span>` : '<span class="muted small">📍 GPS unavailable</span>'}</div>`).join("");
  },

  async syncPendingSOS() {
    if (!supabase || !AuthManager.isAuthenticated()) return;
    try {
      const q = JSON.parse(localStorage.getItem("arr_sos_queue") || "[]");
      if (!q.length) return;
      let synced = 0;
      for (const e of q) {
        try { const { error } = await supabase.from("sos_events").insert({ user_id: AuthManager.user.id, latitude: e.latitude, longitude: e.longitude, altitude: e.altitude, accuracy: e.accuracy, status: e.status || "active", device_info: e.device_info || {} }); if (!error) synced++; } catch(e) {}
      }
      if (synced > 0) { localStorage.setItem("arr_sos_queue", "[]"); showToastMsg(`${synced} SOS event(s) synchronized.`, "success"); }
    } catch(e) {}
  }
};
window.SOSManager = SOSManager;
