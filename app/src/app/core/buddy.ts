/**
 * The little figure that follows the mouse over a set of tiles (the soft skills in a row, the hobbies in two columns).
 * Its movement is in the manner of Prince of Persia: poses worked out frame by frame (twelve key poses a second, which the
 * drawing moves between smoothly), a crouch before a jump, a running jump with the legs stretched, a ledge that it grabs
 * and pulls itself up on, and a long landing. This file is only the movement, in pixels and milliseconds, with no DOM: the
 * component feeds it the pointer and the tiles' geometry and draws what `view()` says.
 *
 * The figure stands on the tiles' top edges and runs along them after the pointer. To get to another tile it runs to the
 * edge and jumps: across a gap, down to a lower edge, or up to a higher one, which it grabs and pulls itself up on. When
 * the other tile is too far or too high to jump to, it goes behind its own tile and comes out from behind the other one.
 * It comes out from behind a tile by pulling itself up onto the ledge, and when the pointer has been still or gone for
 * a while it goes back the same way. Where the pointer leaves past the end of the tiles, at a cliff, it runs off the edge and
 * falls: the component then lays its body at the foot of the page (`takeDeath()`).
 */

export const FRAME_MS = 1000 / 12;
/** The figure's size: a viewBox unit of its drawing is this many px. */
export const SCALE = 1.25;
/** How far, in px, the figure sinks behind a tile to be out of sight. */
export const HIDE = 46 * SCALE;
/** How long the pointer may be still or away before the figure leaves. */
export const TOLERANCE = 1600;
/** How long the pointer rests on a tile before the figure comes out. */
const DWELL = 140;
const SPEED = 210; // px/s along a tile's top edge
/** The farthest it will jump: a gap, a rise to a higher edge, a drop to a lower one (px). */
const MAX_GAP = 60;
const MAX_UP = 90;
const MAX_DOWN = 170;
const FALL_MS = 1100; // how long the fall is, out of sight at the end of it
const GRAVITY = 2600; // px/s²
const OFF_WAIT = 450; // how long the pointer is away before the figure goes over a cliff
const HANG = 33.5 / 46; // how low it hangs from a ledge, as a share of HIDE: its hands, at the top of the drawing, are on the ledge

const KEYS = ['torso', 'la1', 'la2', 'ra1', 'ra2', 'll1', 'll2', 'rl1', 'rl2'] as const;
export interface Pose {
  torso: number; la1: number; la2: number; ra1: number; ra2: number; ll1: number; ll2: number; rl1: number; rl2: number;
}
/** One frame: the joint angles (degrees, the figure facing right: forward is negative) and how far it has sunk (0 to 1). */
export interface Frame { pose: Pose; off: number }
export type Clip = readonly Frame[];

const P = (p: Partial<Pose>): Pose => ({ torso: 0, la1: 10, la2: -5, ra1: -10, ra2: 5, ll1: 4, ll2: 0, rl1: -4, rl2: 0, ...p });
const F = (p: Partial<Pose>, off = 0): Frame => ({ pose: P(p), off });
/** Between two frames, `k` of the way (0 to 1). */
const mix = (a: Frame, b: Frame, k: number): Frame => {
  const pose = { ...a.pose };
  for (const j of KEYS) pose[j] = a.pose[j] + (b.pose[j] - a.pose[j]) * k;
  return { pose, off: a.off + (b.off - a.off) * k };
};

const CROUCH = { torso: -24, la1: -30, la2: -50, ra1: -35, ra2: -50, ll1: -45, ll2: 95, rl1: -60, rl2: 100 };

