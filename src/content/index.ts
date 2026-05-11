import { initEngine } from './engine';
import { getPreferenceForSite, savePreferenceForSite } from './site-memory';
import { getSettings } from '../shared/storage';

(async () => {
  const sitePref   = await getPreferenceForSite();
  const global     = await getSettings();
  const shouldEnable = sitePref !== null ? sitePref : global.enabled;
  if (shouldEnable) await initEngine();

  chrome.runtime.onMessage.addListener(async (msg) => {
    if (msg.type === 'TOGGLE') await savePreferenceForSite(msg.enabled);
  });
})();
