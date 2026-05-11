import { DuskSettings, ThemeVars } from '../shared/types';
import { DEFAULT_THEME_VARS, DEFAULT_SETTINGS } from '../shared/constants';
import { injectThemeVars, removeThemeVars } from './injector';
import { startObserver, stopObserver } from './observer';
import { classifyImages } from '../image/classifier';
import { getSettings } from '../shared/storage';

let worker: Worker | null = null;
let currentSettings: DuskSettings = DEFAULT_SETTINGS;
let isApplied = false;

export async function initEngine(): Promise<void> {
  currentSettings = await getSettings();
  if (currentSettings.enabled) {
    if (!isApplied) {
      await applyDarkMode();
    } else {
      // Already applied via early TOGGLE message — refresh with real settings
      injectThemeVars(DEFAULT_THEME_VARS, currentSettings);
    }
  }
}

export async function applyDarkMode(): Promise<void> {
  if (isApplied) return;
  // Quick dark already injected synchronously in index.ts — no flash.
  // Apply real settings once the worker returns.
  const vars = await analyzeInWorker();
  injectThemeVars(vars, currentSettings);
  classifyImages().catch(console.warn);
  startObserver(() => classifyImages().catch(console.warn));
  isApplied = true;
}

export function removeDarkMode(): void {
  if (!isApplied) return;
  removeThemeVars();
  stopObserver();
  worker?.terminate();
  worker = null;
  isApplied = false;
}

export function updateSettings(partial: Partial<DuskSettings>): void {
  currentSettings = { ...currentSettings, ...partial };
  if (isApplied) injectThemeVars(DEFAULT_THEME_VARS, currentSettings);
}

async function analyzeInWorker(): Promise<ThemeVars> {
  return new Promise((resolve) => {
    const sheets: string[] = [];
    document.querySelectorAll('style').forEach(el =>
      sheets.push(el.textContent || ''));
    worker = new Worker(chrome.runtime.getURL('worker/analyzer.js'));
    worker.postMessage({ type: 'ANALYZE', stylesheets: sheets, settings: currentSettings });
    worker.onmessage = (e) => { worker?.terminate(); worker = null; resolve(e.data.vars); };
    worker.onerror   = ()  => resolve(DEFAULT_THEME_VARS);
    setTimeout(()           => resolve(DEFAULT_THEME_VARS), 2000);
  });
}
