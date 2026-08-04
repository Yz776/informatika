/* NovaShield v2.1 - Options Logic */
const API = (typeof browser !== "undefined") ? browser : chrome;

const FEATURE_GROUPS = {
  general: [
    { key: "enabled", title: "Aktifkan Adblock", desc: "Master switch." },
    { key: "trackersEnabled", title: "Blokir Tracker", desc: "Google Analytics, FB Pixel, dll." },
    { key: "cosmeticEnabled", title: "Cosmetic Filtering", desc: "Sembunyikan elemen iklan." },
    { key: "antiAdblockEnabled", title: "Anti-Adblock Bypass", desc: "Bypass deteksi anti-adblock." },
    { key: "malwareBlock", title: "Malware / Phishing Blocker", desc: "122+ domain berbahaya." },
    { key: "httpsUpgrade", title: "HTTPS Upgrade", desc: "Paksa HTTP -> HTTPS." },
  ],
  youtube: [
    { key: "ytBlockEnabled", title: "YouTube Ad Blocking", desc: "Blokir request iklan YouTube." },
    { key: "ytAutoSkip", title: "Auto-Skip Iklan", desc: "Klik 'Lewati iklan' otomatis." },
    { key: "ytSpeedUp", title: "Speed-up Iklan", desc: "16x cepat + mute." },
    { key: "sponsorBlockEnabled", title: "SponsorBlock", desc: "Skip segmen sponsor." },
  ],
  privacy: [
    { key: "webrtcProtect", title: "WebRTC IP Leak Protect", desc: "Cegah IP lokal terbongkar." },
    { key: "canvasProtect", title: "Canvas Fingerprint Protect", desc: "Noise di toDataURL." },
    { key: "audioProtect", title: "Audio Fingerprint Protect", desc: "Noise di AnalyserNode." },
    { key: "fontProtect", title: "Hardware Spoof", desc: "Cap CPU=4, RAM=4, block Battery." },
  ],
  annoyance: [
    { key: "cookieBlock", title: "Cookie Consent Auto-Reject", desc: "OneTrust, Didomi, Quantcast." },
    { key: "notifBlock", title: "Notification Blocker", desc: "Tolak semua notifikasi." },
    { key: "autoplayBlock", title: "Autoplay Video Blocker", desc: "Cegah video autoplay muted." },
    { key: "exitConfirmBlock", title: "Exit Confirmation Blocker", desc: "Block 'Yakin keluar?'." },
    { key: "stickyHeaderBlock", title: "Sticky Header Blocker", desc: "Lepaskan header menempel." },
    { key: "newsletterPopupBlock", title: "Newsletter Popup Blocker", desc: "Tutup pop-up subscribe." },
    { key: "socialWidgetsBlock", title: "Social Widgets Blocker", desc: "FB Like, Twitter embed (OFF)." },
  ],
};

