import { DuskSettings } from './types';
import { DEFAULT_SETTINGS } from './constants';
const K = 'dusk_settings';
const COORDS_KEY = 'dusk_coords';
const COORDS_TTL = 86_400_000; // 24 h

export interface CachedCoords { latitude: number; longitude: number; }

export async function getSettings(): Promise<DuskSettings> {
  const r = await chrome.storage.sync.get(K);
  return { ...DEFAULT_SETTINGS, ...(r[K] || {}) };
}

export async function saveSettings(p: Partial<DuskSettings>): Promise<void> {
  const c = await getSettings();
  await chrome.storage.sync.set({ [K]: { ...c, ...p } });
}

export async function getCachedCoords(): Promise<CachedCoords | null> {
  const r = await chrome.storage.local.get(COORDS_KEY);
  const c = r[COORDS_KEY] as (CachedCoords & { ts: number }) | undefined;
  if (!c || Date.now() - c.ts > COORDS_TTL) return null;
  return { latitude: c.latitude, longitude: c.longitude };
}

export async function saveCachedCoords(lat: number, lng: number): Promise<void> {
  await chrome.storage.local.set({
    [COORDS_KEY]: { latitude: lat, longitude: lng, ts: Date.now() },
  });
}
