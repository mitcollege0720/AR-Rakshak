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
    if (window.location.hash !== hash) {
      // Some embedding environments (e.g. the v0 preview) patch history and try to
      // resolve the hash as a CSS selector, which throws for "#/route". Routing
      // must still work, so URL syncing is best-effort.
      try {
        history.pushState(null, "", hash);
      } catch (err) {
        // URL not updated; in-memory routing continues below.
      }
    }
    this.handleRoute(hash);
  },

  handleRoute(hashOverride) {
    const hash = (hashOverride ?? window.location.hash).replace(/^#/, "");
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