function sendMessage(msg) {
  return new Promise((resolve) => {
    API.runtime.sendMessage(msg, (resp) => {
      if (API.runtime.lastError) resolve({ ok: false, error: API.runtime.lastError.message });
      else resolve(resp);
    });
  });
}
function formatNumber(n) { return Number(n || 0).toLocaleString("id-ID"); }
function formatDate(ts) { if (!ts) return "—"; return new Date(ts).toLocaleDateString("id-ID", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" }); }
function showToast(text) { const t = document.getElementById("toast"); t.textContent = text; t.classList.add("show"); clearTimeout(t.__timeout); t.__timeout = setTimeout(() => t.classList.remove("show"), 2200); }

function setupNav() {
  document.querySelectorAll(".nav-item").forEach((item) => {
    item.addEventListener("click", (e) => {
      e.preventDefault();
      const target = item.dataset.section;
      document.querySelectorAll(".nav-item").forEach((i) => i.classList.remove("active"));
      item.classList.add("active");
      document.querySelectorAll(".content-section").forEach((s) => s.classList.remove("active"));
      document.getElementById(`section-${target}`).classList.add("active");
    });
  });
}

function renderCard(cardId, features, state) {
  const card = document.getElementById(cardId);
  if (!card) return;
  card.innerHTML = "";
  features.forEach((feat, i) => {
    if (i > 0) { const d = document.createElement("div"); d.className = "card-divider"; card.appendChild(d); }
    const row = document.createElement("div"); row.className = "card-row";
    const info = document.createElement("div"); info.className = "card-info";
    const title = document.createElement("div"); title.className = "card-title"; title.textContent = feat.title;
    const desc = document.createElement("div"); desc.className = "card-desc"; desc.textContent = feat.desc;
    info.appendChild(title); info.appendChild(desc);
    const label = document.createElement("label"); label.className = "switch";
    const input = document.createElement("input"); input.type = "checkbox"; input.dataset.key = feat.key;
    input.checked = !!state[feat.key];
    if (feat.key !== "enabled" && !state.enabled) input.disabled = true;
    if (!state.activated) input.disabled = true;
    input.addEventListener("change", async () => {
      const value = input.checked;
      if (feat.key === "enabled") await sendMessage({ type: "SET_ENABLED", enabled: value });
      else await sendMessage({ type: "SET_FEATURE", key: feat.key, value });
      showToast(`${feat.title}: ${value ? "ON" : "OFF"}`);
      const r = await sendMessage({ type: "GET_STATE" });
      if (r && r.ok) renderAllCards(r.state);
    });
    const slider = document.createElement("span"); slider.className = "slider";
    label.appendChild(input); label.appendChild(slider);
    row.appendChild(info); row.appendChild(label);
    card.appendChild(row);
  });
}

async function renderAllCards(state) {
  renderCard("card-general", FEATURE_GROUPS.general, state);
  renderCard("card-youtube", FEATURE_GROUPS.youtube, state);
  renderCard("card-privacy", FEATURE_GROUPS.privacy, state);
  renderCard("card-annoyance", FEATURE_GROUPS.annoyance, state);
}

async function loadAll() {
  const resp = await sendMessage({ type: "GET_STATE" });
  if (!resp || !resp.ok) return;
  await renderAllCards(resp.state);
  await loadWhitelist(resp.state);
  await loadCustomFilters(resp.state);
  await loadFilterList(resp.state);
  await loadStats(resp.state);
}

async function loadWhitelist(state) {
  const list = state.whitelist || [];
  const container = document.getElementById("whitelistList");
  container.innerHTML = "";
  if (list.length === 0) { const e = document.createElement("div"); e.className = "whitelist-empty"; e.textContent = "Belum ada situs di whitelist."; container.appendChild(e); return; }
  list.sort().forEach((domain) => {
    const item = document.createElement("div"); item.className = "whitelist-item";
    const span = document.createElement("span"); span.className = "whitelist-domain"; span.textContent = domain;
    const btn = document.createElement("button"); btn.className = "whitelist-remove"; btn.innerHTML = "&times;"; btn.title = "Hapus";
    btn.addEventListener("click", async () => { await sendMessage({ type: "REMOVE_WHITELIST", domain }); showToast(`Dihapus: ${domain}`); const r = await sendMessage({ type: "GET_STATE" }); if (r && r.ok) await loadWhitelist(r.state); });
    item.appendChild(span); item.appendChild(btn); container.appendChild(item);
  });
}

async function loadCustomFilters(state) {
  const list = state.customFilterLists || [];
  const container = document.getElementById("customFilterList");
  container.innerHTML = "";
  if (list.length === 0) { const e = document.createElement("div"); e.className = "whitelist-empty"; e.textContent = "Belum ada custom filter list."; container.appendChild(e); return; }
  list.forEach((url) => {
    const item = document.createElement("div"); item.className = "whitelist-item";
    const span = document.createElement("span"); span.className = "whitelist-domain"; span.style.wordBreak = "break-all"; span.textContent = url;
    const btn = document.createElement("button"); btn.className = "whitelist-remove"; btn.innerHTML = "&times;";
    btn.addEventListener("click", async () => { await sendMessage({ type: "REMOVE_CUSTOM_FILTER_LIST", url }); showToast(`Dihapus`); const r = await sendMessage({ type: "GET_STATE" }); if (r && r.ok) await loadCustomFilters(r.state); });
    item.appendChild(span); item.appendChild(btn); container.appendChild(item);
  });
}

async function loadFilterList(state) {
  const status = document.getElementById("easyListStatus");
  const count = state.easyListRulesCount || 0;
  status.textContent = count > 0 ? `Aktif - ${formatNumber(count)} aturan (${formatDate(state.lastEasyListUpdate)})` : "Belum diupdate";
}

async function loadStats(state) {
  document.getElementById("statTotal").textContent = formatNumber(state.statsTotal);
  document.getElementById("statRules").textContent = formatNumber(157 + 193 + 58 + 122 + 1 + (state.easyListRulesCount || 0));
  document.getElementById("statUpdated").textContent = formatDate(state.lastEasyListUpdate);
  document.getElementById("statInstall").textContent = formatDate(state.installDate);
  const topContainer = document.getElementById("topDomains");
  const domains = Object.entries(state.statsPerDomain || {}).sort((a, b) => b[1] - a[1]).slice(0, 10);
  if (domains.length === 0) {
    const e = document.createElement("div"); e.className = "whitelist-empty"; e.textContent = "Belum ada data statistik.";
    topContainer.appendChild(e); return;
  }
  const max = domains[0][1];
  topContainer.innerHTML = "";
  domains.forEach(([host, count], i) => {
    const item = document.createElement("div"); item.className = "domain-item";
    const rank = document.createElement("span"); rank.className = "domain-rank"; rank.textContent = `#${i + 1}`;
    const name = document.createElement("span"); name.className = "domain-name"; name.textContent = host;
    const barContainer = document.createElement("div"); barContainer.className = "domain-bar-container";
    const bar = document.createElement("div"); bar.className = "domain-bar"; bar.style.width = `${(count / max * 100).toFixed(1)}%`;
    barContainer.appendChild(bar);
    const countSpan = document.createElement("span"); countSpan.className = "domain-count"; countSpan.textContent = formatNumber(count);
    item.appendChild(rank); item.appendChild(name); item.appendChild(barContainer); item.appendChild(countSpan);
    topContainer.appendChild(item);
  });
}

function setupInputs() {
  const addDomain = async () => {
    let domain = document.getElementById("whitelistInput").value.trim().toLowerCase();
    if (!domain) return;
    domain = domain.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0];
    if (!domain || !domain.includes(".")) { showToast("Domain tidak valid"); return; }
    await sendMessage({ type: "ADD_WHITELIST", domain });
    showToast(`Ditambahkan: ${domain}`);
    document.getElementById("whitelistInput").value = "";
    const r = await sendMessage({ type: "GET_STATE" }); if (r && r.ok) await loadWhitelist(r.state);
  };
  document.getElementById("whitelistAddBtn").addEventListener("click", addDomain);
  document.getElementById("whitelistInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addDomain(); });

  const addFilter = async () => {
    const url = document.getElementById("customFilterInput").value.trim();
    if (!url || !/^https?:\/\//.test(url)) { showToast("URL tidak valid"); return; }
    await sendMessage({ type: "ADD_CUSTOM_FILTER_LIST", url });
    showToast(`Ditambahkan`);
    document.getElementById("customFilterInput").value = "";
    const r = await sendMessage({ type: "GET_STATE" }); if (r && r.ok) await loadCustomFilters(r.state);
  };
  document.getElementById("customFilterAddBtn").addEventListener("click", addFilter);
  document.getElementById("customFilterInput").addEventListener("keydown", (e) => { if (e.key === "Enter") addFilter(); });

  document.getElementById("updateEasyListBtn").addEventListener("click", async () => {
    const btn = document.getElementById("updateEasyListBtn");
    btn.disabled = true; const t = btn.textContent; btn.textContent = "Mengupdate...";
    const resp = await sendMessage({ type: "REFRESH_EASYLIST" });
    btn.disabled = false; btn.textContent = t;
    if (resp && resp.ok) { showToast(`Filter: ${formatNumber(resp.count)} aturan`); const r = await sendMessage({ type: "GET_STATE" }); if (r && r.ok) { await loadFilterList(r.state); await loadStats(r.state); } }
    else showToast("Gagal update");
  });

  document.getElementById("resetStatsBtn").addEventListener("click", async () => {
    if (!confirm("Yakin reset statistik?")) return;
    await sendMessage({ type: "RESET_STATS" });
    showToast("Statistik direset");
    const r = await sendMessage({ type: "GET_STATE" }); if (r && r.ok) await loadStats(r.state);
  });

  document.getElementById("exportBtn").addEventListener("click", async () => {
    const resp = await sendMessage({ type: "EXPORT_SETTINGS" });
    if (!resp || !resp.ok) { showToast("Gagal export"); return; }
    const blob = new Blob([JSON.stringify(resp.data, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a"); a.href = url; a.download = `novashield-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    showToast("Exported");
  });
  document.getElementById("importBtn").addEventListener("click", () => document.getElementById("importFile").click());
  document.getElementById("importFile").addEventListener("change", async (e) => {
    const file = e.target.files[0]; if (!file) return;
    const reader = new FileReader();
    reader.onload = async () => {
      try {
        const data = JSON.parse(reader.result);
        const resp = await sendMessage({ type: "IMPORT_SETTINGS", data });
        if (resp && resp.ok) { showToast("Imported"); await loadAll(); } else showToast("Gagal import");
      } catch (err) { showToast("JSON tidak valid"); }
    };
    reader.readAsText(file); e.target.value = "";
  });
  document.getElementById("resetAllBtn").addEventListener("click", async () => {
    if (!confirm("Reset SEMUA pengaturan?")) return;
    const defaults = { enabled: true, trackersEnabled: true, cosmeticEnabled: true, antiAdblockEnabled: true, ytBlockEnabled: true, ytAutoSkip: true, ytSpeedUp: true, sponsorBlockEnabled: true, cookieBlock: true, notifBlock: true, autoplayBlock: true, exitConfirmBlock: true, stickyHeaderBlock: true, socialWidgetsBlock: false, newsletterPopupBlock: true, webrtcProtect: true, canvasProtect: true, audioProtect: true, fontProtect: true, httpsUpgrade: true, malwareBlock: true, whitelist: ["ahsangresik.me", "localhost", "127.0.0.1"], pausedSites: {}, customHideRules: {}, customFilterLists: [], statsTotal: 0, statsPerDomain: {} };
    await sendMessage({ type: "IMPORT_SETTINGS", data: defaults });
    showToast("Reset ke default");
    await loadAll();
  });
}

document.addEventListener("DOMContentLoaded", async () => {
  setupNav(); setupInputs();
  const manifest = API.runtime.getManifest();
  document.getElementById("aboutVersion").textContent = manifest.version || "2.1.0";
  await loadAll();
});
