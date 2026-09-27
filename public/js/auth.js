// AR Rakshak Authentication Manager - Supabase Auth with RBAC
const AuthManager = {
  user: null, session: null, profile: null, isLoading: true, onAuthChange: null,

  async init() {
    if (!supabase) { this.isLoading = false; return; }
    try {
      const { data: { session } } = await supabase.auth.getSession();
      this.session = session;
      this.user = session?.user || null;
      if (this.user) await this.loadProfile();
    } catch (e) { console.warn("Auth init error:", e.message); }
    this.isLoading = false;

    supabase.auth.onAuthStateChange((event, session) => {
      (async () => {
        this.session = session;
        this.user = session?.user || null;
        if (this.user && event !== "SIGNED_OUT") { await this.loadProfile(); }
        else { this.profile = null; }
        if (this.onAuthChange) this.onAuthChange(event, this.user, this.profile);
        if (event === "SIGNED_OUT") Router.navigate("login");
      })();
    });
  },

  async loadProfile() {
    if (!supabase || !this.user) return;
    try {
      const { data, error } = await supabase.from("profiles").select("*").eq("id", this.user.id).maybeSingle();
      if (error) throw error;
      if (data) { this.profile = data; }
      else { await this.createProfileFromUser(); }
    } catch (e) { console.warn("Profile load error:", e.message); }
  },

  async createProfileFromUser() {
    if (!supabase || !this.user) return;
    const meta = this.user.user_metadata || {};
    const pd = { id: this.user.id, full_name: meta.full_name || meta.name || "", username: meta.username || "", role: meta.role || "worker", language: meta.language || "English", theme: "system" };
    try {
      const { data } = await supabase.from("profiles").insert(pd).select().maybeSingle();
      if (data) this.profile = data;
    } catch (e) { console.warn("Profile creation error:", e.message); }
  },

  async signIn(email, password) {
    if (!supabase) throw new Error("Authentication service unavailable.");
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
  },

  async signUp(fullName, username, email, password, role = "worker") {
    if (!supabase) throw new Error("Authentication service unavailable.");
    if (role === "admin") throw new Error("Admin accounts cannot be self-registered.");
    const { data, error } = await supabase.auth.signUp({ email, password, options: { data: { full_name: fullName, username, role } } });
    if (error) throw error;
    return data;
  },

  async signInWithGoogle() {
    if (!supabase) throw new Error("Authentication service unavailable.");
    const { data, error } = await supabase.auth.signInWithOAuth({ provider: "google", options: { redirectTo: window.location.origin } });
    if (error) throw error;
    return data;
  },

  async signOut() {
    if (!supabase) return;
    await supabase.auth.signOut();
    this.user = null; this.session = null; this.profile = null;
  },

  async resetPassword(email) {
    if (!supabase) throw new Error("Authentication service unavailable.");
    const { data, error } = await supabase.auth.resetPasswordForEmail(email, { redirectTo: window.location.origin + "#/reset-password" });
    if (error) throw error;
    return data;
  },

  async updatePassword(newPassword) {
    if (!supabase) throw new Error("Authentication service unavailable.");
    const { data, error } = await supabase.auth.updateUser({ password: newPassword });
    if (error) throw error;
    return data;
  },

  async updateProfile(updates) {
    if (!supabase || !this.user) throw new Error("Not authenticated.");
    const allowed = ["full_name", "username", "phone", "avatar_url", "language", "theme"];
    const clean = {};
    for (const key of allowed) if (key in updates) clean[key] = updates[key];
    const { data, error } = await supabase.from("profiles").update(clean).eq("id", this.user.id).select().maybeSingle();
    if (error) throw error;
    if (data) this.profile = data;
    return data;
  },

  isAuthenticated() { return !!this.user; },
  getRole() { return this.profile?.role || "worker"; },
  isWorker() { return this.getRole() === "worker"; },
  isSupervisor() { return this.getRole() === "supervisor" || this.getRole() === "admin"; },
  isAdmin() { return this.getRole() === "admin"; },

  canAccess(route) {
    const worker = ["home","training","scan","report","gps","sos","assistant","checklist","passport","simulator","login","register","forgot-password","reset-password","profile"];
    const supervisor = ["supervisor","analytics","safety-map"];
    if (supervisor.includes(route)) return this.isSupervisor();
    if (worker.includes(route)) return true;
    return false;
  },

  getUser() {
    return {
      id: this.user?.id, email: this.user?.email,
      fullName: this.profile?.full_name || this.user?.user_metadata?.full_name || "",
      username: this.profile?.username || this.user?.user_metadata?.username || "",
      role: this.getRole(), avatar: this.profile?.avatar_url || "",
      language: this.profile?.language || "English"
    };
  }
};
window.AuthManager = AuthManager;
