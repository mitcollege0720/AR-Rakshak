// AR Rakshak Theme Manager - Dark/Light Mode with System Preference
const ThemeManager = {
  STORAGE_KEY: "arr_theme",
  currentTheme: "system",
  resolvedTheme: "light",

  init() {
    const saved = localStorage.getItem(this.STORAGE_KEY) || "system";
    this.setTheme(saved, false);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    mq.addEventListener("change", (e) => {
      if (this.currentTheme === "system") {
        this.resolvedTheme = e.matches ? "dark" : "light";
        this.applyTheme();
      }
    });
    this.updateToggleButton();
  },

  setTheme(theme, notify = true) {
    if (!["light", "dark", "system"].includes(theme)) theme = "system";
    this.currentTheme = theme;
    localStorage.setItem(this.STORAGE_KEY, theme);
    if (theme === "system") {
      this.resolvedTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
    } else {
      this.resolvedTheme = theme;
    }
    this.applyTheme();
    this.updateToggleButton();
    if (notify && typeof showToastMsg === "function") {
      showToastMsg(`Theme: ${theme}`, "info");
    }
  },

  toggle() {
    this.setTheme(this.resolvedTheme === "dark" ? "light" : "dark");
  },

  applyTheme() {
    document.documentElement.setAttribute("data-theme", this.resolvedTheme);
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute("content", this.resolvedTheme === "dark" ? "#0b1120" : "#0a192f");
  },

  updateToggleButton() {
    const btn = document.getElementById("themeToggleBtn");
    if (btn) {
      btn.textContent = this.resolvedTheme === "dark" ? "☀" : "☾";
      btn.setAttribute("aria-label", `Switch to ${this.resolvedTheme === "dark" ? "light" : "dark"} mode`);
    }
  },

  getTheme() { return this.resolvedTheme; }
};
window.ThemeManager = ThemeManager;
