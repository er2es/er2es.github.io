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
