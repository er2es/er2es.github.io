/**
 * The little figure that follows the mouse over a set of tiles (the soft skills in a row, the hobbies in two columns).
 * Its movement is in the manner of Prince of Persia: weighty and deliberate, a crouch before a jump, a jump with the legs
 * stretched, a ledge that it grabs, hangs from and pulls itself up on, and a long crouching landing. This file is only the
 * movement, in pixels and milliseconds, with no DOM: the component feeds it the pointer and the tiles' geometry and draws
 * what `view()` says.
 *
 * The figure stands on the tiles' top edges and runs along them after the pointer. To get to another tile it runs to the
 * edge and jumps: across a gap, down to a lower edge, or up to a higher one, which it grabs and pulls itself up on. When
 * the other tile is too far or too high to jump to, it goes behind its own tile and comes out from behind the other one.
 * A tile with one tile between it always leaps over that one, with two between now and then (otherwise it goes round
 * behind), and every jump arcs well above whatever it passes over; whether it runs up or jumps from where it stands, where
 * it takes off and how high it goes vary by chance, so that it does not look scripted.
 * It comes out from behind a tile by pulling itself up onto the ledge, and when the pointer has been still or gone for
 * a while it goes back the same way. Where the pointer leaves past the end of the tiles, at a cliff, it runs off the edge and
 * falls: the component then lays its body at the foot of the page (`takeDeath()`). Now and then it saves itself on the way
 * down: it shoots a web line at the corner it fell from, swings on it and lands back on the tile.
 *
 * The body is simulated, not only played back. The hip is a point that moves under one gravity; a foot on the ground stays
 * where it was put (the legs are solved by two-bone inverse kinematics from the hip to the planted feet, on the drawing's
 * own bone lengths), so nothing slides; a run is driven by the distance covered, a stance phase per step and a short
 * ballistic flight between steps; jumps are planned ballistically (take-off speed from the apex and the distance), the take-off
 * accelerates the hip out of a crouch until the legs are straight, a landing brakes it in the legs, and the hands of a figure
 * on a ledge stay on the ledge. Key poses (twelve a second, as the clips of the drawing) give the arms and the torso.
 */

export const FRAME_MS = 1000 / 12;
/** The figure's size: a viewBox unit of its drawing is this many px. */
export const SCALE = 1.25;
/** How far, in px, the figure sinks behind a tile to be out of sight. */
export const HIDE = 46 * SCALE;
/** How long the pointer may be still or away before the figure leaves. */
export const TOLERANCE = 1600;
/** How often a fall off a cliff ends with the web line instead of out of sight. */
export const RESCUE = 0.25;
/** How long the pointer rests on a tile before the figure comes out. */
const DWELL = 140;
const SPEED = 180; // top running speed, px/s: about three body heights a second
const ACCEL = 900; // px/s², getting into a run: top speed after a fifth of a second, in two or three short steps
const BRAKE = 1100; // px/s², slowing down for a stop on the planted foot
/** The farthest it will jump: a gap, a rise to a higher edge, a drop to a lower one (px). */
const MAX_GAP = 60; // to the tile beside it
const MAX_LEAP = 560; // over one or two tiles in between
const LEAP = 0.5; // how often it leaps over two tiles rather than going round behind them
const CLEAR = 25; // px between the feet and the tops it jumps over
const STAND_JUMP = 50; // px from the edge, near enough to jump from where it stands
const WEB_UP = 320; // px, the highest tile it climbs to on the web line
const CLIMB = 220; // px/s, the line pulled in as it climbs
const MAX_UP = 90;
const MAX_DOWN = 170;
const REACH_UP = 40; // a higher edge more than this above the feet is grabbed with the hands; a lower one is hopped on to
/** One gravity for everything, px/s². Real gravity on a figure this size (1.8 m to 57 px) is about 310; this is four times
 * that, as old games did, so that a jump up to a ledge takes a third of a second and not half a second more. */
const GRAVITY = 1200;
const FALL_MS = 1100; // how long the fall is, out of sight at the end of it
const OFF_WAIT = 450; // how long the pointer is away before the figure goes over a cliff
const SPIN = 520; // °/s once it has tipped over the edge
const TIP = 0.18; // s it takes to tip over the edge, the spin growing
const ABSORB = 9000; // px/s², how hard the legs brake a landing
const SKID = 60; // px/s: faster than this across, a landing carries on into a step
const LAND_HOLD = 90; // ms down in the landing crouch
const LAND_RISE = 330; // ms to stand up out of it
const STOP_MS = 2 * FRAME_MS; // the last step of a stop, the trailing foot brought up
const BREATH_MS = 2600;
const AIR_IN = 110; // ms from the take-off pose to the pose in the air
const HANG_MS = 420; // hanging from a ledge before the pull-up
const HANG_DAMP = 4.5; // 1/s, the sway dying out
const SETTLE = 50; // ms, the arms straightening under the weight after the grab
const PULL_MS = 950; // the pull-up, slow at the start
const OH_NO = 180; // ms of the fall before it decides to shoot the web
const SHOT_MS = 140; // the line flying out
const REEL = 260; // px/s, the line pulled in while it swings
const WEB_MIN = 34; // px, the shortest the line is reeled to

// The drawing, in viewBox units: the hip is the root, the thigh and the shin are 7 long, the shoulder is 10.5 above the hip,
// the upper arm 5.5 and the forearm 5. The point drawn at (x, y) is 14 below the hip: the feet of straight legs.
const THIGH = 7;
const LEG = 14;
const BACK = 10.5;
const UPPER = 5.5;
const FORE = 5;
const ARM = UPPER + FORE;
/** The figure's centre of mass in the drawing, above the feet point (units): the component turns it about this point. */
const COM = 17;

const KEYS = ['torso', 'la1', 'la2', 'ra1', 'ra2', 'll1', 'll2', 'rl1', 'rl2'] as const;
/** The joint angles, in degrees, the figure facing right. A limb at 0 hangs straight down and a negative angle swings it
 * forward; the torso at 0 is upright and a positive angle leans it forward. Arms are measured against the torso. */
export interface Pose {
  torso: number; la1: number; la2: number; ra1: number; ra2: number; ll1: number; ll2: number; rl1: number; rl2: number;
}
/** One key pose of a clip and how far below its ledge the figure is then (a share of HIDE; 0 for the clips here). */
export interface Frame { pose: Pose; off: number }
export type Clip = readonly Frame[];

type V = { x: number; y: number };
const rad = (d: number): number => (d * Math.PI) / 180;
const deg = (r: number): number => (r * 180) / Math.PI;
const lerp = (a: number, b: number, k: number): number => a + (b - a) * k;
const clamp01 = (k: number): number => Math.min(1, Math.max(0, k));
/** Eased from 0 to 1, at rest at both ends. */
const smooth = (k: number): number => {
  const c = clamp01(k);
  return c * c * (3 - 2 * c);
};
/** A cubic from `p0` to `p1` with the slopes `m0` and `m1` (per unit of `u`). */
const hermite = (p0: number, p1: number, m0: number, m1: number, u: number): number => {
  const u2 = u * u;
  const u3 = u2 * u;
  return (2 * u3 - 3 * u2 + 1) * p0 + (u3 - 2 * u2 + u) * m0 + (3 * u2 - 2 * u3) * p1 + (u3 - u2) * m1;
};
/** A smooth curve through `vals` at the times `ts` (0 to 1), at rest at the ends (Catmull-Rom slopes inside). */
const curve = (vals: readonly number[], ts: readonly number[], p: number): number => {
  let i = 0;
  while (i < ts.length - 2 && p > ts[i + 1]!) i++;
  const h = ts[i + 1]! - ts[i]!;
  const slope = (j: number): number =>
    j === 0 || j === vals.length - 1 ? 0 : ((vals[j + 1]! - vals[j - 1]!) / (ts[j + 1]! - ts[j - 1]!)) * h;
  return hermite(vals[i]!, vals[i + 1]!, slope(i), slope(i + 1), clamp01((p - ts[i]!) / h));
};
/** A bone at angle `a`, `len` long. */
const limb = (a: number, len: number): V => ({ x: -Math.sin(rad(a)) * len, y: Math.cos(rad(a)) * len });
const add = (a: V, b: V): V => ({ x: a.x + b.x, y: a.y + b.y });
const sub = (a: V, b: V): V => ({ x: a.x - b.x, y: a.y - b.y });
const acos = (c: number): number => deg(Math.acos(Math.min(1, Math.max(-1, c))));
/** An angle moved by whole turns to lie within half a turn of `ref`. */
const near = (a: number, ref: number): number => a - 360 * Math.round((a - ref) / 360);

