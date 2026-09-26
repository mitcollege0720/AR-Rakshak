function escapeHtml(str) {
  if (typeof str !== "string") return "";
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

function sanitizeString(val, maxLength = 500) {
  if (val === null || val === undefined) return "";
  const str = String(val)
    // Remove control characters (except newline, tab, carriage return)
    .replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, "")
    .trim();
  return str.slice(0, maxLength);
}

function sanitizeNumber(val, min = 0, max = 100, defaultVal = 0) {
  const num = Number(val);
  if (isNaN(num) || !isFinite(num)) return defaultVal;
  return Math.min(Math.max(Math.round(num), min), max);
}

module.exports = {
  escapeHtml,
  sanitizeString,
  sanitizeNumber
};
