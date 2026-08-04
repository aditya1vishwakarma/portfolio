import React, { useEffect, useRef, useState } from 'react';
import { motion as motionComponent } from 'framer-motion';
import Squircle from './Squircle';
import type { RestPlate } from '../../types';

const motion = motionComponent as any;

/* ─────────────────────────────────────────────
 * RestPlates — photographs that breathe in and out over the (Rest) backdrop.
 *
 * Three problems any "random photos pop up" layer has to solve, and how this
 * one solves them:
 *
 *   1. Size. "Full size" of a 4000px landscape is meaningless on screen, so a
 *      plate is sized as a fraction of the viewport and then clamped by height
 *      too — a tall portrait shrinks its width rather than running off the top.
 *      Both come from the image's *measured* aspect ratio, which is why the
 *      layer waits for a preload before a photo is eligible to appear.
 *
 *   2. Collisions. Purely random positions put two photos on top of each other
 *      often enough to read as a bug. Placement is rejection-sampled: try a
 *      random spot, reject it if it overlaps a live plate (plus a gap), retry.
 *      If the screen is genuinely full the spawn is skipped and retried on the
 *      next tick, which is why the scheduler ticks faster than it spawns.
 *
 *   3. Timing. Landscape photography needs dwell time. Each plate lives ~5.6s:
 *      a slow 1.4s scale-in, 3s at rest, a 1.2s drift out. Lives overlap, so
 *      2–4 are on screen at any moment and the screen is never empty or busy.
 * ───────────────────────────────────────────── */

// ── Lifecycle of a single plate (ms) ──
const IN_MS = 1400;
const HOLD_MS = 3000;
const OUT_MS = 1200;
const LIFE_MS = IN_MS + HOLD_MS + OUT_MS;

// ── Cadence ──
const MIN_LIVE = 2;   // below this, refill quickly so the screen is never bare
const MAX_LIVE = 4;   // above this it stops reading as calm
const SPAWN_MIN_MS = 900;
const SPAWN_MAX_MS = 1800;
const REFILL_MIN_MS = 220;  // used while below MIN_LIVE
const REFILL_MAX_MS = 620;
const TICK_MS = 200;        // scheduler resolution; also the collision retry rate

// ── Geometry (percentages of the container) ──
const PLATE_MIN_VW = 20;
const PLATE_MAX_VW = 32;
const PLATE_MAX_VH = 46;
const SAFE_TOP = 15;     // clears the fixed top bar
const SAFE_BOTTOM = 8;
const SAFE_SIDE = 5;
const GAP_RATIO = 0.03;  // breathing room between plates, as a fraction of the short edge
const PLACE_TRIES = 40;

// ── Motion ──
const SCALE_IN = 0.9;
const SCALE_OUT = 1.04;
const DRIFT_PX = 18;     // total upward travel across a plate's life

const rand = (min: number, max: number) => min + Math.random() * (max - min);

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

interface Rect { x: number; y: number; w: number; h: number }

const overlaps = (a: Rect, b: Rect, gap: number) =>
  a.x < b.x + b.w + gap &&
  a.x + a.w + gap > b.x &&
  a.y < b.y + b.h + gap &&
  a.y + a.h + gap > b.y;

interface LivePlate {
  key: number;
  plate: RestPlate;
  /** Position/size as percentages of the container, so a resize scales them. */
  leftPct: number;
  topPct: number;
  widthPct: number;
  /** Pixel box, kept only for collision tests against other live plates. */
  rect: Rect;
  expiresAt: number;
}

/**
 * Decode every plate up front and record its intrinsic aspect ratio. A photo is
 * not eligible to appear until it's in here — a plate that popped in and *then*
 * loaded would jump size mid-animation, and its box couldn't be collision-tested.
 */
