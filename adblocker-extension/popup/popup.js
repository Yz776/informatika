/* =====================================================================
 * NovaShield v3.5 - Popup Logic with Confirmation Modal
 * ===================================================================== */

const API = (typeof browser !== "undefined") ? browser : chrome;

// Heavy features yang butuh konfirmasi saat di-enable
const HEAVY_FEATURES = [
  "popupBlock", "redirectBlock", "mlEnabled", "contentFilter",
  "strictRedirect", "sponsorBlockEnabled", "webrtcProtect",
  "canvasProtect", "audioProtect",
  "ipMaskerEnabled", // v3.7: IP Masker (proxy)
];

// Descriptions for heavy features
const HEAVY_FEATURE_INFO = {
  popupBlock: { title: "Popup Blocker", desc: "Memantau semua window.open() di setiap halaman. Memakai RAM ~15-25MB." },
  redirectBlock: { title: "Redirect Blocker", desc: "Intercept location.href/assign/replace. Memakai RAM ~10-20MB." },
  mlEnabled: { title: "ML Heuristic Detector", desc: "Scan DOM untuk deteksi iklan cerdas. Memakai RAM ~30-50MB + CPU." },
  contentFilter: { title: "Content Filter", desc: "Scan text untuk kata judi/porno/scam. Memakai RAM ~20-30MB." },
  strictRedirect: { title: "Strict Redirect Block", desc: "Track redirect chain + suspicious patterns. Memakai RAM ~15-25MB." },
  sponsorBlockEnabled: { title: "SponsorBlock", desc: "Fetch segment data dari API. Memakai network + RAM ~10-15MB per video." },
  webrtcProtect: { title: "WebRTC IP Leak Protect", desc: "Override RTCPeerConnection. Dapat break video call di beberapa situs." },
  canvasProtect: { title: "Canvas Fingerprint Protect", desc: "Inject noise ke canvas API. Memakai CPU ~5-10%." },
  audioProtect: { title: "Audio Fingerprint Protect", desc: "Override AnalyserNode. Memakai CPU ~3-5%." },
  ipMaskerEnabled: { title: "IP Masker (Proxy)", desc: "Route semua traffic melalui proxy HTTP 78.154.103.38:11560. Situs banking/e-commerce di-bypass untuk keamanan. Mungkin memperlambat koneksi." },
};

const els = {
  popup: document.getElementById("popup"),
  masterToggle: document.getElementById("masterToggle"),
  bigBlocked: document.getElementById("bigBlocked"),
  totalBlocked: document.getElementById("totalBlocked"),
  currentDomain: document.getElementById("currentDomain"),
  statusBadge: document.getElementById("statusBadge"),
  activationBanner: document.getElementById("activationBanner"),
  activateBtn: document.getElementById("activateBtn"),
  activateManualBtn: document.getElementById("activateManualBtn"),
  updateBanner: document.getElementById("updateBanner"),
  updateVersion: document.getElementById("updateVersion"),
  updateDesc: document.getElementById("updateDesc"),
  whitelistBtn: document.getElementById("whitelistBtn"),
  whitelistLabel: document.getElementById("whitelistLabel"),
  pauseBtn: document.getElementById("pauseBtn"),
  pauseLabel: document.getElementById("pauseLabel"),
  zapBtn: document.getElementById("zapBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  // Modal
  confirmModal: document.getElementById("confirmModal"),
  modalTitle: document.getElementById("modalTitle"),
  modalDesc: document.getElementById("modalDesc"),
  modalCancel: document.getElementById("modalCancel"),
  modalConfirm: document.getElementById("modalConfirm"),
};

async function getActiveTab() {
  return new Promise((resolve) => {
    API.tabs.query({ active: true, currentWindow: true }, (tabs) => resolve(tabs && tabs[0]));
  });
}

function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch (e) { return ""; }
}

function formatNumber(n) {
  return Number(n || 0).toLocaleString("id-ID");
}

function showToast(text) {
  let t = document.querySelector(".toast");
  if (!t) {
    t = document.createElement("div");
    t.className = "toast";
    els.popup.appendChild(t);
  }
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(t.__timeout);
  t.__timeout = setTimeout(() => t.classList.remove("show"), 2200);
}

