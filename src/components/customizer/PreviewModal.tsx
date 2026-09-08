import React, { useState } from 'react';
import { X, Download, ShoppingBag, Eye, CheckCircle2 } from 'lucide-react';
import { DesignSide, Product, ProductColor, Size } from '../../types';

interface PreviewModalProps {
  isOpen: boolean;
  onClose: () => void;
  product: Product | null;
  selectedColor: ProductColor;
  selectedSize: Size;
  previewFrontUrl: string;
  previewBackUrl: string;
  onAddToCart: () => void;
  totalPrice: number;
}

export const PreviewModal: React.FC<PreviewModalProps> = ({
  isOpen,
  onClose,
  product,
  selectedColor,
  selectedSize,
  previewFrontUrl,
  previewBackUrl,
  onAddToCart,
  totalPrice,
}) => {
  const [activeSide, setActiveSide] = useState<DesignSide>('front');

  if (!isOpen) return null;

  const currentPreviewUrl = activeSide === 'front' ? previewFrontUrl : previewBackUrl || previewFrontUrl;

  const handleDownloadSnapshot = () => {
    if (!currentPreviewUrl) return;
    const a = document.createElement('a');
    a.href = currentPreviewUrl;
    a.download = `${product?.slug || 'custom-design'}-${activeSide}-preview.png`;
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
          className="absolute top-4 right-4 z-20 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-[#1a1c1c] flex items-center justify-center shadow-md transition-colors"
        >
          <X className="w-4 h-4" />
        </button>

        {/* Left Side: Large Clean Product Preview Stage */}
        <div className="flex-1 bg-[#f8fafc] p-6 flex flex-col items-center justify-between border-b md:border-b-0 md:border-r border-[#e2e8f0]">
          {/* Side Switcher Pill */}
          <div className="flex items-center gap-1.5 p-1 bg-white rounded-full border border-[#dce2ee] shadow-xs">
            <button
              onClick={() => setActiveSide('front')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeSide === 'front'
                  ? 'bg-[#0058be] text-white shadow-xs'
                  : 'text-[#555f6f] hover:text-[#1a1c1c]'
              }`}
            >
              Front View
            </button>
            <button
              onClick={() => setActiveSide('back')}
              className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all ${
                activeSide === 'back'
                  ? 'bg-[#0058be] text-white shadow-xs'
                  : 'text-[#555f6f] hover:text-[#1a1c1c]'
              }`}
            >
              Back View
            </button>
          </div>

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
            className="flex items-center gap-1.5 text-xs font-semibold text-[#0058be] hover:text-[#2170e4] bg-white px-3 py-1.5 rounded-xl border border-[#dce2ee] shadow-xs hover:shadow transition-all"
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
                {product?.name || 'Custom Apparel'}
              </h3>
              <p className="text-xs text-[#555f6f] mt-0.5">
                {product?.categoryName || 'Print-on-Demand'}
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

              <div className="flex justify-between items-center">
                <span className="text-[#727785]">Size:</span>
                <span className="font-semibold text-[#1a1c1c]">{selectedSize}</span>
              </div>

              <div className="flex justify-between items-center">
                <span className="text-[#727785]">Print Technology:</span>
                <span className="font-semibold text-[#1a1c1c]">Direct-to-Garment</span>
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
              className="w-full py-2 px-4 rounded-xl bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#1a1c1c] transition-colors"
            >
              Continue Editing
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
