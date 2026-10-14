import { Injectable, signal } from '@angular/core';

export interface ToastMessage { id: number; text: string; tone: 'ok' | 'error' }

/**
 * One transient notification at a time. A new message replaces the current one and restarts the timer,
 * so repeated actions never pile up.
 */
@Injectable({ providedIn: 'root' })
export class Toast {
  readonly current = signal<ToastMessage | null>(null);
  private timer: ReturnType<typeof setTimeout> | undefined;
  private seq = 0;

  show(text: string, tone: ToastMessage['tone'] = 'ok', ms = 2500): void {
    clearTimeout(this.timer);
    this.current.set({ id: ++this.seq, text, tone });
    this.timer = setTimeout(() => this.current.set(null), ms);
  }

  dismiss(): void {
    clearTimeout(this.timer);
    this.current.set(null);
  }
}

/**
 * Copies text to the clipboard: the async Clipboard API first, then a hidden-textarea `execCommand('copy')`
 * fallback (focus is given back afterwards). Resolves to whether it worked.
 */
export async function copyText(text: string): Promise<boolean> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return true;
    }
  } catch { /* denied or unavailable: try the fallback */ }
  const back = document.activeElement as HTMLElement | null;
  const ta = document.createElement('textarea');
  try {
    ta.value = text;
    ta.setAttribute('readonly', '');
    ta.style.cssText = 'position:fixed;top:0;left:0;width:1px;height:1px;opacity:0;pointer-events:none';
    document.body.append(ta);
    ta.select();
    return typeof document.execCommand === 'function' && document.execCommand('copy');
  } catch {
    return false;
  } finally {
    ta.remove();
    back?.focus({ preventScroll: true });
  }
}
