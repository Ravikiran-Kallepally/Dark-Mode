import { getSettings, saveSettings } from '../shared/storage';

document.addEventListener('DOMContentLoaded', async () => {
  const s = await getSettings();
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });

  const toggle = document.getElementById('toggle') as HTMLInputElement;
  toggle.checked = s.enabled;
  document.getElementById('site-label')!.textContent = new URL(tab.url || '').hostname;

  for (const k of ['brightness', 'contrast', 'sepia'] as const) {
    const sl = document.getElementById(k) as HTMLInputElement;
    const dv = document.getElementById(k + '-val')!;
    sl.value = String(s[k]);
    dv.textContent = sl.value;
    sl.addEventListener('input', async () => {
      dv.textContent = sl.value;
      const u = { [k]: Number(sl.value) };
      await saveSettings(u);
      tab.id && chrome.tabs.sendMessage(tab.id, { type: 'UPDATE_SETTINGS', settings: u });
    });
  }

  toggle.addEventListener('change', async () => {
    await saveSettings({ enabled: toggle.checked });
    tab.id && chrome.tabs.sendMessage(tab.id, { type: 'TOGGLE', enabled: toggle.checked });
  });

  document.getElementById('schedule-badge')!.style.display =
    s.autoSchedule ? 'inline-flex' : 'none';
});