export const CLIPS = {
  /** Standing and breathing, two frames. */
  stand: [F({}), F({ torso: -1, la1: 12, ra1: -12 })] as Clip,
  /** A run: contact, passing, contact on the other leg, passing. */
  run: [
    F({ torso: -10, la1: 50, la2: -25, ra1: -55, ra2: -70, ll1: 35, ll2: 20, rl1: -45, rl2: 55 }),
    F({ torso: -10, la1: 10, la2: -40, ra1: -20, ra2: -50, ll1: 5, ll2: 5, rl1: -10, rl2: 90 }),
    F({ torso: -10, la1: -55, la2: -70, ra1: 50, ra2: -25, ll1: -45, ll2: 55, rl1: 35, rl2: 20 }),
    F({ torso: -10, la1: -20, la2: -50, ra1: 10, ra2: -40, ll1: -10, ll2: 90, rl1: 5, rl2: 5 }),
  ] as Clip,
  /** Down on the legs before a jump. */
  crouch: [F(CROUCH), F({ ...CROUCH, torso: -30, ll1: -55, ll2: 105, rl1: -70, rl2: 110 })] as Clip,
  /** In the air over a gap: off the ground, the middle of it, coming down. */
  air: [
    F({ torso: -8, la1: -95, la2: -30, ra1: -110, ra2: -20, ll1: 40, ll2: 35, rl1: -75, rl2: 15 }),
    F({ torso: -6, la1: -70, la2: -40, ra1: -90, ra2: -30, ll1: 15, ll2: 50, rl1: -55, rl2: 35 }),
    F({ torso: -4, la1: -50, la2: -40, ra1: -70, ra2: -30, ll1: -10, ll2: 40, rl1: -45, rl2: 50 }),
  ] as Clip,
  /** Reaching up for a ledge. */
  reach: [F({ la1: 148, la2: 14, ra1: -148, ra2: -14, ll1: -10, ll2: 40, rl1: -30, rl2: 50 })] as Clip,
  /** Falling into the abyss, flailing. */
  tumble: [
    F({ la1: 160, la2: 20, ra1: -120, ra2: -30, ll1: 30, ll2: 30, rl1: -30, rl2: 50 }),
    F({ la1: 120, la2: -20, ra1: -160, ra2: -10, ll1: -30, ll2: 40, rl1: 40, rl2: 20 }),
  ] as Clip,
  /** Stepping off a ledge. */
  fall: [F({ la1: 120, la2: 20, ra1: -120, ra2: -20, ll1: 20, ll2: 20, rl1: -20, rl2: 20 })] as Clip,
  /** The long landing: down, then up again. */
  land: [
    F(CROUCH),
    F({ torso: -10, la1: -20, la2: -30, ra1: -25, ra2: -30, ll1: -20, ll2: 40, rl1: -30, rl2: 50 }),
    F({}),
  ] as Clip,
  /** From hanging on a ledge to standing on it: the way out from behind a tile (and, run backwards, the way back). */
  pull: [
    F({ la1: 150, la2: 12, ra1: -150, ra2: -12, ll1: 6, ll2: 8, rl1: -6, rl2: 8 }, HANG),
    F({ la1: 160, la2: -60, ra1: -160, ra2: 60, ll1: 5, ll2: 10, rl1: -50, rl2: 80 }, 0.66),
    F({ torso: -5, la1: 130, la2: -90, ra1: -130, ra2: 90, ll1: 5, ll2: 0, rl1: -70, rl2: 75 }, 0.46),
    F({ la1: 60, la2: -30, ra1: -60, ra2: 30, ll1: 8, ll2: 0, rl1: -80, rl2: 40 }, 0.24),
    F({ torso: -10, la1: 20, la2: -10, ra1: -20, ra2: 10, ll1: -10, ll2: 30, rl1: -30, rl2: 50 }, 0.08),
    F({}),
  ] as Clip,
};

/**
 * Where the figure can stand: a tile's top edge, `a` to `b` across and `fixed` down. `tilt` (the slope of the edge, as a
 * tangent) and `lift` (px, up is negative) follow a tile that is tilted or raised by the pointer, and are kept up to date
 * by the component. A `cliff` is a spot at the end of the tiles, off which the figure can fall: -1 to the left, 1 to the right.
 */