/**
 * Two bones `l1` and `l2` from a root to an end at `t` (relative to the root): the first bone's angle and the bend of the
 * second against it. `side` 1 bends the middle joint forward (a knee), -1 the other way (an elbow); `ref` is the angle the
 * limb's direction is kept near, so that it never jumps a whole turn.
 */
const solve = (t: V, l1: number, l2: number, side: 1 | -1, ref: number): [number, number] => {
  const d = Math.min(Math.max(Math.hypot(t.x, t.y), Math.abs(l1 - l2) + 0.01), l1 + l2 - 1e-6);
  const root = acos((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d));
  const mid = acos((l1 * l1 + l2 * l2 - d * d) / (2 * l1 * l2));
  return [near(deg(Math.atan2(-t.x, t.y)), ref) - side * root, side * (180 - mid)];
};
/** The legs that put the feet at `l` and `r` (relative to the hip). */
const legs = (l: V, r: V): Pick<Pose, 'll1' | 'll2' | 'rl1' | 'rl2'> => {
  const [ll1, ll2] = solve(l, THIGH, LEG - THIGH, 1, 0);
  const [rl1, rl2] = solve(r, THIGH, LEG - THIGH, 1, 0);
  return { ll1, ll2, rl1, rl2 };
};
const shoulder = (torso: number): V => limb(torso + 180, BACK);
/** One arm reaching for `h` (relative to the hip), for a torso at `torso`: its two angles against the torso. */
const arm = (torso: number, h: V): [number, number] => {
  const [a, b] = solve(sub(h, shoulder(torso)), UPPER, FORE, -1, -70);
  return [a - torso, b];
};
/** Both hands on `h`. */
const grip = (torso: number, h: V): Pick<Pose, 'torso' | 'la1' | 'la2' | 'ra1' | 'ra2'> => {
  const [la1, la2] = arm(torso, h);
  return { torso, la1, la2, ra1: la1, ra2: la2 };
};
/** Where the feet are, relative to the hip. */
export const feetOf = (p: Pose): [V, V] => [
  add(limb(p.ll1, THIGH), limb(p.ll1 + p.ll2, LEG - THIGH)),
  add(limb(p.rl1, THIGH), limb(p.rl1 + p.rl2, LEG - THIGH)),
];
/** Where the hands are, relative to the hip. */
export const handsOf = (p: Pose): [V, V] => {
  const s = shoulder(p.torso);
  const hand = (a: number, b: number): V => add(s, add(limb(p.torso + a, UPPER), limb(p.torso + a + b, FORE)));
  return [hand(p.la1, p.la2), hand(p.ra1, p.ra2)];
};

const P = (p: Partial<Pose>): Pose => ({ torso: 0, la1: 10, la2: -5, ra1: -10, ra2: 5, ll1: 4, ll2: 0, rl1: -4, rl2: 0, ...p });
const F = (p: Pose): Frame => ({ pose: p, off: 0 });
const mix = (a: Pose, b: Pose, k: number): Pose => {
  const out = { ...a };
  for (const j of KEYS) out[j] = a[j] + (b[j] - a[j]) * k;
  return out;
};
/** The upper body of `up` on the legs of `low`. */
const top = (up: Pose, low: Pose): Pose => ({ ...up, ll1: low.ll1, ll2: low.ll2, rl1: low.rl1, rl2: low.rl2 });

/** Standing, the feet this far either side of the hip and the hip this high above them (units). */
const SPLAY = LEG * Math.sin(rad(4));
const STAND_H = LEG * Math.cos(rad(4));
/** Hanging from a ledge by straight arms: the hip this far below the hands (units). */
const HANG_L = BACK + ARM;
/** The hands of the reach for a ledge, along the line of the torso, leaning 4° into it, with the elbows a little bent. */
const REACH_HAND = limb(184, BACK + 8.8);
const REACH = P({ ...grip(4, REACH_HAND), ...legs({ x: -0.8, y: 13.2 }, { x: 0.8, y: 12.6 }) });
/** In the air over a gap, rising: the leading knee up, the trailing leg stretched back, as in a running jump. */
const AIR_RISE = P({ torso: 10, la1: -110, la2: -30, ra1: 30, ra2: -40, ...legs({ x: -7, y: 10.5 }, { x: 4.5, y: 8.5 }) });
/** The feet held ready for the landing this high below the hip, `ahead` of it. */
const READY_H = 12.2;
const ready = (ahead: number): Pose =>
  P({ torso: 6, la1: -60, la2: -30, ra1: -100, ra2: -20, ...legs({ x: ahead - SPLAY, y: READY_H }, { x: ahead + SPLAY, y: READY_H }) });
/** Dangling from the hands: the legs follow the body's line, a little behind it. */
const dangle = (torso: number): [V, V] => {
  const d = limb(torso * 0.6, 13.4);
  return [add(d, { x: -0.6, y: 0 }), add(d, { x: 0.6, y: 0 })];
};

export const CLIPS = {
  /** Standing and breathing, slowly between the two. */
  stand: [F(P({})), F(P({ la1: 12, la2: -7, ra1: -12, ra2: 7 }))] as Clip,
  /** Down on the legs before a jump, the arms swung back; the legs bend to wherever the feet are. */
  crouch: [F(P({ torso: 24, la1: 45, la2: -30, ra1: 35, ra2: -35 }))] as Clip,
  /** Leaving the ground: the arms swung forward and up, across or up. */
  lift: [F(P({ torso: 8, la1: -120, la2: -25, ra1: -95, ra2: -30 })), F(P({ torso: 4, la1: -150, la2: -20, ra1: -140, ra2: -25 }))] as Clip,
  /** In the air over a gap: rising, then the feet held ready for the landing. */
  air: [F(AIR_RISE), F(ready(3))] as Clip,
  /** Reaching up for a ledge, the hands at the top of the jump. */
  reach: [F(REACH)] as Clip,
  /** Down in a landing, the arms forward for balance. */
  land: [F(P({ torso: 22, la1: -40, la2: -40, ra1: -55, ra2: -35 }))] as Clip,
  /** Letting go of a ledge on the way up, the hands on the knee. */
  push: [F(P({ torso: 20, la1: -15, la2: -40, ra1: -25, ra2: -40 }))] as Clip,
  /** Falling into the abyss, flailing. */
  tumble: [
    F(P({ la1: 160, la2: 20, ra1: -120, ra2: -30, ll1: 30, ll2: 30, rl1: -30, rl2: 50 })),
    F(P({ la1: 120, la2: -20, ra1: -160, ra2: -10, ll1: -30, ll2: 40, rl1: 40, rl2: 20 })),
  ] as Clip,
};
const STAND = CLIPS.stand[0]!.pose;

// The pull-up from hanging to standing, relative to the hands on the ledge (units, facing right, y down): a slow heavy pull
// to the chin, the chest over the edge with the arms pushing down, a knee on the ledge, and up on to that foot.
const PULL_TS = [0, 0.38, 0.52, 0.66, 0.8, 1];
const PULL_X = [0, -1.5, -2.3, -0.5, 1.0, 2.5 - SPLAY];
const PULL_Y = [HANG_L, 12.8, 7.0, 2.5, -1.5, -STAND_H];
const PULL_TORSO = [0, -4, 8, 40, 25, 0];
/** Where the feet go on the ledge: the leading foot first, then the other beside it. */
const KNEE_AT = { x: 2.5, y: 0 };
const LAST_AT = { x: 2.5 - 2 * SPLAY, y: 0 };
/** The hip at the end of the pull-up, from the hands. */
const PULL_END = PULL_X[5]!;

