import { Component, ElementRef, afterNextRender, computed, inject, input, output, signal, viewChild } from '@angular/core';
import { EMAIL, SECTION_IDS, type Locale, type SectionId, type SiteContent } from '../content/model';
import { LangSwitch } from '../core/lang';
import { scrollToSection } from '../core/nav';
import { Theme } from '../core/theme';
import { createCvAssistant, type CvAssistant } from './assistant';
import { buildCvContext, buildDocs, norm, search, type SearchDoc } from './search';

type Entry =
  | { kind: 'section'; id: SectionId; label: string }
  | { kind: 'doc'; doc: SearchDoc; label: string }
  | { kind: 'lang'; label: string }
  | { kind: 'theme'; label: string }
  | { kind: 'email'; label: string }
  | { kind: 'ask'; label: string };

@Component({
  selector: 'app-palette',
  template: `
    <dialog #dlg class="palette glass" [attr.aria-label]="c().ui.palette.open" (close)="closed.emit()" (click)="backdrop($event)">
      <div class="in">
        <div class="field">
          <input #q type="text" role="combobox" aria-autocomplete="list" aria-expanded="true" aria-controls="pal-list"
            [attr.aria-activedescendant]="entries().length ? 'pal-' + index() : null"
            [attr.aria-label]="c().ui.palette.placeholder" [placeholder]="c().ui.palette.placeholder"
            autocomplete="off" spellcheck="false" [value]="query()" (input)="onInput($event)" (keydown)="onKey($event)">
          <button type="button" class="chip" (click)="dlg.close()">{{ c().ui.palette.close }}</button>
        </div>
        @if (answer(); as a) {
          <div class="answer" role="status">
            <p>{{ a.text }}</p>
            <p class="note">{{ a.note }}</p>
          </div>
        }
        @if (entries().length) {
          <ul id="pal-list" class="list" role="listbox">
            @for (e of entries(); track $index) {
              <li role="option" [id]="'pal-' + $index" [attr.aria-selected]="$index === index()" (click)="run(e)" (pointermove)="index.set($index)">{{ e.label }}</li>
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
    li { padding: 0.75rem 1rem; border-radius: 14px; cursor: pointer; min-height: 44px; }
    li[aria-selected='true'] { background: color-mix(in srgb, var(--fg) 10%, transparent); }
    .answer { padding: 1rem 1.25rem; border-bottom: 1px solid var(--line); }
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
  private readonly theme = inject(Theme);
  private readonly lang = inject(LangSwitch);

  protected readonly query = signal('');
  protected readonly index = signal(0);
  protected readonly answer = signal<{ text: string; note: string } | null>(null);
  private readonly assistant = signal<CvAssistant | null>(null);
  private docs: SearchDoc[] = [];

  protected readonly entries = computed<Entry[]>(() => {
    const ui = this.c().ui;
    const raw = this.query().trim();
    const q = norm(raw);
    const commands: Entry[] = [
      ...SECTION_IDS.map((id): Entry => ({ kind: 'section', id, label: ui.sections[id] })),
      { kind: 'lang', label: ui.palette.switchLanguage },
      { kind: 'theme', label: ui.palette.changeTheme },
      { kind: 'email', label: ui.palette.email },
    ];
    if (!q) return commands;
    const out: Entry[] = [];
    if (this.assistant()) out.push({ kind: 'ask', label: `${ui.palette.ask}: ${raw}` });
    out.push(...commands.filter((e) => norm(e.label).includes(q)));
    out.push(...search(this.docs, raw).map((doc): Entry => ({ kind: 'doc', doc, label: doc.title })));
    return out;
  });

  constructor() {
    afterNextRender(() => {
      this.docs = buildDocs(this.c());
      const el = this.dlg().nativeElement;
      el.showModal();
      this.q().nativeElement.focus();
      void createCvAssistant(buildCvContext(this.c()), this.locale()).then((a) => this.assistant.set(a));
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

  protected backdrop(e: MouseEvent): void {
    if (e.target === this.dlg().nativeElement) this.dlg().nativeElement.close();
  }

  protected run(e: Entry): void {
    const close = () => this.dlg().nativeElement.close();
    switch (e.kind) {
      case 'section': close(); scrollToSection(e.id); break;
      case 'doc': close(); scrollToSection(e.doc.anchor); break;
      case 'lang': close(); this.lang.go(this.locale() === 'en' ? 'hu' : 'en'); break;
      case 'theme': this.theme.cycle(); break;
      case 'email': location.href = `mailto:${EMAIL}`; break;
      case 'ask': void this.ask(); break;
    }
  }

  private async ask(): Promise<void> {
    const ui = this.c().ui.palette;
    const a = this.assistant();
    const question = this.query().trim();
    if (!a || !question) return;
    this.answer.set({ text: ui.thinking, note: '' });
    try {
      this.answer.set({ text: await a.ask(question), note: ui.onDevice });
    } catch {
      this.answer.set({ text: ui.askFailed, note: '' });
    }
  }
}