export interface Spot { a: number; b: number; fixed: number; tilt?: number; lift?: number; cliff?: -1 | 1 }

/** What to draw: where the feet are, which way it faces, the pose, and whether it is behind the tiles. */
export interface View { visible: boolean; x: number; y: number; facing: 1 | -1; pose: Pose; behind: boolean; spin: number }

type Mode = 'hidden' | 'rise' | 'idle' | 'move' | 'crouch' | 'air' | 'pull' | 'land' | 'sink' | 'fall';
type Kind = 'level' | 'up' | 'down';
interface Leap { to: number; x0: number; y0: number; x1: number; y1: number; dur: number; kind: Kind; u: number }

/** The space between two spots across (0 where they overlap, as one tile above another does). */
const gap = (a: Spot, b: Spot): number => Math.max(a.a - b.b, b.a - a.b, 0);

/** Where the ground is at `x` on a spot, the tile being tilted or raised as it is. */
const ground = (s: Spot, x: number): number => s.fixed + (s.lift ?? 0) + (s.tilt ?? 0) * (x - (s.a + s.b) / 2);

export class Buddy {
  private mode: Mode = 'hidden';
  private spots: readonly Spot[] = [];
  private cur = -1; // the spot it is on
  private want = -1; // the spot the pointer is on
  private wantPos = 0; // where along it
  private pos = 0; // where along the current spot (x in a row, y on a wall)
  private goal = 0;
  private face: 1 | -1 = 1;
  private clip: Clip = CLIPS.stand;
  private loop = true;
  private reverse = false;
  private t = 0;
  private quiet = 0; // ms since the pointer last moved
  private dwell = 0;
  private jumping = false; // running to the edge to jump
  private plunge: 0 | 1 | -1 = 0; // the pointer has left past a cliff: which one
  private leaving = false; // running off the edge of a cliff
  private died: 0 | 1 | -1 = 0; // which side it fell off, once it has gone
  private from = { x: 0, y: 0 }; // where the fall began
  private leap: Leap | null = null;

  /** The spots, measured by the component. */
  setSpots(spots: readonly Spot[]): void {
    this.spots = spots;
  }

  /** The pointer is on `spot`, `pos` along it. */
  pointer(spot: number, pos: number): void {
    this.quiet = 0;
    this.plunge = 0;
    this.leaving = false;
    this.want = spot;
    this.wantPos = pos;
    if (spot === this.cur) this.goal = this.clampTo(spot, pos);
  }

  /** The pointer has left past the end of the tiles, to the left (-1) or right (1): a figure that is out goes off the nearest cliff on that side. */
  pointerOff(side: 1 | -1): void {
    if (this.mode === 'hidden' || this.mode === 'sink' || this.mode === 'fall') return;
    const here = this.spots[this.cur]!.fixed;
    let to = -1;
    this.spots.forEach((s, i) => {
      if (s.cliff === side && (to < 0 || Math.abs(s.fixed - here) < Math.abs(this.spots[to]!.fixed - here))) to = i;
    });
    if (to < 0) return;
    this.quiet = 0;
    this.want = to;
    this.wantPos = side > 0 ? this.spots[to]!.b : this.spots[to]!.a;
    this.plunge = side;
  }

  /** Once after the figure has fallen out of sight: the side it fell off, -1 (left) or 1 (right); otherwise 0. */
  takeDeath(): 0 | 1 | -1 {
    const d = this.died;
    this.died = 0;
    return d;
  }

  tick(dt: number): void {
    this.t += dt;
    this.quiet += dt;
    switch (this.mode) {
      case 'hidden': this.whenHidden(dt); break;
      case 'idle': this.whenIdle(); break;
      case 'move': this.whenMoving(dt); break;
      case 'crouch': if (this.done()) this.takeOff(); break;
      case 'air': this.whenAir(dt); break;
      case 'sink': if (this.done()) this.vanish(); break;
      case 'fall': if (this.t >= FALL_MS) this.die(); break;
      default: if (this.done()) this.settle(); // rise, pull, land
    }
  }

