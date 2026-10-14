import { Component, ElementRef, afterNextRender, input, output, signal, viewChild } from '@angular/core';
import type { SiteContent } from '../content/model';

interface Row { label: string; value: string }

/** Live measurements of this very page, read from the browser's Performance APIs (nothing is hard-coded). */
function measure(t: SiteContent['ui']['egg']): Promise<Row[]> {
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const origin = location.origin;
  const kb = (b: number): string => `${(b / 1024).toFixed(1)} kB`;
  const transferred = res.reduce((n, r) => n + (r.transferSize || 0), 0) + (nav?.transferSize ?? 0);
  const scripts = res.filter((r) => r.initiatorType === 'script' || /\.js(\?|$)/.test(r.name)).reduce((n, r) => n + (r.transferSize || 0), 0);
  const thirdParty = res.filter((r) => { try { return new URL(r.name).origin !== origin; } catch { return false; } }).length;
  // cookies are shared by every site on the same host (all of localhost, for example): count only the ones this page added
  const names = (c: string): string[] => c.split(';').map((x) => x.trim().split('=')[0]).filter(Boolean);
  const before = new Set(names((window as unknown as { __ck?: string }).__ck ?? ''));
  const cookies = names(document.cookie).filter((n) => !before.has(n)).length;

  return new Promise((resolve) => {
    let lcp: number | null = null;
    let cls: number | null = null;
    const observers: PerformanceObserver[] = [];
    const watch = (type: string, fn: (entries: PerformanceEntryList) => void): void => {
      try {
        const o = new PerformanceObserver((l) => fn(l.getEntries()));
        o.observe({ type, buffered: true });
        observers.push(o);
      } catch { /* entry type not supported in this browser: shown as a dash */ }
    };
    watch('largest-contentful-paint', (es) => { lcp = es[es.length - 1]?.startTime ?? lcp; });
    watch('layout-shift', (es) => {
      cls = (cls ?? 0) + (es as unknown as { value: number; hadRecentInput: boolean }[]).filter((e) => !e.hadRecentInput).reduce((n, e) => n + e.value, 0);
    });
    setTimeout(() => {
      observers.forEach((o) => o.disconnect());
      resolve([
        { label: t.requests, value: String(res.length + 1) },
        { label: t.thirdParty, value: String(thirdParty) },
        { label: t.cookies, value: String(cookies) },
        { label: t.transferred, value: kb(transferred) },
        { label: t.scripts, value: kb(scripts) },
        { label: t.dom, value: String(document.getElementsByTagName('*').length) },
        { label: t.lcp, value: lcp === null ? '–' : `${Math.round(lcp)} ms` },
        { label: t.cls, value: cls === null ? '–' : cls.toFixed(3) },
      ]);
    }, 120);
  });
}

@Component({
  selector: 'app-egg',
  template: `
    <dialog #dlg class="egg glass" [attr.aria-label]="c().ui.egg.title" (close)="closed.emit()" (click)="backdrop($event)">
      <div class="in">
        <h2>{{ c().ui.egg.title }}</h2>
        <p class="sub">{{ c().ui.egg.intro }}</p>
        <dl>
          @for (r of rows(); track r.label) {
            <div class="r"><dt>{{ r.label }}</dt><dd class="mono">{{ r.value }}</dd></div>
          }
        </dl>
        <p class="note">{{ c().ui.egg.note }}</p>
        <button type="button" class="chip" (click)="dlg.close()">{{ c().ui.egg.close }}</button>
      </div>
    </dialog>
  `,
  styles: [`
    .egg { width: min(100% - 24px, 28rem); margin: 14vh auto auto; padding: 0; border-radius: 24px; color: var(--fg); }
    .egg::backdrop { background: rgba(0, 0, 0, 0.35); }
    .in { padding: 1.5rem; display: grid; gap: 0.75rem; }
    h2 { font: 700 var(--t-title2) / 1.2 var(--font); }
    .sub, .note { color: var(--fg-2); font-size: var(--t-subhead); }
    dl { margin: 0.25rem 0; }
    .r { display: flex; justify-content: space-between; gap: 1rem; padding-block: 0.5rem; border-top: 1px solid var(--line); }
    dt { color: var(--fg-2); }
    dd { margin: 0; font-weight: 600; }
    .chip { justify-self: end; }
  `],
})
export class Egg {
  readonly c = input.required<SiteContent>();
  readonly closed = output<void>();
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  protected readonly rows = signal<Row[]>([]);

  constructor() {
    afterNextRender(() => {
      this.dlg().nativeElement.showModal();
      void measure(this.c().ui.egg).then((r) => this.rows.set(r));
    });
  }

  protected backdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close();
  }
}
