const { describe, it } = require("node:test");
const assert = require("node:assert/strict");

const { escapeHtml, sanitizeString, sanitizeNumber } = require("../src/utils/sanitize");
const { VALID_INCIDENT_TYPES, VALID_SEVERITIES } = require("../src/validators");

describe("Validation and Sanitization Utility Tests", () => {
  it("escapeHtml should neutralize HTML injection vectors", () => {
    const raw = `<script>alert("XSS")</script><img src='x' onerror="alert('hack')">`;
    const escaped = escapeHtml(raw);
    assert.strictEqual(escaped.includes("<script>"), false);
    assert.strictEqual(escaped.includes("</script>"), false);
    assert.strictEqual(escaped.includes("&lt;script&gt;"), true);
    assert.strictEqual(escaped.includes("&quot;XSS&quot;"), true);
    assert.strictEqual(escaped.includes("&#39;x&#39;"), true);
  });

  it("escapeHtml should handle null and non-string inputs safely", () => {
    assert.strictEqual(escapeHtml(null), "");
    assert.strictEqual(escapeHtml(undefined), "");
    assert.strictEqual(escapeHtml(123), "");
  });

  it("sanitizeString should trim, strip control characters, and respect max length", () => {
    const dirty = "  Hello \x00\x08World!  ";
    const cleaned = sanitizeString(dirty, 10);
    assert.strictEqual(cleaned, "Hello Worl");
  });

  it("sanitizeNumber should constrain values to safe ranges", () => {
    assert.strictEqual(sanitizeNumber(50, 0, 100), 50);
    assert.strictEqual(sanitizeNumber(-25, 0, 100), 0);
    assert.strictEqual(sanitizeNumber(9999, 0, 100), 100);
    assert.strictEqual(sanitizeNumber("invalid", 0, 100, 10), 10);
    assert.strictEqual(sanitizeNumber(82.6, 0, 100), 83);
  });

  it("Incident enums should include standard industry categories", () => {
    assert.strictEqual(VALID_INCIDENT_TYPES.includes("Hazard"), true);
    assert.strictEqual(VALID_INCIDENT_TYPES.includes("Gas Alarm"), true);
    assert.strictEqual(VALID_SEVERITIES.includes("High"), true);
    assert.strictEqual(VALID_SEVERITIES.includes("Medium"), true);
    assert.strictEqual(VALID_SEVERITIES.includes("Low"), true);
  });
});
