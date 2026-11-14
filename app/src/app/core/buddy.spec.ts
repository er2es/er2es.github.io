import { Buddy, CLIPS, FRAME_MS, HIDE, RESCUE, SCALE, TOLERANCE, feetOf, handsOf, type Pose, type Spot, type View } from './buddy';

const A: Spot = { a: 0, b: 120, fixed: 100 };
const B: Spot = { a: 136, b: 256, fixed: 100 }; // beside A, at the same height
const C: Spot = { a: 0, b: 120, fixed: 240 }; // below A
const D: Spot = { a: 136, b: 256, fixed: 124 }; // beside A, a little lower, as in the second column of the hobbies
const E: Spot = { a: 0, b: 120, fixed: 180 }; // below A by a ledge's reach
const HIGH: Spot = { a: 0, b: 120, fixed: -100 }; // far above A
const LONG: Spot = { a: 0, b: 900, fixed: 100 };
const GRAVITY = 1200;

/** Where the pointer is held while time passes: [spot, position]. Without it the pointer is still, and the figure leaves after a while. */
type Hold = readonly [number, number];

const run = (b: Buddy, ms: number, hold?: Hold, step = 16): void => {
  for (let t = 0; t < ms; t += step) {
    if (hold) b.pointer(hold[0], hold[1]);
    b.tick(step);
  }
};
const seen = (b: Buddy, ms: number, hold?: Hold, step = 16): View[] => {
  const out: View[] = [];
  for (let t = 0; t < ms; t += step) {
    if (hold) b.pointer(hold[0], hold[1]);
    b.tick(step);
    out.push(b.view());
  }
  return out;
};
/** A figure standing on spot 0 at `pos`, with the pointer there. */
const standing = (spots: Spot[], pos: number, random = (): number => 0.99): Buddy => {
  const b = new Buddy(random);
  b.setSpots(spots);
  run(b, 1500, [0, pos]);
  return b;
};

// The drawing, measured on its own (viewBox units: the hip at (16, 23), the feet point at (16, 37), bones of 7, 7, 10.5,
// 5.5 and 5), so that the tests check the figure as it is drawn and not the movement's own sums.
type Pt = { x: number; y: number };
const dir = (a: number): Pt => ({ x: -Math.sin((a * Math.PI) / 180), y: Math.cos((a * Math.PI) / 180) });
/** Every joint of the drawn figure in the page: hip, knees, feet, shoulder, elbows, hands, head; turned with the body. */
const joints = (v: View): Pt[] => {
  const p = v.pose;
  const hip = { x: 0, y: -14 };
  const pts: Pt[] = [hip];
  for (const [a, b] of [[p.ll1, p.ll2], [p.rl1, p.rl2]] as const) {
    const k = { x: hip.x + 7 * dir(a).x, y: hip.y + 7 * dir(a).y };
    pts.push(k, { x: k.x + 7 * dir(a + b).x, y: k.y + 7 * dir(a + b).y });
  }
  const up = dir(p.torso + 180);
  const sh = { x: hip.x + 10.5 * up.x, y: hip.y + 10.5 * up.y };
  pts.push(sh, { x: hip.x + 17 * up.x, y: hip.y + 17 * up.y });
  for (const [a, b] of [[p.la1, p.la2], [p.ra1, p.ra2]] as const) {
    const e = { x: sh.x + 5.5 * dir(p.torso + a).x, y: sh.y + 5.5 * dir(p.torso + a).y };
    pts.push(e, { x: e.x + 5 * dir(p.torso + a + b).x, y: e.y + 5 * dir(p.torso + a + b).y });
  }
  const r = (v.spin * Math.PI) / 180;
  return pts.map((q) => {
    // relative to the centre the component turns it about, (16, 20) of the drawing: 17 units above the feet point
    const x = v.facing * q.x * SCALE;
    const y = (q.y + 17) * SCALE;
    return { x: v.x + x * Math.cos(r) - y * Math.sin(r), y: v.y - 17 * SCALE + x * Math.sin(r) + y * Math.cos(r) };
  });
};
const feet = (v: View): Pt[] => { const j = joints(v); return [j[2]!, j[4]!]; };
const hands = (v: View): Pt[] => { const j = joints(v); return [j[8]!, j[10]!]; };
const hipOf = (v: View): Pt => joints(v)[0]!;
/** The lower foot: on the ground when it stands. */
const low = (v: View): number => Math.max(...feet(v).map((f) => f.y));
/** The largest change of a joint's velocity from one tick to the next (px per tick, per tick): a jump in place or speed. */
const jerk = (views: View[]): number => {
  let worst = 0;
  for (let i = 2; i < views.length; i++) {
    const [a, b, c] = [views[i - 2]!, views[i - 1]!, views[i]!];
    if (!a.visible || !b.visible || !c.visible) continue;
    const [ja, jb, jc] = [joints(a), joints(b), joints(c)];
    jc.forEach((q, k) => { worst = Math.max(worst, Math.hypot(q.x - 2 * jb[k]!.x + ja[k]!.x, q.y - 2 * jb[k]!.y + ja[k]!.y)); });
  }
  return worst;
};

