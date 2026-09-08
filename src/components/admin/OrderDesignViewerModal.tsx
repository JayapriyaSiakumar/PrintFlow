import React, { useState } from 'react';
import { X, Palette, Download, ExternalLink, Code, Layers, FileText } from 'lucide-react';
import { CustomDesign } from '../../types';

interface OrderDesignViewerModalProps {
  isOpen: boolean;
  onClose: () => void;
  design: CustomDesign | any | null;
}

export const OrderDesignViewerModal: React.FC<OrderDesignViewerModalProps> = ({
  isOpen,
  onClose,
  design,
}) => {
  const [activeSide, setActiveSide] = useState<'front' | 'back'>('front');
  const [showRawJson, setShowRawJson] = useState<boolean>(false);

  if (!isOpen || !design) return null;

  const sides = design.designConfig?.sides || design.sides || {};
  const frontElements = sides.front?.elements || [];
  const backElements = sides.back?.elements || [];
  const activeElements = activeSide === 'front' ? frontElements : backElements;

  const currentPreview =
    activeSide === 'front'
      ? design.previewFrontUrl || design.previewDataUrl || design.productImage
      : design.previewBackUrl || design.previewDataUrl || design.productImage;

  return (
    <div
      id="modal-order-design-viewer"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 sm:p-6 animate-in fade-in"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-4xl bg-white rounded-3xl shadow-2xl border border-gray-200 overflow-hidden flex flex-col max-h-[90vh]"
      >
        {/* Header */}
        <div className="p-5 border-b border-[#eeeeee] flex items-center justify-between bg-[#fcfcfd]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c]">
                Custom Artwork Pre-Flight Inspector
              </h3>
              <p className="text-xs text-[#555f6f]">
                Order Design ID: <span className="font-mono">{design.id || design.designId}</span>
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-8 h-8 rounded-full bg-gray-100 hover:bg-gray-200 flex items-center justify-center text-gray-700 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Body */}
        <div className="flex-1 overflow-y-auto p-6 grid grid-cols-1 md:grid-cols-12 gap-6">
          {/* Left: Preview Mockup */}
          <div className="md:col-span-6 bg-[#f8fafc] p-6 rounded-2xl border border-[#e2e8f0] flex flex-col items-center justify-between">
            {/* Side Switcher */}
            <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-gray-200 shadow-xs">
              <button
                onClick={() => setActiveSide('front')}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  activeSide === 'front'
                    ? 'bg-[#0058be] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Front View ({frontElements.length})
              </button>
              <button
                onClick={() => setActiveSide('back')}
                className={`px-4 py-1 rounded-full text-xs font-bold transition-all ${
                  activeSide === 'back'
                    ? 'bg-[#0058be] text-white shadow-xs'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                Back View ({backElements.length})
              </button>
            </div>

            <div className="w-full max-w-xs aspect-square flex items-center justify-center my-4">
              <img
                src={currentPreview}
                alt="Order Artwork Preview"
                className="w-full h-full object-contain drop-shadow-md"
              />
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  const a = document.createElement('a');
                  a.href = currentPreview;
                  a.download = `artwork-${design.id}-${activeSide}.png`;
                  a.click();
                }}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
              >
                <Download className="w-3.5 h-3.5 text-[#0058be]" />
                <span>Export Print Preview</span>
              </button>
              <button
                onClick={() => setShowRawJson(!showRawJson)}
                className="px-3 py-1.5 rounded-lg bg-white border border-gray-200 text-xs font-semibold text-gray-800 hover:bg-gray-50 flex items-center gap-1.5 shadow-xs"
              >
                <Code className="w-3.5 h-3.5 text-purple-600" />
                <span>{showRawJson ? 'Hide JSON' : 'Raw JSON'}</span>
              </button>
            </div>
          </div>

          {/* Right: Layer Inspector & Print Specs */}
          <div className="md:col-span-6 space-y-4">
            <div>
              <h4 className="font-bold text-sm text-[#1a1c1c]">{design.name || design.productName}</h4>
              <p className="text-xs text-[#555f6f] mt-0.5">
                Product: {design.productName} • Color: {design.selectedColorHex} • Size: {design.selectedSize || 'M'}
              </p>
            </div>

            {showRawJson ? (
              <div className="p-3 bg-gray-900 text-green-400 font-mono text-[11px] rounded-xl overflow-x-auto max-h-96">
                <pre>{JSON.stringify(design, null, 2)}</pre>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between text-xs font-bold text-gray-700 uppercase tracking-wider">
                  <span className="flex items-center gap-1">
                    <Layers className="w-3.5 h-3.5 text-[#0058be]" />
                    Print Layers on {activeSide}
                  </span>
                  <span>{activeElements.length} Items</span>
                </div>

                {activeElements.length === 0 ? (
                  <div className="p-6 text-center bg-gray-50 rounded-xl border border-gray-200 text-xs text-gray-500">
                    No custom elements placed on this side.
                  </div>
                ) : (
                  <div className="space-y-2 max-h-72 overflow-y-auto">
                    {activeElements.map((el: any, i: number) => (
                      <div
                        key={el.id || i}
                        className="p-3 rounded-xl border border-gray-200 bg-white shadow-xs space-y-1 text-xs"
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-[#1a1c1c] capitalize">
                            {el.type === 'text' ? '🔤 Text Element' : '🖼️ Graphic Asset'}
                          </span>
                          <span className="text-[10px] font-mono text-gray-400">ID: {el.id}</span>
                        </div>

                        {el.type === 'text' ? (
                          <div className="text-[11px] text-gray-600 space-y-0.5">
                            <p>
                              <strong>Content:</strong> <span className="text-[#0058be]">"{el.text}"</span>
                            </p>
                            <p>
                              <strong>Font:</strong> {el.fontFamily} ({el.fontSize}pt, {el.fontStyle || 'normal'})
                            </p>
                            <p className="flex items-center gap-1">
                              <strong>Ink Color:</strong>
                              <span
                                className="w-3 h-3 rounded-full inline-block border border-black/10"
                                style={{ backgroundColor: el.fill }}
                              />
                              {el.fill}
                            </p>
                          </div>
                        ) : (
                          <div className="text-[11px] text-gray-600 space-y-0.5">
                            <p>
                              <strong>Dimensions:</strong> {el.width} × {el.height} px
                            </p>
                            {el.naturalWidth && (
                              <p>
                                <strong>Native Resolution:</strong> {el.naturalWidth} × {el.naturalHeight} px (
                                {el.dpiQuality || 'high'} DPI)
                              </p>
                            )}
                            {el.src && (
                              <a
                                href={el.src}
                                target="_blank"
                                rel="noreferrer"
                                className="text-[#0058be] hover:underline flex items-center gap-1 mt-1 font-semibold"
                              >
                                <span>Open Full-Resolution Artwork</span>
                                <ExternalLink className="w-3 h-3" />
                              </a>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