  view(): View {
    const hidden: View = { visible: false, x: 0, y: 0, facing: 1, pose: CLIPS.stand[0]!.pose, behind: false, spin: 0 };
    if (this.mode === 'hidden') return hidden;
    if (this.mode === 'air') {
      const l = this.leap!;
      const clip = l.kind === 'up' ? CLIPS.reach : l.kind === 'down' ? CLIPS.fall : CLIPS.air;
      const at = l.u * (clip.length - 1);
      const i = Math.floor(at);
      const f = mix(clip[i]!, clip[Math.min(i + 1, clip.length - 1)]!, at - i);
      return { visible: true, ...this.airPoint(l), facing: this.face, pose: f.pose, behind: false, spin: 0 };
    }
    const f = this.frame();
    if (this.mode === 'fall') {
      const s = this.t / 1000;
      const x = this.from.x + this.face * 60 * s;
      return { visible: true, x, y: this.from.y + 0.5 * GRAVITY * s * s, facing: this.face, pose: f.pose, behind: false, spin: this.face * 600 * s };
    }
    const behind = (this.mode === 'rise' || this.mode === 'sink') && f.off > 0.12;
    return { visible: true, x: this.pos, y: ground(this.spots[this.cur]!, this.pos) + f.off * HIDE, facing: this.face, pose: f.pose, behind, spin: 0 };
  }

  private play(clip: Clip, loop: boolean, reverse = false): void {
    this.clip = clip;
    this.loop = loop;
    this.reverse = reverse;
    this.t = 0;
  }

  /** The pose now: moving smoothly from one key pose of the clip to the next. */
  private frame(): Frame {
    const n = this.clip.length;
    const at = this.t / FRAME_MS;
    const i = Math.floor(at);
    const key = (j: number): Frame => this.clip[this.reverse ? n - 1 - this.index(j) : this.index(j)]!;
    return mix(key(i), key(i + 1), at - i);
  }

  private index(j: number): number {
    return this.loop ? j % this.clip.length : Math.min(j, this.clip.length - 1);
  }

  private done(): boolean {
    return this.t >= this.clip.length * FRAME_MS;
  }

  private clampTo(spot: number, pos: number): number {
    const s = this.spots[spot]!;
    return Math.min(Math.max(pos, s.a + 8), s.b - 8);
  }

  private whenHidden(dt: number): void {
    if (this.want < 0 || this.quiet >= TOLERANCE) {
      this.dwell = 0;
      return;
    }
    this.dwell += dt;
    if (this.dwell >= DWELL) this.rise();
  }

  private rise(): void {
    this.cur = this.want;
    this.pos = this.goal = this.clampTo(this.cur, this.wantPos);
    this.face = 1;
    this.mode = 'rise';
    this.play(CLIPS.pull, false);
  }

  private whenIdle(): void {
    if (this.quiet >= TOLERANCE && this.plunge === 0) {
      this.sink();
    } else if (this.want !== this.cur) {
      this.depart();
    } else if (this.plunge !== 0) {
      if (this.quiet >= OFF_WAIT) this.runOff();
    } else if (Math.abs(this.goal - this.pos) > 5) {
      this.mode = 'move';
      this.play(CLIPS.run, true);
    }
  }

  /** Off the end of the tiles: a few steps beyond the edge. */
  private runOff(): void {
    const s = this.spots[this.cur]!;
    this.goal = this.plunge > 0 ? s.b + 8 : s.a - 8;
    this.leaving = true;
    this.mode = 'move';
    this.play(CLIPS.run, true);
  }

  private sink(): void {
    this.mode = 'sink';
    this.play(CLIPS.pull, false, true);
  }

