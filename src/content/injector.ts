import { ThemeVars, DuskSettings } from '../shared/types';
const STYLE_ID = 'dusk-theme-root';

export function injectThemeVars(vars: ThemeVars, s: DuskSettings): void {
  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    document.head.insertBefore(el, document.head.firstChild);
  }
  const b  = s.brightness / 100;
  const c  = s.contrast   / 100;
  const sp = s.sepia      / 100;

  // CSS renders child filters first, then applies the parent filter to the composite.
  // So `filter: none` on a child CANNOT undo a parent filter — the parent already
  // darkened it. The correct neutralisation is the mathematical inverse:
  //   parent brightness(b) × child brightness(1/b) = brightness(1) = original.
  const invB = b > 0 ? +(1 / b).toFixed(4) : 1;
  const invC = c > 0 ? +(1 / c).toFixed(4) : 1;

  el.textContent = `
    :root {
      ${Object.entries(vars).map(([k,v]) => `${k}: ${v};`).join('\n      ')}
    }
    html, body {
      background-color: var(--dusk-bg) !important;
      color: var(--dusk-text) !important;
      filter: brightness(${b}) contrast(${c}) sepia(${sp});
    }
    img[data-dusk-safe], video, canvas, svg[data-dusk-safe], iframe {
      filter: brightness(${invB}) contrast(${invC}) !important;
    }
    input, textarea, select {
      background-color: var(--dusk-surface) !important;
      color: var(--dusk-text) !important;
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
