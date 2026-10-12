import { store } from './storage';

afterEach(() => vi.unstubAllGlobals());

describe('store', () => {
  it('round-trips a value', () => {
    store.set('k', 'v');
    expect(store.get('k')).toBe('v');
  });

  it('does not throw when storage is blocked (private mode)', () => {
    vi.stubGlobal('localStorage', {
      getItem: () => { throw new Error('blocked'); },
      setItem: () => { throw new Error('blocked'); },
    });
    expect(store.get('k')).toBeNull();
    expect(() => store.set('k', 'v')).not.toThrow();
  });
});
