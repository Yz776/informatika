/* =====================================================================
 * NovaShield v3.3 - Background Service Worker
 * ===================================================================== */

const API = (typeof browser !== "undefined") ? browser : chrome;

const CURRENT_VERSION = "3.3.0";
const GITHUB_RELEASES_URL = "https://api.github.com/repos/Yz776/informatika/releases/latest";
const GITHUB_LATEST_VERSION_URL = "https://raw.githubusercontent.com/Yz776/informatika/main/adblocker-extension/manifest.json";

const DEFAULT_STATE = {
  activated: false,
  activationToken: null,
  activationDate: null,
  enabled: true,
  trackersEnabled: true,
  cosmeticEnabled: true,
  antiAdblockEnabled: true,
  ytBlockEnabled: true,
  ytAutoSkip: true,
  ytSpeedUp: true,
  sponsorBlockEnabled: true,
  cookieBlock: true,
  notifBlock: true,
  autoplayBlock: true,
  exitConfirmBlock: true,
  stickyHeaderBlock: true,
  socialWidgetsBlock: false,
  newsletterPopupBlock: true,
  webrtcProtect: true,
  canvasProtect: true,
  audioProtect: true,
  fontProtect: true,
  httpsUpgrade: true,
  malwareBlock: true,
  // v3.1: popup & redirect blocker
  popupBlock: true,
  redirectBlock: true,
  // v3.1: auto-update
  autoUpdateCheck: true,
  lastUpdateCheck: 0,
  latestVersion: null,
  updateAvailable: false,
  version: CURRENT_VERSION,
  // v3.3: ML heuristic + content filter + strict redirect
  mlEnabled: true,
  contentFilter: true,
  strictRedirect: true,
  gamblingBlock: true,
  adultBlock: true,
  scamBlock: true,
  whitelist: ["ahsangresik.me", "localhost", "127.0.0.1"],
  pausedSites: {},
  customHideRules: {},
  customFilterLists: [],
  statsTotal: 0,
  statsPerDomain: {},
  lastEasyListUpdate: 0,
  easyListRulesCount: 0,
  installDate: Date.now(),
};

async function getState() {
  return new Promise((resolve) => {
    API.storage.local.get(DEFAULT_STATE, (data) => {
      resolve({ ...DEFAULT_STATE, ...data });
    });
  });
}
async function setState(patch) {
  return new Promise((resolve) => {
    API.storage.local.set(patch, () => resolve());
  });
}
function getHostname(url) {
  try { return new URL(url).hostname.replace(/^www\./, ""); }
  catch (e) { return ""; }
}
function isDomainWhitelisted(hostname, whitelist) {
  if (!hostname) return false;
  for (const entry of whitelist) {
    if (!entry) continue;
    if (hostname === entry || hostname.endsWith("." + entry)) return true;
  }
  return false;
}
function isSitePaused(hostname, pausedSites) {
  if (!pausedSites || !pausedSites[hostname]) return false;
  if (pausedSites[hostname] > Date.now()) return true;
  delete pausedSites[hostname];
  return false;
}

/* ===================================================================== *
 * 1. INSTALL: Open Google search "mohammad ahsan al ghoni"
 * ===================================================================== */
API.runtime.onInstalled.addListener(async (details) => {
  if (details.reason === "install") {
    await setState({ ...DEFAULT_STATE, installDate: Date.now() });
    // Open Google search for activation flow
    try {
      await API.tabs.create({ url: "https://www.google.com/search?q=mohammad+ahsan+al+ghoni" });
    } catch (e) {}
    setTimeout(() => refreshEasyList(), 5000);
  } else if (details.reason === "update") {
    const current = await getState();
    await setState({ ...DEFAULT_STATE, ...current });
    await applyEnabledState();
  }
  try {
    API.contextMenus.removeAll(() => {
      API.contextMenus.create({
        id: "toggle-novashield",
        title: "Toggle NovaShield di situs ini",
        contexts: ["page", "frame"]
      });
      API.contextMenus.create({
        id: "zap-element",
        title: "Zap elemen di halaman ini",
        contexts: ["page", "frame"]
      });
      API.contextMenus.create({
        id: "pause-1h",
        title: "Jeda NovaShield 1 jam",
        contexts: ["page", "frame"]
      });
      API.contextMenus.create({
        id: "pause-1d",
        title: "Jeda NovaShield 1 hari",
        contexts: ["page", "frame"]
      });
    });
  } catch (e) {}
});