describe('buddy, in a row', () => {
  it('stays out of sight until the pointer has rested on a tile, then pulls itself up from behind it', () => {
    const b = new Buddy();
    b.setSpots([A, B]);
    run(b, 500);
    expect(b.view().visible).toBe(false); // no pointer yet
    run(b, 100, [0, 60]);
    expect(b.view().visible).toBe(false); // not rested long enough
    const views = seen(b, 1200, [0, 60]);
    const first = views.find((v) => v.visible)!;
    expect(first.behind).toBe(true);
    expect(first.y).toBeGreaterThan(A.fixed + HIDE * 0.5); // low, hanging from the ledge
    expect(Math.min(...hands(first).map((h) => h.y))).toBeCloseTo(A.fixed, 5); // by the hands, on the edge
    const last = views[views.length - 1]!;
    expect(last.behind).toBe(false);
    expect(low(last)).toBeCloseTo(A.fixed, 4);
    expect(last.x).toBeCloseTo(60, 5);
    expect(last.web).toBeNull();
  });

  it('breathes slowly while it stands, the arms only', () => {
    const b = standing([A, B], 60);
    const views = seen(b, 2600, [0, 60]);
    const la1 = views.map((v) => v.pose.la1);
    expect(Math.min(...la1)).toBeCloseTo(CLIPS.stand[0]!.pose.la1, 0);
    expect(Math.max(...la1)).toBeCloseTo(CLIPS.stand[1]!.pose.la1, 0);
    expect(views.every((v) => v.pose.torso === 0)).toBe(true);
    expect(FRAME_MS).toBeCloseTo(83.3, 0);
  });

  it('runs along the edge after the pointer, leaning into it, and faces the way it runs', () => {
    const b = standing([A, B], 20);
    const right = seen(b, 800, [0, 100]);
    expect(right.some((v) => v.pose.torso > 8)).toBe(true);
    expect(right.every((v) => v.facing === 1)).toBe(true);
    expect(b.view().x).toBeCloseTo(100, -0.8);
    const left = seen(b, 1000, [0, 20]);
    expect(left.some((v) => v.facing === -1)).toBe(true);
    expect(b.view().x).toBeCloseTo(20, -0.8);
  });

  it('keeps inside the tile when the pointer is at its very edge', () => {
    const b = standing([A, B], 60);
    run(b, 1500, [0, -50]);
    expect(b.view().x).toBeCloseTo(A.a + 8, -0.8);
  });

  it('runs to the edge, crouches, jumps over the gap to a tile at the same height and lands there', () => {
    const b = standing([A, B], 100);
    const views = seen(b, 3000, [1, 200]);
    const air = views.filter((v) => v.y < A.fixed - 1 && v.x > A.b - 6);
    expect(air.length).toBeGreaterThan(5); // above the edge, over the gap
    expect(views.some((v) => v.pose.torso >= 20)).toBe(true); // down on the legs before the jump
    const end = views[views.length - 1]!;
    expect(low(end)).toBeCloseTo(B.fixed, 4);
    expect(end.x).toBeCloseTo(200, -0.8); // on to where the pointer is
  });

  it('jumps back to the left, landing at the near edge of the other tile', () => {
    const b = standing([A, B], 100);
    run(b, 3000, [1, 200]);
    const views = seen(b, 3000, [0, 30]);
    expect(views.some((v) => v.facing === -1 && v.y < B.fixed - 1)).toBe(true);
    expect(views[views.length - 1]!.x).toBeCloseTo(30, -0.8);
  });

  it('reaches up for a higher edge, grabs the ledge and pulls itself up', () => {
    const b = standing([E, A], 100);
    const views = seen(b, 4000, [1, 100]);
    expect(views.some((v) => Math.abs(v.pose.la1 - CLIPS.reach[0]!.pose.la1) < 0.01)).toBe(true);
    const hanging = views.filter((v) => v.y > A.fixed + 30 && v.y < E.fixed - 5 && !v.behind && Math.abs(hands(v)[0]!.y - A.fixed) < 0.5);
    expect(hanging.length).toBeGreaterThan(10); // hangs on the ledge in front of the tile, not behind it
    expect(low(views[views.length - 1]!)).toBeCloseTo(A.fixed, 4);
  });

  it('steps off a ledge to a lower edge and lands in a crouch', () => {
    const b = standing([A, C], 100);
    const views = seen(b, 4000, [1, 60]);
    const deep = views.filter((v) => Math.abs(feet(v)[0]!.y - C.fixed) < 0.01 && hipOf(v).y > C.fixed - 11 * SCALE);
    expect(deep.length).toBeGreaterThan(3); // the hip down near the feet: the knees deep
    expect(low(views[views.length - 1]!)).toBeCloseTo(C.fixed, 4);
  });

  it('drops the jump if the pointer comes back while it is still running to the edge', () => {
    const b = standing([A, B], 20);
    run(b, 200, [1, 200]); // on its way to the edge
    const views = seen(b, 2000, [0, 30]);
    expect(views.every((v) => Math.max(...feet(v).map((f) => f.y)) >= A.fixed - 4)).toBe(true); // never jumped
    expect(views[views.length - 1]!.x).toBeCloseTo(30, -0.8);
  });

  it('goes back after the pointer when it lands somewhere the pointer no longer is', () => {
    const b = standing([A, B], 100);
    let t = 0;
    while (t < 4000 && b.view().y >= A.fixed - 2) { // until it is in the air
      run(b, 16, [1, 200]);
      t += 16;
    }
    run(b, 6000, [0, 40]);
    expect(b.view().x).toBeCloseTo(40, -0.8);
    expect(low(b.view())).toBeCloseTo(A.fixed, 4);
  });

  it('goes back behind the tile when the pointer has been still for a while, and stays away until it comes again', () => {
    const b = standing([A, B], 60);
    const views = seen(b, TOLERANCE + 1500);
    expect(views.some((v) => v.behind)).toBe(true);
    expect(views[views.length - 1]!.visible).toBe(false);
    run(b, 3000);
    expect(b.view().visible).toBe(false); // nothing brings it back by itself
    run(b, 1500, [1, 200]);
    const v = b.view();
    expect(v.visible).toBe(true);
    expect(v.x).toBeCloseTo(200, 5);
    expect(low(v)).toBeCloseTo(B.fixed, 4);
  });

  it('jumps across to a tile beside it that is a little lower, as between the two columns of the hobbies', () => {
    const b = standing([A, D], 100);
    const views = seen(b, 4000, [1, 200]);
    expect(views.some((v) => v.x > A.b && v.x < D.a)).toBe(true);
    expect(low(views[views.length - 1]!)).toBeCloseTo(D.fixed, 4);
  });

  it('drops straight down on to the tile below, whichever side of the edge the pointer is on', () => {
    const right = standing([A, C], 60);
    const down = seen(right, 4000, [1, 100]);
    expect(low(down[down.length - 1]!)).toBeCloseTo(C.fixed, 4);
    expect(down[down.length - 1]!.x).toBeGreaterThan(A.a + 9); // came down inside the lower tile, not past it
    const left = standing([A, C], 60);
    const other = seen(left, 4000, [1, 10]);
    expect(other.some((v) => v.facing === -1)).toBe(true);
    expect(low(other[other.length - 1]!)).toBeCloseTo(C.fixed, 4);
  });

  it('hops up on to an edge a little higher, on its feet, without grabbing it', () => {
    const b = standing([D, A], 160);
    const views = seen(b, 4000, [1, 60]);
    expect(views.some((v) => Math.abs(v.pose.la1 - CLIPS.reach[0]!.pose.la1) < 0.01)).toBe(false);
    expect(low(views[views.length - 1]!)).toBeCloseTo(A.fixed, 4);
  });

  it('goes behind its tile and comes out of the other one when that is too far or too high to jump to', () => {
    const b = standing([A, HIGH], 60);
    const up = seen(b, 4000, [1, 60]);
    expect(up.some((v) => v.behind)).toBe(true); // slipped behind A
    expect(up.some((v) => Math.abs(v.pose.la1 - CLIPS.reach[0]!.pose.la1) < 0.01)).toBe(false); // without a jump
    expect(low(up[up.length - 1]!)).toBeCloseTo(HIGH.fixed, 4);
    const far = standing([A, { a: 400, b: 520, fixed: 100 }], 60);
    const across = seen(far, 4000, [1, 450]);
    expect(across.some((v) => v.behind)).toBe(true);
    expect(across[across.length - 1]!.x).toBeCloseTo(450, 5);
    const deep = standing([A, { a: 0, b: 120, fixed: 600 }], 60);
    const below = seen(deep, 4000, [1, 60]);
    expect(below.some((v) => v.behind)).toBe(true);
    expect(low(below[below.length - 1]!)).toBeCloseTo(600, 4);
  });

  it('stands, runs and jumps on a tile that is tilted or raised as it is, not on its unturned edge', () => {
    const T: Spot = { a: 0, b: 400, fixed: 100, tilt: 0.1, lift: -4 };
    const g = (x: number): number => 100 - 4 + 0.1 * (x - 200);
    const b = standing([T], 100);
    expect(Math.max(...feet(b.view()).map((f) => f.y - g(f.x)))).toBeCloseTo(0, 5);
    const views = seen(b, 2000, [0, 300]);
    for (const v of views) {
      const gaps = feet(v).map((f) => f.y - g(f.x));
      expect(Math.max(...gaps)).toBeLessThan(1e-6); // no foot in the tile
      expect(Math.max(...gaps)).toBeGreaterThan(-6); // and one on it, or in a short step between
    }
  });
});

