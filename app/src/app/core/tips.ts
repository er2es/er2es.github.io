/**
 * Escape hides every tooltip (they are secondary information and must be dismissable without moving anything):
 * `html.tips-off` stays until the pointer moves or the focus changes, then the tooltips are back.
 * Once a tooltip has been shown, the pointer leaving it starts `html.tips-warm` for a moment, in which the next tooltip comes
 * without the usual wait (a reader running along the menu or the theme switch is not made to wait at every item). Returns a cleanup.
 */
export function initTips(): () => void {
  const root = document.documentElement;
  let shown = false;
  let warm: ReturnType<typeof setTimeout> | undefined;
  const hide = (e: KeyboardEvent): void => {
    if (e.key === 'Escape') root.classList.add('tips-off');
  };
  const show = (): void => root.classList.remove('tips-off');
  const started = (e: Event): void => {
    if ((e as AnimationEvent).animationName === 'tip-in') shown = true;
  };
  const left = (e: Event): void => {
    if (!shown || !(e.target as Element).closest('[data-tip]')) return;
    shown = false;
    root.classList.add('tips-warm');
    clearTimeout(warm);
    warm = setTimeout(() => root.classList.remove('tips-warm'), 300);
  };
  document.addEventListener('keydown', hide);
  document.addEventListener('pointermove', show, { passive: true });
  document.addEventListener('focusin', show);
  document.addEventListener('animationstart', started);
  document.addEventListener('pointerout', left);
  return () => {
    document.removeEventListener('keydown', hide);
    document.removeEventListener('pointermove', show);
    document.removeEventListener('focusin', show);
    document.removeEventListener('animationstart', started);
    document.removeEventListener('pointerout', left);
    clearTimeout(warm);
    root.classList.remove('tips-warm');
    show();
  };
}
