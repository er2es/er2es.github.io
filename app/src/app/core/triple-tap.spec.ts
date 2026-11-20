import { onTripleTap } from './triple-tap';

describe('onTripleTap', () => {
  let stop: () => void;
  let hits: number;
  let a: HTMLElement;
  let other: HTMLElement;
  beforeEach(() => {
    hits = 0;
    document.body.innerHTML = '<button class="addr"><span>x</span></button><p id="o">other</p>';
    a = document.querySelector<HTMLElement>('.addr span')!;
    other = document.getElementById('o')!;
    stop = onTripleTap('.addr', () => hits++, 900);
  });
  afterEach(() => stop());

  it('fires on three quick taps, also on a child of the control', () => {
    a.click(); a.click(); a.click();
    expect(hits).toBe(1);
  });

  it('starts again after a tap elsewhere', () => {
    a.click(); a.click(); other.click(); a.click();
    expect(hits).toBe(0);
  });

  it('does not count taps that are too far apart', () => {
    const spy = vi.spyOn(performance, 'now');
    spy.mockReturnValueOnce(0).mockReturnValueOnce(2000).mockReturnValueOnce(4000);
    a.click(); a.click(); a.click();
    expect(hits).toBe(0);
    spy.mockRestore();
  });

  it('stops listening when removed', () => {
    stop();
    a.click(); a.click(); a.click();
    expect(hits).toBe(0);
  });
});