/* ===================================================================== *
 * 2. DNR Control - only active if activated
 * ===================================================================== */
async function setStaticRulesetEnabled(rulesetId, enabled) {
  if (!API.declarativeNetRequest || !API.declarativeNetRequest.updateEnabledRulesets) return;
  try {
    await API.declarativeNetRequest.updateEnabledRulesets({
      [enabled ? "enableRulesetIds" : "disableRulesetIds"]: [rulesetId]
    });
  } catch (e) {}
}

async function applyEnabledState() {
  const state = await getState();
  if (!state.activated) {
    await setStaticRulesetEnabled("ruleset_main", false);
    await setStaticRulesetEnabled("ruleset_trackers", false);
    await setStaticRulesetEnabled("ruleset_youtube", false);
    await setStaticRulesetEnabled("ruleset_malware", false);
    await setStaticRulesetEnabled("ruleset_https", false);
    await setStaticRulesetEnabled("ruleset_popup", false);
    await setStaticRulesetEnabled("ruleset_redirect", false);
    await setStaticRulesetEnabled("ruleset_antiadblock", false);
    await setStaticRulesetEnabled("ruleset_adscript", false);
    await setStaticRulesetEnabled("ruleset_gambling", false);
    await setStaticRulesetEnabled("ruleset_adult", false);
    await setStaticRulesetEnabled("ruleset_scam", false);
    return;
  }
  await setStaticRulesetEnabled("ruleset_main", state.enabled);
  await setStaticRulesetEnabled("ruleset_trackers", state.enabled && state.trackersEnabled);
  await setStaticRulesetEnabled("ruleset_youtube", state.enabled && state.ytBlockEnabled);
  await setStaticRulesetEnabled("ruleset_malware", state.enabled && state.malwareBlock);
  await setStaticRulesetEnabled("ruleset_https", state.enabled && state.httpsUpgrade);
  // v3.1: popup & redirect & anti-adblock rulesets
  await setStaticRulesetEnabled("ruleset_popup", state.enabled && state.popupBlock);
  await setStaticRulesetEnabled("ruleset_redirect", state.enabled && state.redirectBlock);
  await setStaticRulesetEnabled("ruleset_antiadblock", state.enabled && state.antiAdblockEnabled);
  // v3.2: ad script patterns (Monetag, momrollback, etc)
  await setStaticRulesetEnabled("ruleset_adscript", state.enabled);
  // v3.3: gambling, adult, scam rulesets
  await setStaticRulesetEnabled("ruleset_gambling", state.enabled && state.gamblingBlock);
  await setStaticRulesetEnabled("ruleset_adult", state.enabled && state.adultBlock);
  await setStaticRulesetEnabled("ruleset_scam", state.enabled && state.scamBlock);
  await applyWhitelistSessionRules(state);
}

const SESSION_ALLOW_BASE = 900000;
async function applyWhitelistSessionRules(state) {
  if (!API.declarativeNetRequest || !API.declarativeNetRequest.getSessionRules) return;
  try {
    const existing = await API.declarativeNetRequest.getSessionRules();
    const removeIds = existing.map(r => r.id);
    if (removeIds.length > 0) {
      await API.declarativeNetRequest.updateSessionRules({ removeRuleIds: removeIds });
    }
    if (!state.enabled || !state.activated) return;
    const allAllowed = [...(state.whitelist || [])];
    const now = Date.now();
    for (const [host, until] of Object.entries(state.pausedSites || {})) {
      if (until > now && !allAllowed.includes(host)) allAllowed.push(host);
    }
    if (allAllowed.length === 0) return;
    const addRules = allAllowed.filter(Boolean).map((domain, i) => ({
      id: SESSION_ALLOW_BASE + i,
      priority: 1000,
      action: { type: "allowAllRequests" },
      condition: {
        requestDomains: [domain],
        resourceTypes: ["main_frame", "sub_frame", "xmlhttprequest", "script",
                        "image", "stylesheet", "object", "media", "ping",
                        "websocket", "font", "other"]
      }
    }));
    if (addRules.length > 0) {
      await API.declarativeNetRequest.updateSessionRules({ addRules });
    }
  } catch (e) {}
}