describe('buddy, leaping along a row', () => {
  /** A row of tiles as the soft skills are: 120 wide, 16 apart, all at the same height. */
  const row = (n: number, at: (i: number) => Partial<Spot> = () => ({})): Spot[] =>
    Array.from({ length: n }, (_, i) => ({ a: i * 136, b: i * 136 + 120, fixed: 100, ...at(i) }));
  /** From `from` on tile 0 to the middle of tile `to`, the random answering `r` throughout. */
  const go = (spots: Spot[], from: number, to: number, r: number): View[] => {
    const b = standing(spots, from, () => r);
    return seen(b, 5000, [to, (spots[to]!.a + spots[to]!.b) / 2], 4);
  };
  const flight = (views: View[]): View[] => views.filter((v) => !v.behind && v.visible && low(v) < 100 - 1);

  it('always leaps over one tile in between, high over it, and comes down on the far tile, not in it', () => {
    const spots = row(3);
    for (const [from, r] of [[20, 0.99], [100, 0.1]] as const) { // a run-up, or a standing jump near the edge
      const views = go(spots, from, 2, r);
      expect(views.some((v) => v.behind)).toBe(false);
      const over = flight(views).filter((v) => hipOf(v).x >= spots[1]!.a && hipOf(v).x <= spots[1]!.b);
      expect(over.length).toBeGreaterThan(10);
      over.forEach((v) => expect(low(v)).toBeLessThanOrEqual(spots[1]!.fixed - 25));
      const touch = views.findIndex((v, i) => i > 0 && low(views[i - 1]!) < 100 - 1e-4 && Math.abs(low(v) - 100) < 1e-4 && hipOf(v).x > spots[1]!.b);
      feet(views[touch]!).forEach((f) => { expect(f.x).toBeGreaterThan(spots[2]!.a); expect(f.x).toBeLessThan(spots[2]!.b); });
      expect(low(views[views.length - 1]!)).toBeCloseTo(100, 4);
      expect(views[views.length - 1]!.x).toBeCloseTo(spots[2]!.a + 60, -0.8);
    }
  });

  it('leaps over two tiles about half the time, and otherwise goes round behind them; never over three', () => {
    const spots = row(5);
    const leap = go(spots, 20, 3, 0.1);
    expect(leap.some((v) => v.behind)).toBe(false);
    expect(Math.max(...flight(leap).map((v) => 100 - low(v)))).toBeGreaterThan(25);
    expect(low(leap[leap.length - 1]!)).toBeCloseTo(100, 4);
    const round = go(spots, 20, 3, 0.9);
    expect(round.some((v) => v.behind)).toBe(true);
    expect(round[round.length - 1]!.x).toBeCloseTo(spots[3]!.a + 60, 5);
    const far = go(spots, 20, 4, 0.1);
    expect(far.some((v) => v.behind)).toBe(true);
  });

  it('goes round instead when the leap would be too long, or up to a ledge it would have to grab', () => {
    const wide = row(3, (i) => ({ a: i * 400, b: i * 400 + 120 }));
    expect(go(wide, 100, 2, 0.1).some((v) => v.behind)).toBe(true);
    const high = row(3, (i) => (i === 2 ? { fixed: 40 } : {}));
    const views = go(high, 100, 2, 0.1);
    expect(views.some((v) => v.behind)).toBe(true);
    expect(low(views[views.length - 1]!)).toBeCloseTo(40, 4);
  });

  it('clears a tile in between that is tilted or raised', () => {
    const spots = row(3, (i) => (i === 1 ? { tilt: 0.2, lift: -10 } : {}));
    const views = go(spots, 20, 2, 0.99);
    const t = spots[1]!;
    const g = (x: number): number => t.fixed + t.lift! + t.tilt! * (x - (t.a + t.b) / 2);
    const over = flight(views).filter((v) => hipOf(v).x >= t.a && hipOf(v).x <= t.b);
    expect(over.length).toBeGreaterThan(10);
    over.forEach((v) => feet(v).forEach((f) => expect(f.y).toBeLessThanOrEqual(g(Math.min(Math.max(f.x, t.a), t.b)) - 25 + 1e-6)));
  });

  it('jumps the gap to the tile beside it high, the feet well above both edges', () => {
    const views = go(row(2), 20, 1, 0.99);
    expect(Math.max(...flight(views).map((v) => 100 - low(v)))).toBeGreaterThanOrEqual(25);
  });

  it('varies its jumps: the height of the arc, and where it takes off', () => {
    const top = (r: number): number => Math.min(...go(row(2), 20, 1, r).map((v) => low(v)));
    expect(100 - top(0)).toBeLessThan(100 - top(0.99) - 8); // up to 15 px higher
    const takeOff = (r: number): number => {
      const views = go(row(2), 20, 1, r);
      const up = views.findIndex((v) => low(v) < 100 - 8); // well off the ground: the jump, not a stride
      let j = up;
      while (Math.abs(low(views[j]!) - 100) > 1e-4) j--;
      return hipOf(views[j]!).x;
    };
    expect(takeOff(0)).toBeGreaterThan(takeOff(0.99) + 6); // right at the edge, or some way short of it
  });
});

