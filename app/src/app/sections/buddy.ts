import { Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { Buddy, SCALE, type Pose, type Spot, type View } from '../core/buddy';
import { Graveyard } from '../shell/graveyard';

const JOINTS: readonly (keyof Pose)[] = ['torso', 'la1', 'la2', 'ra1', 'ra2', 'll1', 'll2', 'rl1', 'rl2'];

/**
 * The little figure on a row of tiles: it comes out from behind a tile when the mouse rests on it and moves after the
 * mouse, in the manner of Prince of Persia (core/buddy.ts is its movement, this is the drawing and the wiring). On a touch
 * screen a tap on a tile is the pointer: it comes out of that tile, the next tap sends it to another one, and with nothing
 * to follow it goes back behind a tile after a while (no cliffs there: a finger never leaves past the end of the row).
 * It is not there with reduced motion, it is hidden from assistive technology, and it never takes the pointer, so a tap
 * still does what it did. It lives inside the list of tiles, which must be a positioned stacking context with the tiles
 * above it; the web line it may shoot is drawn in an overlay of the same list.
 */
@Component({
  selector: 'app-buddy',
  template: `
    <svg viewBox="0 0 32 40" width="40" height="50" aria-hidden="true" focusable="false">
      <g class="fig">
        <g data-j="torso">
          <circle cx="16" cy="6" r="3.6" />
          <path d="M16 10V23" />
          <g data-j="la1"><path d="M16 12.5v5.5" /><g data-j="la2"><path d="M16 18v5" /></g></g>
          <g data-j="ra1"><path d="M16 12.5v5.5" /><g data-j="ra2"><path d="M16 18v5" /></g></g>
        </g>
        <g data-j="ll1"><path d="M16 23v7" /><g data-j="ll2"><path d="M16 30v7" /></g></g>
        <g data-j="rl1"><path d="M16 23v7" /><g data-j="rl2"><path d="M16 30v7" /></g></g>
      </g>
    </svg>
  `,
  styles: [`
    :host { position: absolute; left: 0; top: 0; z-index: 2; transform-origin: 50% 50%; width: 40px; height: 50px; visibility: hidden; pointer-events: none; color: var(--fg); }
    :host(.behind) { z-index: 0; }
    .fig { fill: none; stroke: currentColor; stroke-width: 1.9; stroke-linecap: round; stroke-linejoin: round; }
    .fig g { transform-box: view-box; }
    [data-j='torso'], [data-j='ll1'], [data-j='rl1'] { transform-origin: 16px 23px; }
    [data-j='la1'], [data-j='ra1'] { transform-origin: 16px 12.5px; }
    [data-j='la2'], [data-j='ra2'] { transform-origin: 16px 18px; }
    [data-j='ll2'], [data-j='rl2'] { transform-origin: 16px 30px; }
  `],
})
export class BuddyFigure {
  constructor() {
    const host = inject<ElementRef<HTMLElement>>(ElementRef).nativeElement;
    const destroy = inject(DestroyRef);
    const graveyard = inject(Graveyard);
    afterNextRender(() => {
      const list = host.parentElement;
      if (!list || matchMedia('(prefers-reduced-motion: reduce)').matches) return;

      const buddy = new Buddy();
      const svg = host.querySelector('svg')!;
      // the web line: an overlay over the whole list, in the list's own coordinates, as the figure's x and y are
      const NS = 'http://www.w3.org/2000/svg';
      const overlay = document.createElementNS(NS, 'svg');
      overlay.setAttribute('aria-hidden', 'true');
      overlay.setAttribute('focusable', 'false');
      overlay.style.cssText = 'position:absolute;left:0;top:0;width:100%;height:100%;overflow:visible;pointer-events:none;z-index:2;color:var(--fg);visibility:hidden';
      const line = document.createElementNS(NS, 'line');
      line.setAttribute('stroke', 'currentColor');
      line.setAttribute('stroke-width', '1');
      line.setAttribute('stroke-linecap', 'round');
      overlay.append(line);
      list.append(overlay);
      const joints = JOINTS.map((n) => [n, host.querySelector<SVGGElement>(`[data-j="${n}"]`)!] as const);
      let spots: Spot[] = [];
      let tiles: HTMLElement[] = [];
      let rects: { left: number; right: number; top: number; bottom: number }[] = [];
      let stacked = false; // tiles above one another, as in the hobbies' two columns

      /** The tiles' geometry, read when the pointer enters: the layout may have changed since. */
      const measure = (): void => {
        tiles = [...list.querySelectorAll<HTMLElement>('.tile')];
        rects = tiles.map((t) => ({ left: t.offsetLeft, right: t.offsetLeft + t.offsetWidth, top: t.offsetTop, bottom: t.offsetTop + t.offsetHeight }));
        spots = rects.map((r) => ({ a: r.left, b: r.right, fixed: r.top }));
        // the outer edge of the outer tiles is a cliff, on both sides
        const left = Math.min(...rects.map((r) => r.left));
        const right = Math.max(...rects.map((r) => r.right));
        rects.forEach((r, i) => {
          if (r.left === left) spots[i]!.cliff = -1;
          else if (r.right === right) spots[i]!.cliff = 1;
        });
        stacked = new Set(rects.map((r) => r.left)).size < rects.length;
        buddy.setSpots(spots);
      };

      const draw = (v: View): void => {
        host.style.visibility = v.visible ? 'visible' : 'hidden';
        overlay.style.visibility = v.web ? 'visible' : 'hidden';
        if (v.web) {
          line.setAttribute('x1', `${v.web.hx}`);
          line.setAttribute('y1', `${v.web.hy}`);
          line.setAttribute('x2', `${v.web.x}`);
          line.setAttribute('y2', `${v.web.y}`);
        }
        if (!v.visible) return;
        host.style.translate = `${v.x - 16 * SCALE}px ${v.y - 37 * SCALE}px`; // the feet are at (16, 37) in the drawing
        host.classList.toggle('behind', v.behind);
        svg.style.transform = v.facing < 0 ? 'scaleX(-1)' : '';
        host.style.rotate = v.spin ? `${v.spin}deg` : '';
        for (const [n, g] of joints) g.style.rotate = `${v.pose[n]}deg`;
      };

      let raf = 0;
      let last = 0;
      let lastMove = 0;
      const loop = (now: number): void => {
        const dt = Math.min(100, now - last);
        last = now;
        buddy.tick(dt);
        // a tile that is tilted, or lifted by the pointer, is stood on as it is
        spots.forEach((s, i) => {
          const cs = getComputedStyle(tiles[i]!);
          s.tilt = cs.rotate === 'none' ? 0 : Math.tan((parseFloat(cs.rotate) * Math.PI) / 180);
          s.lift = cs.translate === 'none' ? 0 : parseFloat(cs.translate.split(' ')[1] ?? '0');
        });
        const fell = buddy.takeDeath();
        if (fell) graveyard.add(fell);
        const v = buddy.view();
        draw(v);
        raf = !v.visible && now - lastMove > 3000 ? 0 : requestAnimationFrame(loop);
      };

      const onMove = (e: PointerEvent): void => {
        if (e.pointerType !== 'mouse') return;
        if (!spots.length) measure(); // the pointer was already over the tiles when the page came up
        const r = list.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        // the tile the pointer is over, or the nearest one when it is in a gap
        const dist = (r: (typeof rects)[number]): number => Math.hypot(Math.max(r.left - x, x - r.right, 0), Math.max(r.top - y, y - r.bottom, 0));
        const nearest = rects.reduce((best, r, i) => (dist(r) < dist(rects[best]!) ? i : best), 0);
        buddy.setInside(true); // also when the page came up under the pointer, with no enter
        buddy.pointer(nearest, x);
        wake();
      };
      const wake = (): void => {
        lastMove = performance.now();
        if (!raf) {
          last = lastMove;
          raf = requestAnimationFrame(loop);
        }
      };
      // a touch: a tap on a tile (a finger that went down and up in about one place) is where the pointer is, once
      let down: { x: number; y: number } | null = null;
      const onDown = (e: PointerEvent): void => {
        if (e.pointerType === 'mouse') return;
        down = { x: e.clientX, y: e.clientY };
        measure();
      };
      const onUp = (e: PointerEvent): void => {
        if (e.pointerType === 'mouse' || !down) return;
        const moved = Math.hypot(e.clientX - down.x, e.clientY - down.y);
        down = null;
        const tile = (e.target as Element | null)?.closest('.tile');
        const i = tiles.findIndex((t) => t === tile);
        if (moved > 10 || i < 0) return; // a scroll, or not on a tile
        buddy.pointer(i, e.clientX - list.getBoundingClientRect().left);
        wake();
      };
      const onEnter = (e: PointerEvent): void => {
        if (e.pointerType !== 'mouse') return;
        measure();
        buddy.setInside(true); // while the mouse is over the tiles the figure stays out, however still it rests
      };
      /** The pointer left: past an end (or, from a stack, below it) is a cliff; any other way is just leaving. */
      const onLeave = (e: PointerEvent): void => {
        if (e.pointerType !== 'mouse') return;
        buddy.setInside(false); // from now on the time runs: it goes after a while, or over the cliff the pointer left by
        const r = list.getBoundingClientRect();
        const x = e.clientX - r.left;
        const y = e.clientY - r.top;
        const side = x < 0 ? -1 : x > r.width ? 1 : stacked && y > r.height ? (x < r.width / 2 ? -1 : 1) : 0;
        if (side === 0) return;
        buddy.pointerOff(side);
        wake();
      };
      list.addEventListener('pointerenter', onEnter);
      list.addEventListener('pointermove', onMove);
      list.addEventListener('pointerleave', onLeave);
      list.addEventListener('pointerdown', onDown, { passive: true });
      list.addEventListener('pointerup', onUp, { passive: true });
      destroy.onDestroy(() => {
        list.removeEventListener('pointerenter', onEnter);
        list.removeEventListener('pointermove', onMove);
        list.removeEventListener('pointerleave', onLeave);
        list.removeEventListener('pointerdown', onDown);
        list.removeEventListener('pointerup', onUp);
        overlay.remove();
        cancelAnimationFrame(raf);
      });
    });
  }
}
