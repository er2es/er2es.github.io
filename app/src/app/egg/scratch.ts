import { Component, DestroyRef, ElementRef, afterNextRender, computed, effect, inject, input, signal, viewChild } from '@angular/core';
import { EXTRA } from '../content/extra';
import type { SiteContent } from '../content/model';
import { clearedShare, nextPrize } from '../core/scratch';
import { Email } from '../sections/email';
import { confetti } from './confetti';

/**
 * An easter egg on the portrait: press and drag over the photo and it scratches away like the silver coating of a lottery
 * ticket, and under it there is a prize (one of a few, never the same twice in a row): the scams everybody knows, each one
 * giving itself away, and a line asking you to write to me, with the address to copy. Scratch about two fifths of it away
 * and the rest falls off in a burst of confetti; the card stays for five seconds (a line along its bottom counts them down,
 * like the other short answers of the page) and the photo fades back in. Scroll away from
 * it and back and the card is gone.
 * The card is not announced or reachable until it has been won. On a touch screen, a sideways stroke scratches at once and
 * a vertical one still scrolls the page; hold a finger still for a moment (a small buzz and a shrink say it is ready) and
 * every stroke scratches, in any direction, without moving the page.
 */
@Component({
  selector: 'app-scratch',
  imports: [Email],
  template: `
    <div class="prize" [class.on]="state() !== 'idle'" [class.won]="state() === 'won'" [class.info]="state() === 'won'" style="--life: 5000ms" [attr.aria-hidden]="state() === 'won' ? null : 'true'" [attr.inert]="state() === 'won' ? null : ''" [attr.role]="state() === 'won' ? 'status' : null">
      <b>{{ prize().title }}</b>
      <span>{{ prize().text }}</span>
      <small>{{ prize().small }}</small>
      <em>{{ x().claim }}</em>
      <app-email [c]="c()" [compact]="true" />
    </div>
    <canvas #coat class="coat" [class.on]="state() !== 'idle'" aria-hidden="true"></canvas>
    <canvas #heal class="coat heal" [class.on]="state() !== 'idle'" aria-hidden="true"></canvas>
  `,
  styles: [`
    :host { position: absolute; inset: 0; border-radius: inherit; overflow: hidden; pointer-events: none; }
    .prize {
      position: absolute; inset: 0; display: none; flex-direction: column; align-items: center; justify-content: center; gap: 0.35rem; padding: 0.75rem 1rem; text-align: center;
      background: var(--bg-2); color: var(--fg); border-radius: inherit; overflow: hidden;
    }
    .prize.on { display: flex; }
    .prize b { font-size: 1rem; line-height: 1.2; color: var(--accent); }
    .prize span { font-size: 0.8125rem; line-height: 1.3; }
    .prize small { font-size: 0.71875rem; line-height: 1.25; color: var(--fg-2); }
    .prize em { margin-top: 0.25rem; font-style: normal; font-size: 0.78125rem; font-weight: 600; }
    app-email { pointer-events: auto; }
    .coat { position: absolute; inset: 0; width: 100%; height: 100%; display: none; opacity: 1; transition: opacity var(--dur-ring) var(--ease-out); }
    .coat.on { display: block; }
    .coat.gone { opacity: 0; }
    /* the photo fades back over the card, and the card is gone when it is whole again */
    .heal { opacity: 0; transition: opacity 600ms var(--ease-out); pointer-events: none; }
    .heal.in { opacity: 1; }
    @media (prefers-reduced-motion: reduce) { .heal { transition: none; } }
    @media (prefers-reduced-motion: no-preference) { .prize.won b { animation: pop var(--dur-med) var(--ease-spring) both; } }
    @keyframes pop { from { scale: 0.6; opacity: 0; } }
  `],
})
export class Scratch {
  readonly c = input.required<SiteContent>();
  private readonly host = inject<ElementRef<HTMLElement>>(ElementRef);
  private readonly coat = viewChild.required<ElementRef<HTMLCanvasElement>>('coat');
  private readonly heal = viewChild.required<ElementRef<HTMLCanvasElement>>('heal');

