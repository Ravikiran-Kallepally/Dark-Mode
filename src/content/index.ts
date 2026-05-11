import { initEngine, applyDarkMode, removeDarkMode, updateSettings } from './engine';
import { getPreferenceForSite, savePreferenceForSite } from './site-memory';
import { getSettings, getCachedCoords, saveCachedCoords } from '../shared/storage';

// Registered SYNCHRONOUSLY — before any awaits — so the popup's sendMessage works
// immediately after chrome.scripting.executeScript injects this script.
chrome.runtime.onMessage.addListener((msg) => {
  if (msg.type === 'TOGGLE') {
    savePreferenceForSite(msg.enabled).catch(() => {});
    if (msg.enabled) applyDarkMode(); else removeDarkMode();
  }
  if (msg.type === 'UPDATE_SETTINGS') {
    updateSettings(msg.settings);
  }
});

// Async init: determine whether dark mode should apply, then run the engine.
(async () => {
  const sitePref     = await getPreferenceForSite();
  const global       = await getSettings();
  const shouldEnable = sitePref !== null ? sitePref : global.enabled;
  if (shouldEnable) await initEngine();
  if (global.autoSchedule) cacheLocationIfNeeded();
})();

function cacheLocationIfNeeded(): void {
  getCachedCoords().then(existing => {
    if (existing) return;
    navigator.geolocation.getCurrentPosition(
      p => saveCachedCoords(p.coords.latitude, p.coords.longitude),
      () => { /* denied — scheduler stays inactive */ },
      { timeout: 5000, maximumAge: 3_600_000 },
    );
  });
}
