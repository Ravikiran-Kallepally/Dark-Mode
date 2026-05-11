export interface DuskSettings {
  enabled: boolean;
  brightness: number;      // 0-100, default 100
  contrast: number;        // 0-100, default 90
  sepia: number;           // 0-100, default 0
  autoSchedule: boolean;
  siteMemory: boolean;
  grayscale: boolean;
}

export interface ThemeVars {
  '--dusk-bg': string;
  '--dusk-surface': string;
  '--dusk-text': string;
  '--dusk-text-secondary': string;
  '--dusk-border': string;
  '--dusk-link': string;
}

export interface AnalyzerRequest {
  type: 'ANALYZE';
  stylesheets: string[];
  settings: DuskSettings;
}

export interface AnalyzerResponse {
  type: 'RESULT';
  vars: ThemeVars;
  siteAlreadyDark: boolean;
}

export type MessageType =
  | { type: 'TOGGLE'; enabled: boolean }
  | { type: 'UPDATE_SETTINGS'; settings: Partial<DuskSettings> }
  | { type: 'GET_STATUS'; tabId: number }
  | { type: 'STATUS'; enabled: boolean; siteAlreadyDark: boolean };
