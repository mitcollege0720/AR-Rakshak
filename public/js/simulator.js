// AR Rakshak Safety Training Simulator - Interactive Hazard Detection & Decision Training
const SimulatorManager = {
  scenarios: [
    { id: "mining_underground", title: "Underground Mining Safety", icon: "⛏️", sector: "Mining", difficulty: "intermediate", description: "Pre-shift inspection of an underground mine.", stages: [
      { name: "PPE Inspection", objective: "Verify all required PPE is worn correctly", hotspots: [
        { id: "helmet", label: "Helmet", icon: "⛑️", isHazard: false, info: "Helmet is properly fitted. Good." },
        { id: "no_gloves", label: "Missing Gloves", icon: "🧤", isHazard: true, hazardType: "Missing PPE", severity: "Medium", explanation: "Working without gloves can cause hand injuries.", correctAction: "Wear approved safety gloves before entering." } ] },
      { name: "Work Area Inspection", objective: "Identify hazards in the mine entry area", hotspots: [
        { id: "exposed_cable", label: "Exposed Electrical Cable", icon: "⚡", isHazard: true, hazardType: "Electrical Hazard", severity: "High", explanation: "Exposed cables can cause electrocution or fire.", correctAction: "Report immediately. Do not touch. Disconnect power if safe." },
        { id: "loose_rock", label: "Loose Rock Above", icon: "🪨", isHazard: true, hazardType: "Fall Hazard", severity: "High", explanation: "Loose rocks can fall and cause serious injury.", correctAction: "Bar the area and report. Do not proceed until secured." },
        { id: "ventilation", label: "Ventilation System", icon: "💨", isHazard: false, info: "Ventilation is functioning properly." } ] },
      { name: "Hazard Decision", objective: "Make the correct safety decision", decision: { question: "You detect a gas alarm while inspecting. What should you do?", options: ["Continue working and monitor", "Move to safety and follow emergency procedures", "Try to find the gas source", "Turn off the alarm and continue"], correctAnswer: 1, explanation: "Gas alarms indicate dangerous conditions. Always move to safety and follow site emergency procedures." } } ] },
    { id: "gas_leak", title: "Gas Leak Emergency", icon: "☣️", sector: "Mining", difficulty: "advanced", description: "Respond to a gas leak in a tunnel.", stages: [
      { name: "Identify the Hazard", objective: "Recognize gas leak indicators", hotspots: [
        { id: "gas_alarm", label: "Gas Alarm Sounding", icon: "🚨", isHazard: true, hazardType: "Gas Hazard", severity: "Critical", explanation: "Gas alarm indicates dangerous gas levels.", correctAction: "Evacuate immediately. Do not use electrical switches." },
        { id: "vent_off", label: "Ventilation Stopped", icon: "💨", isHazard: true, hazardType: "Poor Ventilation", severity: "High", explanation: "Without ventilation, gases accumulate rapidly.", correctAction: "Report. Do not enter without working ventilation." } ] },
      { name: "Emergency Response", objective: "Take the correct emergency action", decision: { question: "Gas alarm is active and ventilation stopped. What is your first action?", options: ["Investigate the gas source", "Activate alarm and evacuate to assembly point", "Wait for radio instructions", "Restart ventilation manually"], correctAnswer: 1, explanation: "Always raise the alarm and evacuate first. Never investigate gas sources without proper equipment." } } ] },
    { id: "fire_safety", title: "Fire Safety", icon: "🔥", sector: "Manufacturing", difficulty: "beginner", description: "Identify fire hazards and respond to fire emergency.", stages: [
      { name: "Identify Fire Hazards", objective: "Find fire hazards in the work area", hotspots: [
        { id: "oily_rags", label: "Oily Rags Pile", icon: "🧹", isHazard: true, hazardType: "Fire Hazard", severity: "High", explanation: "Oily rags can spontaneously combust.", correctAction: "Move to approved metal containers immediately." },
        { id: "blocked_exit", label: "Blocked Emergency Exit", icon: "🚪", isHazard: true, hazardType: "Unsafe Condition", severity: "Critical", explanation: "Blocked exits prevent evacuation.", correctAction: "Clear the exit and report to maintenance." },
        { id: "extinguisher", label: "Fire Extinguisher", icon: "🧯", isHazard: false, info: "Fire extinguisher is present and accessible. Good." } ] },
      { name: "Fire Response", objective: "Choose the correct fire response", decision: { question: "A small fire starts near oily rags. What should you do?", options: ["Use water on the oil fire", "Raise alarm and use Class B extinguisher if safe", "Cover with a blanket", "Run away without alerting"], correctAnswer: 1, explanation: "Never use water on oil fire. Raise alarm first, use Class B extinguisher only if trained and fire is small." } } ] },
    { id: "electrical_safety", title: "Electrical Safety", icon: "⚡", sector: "Manufacturing", difficulty: "intermediate", description: "Identify electrical hazards.", stages: [
      { name: "Hazard Identification", objective: "Find electrical hazards", hotspots: [
        { id: "damaged_cable", label: "Damaged Power Cable", icon: "🔌", isHazard: true, hazardType: "Electrical Hazard", severity: "High", explanation: "Damaged cables expose conductors causing electrocution.", correctAction: "Disconnect power and report. Do not use." },
        { id: "open_panel", label: "Open Electrical Panel", icon: "⚡", isHazard: true, hazardType: "Electrical Hazard", severity: "Critical", explanation: "Open panels expose live components.", correctAction: "Close and secure. Report to maintenance." },
        { id: "wet_floor", label: "Wet Floor Near Panel", icon: "💧", isHazard: true, hazardType: "Electrical Hazard", severity: "High", explanation: "Water near panels creates electrocution risk.", correctAction: "Remove water source, dry area, report." } ] },
      { name: "Safe Decision", objective: "Choose the correct response", decision: { question: "A coworker gets an electric shock. What do you do first?", options: ["Touch them to pull away", "Disconnect the power source", "Call for help and wait", "Pour water on equipment"], correctAnswer: 1, explanation: "Never touch a person being shocked. Disconnect power first, then call for medical help." } } ] },
    { id: "heavy_machinery", title: "Heavy Machinery Safety", icon: "⚙️", sector: "Manufacturing", difficulty: "intermediate", description: "Hazards around heavy machinery.", stages: [
      { name: "Machine Inspection", objective: "Find safety issues", hotspots: [
        { id: "guard_removed", label: "Safety Guard Removed", icon: "🛡️", isHazard: true, hazardType: "Unsafe Machinery", severity: "Critical", explanation: "Removed guards expose moving parts causing severe injury.", correctAction: "Never operate without guards. Report and reinstall." },
        { id: "oil_leak", label: "Oil Leak Under Machine", icon: "🛢️", isHazard: true, hazardType: "Slip Hazard", severity: "Medium", explanation: "Oil leaks create slip hazards.", correctAction: "Clean spill and report leak to maintenance." },
        { id: "estop", label: "Emergency Stop Button", icon: "🛑", isHazard: false, info: "Emergency stop is accessible. Good." } ] },
      { name: "Machine Decision", objective: "Choose the safe action", decision: { question: "Guard is removed but production is behind. What do you do?", options: ["Continue working", "Stop machine and report — never operate without guards", "Put guard back without stopping", "Wait for next shift"], correctAnswer: 1, explanation: "Never operate without guards regardless of production pressure. Stop, report, wait for repair." } } ] },
    { id: "working_at_height", title: "Working at Height", icon: "🏗️", sector: "General", difficulty: "advanced", description: "Safety procedures for working at elevation.", stages: [
      { name: "Height Safety Check", objective: "Identify fall hazards", hotspots: [
        { id: "no_harness", label: "Worker Without Harness", icon: "🔗", isHazard: true, hazardType: "Fall Hazard", severity: "Critical", explanation: "Working at height without harness is extremely dangerous.", correctAction: "Always wear and secure fall protection harness above 2m." },
        { id: "damaged_railing", label: "Damaged Guardrail", icon: "🚧", isHazard: true, hazardType: "Fall Hazard", severity: "High", explanation: "Damaged guardrails cannot prevent falls.", correctAction: "Report and cordon off. Do not work near damaged rails." },
        { id: "tools_loose", label: "Loose Tools on Edge", icon: "🔧", isHazard: true, hazardType: "Falling Object", severity: "High", explanation: "Tools on edges can fall and injure workers below.", correctAction: "Secure all tools with lanyards." } ] } ] },
    { id: "ppe_identification", title: "PPE Identification", icon: "🦺", sector: "General", difficulty: "beginner", description: "Identify correct and incorrect PPE usage.", stages: [
      { name: "PPE Check", objective: "Identify correct and incorrect PPE", hotspots: [
        { id: "no_helmet", label: "Worker Without Helmet", icon: "⛑️", isHazard: true, hazardType: "Missing PPE", severity: "High", explanation: "Helmets protect against falling objects. Mandatory in all industrial zones.", correctAction: "Wear approved safety helmet at all times." },
        { id: "loose_clothing", label: "Loose Clothing Near Machine", icon: "👕", isHazard: true, hazardType: "Entanglement Risk", severity: "High", explanation: "Loose clothing can get caught in machinery.", correctAction: "Wear fitted work clothing. Secure loose items." },
        { id: "proper_boots", label: "Safety Boots", icon: "🥾", isHazard: false, info: "Safety boots properly worn. Good." } ] } ] },
    { id: "emergency_evacuation", title: "Emergency Evacuation", icon: "🚪", sector: "General", difficulty: "beginner", description: "Practice correct evacuation procedure.", stages: [
      { name: "Evacuation Route", objective: "Follow correct evacuation procedure", hotspots: [
        { id: "exit_sign", label: "Exit Sign", icon: "🚪", isHazard: false, info: "Follow the nearest marked exit route." },
        { id: "blocked_path", label: "Blocked Path", icon: "🚧", isHazard: true, hazardType: "Unsafe Condition", severity: "Critical", explanation: "Blocked routes can trap workers during emergencies.", correctAction: "Report blocked routes. Use alternate exit." },
        { id: "assembly", label: "Assembly Point", icon: "📍", isHazard: false, info: "Proceed to designated assembly point for headcount." } ] },
      { name: "Evacuation Decision", objective: "Make the right evacuation choice", decision: { question: "Emergency alarm sounds. What should you NOT do?", options: ["Follow exit route to assembly point", "Stop to collect personal belongings", "Help coworkers who need assistance", "Report to supervisor at assembly point"], correctAnswer: 1, explanation: "Never stop to collect belongings during evacuation. Proceed directly to assembly point." } } ] }
  ],

  currentScenario: null, currentStage: 0, identifiedHazards: new Set(), mistakes: [], safetyScore: 0, isSubmitting: false,

  renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    el.innerHTML = `<div class="container">
      <div class="page-header"><h1>🎮 AR Safety Training Simulator</h1><p class="muted">Enter a realistic safety scenario, identify hazards, and practice the correct response.</p></div>
      <div class="card" style="text-align:center;padding:32px;margin-bottom:16px;">
        <h2>Interactive Safety Training</h2>
        <p class="muted">Choose a scenario to practice hazard identification, safety decisions, and emergency response.</p>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;margin-top:16px;">
          <button class="btn green" onclick="SimulatorManager.startQuickDemo()">▶ 2-Minute Safety Demo</button>
          <button class="btn secondary" onclick="document.getElementById('scenarioGrid').scrollIntoView({behavior:'smooth'})">📚 Training Library</button>
          <button class="btn secondary" onclick="Router.navigate('passport')">📊 My Progress</button>
        </div>
      </div>
      <div class="card"><h3>Training Scenarios</h3><div id="scenarioGrid" class="grid" style="grid-template-columns:repeat(auto-fill,minmax(280px,1fr));">
        ${this.scenarios.map(s => `<div class="card" style="cursor:pointer;padding:16px;" onclick="SimulatorManager.startScenario('${escapeHtml(s.id)}')"><div style="font-size:32px;margin-bottom:8px;">${s.icon}</div><b>${escapeHtml(s.title)}</b><p class="muted small">${escapeHtml(s.description)}</p><div style="display:flex;gap:6px;margin-top:8px;"><span class="pill pill-sector">${escapeHtml(s.sector)}</span><span class="pill ${s.difficulty === 'beginner' ? 'pill-ppe' : s.difficulty === 'intermediate' ? 'pill-zone' : 'pill-highlight'}">${escapeHtml(s.difficulty)}</span></div></div>`).join("")}
      </div></div>
      <div class="card"><h3>How It Works</h3><div class="grid" style="grid-template-columns:repeat(auto-fit,minmax(200px,1fr));">
        <div><div style="font-size:28px;">🔍</div><b>Identify Hazards</b><p class="muted small">Inspect and tap objects to identify hazards.</p></div>
        <div><div style="font-size:28px;">✓</div><b>Make Decisions</b><p class="muted small">Choose the correct safety response.</p></div>
        <div><div style="font-size:28px;">📊</div><b>Get Scored</b><p class="muted small">Receive a safety score based on performance.</p></div>
        <div><div style="font-size:28px;">🏆</div><b>Earn Badges</b><p class="muted small">Complete scenarios to earn XP and achievements.</p></div>
      </div></div>
    </div>`;
  },

  startQuickDemo() { this.startScenario("mining_underground"); },

  startScenario(id) {
    this.currentScenario = this.scenarios.find(s => s.id === id);
    if (!this.currentScenario) return;
    this.currentStage = 0; this.identifiedHazards = new Set(); this.mistakes = []; this.safetyScore = 0;
    this.renderStage();
  },

  renderStage() {
    const el = document.getElementById("app");
    if (!el || !this.currentScenario) return;
    const sc = this.currentScenario, st = sc.stages[this.currentStage];
    if (!st) { this.completeScenario(); return; }
    const total = (st.hotspots || []).filter(h => h.isHazard).length;
    const found = Array.from(this.identifiedHazards).filter(id => (st.hotspots || []).find(h => h.id === id && h.isHazard)).length;
    el.innerHTML = `<div class="container">
      <div style="display:flex;gap:12px;flex-wrap:wrap;margin-bottom:16px;padding:12px;background:var(--bg-card);border-radius:12px;">
        <div><span class="muted small">Scenario</span><br><b>${escapeHtml(sc.title)}</b></div>
        <div><span class="muted small">Stage</span><br><b>${this.currentStage + 1} / ${sc.stages.length}</b></div>
        <div><span class="muted small">Hazards Found</span><br><b>${found} / ${total}</b></div>
        <div><span class="muted small">Mode</span><br><b class="badge badge-info">SIMULATION</b></div>
      </div>
      <div class="card">
        <h2>${escapeHtml(st.name)}</h2><p class="muted">Objective: ${escapeHtml(st.objective)}</p>
        ${st.hotspots ? `<div style="margin-top:16px;"><p class="muted small">Tap on objects to inspect them. Identify all hazards to proceed.</p><div class="grid" style="grid-template-columns:repeat(auto-fill,minmax(150px,1fr));">${st.hotspots.map(h => `<button class="btn secondary" style="flex-direction:column;padding:16px;${this.identifiedHazards.has(h.id) ? 'border-color:var(--green);' : ''}" onclick="SimulatorManager.inspectHotspot('${escapeHtml(h.id)}')" aria-label="${escapeHtml(h.label)}"><span style="font-size:28px;">${h.icon}</span><span>${escapeHtml(h.label)}</span>${this.identifiedHazards.has(h.id) ? '<span style="color:var(--green);">✓</span>' : ''}</button>`).join("")}</div></div>` : ''}
        ${st.decision ? `<div style="margin-top:16px;"><h3>⚠️ Decision Required</h3><p style="font-size:18px;margin-bottom:12px;">${escapeHtml(st.decision.question)}</p><div>${st.decision.options.map((o, i) => `<button class="btn secondary full" style="text-align:left;margin-bottom:8px;" onclick="SimulatorManager.handleDecision(${i})"><b>${String.fromCharCode(65+i)}.</b> ${escapeHtml(o)}</button>`).join("")}</div></div>` : ''}
      </div>
      <div style="display:flex;justify-content:space-between;margin-top:16px;">
        ${this.currentStage > 0 ? '<button class="btn secondary" onclick="SimulatorManager.prevStage()">← Previous</button>' : '<div></div>'}
        ${st.decision || (found >= total && total > 0) ? '<button class="btn green" onclick="SimulatorManager.nextStage()">Next Stage →</button>' : '<button class="btn secondary" disabled style="opacity:0.5;">Find all hazards to continue</button>'}
      </div>
    </div>`;
  },

  inspectHotspot(id) {
    const st = this.currentScenario.stages[this.currentStage];
    const h = (st.hotspots || []).find(h => h.id === id);
    if (!h || this.identifiedHazards.has(id)) return;
    this.identifiedHazards.add(id);
    if (h.isHazard) { this.showHazardDialog(h); } else { showToastMsg(h.info || "No hazard found.", "success"); }
    this.renderStage();
  },

  showHazardDialog(h) {
    const m = document.createElement("div");
    m.className = "modal-backdrop"; m.setAttribute("role", "dialog"); m.setAttribute("aria-modal", "true");
    m.innerHTML = `<div class="modal-box"><div class="modal-header"><h2>⚠️ Hazard Identified</h2><button class="close-btn" onclick="this.closest('.modal-backdrop').remove()">✕</button></div><div><div style="display:flex;gap:8px;margin-bottom:12px;"><span class="badge badge-danger">${escapeHtml(h.hazardType)}</span><span class="badge badge-warning">Severity: ${escapeHtml(h.severity)}</span></div><p><b>Risk:</b> ${escapeHtml(h.explanation)}</p><p><b>Correct Action:</b> ${escapeHtml(h.correctAction)}</p><button class="btn green" onclick="this.closest('.modal-backdrop').remove()">✓ Mark as Hazard</button></div></div>`;
    document.body.appendChild(m);
  },

  handleDecision(idx) {
    const st = this.currentScenario.stages[this.currentStage];
    if (!st.decision) return;
    if (idx === st.decision.correctAnswer) { showToastMsg("✓ Correct! " + st.decision.explanation, "success"); }
    else { showToastMsg("⚠️ Incorrect. " + st.decision.explanation, "error"); this.mistakes.push({ stage: st.name, question: st.decision.question, selected: st.decision.options[idx], correct: st.decision.options[st.decision.correctAnswer], explanation: st.decision.explanation }); }
    setTimeout(() => this.nextStage(), 2000);
  },

  nextStage() { this.currentStage++; if (this.currentStage >= this.currentScenario.stages.length) this.completeScenario(); else this.renderStage(); },
  prevStage() { if (this.currentStage > 0) { this.currentStage--; this.renderStage(); } },

  async completeScenario() {
    if (this.isSubmitting) return;
    this.isSubmitting = true;
    const sc = this.currentScenario;
    let totalH = 0, foundH = 0, totalD = 0;
    sc.stages.forEach(s => { if (s.hotspots) { const h = s.hotspots.filter(h => h.isHazard); totalH += h.length; foundH += h.filter(h => this.identifiedHazards.has(h.id)).length; } if (s.decision) totalD++; });
    const correctD = totalD - this.mistakes.filter(m => m.question).length;
    this.safetyScore = (totalH > 0 ? Math.round((foundH/totalH)*60) : 60) + (totalD > 0 ? Math.round((correctD/totalD)*40) : 40);
    const xp = Math.round(this.safetyScore / 10) * 10;
    const badge = this.safetyScore >= 90 ? "Safety Excellence" : this.safetyScore >= 75 ? "Safety Proficient" : this.safetyScore >= 50 ? "Safety Aware" : null;
    const progress = { scenario_id: sc.id, scenario_name: sc.title, difficulty: sc.difficulty, safety_score: this.safetyScore, hazards_identified: foundH, total_hazards: totalH, correct_decisions: correctD, total_decisions: totalD, completed: true, xp_earned: xp, badge_earned: badge, mistakes: this.mistakes, completed_at: new Date().toISOString() };
    if (supabase && AuthManager.isAuthenticated()) {
      try { await supabase.from("simulator_progress").insert({ user_id: AuthManager.user.id, ...progress }); if (badge) await supabase.from("safety_achievements").insert({ user_id: AuthManager.user.id, achievement_type: "simulator_completion", achievement_name: badge, xp_value: xp }); } catch(e) { try { const l = JSON.parse(localStorage.getItem("arr_simulator_progress") || "[]"); l.push(progress); localStorage.setItem("arr_simulator_progress", JSON.stringify(l)); } catch(e2) {} }
    } else { try { const l = JSON.parse(localStorage.getItem("arr_simulator_progress") || "[]"); l.push(progress); localStorage.setItem("arr_simulator_progress", JSON.stringify(l)); } catch(e) {} }
    this.isSubmitting = false;
    this.renderCompletion(progress);
  },

  renderCompletion(p) {
    const el = document.getElementById("app");
    if (!el) return;
    const passed = p.safety_score >= 70;
    el.innerHTML = `<div class="container">
      <div class="card" style="text-align:center;padding:32px;">
        <div style="font-size:48px;">${passed ? '🎉' : '⚠️'}</div>
        <h1>Simulation Complete</h1>
        <div class="grid stats-grid" style="max-width:600px;margin:20px auto;">
          <div class="card stat-card"><b>${p.safety_score}%</b><span>Safety Score</span></div>
          <div class="card stat-card"><b>${p.hazards_identified}/${p.total_hazards}</b><span>Hazards Found</span></div>
          <div class="card stat-card"><b>${p.correct_decisions}/${p.total_decisions}</b><span>Correct Decisions</span></div>
          <div class="card stat-card"><b>+${p.xp_earned} XP</b><span>Earned</span></div>
        </div>
        ${p.badge_earned ? `<div style="display:flex;align-items:center;justify-content:center;gap:12px;margin:16px 0;"><div style="font-size:32px;">🏆</div><div><b>${escapeHtml(p.badge_earned)}</b><br><span class="muted small">Achievement unlocked!</span></div></div>` : ''}
        <div class="card" style="text-align:left;margin:16px 0;background:var(--bg-card);">
          <h3>📋 Safety Debrief</h3>
          <p><b>What you did well:</b> You identified ${p.hazards_identified} of ${p.total_hazards} hazards and made ${p.correct_decisions} correct decisions.</p>
          ${p.mistakes.length > 0 ? `<div><h4>Decisions to review:</h4>${p.mistakes.map(m => `<div style="padding:8px;border:1px solid var(--border);border-radius:8px;margin:4px 0;"><p><b>Q:</b> ${escapeHtml(m.question)}</p><p class="muted"><b>Your answer:</b> ${escapeHtml(m.selected)}</p><p style="color:var(--green);"><b>Correct:</b> ${escapeHtml(m.correct)}</p><p class="muted small">${escapeHtml(m.explanation)}</p></div>`).join("")}</div>` : '<p style="color:var(--green);">No mistakes! Excellent safety awareness.</p>'}
        </div>
        <div style="display:flex;gap:12px;justify-content:center;flex-wrap:wrap;">
          <button class="btn green" onclick="SimulatorManager.renderView()">← Back to Scenarios</button>
          <button class="btn secondary" onclick="SimulatorManager.startScenario('${escapeHtml(this.currentScenario.id)}')">🔁 Replay</button>
          <button class="btn secondary" onclick="Router.navigate('passport')">📊 View Progress</button>
        </div>
      </div>
    </div>`;
  }
};
window.SimulatorManager = SimulatorManager;
