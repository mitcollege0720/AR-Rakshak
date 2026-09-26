// Centralized API Client with Timeout, Error Handling, and Offline Resilience

const API = {
  timeoutMs: 9000,

  async request(url, options = {}) {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), options.timeout || this.timeoutMs);

    const headers = {
      "Accept": "application/json",
      ...(options.body ? { "Content-Type": "application/json" } : {}),
      ...(options.headers || {})
    };

    try {
      const response = await fetch(url, {
        ...options,
        headers,
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      let payload = null;
      const contentType = response.headers.get("content-type");
      if (contentType && contentType.includes("application/json")) {
        try {
          payload = await response.json();
        } catch (jsonErr) {
          throw new Error("Invalid response format received from server.");
        }
      } else {
        const text = await response.text();
        payload = { success: response.ok, data: text };
      }

      if (!response.ok) {
        const errorMsg = (payload && payload.error && payload.error.message)
          ? payload.error.message
          : `HTTP error ${response.status}: ${response.statusText}`;
        const error = new Error(errorMsg);
        error.status = response.status;
        error.code = payload?.error?.code || "HTTP_ERROR";
        error.details = payload?.error?.details || [];
        throw error;
      }

      // Unwrap standard API response envelope
      if (payload && typeof payload === "object" && "data" in payload && payload.success !== undefined) {
        return payload.data;
      }

      return payload;
    } catch (err) {
      clearTimeout(timeoutId);

      if (err.name === "AbortError") {
        throw new Error("Network request timed out. Please check your connection.");
      }

      if (!navigator.onLine || err.message.includes("Failed to fetch")) {
        const netErr = new Error("Device is offline. Saved action will sync when reconnected.");
        netErr.isOffline = true;
        throw netErr;
      }

      throw err;
    }
  },

  get(url, options = {}) {
    return this.request(url, { ...options, method: "GET" });
  },

  post(url, body, options = {}) {
    return this.request(url, {
      ...options,
      method: "POST",
      body: JSON.stringify(body)
    });
  },

  patch(url, body, options = {}) {
    return this.request(url, {
      ...options,
      method: "PATCH",
      body: JSON.stringify(body)
    });
  }
};
