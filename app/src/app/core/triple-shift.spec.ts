import { onTripleShift } from './triple-shift';

const key = (k: string, repeat = false): void => {
  window.dispatchEvent(new KeyboardEvent('keydown', { key: k, repeat }));
};

describe('onTripleShift', () => {
  let stop: () => void;
  let hits: number;
  beforeEach(() => {
    hits = 0;
    stop = onTripleShift(() => hits++, 700);
  });
  afterEach(() => stop());

  it('fires on three quick Shift presses', () => {
    key('Shift'); key('Shift'); key('Shift');
    expect(hits).toBe(1);
  });

  it('resets when another key comes in between (typing capitals never triggers it)', () => {
    key('Shift'); key('A'); key('Shift'); key('B'); key('Shift');
    expect(hits).toBe(0);
  });

  it('ignores key repeat from holding Shift', () => {
    key('Shift'); key('Shift', true); key('Shift', true); key('Shift', true);
    expect(hits).toBe(0);
  });

  it('needs three presses again after firing', () => {
    key('Shift'); key('Shift'); key('Shift'); key('Shift'); key('Shift');
    expect(hits).toBe(1);
    key('Shift');
    expect(hits).toBe(2);
  });

  it('does nothing after cleanup', () => {
    stop();
    key('Shift'); key('Shift'); key('Shift');
    expect(hits).toBe(0);
  });
});
