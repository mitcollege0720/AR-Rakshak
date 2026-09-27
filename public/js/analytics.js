// AR Rakshak Safety Analytics - Charts and Statistics Dashboard
const AnalyticsManager = {
  async renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    renderLoading(el, "Loading safety analytics...");
    try {
      const [incidents, workers, certs, simProgress, checklists, sosEvents] = await Promise.all([this.getIncidents(), this.getWorkers(), this.getCerts(), this.getSimProgress(), this.getChecklists(), this.getSOS()]);
      const s = this.calc(incidents, workers, certs, simProgress, checklists, sosEvents);
      el.innerHTML = `<div class="container">
        <div class="page-header"><h1>📈 Safety Analytics</h1><p class="muted">Safety intelligence dashboard based on actual application data.</p></div>
        <div class="grid stats-grid">
          <div class="card stat-card"><b>${s.totalInc}</b><span>Total Incidents</span></div>
          <div class="card stat-card stat-warning"><b>${s.openInc}</b><span>Open Incidents</span></div>
          <div class="card stat-card stat-danger"><b>${s.critInc}</b><span>Critical</span></div>
          <div class="card stat-card stat-green"><b>${s.resInc}</b><span>Resolved</span></div>
        </div>
        <div class="card"><h3>📊 Incidents by Category</h3>${this.barChart(s.byCategory)}</div>
        <div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(300px,1fr));">
          <div class="card"><h3>📍 Incidents by Zone</h3>${this.barChart(s.byZone)}</div>
          <div class="card"><h3>⚠️ Incidents by Severity</h3>${this.barChart(s.bySeverity)}</div>
        </div>
        <div class="card"><h3>🎓 Training & Safety Overview</h3>
          <div style="display:grid;gap:8px;">
            <div style="display:flex;justify-content:space-between;"><span>Total Workers</span><b>${s.workers}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Training Completions</span><b>${s.completions}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Certificates Issued</span><b>${s.certs}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Simulator Sessions</span><b>${s.simSessions}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Avg Simulator Score</span><b>${s.avgSim}%</b></div>
            <div style="display:flex;justify-content:space-between;"><span>Checklists Submitted</span><b>${s.checklists}</b></div>
            <div style="display:flex;justify-content:space-between;"><span>SOS Events</span><b>${s.sos}</b></div>
          </div>
        </div>
        <div class="card"><h3>🏆 Simulator Performance by Scenario</h3>${s.simByScenario.length === 0 ? '<p class="muted">No simulator data available yet.</p>' : s.simByScenario.map(sc => `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><span>${escapeHtml(sc.name)}</span><b>${sc.avgScore}%</b></div><div class="progress"><div style="width:${sc.avgScore}%"></div></div></div>`).join("")}</div>
        <div class="card"><p class="muted small">All analytics are computed from actual application data. No statistics are manufactured or estimated.</p></div>
      </div>`;
    } catch(e) { renderErrorState(el, "Failed to load analytics.", () => AnalyticsManager.renderView()); }
  },

  calc(inc, workers, certs, sim, chk, sos) {
    const byCategory = {}, byZone = {}, bySeverity = {};
    inc.forEach(i => { byCategory[i.type] = (byCategory[i.type]||0)+1; byZone[i.location] = (byZone[i.location]||0)+1; bySeverity[i.severity] = (bySeverity[i.severity]||0)+1; });
    const simBy = {};
    sim.forEach(s => { if (!simBy[s.scenario_name]) simBy[s.scenario_name] = { name: s.scenario_name, scores: [] }; simBy[s.scenario_name].scores.push(s.safety_score); });
    const simByScenario = Object.values(simBy).map(s => ({ name: s.name, avgScore: s.scores.length > 0 ? Math.round(s.scores.reduce((a,b)=>a+b,0)/s.scores.length) : 0 }));
    return { totalInc: inc.length, openInc: inc.filter(i => i.status === "Open" || i.status === "New").length, critInc: inc.filter(i => i.severity === "Critical" || i.severity === "High").length, resInc: inc.filter(i => i.status === "Resolved").length, byCategory, byZone, bySeverity, workers: workers.length, completions: workers.reduce((a,w) => a + (w.completed||0), 0), certs: certs.length, simSessions: sim.length, avgSim: sim.length > 0 ? Math.round(sim.reduce((a,s)=>a+s.safety_score,0)/sim.length) : 0, checklists: chk.length, sos: sos.length, simByScenario };
  },

  barChart(data) {
    const entries = Object.entries(data);
    if (!entries.length) return '<p class="muted">No data available.</p>';
    const max = Math.max(...entries.map(e => e[1]));
    return `<div>${entries.map(([label, val]) => { const pct = max > 0 ? Math.round((val/max)*100) : 0; return `<div style="display:flex;align-items:center;gap:8px;margin-bottom:6px;"><span style="width:120px;font-size:13px;">${escapeHtml(label)}</span><div style="flex:1;height:24px;background:var(--bg-card);border-radius:4px;overflow:hidden;"><div style="height:100%;width:${pct}%;background:var(--blue);border-radius:4px;transition:width 0.3s;"></div></div><b style="width:30px;">${val}</b></div>`; }).join("")}</div>`;
  },

  async getIncidents() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("incidents").select("*"); if (data && data.length) return data; } catch(e) {} } try { return await API.get("/api/incidents"); } catch(e) { return []; } },
  async getWorkers() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("profiles").select("*"); if (data && data.length) return data; } catch(e) {} } try { return await API.get("/api/workers"); } catch(e) { return []; } },
  async getCerts() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("training_certificates").select("*"); return data || []; } catch(e) {} } return []; },
  async getSimProgress() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("simulator_progress").select("*"); return data || []; } catch(e) {} } try { return JSON.parse(localStorage.getItem("arr_simulator_progress") || "[]"); } catch(e) { return []; } },
  async getChecklists() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("safety_checklists").select("*"); return data || []; } catch(e) {} } try { return JSON.parse(localStorage.getItem("arr_checklist_history") || "[]"); } catch(e) { return []; } },
  async getSOS() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("sos_events").select("*"); return data || []; } catch(e) {} } try { return JSON.parse(localStorage.getItem("arr_sos_queue") || "[]"); } catch(e) { return []; } }
};
window.AnalyticsManager = AnalyticsManager;
