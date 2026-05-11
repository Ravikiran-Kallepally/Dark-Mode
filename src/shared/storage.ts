import { DuskSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
const K = 'dusk_settings';

export async function getSettings(): Promise<DuskSettings> {
  const r = await chrome.storage.sync.get(K);
  return { ...DEFAULT_SETTINGS, ...(r[K] || {}) };
}

export async function saveSettings(p: Partial<DuskSettings>): Promise<void> {
  const c = await getSettings();
  await chrome.storage.sync.set({ [K]: { ...c, ...p } });
}
