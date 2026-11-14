/**
 * One burst of confetti from a point of the screen (`x`, `y` in viewport pixels): a few score paper squares in the colours of
 * the site, thrown up and fanned out, falling with a little air drag, gone in about two and a half seconds. Draws on a canvas of
 * its own over the page (it never takes a click) and removes it when it is done. Nothing at all under reduced motion.
 */
export function confetti(x: number, y: number): void {
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const dpr = Math.min(2, devicePixelRatio || 1);
  const cv = document.createElement('canvas');
  cv.setAttribute('aria-hidden', 'true');
  cv.style.cssText = 'position:fixed;inset:0;width:100%;height:100%;pointer-events:none;z-index:80';
  cv.width = Math.round(innerWidth * dpr);
  cv.height = Math.round(innerHeight * dpr);
  document.body.append(cv);
  const ctx = cv.getContext('2d');
  if (!ctx) return cv.remove();

  const css = getComputedStyle(document.documentElement);
  const colours = ['--accent', '--lane-1', '--lane-2', '--lane-3', '--fg'].map((v) => css.getPropertyValue(v).trim()).filter(Boolean);
  const bits = Array.from({ length: 150 }, (_, k) => {
    const angle = -Math.PI / 2 + (Math.random() - 0.5) * 2.2; // up, fanned out to both sides
    const speed = 7 + Math.random() * 11;
    return {
      x, y, vx: Math.cos(angle) * speed, vy: Math.sin(angle) * speed,
      w: 5 + Math.random() * 6, h: 3 + Math.random() * 5, rot: Math.random() * 6.28, spin: (Math.random() - 0.5) * 0.4,
      colour: colours[k % colours.length]!, life: 1.6 + Math.random() * 0.9,
    };
  });

  const start = performance.now();
  let last = start;
  const frame = (now: number): void => {
    const dt = Math.min(2.5, (now - last) / 16.7); // in 60 fps frames
    last = now;
    const t = (now - start) / 1000;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.clearRect(0, 0, innerWidth, innerHeight);
    let alive = false;
    for (const b of bits) {
      if (t > b.life) continue;
      alive = true;
      b.vx *= 0.985 ** dt;
      b.vy = b.vy * 0.985 ** dt + 0.38 * dt;
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      b.rot += b.spin * dt;
      ctx.save();
      ctx.globalAlpha = Math.min(1, (b.life - t) * 2);
      ctx.translate(b.x, b.y);
      ctx.rotate(b.rot);
      ctx.fillStyle = b.colour;
      ctx.fillRect(-b.w / 2, -b.h / 2, b.w, b.h);
      ctx.restore();
    }
    if (alive) requestAnimationFrame(frame);
    else cv.remove();
  };
  requestAnimationFrame(frame);
}
