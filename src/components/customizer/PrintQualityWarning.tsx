import React from 'react';
import { AlertTriangle, CheckCircle2, ShieldAlert } from 'lucide-react';
import { DesignElement } from '../../types';
import { PrintableAreaConfig } from './types';

interface PrintQualityWarningProps {
  elements: DesignElement[];
  printArea: PrintableAreaConfig;
}

export const PrintQualityWarning: React.FC<PrintQualityWarningProps> = ({ elements, printArea }) => {
  // Check boundary violations
  const outOfBounds = elements.some((el) => {
    const right = el.x + el.width * (el.scaleX || 1);
    const bottom = el.y + el.height * (el.scaleY || 1);
    return el.x < 0 || el.y < 0 || right > printArea.width || bottom > printArea.height;
  });

  // Check safe margin violations
  const inSafeMargin = elements.some((el) => {
    const right = el.x + el.width * (el.scaleX || 1);
    const bottom = el.y + el.height * (el.scaleY || 1);
    const margin = printArea.safeMargin;
    return (
      el.x < margin ||
      el.y < margin ||
      right > printArea.width - margin ||
      bottom > printArea.height - margin
    );
  });

  // Check DPI quality of images
  // In print on demand, display width 200px represents roughly 8 inches.
  // Effective DPI = (naturalWidth / displayWidth) * 72 (approx)
  const lowResImages = elements.filter((el) => {
    if (el.type !== 'image' || !el.naturalWidth) return false;
    const currentDisplayWidth = el.width * (el.scaleX || 1);
    const estimatedDpi = (el.naturalWidth / currentDisplayWidth) * 72;
    return estimatedDpi < 150;
  });

  if (elements.length === 0) {
    return (
      <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-gray-50 border border-gray-200 text-xs text-gray-500 font-medium">
        <CheckCircle2 className="w-3.5 h-3.5 text-gray-400" />
        <span>Canvas ready: Add your graphics or custom text</span>
      </div>
    );
  }

  if (outOfBounds) {
    return (
      <div
        id="quality-alert-boundary"
        className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-red-50/90 border border-red-200 text-xs text-[#ba1a1a] animate-in fade-in"
      >
        <ShieldAlert className="w-4 h-4 flex-shrink-0 mt-0.5 text-red-600" />
        <div>
          <strong className="font-semibold block text-[11px] uppercase tracking-wider">Outside Printable Area</strong>
          <span>One or more elements extend beyond the printable boundary and may be clipped during printing.</span>
        </div>
      </div>
    );
  }

  if (lowResImages.length > 0) {
    return (
      <div
        id="quality-alert-dpi"
        className="flex items-start gap-2.5 px-3 py-2 rounded-xl bg-amber-50/90 border border-amber-200 text-xs text-amber-900 animate-in fade-in"
      >
        <AlertTriangle className="w-4 h-4 flex-shrink-0 mt-0.5 text-amber-600" />
        <div>
          <strong className="font-semibold block text-[11px] uppercase tracking-wider">Low Resolution Notice</strong>
          <span>Your uploaded image is scaled large. It may appear slightly soft or pixelated when printed at this size.</span>
        </div>
      </div>
    );
  }

  if (inSafeMargin) {
    return (
      <div
        id="quality-alert-safemargin"
        className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-50/80 border border-blue-200 text-xs text-blue-800"
      >
        <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 text-blue-600" />
        <span>Elements close to seam safe-zone margin.</span>
      </div>
    );
  }

  return (
    <div
      id="quality-alert-passed"
      className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-50/80 border border-emerald-200 text-xs text-emerald-800 font-medium"
    >
      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
      <span>Print Ready: High resolution & within safe boundaries</span>
    </div>
  );
};
