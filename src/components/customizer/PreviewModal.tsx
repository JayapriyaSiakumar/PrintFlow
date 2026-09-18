import React, { useState } from 'react';
import { X, Download, ShoppingBag, Eye, CheckCircle2 } from 'lucide-react';
import { DesignSide, Product, ProductColor, ProductCustomizationView, Size } from '../../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  selectedColor: ProductColor;
  selectedSize: Size;
  previewFrontUrl?: string;
  previewBackUrl?: string;
  views?: ProductCustomizationView[];
  previewsByView?: Record<string, string>;
  activeViewId?: string;
  onAddToCart: () => void;
  totalPrice: number;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedColor,
  selectedSize,
  previewFrontUrl = '',
  previewBackUrl = '',
  views,
  previewsByView = {},
  activeViewId: initialActiveViewId,
  onAddToCart,
  totalPrice,
}) => {
  const effectiveViews: { id: string; name: string; previewUrl: string }[] = React.useMemo(() => {
    if (views && views.length > 0) {
      return views.map((v) => {
        const pUrl =
          previewsByView[v.id] ||
          (v.id === 'front' ? previewFrontUrl : v.id === 'back' ? previewBackUrl : '') ||
          v.mockupUrl ||
          product?.image ||
          '';
        return {
          id: v.id,
          name: v.name,
          previewUrl: pUrl,
        };
      });
    }

    // Fallback for legacy 2-side setup
    return [
      {
        id: 'front',
        name: 'Front View',
        previewUrl: previewFrontUrl || product?.image || '',
      },
      {
        id: 'back',
        name: 'Back View',
        previewUrl: previewBackUrl || previewFrontUrl || product?.image || '',
      },
    ];
  }, [views, previewsByView, previewFrontUrl, previewBackUrl, product]);

  const [activeSide, setActiveSide] = useState<string>(() => {
    if (initialActiveViewId && effectiveViews.some((v) => v.id === initialActiveViewId)) {
      return initialActiveViewId;
    }
    return effectiveViews[0]?.id || 'front';
  });

  if (!isOpen) return null;

  const currentViewObj = effectiveViews.find((v) => v.id === activeSide) || effectiveViews[0];
  const currentPreviewUrl = currentViewObj?.previewUrl || '';

  const handleDownloadSnapshot = () => {
    if (!currentPreviewUrl) return;
    const a = document.createElement('a');
    a.href = currentPreviewUrl;
    a.download = `${product?.name?.toLowerCase().replace(/\s+/g, '-') || 'custom-product'}-${activeSide}-preview.png`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
  };

  return (
    <div
      id="modal-design-preview"
      className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-md flex items-center justify-center p-4 sm:p-6 animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-3xl shadow-2xl border border-white/20 overflow-hidden flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#1a1c1c] flex items-center justify-center shadow-md transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Large Clean Product Preview Stage */}
        <div className="flex-1 bg-[#f8fafc] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[#e2e8f0]">
          {/* Surface Switcher Pill (Dynamic based on product views) */}
          {effectiveViews.length > 1 ? (
            <div className="flex flex-wrap items-center justify-center gap-1.5 p-1 bg-white rounded-full border border-[#dce2ee] shadow-xs">
              {effectiveViews.map((v) => {
                const isActive = activeSide === v.id;
                return (
                  <button
                    key={v.id}
                    onClick={() => setActiveSide(v.id)}
                    className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all cursor-pointer ${
                      isActive
                        ? 'bg-[#0058be] text-white shadow-xs'
                        : 'text-[#555f6f] hover:text-[#1a1c1c]'
                    }`}
                  >
                    {v.name}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs font-semibold text-[#555f6f] uppercase tracking-wider bg-white px-3 py-1 rounded-full border border-[#e2e8f0]">
              {effectiveViews[0]?.name || 'Preview'}
            </div>
          )}

          {/* Rendered Mockup Image */}
          <div className="w-full max-w-sm aspect-square flex items-center justify-center my-4 relative">
            {currentPreviewUrl ? (
              <img
                src={currentPreviewUrl}
                alt="Realistic Customized Product"
                className="w-full h-full object-contain drop-shadow-xl"
              />
            ) : (
              <div className="text-center text-gray-400">
                <Eye className="w-10 h-10 mx-auto mb-2 opacity-50" />
                <p className="text-xs">Generating mockup preview...</p>
              </div>
            )}
          </div>

          {/* Download Snapshot Button */}
          <button
            onClick={handleDownloadSnapshot}
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0058be] hover:text-[#2170e4] bg-white px-3 py-1.5 rounded-xl border border-[#dce2ee] shadow-xs hover:shadow transition-all cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Download High-Res Preview</span>
          </button>
        </div>

        {/* Right Side: Product Details & Final Order CTA */}
        <div className="w-full md:w-80 p-6 flex flex-col justify-between space-y-6">
          <div className="space-y-4">
            <div className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-800 text-[11px] font-bold">
              <CheckCircle2 className="w-3 h-3" />
              <span>Print Validation Passed</span>
            </div>

            <div>
              <h3 className="font-['Montserrat'] font-bold text-lg text-[#1a1c1c]">
                {product?.name || 'Custom Product'}
              </h3>
              <p className="text-xs text-[#555f6f] mt-0.5">
                {product?.categoryName || 'Custom Print-On-Demand'}
              </p>
            </div>

            {/* Selected Options Summary */}
            <div className="p-3.5 rounded-2xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-[#727785]">Color:</span>
                <span className="font-semibold text-[#1a1c1c] flex items-center gap-1.5">
                  <span
                    className="w-3 h-3 rounded-full border border-black/15"
                    style={{ backgroundColor: selectedColor.hex }}
                  />
                  {selectedColor.name}
                </span>
              </div>

              {selectedSize && (
                <div className="flex justify-between items-center">
                  <span className="text-[#727785]">Size / Option:</span>
                  <span className="font-semibold text-[#1a1c1c]">{selectedSize}</span>
                </div>
              )}

              <div className="flex justify-between items-center">
                <span className="text-[#727785]">Custom Surfaces:</span>
                <span className="font-semibold text-[#1a1c1c]">
                  {effectiveViews.length} {effectiveViews.length === 1 ? 'View' : 'Views'}
                </span>
              </div>

              <div className="flex justify-between items-center pt-2 border-t border-[#e2e8f0]">
                <span className="font-bold text-[#1a1c1c]">Unit Price:</span>
                <span className="font-['Montserrat'] font-bold text-sm text-[#0058be]">
                  ${totalPrice.toFixed(2)}
                </span>
              </div>
            </div>
          </div>

          <div className="space-y-2.5">
            <button
              onClick={() => {
                onAddToCart();
                onClose();
              }}
              className="w-full py-3 px-4 rounded-xl bg-[#0058be] hover:bg-[#2170e4] font-['Inter'] font-semibold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0058be]/25 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Add Custom Product to Cart</span>
            </button>

            <button
              onClick={onClose}
              className="w-full py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#1a1c1c] transition-colors cursor-pointer"
            >
              Continue Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

