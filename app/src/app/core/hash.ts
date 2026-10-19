import { SECTION_IDS, type SectionId } from '../content/model';

/** The top-level section an anchor id lives in (`job-*` belongs to Experience, `p-*` to Projects, ...). */
export function sectionOf(anchor: string): SectionId | null {
  if ((SECTION_IDS as readonly string[]).includes(anchor)) return anchor as SectionId;
  if (anchor.startsWith('job-')) return 'experience';
  if (anchor.startsWith('p-')) return 'projects';
  if (anchor.startsWith('skills-')) return 'skills';
  if (anchor.startsWith('about-')) return 'about';
  return null;
}

/**
 * Keeps the URL hash simple and predictable.
 *  - Scrolling alone never touches the URL.
 *  - An in-page jump (a menu or tab click, a search result) writes its exact target; a load that came with a hash keeps it.
 *  - Back at the very top of the page the hash is removed, so a reload does not carry the visitor to a section they left.
 * It also keeps the navigation's "current section" on the target of a jump near the end of the page, where a
 * neighbour would win. Pure state machine: the URL is written through `write`, so it is testable without a browser.
 */
/** How far the visitor has to scroll after a jump before the jump's target stops being pinned. */
const PIN_RELEASE_PX = 24;

export class HashKeeper {
  private jumping: boolean;
  private pinned: { id: string; section: SectionId | null } | null = null;
  private restY = 0;

  constructor(
    private current: string | null,
    private readonly write: (hash: string | null) => void,
  ) {
    // a load with a hash: the browser scrolls to it, and the sections passing by must not count
    this.jumping = current !== null;
    if (current) this.pinned = { id: current, section: sectionOf(current) };
  }

  /** An in-page jump to `id` has started. */
  jump(id: string): void {
    this.jumping = true;
    this.pinned = { id, section: sectionOf(id) };
    this.set(id);
  }

  /** The scroll that a jump (or the load) started has come to rest at `y`. */
  settled(y = 0): void {
    if (!this.jumping) return; // later `scrollend` events belong to the visitor's own scrolling, not to a jump
    this.jumping = false;
    this.restY = y;
  }

  /**
   * The section in view changed (the visitor is at scroll position `y`). Returns the section the navigation should show
   * as current: after a jump that is the jump's own section until the visitor scrolls on by their own hand
   * (a few pixels), because a target near the end of the page cannot reach the top and a neighbour would win.
   */
  section(section: SectionId, y = 0): SectionId {
    if (this.pinned) {
      if (this.jumping || Math.abs(y - this.restY) < PIN_RELEASE_PX || this.pinned.section === section) {
        return this.pinned.section ?? section;
      }
      this.pinned = null;
    }
    return section;
  }

  /** The page has been scrolled all the way to the top. */
  top(): void {
    if (this.current === null || this.jumping) return;
    this.pinned = null;
    this.set(null);
  }

  private set(hash: string | null): void {
    if (hash === this.current) return;
    this.current = hash;
    this.write(hash);
  }
}

let keeper: HashKeeper | null = null;
let settleTimer = 0;

const writeUrl = (hash: string | null): void => {
  history.replaceState(history.state, '', `${location.pathname}${location.search}${hash ? `#${hash}` : ''}`);
};

/** Starts keeping the hash for this page view. Returns a cleanup. */
export function initHash(): () => void {
  const f = new HashKeeper(location.hash.slice(1) || null, writeUrl);
  keeper = f;
  const settle = (): void => {
    clearTimeout(settleTimer);
    f.settled(window.scrollY);
  };
  // browsers without `scrollend` fall back to a timer that outlasts a smooth scroll
  const arm = (): void => {
    clearTimeout(settleTimer);
    settleTimer = window.setTimeout(settle, 1100);
  };
  const onScroll = (): void => {
    if (window.scrollY < 8) f.top();
  };
  if (location.hash) arm();
  window.addEventListener('scroll', onScroll, { passive: true });
  window.addEventListener('scrollend', settle);
  return () => {
    window.removeEventListener('scroll', onScroll);
    window.removeEventListener('scrollend', settle);
    clearTimeout(settleTimer);
    if (keeper === f) keeper = null;
  };
}

/** Called when an in-page jump starts: writes the exact target and begins following. */
export function jumpHash(id: string): void {
  if (!keeper) {
    writeUrl(id);
    return;
  }
  keeper.jump(id);
  clearTimeout(settleTimer);
  settleTimer = window.setTimeout(() => keeper?.settled(window.scrollY), 1100);
}

/** Called when the section in view changes. Returns the section to show as current. */
export function shownSection(section: SectionId): SectionId {
  return keeper ? keeper.section(section, window.scrollY) : section;
}
