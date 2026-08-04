import React from 'react';
import { motion as motionComponent, AnimatePresence } from 'framer-motion';
import type { CloudsOptions } from './Clouds';

const motion = motionComponent as any;

/* ─────────────────────────────────────────────
 * CloudControls — a live editor for the cloud shader, bottom-left of (Rest).
 *
 * Same glass as the view toggle and the Home pill: white/50 over a heavy
 * backdrop-blur, hairline charcoal border, serif-italic label. Sliders reuse
 * the page's `.mood-slider` class (the hairline charcoal thumb from the ring's
 * speed control) so this reads as part of the same instrument panel.
 *
 * Notably absent: `wind` and `windRadius`, because pointer-driven wind is
 * switched off in Clouds.tsx; and `refraction` and `fogBlur`, which only do
 * anything on Chrome's experimental html-in-canvas path (`uHasContent`), never
 * on the DOM-overlay path every browser actually takes here. Four sliders that
 * provably do nothing are worse than four missing ones — they're listed at the
 * bottom of this file so they're easy to restore if either changes.
 * ───────────────────────────────────────────── */

interface Spec {
  key: keyof CloudsOptions;
  label: string;
  min: number;
  max: number;
  step: number;
}

const SPECS: Spec[] = [
  { key: 'scale', label: 'Scale', min: 0.05, max: 4, step: 0.01 },
  { key: 'speed', label: 'Speed', min: 0, max: 4, step: 0.05 },
  { key: 'cover', label: 'Cover', min: 0, max: 1, step: 0.01 },
  { key: 'density', label: 'Density', min: 0, max: 6, step: 0.05 },
  { key: 'opacity', label: 'Opacity', min: 0, max: 1, step: 0.01 },
  { key: 'shading', label: 'Shading', min: 0, max: 2, step: 0.01 },
  { key: 'shadow', label: 'Shadow', min: 0, max: 1, step: 0.01 },
  { key: 'shadowOffsetX', label: 'Shadow X', min: -600, max: 600, step: 5 },
  { key: 'shadowOffsetY', label: 'Shadow Y', min: -600, max: 600, step: 5 },
  { key: 'shadowSoftness', label: 'Softness', min: 0, max: 1, step: 0.01 },
  { key: 'quality', label: 'Quality', min: 0.2, max: 1, step: 0.05 },
];

// Upstream's defaults, so a slider always has a number to sit on even when the
// project's REST_CLOUD_OPTIONS doesn't mention that key.
const FALLBACKS: Record<string, number> = {
  scale: 1, speed: 0.6, cover: 0.1, density: 2.5, shading: 0.1,
  opacity: 0.64, shadow: 0.06, shadowOffsetX: 200, shadowOffsetY: -10,
  shadowSoftness: 1, quality: 1,
};

const fmt = (v: number, step: number) =>
  step >= 1 ? String(Math.round(v)) : v.toFixed(2);

const toHex = (c: [number, number, number]) =>
  '#' + c.map((n) => Math.round(Math.min(Math.max(n, 0), 1) * 255)
    .toString(16).padStart(2, '0')).join('');

const fromHex = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
];

interface CloudControlsProps {
  options: CloudsOptions;
  onChange: (next: CloudsOptions) => void;
  onReset: () => void;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** False once the pointer has gone idle — the panel fades with the rest of the chrome. */
  visible: boolean;
}

