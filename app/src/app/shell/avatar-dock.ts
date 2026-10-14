import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';

const clamp01 = (n: number): number => Math.min(1, Math.max(0, n));
const lerp = (a: number, b: number, t: number): number => a + (b - a) * t;
const smooth = (t: number): number => t * t * (3 - 2 * t);

/**
 * The hero portrait flies into the header as the visitor scrolls: a copy of the already loaded image travels
 * from the portrait's place to the small round slot in the header (position, size and corner radius are
 * interpolated; the motion is driven by the scroll position, so it reverses when scrolling back). The real
 * portrait is hidden while the copy is away from it. One passive scroll listener, one frame at a time, and only a
 * transform per frame. Under reduced motion the copy simply appears in the slot once the portrait has left.
 */
@Component({
  selector: 'app-avatar-dock',
  template: `<img #ghost class="ghost" alt="" aria-hidden="true" decoding="async">`,
  styles: [`
    .ghost {
      position: fixed; z-index: 21; left: 0; top: 0; margin: 0; object-fit: cover; pointer-events: none;
      transform-origin: 0 0; visibility: hidden; will-change: transform;
    }
    .ghost.on { visibility: visible; }
    /* one soft ring when the avatar has arrived in the header */
    .ghost.arrived { animation: arrive 700ms var(--ease-out); }
    @keyframes arrive {
      from { box-shadow: 0 0 0 0 color-mix(in srgb, var(--accent) 55%, transparent); }
      to { box-shadow: 0 0 0 14px transparent; }
    }
    @media (prefers-reduced-motion: reduce) { .ghost.arrived { animation: none; } }
  `],
})
export class AvatarDock {
  private readonly ghost = viewChild.required<ElementRef<HTMLImageElement>>('ghost');

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const g = this.ghost().nativeElement;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      let raf = 0;
      let box: HTMLElement | null = null;

      const frame = (): void => {
        raf = 0;
        const img = document.querySelector<HTMLImageElement>('.portrait img');
        const slot = document.querySelector<HTMLElement>('.avatar-slot');
        if (!img || !slot) return;
        const src = img.currentSrc || img.src;
        if (src && g.src !== src) g.src = src; // the file the hero already downloaded: no extra request

        // at the top with the copy not showing there is nothing to place: no layout is read
        if (window.scrollY === 0 && !g.classList.contains('on')) return;

        const pr = img.getBoundingClientRect();
        const sr = slot.getBoundingClientRect();
        const base = img.offsetWidth; // layout size, free of the entrance and lean transforms
        if (!base || !sr.width) return;

        // the morph spans the scroll distance that carries the portrait's bottom edge under the header
        const distance = pr.bottom + window.scrollY - sr.bottom;
        const raw = distance > 0 ? clamp01(window.scrollY / distance) : 1;
        const p = reduce.matches ? (raw >= 1 ? 1 : 0) : raw;
        // it shrinks first (so it never lingers big over the menu), then glides the rest of the way, moving about its centre
        const eSize = smooth(clamp01(p * 1.8));
        const ePos = smooth(p);

        const size = lerp(base, sr.width, eSize);
        const s = size / base;
        const radius = lerp(parseFloat(getComputedStyle(img).borderTopLeftRadius) || 0, sr.width / 2, eSize);
        const cx = lerp(pr.left + pr.width / 2, sr.left + sr.width / 2, ePos);
        const cy = lerp(pr.top + pr.height / 2, sr.top + sr.height / 2, ePos);
        g.style.width = g.style.height = `${base}px`;
        g.style.borderRadius = `${radius / s}px`;
        g.style.transform = `translate3d(${cx - size / 2}px, ${cy - size / 2}px, 0) scale(${s})`;

        const away = p > 0.001;
        g.classList.toggle('on', away);
        g.classList.toggle('arrived', p >= 0.999);
        const nextBox = img.closest<HTMLElement>('.portrait');
        if (box && box !== nextBox) box.classList.remove('docked');
        box = nextBox;
        box?.classList.toggle('docked', away); // the real portrait steps aside while its copy is away
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
        box?.classList.remove('docked');
      });
    });
  }
}