describe('buddy, with the pointer over the tiles', () => {
  const row = (n: number): Spot[] => Array.from({ length: n }, (_, i) => ({ a: i * 136, b: i * 136 + 120, fixed: 100 }));
  /** Out on tile 0 at `from`, the pointer over the tiles, the random answering `r`. */
  const over = (spots: Spot[], from: number, r = 0.99): Buddy => {
    const b = new Buddy(() => r);
    b.setSpots(spots);
    b.setInside(true);
    run(b, 1500, [0, from]);
    return b;
  };
  const middle = (s: Spot): number => (s.a + s.b) / 2;

  it('stays out however long the pointer rests, and goes only once it has left', () => {
    const b = over([A, B], 60);
    const still = seen(b, 10 * TOLERANCE); // not a move for a long time
    expect(still.every((v) => v.visible && !v.behind)).toBe(true);
    b.setInside(false);
    const gone = seen(b, TOLERANCE - 100);
    expect(gone.every((v) => v.visible)).toBe(true); // the time starts when it leaves
    run(b, 1500);
    expect(b.view().visible).toBe(false);
  });

  it('still goes over the cliff the pointer leaves by', () => {
    const b = over([{ ...A, cliff: -1 }, B], 60);
    b.setInside(false);
    b.pointerOff(-1);
    run(b, 6000);
    expect(b.takeDeath()).toBe(-1);
  });

  it('goes the length of a row in leaps of one to three tiles, in sight all the way, looking again after each', () => {
    const spots = row(7);
    for (const r of [0, 0.5, 0.99]) {
      const b = over(spots, 60, r);
      const views = seen(b, 12000, [6, middle(spots[6]!)], 4);
      expect(views.every((v) => v.visible && !v.behind)).toBe(true);
      // jumps (the feet well up, not a stride), each coming down on a tile
      const landed: View[] = [];
      let up = false;
      views.forEach((v) => {
        if (low(v) < 100 - 20) up = true;
        else if (up && Math.abs(low(v) - 100) < 1e-4) {
          up = false;
          landed.push(v);
        }
      });
      expect(landed.length).toBeGreaterThanOrEqual(2);
      landed.forEach((v) => expect(spots.some((s) => feet(v).every((f) => f.x > s.a && f.x < s.b))).toBe(true));
      expect(low(views[views.length - 1]!)).toBeCloseTo(100, 4);
      expect(views[views.length - 1]!.x).toBeCloseTo(middle(spots[6]!), -0.8);
    }
    // and when the pointer moves on during the journey, it heads for where it is now
    const b = over(spots, 60, 0);
    run(b, 1500, [6, middle(spots[6]!)]);
    run(b, 9000, [3, middle(spots[3]!)]);
    expect(b.view().x).toBeCloseTo(middle(spots[3]!), -0.8);
  });

  it('climbs on the web line to a tile far above it, as in the columns of the hobbies, and stands on it', () => {
    const top: Spot = { a: 0, b: 120, fixed: 100 };
    const bottom: Spot = { a: 0, b: 120, fixed: 236 };
    const right: Spot = { a: 136, b: 256, fixed: 236 };
    const b = new Buddy(() => 0.99);
    b.setSpots([bottom, top, right]);
    b.setInside(true);
    run(b, 1500, [0, 60]);
    const views = seen(b, 4000, [1, 60], 4);
    expect(views.every((v) => v.visible && !v.behind)).toBe(true);
    const webbed = views.filter((v) => v.web);
    expect(webbed.length).toBeGreaterThan(20);
    const fast = webbed.filter((v) => v.web!.x === 60); // once the line has reached the edge
    expect(fast.length).toBeGreaterThan(20);
    fast.forEach((v) => expect(v.web!.y).toBeCloseTo(top.fixed, 6)); // on the edge above
    webbed.forEach((v) => {
      const h = hands(v)[1]!;
      expect(Math.hypot(h.x - v.web!.hx, h.y - v.web!.hy)).toBeLessThan(1e-6); // from the hand
    });
    const climbing = views.slice(views.indexOf(webbed[0]!), views.indexOf(webbed[webbed.length - 1]!));
    expect(Math.min(...climbing.map((v) => low(v)))).toBeLessThan(bottom.fixed - 60); // lifted off the ground by it
    expect(jerk(views)).toBeLessThan(2.5);
    expect(low(views[views.length - 1]!)).toBeCloseTo(top.fixed, 4);
    // and from the other column, to the tile above and across
    const c = new Buddy(() => 0.99);
    c.setSpots([right, top]);
    c.setInside(true);
    run(c, 1500, [0, 196]);
    const across = seen(c, 4000, [1, 60], 4);
    expect(across.some((v) => v.web && v.facing === -1)).toBe(true);
    expect(across.every((v) => !v.behind)).toBe(true);
    expect(low(across[across.length - 1]!)).toBeCloseTo(top.fixed, 4);
  });

  it('drops to a tile far below rather than going round behind', () => {
    const b = over([A, { a: 0, b: 120, fixed: 400 }], 60);
    const views = seen(b, 4000, [1, 60]);
    expect(views.every((v) => v.visible && !v.behind)).toBe(true);
    expect(low(views[views.length - 1]!)).toBeCloseTo(400, 4);
  });

  it('goes round behind after all when there is no way to get there', () => {
    const b = over([A, { a: 500, b: 620, fixed: -200 }], 60);
    const views = seen(b, 5000, [1, 560]);
    expect(views.some((v) => v.behind)).toBe(true);
    expect(low(views[views.length - 1]!)).toBeCloseTo(-200, 4);
  });
});