function usePlateRatios(plates: RestPlate[]) {
  const [ratios, setRatios] = useState<Map<string, number>>(new Map());
  // Holding the elements keeps the decoded bitmaps warm for the section's life.
  const keepAliveRef = useRef<HTMLImageElement[]>([]);

  useEffect(() => {
    if (plates.length === 0) return;
    let cancelled = false;
    const map = new Map<string, number>();

    plates.forEach((plate) => {
      const img = new Image();
      keepAliveRef.current.push(img);
      img.decoding = 'async';
      img.onload = () => {
        if (cancelled || !img.naturalWidth || !img.naturalHeight) return;
        map.set(plate.imageUrl, img.naturalWidth / img.naturalHeight);
        setRatios(new Map(map));
      };
      // A broken URL simply never becomes eligible — one 404 must not stall the rest.
      img.src = plate.imageUrl;
    });

    return () => {
      cancelled = true;
      keepAliveRef.current = [];
    };
  }, [plates]);

  return ratios;
}

interface RestPlatesProps {
  plates: RestPlate[];
}

const RestPlates: React.FC<RestPlatesProps> = ({ plates }) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const ratios = usePlateRatios(plates);
  const ratiosRef = useRef(ratios);
  ratiosRef.current = ratios;

  const [live, setLive] = useState<LivePlate[]>([]);
  const liveRef = useRef<LivePlate[]>([]);
  const deckRef = useRef<number[]>([]);
  const keyRef = useRef(0);

  const [reducedMotion, setReducedMotion] = useState(false);
  useEffect(() => {
    const q = window.matchMedia('(prefers-reduced-motion: reduce)');
    const sync = () => setReducedMotion(q.matches);
    sync();
    q.addEventListener('change', sync);
    return () => q.removeEventListener('change', sync);
  }, []);

  useEffect(() => {
    if (plates.length === 0) return;

    let nextSpawnAt = 0;
    let hiddenAt = 0;

    /* Deal from a shuffled deck rather than picking at random, so every photo
       is shown once before any repeats. Skips (without discarding) anything
       currently on screen — the same picture twice at once reads as a glitch. */
    const draw = (ready: number[]): number | null => {
      if (ready.length === 0) return null;
      if (deckRef.current.length === 0) deckRef.current = shuffle(ready);
      const deck = deckRef.current;
      const onScreen = new Set(liveRef.current.map((l) => l.plate.id));
      for (let i = deck.length - 1; i >= 0; i--) {
        if (!onScreen.has(plates[deck[i]].id)) return deck.splice(i, 1)[0];
      }
      return null; // everything left in the deck is already up
    };

    const spawn = (now: number): LivePlate | null => {
      const el = containerRef.current;
      if (!el) return null;
      const cw = el.clientWidth;
      const ch = el.clientHeight;
      if (cw < 240 || ch < 240) return null;

      const ready = plates
        .map((p, i) => (ratiosRef.current.has(p.imageUrl) ? i : -1))
        .filter((i) => i >= 0);
      const idx = draw(ready);
      if (idx === null) return null;

      const plate = plates[idx];
      const ratio = ratiosRef.current.get(plate.imageUrl)!;

      // Start from a random width, then let the height cap and the safe area
      // each shrink it further. Aspect ratio is preserved throughout.
      const safeL = (SAFE_SIDE / 100) * cw;
      const safeT = (SAFE_TOP / 100) * ch;
      const availW = cw - safeL * 2;
      const availH = ch - safeT - (SAFE_BOTTOM / 100) * ch;

      let w = (rand(PLATE_MIN_VW, PLATE_MAX_VW) / 100) * cw;
      let h = w / ratio;
      const maxH = Math.min((PLATE_MAX_VH / 100) * ch, availH);
      if (h > maxH) { h = maxH; w = h * ratio; }
      if (w > availW) { w = availW; h = w / ratio; }

      const gap = Math.min(cw, ch) * GAP_RATIO;
      for (let t = 0; t < PLACE_TRIES; t++) {
        const rect: Rect = {
          x: safeL + Math.random() * Math.max(0, availW - w),
          y: safeT + Math.random() * Math.max(0, availH - h),
          w,
          h,
        };
        if (liveRef.current.some((l) => overlaps(l.rect, rect, gap))) continue;
        return {
          key: keyRef.current++,
          plate,
          leftPct: (rect.x / cw) * 100,
          topPct: (rect.y / ch) * 100,
          widthPct: (rect.w / cw) * 100,
          rect,
          expiresAt: now + LIFE_MS,
        };
      }

      // No room right now — put the card back on top of the deck and let the
      // next tick try again, by which point something will have faded out.
      deckRef.current.push(idx);
      return null;
    };

    const tick = () => {
      const now = performance.now();
      const before = liveRef.current.length;
      let next = liveRef.current.filter((l) => l.expiresAt > now);
      let changed = next.length !== before;

      if (now >= nextSpawnAt && next.length < MAX_LIVE) {
        liveRef.current = next; // spawn() collision-tests against the survivors
        const born = spawn(now);
        if (born) {
          next = [...next, born];
          changed = true;
          nextSpawnAt = now + (next.length < MIN_LIVE
            ? rand(REFILL_MIN_MS, REFILL_MAX_MS)
            : rand(SPAWN_MIN_MS, SPAWN_MAX_MS));
        }
      }

      if (changed) {
        liveRef.current = next;
        setLive(next);
      }
    };

    const interval = window.setInterval(tick, TICK_MS);
    tick();

    /* Background tabs freeze rAF, so Framer's animations stall while the wall
       clock keeps running. Without this every plate would come back expired and
       the screen would blink empty. Shift the schedule by the time spent hidden. */
    const onVisibility = () => {
      if (document.hidden) {
        hiddenAt = performance.now();
        return;
      }
      if (!hiddenAt) return;
      const dt = performance.now() - hiddenAt;
      hiddenAt = 0;
      nextSpawnAt += dt;
      liveRef.current = liveRef.current.map((l) => ({ ...l, expiresAt: l.expiresAt + dt }));
      setLive(liveRef.current);
    };
    document.addEventListener('visibilitychange', onVisibility);

    return () => {
      window.clearInterval(interval);
      document.removeEventListener('visibilitychange', onVisibility);
      liveRef.current = [];
      deckRef.current = [];
      // The interval is the only thing that reaps expired plates, so dropping
      // the rendered state here too is what stops a re-run of this effect (a
      // new `plates` identity) from stranding the previous set on screen,
      // frozen at their last keyframe.
      setLive([]);
    };
  }, [plates]);

  // Keyframe stops for the in / hold / out phases.
  const times = [0, IN_MS / LIFE_MS, (IN_MS + HOLD_MS) / LIFE_MS, 1];

  return (
    <div ref={containerRef} className="absolute inset-0 z-20 overflow-hidden pointer-events-none">
      {live.map((l) => (
        <motion.div
          key={l.key}
          className="absolute"
          style={{
            left: `${l.leftPct}%`,
            top: `${l.topPct}%`,
            width: `${l.widthPct}%`,
            willChange: 'transform, opacity',
          }}
          initial={reducedMotion
            ? { opacity: 0 }
            : { opacity: 0, scale: SCALE_IN, y: DRIFT_PX * 0.5 }}
          animate={reducedMotion
            ? { opacity: [0, 1, 1, 0] }
            : {
              opacity: [0, 1, 1, 0],
              scale: [SCALE_IN, 1, 1.005, SCALE_OUT],
              y: [DRIFT_PX * 0.5, 0, -DRIFT_PX * 0.2, -DRIFT_PX * 0.6],
            }}
          transition={{
            duration: LIFE_MS / 1000,
            times,
            ease: ['easeOut', 'linear', 'easeInOut'],
          }}
        >
          <Squircle
            radius={16}
            shadow="0 30px 60px -24px rgba(0,0,0,0.45), 0 10px 22px -14px rgba(0,0,0,0.22)"
          >
            <img
              src={l.plate.imageUrl}
              alt=""
              aria-hidden="true"
              draggable={false}
              decoding="async"
              className="block w-full h-auto select-none"
            />
          </Squircle>

          {l.plate.caption && (
            // Absolute so the caption can never change the box the collision
            // test was run against.
            <div className="absolute top-full left-0 right-0 pt-2 text-center">
              <span className="font-serif italic text-[13px] text-white/85 [text-shadow:0_1px_6px_rgba(0,0,0,0.45)]">
                {l.plate.caption}
              </span>
            </div>
          )}
        </motion.div>
      ))}
    </div>
  );
};

export default React.memo(RestPlates);
