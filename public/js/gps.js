// AR Rakshak GPS Tracker - Offline-First GPS/GNSS Tracking
const GPSManager = {
  watchId: null, isTracking: false, currentPos: null, trackHistory: [], lastUpdate: null, syncStatus: "idle",
  STORAGE_KEY: "arr_gps_queue",

  init() {
    try { this.trackHistory = JSON.parse(localStorage.getItem(this.STORAGE_KEY) || "[]"); } catch(e) { this.trackHistory = []; }
    if (navigator.onLine) this.syncPendingTracks();
    window.addEventListener("online", () => this.syncPendingTracks());
  },

  isSupported() { return !!navigator.geolocation; },

  startTracking() {
    if (!this.isSupported()) { showToastMsg("GPS is not supported on this device.", "error"); return false; }
    if (this.isTracking) return true;
    this.watchId = navigator.geolocation.watchPosition(p => this.handlePosition(p), e => this.handleError(e), { enableHighAccuracy: true, maximumAge: 5000, timeout: 15000 });
    this.isTracking = true;
    return true;
  },

  stopTracking() {
    if (this.watchId !== null) { navigator.geolocation.clearWatch(this.watchId); this.watchId = null; }
    this.isTracking = false;
  },

  handlePosition(pos) {
    const { latitude, longitude, altitude, accuracy, heading, speed } = pos.coords;
    this.currentPos = { latitude, longitude, altitude, accuracy, heading, speed };
    this.lastUpdate = new Date().toISOString();
    const pt = { latitude, longitude, altitude, accuracy, heading, speed, recorded_at: this.lastUpdate, synced: false, sync_id: "GPS_" + Date.now() + "_" + Math.random().toString(36).slice(2,8) };
    this.trackHistory.push(pt);
    this.saveLocalQueue();
    this.updateUI();
    if (navigator.onLine && supabase && AuthManager.isAuthenticated()) this.uploadTrack(pt);
  },

  handleError(err) {
    let msg = "GPS error occurred.";
    if (err.code === 1) msg = "Location permission denied. Enable location access in browser settings.";
    else if (err.code === 2) msg = "Position unavailable. Check GPS settings.";
    else if (err.code === 3) msg = "GPS request timed out.";
    showToastMsg(msg, "error");
  },

  saveLocalQueue() {
    try { localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.trackHistory.filter(t => !t.synced))); } catch(e) {}
  },

  async uploadTrack(pt) {
    if (!supabase || !AuthManager.isAuthenticated()) return;
    try {
      const { error } = await supabase.from("gps_tracks").insert({ user_id: AuthManager.user.id, latitude: pt.latitude, longitude: pt.longitude, altitude: pt.altitude, accuracy: pt.accuracy, heading: pt.heading, speed: pt.speed, recorded_at: pt.recorded_at, synced: true, sync_id: pt.sync_id });
      if (!error) { pt.synced = true; this.saveLocalQueue(); this.syncStatus = "synced"; }
    } catch(e) { this.syncStatus = "pending"; }
  },

  async syncPendingTracks() {
    if (!supabase || !AuthManager.isAuthenticated()) return;
    const pending = this.trackHistory.filter(t => !t.synced);
    if (pending.length === 0) { this.syncStatus = "synced"; return; }
    this.syncStatus = "syncing";
    let synced = 0;
    for (const t of pending) {
      try {
        const { error } = await supabase.from("gps_tracks").insert({ user_id: AuthManager.user.id, latitude: t.latitude, longitude: t.longitude, altitude: t.altitude, accuracy: t.accuracy, heading: t.heading, speed: t.speed, recorded_at: t.recorded_at, synced: true, sync_id: t.sync_id });
        if (!error) { t.synced = true; synced++; }
      } catch(e) {}
    }
    this.saveLocalQueue();
    this.syncStatus = synced > 0 ? "synced" : "pending";
    if (synced > 0) showToastMsg(`${synced} GPS point(s) synchronized.`, "success");
  },

  updateUI() {
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    if (this.currentPos) {
      set("gpsLat", this.currentPos.latitude.toFixed(6));
      set("gpsLon", this.currentPos.longitude.toFixed(6));
      set("gpsSpeed", this.currentPos.speed != null ? `${this.currentPos.speed.toFixed(1)} m/s` : "N/A");
      set("gpsHeading", this.currentPos.heading != null ? `${this.currentPos.heading.toFixed(0)}°` : "N/A");
      set("gpsAltitude", this.currentPos.altitude != null ? `${this.currentPos.altitude.toFixed(1)} m` : "N/A");
      set("gpsAccuracy", this.currentPos.accuracy != null ? `±${this.currentPos.accuracy.toFixed(0)} m` : "N/A");
      set("gpsTimestamp", new Date(this.lastUpdate).toLocaleTimeString());
    }
    const st = document.getElementById("gpsTrackingStatus");
    if (st) { st.textContent = this.isTracking ? (navigator.onLine ? "Tracking Active" : "Offline Tracking Active") : "Tracking Stopped"; st.className = "badge " + (this.isTracking ? "badge-success" : "badge-muted"); }
    const ss = document.getElementById("gpsSyncStatus");
    if (ss) {
      if (this.syncStatus === "synced") { ss.textContent = "All data synced"; ss.className = "badge badge-success"; }
      else if (this.syncStatus === "syncing") { ss.textContent = "Syncing..."; ss.className = "badge badge-warning"; }
      else { ss.textContent = `${this.trackHistory.filter(t => !t.synced).length} pending`; ss.className = "badge badge-warning"; }
    }
  },

  renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    el.innerHTML = `<div class="container">
      <div class="page-header"><h1>📡 GPS Tracker</h1><p class="muted">Offline-first location tracking with automatic synchronization.</p></div>
      <div class="card">
        <div style="display:flex;align-items:center;justify-content:space-between;flex-wrap:wrap;gap:12px;">
          <div>
            <h3 id="gpsTrackingStatus">${this.isTracking ? (navigator.onLine ? "Tracking Active" : "Offline Tracking Active") : "Tracking Stopped"}</h3>
            <span id="gpsSyncStatus" class="badge ${this.syncStatus === 'synced' ? 'badge-success' : 'badge-warning'}">${this.syncStatus === 'synced' ? 'All data synced' : this.trackHistory.filter(t => !t.synced).length + ' pending'}</span>
          </div>
          <button class="btn ${this.isTracking ? 'red' : 'green'}" onclick="GPSManager.toggleTracking()">${this.isTracking ? '⏹ Stop' : '▶ Start Tracking'}</button>
        </div>
      </div>
      <div class="card">
        <h3>Current Location</h3>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(140px,1fr));">
          <div class="stat-card"><b id="gpsLat">${this.currentPos ? this.currentPos.latitude.toFixed(6) : '—'}</b><span>Latitude</span></div>
          <div class="stat-card"><b id="gpsLon">${this.currentPos ? this.currentPos.longitude.toFixed(6) : '—'}</b><span>Longitude</span></div>
          <div class="stat-card"><b id="gpsSpeed">${this.currentPos && this.currentPos.speed != null ? this.currentPos.speed.toFixed(1)+' m/s' : 'N/A'}</b><span>Speed</span></div>
          <div class="stat-card"><b id="gpsHeading">${this.currentPos && this.currentPos.heading != null ? this.currentPos.heading.toFixed(0)+'°' : 'N/A'}</b><span>Heading</span></div>
          <div class="stat-card"><b id="gpsAltitude">${this.currentPos && this.currentPos.altitude != null ? this.currentPos.altitude.toFixed(1)+' m' : 'N/A'}</b><span>Altitude</span></div>
          <div class="stat-card"><b id="gpsAccuracy">${this.currentPos && this.currentPos.accuracy != null ? '±'+this.currentPos.accuracy.toFixed(0)+' m' : 'N/A'}</b><span>Accuracy</span></div>
        </div>
        <p class="muted" style="margin-top:12px;">Last update: <b id="gpsTimestamp">${this.lastUpdate ? new Date(this.lastUpdate).toLocaleTimeString() : 'Never'}</b> • Network: <b class="${navigator.onLine ? 'text-success' : 'text-warning'}">${navigator.onLine ? 'ONLINE' : 'OFFLINE'}</b></p>
      </div>
      <div class="card">
        <h3>Route Map</h3>
        <div id="gpsMapContainer" style="height:200px;background:var(--bg-card);border-radius:12px;display:flex;align-items:center;justify-content:center;border:1px solid var(--border);">
          <span class="muted">${this.isTracking ? 'Recording route...' : 'Start tracking to view route'}</span>
        </div>
        <p class="muted small" style="margin-top:8px;">Points recorded: <b>${this.trackHistory.length}</b> • Pending sync: <b>${this.trackHistory.filter(t => !t.synced).length}</b></p>
      </div>
      <div class="card">
        <h3>Recent Track History</h3>
        <div id="gpsHistoryList">${this.renderHistory()}</div>
      </div>
    </div>`;
    this.renderMap();
  },

  renderHistory() {
    const r = this.trackHistory.slice(-10).reverse();
    if (!r.length) return '<p class="muted">No track points recorded yet.</p>';
    return r.map(t => `<div style="display:flex;justify-content:space-between;padding:8px 0;border-bottom:1px solid var(--border);"><span class="muted small">${new Date(t.recorded_at).toLocaleTimeString()}</span><span class="small">${t.latitude.toFixed(4)}, ${t.longitude.toFixed(4)}</span><span class="badge ${t.synced ? 'badge-success' : 'badge-warning'} small">${t.synced ? 'Synced' : 'Pending'}</span></div>`).join("");
  },

  renderMap() {
    const c = document.getElementById("gpsMapContainer");
    if (!c) return;
    const pts = this.trackHistory.slice(-50);
    if (pts.length < 2) return;
    const lats = pts.map(p => p.latitude), lons = pts.map(p => p.longitude);
    const minLat = Math.min(...lats), maxLat = Math.max(...lats), minLon = Math.min(...lons), maxLon = Math.max(...lons);
    const latR = maxLat - minLat || 0.001, lonR = maxLon - minLon || 0.001;
    const norm = (la, lo) => ({ x: ((lo - minLon) / lonR) * 90 + 5, y: 95 - (((la - minLat) / latR) * 90 + 5) });
    const path = pts.map((p, i) => { const pt = norm(p.latitude, p.longitude); return `${i === 0 ? 'M' : 'L'} ${pt.x.toFixed(1)} ${pt.y.toFixed(1)}`; }).join(" ");
    const last = norm(pts[pts.length-1].latitude, pts[pts.length-1].longitude);
    c.innerHTML = `<svg viewBox="0 0 100 100" preserveAspectRatio="xMidYMid meet" style="width:100%;height:100%;"><path d="${path}" fill="none" stroke="var(--blue)" stroke-width="1.5" stroke-linejoin="round"/><circle cx="${last.x}" cy="${last.y}" r="3" fill="var(--red)"/></svg>`;
  },

  toggleTracking() { if (this.isTracking) this.stopTracking(); else this.startTracking(); this.renderView(); }
};
window.GPSManager = GPSManager;