  protected readonly x = computed(() => EXTRA[this.c().lang]);
  protected readonly state = signal<'idle' | 'scratching' | 'won'>('idle');
  /** Which prize it is; the words come from the language the page is in now, so a switch of language changes them too. */
  private readonly which = signal(0);
  protected readonly prize = computed(() => this.x().prizes[this.which()]!);
  private last: number | null = null;

  constructor() {
    const destroy = inject(DestroyRef);
    // while the card or the coating is up, the real photo underneath is out of the way (its antialiased corners would be a faint rim around the card)
    effect(() => this.host.nativeElement.parentElement?.classList.toggle('scratching', this.state() !== 'idle'));
    afterNextRender(() => {
      const box = this.host.nativeElement.parentElement;
      const cv = this.coat().nativeElement;
      const hv = this.heal().nativeElement;
      const ctx = cv.getContext('2d', { willReadFrequently: true });
      const hctx = hv.getContext('2d');
      const img = box?.querySelector('img');
      if (!box || !ctx || !hctx || !img) return;
      const probe = document.createElement('canvas');
      probe.width = probe.height = 32;
      const pctx = probe.getContext('2d', { willReadFrequently: true });
      if (!pctx) return;

      let down: { x: number; y: number } | null = null; // where the pointer last was, while the button is down
      let from: { x: number; y: number } | null = null; // where it went down
      let measured = 0;
      let touch = false; // the gesture is a finger's
      let armed = false; // it scratches: a mouse button down, or a finger that moved sideways or has stayed still for a moment
      let armTimer: ReturnType<typeof setTimeout> | undefined;
      let restoreTimer: ReturnType<typeof setTimeout> | undefined;
      let hideTimer: ReturnType<typeof setTimeout> | undefined;

      /** The photo itself, drawn on a canvas of the size of the box: the coating that is scratched off, and what grows back over it. */
      const paint = (c: HTMLCanvasElement, g: CanvasRenderingContext2D): void => {
        const r = box.getBoundingClientRect();
        const dpr = Math.min(2, devicePixelRatio || 1);
        c.width = Math.round(r.width * dpr);
        c.height = Math.round(r.height * dpr);
        g.globalCompositeOperation = 'source-over';
        g.clearRect(0, 0, c.width, c.height);
        g.drawImage(img, 0, 0, c.width, c.height);
      };

      /** A place on the screen, as a place on the coating. */
      const point = (clientX: number, clientY: number): { x: number; y: number } => {
        const r = box.getBoundingClientRect();
        return { x: ((clientX - r.left) / r.width) * cv.width, y: ((clientY - r.top) / r.height) * cv.height };
      };

      const begin = (): void => {
        clearTimeout(restoreTimer);
        clearTimeout(hideTimer);
        hv.classList.remove('in'); // a photo that was growing back stops
        const next = nextPrize(EXTRA.en.prizes.length, this.last);
        this.last = next;
        this.which.set(next);
        cv.classList.remove('gone');
        paint(cv, ctx);
        ctx.globalCompositeOperation = 'destination-out'; // what is drawn from now on takes the photo away
        measured = 0;
        this.state.set('scratching');
      };

      const share = (): number => {
        pctx.clearRect(0, 0, 32, 32);
        pctx.drawImage(cv, 0, 0, 32, 32);
        return clearedShare(pctx.getImageData(0, 0, 32, 32).data);
      };

      /** The photo fades back in over the card. */
      const restore = (): void => {
        paint(hv, hctx);
        void hv.offsetWidth;
        hv.classList.add('in');
        hideTimer = setTimeout(() => {
          this.state.set('idle'); // the real photo is under it, the same
          hv.classList.remove('in');
        }, 700);
      };

      /** Out of sight, the card is put away at once: coming back to the page, the photo is simply there. */
      const reset = (): void => {
        clearTimeout(restoreTimer);
        clearTimeout(hideTimer);
        down = from = null;
        hv.classList.remove('in');
        this.state.set('idle');
      };

      const win = (): void => {
        this.state.set('won');
        cv.classList.add('gone'); // what is left of the coating fades away
        const r = box.getBoundingClientRect();
        confetti(r.left + r.width / 2, r.top + r.height / 2);
        restoreTimer = setTimeout(restore, 5000); // as long as the line along the bottom of the card takes to run out
      };

      /** A finger: pressed and still for a moment, the photo gives a small buzz and a little shrink, and from then on any stroke scratches. */
      const arm = (): void => {
        armed = true;
        box.classList.add('armed');
        navigator.vibrate?.(10);
      };
      const disarm = (): void => {
        clearTimeout(armTimer);
        armed = false;
        box.classList.remove('armed');
      };

      const onDown = (e: PointerEvent): void => {
        if ((e.pointerType === 'mouse' && e.button !== 0) || box.classList.contains('docked') || (e.target as Element).closest('app-email')) return;
        down = from = { x: e.clientX, y: e.clientY };
        touch = e.pointerType !== 'mouse';
        if (touch) armTimer = setTimeout(arm, 220);
        else armed = true; // a mouse scratches at once
      };
      const onMove = (e: PointerEvent): void => {
        if (!down || !from || this.state() === 'won') return;
        if (!armed) {
          // a finger that moves before it has been still: sideways it is a scratch, up or down it is the page being scrolled
          const dx = e.clientX - from.x;
          const dy = e.clientY - from.y;
          if (Math.hypot(dx, dy) < 10) return;
          clearTimeout(armTimer);
          if (Math.abs(dx) > Math.abs(dy) * 0.9) armed = true; // sideways, or slanting: a scratch
          else {
            down = from = null;
            return;
          }
        }
        if (this.state() === 'idle') {
          if (Math.hypot(e.clientX - from.x, e.clientY - from.y) < 10) return; // a click is not a scratch
          begin();
          box.setPointerCapture(e.pointerId);
          const p0 = point(from.x, from.y);
          ctx.beginPath();
          ctx.moveTo(p0.x, p0.y);
        }
        const p = point(e.clientX, e.clientY);
        ctx.lineWidth = Math.max(26, cv.width * (touch ? 0.2 : 0.12)); // a finger is wider than a pointer
        ctx.lineCap = ctx.lineJoin = 'round';
        ctx.lineTo(p.x, p.y);
        ctx.stroke();
        ctx.beginPath();
        ctx.moveTo(p.x, p.y);
        down = { x: e.clientX, y: e.clientY };
        const now = performance.now();
        if (now - measured > 120) {
          measured = now;
          if (share() >= (touch ? 0.25 : 0.4)) win();
        }
      };
      const onUp = (): void => {
        down = from = null;
        disarm();
        if (this.state() === 'scratching') {
          if (share() >= (touch ? 0.25 : 0.4)) win();
          else restoreTimer = setTimeout(restore, 6000); // left half scratched: the photo comes back
        }
      };
      const noDrag = (e: Event): void => e.preventDefault();
      /** Once it scratches, a finger must not scroll the page; and the menu a long press opens (save the image...) must not open. */
      const noScroll = (e: TouchEvent): void => {
        if (armed && e.cancelable) e.preventDefault();
      };
      const noMenu = (e: Event): void => {
        if (touch) e.preventDefault();
      };

      const watch = new IntersectionObserver(([entry]) => {
        if (!entry!.isIntersecting && this.state() !== 'idle') reset();
      });
      watch.observe(box);
      box.addEventListener('pointerdown', onDown);
      box.addEventListener('pointermove', onMove);
      box.addEventListener('pointerup', onUp);
      box.addEventListener('pointercancel', onUp);
      box.addEventListener('dragstart', noDrag);
      box.addEventListener('touchmove', noScroll, { passive: false });
      box.addEventListener('contextmenu', noMenu);
      destroy.onDestroy(() => {
        watch.disconnect();
        clearTimeout(restoreTimer);
        clearTimeout(hideTimer);
        box.removeEventListener('pointerdown', onDown);
        box.removeEventListener('pointermove', onMove);
        box.removeEventListener('pointerup', onUp);
        box.removeEventListener('pointercancel', onUp);
        box.removeEventListener('dragstart', noDrag);
        box.removeEventListener('touchmove', noScroll);
        box.removeEventListener('contextmenu', noMenu);
        clearTimeout(armTimer);
      });
    });
  }
}