/**
 * Where the figure can stand: a tile's top edge, `a` to `b` across and `fixed` down. `tilt` (the slope of the edge, as a
 * tangent) and `lift` (px, up is negative) follow a tile that is tilted or raised by the pointer, and are kept up to date
 * by the component. A `cliff` is a spot at the end of the tiles, off which the figure can fall: -1 to the left, 1 to the right.
 */
export interface Spot { a: number; b: number; fixed: number; tilt?: number; lift?: number; cliff?: -1 | 1 }

/**
 * What to draw: where the feet point of the drawing is (14 units below the hip), which way it faces, the pose, whether
 * it is behind the tiles, how far it is turned about its centre of mass (degrees), and the web line, if it is on one:
 * from the hand at (hx, hy) to (x, y).
 */
export interface View {
  visible: boolean; x: number; y: number; facing: 1 | -1; pose: Pose; behind: boolean; spin: number;
  web: { x: number; y: number; hx: number; hy: number } | null;
}

type Mode = 'hidden' | 'rise' | 'idle' | 'move' | 'stop' | 'crouch' | 'air' | 'hang' | 'pull' | 'land' | 'sink' | 'fall' | 'web' | 'climb';
type Kind = 'level' | 'up' | 'down';
/** A step of the run: where the stance foot came down (relative x), the hip's height then, how far back the foot pushes off,
 * the hip's height at the push, how much it dips between, and where the swinging foot was. */
interface Step { x: number; h: number; b: number; hs: number; dip: number; sw: V }
/** A jump: the crouch under it (relative to the feet, units), the push direction and length, the take-off velocity (px/s). */
interface Plan { kind: Kind; to: number; base: number; h0: V; c: V; d: V; len: number; vel: V; time: number; load: number }

/** The space between two spots across (0 where they overlap, as one tile above another does). */
const gap = (a: Spot, b: Spot): number => Math.max(a.a - b.b, b.a - a.b, 0);

/** Where the ground is at `x` on a spot, the tile being tilted or raised as it is. */
const ground = (s: Spot, x: number): number => s.fixed + (s.lift ?? 0) + (s.tilt ?? 0) * (x - (s.a + s.b) / 2);

/** How far forward and back of the hip the feet reach in a run at `k` of top speed (units). */
const reachAt = (k: number): number => 2.5 + 3 * k;

export class Buddy {
  private mode: Mode = 'hidden';
  private spots: readonly Spot[] = [];
  private cur = -1; // the spot it is on
  private want = -1; // the spot the pointer is on
  private wantPos = 0; // where along it
  private goal = 0;
  private face: 1 | -1 = 1;
  private t = 0; // ms in the current mode
  private quiet = 0; // ms since the pointer last moved
  private dwell = 0;
  private jumping = false; // running to the edge to jump
  private plunge: 0 | 1 | -1 = 0; // the pointer has left past a cliff: which one
  private leaving = false; // running off the edge of a cliff
  private died: 0 | 1 | -1 = 0; // which side it fell off, once it has gone
  private readonly random: () => number;

  private hip: V = { x: 0, y: 0 }; // px
  private vel: V = { x: 0, y: 0 }; // px/s, as it moved over the last tick
  private feet: [number, number] = [0, 0]; // where the feet are planted, across (px)
  private pose: Pose = STAND;
  private behind = false;
  private spin = 0;
  private web: View['web'] = null;

  // the run
  private v = 0; // speed along the edge
  private lean = 0;
  private st: 0 | 1 = 0; // the foot on the ground
  private step: Step = { x: 0, h: STAND_H, b: 0, hs: STAND_H, dip: 0, sw: { x: 0, y: 0 } };
  private flight = -1; // ms into the flight between two steps, or -1
  private fT = 0;
  private fy = 0;
  private fvy = 0;
  private lead: V = { x: 0, y: 0 };
  private trail: V = { x: 0, y: 0 };

  // the moves that start from somewhere: the pose, the hip and its velocity then
  private was: Pose = STAND;
  private start: V = { x: 0, y: 0 };
  private sv: V = { x: 0, y: 0 };
  private plan: Plan | null = null;
  private anchor: V = { x: 0, y: 0 }; // the hands on a ledge, or the web's end
  private at0: V = { x: 0, y: HANG_L }; // where the pull-up starts, from the hands
  private torso0 = 0;
  private phi = 0; // a pendulum's angle (rad, positive towards the way it faces) and its speed
  private omega = 0;
  private len = 0; // px
  private stretch = 0; // px/s, the web line giving under the jerk of going taut
  private along = 0; // px/s, how fast the line is getting longer (negative while it is reeled in)
  private land0 = { xf: 0, tx: 0, tv: 0, t1: 0, h0: 0, hl: 0, step: false, to: 0, ref: 0 };
  private spun = 0;
  private rolled = false;
  private inside = false; // the pointer is over the tiles
  private via = -1; // the tile it is jumping or climbing to: the pointer's, or one on the way to it

  /** `random` decides whether a fall ends with the web line (below RESCUE) or out of sight. */
  constructor(random: () => number = Math.random) {
    this.random = random;
  }

