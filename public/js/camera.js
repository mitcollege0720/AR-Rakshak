// Real Camera and AR Simulation Stream Manager

const CameraManager = {
  activeStream: null,
  videoEl: null,
  isCameraActive: false,

  isSupported() {
    return !!(navigator.mediaDevices && typeof navigator.mediaDevices.getUserMedia === "function");
  },

  async startCamera(videoElement, onStatusChange) {
    this.stopCamera(); // Clean up any existing stream first

    this.videoEl = videoElement;

    if (!this.isSupported()) {
      if (onStatusChange) {
        onStatusChange({
          status: "unsupported",
          message: "Camera access is not supported on this browser or context. Visual simulation active."
        });
      }
      return false;
    }

    try {
      if (onStatusChange) onStatusChange({ status: "requesting", message: "Requesting camera access..." });

      // Prefer back camera on mobile (environment), with standard fallback
      let constraints = {
        video: {
          facingMode: { ideal: "environment" },
          width: { ideal: 1280 },
          height: { ideal: 720 }
        },
        audio: false
      };

      let stream = null;
      try {
        stream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        // Fallback to basic video constraint
        stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: false });
      }

      this.activeStream = stream;
      this.isCameraActive = true;

      if (this.videoEl) {
        this.videoEl.srcObject = stream;
        // Important: playsinline and muted for mobile Safari / Chrome autoplay
        this.videoEl.setAttribute("playsinline", "true");
        this.videoEl.muted = true;
        await this.videoEl.play();
      }

      if (onStatusChange) {
        onStatusChange({ status: "active", message: "Live camera feed active." });
      }

      return true;
    } catch (err) {
      this.stopCamera();

      let reason = "error";
      let userMsg = "Camera access failed. Using visual safety simulation.";

      if (err.name === "NotAllowedError" || err.name === "PermissionDeniedError") {
        reason = "denied";
        userMsg = "Camera permission was denied in your browser settings. Visual simulation active.";
      } else if (err.name === "NotFoundError" || err.name === "DevicesNotFoundError") {
        reason = "not_found";
        userMsg = "No video camera device was found on this system. Visual simulation active.";
      } else if (err.name === "NotReadableError" || err.name === "TrackStartError") {
        reason = "busy";
        userMsg = "Camera is currently in use by another application. Visual simulation active.";
      }

      console.warn("Camera init notification:", err.name, err.message);

      if (onStatusChange) {
        onStatusChange({ status: reason, message: userMsg, error: err });
      }
      return false;
    }
  },

  stopCamera() {
    if (this.activeStream) {
      try {
        const tracks = this.activeStream.getTracks();
        tracks.forEach((track) => {
          track.stop();
        });
      } catch (e) {
        console.warn("Error stopping tracks", e);
      }
      this.activeStream = null;
    }

    if (this.videoEl) {
      try {
        this.videoEl.pause();
        this.videoEl.srcObject = null;
      } catch (e) {
        // Ignore video pause errors
      }
      this.videoEl = null;
    }

    this.isCameraActive = false;
  }
};

// Ensure camera stops if user closes tab or navigates away
window.addEventListener("beforeunload", () => {
  CameraManager.stopCamera();
});

document.addEventListener("visibilitychange", () => {
  if (document.hidden && CameraManager.isCameraActive) {
    // Release camera if tab is hidden/backgrounded to preserve battery
    CameraManager.stopCamera();
  }
});
