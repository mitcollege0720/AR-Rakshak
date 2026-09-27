// AR Rakshak Digital Safety Checklist - Pre-Shift Safety Check
const ChecklistManager = {
  items: [
    { id: "helmet", label: "Helmet", icon: "⛑️", required: true },
    { id: "safety_shoes", label: "Safety Shoes", icon: "🥾", required: true },
    { id: "ppe", label: "Required PPE (Vest, Gloves, Eye Protection)", icon: "🦺", required: true },
    { id: "gas_detector", label: "Gas Detector (if applicable)", icon: "📡", required: false },
    { id: "comm_device", label: "Communication Device / Radio", icon: "📻", required: true },
    { id: "emergency_kit", label: "Emergency Equipment / First Aid Kit", icon: "🩹", required: true },
    { id: "work_area", label: "Work Area Inspection Completed", icon: "🔍", required: true },
    { id: "equipment", label: "Equipment Inspection Completed", icon: "⚙️", required: true },
    { id: "evacuation", label: "Evacuation Route Known", icon: "🚪", required: true },
    { id: "supervisor_briefed", label: "Supervisor Briefed on Shift Plan", icon: "📋", required: false }
  ],
  completed: {}, isSubmitting: false, history: [],

  init() { try { this.history = JSON.parse(localStorage.getItem("arr_checklist_history") || "[]"); } catch(e) { this.history = []; } },

  renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    this.completed = {};
    el.innerHTML = `<div class="container">
      <div class="page-header"><h1>✅ Pre-Shift Safety Checklist</h1><p class="muted">Complete all required items before starting your shift. Works offline.</p></div>
      <div class="card">
        <div style="margin-bottom:16px;"><div class="progress"><div id="chkProgress" style="width:0%"></div></div><span id="chkProgressText" class="muted small">0 of ${this.items.length} completed</span></div>
        <div>${this.items.map(i => `<label style="display:flex;align-items:center;gap:14px;padding:12px 16px;background:var(--bg-card);border:1px solid var(--border);border-radius:8px;margin-bottom:8px;cursor:pointer;min-height:48px;"><input type="checkbox" id="chk_${i.id}" onchange="ChecklistManager.updateProgress()" aria-label="${escapeHtml(i.label)}" style="width:22px;height:22px;"><span style="font-size:24px;">${i.icon}</span><span style="flex:1;"><b>${escapeHtml(i.label)}</b><br><span class="badge ${i.required ? 'badge-danger' : 'badge-muted'} small">${i.required ? 'Required' : 'Optional'}</span></span></label>`).join("")}</div>
        <button class="btn green full" id="btnSubmitChecklist" onclick="ChecklistManager.submit()" disabled style="opacity:0.5;">✓ Submit Safety Checklist</button>
      </div>
      <div class="card"><h3>Checklist History</h3>${this.renderHistory()}</div>
    </div>`;
  },

  updateProgress() {
    let done = 0;
    this.items.forEach(i => { const el = document.getElementById(`chk_${i.id}`); if (el && el.checked) { done++; this.completed[i.id] = true; } else delete this.completed[i.id]; });
    const pct = Math.round((done / this.items.length) * 100);
    const bar = document.getElementById("chkProgress"); if (bar) bar.style.width = pct + "%";
    const txt = document.getElementById("chkProgressText"); if (txt) txt.textContent = `${done} of ${this.items.length} completed`;
    const req = this.items.filter(i => i.required && !this.completed[i.id]);
    const btn = document.getElementById("btnSubmitChecklist");
    if (btn) { btn.disabled = req.length > 0; btn.style.opacity = req.length > 0 ? "0.5" : "1"; btn.textContent = req.length > 0 ? `${req.length} required item(s) remaining` : "✓ Submit Safety Checklist"; }
  },

  async submit() {
    const req = this.items.filter(i => i.required && !this.completed[i.id]);
    if (req.length > 0) { showToastMsg("Complete all required items before submitting.", "error"); return; }
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const items = this.items.map(i => ({ id: i.id, label: i.label, required: i.required, completed: !!this.completed[i.id] }));
    const rec = { items, submitted_at: new Date().toISOString(), shift_date: new Date().toISOString().split("T")[0], synced: false };
    let offline = !navigator.onLine;
    if (!offline && supabase && AuthManager.isAuthenticated()) {
      try { const { error } = await supabase.from("safety_checklists").insert({ user_id: AuthManager.user.id, items, shift_date: rec.shift_date, submitted_at: rec.submitted_at, synced: true }); if (!error) rec.synced = true; } catch(e) { offline = true; }
    }
    if (offline) { try { this.history.push(rec); localStorage.setItem("arr_checklist_history", JSON.stringify(this.history)); } catch(e) {} }
    this.isSubmitting = false;
    showToastMsg("Safety checklist submitted successfully!", "success");
    if (offline) showToastMsg("Saved locally. Will sync when online.", "info");
    this.renderView();
  },

  renderHistory() {
    if (!this.history.length) return '<p class="muted">No checklist history yet.</p>';
    return this.history.slice(-5).reverse().map(h => { const c = h.items.filter(i => i.completed).length; const all = h.items.filter(i => i.required).every(i => i.completed); return `<div style="padding:8px 0;border-bottom:1px solid var(--border);"><span class="badge ${all ? 'badge-success' : 'badge-warning'}">${c}/${h.items.length}</span> <span class="muted small">${new Date(h.submitted_at).toLocaleString()}</span> <span class="badge ${h.synced ? 'badge-success' : 'badge-warning'} small">${h.synced ? 'Synced' : 'Pending'}</span></div>`; }).join("");
  },

  async syncPending() {
    if (!supabase || !AuthManager.isAuthenticated()) return;
    const pending = this.history.filter(h => !h.synced);
    if (!pending.length) return;
    let synced = 0;
    for (const r of pending) { try { const { error } = await supabase.from("safety_checklists").insert({ user_id: AuthManager.user.id, items: r.items, shift_date: r.shift_date, submitted_at: r.submitted_at, synced: true }); if (!error) { r.synced = true; synced++; } } catch(e) {} }
    localStorage.setItem("arr_checklist_history", JSON.stringify(this.history));
    if (synced > 0) showToastMsg(`${synced} checklist(s) synchronized.`, "success");
  }
};
window.ChecklistManager = ChecklistManager;
