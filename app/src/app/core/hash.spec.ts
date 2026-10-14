import { HashFollower, sectionOf } from './hash';

function follower(initial: string | null = null) {
  const writes: (string | null)[] = [];
  return { f: new HashFollower(initial, (h) => writes.push(h)), writes };
}

describe('sectionOf', () => {
  it('maps every kind of anchor to its section', () => {
    expect(sectionOf('projects')).toBe('projects');
    expect(sectionOf('job-chamber')).toBe('experience');
    expect(sectionOf('p-fuzzphony')).toBe('projects');
    expect(sectionOf('skills-backend')).toBe('skills');
    expect(sectionOf('about-award')).toBe('about');
    expect(sectionOf('main')).toBeNull();
  });
});

describe('HashFollower', () => {
  it('keeps a jump to a section near the end of the page pinned, although a neighbour wins the observer there', () => {
    const { f, writes } = follower();
    f.jump('about');
    f.settled(4200); // the page could not scroll any further
    expect(f.section('contact', 4200)).toBe('about'); // the UI keeps showing the target
    expect(f.section('contact', 4210)).toBe('about'); // a few pixels of settling do not release it
    expect(writes).toEqual(['about']);
    expect(f.section('contact', 4300)).toBe('contact'); // the visitor scrolled on: now it follows
    expect(writes).toEqual(['about', 'contact']);
  });

  it('never touches the URL when nobody clicked and there was no hash', () => {
    const { f, writes } = follower();
    f.section('experience');
    f.section('skills');
    f.top();
    expect(writes).toEqual([]);
  });

  it('writes the exact target of a jump and keeps it while the visitor stays in that section', () => {
    const { f, writes } = follower();
    f.jump('job-chamber');
    f.section('profile', 100); // sections passing by during the smooth scroll are ignored
    f.section('experience', 900);
    f.settled(1000);
    f.section('experience', 1000);
    expect(writes).toEqual(['job-chamber']);
  });

  it('follows the section in view once the visitor scrolls away from the target', () => {
    const { f, writes } = follower();
    f.jump('job-chamber');
    f.settled(1000);
    f.section('skills', 1500);
    f.section('projects', 2200);
    f.section('experience', 1100);
    expect(writes).toEqual(['job-chamber', 'skills', 'projects', 'experience']);
  });

  it('removes the hash at the top and does not bring it back until the next jump', () => {
    const { f, writes } = follower();
    f.jump('skills');
    f.settled(1800);
    f.section('projects', 2400);
    f.top();
    f.section('profile', 10);
    f.section('experience', 900);
    expect(writes).toEqual(['skills', 'projects', null]);
    f.jump('contact');
    f.settled(4200);
    f.section('about', 3600);
    expect(writes).toEqual(['skills', 'projects', null, 'contact', 'about']);
  });

  it('tracks a page that was loaded with a hash, and is not overwritten while the browser scrolls to it', () => {
    const { f, writes } = follower('projects');
    f.section('profile', 0); // the first sections seen before the browser has scrolled to the anchor
    f.settled(2900);
    f.section('projects', 2900); // still inside the target section: the exact hash stays
    f.section('about', 3700);
    expect(writes).toEqual(['about']);
  });

  it('ignores the top while a jump is still travelling', () => {
    const { f, writes } = follower();
    f.jump('about-award');
    f.top();
    expect(writes).toEqual(['about-award']);
  });
});
