import { centreDelta } from './centre';

describe('centreDelta', () => {
  it('puts a card that fits in the middle of the window, from above or from below', () => {
    expect(centreDelta(500, 200, 800, 90)).toBe(200); // its centre is at 600, the middle is 400
    expect(centreDelta(100, 200, 800, 90)).toBe(-200); // its centre is at 200: the page scrolls up
  });

  it('puts a card that is too tall with its top just under the header', () => {
    expect(centreDelta(400, 700, 800, 90)).toBe(310);
  });

  it('never puts a card higher than the room under the header', () => {
    expect(centreDelta(120, 640, 800, 90)).toBe(30); // centred, its top would go to 80, under the header: it is held at 90
  });
});
