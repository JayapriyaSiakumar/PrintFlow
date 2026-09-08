import React from 'react';
import { ZoomIn, ZoomOut, RotateCcw, Maximize2 } from 'lucide-react';

interface ZoomControlsProps {
  zoom: number;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onResetZoom: () => void;
  onFitToScreen: () => void;
  minZoom?: number;
  maxZoom?: number;
}

export const ZoomControls: React.FC<ZoomControlsProps> = ({
  zoom,
  onZoomIn,
  onZoomOut,
  onResetZoom,
  onFitToScreen,
  minZoom = 0.5,
  maxZoom = 2.5,
}) => {
  const percentage = Math.round(zoom * 100);

  return (
    <div
      id="customizer-zoom-controls"
      className="inline-flex items-center gap-1 bg-white/95 backdrop-blur-md px-2 py-1.5 rounded-xl border border-[#dce2ee] shadow-md shadow-black/5 text-[#1a1c1c]"
    >
      <button
        id="btn-zoom-out"
        onClick={onZoomOut}
        disabled={zoom <= minZoom}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f4fc] disabled:opacity-40 disabled:hover:bg-transparent text-[#1a1c1c] transition-colors"
        title="Zoom Out (Ctrl + Scroll Down)"
        type="button"
      >
        <ZoomOut className="w-4 h-4" />
      </button>

      <button
        id="btn-reset-zoom"
        onClick={onResetZoom}
        className="px-2.5 py-1 text-xs font-semibold font-mono hover:bg-[#f0f4fc] rounded-md transition-colors text-[#0058be]"
        title="Click to reset zoom to 100%"
        type="button"
      >
        {percentage}%
      </button>

      <button
        id="btn-zoom-in"
        onClick={onZoomIn}
        disabled={zoom >= maxZoom}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f4fc] disabled:opacity-40 disabled:hover:bg-transparent text-[#1a1c1c] transition-colors"
        title="Zoom In (Ctrl + Scroll Up)"
        type="button"
      >
        <ZoomIn className="w-4 h-4" />
      </button>

      <div className="w-[1px] h-4 bg-[#e2e2e2] mx-0.5" />

      <button
        id="btn-fit-screen"
        onClick={onFitToScreen}
        className="w-8 h-8 rounded-lg flex items-center justify-center hover:bg-[#f0f4fc] text-[#555f6f] hover:text-[#1a1c1c] transition-colors"
        title="Fit Design to Viewport"
        type="button"
      >
        <Maximize2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
};
