import { ThemeVars, DuskSettings } from '../shared/types';
const STYLE_ID = 'dusk-theme-root';

export function injectThemeVars(vars: ThemeVars, s: DuskSettings): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.insertBefore(el, document.head.firstChild);
  }
  const b = s.brightness / 100;
  const c = s.contrast / 100;
  const sp = s.sepia / 100;

  el.textContent = `
    :root {
      ${Object.entries(vars).map(([k,v]) => `${k}: ${v};`).join('\n      ')}
    }
    html, body {
      background-color: var(--dusk-bg) !important;
      color: var(--dusk-text) !important;
      filter: brightness(${b}) contrast(${c}) sepia(${sp});
    }
    img[data-dusk-safe], video, canvas, svg[data-dusk-safe] {
      filter: none !important;
    }
    input, textarea, select {
      background-color: var(--dusk-surface) !important;
      color: var(--dusk-text) !important;
      border-color: var(--dusk-border) !important;
    }
    a { color: var(--dusk-link) !important; }
  `;
}

export function removeThemeVars(): void {
  document.getElementById(STYLE_ID)?.remove();
  document.querySelectorAll('[data-dusk-safe],[data-dusk-skip]').forEach(el => {
    el.removeAttribute('data-dusk-safe');
    el.removeAttribute('data-dusk-skip');
  });
}