const CloudControls: React.FC<CloudControlsProps> = ({
  options, onChange, onReset, open, onOpenChange, visible,
}) => {
  const set = (key: keyof CloudsOptions, value: number | [number, number, number] | 'auto') =>
    onChange({ ...options, [key]: value });

  const color = options.color ?? 'auto';
  const isAuto = color === 'auto';

  return (
    <div
      className={`absolute z-30 left-8 bottom-[calc(2rem_+_env(safe-area-inset-bottom))] flex flex-col items-start gap-3 transition-opacity duration-500 ${visible ? 'opacity-100' : 'opacity-0'
        }`}
      // Invisible chrome must not swallow clicks. Any mouse movement brings it
      // back before a click can land, but a cursor already parked on the button
      // when it fades would otherwise still be live.
      style={{ pointerEvents: visible ? 'auto' : 'none' }}
    >
      <AnimatePresence>
        {open && (
          <motion.div
            key="cloud-panel"
            // Scale/translate only — no opacity on the glass itself. An ancestor
            // at opacity < 1 makes WebKit sample a not-yet-composited backdrop
            // and flash near-white, the same trap documented on the mobile card.
            initial={{ scale: 0.94, y: 10 }}
            animate={{ scale: 1, y: 0 }}
            exit={{ scale: 0.94, y: 10 }}
            transition={{ type: 'spring', stiffness: 420, damping: 34 }}
            style={{
              transformOrigin: 'bottom left',
              background: 'rgba(255,255,255,0.5)',
              backdropFilter: 'blur(24px) saturate(160%)',
              WebkitBackdropFilter: 'blur(24px) saturate(160%)',
              borderRadius: 22,
            }}
            // overflow-x-hidden matters: with overflow-y set, CSS promotes the
            // other axis from `visible` to `auto`, and the range inputs' intrinsic
            // width was enough to raise a horizontal scrollbar across the panel.
            className="cloud-panel-scroll w-[272px] max-h-[68vh] overflow-y-auto overflow-x-hidden border border-charcoal/10 shadow-lg p-5"
          >
            <div className="flex flex-col gap-1.5">
              {SPECS.map((s) => {
                const value = (options[s.key] as number) ?? FALLBACKS[s.key];
                const pct = Math.min(100, Math.max(0,
                  ((value - s.min) / (s.max - s.min)) * 100));
                return (
                  /* The whole row IS the track. A native range input sits on top
                     at opacity 0 — invisible but fully interactive — so we keep
                     click-to-jump, drag-to-scrub, and arrow-key stepping for
                     free, and paint our own fill underneath. Styling the real
                     input's thumb was never going to get us a full-height row. */
                  <label
                    key={s.key}
                    className="relative block h-11 rounded-[12px] overflow-hidden cursor-ew-resize bg-charcoal/[0.05] focus-within:ring-1 focus-within:ring-charcoal/20"
                  >
                    <div
                      className="absolute inset-y-0 left-0 rounded-[12px] bg-charcoal/[0.11] pointer-events-none"
                      style={{ width: `${pct}%` }}
                    />
                    {/* Tick riding the fill's leading edge. */}
                    <div
                      className="absolute inset-y-[7px] w-[3px] rounded-full bg-charcoal/25 pointer-events-none"
                      style={{ left: `calc(${pct}% - 1.5px)` }}
                    />
                    <div className="absolute inset-0 flex items-center justify-between px-3.5 pointer-events-none">
                      <span className="text-[13px] text-charcoal/85">{s.label}</span>
                      <span className="text-[13px] tabular-nums text-charcoal/55">
                        {fmt(value, s.step)}
                      </span>
                    </div>
                    <input
                      type="range"
                      aria-label={s.label}
                      min={s.min}
                      max={s.max}
                      step={s.step}
                      value={value}
                      onChange={(e) => set(s.key, parseFloat(e.target.value))}
                      className="cloud-range absolute inset-0 w-full h-full opacity-0 cursor-ew-resize m-0"
                    />
                  </label>
                );
              })}

              {/* Colour: 'auto' samples the nearest opaque background behind the
                  layer; otherwise it's a literal RGB the shader tints toward.
                  Same row shell as a slider, minus the fill. */}
              <div className="relative flex h-11 items-center justify-between rounded-[12px] bg-charcoal/[0.05] pl-3.5 pr-2">
                <span className="text-[13px] text-charcoal/85">Colour</span>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => set('color', isAuto ? fromHex('#ffffff') : 'auto')}
                    className={`text-[13px] transition-colors duration-300 ${isAuto ? 'text-charcoal/55' : 'text-charcoal/35 hover:text-charcoal/55'
                      }`}
                  >
                    {isAuto ? 'Auto' : toHex(color as [number, number, number])}
                  </button>
                  <input
                    type="color"
                    aria-label="Cloud colour"
                    value={isAuto ? '#ffffff' : toHex(color as [number, number, number])}
                    onChange={(e) => set('color', fromHex(e.target.value))}
                    className="cloud-swatch h-7 w-7 shrink-0 cursor-pointer rounded-full border border-charcoal/15 bg-transparent p-0"
                  />
                </div>
              </div>

              <button
                onClick={onReset}
                className="mt-1.5 self-start px-1 text-[12px] text-charcoal/40 hover:text-charcoal/70 transition-colors duration-300"
              >
                Reset
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* The site's global scrollbar is an 8px grey slab — far too heavy for a
          glass panel this size. Scoped override only. */}
      <style>{`
        .cloud-panel-scroll { scrollbar-width: thin; scrollbar-color: rgba(51,51,51,0.22) transparent; }
        .cloud-panel-scroll::-webkit-scrollbar { width: 4px; height: 0; }
        .cloud-panel-scroll::-webkit-scrollbar-track { background: transparent; }
        .cloud-panel-scroll::-webkit-scrollbar-thumb { background: rgba(51,51,51,0.22); border-radius: 4px; }

        /* The invisible scrubber. Track and thumb are both stretched to the full
           row so a press anywhere in the row registers, and the thumb is 1px
           wide so the pointer-x -> value mapping runs edge to edge: a real thumb
           insets the usable range by half its width at each end, which would put
           the painted fill visibly out of step with the cursor. */
        .cloud-range { -webkit-appearance: none; appearance: none; background: transparent; }
        .cloud-range::-webkit-slider-runnable-track { height: 100%; background: transparent; }
        .cloud-range::-webkit-slider-thumb {
          -webkit-appearance: none; appearance: none;
          width: 1px; height: 100%; background: transparent; border: 0;
        }
        .cloud-range::-moz-range-track { height: 100%; background: transparent; }
        .cloud-range::-moz-range-thumb { width: 1px; height: 100%; background: transparent; border: 0; }

        /* Native colour wells paint an inset swatch with their own chrome; strip
           it back to a plain circle. */
        .cloud-swatch { -webkit-appearance: none; appearance: none; overflow: hidden; }
        .cloud-swatch::-webkit-color-swatch-wrapper { padding: 0; }
        .cloud-swatch::-webkit-color-swatch { border: none; border-radius: 9999px; }
        .cloud-swatch::-moz-color-swatch { border: none; border-radius: 9999px; }
      `}</style>

      <button
        onClick={() => onOpenChange(!open)}
        aria-expanded={open}
        className="flex items-center gap-2 font-serif italic font-medium text-base px-5 py-2 text-charcoal bg-white/50 border border-charcoal/10 rounded-[18px] backdrop-blur-xl hover:bg-white/60 hover:border-charcoal/20 transition-all duration-500 shadow-lg active:scale-95"
      >
        Controls
        <motion.svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ type: 'spring', stiffness: 420, damping: 30 }}
          className="text-charcoal/45"
        >
          <polyline points="18 15 12 9 6 15" />
        </motion.svg>
      </button>
    </div>
  );
};

export default CloudControls;

/* Inert in this configuration — restore to SPECS if you re-enable pointer wind
 * in Clouds.tsx, or if html-in-canvas ever ships beyond a Chrome flag:
 *
 *   { key: 'wind',       label: 'Wind',        min: 0,  max: 1,   step: 0.01 },
 *   { key: 'windRadius', label: 'Wind Radius', min: 10, max: 900, step: 10   },
 *   { key: 'refraction', label: 'Refraction',  min: 0,  max: 120, step: 1    },
 *   { key: 'fogBlur',    label: 'Fog Blur',    min: 0,  max: 1,   step: 0.01 },
 */
