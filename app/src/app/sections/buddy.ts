import { Component, DestroyRef, ElementRef, afterNextRender, inject } from '@angular/core';
import { Buddy, SCALE, type Pose, type Spot, type View } from '../core/buddy';
import { Graveyard } from '../shell/graveyard';

const JOINTS: readonly (keyof Pose)[] = ['torso', 'la1', 'la2', 'ra1', 'ra2', 'll1', 'll2', 'rl1', 'rl2'];

/**
 * The little figure on a row of tiles: it comes out from behind a tile when the mouse rests on it and moves after the
 * mouse, in the manner of Prince of Persia (core/buddy.ts is its movement, this is the drawing and the wiring). On a touch
 * screen a tap on a tile is the pointer: it comes out of that tile, the next tap sends it to another one, and with nothing
 * to follow it sits down on the edge of its tile and waits for the next one (no cliffs there: a finger never leaves past
 * the end of the row). Once out it stays out: with a mouse too it sits and waits when the pointer has gone or rests.
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
    /* while it falls out of the list it is lifted to the page (fixed, over the sections below, which would paint over it in the list's own layer) */
    :host(.loose) { position: fixed; z-index: 15; }
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

      /** Lifts the figure out of the list to the page while it falls, and puts it back after. */
      const loose = (on: boolean): void => {
        if (on === host.classList.contains('loose')) return;
        host.classList.toggle('loose', on);
        (on ? document.body : list).appendChild(host);
        if (!on) host.style.translate = '0 0'; // the page's coordinates of the fall mean nothing in the list: a hidden figure far outside it would still stretch the page
      };

      const draw = (v: View): void => {
        const falling = v.visible && v.spin !== 0;
        loose(falling);
        host.style.visibility = v.visible ? 'visible' : 'hidden';
        overlay.style.visibility = v.web ? 'visible' : 'hidden';
        if (v.web) {
          line.setAttribute('x1', `${v.web.hx}`);
          line.setAttribute('y1', `${v.web.hy}`);
          line.setAttribute('x2', `${v.web.x}`);
          line.setAttribute('y2', `${v.web.y}`);
        }
        if (!v.visible) {
          host.style.clipPath = '';
          host.style.translate = '0 0'; // hidden, it stays inside the list (a hidden element outside the page would still make it scroll sideways)
          return;
        }
        // the feet are at (16, 37) in the drawing; loose, the position is the page's, from where the list is now
        const at = falling ? list.getBoundingClientRect() : { left: 0, top: 0 };
        host.style.translate = `${at.left + v.x - 16 * SCALE}px ${at.top + v.y - 37 * SCALE}px`;
        // a small tile is shorter than the figure: while it is behind its tile, whatever hangs lower than the tile's bottom is cut off
        // (on a phone the legs showed under the tile); in front of the tile it is whole. The tile is the one it is behind: the lowest
        // one, over its own width, whose top is above the feet (in a stack of rows too), at the height and the tilt it has now.
        let which = -1;
        if (v.behind && !falling) rects.forEach((q, i) => { if (v.x >= q.left && v.x <= q.right && v.y > q.top + 1 && (which < 0 || q.top > rects[which]!.top)) which = i; });
        const t = rects[which];
        const s = spots[which];
        const over = t && s ? v.y - 37 * SCALE + 50 - (t.bottom + (s.lift ?? 0) + (s.tilt ?? 0) * (v.x - (t.left + t.right) / 2)) : 0;
        host.style.clipPath = over > 0 ? `inset(0 0 ${over}px 0)` : '';
        host.classList.toggle('behind', v.behind);
        svg.style.transform = v.facing < 0 ? 'scaleX(-1)' : '';
        host.style.rotate = v.spin ? `${v.spin}deg` : '';
        for (const [n, g] of joints) g.style.rotate = `${v.pose[n]}deg`;
      };

      /** A tile that is tilted, or lifted by the pointer, is stood on as it is. */
      const readTiles = (): void => {
        spots.forEach((s, i) => {
          const cs = getComputedStyle(tiles[i]!);
          s.tilt = cs.rotate === 'none' ? 0 : Math.tan((parseFloat(cs.rotate) * Math.PI) / 180);
          s.lift = cs.translate === 'none' ? 0 : parseFloat(cs.translate.split(' ')[1] ?? '0');
        });
      };

      let raf = 0;
      let last = 0;
      let lastMove = 0;
      let onScreen = true; // the row is in view (the loop rests while it is not, unless the figure is on the move over the page)
      const loop = (now: number): void => {
        const dt = Math.min(100, now - last);
        last = now;
        readTiles(); // before the step, so that the very first one already stands on the tile as it is
        buddy.tick(dt);
        const fell = buddy.takeDeath();
        if (fell) graveyard.add(fell);
        const v = buddy.view();
        draw(v);
        const adrift = v.visible && (v.spin !== 0 || v.web !== null);
        raf = (!v.visible && now - lastMove > 3000) || (!onScreen && !adrift) ? 0 : requestAnimationFrame(loop);
      };

      let engaged = false; // the visitor has moved the pointer over the tiles or tapped one: the figure is theirs now
      let enteredAt = 0;
      const onMove = (e: PointerEvent): void => {
        if (e.pointerType !== 'mouse') return;
        engaged = true;
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
        engaged = true;
        buddy.pointer(i, e.clientX - list.getBoundingClientRect().left);
        wake();
      };
      const onEnter = (e: PointerEvent): void => {
        if (e.pointerType !== 'mouse') return;
        measure();
        enteredAt = performance.now();
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
        // a pointer that only swept across the row (it was in for less than 600 ms) is no reason for the figure to run off the edge
        if (performance.now() - enteredAt < 600) return;
        buddy.pointerOff(side);
        wake();
      };
      list.addEventListener('pointerenter', onEnter);
      list.addEventListener('pointermove', onMove);
      list.addEventListener('pointerleave', onLeave);
      list.addEventListener('pointerdown', onDown, { passive: true });
      list.addEventListener('pointerup', onUp, { passive: true });
      // it is there from the start: sitting on the end of the row, legs over the edge, waiting for the pointer or a tap
      const seat = (): void => {
        if (!rects.length) return;
        buddy.sitAt(rects.length - 1, rects[rects.length - 1]!.right);
        readTiles();
        wake();
      };
      measure();
      readTiles();
      seat();
      // the tiles change size or place (a phone turned, a window resized): measure again, and a figure nobody has played with yet sits down on the new end of the row
      const resized = new ResizeObserver(() => {
        measure();
        readTiles();
        if (!engaged) seat();
      });
      resized.observe(list);
      // off screen the loop rests; it picks up where it was when the row comes back into view
      const seen = new IntersectionObserver((entries) => {
        onScreen = entries[entries.length - 1]!.isIntersecting;
        if (onScreen) wake();
      });
      seen.observe(list);
      destroy.onDestroy(() => {
        resized.disconnect();
        seen.disconnect();
        list.removeEventListener('pointerenter', onEnter);
        list.removeEventListener('pointermove', onMove);
        list.removeEventListener('pointerleave', onLeave);
        list.removeEventListener('pointerdown', onDown);
        list.removeEventListener('pointerup', onUp);
        loose(false);
        overlay.remove();
        cancelAnimationFrame(raf);
      });
    });
  }
}