  /** The (mouse) pointer is over the tiles, or has left them: while it is over them the figure never goes out of sight. */
  setInside(inside: boolean): void {
    this.inside = inside;
    this.quiet = 0;
  }

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
    if (this.mode === 'hidden' || this.mode === 'sink' || this.mode === 'fall' || this.mode === 'web') return;
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
    if (!this.inside) this.quiet += dt; // the pointer resting over the tiles is not the pointer gone
    const before = { ...this.hip };
    switch (this.mode) {
      case 'hidden': this.whenHidden(dt); break;
      case 'idle': this.whenIdle(); break;
      case 'move': this.whenMoving(dt); break;
      case 'stop': this.whenStopping(); break;
      case 'crouch': this.whenCrouching(); break;
      case 'air': this.whenAir(); break;
      case 'hang': this.whenHanging(dt); break;
      case 'land': this.whenLanding(); break;
      case 'fall': this.whenFalling(); break;
      case 'web': this.whenWeb(dt); break;
      case 'climb': this.whenWebClimb(dt); break;
      default: this.whenClimbing(); // rise, pull, sink
    }
    if (dt > 0) this.vel = { x: ((this.hip.x - before.x) * 1000) / dt, y: ((this.hip.y - before.y) * 1000) / dt };
  }

  view(): View {
    if (this.mode === 'hidden') return { visible: false, x: 0, y: 0, facing: 1, pose: STAND, behind: false, spin: 0, web: null };
    return {
      visible: true, x: this.hip.x, y: this.hip.y + LEG * SCALE, facing: this.face, pose: this.pose,
      behind: this.behind, spin: this.spin, web: this.web,
    };
  }

  // ---- geometry

  private clampTo(spot: number, pos: number): number {
    const s = this.spots[spot]!;
    return Math.min(Math.max(pos, s.a + 8), s.b - 8);
  }

  private gy(x: number, spot = this.cur): number {
    return ground(this.spots[spot]!, x);
  }

  /** A world x, relative to the hip in units, the way it faces. */
  private rel(x: number): number {
    return ((x - this.hip.x) * this.face) / SCALE;
  }

  /** A planted foot, relative to the hip. */
  private foot(i: 0 | 1): V {
    return { x: this.rel(this.feet[i]), y: (this.gy(this.feet[i]) - this.hip.y) / SCALE };
  }

  /** The hip of a figure standing on its feet: as high as the lower foot lets it with that leg straight. */
  private standY(feet: readonly number[]): number {
    return Math.max(...feet.map((f) => this.gy(f) - Math.sqrt(Math.max(0, LEG * LEG - this.rel(f) ** 2)) * SCALE));
  }

  private onFeet(upper: Pose): void {
    this.pose = { ...upper, ...legs(this.foot(0), this.foot(1)) };
  }

  // ---- out of sight, coming out and going back

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
    this.goal = this.clampTo(this.cur, this.wantPos);
    this.face = 1;
    this.anchor = { x: this.goal - PULL_END * SCALE, y: 0 };
    this.at0 = { x: 0, y: HANG_L };
    this.torso0 = 0;
    this.enter('rise');
    this.whenClimbing();
  }

  private sink(): void {
    this.anchor = { x: this.hip.x - this.face * PULL_END * SCALE, y: 0 };
    this.at0 = { x: 0, y: HANG_L };
    this.torso0 = 0;
    this.enter('sink');
  }

  /** The pull-up, `p` of the way from hanging to standing (backwards when sinking), the hands on the ledge. */
  private whenClimbing(): void {
    const k = this.t / PULL_MS;
    const p = this.mode === 'sink' ? 1 - k : k;
    const a = { x: this.anchor.x, y: this.gy(this.anchor.x) };
    const h: V = { x: curve([this.at0.x, ...PULL_X.slice(1)], PULL_TS, p), y: curve([this.at0.y, ...PULL_Y.slice(1)], PULL_TS, p) };
    const torso = curve([this.torso0, ...PULL_TORSO.slice(1)], PULL_TS, p);
    this.hip = { x: a.x + this.face * h.x * SCALE, y: a.y + h.y * SCALE };
    // the hands hold the ledge until the chest is over it, then let go to push on the knee and come to the sides
    const held = grip(torso, { x: -h.x, y: -h.y });
    const free = mix(CLIPS.push[0]!.pose, STAND, smooth((p - 0.72) / 0.28));
    const upper = mix(P(held), { ...free, torso }, smooth((p - 0.6) / 0.12));
    // the leading foot comes up on to the ledge, then the other beside it
    const [dl, dr] = dangle(torso);
    const w1 = smooth((p - 0.5) / 0.24);
    const w2 = smooth((p - 0.8) / 0.17);
    const right = add({ x: lerp(h.x + dr.x, KNEE_AT.x, w1), y: lerp(h.y + dr.y, KNEE_AT.y, w1) }, { x: 1.5 * Math.sin(Math.PI * w1), y: 0 });
    const left = { x: lerp(h.x + dl.x, LAST_AT.x, w2), y: lerp(h.y + dl.y, LAST_AT.y, w2) };
    this.pose = { ...upper, ...legs(sub(left, h), sub(right, h)) };
    this.behind = this.mode !== 'pull' && left.y > 1 / SCALE;
    if (k < 1) return;
    if (this.mode === 'sink') {
      this.mode = 'hidden';
      this.cur = -1;
      this.dwell = 0;
      return;
    }
    this.feet = [this.hip.x - this.face * SPLAY * SCALE, this.hip.x + this.face * SPLAY * SCALE];
    this.settle();
  }

  /** Turning round where it stands: the drawing is mirrored, so the pose is mirrored with it and nothing moves. */
  private turn(face: 1 | -1): void {
    if (face === this.face) return;
    this.face = face;
    const p = { ...this.pose };
    for (const j of KEYS) p[j] = -p[j];
    this.onFeet(p);
  }

  /** Standing on the feet where they are, and on with whatever comes next. */
  private settle(): void {
    this.goal = this.want === this.cur ? this.clampTo(this.cur, this.wantPos) : this.hip.x;
    this.behind = false;
    this.enter('idle');
    this.whenIdle();
  }

  private enter(mode: Mode): void {
    this.mode = mode;
    this.t = 0;
    this.was = this.pose;
    this.start = { ...this.hip };
    this.sv = { ...this.vel };
  }

  // ---- standing

  private whenIdle(): void {
    const k = 0.5 - 0.5 * Math.cos((2 * Math.PI * this.t) / BREATH_MS);
    this.hip.y = this.standY(this.feet);
    this.onFeet(mix(STAND, CLIPS.stand[1]!.pose, k));
    if (this.quiet >= TOLERANCE && this.plunge === 0) {
      this.sink();
    } else if (this.want !== this.cur) {
      this.depart();
    } else if (this.plunge !== 0) {
      if (this.quiet >= OFF_WAIT) this.runOff();
    } else if (Math.abs(this.goal - this.hip.x) > 5) {
      this.run();
    }
  }

  /** Off the end of the tiles: a few steps beyond the edge. */
  private runOff(): void {
    const s = this.spots[this.cur]!;
    this.goal = this.plunge > 0 ? s.b + 8 : s.a - 8;
    this.leaving = true;
    this.run();
  }

  /** The pointer is on another tile: run to the edge to jump, or, if it is too far or too high, go behind this one and come out of the other. */
  private depart(): void {
    const from = this.spots[this.cur]!;
    const to = this.spots[this.want]!;
    const rise = from.fixed - to.fixed; // positive: the other edge is higher
    const gp = gap(from, to);
    const n = this.between(from, to).length;
    // the gap to the tile beside it; over one tile always, over two now and then; never farther, and no grabbing a
    // ledge at the end of a leap
    const reach = n === 0 ? gp <= MAX_GAP : gp <= MAX_LEAP && rise <= REACH_UP && (n === 1 || (n === 2 && this.random() < LEAP));
    if (reach && rise <= MAX_UP && rise >= -MAX_DOWN) {
      this.jumpTo(this.want);
    } else if (!this.inside) {
      this.sink(); // the pointer has gone: round behind the tiles
    } else {
      this.journey();
    }
  }

  /**
   * With the pointer over the tiles it never goes out of sight: to a tile it cannot jump to in one go it goes in stages,
   * each a jump, a leap over one or two tiles, a drop of any depth or a climb on the web line to a tile far above, to one of
   * the (up to three) tiles nearest the goal that it can reach, chosen by chance; after each it looks again, as the
   * pointer may have moved. With no way at all it goes round behind the tiles after all.
   */
  private journey(): void {
    const from = this.spots[this.cur]!;
    const centre = (s: Spot): V => ({ x: (s.a + s.b) / 2, y: s.fixed });
    const far = (s: Spot): number => Math.hypot(centre(s).x - centre(this.spots[this.want]!).x, centre(s).y - centre(this.spots[this.want]!).y);
    const ways = this.spots
      .map((s, i) => ({ s, i, web: this.canWeb(from, s) }))
      .filter(({ s, web }) => s !== from && far(s) < far(from) && (web || this.canLeap(from, s)))
      .sort((p, q) => far(p.s) - far(q.s));
    if (ways.length === 0) {
      this.sink();
      return;
    }
    const way = ways[Math.floor(this.random() * Math.min(3, ways.length))]!;
    if (way.web) this.webTo(way.i);
    else this.jumpTo(way.i);
  }

  /** A jump or leap from `from` to `to` on the way somewhere: over at most two tiles, up no higher than its feet can land, down any depth. */
  private canLeap(from: Spot, to: Spot): boolean {
    const n = this.between(from, to).length;
    return n <= 2 && gap(from, to) <= MAX_LEAP && from.fixed - to.fixed <= (n === 0 ? MAX_UP : REACH_UP);
  }

  /** A climb on the web line: to a tile beside or above it, higher than a jump can reach. */
  private canWeb(from: Spot, to: Spot): boolean {
    const rise = from.fixed - to.fixed;
    return rise > MAX_UP && rise <= WEB_UP && gap(from, to) <= MAX_GAP;
  }

  private jumpTo(i: number): void {
    this.via = i;
    const from = this.spots[this.cur]!;
    const to = this.spots[i]!;
    const gp = gap(from, to);
    // across to a tile beside it, or, from one above or below, off the edge the pointer is on the side of
    const side = gp === 0 ? (this.wantPos >= this.hip.x ? 1 : -1) : to.a + to.b > from.a + from.b ? 1 : -1;
    const edge = side > 0 ? from.b : from.a;
    // near the edge it may jump from where it stands; otherwise it runs up, taking off a little short of the edge
    if (Math.abs(edge - this.hip.x) < STAND_JUMP && this.random() < 0.5) {
      this.turn(side);
      this.crouch();
      return;
    }
    this.goal = edge - side * (6 + 12 * this.random());
    this.jumping = true;
    this.run();
  }

  /** The tiles wholly in the gap between two tiles side by side: what a jump from one to the other passes over. */
  private between(from: Spot, to: Spot): Spot[] {
    const [l, r] = from.a < to.a ? [from, to] : [to, from];
    return this.spots.filter((s) => s !== from && s !== to && s.a >= l.b - 1 && s.b <= r.a + 1);
  }

  // ---- the run

  /** Off from standing: the foot behind pushes first. */
  private run(): void {
    this.turn(this.goal >= this.hip.x ? 1 : -1);
    this.v = 0;
    this.lean = 0;
    this.flight = -1;
    this.st = this.rel(this.feet[0]) <= this.rel(this.feet[1]) ? 0 : 1;
    this.enter('move');
    this.newStep(this.foot(this.st === 0 ? 1 : 0));
  }

  /** A foot has come down: the step it starts, braking (no push, no flight) when the goal is near. */
  private newStep(sw: V): void {
    const k = this.v / SPEED;
    const b = reachAt(k);
    const stride = 2 * b * SCALE + (this.v * 2 * ((this.v / (2 * b)) * 1.4 * k * k * Math.PI)) / GRAVITY;
    const braking = !this.leaving && (this.goal - this.hip.x) * this.face < (this.v * this.v) / (2 * BRAKE) + stride;
    const here = this.foot(this.st);
    // the legs never quite straight in a run: a straight knee would have to snap
    const hs = Math.min(braking ? here.y : Math.sqrt(LEG * LEG - b * b) - 0.6 - k, Math.sqrt(LEG * LEG - b * b) - 0.3);
    this.step = { x: here.x, h: here.y, b: Math.max(b, 0.5 - here.x), hs, dip: braking ? 0 : 1.4 * k * k, sw };
  }

  private whenMoving(dt: number): void {
    const s = this.spots[this.cur]!;
    const left = (this.goal - this.hip.x) * this.face;
    const was = this.v;
    const st = this.st; // the foot that was down at the start of this tick, whatever comes down during it
    if (this.flight < 0) {
      const target = this.leaving ? SPEED : left > 0 ? Math.min(SPEED, Math.sqrt(2 * BRAKE * left)) : 0;
      this.v = Math.min(Math.max(target, this.v - (2 * BRAKE * dt) / 1000), this.v + (ACCEL * dt) / 1000);
    }
    const go = (this.v * dt) / 1000;
    const arrived = !this.leaving && this.flight < 0 && (this.v === 0 || (left > 0 && go >= left));
    this.hip.x += this.face * (arrived && left > 0 ? left : go);
    const k = this.v / SPEED;
    const a = Math.min(reachAt(k), Math.sqrt(LEG * LEG - this.step.hs ** 2) - 0.05);
    let lead: V;
    let trail: V;
    if (this.flight < 0) {
      // on one foot: it stays where it is; the hip dips over it and rises to push off
      const r = this.rel(this.feet[this.st]);
      const sg = clamp01((this.step.x - r) / (this.step.x + this.step.b));
      const h = lerp(this.step.h, this.step.hs, sg) - this.step.dip * Math.sin(Math.PI * sg);
      this.hip.y = this.gy(this.feet[this.st]) - h * SCALE;
      trail = { x: r, y: h };
      const lift = (0.5 + 2 * k) * Math.sin(Math.PI * sg);
      lead = { x: lerp(this.step.sw.x, a, smooth(sg)), y: Math.min(lerp(this.step.sw.y, this.step.hs, sg), h) - lift };
      if (!arrived && r <= -this.step.b) {
        const vy = (this.v / (this.step.x + this.step.b)) * (this.step.hs - this.step.h + this.step.dip * Math.PI);
        this.fT = (2 * vy * 1000) / GRAVITY;
        this.fy = this.hip.y;
        this.fvy = vy;
        this.lead = lead;
        this.trail = trail;
        this.flight = 0;
        if (this.fT < dt) this.touchDown(lead, trail);
      }
    } else {
      // in the air between two steps: a short ballistic arc, the leading foot reaching for the ground
      this.flight += dt;
      const u = Math.min(1, this.flight / this.fT);
      const tau = (u * this.fT) / 1000;
      this.hip.y = this.fy - (this.fvy * tau - (GRAVITY * tau * tau) / 2);
      const land = (this.gy(this.hip.x + this.face * a * SCALE) - this.fy) / SCALE;
      lead = { x: lerp(this.lead.x, a, smooth(u)), y: lerp(this.lead.y, land, u) };
      trail = { x: this.trail.x - 0.5 * k * u, y: this.trail.y - 2 * k * u };
      if (u >= 1) this.touchDown(lead, trail);
    }
    const [l, r] = st === 0 ? [trail, lead] : [lead, trail];
    // the swing of the arms against the legs, the lean into the run (more while speeding up, back while braking)
    const lg = legs(l, r);
    const acc = ((this.v - was) * 1000) / Math.max(dt, 1);
    this.lean += (3 + 9 * k + 10 * Math.max(-1, Math.min(1, acc / ACCEL)) - this.lean) * Math.min(1, dt / 90);
    const kk = Math.min(1, 1.5 * k);
    this.pose = {
      torso: this.lean, la1: lerp(this.was.la1, 1.1 * lg.rl1 - 5, kk), la2: lerp(this.was.la2, -70, kk),
      ra1: lerp(this.was.ra1, 1.1 * lg.ll1 - 5, kk), ra2: lerp(this.was.ra2, -70, kk),
      ...lg,
    };
    if (this.leaving && (this.hip.x - (this.face > 0 ? s.b : s.a)) * this.face > 2) this.fall();
    else if (arrived) this.stop();
  }

  private touchDown(lead: V, trail: V): void {
    const i = this.st === 0 ? 1 : 0;
    this.feet[i] = this.hip.x + this.face * lead.x * SCALE;
    this.st = i;
    this.flight = -1;
    this.newStep(trail);
  }

  /** The last step of a stop: the foot on the ground stays, the hip comes over it, the other foot is brought up beside it. */
  private stop(): void {
    const r = this.rel(this.feet[this.st]);
    const side = r >= 0 ? 1 : -1;
    const xf = this.hip.x + this.face * Math.max(0, r - side * SPLAY) * SCALE;
    const o = this.st === 0 ? 1 : 0;
    this.lead = feetOf(this.pose)[o]!;
    this.feet[o] = xf - this.face * side * SPLAY * SCALE;
    this.anchor = { x: xf, y: 0 };
    this.v = 0;
    this.enter('stop');
  }

  private whenStopping(): void {
    const u = Math.min(1, this.t / STOP_MS);
    const xf = this.anchor.x;
    this.hip.x = lerp(this.start.x, xf, smooth(u));
    const yEnd = this.standY(this.feet);
    this.hip.y = lerp(this.start.y, yEnd, smooth(u));
    const o = this.st === 0 ? 1 : 0;
    const end = this.foot(o);
    const swing = { x: lerp(this.lead.x, end.x, smooth(u)), y: lerp(this.lead.y, end.y, u) - 1.5 * Math.sin(Math.PI * u) };
    const stance = this.foot(this.st);
    const [l, r] = o === 0 ? [swing, stance] : [stance, swing];
    this.pose = { ...mix(this.was, STAND, smooth(u)), ...legs(l, r) };
    if (u < 1) return;
    if (this.jumping && this.want !== this.cur) {
      this.jumping = false;
      this.crouch();
      return;
    }
    this.jumping = false;
    this.enter('idle');
    this.whenIdle();
  }

  // ---- jumps

  /** Down on the legs and planning the jump: where it goes, how high and how fast it must leave the ground. */
  private crouch(): void {
    const from = this.spots[this.cur]!;
    const to = this.spots[this.via]!;
    const gp = gap(from, to);
    if (gp > 0) this.turn(to.a + to.b > from.a + from.b ? 1 : -1);
    const rise = from.fixed - to.fixed;
    const kind: Kind = rise > REACH_UP ? 'up' : rise < -14 ? 'down' : 'level';
    const x1 = gp === 0 ? Math.min(Math.max(this.hip.x, to.a + 10), to.b - 10) : this.face > 0 ? to.a + 10 : to.b - 10;
    const base = (this.feet[0] + this.feet[1]) / 2;
    const by = this.gy(base);
    const c = kind === 'up' ? { x: 0.3, y: -9 } : kind === 'down' ? { x: 0.5, y: -12 } : { x: 1, y: -9.5 };
    const feet = [this.rel(this.feet[0]) - this.rel(base), this.rel(this.feet[1]) - this.rel(base)];
    let lift: V = { x: base + this.face * c.x * SCALE, y: by - 13.6 * SCALE };
    let plan: Plan = { kind, to: this.via, base, h0: { x: 0, y: 0 }, c, d: { x: 0, y: -1 }, len: 0, vel: { x: 0, y: 0 }, time: 0, load: 0 };
    // what the arc must clear: the tops of the two edges (across a gap) and the whole of every tile it passes over
    const over = this.between(from, to);
    const top = gp === 0 ? Infinity : Math.min(ground(from, this.face > 0 ? from.b : from.a), ground(to, this.face > 0 ? to.a : to.b));
    const extra = 15 * this.random(); // no two jumps quite the same height
    for (let i = 0; i < 3; i++) {
      const { vel, time } = this.aim(lift, kind, to, x1, { over, top, extra });
      const sp = Math.hypot(vel.x, vel.y);
      const d = { x: (vel.x * this.face) / sp, y: vel.y / sp };
      // the push lasts until the first leg is straight (13.6 of its 14)
      const len = Math.min(...feet.map((f) => {
        const w = { x: f - c.x, y: -c.y };
        const wd = w.x * d.x + w.y * d.y;
        return wd + Math.sqrt(wd * wd - (w.x * w.x + w.y * w.y) + 13.6 * 13.6);
      }));
      lift = { x: base + this.face * (c.x + d.x * len) * SCALE, y: by + (c.y + d.y * len) * SCALE };
      plan = { ...plan, d, len, vel, time };
    }
    plan.h0 = { x: this.rel(this.hip.x) - this.rel(base), y: (this.hip.y - by) / SCALE };
    plan.load = kind === 'down' ? 120 : kind === 'up' ? 280 : 250;
    this.plan = plan;
    this.enter('crouch');
  }

  /** The take-off velocity from `lift` and the time to the landing (or, for a ledge, to the top of the jump). */
  private aim(lift: V, kind: Kind, to: Spot, x1: number, path: { over: readonly Spot[]; top: number; extra: number }): { vel: V; time: number } {
    if (kind === 'up') {
      const apex = { x: x1 - this.face * REACH_HAND.x * SCALE, y: ground(to, x1) - REACH_HAND.y * SCALE };
      const vy = Math.sqrt(2 * GRAVITY * Math.max(lift.y - apex.y, 4));
      const time = vy / GRAVITY;
      return { vel: { x: (apex.x - lift.x) / time, y: -vy }, time };
    }
    const land = { x: x1, y: ground(to, x1) - READY_H * SCALE };
    const drop = land.y - lift.y;
    const span = Math.abs(land.x - lift.x);
    // a parabola that tops out `apex` above the take-off and comes down on the landing point
    const arc = (apex: number): { vel: V; time: number } => {
      const vy = Math.sqrt(2 * GRAVITY * apex);
      const time = vy / GRAVITY + Math.sqrt((2 * (apex + drop)) / GRAVITY);
      return { vel: { x: (land.x - lift.x) / time, y: -vy }, time };
    };
    // the feet (held about as low as for the landing) at least CLEAR above the edges' tops at the top of the jump, and
    // above every corner of a tile it passes over as it passes it
    const clears = (apex: number): boolean => {
      const { vel } = arc(apex);
      const feetAt = (x: number): number => {
        const t = (x - lift.x) / vel.x;
        return lift.y + vel.y * t + (GRAVITY * t * t) / 2 + (READY_H + 0.5) * SCALE;
      };
      return lift.y - apex + (READY_H + 0.5) * SCALE <= path.top - CLEAR
        && path.over.every((s) => feetAt(s.a) <= ground(s, s.a) - CLEAR && feetAt(s.b) <= ground(s, s.b) - CLEAR);
    };
    let apex = Math.max(kind === 'down' ? 3 : Math.min(26, Math.max(8, 0.3 * span)), 4 - drop);
    while (!clears(apex)) apex += 2;
    // a higher arc through the same two points is higher all the way, so the variation never costs the clearance
    return arc(apex + path.extra);
  }

  /** Down into the crouch at rest, then the push: the hip speeds up in a straight line until the legs are straight. */
  private whenCrouching(): void {
    const p = this.plan!;
    const by = this.gy(p.base);
    const sp = Math.hypot(p.vel.x, p.vel.y);
    const push = (2 * p.len * SCALE) / sp; // s
    let h: V;
    const lift = CLIPS.lift[p.kind === 'up' ? 1 : 0]!.pose;
    // the arms swing back as it goes down and start forward before the legs push, to be up as it leaves the ground
    const back = mix(this.was, CLIPS.crouch[0]!.pose, smooth(this.t / (0.6 * p.load)));
    const upper = mix(back, lift, smooth((this.t - 0.6 * p.load) / (0.4 * p.load + push * 1000)));
    if (this.t < p.load) {
      const u = smooth(this.t / p.load);
      h = { x: lerp(p.h0.x, p.c.x, u), y: lerp(p.h0.y, p.c.y, u) };
    } else {
      const tau = (this.t - p.load) / 1000;
      const s = (Math.min(tau, push) / push) ** 2 * p.len;
      h = { x: p.c.x + p.d.x * s, y: p.c.y + p.d.y * s };
    }
    this.hip = { x: p.base + this.face * h.x * SCALE, y: by + h.y * SCALE };
    this.onFeet(upper);
    if (this.t >= p.load + push * 1000) this.takeOff();
  }

  private takeOff(): void {
    const p = this.plan!;
    const over = this.t - p.load - (2 * p.len * SCALE * 1000) / Math.hypot(p.vel.x, p.vel.y); // the part of this tick already in the air
    this.enter('air');
    this.sv = { ...p.vel };
    this.anchor = { x: Math.max(p.vel.x * this.face, 0) / 200, y: 0 }; // how far ahead the feet go for the landing (0 to 1)
    this.t = over;
    this.whenAir();
  }

  /** Flying: the hip on its parabola, the pose following the velocity (rising, then the feet ready), until a foot touches. */
  private whenAir(): void {
    const p = this.plan!;
    const tau = this.t / 1000;
    this.hip = { x: this.start.x + this.sv.x * tau, y: this.start.y + this.sv.y * tau + (GRAVITY * tau * tau) / 2 };
    const vy = this.sv.y + GRAVITY * tau;
    const blend = smooth(this.t / Math.min(AIR_IN, 600 * p.time));
    if (p.kind === 'up') {
      const lift = CLIPS.lift[1]!.pose;
      this.pose = mix(this.was, mix(top(lift, REACH), REACH, smooth(tau / (0.85 * p.time))), blend);
      if (tau >= p.time) this.grab();
      return;
    }
    const m = smooth(0.5 + vy / (2 * Math.max(-this.sv.y, 150)));
    this.pose = mix(this.was, mix(AIR_RISE, ready(4.5 * Math.min(1, this.anchor.x)), m), blend);
    if (vy <= 0) return;
    const f = feetOf(this.pose).map((q) => ({ x: this.hip.x + this.face * q.x * SCALE, y: this.hip.y + q.y * SCALE }));
    const below = f.map((q) => q.y - ground(this.spots[p.to]!, q.x));
    if (Math.max(...below) >= 0) this.land(f.map((q) => q.x), Math.max(...below));
  }

  /** A foot is on the ground: the legs take the fall, the hip carries on forward over the feet, and it stands up. */
  private land(xs: number[], into: number): void {
    const p = this.plan!;
    this.cur = p.to;
    this.hip.y -= into;
    this.feet = [xs[0]!, xs[1]!];
    const vx = this.sv.x;
    const vy = this.sv.y + (GRAVITY * this.t) / 1000;
    // the feet come down as the air pose holds them, the right one a little ahead: fast across, the hip comes over it and
    // the left foot steps through; slow, the hip settles between the two
    const skid = Math.abs(vx) >= SKID;
    const xf = skid ? this.feet[1] + this.face * SPLAY * SCALE : (this.feet[0] + this.feet[1]) / 2;
    const dx = (xf - this.hip.x) * this.face;
    const depth = Math.min(6, Math.max(1.5, (vy * vy) / (2 * ABSORB) / SCALE));
    const tx = (2 * Math.abs(dx) * 1000) / Math.max(Math.abs(vx), 20);
    const tv = (2 * depth * SCALE * 1000) / Math.max(vy, 20);
    const ref = this.feet[1];
    const h0 = (this.gy(ref) - this.hip.y) / SCALE;
    this.land0 = { xf, tx, tv, t1: Math.max(tx, tv), h0, hl: h0 - depth, step: skid, to: xf + this.face * SPLAY * SCALE, ref };
    this.enter('land');
    this.sv = { x: vx, y: vy };
    this.lead = { x: this.feet[0], y: this.feet[1] };
    this.whenLanding();
  }

  private whenLanding(): void {
    const l = this.land0;
    const t = this.t;
    const ux = l.tx > 0 ? Math.min(1, t / l.tx) : 1;
    this.hip.x = hermite(this.start.x, l.xf, (this.sv.x * l.tx) / 1000, 0, ux);
    const g = this.gy(l.ref);
    const rise = smooth((t - l.t1 - LAND_HOLD) / LAND_RISE);
    // the stepping foot comes through as it stands up
    const feet: [number, number] = [l.step ? lerp(this.lead.x, l.to, rise) : this.lead.x, this.lead.y];
    this.feet = feet;
    const h = t < l.tv ? hermite(l.h0, l.hl, (-this.sv.y / SCALE) * (l.tv / 1000), 0, t / l.tv) : l.hl;
    this.hip.y = lerp(g - h * SCALE, this.standY(feet), rise);
    const low = CLIPS.land[0]!.pose;
    const upper = t < l.t1 ? mix(this.was, low, smooth(t / l.t1)) : mix(low, STAND, rise);
    const f = this.foot(0);
    const lift = l.step ? 1.5 * Math.sin(Math.PI * rise) : 0; // the stepping foot off the ground as it comes through
    this.pose = { ...upper, ...legs({ x: f.x, y: f.y - lift }, this.foot(1)) };
    if (rise >= 1) this.settle();
  }

  // ---- a ledge

  /** At the top of the jump the hands close on the ledge; from here the body hangs from them. */
  private grab(): void {
    const p = this.plan!;
    this.cur = p.to;
    const hx = this.hip.x + this.face * REACH_HAND.x * SCALE;
    this.anchor = { x: hx, y: 0 };
    const ay = this.gy(hx);
    const rx = (this.hip.x - hx) * this.face;
    const ry = this.hip.y - ay;
    this.len = Math.hypot(rx, ry);
    this.phi = Math.atan2(rx, ry);
    this.omega = (this.sv.x * this.face * Math.cos(this.phi)) / this.len;
    this.enter('hang');
  }

  /** Hanging: a damped pendulum about the hands, the arms straightening under the weight. */
  private whenHanging(dt: number): void {
    const l0 = this.len;
    const t = this.t;
    const L = HANG_L * SCALE + (l0 - HANG_L * SCALE) * (1 + t / SETTLE) * Math.exp(-t / SETTLE);
    for (let left = dt; left > 0; left -= 4) {
      const h = Math.min(4, left) / 1000;
      this.omega += (-(GRAVITY / L) * Math.sin(this.phi) - HANG_DAMP * this.omega) * h;
      this.phi += this.omega * h;
    }
    const a = { x: this.anchor.x, y: this.gy(this.anchor.x) };
    this.hip = { x: a.x + this.face * Math.sin(this.phi) * L, y: a.y + Math.cos(this.phi) * L };
    const torso = -deg(this.phi);
    const [dl, dr] = dangle(torso);
    const hang = { ...P(grip(torso, { x: ((a.x - this.hip.x) * this.face) / SCALE, y: (a.y - this.hip.y) / SCALE })), ...legs(dl, dr) };
    this.pose = { ...hang, ...mix(this.was, hang, smooth(t / 150)), torso, la1: hang.la1, la2: hang.la2, ra1: hang.ra1, ra2: hang.ra2 };
    if (t < HANG_MS) return;
    this.at0 = { x: ((this.hip.x - a.x) * this.face) / SCALE, y: (this.hip.y - a.y) / SCALE };
    this.torso0 = torso;
    this.enter('pull');
  }

  // ---- over a cliff

  private fall(): void {
    this.leaving = false;
    this.plunge = 0;
    this.rolled = false;
    this.vel = { x: this.face * this.v, y: this.vel.y };
    this.enter('fall');
  }

  /** Under gravity, the speed it ran off with kept, tipping head first over the edge and then turning steadily. */
  private whenFalling(): void {
    const s = this.t / 1000;
    this.hip = { x: this.start.x + this.sv.x * s, y: this.start.y + this.sv.y * s + (GRAVITY * s * s) / 2 };
    this.spin = this.face * SPIN * (s < TIP ? (s * s) / (2 * TIP) : s - TIP / 2);
    const i = Math.floor(this.t / FRAME_MS) % 2;
    this.pose = mix(this.was, mix(CLIPS.tumble[i]!.pose, CLIPS.tumble[1 - i]!.pose, (this.t % FRAME_MS) / FRAME_MS), smooth(this.t / 150));
    if (!this.rolled && this.t >= OH_NO) {
      this.rolled = true;
      if (this.random() < RESCUE) {
        this.shoot();
        return;
      }
    }
    if (this.t >= FALL_MS) {
      this.died = this.face;
      this.mode = 'hidden';
      this.spin = 0;
      this.cur = this.want = -1;
      this.dwell = 0;
    }
  }

  /** The web line at the corner it fell from: it turns to face the tile and shoots. */
  private shoot(): void {
    const s = this.spots[this.cur]!;
    const x = this.face > 0 ? s.b : s.a;
    this.anchor = { x, y: 0 };
    this.spun = this.spin;
    this.face = this.face > 0 ? -1 : 1;
    this.sv = { x: this.sv.x, y: this.sv.y + (GRAVITY * this.t) / 1000 };
    this.enter('web');
    this.len = 0;
  }

  /** The line flies out, goes taut, and it swings on it, reeling it in, until letting go carries it up on to the tile. */
  private whenWeb(dt: number): void {
    const a = { x: this.anchor.x, y: this.gy(this.anchor.x) };
    this.spin = this.spun * (1 - smooth(this.t / 260));
    if (this.len === 0) {
      const s = this.t / 1000;
      this.hip = { x: this.start.x + this.sv.x * s, y: this.start.y + this.sv.y * s + (GRAVITY * s * s) / 2 };
      if (this.t >= SHOT_MS) {
        // taut: what moves across the line swings; what moves along it stretches the line, which takes it up in a moment
        const r = { x: (this.hip.x - a.x) * this.face, y: this.hip.y - a.y };
        this.len = Math.hypot(r.x, r.y);
        this.phi = Math.atan2(r.x, r.y);
        const v = { x: this.sv.x * this.face, y: this.sv.y + (GRAVITY * this.t) / 1000 };
        this.omega = (v.x * Math.cos(this.phi) - v.y * Math.sin(this.phi)) / this.len;
        this.stretch = v.x * Math.sin(this.phi) + v.y * Math.cos(this.phi);
      }
    } else {
      for (let left = dt; left > 0; left -= 4) {
        const h = Math.min(4, left) / 1000;
        this.stretch *= Math.exp(-h / 0.04);
        // it pulls the line in only while the swing would not carry it high enough to clear the edge
        const high = a.y - (READY_H + 6) * SCALE;
        const short = (this.len * this.omega) ** 2 < 2 * GRAVITY * (a.y + Math.cos(this.phi) * this.len - high);
        const next = Math.max(WEB_MIN, this.len + (this.stretch - (short ? REEL : 0)) * h);
        this.along = (next - this.len) / h;
        // a pendulum whose length changes: pulling the line in speeds the swing up, as a skater pulling in the arms
        this.omega += (-(GRAVITY / this.len) * Math.sin(this.phi) - ((2 * this.along) / this.len) * this.omega - 0.4 * this.omega) * h;
        this.phi += this.omega * h;
        this.len = next;
      }
      this.hip = { x: a.x + this.face * Math.sin(this.phi) * this.len, y: a.y + Math.cos(this.phi) * this.len };
    }
    const r = { x: ((a.x - this.hip.x) * this.face) / SCALE, y: (a.y - this.hip.y) / SCALE };
    const torso = -deg(Math.atan2(-r.x, -r.y)); // the body turns into the line as it shoots, and hangs along it
    const d = Math.hypot(r.x, r.y);
    const hand = add(shoulder(torso), { x: (r.x / d) * (ARM - 0.01), y: (r.y / d) * (ARM - 0.01) });
    const [up, ra2] = arm(torso, hand);
    const ra1 = near(up, this.was.ra1); // the arm straight up is half a turn either way: the way it was flailing
    const [dl, dr] = dangle(torso);
    const swing = P({ torso, la1: -70, la2: -30, ra1, ra2, ...legs(dl, dr) });
    this.pose = mix(this.was, swing, smooth(this.t / 120));
    const reach = Math.min(1, this.t / SHOT_MS);
    const hw = this.world(handsOf(this.pose)[1]!);
    this.web = { x: lerp(hw.x, a.x, reach), y: lerp(hw.y, a.y, reach), hx: hw.x, hy: hw.y };
    if (this.len === 0) return;
    // let go when the flight from here clears the edge and comes down on the tile, a little way in from its corner
    const along = this.along;
    const vx = this.face * (this.len * this.omega * Math.cos(this.phi) + along * Math.sin(this.phi));
    const vy = -this.len * this.omega * Math.sin(this.phi) + along * Math.cos(this.phi);
    const target = a.y - READY_H * SCALE;
    const clear = this.hip.y - (vy * vy) / (2 * GRAVITY) <= target - 2 * SCALE;
    const down = (-vy + Math.sqrt(Math.max(0, vy * vy - 2 * GRAVITY * (this.hip.y - target)))) / GRAVITY;
    const inside = (this.hip.x + vx * down - a.x) * this.face;
    if (vy < 0 && clear && inside >= 14 && inside <= 60) this.release({ x: vx, y: vy });
  }

  /** A point of the drawing relative to the hip, in the page, turned with the body about its centre of mass. */
  private world(q: V): V {
    const c = { x: this.hip.x, y: this.hip.y + (LEG - COM) * SCALE };
    const p = { x: this.hip.x + this.face * q.x * SCALE - c.x, y: this.hip.y + q.y * SCALE - c.y };
    const r = rad(this.spin);
    return { x: c.x + p.x * Math.cos(r) - p.y * Math.sin(r), y: c.y + p.x * Math.sin(r) + p.y * Math.cos(r) };
  }

  /** Up to a tile far above on the web line: shot at the nearest point of its top edge, a little way in. */
  private webTo(i: number): void {
    const s = this.spots[i]!;
    const x = Math.min(Math.max(this.hip.x, s.a + 10), s.b - 10);
    this.turn(x >= this.hip.x ? 1 : -1);
    this.via = i;
    this.anchor = { x, y: 0 };
    this.len = 0;
    this.enter('climb');
  }

  /**
   * The climb: standing, it throws an arm up and the line flies to the edge; then the line takes its weight and is pulled
   * in, the body hanging from it as a pendulum whose length shortens, both hands on the line, until the hands are at the
   * edge; from there it hangs and pulls itself up as from any ledge.
   */
  private whenWebClimb(dt: number): void {
    const a = { x: this.anchor.x, y: ground(this.spots[this.via]!, this.anchor.x) };
    const towards = (torso: number): V => {
      const s = shoulder(torso);
      const d = sub({ x: ((a.x - this.hip.x) * this.face) / SCALE, y: (a.y - this.hip.y) / SCALE }, s);
      const n = Math.hypot(d.x, d.y);
      return add(s, { x: (d.x / n) * (ARM - 0.01), y: (d.y / n) * (ARM - 0.01) });
    };
    if (this.t < SHOT_MS) {
      this.hip.y = this.standY(this.feet);
      const [up, ra2] = arm(0, towards(0));
      this.onFeet(mix(this.was, { ...this.was, torso: 0, ra1: near(up, this.was.ra1), ra2 }, smooth(this.t / SHOT_MS)));
    } else {
      if (this.len === 0) {
        // the line is fast: from here it takes the weight
        this.len = Math.hypot(this.hip.x - a.x, this.hip.y - a.y);
        this.phi = Math.atan2((this.hip.x - a.x) * this.face, this.hip.y - a.y);
        this.omega = 0;
        this.was = this.pose;
      }
      const tau = this.t - SHOT_MS;
      for (let left = dt; left > 0; left -= 4) {
        const h = Math.min(4, left) / 1000;
        const next = Math.max(HANG_L * SCALE, this.len - CLIMB * smooth(tau / 200) * h); // the pull starts gently
        const along = (next - this.len) / h;
        this.omega += (-(GRAVITY / this.len) * Math.sin(this.phi) - ((2 * along) / this.len) * this.omega - HANG_DAMP * this.omega) * h;
        this.phi += this.omega * h;
        this.len = next;
      }
      this.hip = { x: a.x + this.face * Math.sin(this.phi) * this.len, y: a.y + Math.cos(this.phi) * this.len };
      const torso = -deg(this.phi);
      const [dl, dr] = dangle(torso);
      this.pose = mix(this.was, { ...P(grip(torso, towards(torso))), ...legs(dl, dr) }, smooth(tau / 150));
      if (this.len <= HANG_L * SCALE) {
        this.cur = this.via;
        this.web = null;
        this.enter('hang');
        return;
      }
    }
    const hw = this.world(handsOf(this.pose)[1]!);
    const reach = Math.min(1, this.t / SHOT_MS);
    this.web = { x: lerp(hw.x, a.x, reach), y: lerp(hw.y, a.y, reach), hx: hw.x, hy: hw.y };
  }

  private release(vel: V): void {
    this.web = null;
    this.spin = 0;
    this.plan = { kind: 'level', to: this.cur, base: 0, h0: { x: 0, y: 0 }, c: { x: 0, y: 0 }, d: { x: 0, y: -1 }, len: 0, vel, time: 0.5, load: 0 };
    this.enter('air');
    this.sv = { ...vel };
    this.anchor = { x: Math.max(vel.x * this.face, 0) / 200, y: 0 };
  }
}
