import { Component, DestroyRef, ElementRef, afterNextRender, inject, viewChild } from '@angular/core';
import { SPACING, contourSegments, fieldAt, spacingAt, type Bump } from '../core/contours';

/**
 * The page's background, behind everything: a light mesh that drifts from colour to colour as the page scrolls (CSS only,
 * `_backdrop.scss`, animating only what the graphics card can: translate and opacity) and, over it, fine contour lines. The lines move with the scroll and bend around the mouse pointer.
 * Nothing runs while nothing moves: the loop stops when the lines have settled. A touch screen has no pointer to follow;
 * under reduced motion the lines are drawn once and stay still. Decorative, so hidden from assistive technology.
 */
@Component({
  selector: 'app-backdrop',
  template: `<div class="mesh"><i class="blob g"></i><i class="blob b"></i><i class="blob o"></i></div><canvas #lines class="lines"></canvas>`,
  styles: [`
    :host { position: fixed; inset: 0; z-index: -1; pointer-events: none; }
    .mesh, .lines { position: absolute; inset: 0; width: 100%; height: 100%; }
  `],
  host: { 'aria-hidden': 'true' },
})
export class Backdrop {
  private readonly canvas = viewChild.required<ElementRef<HTMLCanvasElement>>('lines');

  constructor() {
    const destroy = inject(DestroyRef);
    afterNextRender(() => {
      const cv = this.canvas().nativeElement;
      const ctx = cv.getContext('2d');
      if (!ctx) return;
      const reduce = matchMedia('(prefers-reduced-motion: reduce)');
      const fine = matchMedia('(hover: hover) and (pointer: fine)');
      const CELL = 30;
      const LEVELS = { from: -3.8, to: 3.8 };

      let w = 0;
      let h = 0;
      let dpr = 1;
      let colour = '';
      let raf = 0;
      // where things are, and where they are going (everything eases towards its target, so a jump of the wheel is a glide)
      let t = scrollY * 0.0011;
      let p = 0;
      let bump: Bump = { x: 0, y: 0, k: 0 };
      let aim: Bump = { x: 0, y: 0, k: 0 };
      const segs: number[] = [];

      const range = (): number => Math.max(1, document.documentElement.scrollHeight - innerHeight);
      const goals = (): { t: number; p: number } => ({ t: scrollY * 0.0011, p: (scrollY / range()) * (SPACING.length - 1) });
      const readColour = (): void => {
        const rgb = getComputedStyle(document.documentElement).getPropertyValue('--fg').trim();
        const probe = document.createElement('canvas').getContext('2d');
        if (!probe) return;
        probe.fillStyle = rgb;
        const hex = probe.fillStyle; // any colour notation, as #rrggbb
        const n = parseInt(hex.slice(1), 16);
        const light = (n >> 16) + ((n >> 8) & 255) + (n & 255) > 384; // the text colour is light: the dark theme
        colour = `rgba(${n >> 16}, ${(n >> 8) & 255}, ${n & 255}, ${light ? 0.055 : 0.08})`; // a little firmer on the light page, where it is harder to see
      };

      const draw = (): void => {
        const cols = Math.ceil(w / CELL) + 1;
        const rows = Math.ceil(h / CELL) + 1;
        const f = new Float32Array(cols * rows);
        for (let r = 0; r < rows; r++) for (let c = 0; c < cols; c++) f[r * cols + c] = fieldAt(c * CELL, r * CELL, t, bump);
        ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
        ctx.clearRect(0, 0, w, h);
        ctx.lineWidth = 1;
        ctx.strokeStyle = colour;
        ctx.beginPath();
        const step = spacingAt(p);
        for (let level = LEVELS.from; level <= LEVELS.to; level += step) {
          segs.length = 0;
          contourSegments(f, cols, rows, CELL, level, segs);
          for (let i = 0; i < segs.length; i += 4) {
            ctx.moveTo(segs[i], segs[i + 1]);
            ctx.lineTo(segs[i + 2], segs[i + 3]);
          }
        }
        ctx.stroke();
      };

      const frame = (): void => {
        raf = 0;
        const g = goals();
        t += (g.t - t) * 0.12;
        p += (g.p - p) * 0.12;
        bump = { x: bump.x + (aim.x - bump.x) * 0.18, y: bump.y + (aim.y - bump.y) * 0.18, k: bump.k + (aim.k - bump.k) * 0.08 };
        draw();
        const settled = Math.abs(g.t - t) < 0.0005 && Math.abs(g.p - p) < 0.002 && Math.abs(aim.k - bump.k) < 0.004
          && Math.hypot(aim.x - bump.x, aim.y - bump.y) < 0.5;
        if (!settled) raf = requestAnimationFrame(frame);
      };
      const kick = (): void => {
        if (!raf && !document.hidden) raf = requestAnimationFrame(frame);
      };

      const resize = (): void => {
        dpr = Math.min(1.5, devicePixelRatio || 1);
        w = innerWidth;
        h = innerHeight;
        cv.width = Math.round(w * dpr);
        cv.height = Math.round(h * dpr);
        readColour();
        const g = goals();
        t = g.t;
        p = g.p;
        draw();
      };
      resize();

      // the colour follows the theme (a change of the choice, or of the system's)
      const theme = new MutationObserver(() => {
        readColour();
        kick();
      });
      theme.observe(document.documentElement, { attributes: true, attributeFilter: ['data-theme'] });
      const dark = matchMedia('(prefers-color-scheme: dark)');
      const onScheme = (): void => {
        readColour();
        kick();
      };
      dark.addEventListener('change', onScheme);
      addEventListener('resize', resize);
      destroy.onDestroy(() => {
        theme.disconnect();
        dark.removeEventListener('change', onScheme);
        removeEventListener('resize', resize);
        cancelAnimationFrame(raf);
      });

      if (reduce.matches) return; // drawn once, still

      const onScroll = (): void => kick();
      const onMove = (e: PointerEvent): void => {
        if (e.pointerType === 'touch') return;
        if (aim.k === 0) bump = { x: e.clientX, y: e.clientY, k: 0 }; // it starts where the pointer enters, and grows from there
        aim = { x: e.clientX, y: e.clientY, k: 1 };
        kick();
      };
      const onLeave = (): void => {
        aim = { ...aim, k: 0 };
        kick();
      };
      addEventListener('scroll', onScroll, { passive: true });
      document.addEventListener('visibilitychange', kick);
      if (fine.matches) {
        addEventListener('pointermove', onMove, { passive: true });
        document.documentElement.addEventListener('pointerleave', onLeave);
      }
      destroy.onDestroy(() => {
        removeEventListener('scroll', onScroll);
        document.removeEventListener('visibilitychange', kick);
        removeEventListener('pointermove', onMove);
        document.documentElement.removeEventListener('pointerleave', onLeave);
      });
    });
  }
}
