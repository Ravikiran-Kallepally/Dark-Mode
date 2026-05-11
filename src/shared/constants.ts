import { DuskSettings, ThemeVars } from './types';

export const DEFAULT_SETTINGS: DuskSettings = {
  enabled: true,
  brightness: 100,
  contrast: 90,
  sepia: 0,
  autoSchedule: true,
  siteMemory: true,
  grayscale: false,
};

export const DEFAULT_THEME_VARS: ThemeVars = {
  '--dusk-bg':             '#181818',
  '--dusk-surface':        '#222222',
  '--dusk-text':           '#E8E6F0',
  '--dusk-text-secondary': '#A8A4B8',
  '--dusk-border':         '#333333',
  '--dusk-link':           '#A78BFA',
};

export const OBSERVER_DEBOUNCE_MS     = 150;
export const IMAGE_SAMPLE_SIZE        = 16;
export const DARK_LUMINANCE_THRESHOLD = 40;
export const PHOTO_VARIANCE_THRESHOLD = 30;
