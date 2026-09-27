// Safety Certificate Generator and Printable View

const CertificateManager = {
  async show(workerId, moduleId) {
    CameraManager.stopCamera();
    const appEl = document.getElementById("app");
    renderLoading(appEl, "Generating verified safety certificate...");

    try {
      const cert = await API.get(`/api/certificate/${encodeURIComponent(workerId)}/${encodeURIComponent(moduleId)}`);
      this.renderCertificate(cert);
    } catch (err) {
      renderErrorState(appEl, "Failed to retrieve certificate details.", () => {
        CertificateManager.show(workerId, moduleId);
      });
    }
  },

  renderCertificate(cert) {
    shell(`
      <div class="certificate-container">
        <div class="certificate-card" id="printableCert">
          <div class="cert-border-inner">
            <div class="cert-header">
              <div class="cert-logo">🛡️ AR Rakshak</div>
              <div class="cert-badge">INDUSTRIAL SAFETY COMPLIANT</div>
            </div>

            <div class="cert-body">
              <div class="pill pill-sector">${escapeHtml(cert.sector)} SECTOR TRAINING</div>
              <h1 class="cert-title">${t("certTitle")}</h1>
              <p class="cert-intro">${t("certIssuedTo")}</p>
              <h2 class="cert-worker-name">${escapeHtml(cert.worker)}</h2>
              <p class="cert-worker-id">Worker ID: <b>${escapeHtml(cert.workerId)}</b></p>
              <div class="cert-divider"></div>
              <p class="cert-statement">${escapeHtml(cert.statement)}</p>
              <h3 class="cert-module-name">${escapeHtml(cert.module)}</h3>
              <p class="cert-details">
                Operational Zone: <b>${escapeHtml(cert.zone || 'MINE-ENTRANCE')}</b> •
                Assessment Score: <b>${cert.score}%</b>
              </p>
            </div>

            <div class="cert-footer">
              <div class="cert-signature">
                <div class="signature-line"></div>
                <small>Safety Training Director</small>
                <b>AR-RAKSHAK System</b>
              </div>

              <div class="cert-qr-mock">
                <div class="qr-box">
                  <div class="qr-pattern"></div>
                </div>
                <small>Verification Code</small>
              </div>

              <div class="cert-meta">
                <p>Issue Date: <b>${escapeHtml(cert.issued)}</b></p>
                <p class="cert-id-text">ID: <code>${escapeHtml(cert.certificateId)}</code></p>
              </div>
            </div>
          </div>
        </div>

        <div class="cert-actions no-print">
          <button class="btn green" onclick="window.print()">
            🖨️ ${t("certPrint")}
          </button>
          <button class="btn secondary" onclick="showTraining()">
            ← Back to Modules
          </button>
          <button class="btn secondary" onclick="showHome()">
            ⌂ Return Home
          </button>
        </div>
      </div>
    `);
  }
};
