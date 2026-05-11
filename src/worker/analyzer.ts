import { AnalyzerRequest, AnalyzerResponse } from '../shared/types';
import { DEFAULT_THEME_VARS } from '../shared/constants';

self.onmessage = (e: MessageEvent<AnalyzerRequest>) => {
  const { stylesheets } = e.data;
  self.postMessage({
    type: 'RESULT',
    vars: analyzeStylesheets(stylesheets),
    siteAlreadyDark: detectNativeDarkMode(stylesheets),
  } as AnalyzerResponse);
  self.close(); // terminate after one message — no memory leak
};

function analyzeStylesheets(sheets: string[]) {
  const bg = extractDominantBg(sheets.join('\n'));
  return isColorDark(bg) ? DEFAULT_THEME_VARS : DEFAULT_THEME_VARS;
  // v1: always return defaults. v2: adjust vars based on site colors.
}

function extractDominantBg(css: string): string {
  const m = css.match(/background(?:-color)?:\s*(#[0-9a-fA-F]{3,8}|rgb[^)]+\))/);
  return m ? m[1] : '#ffffff';
}

function isColorDark(color: string): boolean {
  let r = 255, g = 255, b = 255;
  if (color.startsWith('#')) {
    const h = color.slice(1);
    const f = h.length === 3 ? h.split('').map(c => c + c).join('') : h;
    r = parseInt(f.slice(0,2),16);
    g = parseInt(f.slice(2,4),16);
    b = parseInt(f.slice(4,6),16);
  } else if (color.startsWith('rgb')) {
    const n = (color.match(/[0-9]+/g) || ['255','255','255']).map(Number);
    [r,g,b] = n;
  }
  return (0.2126*r + 0.7152*g + 0.0722*b) < 128;
}

function detectNativeDarkMode(sheets: string[]): boolean {
  const c = sheets.join('\n');
  return c.includes('color-scheme: dark') || c.includes('prefers-color-scheme: dark');
}
