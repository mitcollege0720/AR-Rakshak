// Rakshak AI Voice Assistant - Speech-to-Text, Text-to-Speech with Text Fallback
const RakshakAssistant = {
  recognition: null, isListening: false, isProcessing: false, isSpeaking: false, transcript: [], synth: null, voices: [],

  init() {
    if ("speechSynthesis" in window) {
      this.synth = window.speechSynthesis;
      this.voices = this.synth.getVoices() || [];
      this.synth.onvoiceschanged = () => { this.voices = this.synth.getVoices() || []; };
    }
    if ("webkitSpeechRecognition" in window || "SpeechRecognition" in window) {
      const SR = window.SpeechRecognition || window.webkitSpeechRecognition;
      this.recognition = new SR();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.lang = this.getSpeechLang();
      this.recognition.onresult = (e) => { let final = ""; for (let i = e.resultIndex; i < e.results.length; i++) if (e.results[i].isFinal) final += e.results[i][0].transcript; if (final) this.handleUserInput(final); };
      this.recognition.onerror = (e) => { this.isListening = false; if (e.error === "not-allowed") showToastMsg("Microphone permission denied. Use text input.", "warning"); else if (e.error === "no-speech") showToastMsg("No speech detected.", "info"); this.updateUI(); };
      this.recognition.onend = () => { this.isListening = false; this.updateUI(); };
    }
  },

  getSpeechLang() {
    const m = { English: "en-US", Hindi: "hi-IN", Bengali: "bn-IN", Urdu: "ur-IN" };
    return m[currentLanguage] || "en-US";
  },

  toggleListening() { if (this.isListening) this.stopListening(); else this.startListening(); },

  startListening() {
    if (!this.recognition) { showToastMsg("Speech recognition not supported. Use text input.", "warning"); return; }
    if (this.isProcessing || this.isSpeaking) return;
    try { this.recognition.lang = this.getSpeechLang(); this.recognition.start(); this.isListening = true; this.updateUI(); } catch(e) { showToastMsg("Could not start voice input.", "error"); }
  },

  stopListening() { if (this.recognition && this.isListening) this.recognition.stop(); this.isListening = false; this.updateUI(); },

  speak(text) {
    if (!this.synth) return;
    this.stopSpeaking();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = this.getSpeechLang();
    const v = this.voices.find(v => v.lang.startsWith(u.lang.slice(0, 2)));
    if (v) u.voice = v;
    u.onstart = () => { this.isSpeaking = true; this.updateUI(); };
    u.onend = () => { this.isSpeaking = false; this.updateUI(); };
    u.onerror = () => { this.isSpeaking = false; this.updateUI(); };
    this.synth.speak(u);
  },

  stopSpeaking() { if (this.synth) this.synth.cancel(); this.isSpeaking = false; this.updateUI(); },

  async handleUserInput(text) {
    if (!text || !text.trim()) return;
    this.isProcessing = true; this.stopListening(); this.updateUI();
    this.transcript.push({ role: "user", text: text.trim(), time: new Date().toLocaleTimeString() });
    this.renderTranscript();
    const resp = this.generateResponse(text.trim());
    this.transcript.push({ role: "assistant", text: resp, time: new Date().toLocaleTimeString() });
    this.renderTranscript();
    this.isProcessing = false; this.updateUI();
    if (this.synth) this.speak(resp);
    this.executeCommand(text.trim());
  },

  generateResponse(input) {
    const l = input.toLowerCase();
    if (l.includes("training") || l.includes("प्रशिक्षण")) return "Starting your safety training. Select a module from the training library.";
    if (l.includes("hazard") || l.includes("explain") || l.includes("खतरा")) return "I can help explain hazards. Select a training module or describe the hazard.";
    if (l.includes("report") || l.includes("gas") || l.includes("रिपोर्ट")) return "Opening the hazard reporting form. Fill in the details of what you observed.";
    if (l.includes("safe zone") || l.includes("nearest") || l.includes("सुरक्षित")) return "Check the GPS tracker for your location and follow the marked evacuation route to the assembly point.";
    if (l.includes("gps") || l.includes("location") || l.includes("जीपीएस")) return "Opening the GPS tracker with your current coordinates and accuracy.";
    if (l.includes("emergency") || l.includes("sos") || l.includes("आपातकालीन")) return "For emergencies, use the SOS button. I will capture your GPS and notify your supervisor. Only use SOS in genuine emergencies.";
    if (l.includes("certificate") || l.includes("प्रमाणपत्र")) return "Opening your Safety Passport to view certificates and training records.";
    if (l.includes("incident") || l.includes("घटना")) return "Opening incident reporting for hazards or safety concerns.";
    if (l.includes("checklist") || l.includes("चेकलिस्ट")) return "Opening the pre-shift safety checklist. Complete all items before starting your shift.";
    if (l.includes("simulator") || l.includes("simulation")) return "Opening the AR Safety Training Simulator. Choose a scenario to practice.";
    if (l.includes("hello") || l.includes("hi") || l.includes("help") || l.includes("नमस्ते")) return "Hello! I'm Rakshak, your safety assistant. I can help with training, hazards, GPS, and emergencies. What do you need?";
    return "I can help with safety training, hazard reporting, GPS tracking, SOS, checklists, and simulations. What would you like to do?";
  },

  executeCommand(input) {
    const l = input.toLowerCase();
    if (l.includes("start training") || (l.includes("training") && !l.includes("explain"))) setTimeout(() => Router.navigate("training"), 500);
    else if (l.includes("report") || l.includes("incident")) setTimeout(() => Router.navigate("report"), 500);
    else if (l.includes("gps") || l.includes("location")) setTimeout(() => Router.navigate("gps"), 500);
    else if (l.includes("sos") || l.includes("emergency")) setTimeout(() => Router.navigate("sos"), 500);
    else if (l.includes("certificate") || l.includes("passport")) setTimeout(() => Router.navigate("passport"), 500);
    else if (l.includes("checklist")) setTimeout(() => Router.navigate("checklist"), 500);
    else if (l.includes("simulator")) setTimeout(() => Router.navigate("simulator"), 500);
    else if (l.includes("language") && l.includes("hindi")) { setLanguage("Hindi"); handleLanguageChange(); }
    else if (l.includes("language") && l.includes("english")) { setLanguage("English"); handleLanguageChange(); }
  },

  renderView() {
    CameraManager.stopCamera();
    const el = document.getElementById("app");
    if (!el) return;
    el.innerHTML = `<div class="container">
      <div class="page-header"><h1>🤖 Rakshak Assistant</h1><p class="muted">AI-powered safety assistant with voice and text support.</p></div>
      <div class="card">
        <div style="display:flex;align-items:center;gap:16px;margin-bottom:16px;">
          <div class="assistant-avatar ${this.isListening ? 'listening' : this.isProcessing ? 'processing' : this.isSpeaking ? 'speaking' : ''}" style="width:56px;height:56px;border-radius:50%;background:var(--bg-card);display:flex;align-items:center;justify-content:center;font-size:28px;">🤖</div>
          <div><h3>Rakshak</h3><span class="badge ${this.isListening ? 'badge-info' : this.isProcessing ? 'badge-warning' : this.isSpeaking ? 'badge-success' : 'badge-muted'}">${this.isListening ? 'Listening...' : this.isProcessing ? 'Processing...' : this.isSpeaking ? 'Speaking...' : 'Ready'}</span></div>
        </div>
        <div id="assistantTranscript" style="max-height:300px;overflow-y:auto;margin-bottom:16px;">${this.renderTranscriptItems()}</div>
        <div style="display:flex;gap:8px;margin-bottom:12px;">
          <button class="btn secondary" onclick="RakshakAssistant.toggleListening()" aria-label="Voice input" title="${this.recognition ? 'Voice input' : 'Voice not supported'}">${this.isListening ? '⏹' : '🎤'}</button>
          <input type="text" id="assistantTextInput" placeholder="Type your question or command..." onkeydown="if(event.key==='Enter') RakshakAssistant.handleTextInput()" style="flex:1;margin:0;" aria-label="Text input">
          <button class="btn" onclick="RakshakAssistant.handleTextInput()">Send</button>
        </div>
        ${this.isSpeaking ? '<button class="btn secondary btn-sm" onclick="RakshakAssistant.stopSpeaking()">⏹ Stop Speaking</button>' : ''}
        <div style="display:flex;flex-wrap:wrap;gap:8px;margin-top:12px;">
          <button class="pill" onclick="RakshakAssistant.handleUserInput('Start my safety training')">Start training</button>
          <button class="pill" onclick="RakshakAssistant.handleUserInput('Report a gas leak')">Report hazard</button>
          <button class="pill" onclick="RakshakAssistant.handleUserInput('Show my GPS')">Show GPS</button>
          <button class="pill" onclick="RakshakAssistant.handleUserInput('What should I do during this emergency?')">Emergency help</button>
          <button class="pill" onclick="RakshakAssistant.handleUserInput('Show my certificates')">Certificates</button>
        </div>
        <p class="muted small" style="margin-top:12px;">For emergencies, always follow verified site procedures. Rakshak provides general safety guidance only.</p>
      </div>
    </div>`;
  },

  renderTranscript() { const el = document.getElementById("assistantTranscript"); if (el) { el.innerHTML = this.renderTranscriptItems(); el.scrollTop = el.scrollHeight; } },
  renderTranscriptItems() {
    if (!this.transcript.length) return '<p class="muted">Hello! I\'m Rakshak, your safety assistant. Ask me about training, hazards, GPS, or emergencies.</p>';
    return this.transcript.map(m => `<div style="margin-bottom:12px;text-align:${m.role === 'user' ? 'right' : 'left'};"><div style="display:inline-block;padding:10px 16px;border-radius:12px;max-width:80%;background:${m.role === 'user' ? 'var(--blue)' : 'var(--bg-card)'};color:${m.role === 'user' ? '#fff' : 'var(--text)'};">${escapeHtml(m.text)}</div><div class="muted small">${m.time}</div></div>`).join("");
  },

  handleTextInput() { const i = document.getElementById("assistantTextInput"); if (!i) return; const t = i.value.trim(); if (!t) return; i.value = ""; this.handleUserInput(t); },

  updateUI() {
    const av = document.querySelector(".assistant-avatar"); const sb = document.querySelector(".assistant-avatar + div .badge");
    if (av) av.className = `assistant-avatar ${this.isListening ? 'listening' : this.isProcessing ? 'processing' : this.isSpeaking ? 'speaking' : ''}`;
    if (sb) { sb.className = `badge ${this.isListening ? 'badge-info' : this.isProcessing ? 'badge-warning' : this.isSpeaking ? 'badge-success' : 'badge-muted'}`; sb.textContent = this.isListening ? 'Listening...' : this.isProcessing ? 'Processing...' : this.isSpeaking ? 'Speaking...' : 'Ready'; }
  }
};
window.RakshakAssistant = RakshakAssistant;