describe('buddy, physics', () => {
  /** A run from standing at 20 to 800, at 16 ms. */
  const sprint = (step = 16): View[] => seen(standing([LONG], 20), 5000, [0, 800], step);

  it('never slides a foot that is on the ground, and never puts one into it', () => {
    const views = sprint();
    let planted = 0;
    for (let i = 1; i < views.length; i++) {
      const [a, c] = [feet(views[i - 1]!), feet(views[i]!)];
      for (const k of [0, 1]) {
        expect(c[k]!.y).toBeLessThan(LONG.fixed + 1e-6);
        if (Math.abs(a[k]!.y - LONG.fixed) < 1e-6 && Math.abs(c[k]!.y - LONG.fixed) < 1e-6) {
          planted++;
          expect(Math.abs(c[k]!.x - a[k]!.x)).toBeLessThan(1e-6);
        }
      }
    }
    expect(planted).toBeGreaterThan(100);
  });

  it('runs at a steady top speed in strides of a few to the second, with a short flight in each', () => {
    const views = sprint();
    const cruise = views.slice(40, 140);
    const speed = ((cruise[cruise.length - 1]!.x - cruise[0]!.x) / (cruise.length - 1)) * (1000 / 16);
    expect(speed).toBeGreaterThan(170);
    expect(speed).toBeLessThan(190);
    // a step is a place where a foot stays put on the ground: count them over the cruise
    const plants = new Set<number>();
    let airborne = 0;
    for (let i = 1; i < cruise.length; i++) {
      const [a, c] = [feet(cruise[i - 1]!), feet(cruise[i]!)];
      for (const k of [0, 1]) {
        if (Math.abs(a[k]!.y - LONG.fixed) < 1e-6 && Math.abs(c[k]!.y - LONG.fixed) < 1e-6 && Math.abs(a[k]!.x - c[k]!.x) < 1e-6) plants.add(Math.round(c[k]!.x));
      }
      if (c.every((f) => f.y < LONG.fixed - 1e-6)) airborne++;
    }
    const perSecond = plants.size / ((cruise.length * 16) / 1000);
    expect(perSecond).toBeGreaterThan(4);
    expect(perSecond).toBeLessThan(7);
    expect(airborne).toBeGreaterThan(10);
  });

  it('gets going in a step or two, leaning forward, brakes into a stop and turns round only once it has stopped', () => {
    const views = sprint(4);
    const v = (i: number): number => (views[i]!.x - views[i - 1]!.x) * 250;
    expect(v(10)).toBeLessThan(50); // still slow 40 ms in
    expect(views.slice(0, 50).some((w) => w.pose.torso > 12)).toBe(true); // the lean of speeding up
    expect(views.slice(250, 300).every((w) => w.pose.torso < 13)).toBe(true); // less once at speed
    const b = standing([LONG], 200);
    run(b, 1200, [0, 600]); // at speed to the right
    const back = seen(b, 2000, [0, 100], 4);
    const turn = back.findIndex((w) => w.facing === -1);
    expect(turn).toBeGreaterThan(5); // not at once
    expect(Math.abs(back[turn]!.x - back[turn - 1]!.x) * 250).toBeLessThan(10); // stopped when it turned
    for (let i = 2; i < turn; i++) {
      const a = (back[i]!.x - 2 * back[i - 1]!.x + back[i - 2]!.x) * 250 * 250;
      expect(Math.abs(a)).toBeLessThan(2 * 1100 + 300); // braking, not a wall
    }
  });

  it('jumps on a parabola of one gravity: out of the crouch with the feet still down, on to the far edge with the feet ahead', () => {
    const b = standing([A, B], 100);
    const views = seen(b, 3000, [1, 200], 4);
    const flying = views.map((v, i) => ({ v, i })).filter(({ v }) => feet(v).every((f) => f.y < A.fixed - 0.5) && v.y < A.fixed + 5);
    const first = flying[0]!.i;
    const last = flying[flying.length - 1]!.i;
    for (let i = first + 2; i <= last; i++) {
      const ay = (hipOf(views[i]!).y - 2 * hipOf(views[i - 1]!).y + hipOf(views[i - 2]!).y) / 0.004 ** 2;
      expect(ay).toBeCloseTo(GRAVITY, -1);
    }
    // the push: before it leaves, the hip rises out of the crouch while the feet stay where they are
    const push = views.slice(first - 8, first - 1);
    for (let i = 1; i < push.length; i++) {
      expect(hipOf(push[i]!).y).toBeLessThan(hipOf(push[i - 1]!).y);
      feet(push[i]!).forEach((f, k) => expect(f.x).toBeCloseTo(feet(push[i - 1]!)[k]!.x, 6));
    }
    // the speed at take-off is the speed of the flight: no kick
    const vBefore = hipOf(views[first - 1]!).y - hipOf(views[first - 2]!).y;
    const vAfter = hipOf(views[first + 1]!).y - hipOf(views[first]!).y;
    expect(Math.abs(vAfter - vBefore)).toBeLessThan(0.15);
    // in the air: rising with the knee up, then the feet forward for the landing
    const apex = flying.reduce((m, f) => (hipOf(f.v).y < hipOf(m.v).y ? f : m));
    expect(feet(views[last]!).every((f) => (f.x - hipOf(views[last]!).x) > 0)).toBe(true);
    expect(apex.i).toBeGreaterThan(first);
    // and it lands moving: the hip carries on forward after the feet are down
    const after = views.slice(last + 1, last + 12).map((v) => hipOf(v).x);
    expect(after[after.length - 1]! - after[0]!).toBeGreaterThan(2);
  });

  it('takes a long drop deeper in the knees than a hop across', () => {
    /** The lowest the hip comes above the ground it lands on. */
    const lowest = (spots: Spot[], hold: Hold, ground: number): number => {
      const views = seen(standing(spots, 100), 4000, hold, 4);
      return Math.min(...views.filter((v) => Math.abs(low(v) - ground) < 1e-6).map((v) => ground - hipOf(v).y));
    };
    const drop = lowest([A, C], [1, 60], C.fixed);
    const hop = lowest([A, B], [1, 200], B.fixed);
    expect(drop).toBeLessThan(hop);
    expect(drop).toBeGreaterThan(4 * SCALE); // still on its feet, the knees not through the floor
  });

  it('grabs a ledge at the top of its jump, hangs from it by the hands, and pulls itself up slowly at first', () => {
    const b = standing([E, A], 100);
    const views = seen(b, 4000, [1, 100], 4);
    const grab = views.findIndex((v) => hands(v).every((h) => Math.abs(h.y - A.fixed) < 0.05));
    expect(grab).toBeGreaterThan(0);
    expect(views[grab]!.pose.la1).toBeCloseTo(CLIPS.reach[0]!.pose.la1, 6); // in the reach for it
    expect(Math.abs(hipOf(views[grab]!).y - hipOf(views[grab - 1]!).y) * 250).toBeLessThan(40); // at the top: barely moving
    // from the grab until the chest is over the edge, the hands stay on the ledge
    const held = views.slice(grab, grab + Math.round((420 + 0.55 * 950) / 4));
    for (const v of held) hands(v).forEach((h) => expect(Math.abs(h.y - A.fixed)).toBeLessThan(0.05));
    // it sways a little and settles
    const xs = held.slice(0, 105).map((v) => hipOf(v).x);
    expect(Math.max(...xs) - Math.min(...xs)).toBeGreaterThan(0.2);
    // the pull: slow at the start, no jump in height anywhere, and up on the ledge at the end, the feet on it
    const pull = views.slice(grab + 105);
    expect(hipOf(pull[0]!).y - hipOf(pull[25]!).y).toBeLessThan(2.5);
    for (let i = 1; i < pull.length; i++) expect(Math.abs(hipOf(pull[i]!).y - hipOf(pull[i - 1]!).y)).toBeLessThan(0.8);
    feet(views[views.length - 1]!).forEach((f) => expect(f.y).toBeCloseTo(A.fixed, 2));
  });

  it('falls off a cliff on a parabola, with the speed it ran off with, turning head first the way it went', () => {
    const L: Spot = { ...A, cliff: -1 };
    const b = standing([L, { ...B, cliff: 1 }], 60);
    b.pointerOff(-1);
    const views = seen(b, 3000, undefined, 4);
    const go = views.findIndex((v) => v.spin !== 0);
    const vx = (views[go - 1]!.x - views[go - 2]!.x) * 250;
    expect(vx).toBeLessThan(-150); // running left at speed
    const fall = views.slice(go, go + 200).filter((v) => v.visible);
    const c = fall.map((v) => ({ x: v.x, y: v.y - 17 * SCALE })); // the centre of mass
    for (let i = 2; i < c.length; i++) {
      expect((c[i]!.x - 2 * c[i - 1]!.x + c[i - 2]!.x) / 0.004 ** 2).toBeCloseTo(0, 3);
      expect((c[i]!.y - 2 * c[i - 1]!.y + c[i - 2]!.y) / 0.004 ** 2).toBeCloseTo(GRAVITY, -1);
    }
    expect((c[1]!.x - c[0]!.x) * 250).toBeCloseTo(vx, -1); // the speed it ran off with, kept
    expect(fall.every((v) => v.spin < 0)).toBe(true); // to the left: anticlockwise, head first
    const rate = (i: number): number => Math.abs(fall[i + 1]!.spin - fall[i]!.spin);
    expect(rate(1)).toBeLessThan(rate(30)); // tipping over the edge, then turning steadily
  });
});

