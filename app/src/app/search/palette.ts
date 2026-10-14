import { Component, DestroyRef, ElementRef, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { scrollToSection } from '../core/nav';
import { createCvAssistant, type CvAssistant } from './assistant';
import { buildCvContext, buildDocs, highlight, norm, search, type SearchDoc, type Segment } from './search';

/** One outline glyph per kind of result, so the list can be scanned by shape (24px grid, stroked). */
const ICONS = {
  profile: 'M7 3.5h7l4 4v13H7zM14 3.5V8h4M9.5 12.5h6M9.5 16h6',
  experience: 'M4 8h16v11H4zM9 8V5.5h6V8',
  skills: 'M5 12.5l4 4L19 7',
  projects: 'M3.5 7v11a1.5 1.5 0 0 0 1.5 1.5h14a1.5 1.5 0 0 0 1.5-1.5V9.5A1.5 1.5 0 0 0 19 8h-7l-2-2.5H5A1.5 1.5 0 0 0 3.5 7z',
  about: 'M12 12a4 4 0 1 0 0-8 4 4 0 0 0 0 8zM4.5 20a7.5 7.5 0 0 1 15 0',
  contact: 'M3.5 6.5h17v11h-17zM4 7l8 6 8-6',
  ask: 'M12 3.5l1.9 5.1 5.1 1.9-5.1 1.9L12 17.5l-1.9-5.1L5 10.5l5.1-1.9z',
} as const;

type Entry =
  | { kind: 'section'; id: SectionId; label: string }
  | { kind: 'doc'; doc: SearchDoc; label: string }
  | { kind: 'ask'; label: string };

@Component({
  selector: 'app-palette',
  template: `
    <dialog #dlg class="palette glass" [attr.aria-label]="c().ui.palette.open" (close)="closed.emit()" (click)="backdrop($event)">
      <div class="in">
        <div class="field">
          <input #q type="text" role="combobox" aria-autocomplete="list"
            [attr.aria-expanded]="entries().length > 0 ? 'true' : 'false'" [attr.aria-controls]="entries().length ? 'pal-list' : null"
            [attr.aria-activedescendant]="entries().length ? 'pal-' + index() : null"
            [attr.aria-label]="c().ui.palette.open" [placeholder]="c().ui.palette.placeholder"
            autocomplete="off" spellcheck="false" [value]="query()" (input)="onInput($event)" (keydown)="onKey($event)">
          <button type="button" class="chip" (click)="dlg.close()">{{ c().ui.palette.close }}</button>
        </div>
        <div class="answer" role="status" aria-live="polite">
          @if (answer(); as a) {
            <p [class.thinking]="busy()">{{ a.text }}</p>
            @if (a.note) { <p class="note">{{ a.note }}</p> }
          }
        </div>
        @if (entries().length) {
          <ul id="pal-list" class="list" role="listbox">
            @for (e of entries(); track key(e)) {
              <li role="option" [id]="'pal-' + $index" [attr.data-anchor]="anchorOf(e)" [attr.aria-selected]="$index === index()" [style.--i]="$index" (click)="run(e)" (pointermove)="index.set($index)">
                <svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false"><path [attr.d]="icon(e)" /></svg>
                <span>@for (g of segments(e); track $index) { <span [class.hit]="g.hit">{{ g.text }}</span> }</span>
              </li>
            }
          </ul>
        } @else {
          <p class="empty">{{ c().ui.palette.empty }}</p>
        }
      </div>
    </dialog>
  `,
  styles: [`
    .palette {
      width: min(100% - 24px, 38rem); max-height: min(70vh, 34rem); margin: 12vh auto auto; padding: 0;
      border-radius: 24px; color: var(--fg); overflow: hidden;
    }
    .palette::backdrop { background: rgba(0, 0, 0, 0.35); }
    .in { display: grid; max-height: inherit; }
    .field { display: flex; gap: 0.5rem; align-items: center; padding: 0.75rem 0.75rem 0.75rem 1.25rem; border-bottom: 1px solid var(--line); }
    input { flex: 1; min-width: 0; min-height: 44px; border: 0; outline: none; background: transparent; color: var(--fg); font: inherit; text-overflow: ellipsis; }
    .list { overflow: auto; padding: 0.5rem; }
    li { display: flex; align-items: center; gap: 0.75rem; padding: 0.625rem 1rem; border-radius: 14px; cursor: pointer; min-height: 44px; }
    li[aria-selected='true'] { background: color-mix(in srgb, var(--fg) 10%, transparent); }
    .ico { flex: none; color: var(--fg-2); transition: color var(--dur-short) var(--ease-out); }
    li[aria-selected='true'] .ico { color: var(--accent); }
    .hit { font-weight: 700; text-decoration: underline 2px var(--accent); text-underline-offset: 0.2em; }
    @media (prefers-reduced-motion: no-preference) {
      .palette[open] { animation: pal-in var(--dur-med) var(--ease-spring); }
      li { animation: opt-in var(--dur-short) var(--ease-out) both; animation-delay: calc(min(var(--i, 0), 8) * 18ms); }
      .thinking {
        color: transparent; -webkit-background-clip: text; background-clip: text;
        background-image: linear-gradient(90deg, var(--fg) 0%, var(--fg) 35%, var(--fg-2) 50%, var(--fg) 65%, var(--fg) 100%);
        background-size: 250% 100%; animation: shimmer 1.6s linear infinite;
      }
    }
    @keyframes pal-in { from { transform: translateY(-10px) scale(0.98); } }
    @keyframes opt-in { from { transform: translateY(6px); } }
    @keyframes shimmer { from { background-position: 100% 0; } to { background-position: -150% 0; } }
    .answer { padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
    .answer:empty { padding: 0; border: 0; }
    .note, .empty { color: var(--fg-2); font-size: var(--t-footnote); }
    .empty { padding: 1.25rem; }
    .note { margin-top: 0.5rem; }
  `],
})
export class Palette {
  readonly c = input.required<SiteContent>();
  readonly locale = input.required<Locale>();
  readonly closed = output<void>();

  private readonly dlg = viewChild.required<ElementRef<HTMLDialogElement>>('dlg');
  private readonly q = viewChild.required<ElementRef<HTMLInputElement>>('q');
  private readonly destroyRef = inject(DestroyRef);

  protected readonly query = signal('');
  protected readonly index = signal(0);
  protected readonly answer = signal<{ text: string; note: string } | null>(null);
  private readonly assistant = signal<CvAssistant | null>(null);
  private readonly docs = computed(() => buildDocs(this.c()));
  protected readonly busy = signal(false);
  private gone = false;

  protected readonly entries = computed<Entry[]>(() => {
    const ui = this.c().ui;
    const raw = this.query().trim();
    const q = norm(raw);
    const commands: Entry[] = [
      ...SECTION_IDS.map((id): Entry => ({ kind: 'section', id, label: ui.sections[id] })),
    ];
    if (!q) return commands;
    const out: Entry[] = [];
    out.push(...commands.filter((e) => norm(e.label).includes(q)));
    out.push(...search(this.docs(), raw).map((doc): Entry => ({ kind: 'doc', doc, label: doc.title })));
    if (this.assistant()) out.push({ kind: 'ask', label: `${ui.palette.ask}: ${raw}` });
    return out;
  });

  constructor() {
    this.destroyRef.onDestroy(() => {
      this.gone = true;
      this.assistant()?.close();
    });
    afterNextRender(() => {
      const el = this.dlg().nativeElement;
      el.showModal();
      this.q().nativeElement.focus();
      createCvAssistant(buildCvContext(this.c()), this.locale()).then(
        (a) => (this.gone ? a?.close() : this.assistant.set(a)),
        () => undefined,
      );
    });
  }

  protected onInput(e: Event): void {
    this.query.set((e.target as HTMLInputElement).value);
    this.index.set(0);
    this.answer.set(null);
  }

  protected onKey(e: KeyboardEvent): void {
    const n = this.entries().length;
    if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
      e.preventDefault();
      if (!n) return;
      this.index.update((i) => (i + (e.key === 'ArrowDown' ? 1 : n - 1)) % n);
      document.getElementById(`pal-${this.index()}`)?.scrollIntoView({ block: 'nearest' });
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const entry = this.entries()[this.index()];
      if (entry) this.run(entry);
    }
  }

  protected key(e: Entry): string {
    return `${e.kind}:${this.anchorOf(e) ?? e.label}`;
  }

  protected icon(e: Entry): string {
    switch (e.kind) {
      case 'section': return ICONS[e.id];
      case 'doc': return ICONS[e.doc.section];
      case 'ask': return ICONS.ask;
    }
  }

  protected segments(e: Entry): Segment[] {
    return e.kind === 'ask' ? [{ text: e.label, hit: false }] : highlight(e.label, this.query());
  }

  protected anchorOf(e: Entry): string | null {
    return e.kind === 'doc' ? e.doc.anchor : e.kind === 'section' ? e.id : null;
  }

  protected backdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close();
  }

  protected run(e: Entry): void {
    const close = () => this.dlg().nativeElement.close();
    switch (e.kind) {
      case 'section': close(); scrollToSection(e.id); break;
      case 'doc': close(); scrollToSection(e.doc.anchor); break;
      case 'ask': void this.ask(); break;
    }
  }

  private async ask(): Promise<void> {
    const ui = this.c().ui.palette;
    const a = this.assistant();
    const question = this.query().trim();
    if (!a || !question || this.busy()) return;
    this.busy.set(true);
    this.answer.set({ text: ui.thinking, note: '' });
    let result: { text: string; note: string };
    try {
      result = { text: await a.ask(question), note: ui.onDevice };
    } catch {
      result = { text: ui.askFailed, note: '' };
    }
    this.busy.set(false);
    if (!this.gone && this.query().trim() === question) this.answer.set(result);
  }
}
