const KEY = 'dusk_site_memory';
interface SM { [hostname: string]: boolean; }

export async function getPreferenceForSite(): Promise<boolean | null> {
  const { [KEY]: m = {} } = await chrome.storage.sync.get(KEY);
  const h = location.hostname;
  return h in m ? (m as SM)[h] : null;
}

export async function savePreferenceForSite(enabled: boolean): Promise<void> {
  const r = await chrome.storage.sync.get(KEY);
  const m: SM = (r[KEY] as SM) || {};
  m[location.hostname] = enabled;
  const k = Object.keys(m);
  if (k.length > 500) k.slice(0, 50).forEach(x => delete m[x]);
  await chrome.storage.sync.set({ [KEY]: m });
}
