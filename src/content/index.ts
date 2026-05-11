import { initEngine } from './engine';
import { getPreferenceForSite, savePreferenceForSite } from './site-memory';
import { getSettings, getCachedCoords, saveCachedCoords } from '../shared/storage';

(async () => {
  const sitePref   = await getPreferenceForSite();
  const global     = await getSettings();
  const shouldEnable = sitePref !== null ? sitePref : global.enabled;
  if (shouldEnable) await initEngine();

  // Cache geolocation for the service worker scheduler (which has no navigator.geolocation).
  // Only fetch if not already cached — keeps permission prompts minimal.
  if (global.autoSchedule) cacheLocationIfNeeded();

  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === 'TOGGLE') await savePreferenceForSite(msg.enabled);
  });
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