  private vanish(): void {
    this.mode = 'hidden';
    this.cur = -1;
    this.dwell = 0;
  }

  /** The pointer is on another tile: run to the edge to jump, or, if it is too far or too high, go behind this one and come out of the other. */
  private depart(): void {
    const from = this.spots[this.cur]!;
    const to = this.spots[this.want]!;
    const rise = from.fixed - to.fixed; // positive: the other edge is higher
    if (gap(from, to) > MAX_GAP || rise > MAX_UP || rise < -MAX_DOWN) {
      this.sink();
      return;
    }
    // across to a tile beside it, or, from one above or below, off the edge the pointer is on the side of
    this.face = gap(from, to) === 0 ? (this.wantPos >= this.pos ? 1 : -1) : to.a + to.b > from.a + from.b ? 1 : -1;
    this.goal = this.face > 0 ? from.b - 6 : from.a + 6;
    this.jumping = true;
    this.mode = 'move';
    this.play(CLIPS.run, true);
  }

  private whenMoving(dt: number): void {
    const step = (SPEED * dt) / 1000;
    const d = this.goal - this.pos;
    if (Math.abs(d) > step) {
      this.pos += Math.sign(d) * step;
      this.face = d > 0 ? 1 : -1;
      return;
    }
    this.pos = this.goal;
    if (this.leaving) {
      this.fall();
      return;
    }
    if (this.jumping && this.want !== this.cur) {
      this.mode = 'crouch';
      this.play(CLIPS.crouch, false);
    } else {
      this.mode = 'idle';
      this.play(CLIPS.stand, true);
    }
    this.jumping = false;
  }

  private takeOff(): void {
    const from = this.spots[this.cur]!;
    const to = this.spots[this.want]!;
    const rise = to.fixed - from.fixed;
    const kind: Kind = rise < -14 ? 'up' : rise > 14 ? 'down' : 'level';
    const x1 = gap(from, to) === 0 ? Math.min(Math.max(this.pos, to.a + 10), to.b - 10) : this.face > 0 ? to.a + 10 : to.b - 10;
    const y1 = ground(to, x1) + (kind === 'up' ? HANG * HIDE : 0);
    const y0 = ground(from, this.pos);
    const dur = 320 + Math.abs(x1 - this.pos) * 1.2 + Math.abs(y1 - y0) * 0.6;
    this.leap = { to: this.want, x0: this.pos, y0, x1, y1, dur, kind, u: 0 };
    this.mode = 'air';
  }

  private airPoint(l: Leap): { x: number; y: number } {
    const arc = l.kind === 'up' ? 18 : l.kind === 'down' ? 8 : 14 + Math.abs(l.x1 - l.x0) * 0.15;
    return { x: l.x0 + (l.x1 - l.x0) * l.u, y: l.y0 + (l.y1 - l.y0) * l.u - arc * 4 * l.u * (1 - l.u) };
  }

  private whenAir(dt: number): void {
    const l = this.leap!;
    l.u = Math.min(1, l.u + dt / l.dur);
    if (l.u < 1) return;
    this.cur = l.to;
    this.pos = l.x1;
    this.goal = this.want === this.cur ? this.clampTo(this.cur, this.wantPos) : this.pos;
    this.leap = null;
    if (l.kind === 'up') {
      this.mode = 'pull';
      this.play(CLIPS.pull, false);
    } else {
      this.mode = 'land';
      this.play(CLIPS.land, false);
    }
  }

  private fall(): void {
    this.from = { x: this.pos, y: ground(this.spots[this.cur]!, this.pos) };
    this.leaving = false;
    this.plunge = 0;
    this.mode = 'fall';
    this.play(CLIPS.tumble, true);
  }

  private die(): void {
    this.died = this.face;
    this.mode = 'hidden';
    this.cur = this.want = -1;
    this.dwell = 0;
  }

  private settle(): void {
    this.mode = 'idle';
    this.play(CLIPS.stand, true);
  }
}
