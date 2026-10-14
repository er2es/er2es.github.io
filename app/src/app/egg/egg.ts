import { Component, ElementRef, VERSION, afterNextRender, computed, input, output, signal, viewChild } from '@angular/core';
import { EXTRA } from '../content/extra';
import { SITE_URL, type SiteContent } from '../content/model';
import { pagePath } from '../core/nav';
import { BUILD } from './build-info';

interface Row { label: string; value: string }

/** Live measurements of this very page, read from the browser's Performance APIs (nothing is hard-coded). */
function measure(t: SiteContent['ui']['egg']): Promise<Row[]> {
  const res = performance.getEntriesByType('resource') as PerformanceResourceTiming[];
  const nav = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming | undefined;
  const origin = location.origin;
  const kb = (b: number): string => `${(b / 1024).toFixed(1)} kB`;
  // encodedBodySize is the compressed size on the wire; unlike transferSize it is not 0 for files served from the browser cache
  const size = (r: { transferSize?: number; encodedBodySize?: number }): number => r.encodedBodySize || r.transferSize || 0;
  const transferred = res.reduce((n, r) => n + size(r), 0) + (nav ? size(nav) : 0);
  const scripts = res.filter((r) => r.initiatorType === 'script' || /\.js(\?|$)/.test(r.name)).reduce((n, r) => n + size(r), 0);
  const thirdParty = res.filter((r) => { try { return new URL(r.name).origin !== origin; } catch { return false; } }).length;
  // cookies are shared by every site on the same host (all of localhost, for example): count only the ones this page added
  const names = (c: string): string[] => c.split(';').map((x) => x.trim().split('=')[0]).filter(Boolean);
  const before = new Set(names((window as unknown as { __ck?: string }).__ck ?? ''));
  const cookies = names(document.cookie).filter((n) => !before.has(n)).length;
  const keys = (s: () => Storage): string[] => { try { const st = s(); return Array.from({ length: st.length }, (_, i) => st.key(i) ?? '').filter(Boolean); } catch { return []; } };
  const stored = (list: string[]): string => (list.length ? `${list.length} (${list.join(', ')})` : '0');

  return new Promise((resolve) => {
    let lcp: number | null = null;
    let cls: number | null = null;
    const observers: PerformanceObserver[] = [];
    const watch = (type: string, fn: (entries: PerformanceEntryList) => void): void => {
      try {
        const o = new PerformanceObserver((l) => fn(l.getEntries()));
        o.observe({ type, buffered: true });
        observers.push(o);
        if (type === 'layout-shift') cls = 0; // supported: no entries means no shift, which is a real 0
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
        // a page that contacts no third party cannot receive third-party cookies; if it ever does, the value is unknown
        { label: t.thirdParty, value: thirdParty === 0 ? '0' : '?' },
        { label: t.cookies, value: String(cookies) },
        { label: t.localStorage, value: stored(keys(() => localStorage)) },
        { label: t.sessionStorage, value: stored(keys(() => sessionStorage)) },
        { label: t.transferred, value: kb(transferred) },
        { label: t.scripts, value: kb(scripts) },
        { label: t.dom, value: String(document.getElementsByTagName('*').length) },
        { label: t.lcp, value: lcp === null ? '–' : `${Math.round(lcp)} ms` },
        { label: t.cls, value: cls === null ? '–' : cls.toFixed(3) },
        { label: t.framework, value: `Angular ${VERSION.full}` },
        { label: t.typescript, value: BUILD.typescript || '–' },
        { label: t.rendering, value: t.renderingValue },
        ...(BUILD.unit ? [{ label: t.tests, value: `${BUILD.unit} unit · ${BUILD.e2e} e2e` }] : []),
        { label: t.built, value: BUILD.date ? `${BUILD.date} · Node ${BUILD.node.replace(/^v/, '')}` : '–' },
      ]);
    }, 120);
  });
}

@Component({
  selector: 'app-egg',
  template: `
    <dialog #dlg class="egg glass" [attr.aria-label]="c().ui.egg.title" (close)="closed.emit()" (click)="backdrop($event)">
      <div class="in" tabindex="-1" autofocus>
        <h2>{{ c().ui.egg.title }}</h2>
        <p class="sub">{{ c().ui.egg.intro }}</p>
        <dl>
          @for (r of rows(); track r.label) {
            <div class="r"><dt>{{ r.label }}</dt><dd class="mono">{{ r.value }}</dd></div>
          }
        </dl>
        <div class="foot">
          <a class="btn" [attr.href]="pagespeed()" target="_blank" rel="noopener noreferrer">
            <svg viewBox="0 0 20 20" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">
              <path d="M3 14a7 7 0 1 1 14 0" /><path d="M10 14l3.2-4.2" /><circle cx="10" cy="14" r="1" fill="currentColor" stroke="none" />
            </svg>
            <span>{{ c().ui.egg.pagespeed }}</span>
            <span class="sr-only"> {{ extra().newTab }}</span>
          </a>
          <button type="button" class="chip" (click)="dlg.close()">{{ c().ui.egg.close }}</button>
        </div>
      </div>
    </dialog>
  `,
  styles: [`
    .egg { width: min(100% - 24px, 42rem); margin: 14vh auto auto; padding: 0; border-radius: 24px; color: var(--fg); }
    .egg::backdrop { background: rgba(0, 0, 0, 0.35); }
    .in { padding: 1.5rem; display: grid; gap: 0.75rem; outline: none; }
    h2 { font: 700 var(--t-title2) / 1.2 var(--font); }
    .sub, .note { color: var(--fg-2); font-size: var(--t-subhead); }
    dl { margin: 0.25rem 0; display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); column-gap: 2rem; }
    @media (max-width: 560px) { dl { grid-template-columns: 1fr; } }
    .r { display: flex; justify-content: space-between; gap: 1rem; padding-block: 0.5rem; border-top: 1px solid var(--line); }
    dt { color: var(--fg-2); }
    dd { margin: 0; font-weight: 600; text-align: right; }
    .foot .btn { gap: 0.6rem; min-height: 44px; padding: 0 1.25rem; font-size: var(--t-callout); }
    .foot .btn svg { flex: none; }
    .foot { display: flex; align-items: center; justify-content: space-between; gap: 1rem; flex-wrap: wrap; margin-top: 0.25rem; }
  `],
})
export class Egg {
  readonly c = input.required<SiteContent>();
  readonly closed = output<void>();
  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  protected readonly rows = signal<Row[]>([]);
  protected readonly extra = computed(() => EXTRA[this.c().lang]);
  /** The live site on Google's PageSpeed Insights, so anyone can run the audit themselves. */
  protected readonly pagespeed = computed(() => `https://pagespeed.web.dev/analysis?url=${encodeURIComponent(SITE_URL + pagePath(this.c().lang))}&form_factor=desktop`);

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
