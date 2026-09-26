const config = require("../config");

function securityHeaders(req, res, next) {
  // Prevent MIME-sniffing
  res.setHeader("X-Content-Type-Options", "nosniff");

  // Prevent clickjacking / frame embedding except same origin
  res.setHeader("X-Frame-Options", "SAMEORIGIN");

  // Strict Referrer Policy
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");

  // Cross-site scripting protection filter for older browsers
  res.setHeader("X-XSS-Protection", "1; mode=block");

  // Explicit permission for camera use in AR safety training module
  res.setHeader("Permissions-Policy", "camera=(self), microphone=()");

  // Content Security Policy
  // Allow self, inline styles/scripts for lightweight UI components, font data, and media streams
  const csp = [
    "default-src 'self'",
    "script-src 'self' 'unsafe-inline'",
    "style-src 'self' 'unsafe-inline' https://fonts.googleapis.com",
    "font-src 'self' https://fonts.gstatic.com data:",
    "img-src 'self' data: blob:",
    "media-src 'self' blob: mediastream:",
    "connect-src 'self'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'"
  ].join("; ");

  res.setHeader("Content-Security-Policy", csp);

  // CORS headers
  res.setHeader("Access-Control-Allow-Origin", config.corsOrigin);
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, PATCH, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization, X-Request-Id");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
}

module.exports = {
  securityHeaders
};