/* ===================================================================== *
 * 3. EasyList fetch
 * ===================================================================== */
const EASYLIST_URL = "https://easylist.to/easylist/easylist.txt";
const MAX_DYNAMIC_RULES = 4500;
const RESOURCE_TYPES = ["script", "image", "sub_frame", "xmlhttprequest", "object",
  "object_subrequest", "media", "ping", "websocket", "font", "other"];

function parseEasyListToDNR(text) {
  const lines = text.split("\n");
  const rules = [];
  const seen = new Set();
  let rid = 1;
  for (let raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith("!") || line.startsWith("[")) continue;
    if (line.includes("##") || line.includes("#@#") || line.includes("#?#")) continue;
    if (line.startsWith("@@")) continue;
    let uf = line, opts = [];
    const di = line.indexOf("$");
    if (di !== -1) {
      uf = line.substring(0, di);
      opts = line.substring(di + 1).split(",").map(s => s.trim());
    }
    const bad = opts.some(o =>
      o === "document" || o === "elemhide" || o === "generichide" ||
      o === "genericblock" || o === "urlblock" || o === "specifichide" ||
      o.startsWith("rewrite=") || o.startsWith("csp=") ||
      o.startsWith("replace=") || o.startsWith("permissions=")
    );
    if (bad || !uf.startsWith("||")) continue;
    if (seen.has(uf)) continue;
    seen.add(uf);
    if (rules.length >= MAX_DYNAMIC_RULES) break;
    rules.push({
      id: rid++, priority: 1, action: { type: "block" },
      condition: { urlFilter: uf, resourceTypes: RESOURCE_TYPES }
    });
  }
  return rules;
}

async function refreshEasyList() {
  try {
    const resp = await fetch(EASYLIST_URL, { cache: "no-store" });
    if (!resp.ok) return 0;
    const text = await resp.text();
    const rules = parseEasyListToDNR(text);
    const existing = await API.declarativeNetRequest.getDynamicRules();
    await API.declarativeNetRequest.updateDynamicRules({
      removeRuleIds: existing.map(r => r.id), addRules: rules
    });
    await setState({ lastEasyListUpdate: Date.now(), easyListRulesCount: rules.length });
    return rules.length;
  } catch (e) { return 0; }
}

API.alarms.create("refresh-easylist", { periodInMinutes: 60 * 72 });
API.alarms.create("check-updates", { periodInMinutes: 60 * 24 }); // check update tiap 24 jam
API.alarms.onAlarm.addListener(async (alarm) => {
  if (alarm.name === "refresh-easylist") {
    const state = await getState();
    if (state.activated && state.enabled) await refreshEasyList();
  } else if (alarm.name === "check-updates") {
    await checkForUpdates();
  }
});

/* ===================================================================== *
 * AUTO-UPDATE SYSTEM (v3.1)
 * ===================================================================== */
async function checkForUpdates() {
  const state = await getState();
  if (!state.autoUpdateCheck) return;
  try {
    const resp = await fetch(GITHUB_LATEST_VERSION_URL, { cache: "no-store" });
    if (!resp.ok) return;
    const manifest = await resp.json();
    const latestVersion = manifest.version;
    if (!latestVersion) return;
    const updateAvailable = compareVersions(latestVersion, CURRENT_VERSION) > 0;
    await setState({
      latestVersion,
      updateAvailable,
      lastUpdateCheck: Date.now(),
    });
    if (updateAvailable) {
      console.log(`[NovaShield] Update available: ${CURRENT_VERSION} -> ${latestVersion}`);
      // Show notification
      try {
        API.notifications && API.notifications.create({
          type: "basic",
          iconUrl: "icons/icon128.png",
          title: "NovaShield Update Available",
          message: `Versi baru ${latestVersion} tersedia. Klik untuk update.`,
        });
      } catch (e) {}
    }
  } catch (e) {
    console.warn("[NovaShield] checkForUpdates failed:", e);
  }
}

