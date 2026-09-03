import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Size, ProductColor } from '../types';
import { X, Check, ShoppingBag, Palette, Star, Truck, ShieldCheck, RefreshCw } from 'lucide-react';

export const ProductQuickViewModal: React.FC = () => {
  const { quickViewProduct, setQuickViewProduct, addToCart, setDesigningProduct, setActiveView } = useApp();

  const [selectedSize, setSelectedSize] = useState<Size>('M');
  const [selectedColor, setSelectedColor] = useState<ProductColor | null>(null);
  const [quantity, setQuantity] = useState<number>(1);

  React.useEffect(() => {
    if (quickViewProduct) {
      setSelectedSize(quickViewProduct.sizes[0] || 'M');
      setSelectedColor(quickViewProduct.colors[0] || null);
      setQuantity(1);
    }
  }, [quickViewProduct]);

  if (!quickViewProduct) return null;

  const currentColor = selectedColor || quickViewProduct.colors[0];

  const handleAddToCart = () => {
    addToCart({
      productId: quickViewProduct.id,
      product: quickViewProduct,
      size: selectedSize,
      color: currentColor,
      quantity,
      unitPrice: quickViewProduct.price,
    });
    setQuickViewProduct(null);
  };

  const handleLaunchDesigner = () => {
    setDesigningProduct(quickViewProduct);
    setQuickViewProduct(null);
    setActiveView('design-tool');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
      <div 
        onClick={(e) => e.stopPropagation()}
        className="relative w-full max-w-3xl bg-white rounded-2xl shadow-2xl overflow-hidden border border-[#e2e2e2] flex flex-col md:flex-row max-h-[90vh]"
      >
        {/* Close Button */}
        <button
          onClick={() => setQuickViewProduct(null)}
          className="absolute top-4 right-4 z-10 w-9 h-9 rounded-full bg-white/90 backdrop-blur shadow-md flex items-center justify-center text-[#1a1c1c] hover:bg-[#eeeeee] transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Product Image Stage */}
        <div className="md:w-1/2 bg-[#eeeeee] p-6 flex flex-col items-center justify-center relative min-h-[280px]">
          <img
            src={quickViewProduct.image}
            alt={quickViewProduct.name}
            className="max-h-[380px] w-full object-contain mix-blend-multiply transition-transform hover:scale-105 duration-300"
          />
          {quickViewProduct.tag && (
            <span className="absolute top-4 left-4 px-2.5 py-1 rounded bg-[#6b38d4] text-white font-['Inter'] font-bold text-xs uppercase tracking-wider">
              {quickViewProduct.tag}
            </span>
          )}
        </div>

        {/* Product Details Column */}
        <div className="md:w-1/2 p-6 md:p-8 flex flex-col overflow-y-auto">
          
          <div className="flex items-center gap-2 mb-1">
            <span className="text-xs font-semibold text-[#0058be] uppercase tracking-wider bg-[#d8e2ff] px-2 py-0.5 rounded">
              {quickViewProduct.category}
            </span>
            <div className="flex items-center text-amber-500 text-xs font-bold gap-1">
              <Star className="w-3.5 h-3.5 fill-amber-500" />
              <span>{quickViewProduct.rating}</span>
              <span className="text-[#727785]">({quickViewProduct.reviewsCount})</span>
            </div>
          </div>

          <h2 className="font-['Montserrat'] font-bold text-2xl text-[#1a1c1c] tracking-tight">
            {quickViewProduct.name}
          </h2>

          <div className="flex items-baseline gap-3 my-2">
            <span className="font-['Montserrat'] font-bold text-2xl text-[#0058be]">
              ${quickViewProduct.price.toFixed(2)}
            </span>
            <span className="text-xs text-[#555f6f]">Bulk pricing available from 10+ pcs</span>
          </div>

          <p className="text-xs text-[#424754] leading-relaxed mb-4">
            {quickViewProduct.description}
          </p>

          {/* Color Selection */}
          <div className="mb-4">
            <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-2">
              Color: <span className="font-normal text-[#555f6f]">{currentColor.name}</span>
            </label>
            <div className="flex flex-wrap gap-2.5">
              {quickViewProduct.colors.map((c) => (
                <button
                  key={c.hex}
                  onClick={() => setSelectedColor(c)}
                  style={{ backgroundColor: c.hex }}
                  className={`w-7 h-7 rounded-full border border-black/10 transition-all ${
                    currentColor.hex === c.hex
                      ? 'ring-2 ring-[#0058be] ring-offset-2 ring-offset-white scale-110'
                      : 'hover:scale-105'
                  }`}
                />
              ))}
            </div>
          </div>

          {/* Size Selection */}
          <div className="mb-5">
            <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-2">
              Select Size
            </label>
            <div className="flex flex-wrap gap-2">
              {quickViewProduct.sizes.map((s) => (
                <button
                  key={s}
                  onClick={() => setSelectedSize(s)}
                  className={`w-9 h-9 rounded-lg font-['Inter'] text-xs font-semibold transition-colors ${
                    selectedSize === s
                      ? 'bg-[#0058be] text-white shadow-sm'
                      : 'bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#e2e2e2]'
                  }`}
                >
                  {s}
                </button>
              ))}
            </div>
          </div>

          {/* Specs List */}
          <div className="p-3 bg-[#f9f9f9] rounded-xl border border-[#eeeeee] space-y-1.5 text-[11px] text-[#424754] mb-5">
            <div className="flex justify-between">
              <span className="text-[#727785]">Fabric Composition:</span>
              <span className="font-medium text-[#1a1c1c]">{quickViewProduct.details.material}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#727785]">Fabric Weight:</span>
              <span className="font-medium text-[#1a1c1c]">{quickViewProduct.details.weight}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-[#727785]">Manufacturing:</span>
              <span className="font-medium text-[#1a1c1c]">{quickViewProduct.details.origin}</span>
            </div>
          </div>

          {/* Quantity & CTA */}
          <div className="flex items-center gap-3 mt-auto">
            <div className="flex items-center border border-[#c2c6d6] rounded-lg overflow-hidden bg-white">
              <button
                onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                className="px-2.5 py-2 hover:bg-[#f3f3f4] text-sm font-bold text-[#1a1c1c]"
              >
                -
              </button>
              <span className="px-3 py-2 text-xs font-bold text-[#1a1c1c] min-w-[28px] text-center">
                {quantity}
              </span>
              <button
                onClick={() => setQuantity((q) => q + 1)}
                className="px-2.5 py-2 hover:bg-[#f3f3f4] text-sm font-bold text-[#1a1c1c]"
              >
                +
              </button>
            </div>

            <button
              onClick={handleAddToCart}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#eeeeee] hover:bg-[#e8e8e8] font-['Inter'] font-semibold text-xs text-[#1a1c1c] flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4 text-[#0058be]" />
              <span>Add Blank</span>
            </button>

            <button
              onClick={handleLaunchDesigner}
              className="flex-1 py-2.5 px-4 rounded-lg bg-[#0058be] hover:bg-[#2170e4] font-['Inter'] font-semibold text-xs text-white flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-sm shadow-[#0058be]/20"
            >
              <Palette className="w-4 h-4" />
              <span>Customize</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
