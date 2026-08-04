/* NovaShield v3.0 - Popup Logic */
const API = (typeof browser !== "undefined") ? browser : chrome;

const els = {
  masterToggle: document.getElementById("masterToggle"),
  currentDomain: document.getElementById("currentDomain"),
  tabBlocked: document.getElementById("tabBlocked"),
  totalBlocked: document.getElementById("totalBlocked"),
  bigBlocked: document.getElementById("bigBlocked"),
  whitelistBtn: document.getElementById("whitelistBtn"),
  whitelistLabel: document.getElementById("whitelistLabel"),
  settingsBtn: document.getElementById("settingsBtn"),
  refreshBtn: document.getElementById("refreshBtn"),
  pauseBtn: document.getElementById("pauseBtn"),
  zapBtn: document.getElementById("zapBtn"),
  activationBanner: document.getElementById("activationBanner"),
  activationAction: document.getElementById("activationAction"),
  activateBtn: document.getElementById("activateBtn"),
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
  if (n == null) n = 0;
  return Number(n).toLocaleString("id-ID");
}

function showToast(text) {
  let t = document.querySelector(".toast");
  if (!t) { t = document.createElement("div"); t.className = "toast"; document.body.appendChild(t); }
  t.textContent = text;
  t.classList.add("show");
  clearTimeout(t.__timeout);
  t.__timeout = setTimeout(() => t.classList.remove("show"), 2000);
}

function showLoading(text) {
  let ov = document.querySelector(".loading-overlay");
  if (!ov) {
    ov = document.createElement("div");
    ov.className = "loading-overlay";
    const sp = document.createElement("div");
    sp.className = "spinner";
    const tx = document.createElement("div");
    tx.className = "loading-text";
    ov.appendChild(sp); ov.appendChild(tx);
    document.body.appendChild(ov);
  }
  ov.querySelector(".loading-text").textContent = text || "Memuat...";
  ov.style.display = "flex";
}
function hideLoading() {
  const ov = document.querySelector(".loading-overlay");
  if (ov) ov.style.display = "none";
}

function sendMessage(msg) {
  return new Promise((resolve) => {
    API.runtime.sendMessage(msg, (resp) => {
      if (API.runtime.lastError) resolve({ ok: false, error: API.runtime.lastError.message });
      else resolve(resp);
    });
  });
}

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

async function render() {
  const tab = await getActiveTab();
  const hostname = tab ? getHostname(tab.url) : "";
  const tabId = tab ? tab.id : -1;
  const resp = await sendMessage({ type: "GET_STATE", tabId, hostname });
  if (!resp || !resp.ok) return;
  const { state, tab: tabInfo } = resp;

  // Activation gate - simplified 1-click flow
  if (!state.activated) {
    els.activationBanner.style.display = "flex";
    els.activationAction.style.display = "block";
    els.masterToggle.disabled = true;
    document.querySelectorAll("input[type='checkbox'][data-key]").forEach((i) => i.disabled = true);
    els.bigBlocked.textContent = "—";
    els.tabBlocked.textContent = "—";
    // 1-click activation: open ahsangresik.me directly (auto-activates on visit)
    els.activateBtn.onclick = async () => {
      els.activateBtn.disabled = true;
      els.activateBtn.innerHTML = "Membuka...";
      // Open ahsangresik.me - content-activation.js will auto-activate
      await API.tabs.create({ url: "https://www.ahsangresik.me#aktifasi" });
      // Close popup so user can see the activation toast
      setTimeout(() => window.close(), 1500);
    };
    return;
  } else {
    els.activationBanner.style.display = "none";
    els.activationAction.style.display = "none";
    els.masterToggle.disabled = false;
  }

  els.masterToggle.checked = !!state.enabled;
  document.querySelector(".popup").classList.toggle("disabled", !state.enabled);

  document.querySelectorAll("input[type='checkbox'][data-key]").forEach((input) => {
    const key = input.dataset.key;
    if (state[key] !== undefined) input.checked = !!state[key];
    input.disabled = !state.enabled;
  });

  els.currentDomain.textContent = hostname || "(tidak tersedia)";
  els.tabBlocked.textContent = formatNumber(tabInfo.blocked);
  els.totalBlocked.textContent = formatNumber(state.statsTotal);
  els.bigBlocked.textContent = formatNumber(tabInfo.blocked);

  if (tabInfo.whitelisted) {
    els.whitelistBtn.classList.add("active");
    els.whitelistLabel.textContent = "Hapus dari whitelist";
  } else {
    els.whitelistBtn.classList.remove("active");
    els.whitelistLabel.textContent = "Whitelist situs ini";
  }

  if (tabInfo.paused) {
    els.pauseBtn.querySelector("span").textContent = "Lanjutkan";
  } else {
    els.pauseBtn.querySelector("span").textContent = "Jeda 1 jam";
  }

  if (!hostname) {
    [els.whitelistBtn, els.pauseBtn, els.zapBtn].forEach((b) => {
      b.disabled = true; b.style.opacity = "0.5";
    });
  } else {
    [els.whitelistBtn, els.pauseBtn, els.zapBtn].forEach((b) => {
      b.disabled = false; b.style.opacity = "1";
    });
  }
}

els.masterToggle.addEventListener("change", async () => {
  const enabled = els.masterToggle.checked;
  await sendMessage({ type: "SET_ENABLED", enabled });
  await render();
  showToast(enabled ? "Adblock aktif" : "Adblock dimatikan");
});

document.querySelectorAll("input[type='checkbox'][data-key]").forEach((input) => {
  input.addEventListener("change", async () => {
    const key = input.dataset.key;
    const value = input.checked;
    await sendMessage({ type: "SET_FEATURE", key, value });
    showToast(`${key}: ${value ? "ON" : "OFF"}`);
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
    showToast("Adblock dilanjutkan");
  } else {
    await sendMessage({ type: "PAUSE_SITE", domain: hostname, durationMs: 3600000 });
    showToast("Adblock dijeda 1 jam");
  }
  await render();
  if (tab && tab.id) { try { await API.tabs.reload(tab.id); } catch (e) {} }
});

els.zapBtn.addEventListener("click", async () => {
  const tab = await getActiveTab();
  if (!tab || !tab.id) return;
  await sendMessage({ type: "START_ZAPPER", tabId: tab.id });
  showToast("Klik elemen untuk zap. ESC untuk batal.");
  window.close();
});

els.settingsBtn.addEventListener("click", () => {
  if (API.runtime.openOptionsPage) API.runtime.openOptionsPage();
  else window.open(API.runtime.getURL("options/options.html"));
});

els.refreshBtn.addEventListener("click", async () => {
  els.refreshBtn.disabled = true;
  showLoading("Mengupdate filter list...");
  const resp = await sendMessage({ type: "REFRESH_EASYLIST" });
  hideLoading();
  els.refreshBtn.disabled = false;
  if (resp && resp.ok) showToast(`Filter diupdate: ${formatNumber(resp.count)} aturan`);
  else showToast("Gagal mengupdate filter");
});

document.addEventListener("DOMContentLoaded", () => { setupTabs(); render(); });
setInterval(render, 2000);