describe('buddy, at a cliff', () => {
  const L: Spot = { ...A, cliff: -1 };
  const R: Spot = { ...B, cliff: 1 };
  /** The pointer goes off past an end and stays away for `ms`. */
  const off = (b: Buddy, ms: number, side: 1 | -1): View[] => {
    b.pointerOff(side);
    return seen(b, ms);
  };

  it('waits a moment, runs off the end of the tiles when the pointer has left that way, and falls, tumbling, out of sight', () => {
    const b = standing([L, R], 60);
    const views = off(b, 6000, -1);
    expect(views.slice(0, 20).every((v) => v.spin === 0)).toBe(true); // not at once: the pointer may come back
    const fall = views.filter((v) => v.spin !== 0);
    expect(fall.length).toBeGreaterThan(10);
    expect(fall[fall.length - 1]!.y).toBeGreaterThan(L.fixed + 500); // far below the tiles
    expect(Math.abs(fall[fall.length - 1]!.spin)).toBeGreaterThan(300); // head over heels
    expect(fall[0]!.facing).toBe(-1);
    expect(views.every((v) => v.web === null)).toBe(true);
    expect(views[views.length - 1]!.visible).toBe(false);
    expect(b.takeDeath()).toBe(-1); // off the left
    expect(b.takeDeath()).toBe(0); // only once
  });

  it('goes to the other end first when it is on the wrong tile, and falls off that', () => {
    const b = standing([L, R], 60);
    const views = off(b, 8000, 1);
    expect(views.some((v) => v.y < L.fixed - 1 && v.x > L.b - 6)).toBe(true); // jumped across the gap
    expect(views.find((v) => v.spin !== 0)!.facing).toBe(1);
    expect(b.takeDeath()).toBe(1); // off the right
  });

  it('does nothing if nobody is out, if it is already going, or if there is no cliff', () => {
    const none = new Buddy();
    none.setSpots([L, R]);
    none.pointerOff(-1);
    run(none, 3000);
    expect(none.view().visible).toBe(false);
    const sinking = standing([L, R], 60);
    run(sinking, TOLERANCE + 200); // behind the tile and going
    sinking.pointerOff(1);
    run(sinking, 3000);
    expect(sinking.takeDeath()).toBe(0);
    const plain = standing([A, B], 60); // no cliff anywhere
    plain.pointerOff(1);
    run(plain, 600, [0, 60]);
    expect(plain.view().visible).toBe(true);
    const falling = standing([L, R], 60);
    falling.pointerOff(-1);
    let t = 0;
    while (t < 5000 && falling.view().spin === 0) {
      falling.tick(16);
      t += 16;
    }
    falling.pointerOff(1); // too late
    run(falling, 3000);
    expect(falling.takeDeath()).toBe(-1);
  });

  it('turns back if the pointer comes back before it has gone over', () => {
    const b = standing([L, R], 60);
    b.pointerOff(-1);
    run(b, 700);
    const views = seen(b, 2500, [0, 60]);
    expect(views.every((v) => v.spin === 0)).toBe(true);
    expect(b.takeDeath()).toBe(0);
    expect(views[views.length - 1]!.x).toBeCloseTo(60, -0.8);
  });

  it('goes off the nearest cliff on that side, as with the tiles of a column', () => {
    const top: Spot = { a: 0, b: 120, fixed: 100, cliff: -1 };
    const bottom: Spot = { a: 0, b: 120, fixed: 240, cliff: -1 };
    const b = new Buddy(() => 0.99);
    b.setSpots([top, bottom]);
    run(b, 1500, [1, 60]); // standing on the lower one
    const views = off(b, 6000, -1);
    const first = views.find((v) => v.spin !== 0)!;
    expect(first.y).toBeCloseTo(bottom.fixed, -1); // went off that one, did not climb to the other
    expect(b.takeDeath()).toBe(-1);
  });

  it('can come out again after it has fallen', () => {
    const b = standing([L, R], 60);
    off(b, 6000, -1);
    run(b, 1500, [1, 200]);
    expect(b.view().visible).toBe(true);
  });

  it('now and then saves itself with a web line at the corner it fell from, swings in and lands back on the tile', () => {
    expect(RESCUE).toBe(0.25);
    const b = standing([L, R], 60, () => 0.1);
    b.pointerOff(-1);
    const views = seen(b, 3500, undefined, 4);
    const webbed = views.filter((v) => v.web);
    expect(webbed.length).toBeGreaterThan(20);
    const taut = webbed.filter((v) => v.web!.x === L.a);
    expect(taut.length).toBeGreaterThan(10);
    taut.forEach((v) => expect(v.web!.y).toBeCloseTo(L.fixed, 6)); // on the tile's top corner
    // the line runs from the raised hand, and once taut the hip swings about the corner
    taut.forEach((v) => {
      const h = hands(v)[1]!;
      expect(Math.hypot(h.x - v.web!.hx, h.y - v.web!.hy)).toBeLessThan(1e-6);
    });
    // lets go on the way up and comes down on the tile on its feet, gently: the top of the flight just above the edge
    const end = views.findIndex((v, i) => i > views.indexOf(webbed[webbed.length - 1]!) && feet(v).some((f) => Math.abs(f.y - L.fixed) < 1e-6));
    expect(end).toBeGreaterThan(0);
    const top = Math.min(...views.slice(views.indexOf(webbed[webbed.length - 1]!), end).map((v) => hipOf(v).y));
    expect(L.fixed - 14 * SCALE - top).toBeLessThan(25);
    expect(views[end]!.x).toBeGreaterThan(L.a + 8);
    expect(views[end]!.x).toBeLessThan(L.b);
    expect(views[views.length - 1]!.spin).toBe(0);
    expect(jerk(views.slice(views.indexOf(webbed[0]!)))).toBeLessThan(3); // no pops; the jerk of the line going taut is the most
    expect(b.takeDeath()).toBe(0); // not a death
    run(b, 3000);
    expect(b.view().visible).toBe(false); // and, the pointer gone, back behind the tile in time
    expect(b.takeDeath()).toBe(0);
  });

  it('saves itself the same way off the right-hand cliff', () => {
    const b = new Buddy(() => 0);
    b.setSpots([L, R]);
    run(b, 1500, [1, 200]);
    b.pointerOff(1);
    const views = seen(b, 3500, undefined, 4);
    expect(views.some((v) => v.web?.x === R.b)).toBe(true);
    const letGo = views.length - [...views].reverse().findIndex((v) => v.web);
    const back = views.slice(letGo).find((v) => Math.abs(low(v) - R.fixed) < 1e-4);
    expect(back!.x).toBeGreaterThan(R.a);
    expect(back!.x).toBeLessThan(R.b - 8);
    expect(b.takeDeath()).toBe(0);
  });

  it('decides on the way down, so without the web it falls as ever; by default by chance', () => {
    const b = standing([L, R], 60, () => 0.25);
    b.pointerOff(-1);
    const views = seen(b, 6000);
    expect(views.every((v) => v.web === null)).toBe(true);
    expect(b.takeDeath()).toBe(-1);
    const chance = new Buddy();
    chance.setSpots([L, R]);
    run(chance, 1500, [0, 60]);
    chance.pointerOff(1);
    run(chance, 8000);
    expect([0, 1]).toContain(chance.takeDeath());
  });
});

