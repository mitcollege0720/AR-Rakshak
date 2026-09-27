// AR Rakshak Digital Safety Passport - Worker Profile, Certificates, Progress
const PassportManager = {
  async renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    renderLoading(el, "Loading your Safety Passport...");
    try {
      const [certs, achievements, simProgress] = await Promise.all([this.getCerts(), this.getAchievements(), this.getSimProgress()]);
      const user = AuthManager.isAuthenticated() ? AuthManager.getUser() : WorkerManager.cachedWorker || { fullName: "Demo Worker", id: "W001" };
      const xp = achievements.reduce((s, a) => s + (a.xp_value || 0), 0);
      const completed = simProgress.filter(s => s.completed).length;
      el.innerHTML = `<div class="container">
        <div class="page-header"><h1>🛂 Safety Passport</h1><p class="muted">Your digital safety identity, training records, and certifications.</p></div>
        <div class="card" style="display:flex;align-items:center;gap:20px;flex-wrap:wrap;">
          <div style="width:64px;height:64px;border-radius:50%;background:var(--blue);display:flex;align-items:center;justify-content:center;font-size:32px;">👷</div>
          <div style="flex:1;"><h2>${escapeHtml(user.fullName || user.name || "Worker")}</h2><p class="muted">${escapeHtml(user.email || user.id || "")}</p>
            <div style="display:flex;gap:8px;flex-wrap:wrap;margin-top:4px;"><span class="badge badge-info">${escapeHtml(user.role || "Worker")}</span><span class="badge badge-success">${certs.length} Certificates</span><span class="badge badge-warning">${xp} XP</span></div>
          </div>
        </div>
        <div class="grid stats-grid">
          <div class="card stat-card"><b>${completed}</b><span>Simulations</span></div>
          <div class="card stat-card"><b>${certs.length}</b><span>Certificates</span></div>
          <div class="card stat-card"><b>${achievements.length}</b><span>Achievements</span></div>
          <div class="card stat-card"><b>${xp}</b><span>Total XP</span></div>
        </div>
        <div class="card"><h3>📜 Certificates & Training Records</h3>${certs.length === 0 ? '<p class="muted">No certificates earned yet. Complete training modules to earn certificates.</p>' : `<div>${certs.map(c => this.renderCertItem(c)).join("")}</div>`}</div>
        <div class="card"><h3>🏆 Achievements & Badges</h3>${achievements.length === 0 ? '<p class="muted">No achievements earned yet.</p>' : `<div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(200px,1fr));">${achievements.map(a => `<div style="display:flex;align-items:center;gap:12px;padding:12px;background:var(--bg-card);border-radius:8px;"><div style="font-size:28px;">🏆</div><div><b>${escapeHtml(a.achievement_name)}</b><br><span class="muted small">+${a.xp_value} XP</span></div></div>`).join("")}</div>`}</div>
        <div class="card"><h3>📊 Training Progress</h3>${simProgress.length === 0 ? '<p class="muted">No training simulations completed yet.</p>' : simProgress.map(s => `<div style="margin-bottom:12px;"><div style="display:flex;justify-content:space-between;margin-bottom:4px;"><b>${escapeHtml(s.scenario_name)}</b><span class="badge ${s.completed ? 'badge-success' : 'badge-warning'} small">${s.completed ? 'Completed' : 'In Progress'}</span></div><div class="progress"><div style="width:${s.safety_score}%"></div></div><span class="muted small">Score: ${s.safety_score}% • ${escapeHtml(s.difficulty)}</span></div>`).join("")}</div>
      </div>`;
    } catch(e) { renderErrorState(el, "Failed to load Safety Passport.", () => PassportManager.renderView()); }
  },

  renderCertItem(cert) {
    const exp = new Date(cert.expires_at || cert.issued_at);
    const days = Math.ceil((exp - new Date()) / (1000*60*60*24));
    const expired = days <= 0, soon = days <= 30 && days > 0;
    return `<div style="padding:12px;border:1px solid var(--border);border-radius:8px;margin-bottom:8px;${expired ? 'border-color:var(--red);' : soon ? 'border-color:var(--orange);' : ''}"><div style="display:flex;justify-content:space-between;align-items:center;flex-wrap:wrap;gap:8px;"><div><b>${escapeHtml(cert.module_name)}</b><br><span class="muted small">ID: ${escapeHtml(cert.certificate_id)}</span></div><div>${expired ? '<span class="badge badge-danger">Expired</span>' : soon ? `<span class="badge badge-warning">Expires in ${days} days</span>` : '<span class="badge badge-success">Valid</span>'}</div></div><div style="margin-top:4px;"><span class="muted small">Score: ${cert.score}% • Issued: ${new Date(cert.issued_at).toLocaleDateString()} • Expires: ${exp.toLocaleDateString()}</span></div></div>`;
  },

  async getCerts() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("training_certificates").select("*").eq("user_id", AuthManager.user.id).order("issued_at", { ascending: false }); return data || []; } catch(e) {} } return []; },
  async getAchievements() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("safety_achievements").select("*").eq("user_id", AuthManager.user.id).order("earned_at", { ascending: false }); return data || []; } catch(e) {} } return []; },
  async getSimProgress() { if (supabase && AuthManager.isAuthenticated()) { try { const { data } = await supabase.from("simulator_progress").select("*").eq("user_id", AuthManager.user.id).order("created_at", { ascending: false }); return data || []; } catch(e) {} } try { return JSON.parse(localStorage.getItem("arr_simulator_progress") || "[]"); } catch(e) { return []; } }
};
window.PassportManager = PassportManager;
