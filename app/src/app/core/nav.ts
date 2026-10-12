import type { Locale } from '../content/model';

export const pagePath = (l: Locale): string => (l === 'hu' ? '/hu/' : '/');

/** Absolute-path anchors: <base href="/"> would otherwise send "#x" on /hu/ to the English root. */
export const anchorHref = (l: Locale, id: string): string => `${pagePath(l)}#${id}`;

export function scrollToSection(id: string): void {
  const el = document.getElementById(id);
  if (!el) return;
  el.scrollIntoView(); // smoothness comes from CSS scroll-behavior, which reduced-motion turns off
  el.focus({ preventScroll: true });
  history.replaceState(null, '', `${location.pathname}#${id}`);
}

/** Lets modified clicks (new tab, etc.) through; handles plain clicks in-page. */
export function inPageClick(e: Event, id: string): void {
  if (e instanceof MouseEvent && (e.metaKey || e.ctrlKey || e.shiftKey || e.altKey || e.button !== 0)) return;
  e.preventDefault();
  scrollToSection(id);
}
