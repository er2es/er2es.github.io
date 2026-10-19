import type { Locale } from '../content/model';
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
  flash(el);
  jumpHash(id);
}

function flash(el: HTMLElement): void {
  el.classList.remove('flash');
  void el.offsetWidth; // restart the animation
  el.classList.add('flash');
  setTimeout(() => el.classList.remove('flash'), 1500);
}

/** Lets modified clicks (new tab, etc.) through; handles plain clicks in-page. */
export function inPageClick(e: Event, id: string): void {
  if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
  e.preventDefault();
  scrollToSection(id);
}
