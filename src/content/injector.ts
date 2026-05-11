import { ThemeVars, DuskSettings } from '../shared/types';

const STYLE_ID  = 'dusk-theme-root';
const QUICK_ID  = 'dusk-quick-dark';

// Injected synchronously at script load to prevent white flash.
// Replaced by injectThemeVars() once real settings are loaded.
export function injectQuickDark(): void {
  if (document.getElementById(QUICK_ID)) return;
  const el = document.createElement('style');
  el.id = QUICK_ID;
  el.textContent = 'html{filter:invert(100%) hue-rotate(180deg) brightness(.9)!important}' +
    'img,video,canvas,picture,iframe,embed{filter:invert(100%) hue-rotate(180deg) brightness(1.111)!important}';
  (document.head ?? document.documentElement).appendChild(el);
}

export function removeQuickDark(): void {
  document.getElementById(QUICK_ID)?.remove();
}

/**
 * Core algorithm: invert(100%) hue-rotate(180deg)
 *
 * Why this works:
 *   invert flips every pixel's luminosity (white→black, black→white).
 *   hue-rotate(180°) corrects all hues back to their originals because
 *   the colour wheel is symmetric — red inverts to cyan (180° away),
 *   hue-rotate adds another 180° → back to red. Applies to every hue.
 *   Net effect: dark ↔ light swap, all colours preserved.
 *
 * Media elements get the inverse of the parent filter so they look original.
 *   double invert(100%) hue-rotate(180deg) = identity.
 *   Also cancel brightness/contrast so photos aren't touched.
 */
export function injectThemeVars(_vars: ThemeVars, s: DuskSettings): void {
  removeQuickDark();

  let el = document.getElementById(STYLE_ID) as HTMLStyleElement | null;
  if (!el) {
    el = document.createElement('style');
    el.id = STYLE_ID;
    (document.head ?? document.documentElement).insertBefore(
      el, document.head?.firstChild ?? null
    );
  }

  const b   = s.brightness / 100;
  const c   = s.contrast   / 100;
  const sp  = s.sepia      / 100;
  const invB = b > 0 ? +(1 / b).toFixed(4) : 1;
  const invC = c > 0 ? +(1 / c).toFixed(4) : 1;

  el.textContent = `
    html {
      filter: invert(100%) hue-rotate(180deg)
              brightness(${b}) contrast(${c}) sepia(${sp}) !important;
    }
    img, video, canvas, picture, iframe, embed,
    img[data-dusk-safe], [data-dusk-skip] {
      filter: invert(100%) hue-rotate(180deg)
              brightness(${invB}) contrast(${invC}) !important;
    }
    ::-webkit-scrollbar        { width:10px; height:10px; background:#111; }
    ::-webkit-scrollbar-track  { background:#1a1a1a; }
    ::-webkit-scrollbar-thumb  { background:#3d3d3d; border-radius:5px;
                                  border:2px solid #1a1a1a; }
    ::-webkit-scrollbar-thumb:hover { background:#5a5a5a; }
    ::selection { background:rgba(96,165,250,.3)!important; color:inherit!important; }
  `;
}

export function removeThemeVars(): void {
  document.getElementById(STYLE_ID)?.remove();
  removeQuickDark();
  document.querySelectorAll('[data-dusk-safe],[data-dusk-skip]').forEach(el => {
    el.removeAttribute('data-dusk-safe');
    el.removeAttribute('data-dusk-skip');
  });
}
