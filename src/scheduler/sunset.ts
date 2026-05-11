import SunCalc from 'suncalc';
import { getSettings, saveSettings, getCachedCoords, CachedCoords } from '../shared/storage';

const INT = 60_000;
let iv: ReturnType<typeof setInterval> | null = null;

export async function initScheduler(): Promise<void> {
  const s = await getSettings();
  if (!s.autoSchedule) return;
  const coords = await getCachedCoords(); // reads from storage — safe in service worker
  if (!coords) return;                    // will retry via storage.onChanged when coords arrive
  if (iv) clearInterval(iv);
  runCheck(coords);
  iv = setInterval(() => runCheck(coords), INT);
}

export function stopScheduler(): void {
  if (iv) clearInterval(iv);
}

async function runCheck(c: CachedCoords): Promise<void> {
  const now = new Date();
  const { sunrise, sunset } = SunCalc.getTimes(now, c.latitude, c.longitude);
  const isDark = now < sunrise || now > sunset;
  const s = await getSettings();
  if (s.enabled === isDark) return;
  await saveSettings({ enabled: isDark });
  chrome.tabs.query({}, tabs =>
    tabs.forEach(t => t.id &&
      chrome.tabs.sendMessage(t.id, { type: 'TOGGLE', enabled: isDark })));
}
