// AR Rakshak Router - Hash-based routing with route preservation
const Router = {
  routes: {},
  currentRoute: "home",
  params: {},

  init() {
    window.addEventListener("hashchange", () => this.handleRoute());
    this.handleRoute();
  },

  register(route, handler) {
    this.routes[route] = handler;
  },

  navigate(route, params = {}) {
    const hash = params && Object.keys(params).length > 0
      ? `#/${route}?${new URLSearchParams(params).toString()}`
      : `#/${route}`;
    if (window.location.hash === hash) {
      this.handleRoute();
    } else {
      window.location.hash = hash;
    }
  },

  handleRoute() {
    const hash = window.location.hash.slice(1);
    const parts = hash.split("?");
    const routePath = parts[0].replace(/^\//, "") || "home";
    const queryStr = parts[1] || "";
    this.params = Object.fromEntries(new URLSearchParams(queryStr));
    this.currentRoute = routePath;

    if (this.routes[routePath]) {
      this.routes[routePath](this.params);
    } else if (this.routes["home"]) {
      this.routes["home"](this.params);
    }
    this.updateNavActive(routePath);
  },

  updateNavActive(route) {
    document.querySelectorAll(".bottom-nav button, .nav-item").forEach(btn => {
      const target = btn.getAttribute("data-nav") || btn.getAttribute("data-route");
      btn.classList.toggle("active", target === route);
    });
  },

  getCurrentRoute() { return this.currentRoute; },
  getParams() { return this.params; }
};
window.Router = Router;
