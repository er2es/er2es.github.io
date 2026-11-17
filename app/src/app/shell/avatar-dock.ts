import { Component, DestroyRef, afterNextRender, inject } from '@angular/core';

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));

/**
 * The hero portrait hands itself over to the header as the visitor scrolls: it drains away from the top (its top edge sinks
 * until nothing is left) while the small slot in the header, next to the monogram, fills with the same photo from the bottom,
 * like a loading bar, and the name is written out beside it. Nothing flies and nothing is copied over the page: this only sets
 * one number, `--p` (0 to 1, from the scroll position, so it runs backwards when scrolling back), on the hero portrait and on
 * the header's brand (avatar and name); their styles do the rest.
 * The slot holds the monogram until the photo is nearly full and then pushes it out (see `.filled`). Under reduced motion the
 * hand-over is not played: the slot is simply full once the portrait has left.
 * One passive scroll listener, one frame at a time.
 */
@Component({
  selector: 'app-avatar-dock',
  template: '',
})
export class AvatarDock {
  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let raf = 0;
      let box: HTMLElement | null = null;

      const frame = (): void => {
        raf = 0;
        const img = document.querySelector<HTMLImageElement>('.portrait img');
        const slot = document.querySelector<HTMLElement>('.avatar-slot');
        const fill = slot?.querySelector<HTMLImageElement>('.fill');
        if (!img || !slot || !fill) return;
        const src = img.currentSrc || img.src;
        if (src && fill.src !== src) fill.src = src; // the file the hero already downloaded: no extra request

        const nextBox = img.closest<HTMLElement>('.portrait');
        if (box && box !== nextBox) box.style.removeProperty('--p');
        box = nextBox;
        // at the top there is nothing to hand over: no layout is read
        const brand = slot.parentElement!; // the avatar and the name: both follow the same number
        if (window.scrollY === 0) {
          box?.style.setProperty('--p', '0');
          brand.style.setProperty('--p', '0');
          box?.classList.remove('docked');
          slot.classList.remove('filled');
          return;
        }

        // the hand-over spans the scroll distance that carries the portrait's bottom edge under the header
        const distance = img.getBoundingClientRect().bottom + window.scrollY - slot.getBoundingClientRect().bottom;
        const raw = distance > 0 ? clamp01(window.scrollY / distance) : 1;
        const p = reduce.matches ? (raw >= 1 ? 1 : 0) : raw;
        box?.style.setProperty('--p', p.toFixed(3));
        brand.style.setProperty('--p', p.toFixed(3));
        box?.classList.toggle('docked', p >= 0.999); // the hero portrait is spent: nothing left to point at
        slot.classList.toggle('filled', p >= 0.92); // the monogram in the slot leaves just before the photo is full
      };

      const request = (): void => {
        if (!raf) raf = requestAnimationFrame(frame);
      };
      window.addEventListener('scroll', request, { passive: true });
      window.addEventListener('resize', request);
      request();
      destroy.onDestroy(() => {
        window.removeEventListener('scroll', request);
        window.removeEventListener('resize', request);
        cancelAnimationFrame(raf);
        box?.style.removeProperty('--p');
        box?.classList.remove('docked');
      });
    });
  }
}
