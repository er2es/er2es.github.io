/**
 * Escape hides every tooltip (they are secondary information and must be dismissable without moving anything):
 * `html.tips-off` stays until the pointer moves or the focus changes, then the tooltips are back. Returns a cleanup.
 */
export function initTips(): () => void {
  const root = document.documentElement;
  const hide = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') root.classList.add('tips-off');
  };
  const show = (): void => root.classList.remove('tips-off');
  document.addEventListener('keydown', hide);
  document.addEventListener('pointermove', show, { passive: true });
  document.addEventListener('focusin', show);
  return () => {
    document.removeEventListener('keydown', hide);
    document.removeEventListener('pointermove', show);
    document.removeEventListener('focusin', show);
    show();
  };
}