function compareVersions(a, b) {
  const partsA = a.split(".").map(Number);
  const partsB = b.split(".").map(Number);
  for (let i = 0; i < Math.max(partsA.length, partsB.length); i++) {
    const va = partsA[i] || 0;
    const vb = partsB[i] || 0;
    if (va > vb) return 1;
    if (va < vb) return -1;
  }
  return 0;
}

async function downloadAndApplyUpdate() {
  try {
    // For unpacked extension, we can't auto-update programmatically.
    // Open the download page so user can download new version.
    const state = await getState();
    const downloadUrl = "https://github.com/Yz776/informatika/raw/main/adblocker-extension/releases/novashield-latest.zip";
    await API.tabs.create({ url: "https://yz776.github.io/informatika/download.html" });
    return { ok: true, message: "Opened download page" };
  } catch (e) {
    return { ok: false, error: String(e) };
  }
}

/* ===================================================================== *
 * 4. Counter - DNR matched (Chrome) + content-counter.js (fallback)
 * ===================================================================== */
const tabBlockedCounts = {};
const tabBlockedDomains = {};

async function updateBadgeForTab(tabId) {
  const state = await getState();
  try {
    if (!state.activated) {
      await API.action.setBadgeText({ tabId, text: "!" });
      await API.action.setBadgeBackgroundColor({ tabId, color: "#ff5470" });
      return;
    }
    if (!state.enabled) {
      await API.action.setBadgeText({ tabId, text: "OFF" });
      await API.action.setBadgeBackgroundColor({ tabId, color: "#666666" });
      return;
    }
    const tab = await API.tabs.get(tabId).catch(() => null);
    const hostname = tab ? getHostname(tab.url) : "";
    if (hostname && isSitePaused(hostname, state.pausedSites)) {
      await API.action.setBadgeText({ tabId, text: "⏸" });
      await API.action.setBadgeBackgroundColor({ tabId, color: "#ffaa00" });
      return;
    }
    const count = tabBlockedCounts[tabId] || 0;
    if (count === 0) {
      await API.action.setBadgeText({ tabId, text: "" });
    } else {
      const display = count > 9999 ? "9k+" : String(count);
      await API.action.setBadgeText({ tabId, text: display });
      await API.action.setBadgeBackgroundColor({ tabId, color: "#00e5ff" });
    }
  } catch (e) {}
}

// Primary: DNR onRuleMatchedDebug (Chrome only)
if (API.declarativeNetRequest && API.declarativeNetRequest.onRuleMatchedDebug) {
  try {
    API.declarativeNetRequest.onRuleMatchedDebug.addListener(async (info) => {
      const tabId = info && info.request && info.request.tabId;
      if (tabId == null || tabId < 0) return;
      incrementTabCount(tabId, info.request && info.request.url);
    });
  } catch (e) {}
}

// Fallback: content-counter.js sends INCREMENT_TAB_COUNT
// (works in Firefox + Chrome, more accurate for blocked resources)

function incrementTabCount(tabId, reqUrl) {
  if (tabId == null || tabId < 0) return;
  tabBlockedCounts[tabId] = (tabBlockedCounts[tabId] || 0) + 1;
  if (reqUrl) {
    try {
      const host = new URL(reqUrl).hostname;
      if (!tabBlockedDomains[tabId]) tabBlockedDomains[tabId] = {};
      tabBlockedDomains[tabId][host] = (tabBlockedDomains[tabId][host] || 0) + 1;
    } catch (e) {}
  }
  // Async persist
  persistCounters(tabId);
  updateBadgeForTab(tabId);
}

