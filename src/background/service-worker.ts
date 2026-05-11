import { initScheduler } from '../scheduler/sunset';
chrome.runtime.onInstalled.addListener(() => { initScheduler(); });
chrome.runtime.onStartup.addListener(() => { initScheduler(); });

// Start scheduler as soon as the content script caches coordinates for the first time.
chrome.storage.onChanged.addListener((changes, area) => {
  if (area === 'local' && changes['dusk_coords'] && !changes['dusk_coords'].oldValue) {
    initScheduler();
  }
});