function sendMessage(msg) {
  return new Promise((resolve) => {
    API.runtime.sendMessage(msg, (resp) => {
      if (API.runtime.lastError) resolve({ ok: false, error: API.runtime.lastError.message });
      else resolve(resp);
    });
  });
}

/* ================================================================== *
 * Tab navigation
 * ================================================================== */
function setupTabs() {
  document.querySelectorAll(".tab-btn").forEach((btn) => {
    btn.addEventListener("click", () => {
      const target = btn.dataset.tab;
      document.querySelectorAll(".tab-btn").forEach((b) => b.classList.remove("active"));
      btn.classList.add("active");
      document.querySelectorAll(".tab-content").forEach((s) => s.classList.remove("active"));
      document.getElementById(`tab-${target}`).classList.add("active");
    });
  });
}

/* ================================================================== *
 * Confirmation Modal for heavy features
 * ================================================================== */
let pendingToggle = null;

function showConfirmModal(featureKey, onConfirm) {
  const info = HEAVY_FEATURE_INFO[featureKey];
  if (!info) { onConfirm(); return; }

  els.modalTitle.textContent = `Aktifkan ${info.title}?`;
  els.modalDesc.textContent = info.desc + " Lanjutkan?";
  els.confirmModal.style.display = "flex";

  pendingToggle = { featureKey, onConfirm };
}

function hideModal() {
  els.confirmModal.style.display = "none";
  pendingToggle = null;
}

els.modalCancel.addEventListener("click", () => {
  // Revert the checkbox since user cancelled
  if (pendingToggle) {
    const input = document.querySelector(`input[data-key="${pendingToggle.featureKey}"]`);
    if (input) input.checked = false;
  }
  hideModal();
});

els.modalConfirm.addEventListener("click", () => {
  if (pendingToggle) {
    pendingToggle.onConfirm();
  }
  hideModal();
});

/* ================================================================== *
 * Render popup state
 * ================================================================== */
async function render() {
  const tab = await getActiveTab();
  const hostname = tab ? getHostname(tab.url) : "";
  const tabId = tab ? tab.id : -1;
  const resp = await sendMessage({ type: "GET_STATE", tabId, hostname });
  if (!resp || !resp.ok) return;
  const { state, tab: tabInfo } = resp;

  // Update banner
  if (state.updateAvailable && state.latestVersion) {
    els.updateBanner.style.display = "flex";
    els.updateVersion.textContent = state.latestVersion;
    if (state.updateDownloaded) {
      els.updateDesc.textContent = "Didownload! Klik untuk apply";
    } else {
      els.updateDesc.textContent = `Anda: v${state.version || "3.9.0"}`;
    }
    els.updateBanner.onclick = async () => {
      if (state.updateDownloaded) {
        await sendMessage({ type: "APPLY_UPDATE" });
        showToast("Buka chrome://extensions untuk reload");
      } else {
        showToast("Mendownload update...");
        const resp = await sendMessage({ type: "AUTO_UPDATE_NOW" });
        if (resp && resp.downloaded) {
          showToast("Update didownload! Klik banner lagi untuk apply");
        } else if (resp && resp.ok) {
          showToast("Sudah versi terbaru");
        } else {
          showToast("Gagal download, coba manual");
        }
      }
    };
  } else {
    els.updateBanner.style.display = "none";
  }

  // v4.0: No activation gate - show normal UI always
  els.activationBanner.style.display = "none";
  els.masterToggle.disabled = false;

  els.masterToggle.checked = !!state.enabled;
  els.popup.classList.toggle("disabled", !state.enabled);
  els.statusBadge.textContent = state.enabled ? "Aktif" : "Nonaktif";
  els.statusBadge.className = state.enabled ? "status-active" : "status-inactive";

  // Set all toggle states
  document.querySelectorAll("input[type='checkbox'][data-key]").forEach((input) => {
    const key = input.dataset.key;
    if (state[key] !== undefined) input.checked = !!state[key];
    input.disabled = !state.enabled;
  });

  // Stats
  els.bigBlocked.textContent = formatNumber(tabInfo.blocked);
  els.totalBlocked.textContent = formatNumber(state.statsTotal);
  els.currentDomain.textContent = hostname || "—";
  els.currentDomain.title = hostname || "";

  // Whitelist button
  if (tabInfo.whitelisted) {
    els.whitelistBtn.classList.add("active");
    els.whitelistLabel.textContent = "Whitelisted";
  } else {
    els.whitelistBtn.classList.remove("active");
    els.whitelistLabel.textContent = "Whitelist";
  }

  // Pause button
  if (tabInfo.paused) {
    els.pauseBtn.classList.add("active");
    els.pauseLabel.textContent = "Lanjut";
  } else {
    els.pauseBtn.classList.remove("active");
    els.pauseLabel.textContent = "Jeda";
  }

  // Disable buttons if no hostname
  const hasHost = !!hostname;
  [els.whitelistBtn, els.pauseBtn, els.zapBtn].forEach((b) => {
    b.disabled = !hasHost;
    b.style.opacity = hasHost ? "1" : "0.4";
  });
}