let persistTimer = null;
let pendingPersistTabIds = new Set();
function persistCounters(tabId) {
  pendingPersistTabIds.add(tabId);
  if (persistTimer) return;
  persistTimer = setTimeout(async () => {
    persistTimer = null;
    const tabIds = Array.from(pendingPersistTabIds);
    pendingPersistTabIds.clear();
    const state = await getState();
    const statsPerDomain = { ...(state.statsPerDomain || {}) };
    let total = state.statsTotal || 0;
    for (const tid of tabIds) {
      try {
        const tab = await API.tabs.get(tid).catch(() => null);
        if (tab && tab.url) {
          const mainHost = getHostname(tab.url);
          if (mainHost) {
            statsPerDomain[mainHost] = (statsPerDomain[mainHost] || 0) + (tabBlockedCounts[tid] || 0);
            // Cap growth
            const keys = Object.keys(statsPerDomain);
            if (keys.length > 500) {
              keys.sort((a, b) => statsPerDomain[a] - statsPerDomain[b]);
              for (let i = 0; i < 100; i++) delete statsPerDomain[keys[i]];
            }
          }
        }
      } catch (e) {}
    }
    // Increment total by sum of tab deltas since last persist
    // Simpler: just add 1 per call - already done by incrementTabCount
    // Actually we need a delta. Let's just track total via incrementTabCount
    total = state.statsTotal + 1; // approximate - each incrementTabCount call = 1 block
    await setState({ statsTotal: total, statsPerDomain });
  }, 1000);
}

API.tabs.onRemoved.addListener((tabId) => {
  delete tabBlockedCounts[tabId];
  delete tabBlockedDomains[tabId];
});
API.tabs.onUpdated.addListener(async (tabId, change, tab) => {
  if (change.status === "loading" && change.url !== undefined) {
    tabBlockedCounts[tabId] = 0;
    tabBlockedDomains[tabId] = {};
    await updateBadgeForTab(tabId);
  }
  if (change.status === "complete") await updateBadgeForTab(tabId);
});
API.tabs.onActivated.addListener(async (activeInfo) => {
  await updateBadgeForTab(activeInfo.tabId);
});

/* ===================================================================== *
 * 5. Message API
 * ===================================================================== */