describe('buddy, continuity', () => {
  /** Every move, one after the other, at a fine step: no joint may jump in place or in speed between two ticks. */
  it('moves every joint smoothly through every change of move', () => {
    const scenes: [Spot[], number, Hold, number][] = [
      [[LONG], 20, [0, 500], 3000], // off from standing, run, stop
      [[A, B], 100, [1, 200], 3000], // to the edge, crouch, jump, land, on
      [[E, A], 100, [1, 100], 4000], // jump up, grab, hang, pull up
      [[A, C], 100, [1, 60], 3000], // step off, drop, land
      [[A, D], 100, [1, 200], 3000],
      [[A, B, { a: 272, b: 392, fixed: 100 }], 20, [2, 332], 4000], // a leap over a tile
    ];
    for (const [spots, from, hold, ms] of scenes) {
      const b = standing(spots, from);
      expect(jerk(seen(b, ms, hold, 4))).toBeLessThan(2.5);
    }
    const turn = standing([LONG], 200);
    run(turn, 1200, [0, 600]);
    expect(jerk(seen(turn, 2000, [0, 100], 4))).toBeLessThan(2.5);
    const rest = standing([A, B], 60);
    const out = seen(rest, TOLERANCE + 1500, undefined, 4); // standing, then sinking back behind the tile
    expect(jerk(out)).toBeLessThan(2.5);
    const cliff = standing([{ ...A, cliff: -1 }, B], 60);
    cliff.pointerOff(-1);
    expect(jerk(seen(cliff, 1400, undefined, 4))).toBeLessThan(2.5);
  });

  it('does nothing in a tick of no time', () => {
    const b = standing([A, B], 60);
    const before = b.view();
    b.tick(0);
    expect(b.view()).toEqual(before);
  });

  it('puts the hands and the feet where the drawing has them', () => {
    const p: Pose = CLIPS.reach[0]!.pose;
    const v: View = { visible: true, x: 0, y: 0, facing: 1, pose: p, behind: false, spin: 0, web: null };
    handsOf(p).forEach((h, k) => expect(hands(v)[k]!.x).toBeCloseTo(h.x * SCALE, 6));
    feetOf(p).forEach((f, k) => expect(feet(v)[k]!.y).toBeCloseTo((f.y - 14) * SCALE, 6));
  });
});
