
import React, { useState, useEffect, useRef } from 'react';
import { motion as motionComponent, AnimatePresence, useMotionValue, useSpring, useTransform, useAnimationFrame } from 'framer-motion';
import { ChevronDown } from 'lucide-react';
import { isMobileViewport } from '../../constants';

// Fix: Cast motion to any to resolve property existence type errors for SVG and HTML motion elements
const motion = motionComponent as any;

/**
 * How the three circular holes get combined into one blob.
 * Each mask layer is transparent inside its circle and opaque outside, so compositing
 * them with intersect/source-in yields a hole at the UNION of the circles.
 *
 * Order is by measured cost — see public/mask-test.html, run on-device:
 *   webkit    one layer, three mask images. Fastest on iOS by a clear margin.
 *   intersect one layer, standards syntax. Correct everywhere modern, but slower on iOS.
 *   nested    three stacked masked elements. Universal, and ~3x the per-frame raster.
 * Detected rather than assumed: Firefox on Android has the standard property but not
 * the webkit one, and every iOS browser is WebKit underneath regardless of its name.
 */
type MaskMode = 'webkit' | 'intersect' | 'nested';

const detectMaskMode = (): MaskMode => {
  if (typeof CSS === 'undefined' || typeof CSS.supports !== 'function') return 'nested';
  if (CSS.supports('-webkit-mask-composite', 'source-in')) return 'webkit';
  if (CSS.supports('mask-composite', 'intersect')) return 'intersect';
  return 'nested';
};

const REVEAL_MS = 1500;  // cumulative moving-drag time before the overlay dissolves
const MOVE_EPS = 0.4;     // px/ms floor, so a resting finger accrues nothing
const HIT_PADDING = 15;   // grab forgiveness around the visible circle
const DESKTOP_REVEAL_DIST = 1600;

// Mobile gallery geometry, all in px, mirroring the classes on the grid below. The row
// count is computed from these rather than fixed, so the viewport decides how many photos
// fit — a short phone drops a row instead of squashing cells, a tall one gains one — and
// neither the grid nor the hero ever needs scrolling.
const GRID_COLS = 4;         // grid-cols-4
const GRID_GAP = 2;          // gap-0.5
const GRID_PAD = 8;          // p-2 on the wrapper
const GRID_BOTTOM_PAD = 24;  // guaranteed breathing room under the last row
const GRID_MIN_ROWS = 3;     // below this it stops reading as a gallery; max-h-full absorbs
                             // the remainder on a viewport too short even for that.

/**
 * How many 4-across rows of square photos fit above the fold.
 *
 * Height comes from 100svh — the viewport at its *shortest*, with the URL bar showing —
 * rather than the live height, so the count can't flip back and forth as the bar retracts.
 * The extra room when it does retract simply becomes slack at the bottom.
 *
 * headerH is passed in measured rather than assumed: the caption wraps to three lines below
 * ~375px and two above, an 23px swing that a single constant gets wrong at one end or the
 * other — costing a row on big phones or overflowing on small ones.
 */
const mobileGridRows = (headerH: number, maxRows: number): number => {
  if (typeof window === 'undefined') return GRID_MIN_ROWS;
  const probe = document.createElement('div');
  probe.style.cssText = 'position:absolute;top:0;left:0;width:0;height:100svh;visibility:hidden;pointer-events:none';
  document.body.appendChild(probe);
  // Falls back to innerHeight if svh isn't supported: the declaration is dropped, leaving
  // an empty div at height 0.
  const shortest = probe.getBoundingClientRect().height || window.innerHeight;
  probe.remove();

  const cell = (window.innerWidth - GRID_PAD * 2 - GRID_GAP * (GRID_COLS - 1)) / GRID_COLS;
  const avail = shortest - headerH - GRID_PAD * 2 - GRID_BOTTOM_PAD;
  // n rows span n*cell + (n-1)*gap.
  const fits = Math.floor((avail + GRID_GAP) / (cell + GRID_GAP));
  return Math.max(GRID_MIN_ROWS, Math.min(maxRows, fits));
};

type Circle = { r: number; x: number; y: number };