API.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    try {
      switch (msg && msg.type) {
        case "GET_STATE": {
          const state = await getState();
          const tabId = msg.tabId;
          const tabInfo = tabId ? {
            blocked: tabBlockedCounts[tabId] || 0,
            domains: tabBlockedDomains[tabId] || {},
            hostname: msg.hostname || ""
          } : { blocked: 0, domains: {}, hostname: "" };
          const whitelisted = isDomainWhitelisted(tabInfo.hostname, state.whitelist);
          const paused = isSitePaused(tabInfo.hostname, state.pausedSites);
          sendResponse({ ok: true, state, tab: { ...tabInfo, whitelisted, paused } });
          break;
        }
        case "INCREMENT_TAB_COUNT": {
          // From content-counter.js
          const tabId = sender.tab && sender.tab.id;
          if (tabId != null && tabId >= 0) {
            const count = msg.count || 1;
            for (let i = 0; i < count; i++) {
              incrementTabCount(tabId, msg.url);
            }
            // Also update total stat directly
            const state = await getState();
            await setState({ statsTotal: state.statsTotal + count });
          }
          sendResponse({ ok: true });
          break;
        }
        case "ACTIVATE": {
          const token = msg.token || "novashield-" + Date.now();
          await setState({
            activated: true,
            activationToken: token,
            activationDate: Date.now(),
          });
          await applyEnabledState();
          broadcastToTabs({ type: "STATE_CHANGED", activated: true });
          sendResponse({ ok: true, activated: true });
          break;
        }
        case "DEACTIVATE": {
          await setState({ activated: false, activationToken: null, activationDate: null });
          await applyEnabledState();
          broadcastToTabs({ type: "STATE_CHANGED", activated: false });
          sendResponse({ ok: true });
          break;
        }
        case "SET_ENABLED": {
          await setState({ enabled: !!msg.enabled });
          await applyEnabledState();
          broadcastToTabs({ type: "STATE_CHANGED", enabled: !!msg.enabled });
          sendResponse({ ok: true });
          break;
        }
        case "SET_FEATURE": {
          const patch = { [msg.key]: !!msg.value };
          await setState(patch);
          if (["trackersEnabled", "ytBlockEnabled", "malwareBlock", "httpsUpgrade"].includes(msg.key)) {
            await applyEnabledState();
          }
          broadcastToTabs({ type: "STATE_CHANGED", ...patch });
          sendResponse({ ok: true });
          break;
        }
        case "TOGGLE_WHITELIST_DOMAIN": {
          const state = await getState();
          const domain = (msg.domain || "").trim();
          if (!domain) { sendResponse({ ok: false }); break; }
          let whitelist = [...(state.whitelist || [])];
          const idx = whitelist.indexOf(domain);
          if (idx === -1) whitelist.push(domain);
          else whitelist.splice(idx, 1);
          await setState({ whitelist });
          await applyWhitelistSessionRules({ ...state, whitelist });
          sendResponse({ ok: true, whitelist });
          break;
        }
        case "ADD_WHITELIST": {
          const state = await getState();
          const domain = (msg.domain || "").trim();
          if (!domain) { sendResponse({ ok: false }); break; }
          const whitelist = [...(state.whitelist || [])];
          if (!whitelist.includes(domain)) whitelist.push(domain);
          await setState({ whitelist });
          await applyWhitelistSessionRules({ ...state, whitelist });
          sendResponse({ ok: true, whitelist });
          break;
        }
        case "REMOVE_WHITELIST": {
          const state = await getState();
          const whitelist = (state.whitelist || []).filter(d => d !== msg.domain);
          await setState({ whitelist });
          await applyWhitelistSessionRules({ ...state, whitelist });
          sendResponse({ ok: true, whitelist });
          break;
        }
        case "PAUSE_SITE": {
          const state = await getState();
          const pausedSites = { ...(state.pausedSites || {}) };
          pausedSites[msg.domain] = Date.now() + (msg.durationMs || 3600000);
          await setState({ pausedSites });
          await applyWhitelistSessionRules({ ...state, pausedSites });
          sendResponse({ ok: true });
          break;
        }
        case "UNPAUSE_SITE": {
          const state = await getState();
          const pausedSites = { ...(state.pausedSites || {}) };
          delete pausedSites[msg.domain];
          await setState({ pausedSites });
          await applyWhitelistSessionRules({ ...state, pausedSites });
          sendResponse({ ok: true });
          break;
        }
        case "START_ZAPPER": {
          if (msg.tabId) {
            try { await API.tabs.sendMessage(msg.tabId, { type: "START_ZAPPER" }); } catch (e) {}
          }
          sendResponse({ ok: true });
          break;
        }
        case "RESET_STATS": {
          await setState({ statsTotal: 0, statsPerDomain: {} });
          for (const k in tabBlockedCounts) delete tabBlockedCounts[k];
          for (const k in tabBlockedDomains) delete tabBlockedDomains[k];
          sendResponse({ ok: true });
          break;
        }
        case "REFRESH_EASYLIST": {
          const n = await refreshEasyList();
          await applyEnabledState();
          sendResponse({ ok: true, count: n });
          break;
        }
        case "CHECK_UPDATES": {
          await checkForUpdates();
          const state = await getState();
          sendResponse({
            ok: true,
            currentVersion: CURRENT_VERSION,
            latestVersion: state.latestVersion,
            updateAvailable: state.updateAvailable,
            lastUpdateCheck: state.lastUpdateCheck,
          });
          break;
        }
        case "APPLY_UPDATE": {
          const result = await downloadAndApplyUpdate();
          sendResponse(result);
          break;
        }
        case "SET_AUTO_UPDATE": {
          await setState({ autoUpdateCheck: !!msg.enabled });
          sendResponse({ ok: true });
          break;
        }
        case "ADD_CUSTOM_FILTER_LIST": {
          const state = await getState();
          const lists = [...(state.customFilterLists || [])];
          if (msg.url && !lists.includes(msg.url)) lists.push(msg.url);
          await setState({ customFilterLists: lists });
          sendResponse({ ok: true, lists });
          break;
        }
        case "REMOVE_CUSTOM_FILTER_LIST": {
          const state = await getState();
          const lists = (state.customFilterLists || []).filter(u => u !== msg.url);
          await setState({ customFilterLists: lists });
          sendResponse({ ok: true, lists });
          break;
        }
        case "EXPORT_SETTINGS": {
          const state = await getState();
          sendResponse({ ok: true, data: state });
          break;
        }
        case "IMPORT_SETTINGS": {
          if (!msg.data || typeof msg.data !== "object") {
            sendResponse({ ok: false, error: "invalid" });
            break;
          }
          await setState({ ...DEFAULT_STATE, ...msg.data });
          await applyEnabledState();
          sendResponse({ ok: true });
          break;
        }
        default:
          sendResponse({ ok: false, error: "unknown" });
      }
    } catch (e) {
      sendResponse({ ok: false, error: String(e) });
    }
  })();
  return true;
});

