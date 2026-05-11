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

  // One debounce timer shared across all sliders — storage writes are throttled,
  // messages to the content script are sent immediately for real-time preview.
  let saveTimer: ReturnType<typeof setTimeout> | null = null;

  for (const k of ['brightness', 'contrast', 'sepia'] as const) {
    const sl = document.getElementById(k) as HTMLInputElement;
    const dv = document.getElementById(k + '-val')!;
    sl.value = String(s[k]);
    dv.textContent = sl.value;
    sl.addEventListener('input', () => {
      dv.textContent = sl.value;
      const u = { [k]: Number(sl.value) };

      // Instant visual feedback in the active tab
      if (tabId) sendOrInject(tabId, { type: 'UPDATE_SETTINGS', settings: u });

      // Debounced storage write — only commits after user stops moving for 400 ms.
      // chrome.storage.sync allows ≤20 writes/min; rapid slider drags would blow past that.
      if (saveTimer) clearTimeout(saveTimer);
      saveTimer = setTimeout(() => saveSettings(u), 400);
    });
  }

  toggle.addEventListener('change', async () => {
    await saveSettings({ enabled: toggle.checked });
    if (tabId) sendOrInject(tabId, { type: 'TOGGLE', enabled: toggle.checked });
  });

  document.getElementById('schedule-badge')!.style.display =
    s.autoSchedule ? 'inline-flex' : 'none';
});

// Send a message to the content script. If the content script isn't loaded yet
// (tab predates extension install), inject it first — it self-initialises from storage.
async function sendOrInject(tabId: number, msg: object): Promise<void> {
  try {
    await chrome.tabs.sendMessage(tabId, msg);
  } catch {
    try {
      await chrome.scripting.executeScript({ target: { tabId }, files: ['content/index.js'] });
      // Listener is registered synchronously in content/index.ts — no delay needed.
      chrome.tabs.sendMessage(tabId, msg).catch(() => {});
    } catch {
      // Restricted tab (chrome://, PDF, etc.) — silently ignore.
    }
  }
}
