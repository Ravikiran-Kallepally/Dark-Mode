import { OBSERVER_DEBOUNCE_MS } from '../shared/constants';
let obs: MutationObserver | null = null;
let timer: ReturnType<typeof setTimeout> | null = null;

export function startObserver(cb: () => void): void {
  if (obs) return;
  obs = new MutationObserver(() => {
    if (timer) clearTimeout(timer);
    timer = setTimeout(cb, OBSERVER_DEBOUNCE_MS);
  });
  obs.observe(document.body, {
    childList: true,
    subtree: false,       // KEY: only direct children — prevents React storm
    attributes: false,
    characterData: false,
  });
}

export function stopObserver(): void {
  if (timer) clearTimeout(timer);
  obs?.disconnect();
  obs = null;
}