/* ================================================================== *
 * Event listeners
 * ================================================================== */
els.masterToggle.addEventListener("change", async () => {
  const enabled = els.masterToggle.checked;
  await sendMessage({ type: "SET_ENABLED", enabled });
  await render();
  showToast(enabled ? "NovaShield aktif" : "NovaShield dimatikan");
});

// Feature toggle handler with heavy feature confirmation
document.querySelectorAll("input[type='checkbox'][data-key]").forEach((input) => {
  input.addEventListener("change", async () => {
    const key = input.dataset.key;
    const value = input.checked;

    // If enabling a heavy feature, show confirmation
    if (value && HEAVY_FEATURES.includes(key)) {
      showConfirmModal(key, async () => {
        await sendMessage({ type: "SET_FEATURE", key, value });
        showToast(`${HEAVY_FEATURE_INFO[key].title}: ON`);
      });
    } else {
      await sendMessage({ type: "SET_FEATURE", key, value });
      showToast(`${key}: ${value ? "ON" : "OFF"}`);
    }
  });
});

els.whitelistBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  const hostname = tab ? getHostname(tab.url) : "";
  if (!hostname) return;
  await sendMessage({ type: "TOGGLE_WHITELIST_DOMAIN", domain: hostname });
  await render();
  if (tab && tab.id) { try { await API.tabs.reload(tab.id); } catch (e) {} }
});

els.pauseBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  const hostname = tab ? getHostname(tab.url) : "";
  if (!hostname) return;
  const resp = await sendMessage({ type: "GET_STATE", tabId: tab.id, hostname });
  if (resp && resp.ok && resp.tab.paused) {
    await sendMessage({ type: "UNPAUSE_SITE", domain: hostname });
    showToast("NovaShield dilanjutkan");
  } else {
    await sendMessage({ type: "PAUSE_SITE", domain: hostname, durationMs: 3600000 });
    showToast("Dijeda 1 jam");
  }
  await render();
  if (tab && tab.id) { try { await API.tabs.reload(tab.id); } catch (e) {} }
});

els.zapBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;
  await sendMessage({ type: "START_ZAPPER", tabId: tab.id });
  showToast("Klik elemen untuk zap. ESC batal.");
  window.close();
});

els.settingsBtn.addEventListener("click", () => {
  if (API.runtime.openOptionsPage) API.runtime.openOptionsPage();
  else window.open(API.runtime.getURL("options/options.html"));
});

els.refreshBtn.addEventListener("click", async () => {
  els.refreshBtn.disabled = true;
  showToast("Mengupdate filter...");
  const resp = await sendMessage({ type: "REFRESH_EASYLIST" });
  els.refreshBtn.disabled = false;
  if (resp && resp.ok) showToast(`Filter: ${formatNumber(resp.count)} aturan`);
  else showToast("Gagal update");
});

document.addEventListener("DOMContentLoaded", () => { setupTabs(); render(); });
setInterval(render, 2000);
