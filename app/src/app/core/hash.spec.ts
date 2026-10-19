import { HashKeeper, sectionOf } from './hash';

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