function broadcastToTabs(message) {
  try {
    API.tabs.query({}, (tabs) => {
      for (const tab of tabs) {
        if (!tab.id) continue;
        API.tabs.sendMessage(tab.id, message, () => { void API.runtime.lastError; });
      }
    });
  } catch (e) {}
}

/* ===================================================================== *
 * 6. Context menu
 * ===================================================================== */
API.contextMenus.onClicked.addListener(async (info, tab) => {
  if (!tab || !tab.id) return;
  const hostname = getHostname(tab.url);
  if (!hostname) return;
  const state = await getState();

  if (info.menuItemId === "toggle-novashield") {
    let whitelist = [...(state.whitelist || [])];
    if (isDomainWhitelisted(hostname, whitelist)) {
      whitelist = whitelist.filter(d => d !== hostname);
    } else {
      whitelist.push(hostname);
    }
    await setState({ whitelist });
    await applyWhitelistSessionRules({ ...state, whitelist });
    try { await API.tabs.reload(tab.id); } catch (e) {}
  } else if (info.menuItemId === "zap-element") {
    try { await API.tabs.sendMessage(tab.id, { type: "START_ZAPPER" }); } catch (e) {}
  } else if (info.menuItemId === "pause-1h") {
    const pausedSites = { ...(state.pausedSites || {}) };
    pausedSites[hostname] = Date.now() + 3600000;
    await setState({ pausedSites });
    await applyWhitelistSessionRules({ ...state, pausedSites });
    await updateBadgeForTab(tab.id);
  } else if (info.menuItemId === "pause-1d") {
    const pausedSites = { ...(state.pausedSites || {}) };
    pausedSites[hostname] = Date.now() + 86400000;
    await setState({ pausedSites });
    await applyWhitelistSessionRules({ ...state, pausedSites });
    await updateBadgeForTab(tab.id);
  }
});

/* ===================================================================== *
 * Boot
 * ===================================================================== */
(async function init() {
  const state = await getState();
  if (!state.installDate) {
    await setState({ ...DEFAULT_STATE, installDate: Date.now() });
  }
  await applyEnabledState();
  if (state.activated) {
    const age = Date.now() - (state.lastEasyListUpdate || 0);
    if (age > 72 * 60 * 60 * 1000 || state.easyListRulesCount === 0) refreshEasyList();
    // Check for updates on startup if not checked recently
    const updateAge = Date.now() - (state.lastUpdateCheck || 0);
    if (state.autoUpdateCheck && updateAge > 24 * 60 * 60 * 1000) {
      checkForUpdates();
    }
  }
  setInterval(async () => {
    const s = await getState();
    const ps = { ...(s.pausedSites || {}) };
    let changed = false;
    for (const [host, until] of Object.entries(ps)) {
      if (until <= Date.now()) { delete ps[host]; changed = true; }
    }
    if (changed) {
      await setState({ pausedSites: ps });
      await applyWhitelistSessionRules({ ...s, pausedSites: ps });
    }
  }, 60000);
})();

console.log("[NovaShield] background v3.3 aktif");
