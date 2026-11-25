/**
 * How far the page should scroll so that a card that has just opened sits in the middle of the screen (the whole screen, the header
 * included): its centre on the centre of the window. A card too tall for that is put with its top just under the header, which is the
 * most that can be shown of it from the start. `top` is where its top is now, `height` how tall it will be, `above` how much room the
 * header and a little air take at the top of the window. A positive result scrolls down.
 */
export function centreDelta(top: number, height: number, view: number, above: number): number {
  const air = 24;
  if (height + above + air > view) return top - above;
  return Math.min(top + height / 2 - view / 2, top - above);
}
