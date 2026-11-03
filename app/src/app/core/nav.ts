import { SECTION_IDS, type Locale } from '../content/model';
import { jumpHash } from './hash';

export const pagePath = (l: Locale): string => (l === 'hu' ? '/hu/' : '/');

/** Absolute-path anchors: <base href="/"> would otherwise send "#x" on /hu/ to the English root. */
export const anchorHref = (l: Locale, id: string): string => `${pagePath(l)}#${id}`;

/**
 * Jumps exactly to the element with this id: opens a collapsed <details> inside it first (so the layout is final
 * before scrolling), scrolls it to the top edge (the fixed header is cleared by CSS scroll-margin-top), moves
 * focus there and briefly highlights it.
 */
export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  const details = el.querySelector('details');
  if (details) details.open = true;
  el.scrollIntoView({ block: 'start' }); // smoothness comes from CSS scroll-behavior, which reduced-motion turns off
  el.focus({ preventScroll: true });
  // a section of the menu: its heading draws a line once the page has arrived (the whole section lit up would be loud); anything else lights up at once
  const title = (SECTION_IDS as readonly string[]).includes(id) ? el.querySelector<HTMLElement>('h2') : null;
  if (title) whenArrived(() => flash(title, 'flash-title'));
  else flash(el);
  jumpHash(id);
}

/** Runs `then` when the smooth scroll has ended (or after a moment, where the page did not have to scroll), at once under reduced motion. */
function whenArrived(then: () => void): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return then();
  let done = false;
  const go = (): void => {
    if (done) return;
    done = true;
    clearTimeout(timer);
    removeEventListener('scrollend', go);
    then();
  };
  const timer = setTimeout(go, 900);
  addEventListener('scrollend', go, { once: true });
}

function flash(el: HTMLElement, cls = 'flash'): void {
  el.classList.remove(cls);
  void el.offsetWidth; // restart the animation
  el.classList.add(cls);
  const done = (): void => el.classList.remove(cls);
  el.addEventListener('animationend', done, { once: true });
  // no animation runs under reduced motion: a timer ends the static highlight
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) setTimeout(done, 1500);
}

/** Lets modified clicks (new tab, etc.) through; handles plain clicks in-page. */
export function inPageClick(e: Event, id: string): void {
  if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
  e.preventDefault();
  scrollToSection(id);
}