const Hero: React.FC = () => {
  const [isHovered, setIsHovered] = useState(false);
  const [showRevealButton, setShowRevealButton] = useState(false);
  const [isFullyRevealed, setIsFullyRevealed] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const [gridRows, setGridRows] = useState(GRID_MIN_ROWS);
  // Ripple animation (commented out for now)
  // const [ripples, setRipples] = useState<{ id: number; x: number; y: number }[]>([]);
  // const mobileTapCount = useRef(0);
  const containerRef = useRef<HTMLDivElement>(null);
  const headerRef = useRef<HTMLDivElement>(null);

  // 1. MOTION VALUES
  // Initialize cursor window relative to viewport size (85% width, 25% height)
  // This ensures consistent placement across different screen sizes
  const initialX = typeof window !== 'undefined' ? window.innerWidth * 0.745 : 0;
  const initialY = typeof window !== 'undefined' ? window.innerHeight * 0.265 : 0;
  const mouseX = useMotionValue(initialX);
  const mouseY = useMotionValue(initialY);
  const velocity = useMotionValue(0);
  const lastMousePos = useRef({ x: 0, y: 0 });

  // 2. PHYSICS FOR FLUID BLOBS
  const springMain = { stiffness: 400, damping: 40, mass: 0.5 };
  const springTrail = { stiffness: 180, damping: 26, mass: 1 };
  const springSlow = { stiffness: 100, damping: 23, mass: 1.5 };

  const smoothX = useSpring(mouseX, springMain);
  const smoothY = useSpring(mouseY, springMain);
  const trailX = useSpring(mouseX, springTrail);
  const trailY = useSpring(mouseY, springTrail);
  const slowX = useSpring(mouseX, springSlow);
  const slowY = useSpring(mouseY, springSlow);

  // 3. DYNAMIC PARAMETERS
  const mainRadius = useTransform(velocity, [0, 2000], [100, 130]);

  // Mask technique is resolved once, on the client, before first paint.
  const [maskMode] = useState<MaskMode>(detectMaskMode);
  // layerRefs[0] is the only layer in webkit/intersect mode; nested uses all three.
  const layerRefs = useRef<(HTMLDivElement | null)[]>([]);
  const hitRef = useRef<HTMLDivElement>(null);

  // Circle sizes: fixed px on desktop, viewport-relative on mobile so the blob keeps
  // the same visual weight from an SE to a Pro Max.
  const radii = useRef({ main: 100, trail: 80, slow: 60 });
  const reducedMotion = useRef(false);
  // Mirrors of state for the rAF loop, which closes over its first render otherwise.
  const isMobileRef = useRef(false);
  const isFullyRevealedRef = useRef(false);
  useEffect(() => { isMobileRef.current = isMobile; }, [isMobile]);
  useEffect(() => { isFullyRevealedRef.current = isFullyRevealed; }, [isFullyRevealed]);

  // Helper: build a radial mask gradient string
  const buildMask = (r: number, x: number, y: number) =>
    `radial-gradient(circle ${r}px at ${x}px ${y}px, rgba(0,0,0,0) 0%, rgba(0,0,0,0) 99.5%, white 100%)`;

  // Attaching the ref is also when we set the composite mode — it never changes after,
  // so it stays out of the per-frame path.
  const setLayerRef = (i: number) => (el: HTMLDivElement | null) => {
    layerRefs.current[i] = el;
    if (!el || i !== 0 || maskMode === 'nested') return;
    if (maskMode === 'webkit') el.style.setProperty('-webkit-mask-composite', 'source-in');
    else el.style.setProperty('mask-composite', 'intersect');
  };

  // Whole-pixel coords: sub-pixel changes force a re-raster for no visible gain.
  const lastApplied = useRef('');
  const applyMasks = (circles: Circle[]) => {
    const grads = circles.map(c => buildMask(Math.round(c.r), Math.round(c.x), Math.round(c.y)));
    const key = grads.join('|');
    if (key === lastApplied.current) return;   // idle frames cost nothing
    lastApplied.current = key;

    if (maskMode === 'nested') {
      // Walk every layer, not just the ones we have circles for: reduced-motion drops to a
      // single circle, and a stale mask left on layers 1-2 would strand extra holes.
      for (let i = 0; i < layerRefs.current.length; i++) {
        const el = layerRefs.current[i];
        if (!el) continue;
        const g = grads[i] ?? 'none';
        el.style.setProperty('-webkit-mask-image', g);
        el.style.setProperty('mask-image', g);
      }
      return;
    }
    const el = layerRefs.current[0];
    if (!el) return;
    const value = grads.join(', ');
    // Set only the property family that matches the detected mode — mixing prefixed and
    // unprefixed mask-image lets the two composite defaults fight each other.
    if (maskMode === 'webkit') el.style.setProperty('-webkit-mask-image', value);
    else el.style.setProperty('mask-image', value);
  };

  const movementBuffer = useRef<{ x: number; y: number; time: number }[]>([]);
  const dragMs = useRef(0);
  const lastTouchAt = useRef(0);

  // Single per-frame write, so the mask and the invisible hit target can never
  // disagree about where the circle is.
  const lastHitSize = useRef(0);

  // The hit element unmounts on reveal and a brand new one mounts on hide, with no inline
  // size on it. Clearing the cache as it attaches forces the next frame to write width and
  // height again — otherwise the replacement stays 0x0 and silently eats every gesture.
  const setHitRef = (el: HTMLDivElement | null) => {
    hitRef.current = el;
    lastHitSize.current = 0;
  };
  useAnimationFrame((time, delta) => {
    const currentX = mouseX.get();
    const currentY = mouseY.get();
    const dist = Math.hypot(currentX - lastMousePos.current.x, currentY - lastMousePos.current.y);
    velocity.set((dist / (delta || 16)) * 1000);
    lastMousePos.current = { x: currentX, y: currentY };

    if (isFullyRevealedRef.current) return;   // overlay is transparent; nothing to paint

    const mobile = isMobileRef.current;
    const r = radii.current;
    // Mobile pins the lead circle to the finger so a grab never slips; desktop rides
    // the spring, which is what gives the cursor its fluid feel.
    const lead: Circle = mobile
      ? { r: r.main, x: currentX, y: currentY }
      : { r: mainRadius.get(), x: smoothX.get(), y: smoothY.get() };

    applyMasks(reducedMotion.current ? [lead] : [
      lead,
      { r: r.trail, x: trailX.get(), y: trailY.get() },
      { r: r.slow, x: slowX.get(), y: slowY.get() },
    ]);

    const hit = hitRef.current;
    if (hit) {
      const size = Math.round((lead.r + HIT_PADDING) * 2);
      if (size !== lastHitSize.current) {
        lastHitSize.current = size;
        hit.style.width = `${size}px`;
        hit.style.height = `${size}px`;
      }
      hit.style.transform = `translate3d(${Math.round(lead.x - size / 2)}px, ${Math.round(lead.y - size / 2)}px, 0)`;
    }
  });

  const accrueDesktopDistance = (x: number, y: number) => {
    const now = Date.now();
    movementBuffer.current.push({ x, y, time: now });
    movementBuffer.current = movementBuffer.current.filter(p => now - p.time < 1500);
    if (movementBuffer.current.length <= 10) return;

    let totalDist = 0;
    for (let i = 1; i < movementBuffer.current.length; i++) {
      totalDist += Math.hypot(
        movementBuffer.current[i].x - movementBuffer.current[i - 1].x,
        movementBuffer.current[i].y - movementBuffer.current[i - 1].y
      );
    }
    if (totalDist > DESKTOP_REVEAL_DIST && !showRevealButton) setShowRevealButton(true);
  };

  // One entry point for both inputs. Phones dissolve on sustained motion because patience
  // is short; wider layouts have the room to surface the Reveal button instead.
  const progressReveal = (x: number, y: number, dist: number, dt: number) => {
    if (isFullyRevealed) return;
    if (!isMobile) { accrueDesktopDistance(x, y); return; }
    if (!dt || dist / dt < MOVE_EPS) return;   // resting finger accrues nothing
    dragMs.current = Math.min(REVEAL_MS, dragMs.current + dt);
    if (dragMs.current >= REVEAL_MS) handleReveal();
  };

  const lastMouseT = useRef(0);
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!containerRef.current) return;
      // iOS fabricates a mousemove after every tap. Without this guard a single tap
      // teleports the blob across the screen.
      if (performance.now() - lastTouchAt.current < 1000) return;

      const rect = containerRef.current.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      const dist = Math.hypot(x - mouseX.get(), y - mouseY.get());

      mouseX.set(x);
      mouseY.set(y);

      if (isFullyRevealed) return;

      // A narrow desktop window gets the mobile layout but has no touch input, so mouse
      // motion feeds the same accumulator — otherwise the gallery would be unreachable there.
      const now = performance.now();
      const dt = lastMouseT.current ? now - lastMouseT.current : 16;
      lastMouseT.current = now;
      progressReveal(x, y, dist, dt);
    };

    window.addEventListener('mousemove', handleMouseMove);
    return () => window.removeEventListener('mousemove', handleMouseMove);
  }, [showRevealButton, isFullyRevealed, isMobile]);

  // ── Touch drag (all widths: phones, tablets, touchscreen laptops) ─────────────
  // No preventDefault anywhere. `touch-none` on the hit element is what stops the page
  // scrolling, which the browser decides at gesture start — unlike preventDefault, it
  // cannot arrive too late to matter.
  const drag = useRef({ active: false, id: null as number | null, dx: 0, dy: 0, lastT: 0 });

  const localPoint = (clientX: number, clientY: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    return { x: clientX - (rect?.left ?? 0), y: clientY - (rect?.top ?? 0) };
  };

  // Keep the circle inside the hero: with no fallback button, a blob dragged off-screen
  // and released would be unrecoverable.
  const clampToHero = (x: number, y: number) => {
    const rect = containerRef.current?.getBoundingClientRect();
    const w = rect?.width ?? window.innerWidth;
    // The section overshoots the viewport on mobile so its sheet covers the strip behind
    // the URL bar. Clamp to whichever is shorter, or the blob can be parked in there.
    const h = Math.min(rect?.height ?? window.innerHeight, window.innerHeight);
    const m = radii.current.main * 0.4;
    return { x: Math.max(m, Math.min(w - m, x)), y: Math.max(m, Math.min(h - m, y)) };
  };

  const handleCircleTouchStart = (e: React.TouchEvent) => {
    if (isFullyRevealed || drag.current.active) return;
    const t = e.changedTouches[0];
    const p = localPoint(t.clientX, t.clientY);
    // Preserve the grab offset so the circle doesn't jump to centre under the finger.
    drag.current = {
      active: true, id: t.identifier,
      dx: mouseX.get() - p.x, dy: mouseY.get() - p.y,
      lastT: performance.now(),
    };
    lastTouchAt.current = performance.now();
  };

  const handleCircleTouchMove = (e: React.TouchEvent) => {
    const d = drag.current;
    if (!d.active) return;
    lastTouchAt.current = performance.now();

    // Track the original finger; a second one landing mid-drag must not hijack it.
    let t: React.Touch | null = null;
    for (let i = 0; i < e.changedTouches.length; i++) {
      if (e.changedTouches[i].identifier === d.id) t = e.changedTouches[i];
    }
    if (!t) return;

    const p = localPoint(t.clientX, t.clientY);
    const next = clampToHero(p.x + d.dx, p.y + d.dy);
    const dist = Math.hypot(next.x - mouseX.get(), next.y - mouseY.get());
    const now = performance.now();
    const dt = d.lastT ? now - d.lastT : 16;
    d.lastT = now;

    mouseX.set(next.x);
    mouseY.set(next.y);
    progressReveal(next.x, next.y, dist, dt);
  };

  const handleCircleTouchEnd = () => {
    drag.current.active = false;
    drag.current.id = null;
    lastTouchAt.current = performance.now();
  };

  // Touch events are captured by whatever element received touchstart — but the dissolve
  // fires mid-drag and unmounts that element, so its touchend never arrives and the drag
  // would stay flagged active forever. Watching the window guarantees a release always
  // lands somewhere, leaving the gesture ready to start over.
  useEffect(() => {
    window.addEventListener('touchend', handleCircleTouchEnd);
    window.addEventListener('touchcancel', handleCircleTouchEnd);
    return () => {
      window.removeEventListener('touchend', handleCircleTouchEnd);
      window.removeEventListener('touchcancel', handleCircleTouchEnd);
    };
  }, []);

  const [selectedImageIndex, setSelectedImageIndex] = useState<number | null>(null);
  const touchStartX = useRef<number | null>(null);

  // Images with preview and full-quality URLs
  // Preview: ~400x400 thumbnails for grid (fast loading)
  // Full: High-resolution for lightbox
  const images = [
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/cupertinoleaves.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/cupertinoleaves.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/lovespring.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/lovespring.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/appleparkvisitor.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/appleparkvisitor.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/chicagowaves.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/chicagowaves.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/vancouverleaves.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/vancouverleaves.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/hakonejapanesemaple.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/hakonejapanesemaple.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/porscheracing.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/porscheracing.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/atlasbar.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/atlasbar.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/daisies.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/daisies.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/alaskabus.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/alaskabus.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/mttam.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/mttam.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/self4.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/self4.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/pfp.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/pfp.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/maxverstappen.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/maxverstappen.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/hakone.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/hakone.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/beautiful.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/beautiful.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/futuresamurai.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/futuresamurai.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/birdvsworld.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/birdvsworld.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/halfdome.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/halfdome.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/shibuyaskyview.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/shibuyaskyview.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/steph.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/steph.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/mbs.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/mbs.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/selffav.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/selffav.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/sfhenge.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/sfhenge.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/thebay.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/thebay.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/whistler.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/whistler.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/water.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/water.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/ucschills.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/ucschills.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/glassrain.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/glassrain.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/arashiyama.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/arashiyama.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/giantsgame.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/giantsgame.avif" },
    { preview: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/previewimges/20kgtoyota.avif", full: "https://pub-9c95b4d2e81345c4a46a362747b32ea6.r2.dev/fullimages/20kgtoyota.avif" }
  ];

  // Where the blob sits before anyone has touched it. On mobile that's the empty upper
  // area, clear of the name block at ~75%, lifted 20px to open up the gap below it.
  // Horizontally it's anchored not by its centre but by the point halfway between the
  // centre and the middle of its right edge (centre + r/2). That anchor lands on the 75%
  // mark — midway between screen centre and the right edge — which reads as sitting to the
  // right without the circle's edge crowding the screen border.
  const restPosition = (mobile: boolean) => mobile
    ? { x: window.innerWidth * 0.75 - radii.current.main / 2, y: window.innerHeight * 0.34 - 20 }
    : { x: window.innerWidth * 0.745, y: window.innerHeight * 0.265 };

  // jump() moves a spring without animating, so repositioning never shows a swoop.
  const settleAt = (x: number, y: number) => {
    [mouseX, smoothX, trailX, slowX].forEach((mv: any) => (mv.jump ? mv.jump(x) : mv.set(x)));
    [mouseY, smoothY, trailY, slowY].forEach((mv: any) => (mv.jump ? mv.jump(y) : mv.set(y)));
  };

  // Viewport sizing: layout branch, circle radii, and the resting position all follow width.
  const wasMobile = useRef<boolean | null>(null);
  useEffect(() => {
    const syncViewport = () => {
      const mobile = isMobileViewport();
      setIsMobile(mobile);
      isMobileRef.current = mobile;
      if (mobile) setShowRevealButton(false);

      radii.current = mobile
        ? (() => {
            const base = Math.min(window.innerWidth, window.innerHeight) * 0.22;
            return { main: base, trail: base * 0.8, slow: base * 0.6 };
          })()
        : { main: 100, trail: 80, slow: 60 };

      // Re-seat the blob on first run and whenever we cross the breakpoint, since the
      // two layouts want it in completely different places.
      if (wasMobile.current !== mobile) {
        wasMobile.current = mobile;
        const p = restPosition(mobile);
        settleAt(p.x, p.y);
      }
    };
    syncViewport();

    const motionQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    const syncMotion = () => { reducedMotion.current = motionQuery.matches; };
    syncMotion();

    window.addEventListener('resize', syncViewport);
    motionQuery.addEventListener('change', syncMotion);
    return () => {
      window.removeEventListener('resize', syncViewport);
      motionQuery.removeEventListener('change', syncMotion);
    };
  }, []);

  // How many rows of photos the viewport can hold. Driven off the header's measured height
  // via a ResizeObserver, which also covers the case that's easy to miss: the caption
  // re-wrapping to a third line on a rotate or a narrow window, which costs a whole row.
  // Registered after the viewport effect above so isMobileRef is current when a resize
  // fires both.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;
    const recompute = () => {
      if (!isMobileRef.current) return;
      const h = el.getBoundingClientRect().height;
      setGridRows(mobileGridRows(h, Math.floor(images.length / GRID_COLS)));
    };
    recompute();
    const ro = new ResizeObserver(recompute);
    ro.observe(el);
    window.addEventListener('resize', recompute);
    return () => {
      ro.disconnect();
      window.removeEventListener('resize', recompute);
    };
  }, []);


  // Lightbox navigation
  const handlePrevImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex - 1 + images.length) % images.length);
    }
  };
  const handleNextImage = () => {
    if (selectedImageIndex !== null) {
      setSelectedImageIndex((selectedImageIndex + 1) % images.length);
    }
  };

  // Keyboard navigation for lightbox
  useEffect(() => {
    if (selectedImageIndex === null) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') handlePrevImage();
      else if (e.key === 'ArrowRight') handleNextImage();
      else if (e.key === 'Escape') setSelectedImageIndex(null);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedImageIndex]);

  // Touch swipe handlers for mobile
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (touchStartX.current === null) return;
    const diff = e.changedTouches[0].clientX - touchStartX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) handlePrevImage();
      else handleNextImage();
    }
    touchStartX.current = null;
  };

  /* Ripple tap handler (commented out for now)
  const handleMobileTap = (e: React.TouchEvent) => {
    if (!isMobile || isFullyRevealed) return;
    const touch = e.touches[0] || e.changedTouches[0];
    if (!touch || !containerRef.current) return;

    const rect = containerRef.current.getBoundingClientRect();
    const x = touch.clientX - rect.left;
    const y = touch.clientY - rect.top;

    // Add ripple
    const id = Date.now();
    setRipples(prev => [...prev, { id, x, y }]);

    // Remove ripple after animation
    setTimeout(() => {
      setRipples(prev => prev.filter(r => r.id !== id));
    }, 1200);

    // Increment tap count and show reveal after 2 taps
    mobileTapCount.current += 1;
    if (mobileTapCount.current >= 2 && !showRevealButton) {
      setShowRevealButton(true);
    }
  };
  */

  function handleReveal() {
    setIsFullyRevealed(true);
    isFullyRevealedRef.current = true;
    setShowRevealButton(false);
    drag.current.active = false;
    drag.current.id = null;
  }

  const handleHide = () => {
    setIsFullyRevealed(false);
    isFullyRevealedRef.current = false;
    movementBuffer.current = [];
    dragMs.current = 0;              // next reveal starts from a full 1.5s again
    lastApplied.current = '';        // force a repaint of the mask we stopped updating
    setSelectedImageIndex(null);
    const p = restPosition(isMobile);
    settleAt(p.x, p.y);
  };

  // The paper sheet the blob punches through. One sheet for every width — only the
  // typography inside it differs — so there's a single masked layer to reason about.
  const overlayContent = (
    <>
      <div className="absolute inset-0 bg-[#FBFAF8]" />
      <div className="relative h-full w-full">
        {/* Scroll Indicator - Bottom Middle.
            The sheet now runs to lvh, so on mobile "bottom" is below the URL bar. Offsetting
            by (sheet height − dvh) puts the chevron back on the bottom edge of what's
            actually visible, and collapses to a plain 28px once the bar retracts. */}
        <div className={`absolute left-1/2 -translate-x-1/2 text-charcoal/20 ${isMobile ? 'bottom-[calc(100%_-_100dvh_+_1.75rem)]' : 'bottom-[28px]'}`}>
          <ChevronDown size={32} strokeWidth={1.5} />
        </div>

        {isMobile ? (
          /* Anchored to dvh, not to the sheet: the sheet overshoots to lvh to cover the
             strip behind the URL bar, and centring in that box would push the name down
             out of sight whenever the bar is showing. */
          <div className="absolute inset-x-0 top-0 h-dvh flex flex-col justify-center items-start text-left px-6">
            {/* Name + kicker share one shrink-to-fit column set by the widest line
                ("Vishwakarma"), both flush to its left edge.
                translate-y offsets the group down from the container's vertical centre so the
                name sits ~75% down the viewport, kicker trailing below it. dvh, not vh: vh is
                the URL-bar-hidden height, which would drop the group too far while the bar
                is up — the container centres on dvh, so the offset has to as well. */}
            <div className="flex flex-col translate-y-[23dvh]">
              {/* Oversized statement name - stacked, near-bleed to the right margin */}
              <h1 className="font-serif font-normal text-charcoal leading-[0.9] tracking-[-0.03em] text-[clamp(2.75rem,15vw,7rem)]">
                <span className="block">Aditya</span>
                <span className="block text-moss">Vishwakarma</span>
              </h1>

              {/* Role kicker - Nimbus Sans, matches desktop family.
                  Left-aligned, sharing the name's left edge. Tracking only adds space to the
                  right of each glyph, so no margin correction is needed on this side. */}
              <div className="mt-7 text-left font-sans uppercase text-charcoal/50 tracking-[0.18em] text-[13px] leading-[1.9]">
                <span className="block">Product Manager</span>
                <span className="block">Based in San Francisco</span>
              </div>
            </div>
          </div>
        ) : (
          /* Bottom-Left Stack Container */
          <div className="absolute bottom-[60px] left-[60px] flex flex-col items-start whitespace-nowrap">
            {/* Role Stack */}
            <div className="flex flex-col font-sans mb-[clamp(20px,3.6vw,58px)]">
              <span className="text-[clamp(14px,2.2vw,28px)] font-medium tracking-[0.02em] leading-[1.4] text-charcoal/70 normal-case">
                Product Manager
              </span>
              <span className="text-[clamp(14px,2.2vw,28px)] font-medium tracking-[0.02em] leading-[1.4] text-charcoal/70 normal-case">
                Based in San Francisco
              </span>
            </div>

            {/* Name Stack */}
            <div className="flex flex-col items-start font-serif font-normal text-[12vw] leading-[0.92] text-charcoal">
              <span className="tracking-[-0.04em] -ml-[0.06em]">Aditya</span>
              <span className="text-moss tracking-[-0.02em] -ml-[0.05em]">Vishwakarma</span>
            </div>
          </div>
        )}
      </div>
    </>
  );

  return (
    <section
      ref={containerRef}
      /* h-dvh, not h-screen: iOS reports 100vh as the height with the URL bar hidden, so
         the hero overflowed and the chevron sat below the fold on first paint.
         On phones dvh alone still leaves a gap — it shrinks back to the URL-bar-visible
         height, and the top of About shows through the strip behind the bar. lvh is the
         tallest the viewport ever gets, so the sheet always reaches the true bottom edge.
         It's a min-height, not a height, so a browser without lvh just keeps the dvh box.
         Everything inside that needs to stay on screen is measured against dvh instead. */
      className={`relative h-dvh max-[739px]:min-h-[100lvh] w-full flex flex-col justify-center items-center overflow-hidden bg-[#D4DCDA] ${!isMobile && isHovered && !isFullyRevealed && selectedImageIndex === null ? 'cursor-none' : ''}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* LAYER 1: BOTTOM GALLERY (Apple Photos Style) */}
      {/* On mobile the header + grid center as one group so the caption sits just above
           the photos instead of being pinned to the top of the viewport. */}
      <div className={`absolute z-0 flex flex-col ${isMobile ? 'inset-x-0 top-0 h-dvh justify-center' : 'inset-0'}`}>
        {/* HEADER BAR — mounted at all times, not just once revealed. It's what the row
             count is measured from, and reserving its space up front means the grid no
             longer jumps down when the gallery opens. Invisible and inert until then. */}
        <motion.div
          ref={headerRef}
          initial={false}
          animate={{ opacity: isFullyRevealed ? 1 : 0, y: isFullyRevealed ? 0 : -10 }}
          aria-hidden={!isFullyRevealed}
          className={`w-full z-20 flex justify-between items-center gap-3 ${isFullyRevealed ? 'pointer-events-auto' : 'pointer-events-none'} ${isMobile ? 'px-5 pb-4' : 'pt-10 pl-4 md:pl-10 pr-10 pb-4'}`}
        >
              <p className={`font-serif text-charcoal/80 max-w-[70%] ${isMobile ? 'text-[17px] leading-snug' : 'text-xl md:text-2xl leading-none transform translate-y-[2px]'}`}>
                {isMobile ? "I'm also a hobbyist photographer, here are some of my favorites!" : "I'm also a hobbyist photographer, here are some of my favorites!"}
              </p>

              <motion.button
                onClick={handleHide}
                tabIndex={isFullyRevealed ? 0 : -1}
                className={`bg-moss text-white rounded-full font-sans tracking-[0.1em] uppercase hover:bg-charcoal transition-all active:scale-95 shrink-0 ${isMobile ? 'inline-flex items-center justify-center min-h-[44px] px-5 text-[11px] shadow-lg' : 'w-[140px] py-3 text-sm shadow-2xl'}`}
              >
                Hide
              </motion.button>
        </motion.div>

        {/* PHOTO GRID - 4x8 on desktop; on mobile the viewport picks the row count.
             The aspect ratio has to track that count for the cells to stay square, and
             Tailwind can't emit a class for a runtime value, so mobile sets it inline and
             the classes cover the widths where the count is static. max-h-full stays as a
             backstop: if a viewport is too short even for GRID_MIN_ROWS, the grid gives up
             square cells rather than pushing the hero into a scroll. */}
        <div className={`w-full min-h-0 flex items-center justify-center p-2 md:p-6 transition-all duration-1000 ${isMobile ? '' : 'flex-1'} ${isFullyRevealed ? "opacity-100" : "opacity-40"}`}>
          <div
            className="grid grid-cols-4 md:grid-cols-8 gap-0.5 w-full max-h-full aspect-[4/6] md:aspect-[2/1]"
            style={isMobile ? { aspectRatio: `${GRID_COLS} / ${gridRows}` } : undefined}
          >
            {(isMobile ? images.slice(0, gridRows * GRID_COLS) : images).map((img, i) => (
              <motion.div
                key={i}
                whileHover={{ scale: 1.05, zIndex: 10, transition: { duration: 0.2 } }}
                onClick={() => isFullyRevealed && setSelectedImageIndex(i)}
                className="cursor-pointer overflow-hidden w-full h-full shadow-sm hover:shadow-2xl transition-shadow bg-white/10"
              >
                <img
                  src={img.preview}
                  className="w-full h-full object-cover"
                  alt={`Gallery ${i}`}
                  loading="eager"
                  // @ts-ignore
                  fetchpriority="high"
                />
              </motion.div>
            ))}
          </div>
        </div>

        {/* LIGHTBOX POPUP */}
        <AnimatePresence>
          {selectedImageIndex !== null && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-[60] flex items-center justify-center bg-black/70 backdrop-blur-sm"
              onClick={() => setSelectedImageIndex(null)}
              onTouchStart={handleTouchStart}
              onTouchEnd={handleTouchEnd}
            >
              {/* Close Button - Top Right */}
              <button
                onClick={() => setSelectedImageIndex(null)}
                className="absolute top-6 right-6 text-white/70 hover:text-white transition-colors z-10"
              >
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="6" x2="6" y2="18"></line><line x1="6" y1="6" x2="18" y2="18"></line></svg>
              </button>

              {/* Left Arrow (hidden on mobile) */}
              <button
                onClick={(e) => { e.stopPropagation(); handlePrevImage(); }}
                className="hidden md:flex absolute left-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="15 18 9 12 15 6"></polyline></svg>
              </button>

              {/* Right Arrow (hidden on mobile) */}
              <button
                onClick={(e) => { e.stopPropagation(); handleNextImage(); }}
                className="hidden md:flex absolute right-6 top-1/2 -translate-y-1/2 text-white/70 hover:text-white transition-colors z-10"
              >
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><polyline points="9 18 15 12 9 6"></polyline></svg>
              </button>

              {/* Image - Uses full resolution */}
              <motion.img
                key={selectedImageIndex}
                src={images[selectedImageIndex].full}
                initial={{ scale: 0.9, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0.9, opacity: 0 }}
                transition={{ type: "spring", damping: 25, stiffness: 300 }}
                className="max-w-[90vw] max-h-[85vh] object-contain shadow-2xl"
                alt="Enlarged"
                onClick={(e: any) => e.stopPropagation()}
                loading="lazy"
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* LAYER 2: CSS-MASKED OVERLAY — every width now. The three circles are combined
           into one hole by the technique detected at mount; see detectMaskMode above. */}
      <motion.div
        className="absolute inset-0 z-10 pointer-events-none"
        animate={{ opacity: isFullyRevealed ? 0 : 1 }}
        transition={{ duration: 0.8 }}
      >
        {maskMode === 'nested' ? (
          <div ref={setLayerRef(0)} className="absolute inset-0">
            <div ref={setLayerRef(1)} className="absolute inset-0">
              <div ref={setLayerRef(2)} className="absolute inset-0">
                {overlayContent}
              </div>
            </div>
          </div>
        ) : (
          <div ref={setLayerRef(0)} className="absolute inset-0">
            {overlayContent}
          </div>
        )}
      </motion.div>

      {/* Invisible grab target tracking the lead circle. It exists so the browser — not our
           JS — decides at gesture start whether this touch scrolls the page, via touch-none.
           The visible circle is a hole in a mask and cannot be hit-tested. Its size and
           position are written in the same frame as the mask, so they cannot drift apart.
           Rendered at all widths: touchscreen laptops are real. */}
      {!isFullyRevealed && (
        <div
          ref={setHitRef}
          onTouchStart={handleCircleTouchStart}
          onTouchMove={handleCircleTouchMove}
          onTouchEnd={handleCircleTouchEnd}
          onTouchCancel={handleCircleTouchEnd}
          className="absolute top-0 left-0 z-20 rounded-full pointer-events-auto touch-none select-none [-webkit-touch-callout:none] [will-change:transform]"
          aria-hidden="true"
        />
      )}


      {/* UI CONTROLS - Only show Reveal button (Hide is now in header), desktop only */}
      <div className="absolute top-10 right-10 z-50 pointer-events-auto">
        <AnimatePresence mode="wait">
          {!isMobile && showRevealButton && !isFullyRevealed && (
            <motion.button
              key="reveal-btn" onClick={handleReveal}
              initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, scale: 0.9 }}
              className="w-[140px] py-3 bg-moss text-white rounded-full font-sans text-sm tracking-[0.01em] uppercase hover:bg-charcoal transition-all shadow-2xl active:scale-95"
            >
              Reveal
            </motion.button>
          )}
        </AnimatePresence>
      </div>
    </section >
  );
};

export default Hero;
