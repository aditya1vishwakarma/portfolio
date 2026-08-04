import React, { useCallback, useState } from 'react';
import Clouds, { type CloudsOptions } from './Clouds';
import CloudControls from './CloudControls';
import RestPlates from './RestPlates';
import { REST_BACKGROUND_URL, REST_CLOUD_OPTIONS, REST_PLATES } from '../../constants';

/* ─────────────────────────────────────────────
 * (Rest) — the mood board's quiet room.
 *
 * Three stacked layers, bottom to top:
 *   z-0   the full-bleed backdrop, object-cover so it fills any aspect
 *   z-10  the WebGL cloud field, drifting on its own (pointer wind is off —
 *         see the note in Clouds.tsx)
 *   z-20  the photographs, breathing in and out
 *   z-30  the Controls panel
 *
 * Cloud settings live here as state rather than in the module constant, so the
 * panel can drive them live. <Clouds> reads them through setOptions() on every
 * render, which is exactly the mechanism a slider needs — the instance is never
 * torn down and rebuilt mid-drag.
 *
 * Still memoised: the parent re-renders when the top chrome fades in and out,
 * and there's no reason to push a setOptions() through the shader for that.
 * ───────────────────────────────────────────── */

interface RestViewProps {
  /** False once the pointer has been still a while — chrome fades out. */
  chromeVisible: boolean;
  /** Lets the page keep chrome pinned while the panel is open. */
  onPanelOpenChange: (open: boolean) => void;
}

const RestView: React.FC<RestViewProps> = ({ chromeVisible, onPanelOpenChange }) => {
  // The backdrop is one image; fading it in beats a half-painted flash.
  const [bgLoaded, setBgLoaded] = useState(false);
  const [options, setOptions] = useState<CloudsOptions>(() => ({ ...REST_CLOUD_OPTIONS }));
  const [panelOpen, setPanelOpen] = useState(false);

  const handleOpenChange = useCallback((open: boolean) => {
    setPanelOpen(open);
    onPanelOpenChange(open);
  }, [onPanelOpenChange]);

  const handleReset = useCallback(() => setOptions({ ...REST_CLOUD_OPTIONS }), []);

  return (
    <div className="absolute inset-0 overflow-hidden">
      <img
        src={REST_BACKGROUND_URL}
        alt=""
        aria-hidden="true"
        draggable={false}
        decoding="async"
        onLoad={() => setBgLoaded(true)}
        className="absolute inset-0 z-0 w-full h-full object-cover select-none transition-opacity duration-700"
        style={{ opacity: bgLoaded ? 1 : 0 }}
      />

      <Clouds style={{ position: 'absolute', inset: 0, zIndex: 10 }} {...options}>
        {/* The cloud layer composites over whatever it wraps; here that's
            nothing — the backdrop below simply shows through the shader's
            transparent output. The div only exists to give the instance a
            sized element to observe. */}
        <div className="w-full h-full" />
      </Clouds>

      <RestPlates plates={REST_PLATES} />

      <CloudControls
        options={options}
        onChange={setOptions}
        onReset={handleReset}
        open={panelOpen}
        onOpenChange={handleOpenChange}
        // An open panel outranks the idle timer — otherwise the controls you're
        // reading fade out from under you the moment you stop moving the mouse.
        visible={chromeVisible || panelOpen}
      />
    </div>
  );
};

export default React.memo(RestView);
