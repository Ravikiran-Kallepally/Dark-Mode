import { getSettings, saveSettings } from '../shared/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const s = await getSettings();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
  const tabId = tab?.id;

  const toggle = document.getElementById('toggle') as HTMLInputElement;
  toggle.checked = s.enabled;

  let hostname = '—';
  try { hostname = new URL(tab?.url ?? '').hostname; } catch { /* chrome:// or empty */ }
  document.getElementById('site-label')!.textContent = hostname;

  for (const k of ['brightness', 'contrast', 'sepia'] as const) {
    const sl = document.getElementById(k) as HTMLInputElement;
    const dv = document.getElementById(k + '-val')!;
    sl.value = String(s[k]);
    dv.textContent = sl.value;
    sl.addEventListener('input', async () => {
      dv.textContent = sl.value;
      const u = { [k]: Number(sl.value) };
      await saveSettings(u);
      if (tabId) sendOrInject(tabId, { type: 'UPDATE_SETTINGS', settings: u });
    });
  }

  toggle.addEventListener('change', async () => {
    await saveSettings({ enabled: toggle.checked });
    if (tabId) sendOrInject(tabId, { type: 'TOGGLE', enabled: toggle.checked });
  });

  document.getElementById('schedule-badge')!.style.display =
    s.autoSchedule ? 'inline-flex' : 'none';
});

// Try to message the content script. If it isn't loaded yet (tab predates the extension
// install), inject it first — it will self-initialise by reading from storage.
async function sendOrInject(tabId: number, msg: object): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content/index.js'] });
      // Give the async IIFE a tick to register its message listener, then retry once.
      await new Promise(r => setTimeout(r, 50));
      chrome.tabs.sendMessage(tabId, msg).catch(() => {});
    } catch {
      // Tab is a restricted page (chrome://, PDF, etc.) — silently ignore.
    }
  }
}
