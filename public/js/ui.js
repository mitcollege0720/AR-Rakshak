// Safe UI Helpers, Toast Notifications, and Component Renderers

function escapeHtml(str) {
  if (str === null || str === undefined) return "";
  return String(str)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function showToast(message, type = "info", duration = 4000) {
  let container = document.getElementById("toastContainer");
  if (!container) {
    container = document.createElement("div");
    container.id = "toastContainer";
    container.className = "toast-container";
    container.setAttribute("aria-live", "polite");
    document.body.appendChild(container);
  }

  const toast = document.createElement("div");
  toast.className = `toast toast-${type}`;
  toast.setAttribute("role", "status");

  const icon = type === "success" ? "✓" : type === "error" ? "⚠" : type === "warning" ? "!" : "ℹ";
  toast.innerHTML = `<span class="toast-icon">${icon}</span><span class="toast-text">${escapeHtml(message)}</span>`;

  container.appendChild(toast);

  setTimeout(() => {
    toast.classList.add("toast-fadeout");
    setTimeout(() => {
      if (toast.parentNode) toast.parentNode.removeChild(toast);
    }, 300);
  }, duration);
}

function renderLoading(container, text = "Loading...") {
  container.innerHTML = `
    <div class="card loading-card" role="status">
      <div class="spinner"></div>
      <p>${escapeHtml(text)}</p>
    </div>
  `;
}

function renderErrorState(container, message, onRetry = null) {
  container.innerHTML = `
    <div class="card error-card" role="alert">
      <div class="error-icon">⚠</div>
      <h2>Something went wrong</h2>
      <p class="muted">${escapeHtml(message)}</p>
      ${onRetry ? `<button class="btn full" onclick="(${onRetry.toString()})()">Try Again</button>` : ""}
    </div>
  `;
}
