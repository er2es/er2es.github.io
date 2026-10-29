import { HashKeeper, initHash, jumpHash, sectionOf, shownSection } from './hash';

function keeper(initial: string | null = null) {
  const writes: (string | null)[] = [];
  return { f: new HashKeeper(initial, (h) => writes.push(h)), writes };
}

describe('sectionOf', () => {
  it('maps every kind of anchor to its section', () => {
    expect(sectionOf('projects')).toBe('projects');
    expect(sectionOf('experience')).toBe('experience');
    expect(sectionOf('job-chamber')).toBe('experience');
    expect(sectionOf('p-fuzzphony')).toBe('projects');
    expect(sectionOf('skills-backend')).toBe('skills');
    expect(sectionOf('about-award')).toBe('about');
    expect(sectionOf('main')).toBeNull();
  });
});

describe('HashKeeper', () => {
  it('never touches the URL while the visitor only scrolls', () => {
    const { f, writes } = keeper();
    f.section('experience', 900);
    f.section('skills', 1800);
    f.top();
    expect(writes).toEqual([]);
  });

  it('writes the exact target of a jump once, and leaves it however the visitor scrolls on', () => {
    const { f, writes } = keeper();
    f.jump('job-chamber');
    f.section('profile', 100); // sections passing by during the smooth scroll are ignored
    f.settled(1000);
    f.section('experience', 1000);
    f.section('skills', 1500);
    f.section('projects', 2200);
    expect(writes).toEqual(['job-chamber']);
  });

  it('removes the hash at the top, and does not bring it back by scrolling', () => {
    const { f, writes } = keeper();
    f.jump('skills');
    f.settled(1800);
    f.top();
    f.section('experience', 900);
    f.top();
    expect(writes).toEqual(['skills', null]);
    f.jump('contact');
    expect(writes).toEqual(['skills', null, 'contact']);
  });

  it('keeps the hash of a page that was loaded with one until the visitor is back at the top', () => {
    const { f, writes } = keeper('projects');
    f.section('profile', 0); // the first sections seen before the browser has scrolled to the anchor
    f.settled(2900);
    f.section('about', 3700);
    expect(writes).toEqual([]);
    f.top();
    expect(writes).toEqual([null]);
  });

  it('ignores the top while a jump is still travelling', () => {
    const { f, writes } = keeper();
    f.jump('about-award');
    f.top();
    expect(writes).toEqual(['about-award']);
  });

  it('keeps a jump to a section near the end of the page as the current one, although a neighbour wins the observer there', () => {
    const { f } = keeper();
    f.jump('about');
    f.settled(4200); // the page could not scroll any further
    expect(f.section('contact', 4200)).toBe('about'); // the navigation keeps showing the target
    expect(f.section('contact', 4210)).toBe('about'); // a few pixels of settling do not release it
    expect(f.section('contact', 4300)).toBe('contact'); // the visitor scrolled on: now it follows
  });

  it('ignores a rest signal when nothing is jumping, and does not rewrite an unchanged hash', () => {
    const { f, writes } = keeper();
    f.settled(500);
    f.jump('skills');
    f.jump('skills');
    expect(writes).toEqual(['skills']);
  });

  it('shows the section in view when the pinned target is not a section of its own', () => {
    const { f } = keeper();
    f.jump('main');
    expect(f.section('experience', 0)).toBe('experience');
  });
});

describe('jumpHash', () => {
  afterEach(() => history.replaceState(null, '', '/'));

  it('tells the menu which section a jump is for, even when nothing will scroll', () => {
    const heard: string[] = [];
    const stop = initHash((s) => heard.push(s));
    jumpHash('about');
    jumpHash('job-chamber');
    jumpHash('main'); // not a section: nobody is told
    expect(heard).toEqual(['about', 'experience']);
    expect(location.hash).toBe('#main');
    stop();
    jumpHash('contact'); // after the cleanup nobody listens
    expect(heard).toEqual(['about', 'experience']);
  });

  it('still writes the target when nobody has started keeping the hash', () => {
    jumpHash('skills');
    expect(location.hash).toBe('#skills');
  });
});

describe('initHash in a page', () => {
  const scrollTo = (y: number): void => {
    Object.defineProperty(window, 'scrollY', { value: y, configurable: true });
  };
  afterEach(() => {
    vi.useRealTimers();
    scrollTo(0);
    history.replaceState(null, '', '/');
  });

  it('removes the hash when the page is back at the top, and only then', () => {
    jumpHash('skills'); // no keeper yet: the URL is just written
    const stop = initHash(); // a load with a hash: the browser is scrolling to it
    window.dispatchEvent(new Event('scrollend')); // it has come to rest
    scrollTo(500);
    window.dispatchEvent(new Event('scroll'));
    expect(location.hash).toBe('#skills');
    scrollTo(3);
    window.dispatchEvent(new Event('scroll'));
    expect(location.hash).toBe('');
    stop();
  });

  it('settles on a timer where `scrollend` does not exist, for a load with a hash and for a jump', () => {
    vi.useFakeTimers();
    history.replaceState(null, '', '/#projects');
    scrollTo(900);
    const stop = initHash(); // the load arms the fallback timer
    vi.advanceTimersByTime(1200);
    jumpHash('contact'); // a jump arms it again, and a second jump re-arms it
    jumpHash('about');
    vi.advanceTimersByTime(1200);
    scrollTo(905); // it came to rest at 900
    expect(shownSection('about')).toBe('about');
    expect(shownSection('contact')).toBe('about'); // the pin of the jump holds a few pixels
    scrollTo(1100);
    expect(shownSection('contact')).toBe('contact'); // and lets go once the visitor scrolls on
    stop();
  });

  it('does not take the place of a newer page view when an older one is cleaned up late', () => {
    const heard: string[] = [];
    const old = initHash();
    const current = initHash((section) => heard.push(section));
    old(); // the older view goes away after the newer one has started
    jumpHash('about');
    expect(heard).toEqual(['about']);
    current();
  });

  it('shows the section in view when nobody keeps the hash', () => {
    expect(shownSection('skills')).toBe('skills');
  });
});
