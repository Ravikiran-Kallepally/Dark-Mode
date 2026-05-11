import { initEngine, applyDarkMode, removeDarkMode, updateSettings } from './engine';
import { getPreferenceForSite, savePreferenceForSite } from './site-memory';
import { getSettings, getCachedCoords, saveCachedCoords } from '../shared/storage';
import { injectQuickDark, removeQuickDark } from './injector';

// ── 1. Prevent white flash ──────────────────────────────────────────────────
// Applied synchronously before any storage reads so the page never flashes.
injectQuickDark();

// ── 2. Message listener ─────────────────────────────────────────────────────
// Registered synchronously so sendMessage from the popup works immediately
// after chrome.scripting.executeScript injects this script.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TOGGLE') {
    savePreferenceForSite(msg.enabled).catch(() => {});
    if (msg.enabled) applyDarkMode(); else removeDarkMode();
  }
  if (msg.type === 'UPDATE_SETTINGS') updateSettings(msg.settings);
});

// ── 3. Async init ───────────────────────────────────────────────────────────
(async () => {
  const sitePref     = await getPreferenceForSite();
  const global       = await getSettings();
  const shouldEnable = sitePref !== null ? sitePref : global.enabled;

  if (shouldEnable) {
    await initEngine();
  } else {
    removeQuickDark(); // user/site has dark mode off — remove the pre-applied filter
  }

  if (global.autoSchedule) cacheLocationIfNeeded();
})();

function cacheLocationIfNeeded(): void {
  getCachedCoords().then(existing => {
    if (existing) return;
    navigator.geolocation.getCurrentPosition(
      p => saveCachedCoords(p.coords.latitude, p.coords.longitude),
      () => {},
      { timeout: 5000, maximumAge: 3_600_000 },
    );
  });
}
