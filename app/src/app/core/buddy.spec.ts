import { Buddy, CLIPS, FRAME_MS, HIDE, TOLERANCE, type Spot, type View } from './buddy';

const A: Spot = { a: 0, b: 120, fixed: 100 };
const B: Spot = { a: 136, b: 256, fixed: 100 }; // beside A, at the same height
const C: Spot = { a: 0, b: 120, fixed: 240 }; // below A
const D: Spot = { a: 136, b: 256, fixed: 124 }; // beside A, a little lower, as in the second column of the hobbies
const E: Spot = { a: 0, b: 120, fixed: 180 }; // below A by a ledge's reach
const HIGH: Spot = { a: 0, b: 120, fixed: -100 }; // far above A

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
const standing = (spots: Spot[], pos: number): Buddy => {
  const b = new Buddy();
  b.setSpots(spots);
  run(b, 1500, [0, pos]);
  return b;
};

describe('buddy, in a row', () => {
  it('stays out of sight until the pointer has rested on a tile, then pulls itself up from behind it', () => {
    const b = new Buddy();
    b.setSpots([A, B]);
    run(b, 500);
    expect(b.view().visible).toBe(false); // no pointer yet
    run(b, 100, [0, 60]);
    expect(b.view().visible).toBe(false); // not rested long enough
    const views = seen(b, 800, [0, 60]);
    const first = views.find((v) => v.visible)!;
    expect(first.behind).toBe(true);
    expect(first.y).toBeGreaterThan(A.fixed + HIDE * 0.5); // low, hanging from the ledge
    const last = views[views.length - 1]!;
    expect(last.behind).toBe(false);
    expect(last.y).toBe(A.fixed);
    expect(last.x).toBe(60);
  });

  it('breathes while it stands, in steps of twelve frames a second', () => {
    const b = standing([A, B], 60);
    const torso = seen(b, 1000, [0, 60]).map((v) => v.pose.torso);
    expect(Math.max(...torso)).toBeCloseTo(CLIPS.stand[0]!.pose.torso, 0);
    expect(Math.min(...torso)).toBeCloseTo(CLIPS.stand[1]!.pose.torso, 0);
    expect(FRAME_MS).toBeCloseTo(83.3, 0);
  });

  it('runs along the edge after the pointer and faces the way it runs', () => {
    const b = standing([A, B], 60);
    const right = seen(b, 400, [0, 100]);
    expect(right.some((v) => Math.abs(v.pose.torso - CLIPS.run[0]!.pose.torso) < 1)).toBe(true);
    expect(right.some((v) => v.facing === 1)).toBe(true);
    expect(b.view().x).toBe(100);
    const left = seen(b, 800, [0, 20]);
    expect(left.some((v) => v.facing === -1)).toBe(true);
    expect(b.view().x).toBe(20);
  });

  it('keeps inside the tile when the pointer is at its very edge', () => {
    const b = standing([A, B], 60);
    run(b, 1500, [0, -50]);
    expect(b.view().x).toBe(A.a + 8);
  });

  it('runs to the edge, crouches, jumps over the gap to a tile at the same height and lands there', () => {
    const b = standing([A, B], 100);
    const views = seen(b, 3000, [1, 200]);
    const air = views.filter((v) => v.y < A.fixed - 1 && v.x > A.b - 6);
    expect(air.length).toBeGreaterThan(5); // above the edge, over the gap
    expect(views.some((v) => v.pose.torso < -20)).toBe(true); // down on the legs before the jump
    const end = views[views.length - 1]!;
    expect(end.y).toBe(B.fixed);
    expect(end.x).toBe(200); // on to where the pointer is
  });

  it('jumps back to the left, landing at the near edge of the other tile', () => {
    const b = standing([A, B], 100);
    run(b, 3000, [1, 200]);
    const views = seen(b, 3000, [0, 30]);
    expect(views.some((v) => v.facing === -1 && v.y < B.fixed - 1)).toBe(true);
    expect(views[views.length - 1]!.x).toBe(30);
  });

  it('reaches up for a higher edge, grabs the ledge and pulls itself up', () => {
    const b = standing([E, A], 100);
    const views = seen(b, 4000, [1, 100]);
    const reaching = views.filter((v) => v.pose.la1 === CLIPS.reach[0]!.pose.la1);
    expect(reaching.length).toBeGreaterThan(3);
    const hanging = views.filter((v) => Math.abs(v.pose.la1 - CLIPS.pull[0]!.pose.la1) < 1 && !v.behind);
    expect(hanging.length).toBeGreaterThan(0); // hangs on the ledge in front of the tile, not behind it
    expect(views[views.length - 1]!.y).toBe(A.fixed);
  });

  it('steps off a ledge to a lower edge and lands in a crouch', () => {
    const b = standing([A, C], 100);
    const views = seen(b, 4000, [1, 60]);
    const fell = views.findIndex((v) => v.pose.la1 === CLIPS.fall[0]!.pose.la1);
    expect(fell).toBeGreaterThanOrEqual(0);
    expect(views.slice(fell).some((v) => v.pose.torso < -20)).toBe(true); // down on landing
    expect(views[views.length - 1]!.y).toBe(C.fixed);
  });

  it('drops the jump if the pointer comes back while it is still running to the edge', () => {
    const b = standing([A, B], 20);
    run(b, 200, [1, 200]); // on its way to the edge
    const views = seen(b, 2000, [0, 30]);
    expect(views.every((v) => v.y >= A.fixed - 0.001)).toBe(true); // never left the ground
    expect(views[views.length - 1]!.x).toBe(30);
  });

  it('goes back after the pointer when it lands somewhere the pointer no longer is', () => {
    const b = standing([A, B], 100);
    let t = 0;
    while (t < 4000 && b.view().y >= A.fixed - 2) { // until it is in the air
      run(b, 16, [1, 200]);
      t += 16;
    }
    run(b, 6000, [0, 40]);
    expect(b.view().x).toBe(40);
    expect(b.view().y).toBe(A.fixed);
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
    expect(v.x).toBe(200);
    expect(v.y).toBe(B.fixed);
  });

  it('jumps across to a tile beside it that is a little lower, as between the two columns of the hobbies', () => {
    const b = standing([A, D], 100);
    const views = seen(b, 4000, [1, 200]);
    expect(views.some((v) => v.pose.la1 === CLIPS.fall[0]!.pose.la1)).toBe(true);
    expect(views[views.length - 1]!.y).toBe(D.fixed);
  });

  it('drops straight down on to the tile below, whichever side of the edge the pointer is on', () => {
    const right = standing([A, C], 60);
    const down = seen(right, 4000, [1, 100]);
    expect(down.some((v) => v.pose.la1 === CLIPS.fall[0]!.pose.la1)).toBe(true);
    expect(down[down.length - 1]!.y).toBe(C.fixed);
    expect(down[down.length - 1]!.x).toBeGreaterThan(A.a + 9); // came down inside the lower tile, not past it
    const left = standing([A, C], 60);
    const other = seen(left, 4000, [1, 10]);
    expect(other.some((v) => v.facing === -1)).toBe(true);
    expect(other[other.length - 1]!.y).toBe(C.fixed);
  });

  it('goes behind its tile and comes out of the other one when that is too far or too high to jump to', () => {
    const b = standing([A, HIGH], 60);
    const up = seen(b, 4000, [1, 60]);
    expect(up.some((v) => v.behind)).toBe(true); // slipped behind A
    expect(up.every((v) => v.pose.la1 !== CLIPS.reach[0]!.pose.la1)).toBe(true); // without a jump
    expect(up[up.length - 1]!.y).toBe(HIGH.fixed);
    const far = standing([A, { a: 400, b: 520, fixed: 100 }], 60);
    const across = seen(far, 4000, [1, 450]);
    expect(across.some((v) => v.behind)).toBe(true);
    expect(across[across.length - 1]!.x).toBe(450);
    const deep = standing([A, { a: 0, b: 120, fixed: 600 }], 60);
    const below = seen(deep, 4000, [1, 60]);
    expect(below.some((v) => v.behind)).toBe(true);
    expect(below[below.length - 1]!.y).toBe(600);
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
    expect(views[views.length - 1]!.x).toBe(60);
  });

  it('goes off the nearest cliff on that side, as with the tiles of a column', () => {
    const top: Spot = { a: 0, b: 120, fixed: 100, cliff: -1 };
    const bottom: Spot = { a: 0, b: 120, fixed: 240, cliff: -1 };
    const b = new Buddy();
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

  it('stands on a tile that is tilted or raised as it is, not on its unturned edge', () => {
    const T: Spot = { a: 0, b: 120, fixed: 100, tilt: 0.1, lift: -4 };
    const b = standing([T], 100);
    const v = b.view();
    expect(v.x).toBe(100);
    expect(v.y).toBeCloseTo(100 - 4 + 0.1 * (100 - 60), 5);
  });
});
