import React, { useState, useRef } from 'react';
import { useApp } from '../context/AppContext';
import { AVAILABLE_COLORS, INITIAL_PRODUCTS } from '../data/initialData';
import { Product, ProductColor } from '../types';
import {
  Palette,
  Type,
  Image as ImageIcon,
  Layers,
  RotateCw,
  Download,
  ShoppingBag,
  Sparkles,
  Upload,
  Undo,
  Sliders,
  Check,
  ChevronRight,
} from 'lucide-react';

const PRESET_GRAPHICS = [
  { id: 'g1', name: 'Tokyo Wave', url: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=300&q=80', label: '🌊 Wave' },
  { id: 'g2', name: 'Cyber Skull', url: 'https://images.unsplash.com/photo-1572375992501-4b0892d50c69?auto=format&fit=crop&w=300&q=80', label: '💀 Cyber' },
  { id: 'g3', name: 'Minimal Sun', url: 'https://images.unsplash.com/photo-1544716278-ca5e3f4abd8c?auto=format&fit=crop&w=300&q=80', label: '☀️ Horizon' },
  { id: 'g4', name: 'Retro Badge', url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?auto=format&fit=crop&w=300&q=80', label: '🏷️ Badge' },
];

const FONTS = ['Montserrat', 'Inter', 'serif', 'sans-serif', 'monospace'];

export const DesignStudioModal: React.FC = () => {
  const { designingProduct, setDesigningProduct, addToCart, saveCustomDesign, products, setActiveView, user, openAuthModal } = useApp();

  const [selectedProduct, setSelectedProduct] = useState<Product>(designingProduct || products[0] || INITIAL_PRODUCTS[0]);
  const [selectedColor, setSelectedColor] = useState<ProductColor>(selectedProduct.colors[0] || AVAILABLE_COLORS[0]);
  const [selectedSize, setSelectedSize] = useState<string>(selectedProduct.sizes[1] || selectedProduct.sizes[0] || 'M');
  const [placement, setPlacement] = useState<'front' | 'back' | 'chest'>('front');

  // Customizer state
  const [activeTab, setActiveTab] = useState<'text' | 'graphic' | 'color' | 'product'>('text');
  const [customText, setCustomText] = useState('CREATOR CLUB');
  const [textColor, setTextColor] = useState('#ffffff');
  const [selectedFont, setSelectedFont] = useState('Montserrat');
  const [fontSize, setFontSize] = useState(26);
  const [textCurve, setTextCurve] = useState(false);
  const [selectedGraphic, setSelectedGraphic] = useState<string | null>(null);
  const [quantity, setQuantity] = useState(1);
  const [saving, setSaving] = useState(false);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Price calculations with volume discounts
  const basePrice = selectedProduct.price;
  const printCost = 6.0;
  const itemUnitPrice = basePrice + printCost;
  const discountRate = quantity >= 25 ? 0.3 : quantity >= 6 ? 0.15 : 0;
  const finalUnitPrice = itemUnitPrice * (1 - discountRate);
  const totalCost = finalUnitPrice * quantity;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setSelectedGraphic(event.target.result as string);
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const handleAddToCart = () => {
    addToCart({
      productId: selectedProduct.id,
      product: selectedProduct,
      size: selectedSize as any,
      color: selectedColor,
      quantity,
      unitPrice: finalUnitPrice,
      customDesign: {
        text: customText,
        textColor,
        fontFamily: selectedFont,
        graphicUrl: selectedGraphic || undefined,
        placement,
      },
    });
  };

  const handleSaveDesign = async () => {
    if (!user) {
      openAuthModal('login');
      return;
    }
    setSaving(true);
    try {
      await saveCustomDesign({
        name: `${selectedProduct.name} - ${customText || 'Custom Artwork'}`,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        productImage: selectedProduct.image,
        selectedColorHex: selectedColor.hex,
        designText: customText,
        designTextColor: textColor,
        designFont: selectedFont,
        graphicUrl: selectedGraphic || undefined,
        placement,
      });
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full max-w-[1280px] mx-auto px-4 sm:px-8 lg:px-16 py-8">
      
      {/* Studio Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="px-2.5 py-0.5 rounded-full text-xs font-semibold bg-[#d8e2ff] text-[#0058be]">
              PrintFlow Studio 2.0
            </span>
            <span className="text-xs text-[#555f6f]">Ultra HD DTG Print Simulator</span>
          </div>
          <h1 className="font-['Montserrat'] font-bold text-3xl sm:text-4xl text-[#1a1c1c] tracking-tight">
            Interactive Design Tool
          </h1>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleSaveDesign}
            disabled={saving}
            className="px-4 py-2 rounded-lg bg-[#eeeeee] hover:bg-[#e8e8e8] font-['Inter'] font-semibold text-xs text-[#1a1c1c] transition-colors cursor-pointer"
          >
            {saving ? 'Saving...' : 'Save Design'}
          </button>
          <button
            onClick={handleAddToCart}
            className="px-5 py-2 rounded-lg bg-[#0058be] hover:bg-[#2170e4] font-['Inter'] font-semibold text-xs text-white shadow-sm shadow-[#0058be]/20 transition-colors flex items-center gap-1.5 cursor-pointer"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add to Cart (${totalCost.toFixed(2)})</span>
          </button>
        </div>
      </div>

      {/* Main Studio Workspace */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* Left Interactive Canvas Stage (7 Columns) */}
        <div className="lg:col-span-7 bg-[#eeeeee] rounded-2xl p-6 sm:p-10 flex flex-col items-center justify-center relative min-h-[460px] sm:min-h-[540px] border border-[#e2e2e2] shadow-sm">
          
          {/* Placement Toggle Chips */}
          <div className="absolute top-4 left-4 z-10 flex items-center gap-1.5 bg-white/90 backdrop-blur rounded-lg p-1 shadow-sm border border-[#e2e2e2]">
            {(['front', 'back', 'chest'] as const).map((p) => (
              <button
                key={p}
                onClick={() => setPlacement(p)}
                className={`px-3 py-1 rounded text-xs font-['Inter'] font-semibold capitalize transition-colors ${
                  placement === p ? 'bg-[#0058be] text-white shadow-xs' : 'text-[#424754] hover:bg-[#f3f3f4]'
                }`}
              >
                {p}
              </button>
            ))}
          </div>

          {/* Canvas Color Indicator */}
          <div className="absolute top-4 right-4 z-10 bg-white/90 backdrop-blur rounded-lg px-3 py-1 text-xs font-semibold text-[#1a1c1c] shadow-sm flex items-center gap-2">
            <span className="w-3 h-3 rounded-full border border-black/10" style={{ backgroundColor: selectedColor.hex }} />
            <span>{selectedColor.name}</span>
          </div>

          {/* Garment Mockup Layer */}
          <div className="relative w-full max-w-[420px] aspect-[4/5] flex items-center justify-center select-none">
            
            {/* Base Product Photo */}
            <img
              src={selectedProduct.image}
              alt={selectedProduct.name}
              className="w-full h-full object-contain mix-blend-multiply drop-shadow-md transition-all duration-300 pointer-events-none"
            />

            {/* Print Area Bounds Guide */}
            <div
              className={`absolute transition-all duration-300 flex flex-col items-center justify-center text-center border-2 border-dashed border-[#0058be]/40 rounded-lg p-3 ${
                placement === 'chest'
                  ? 'top-[26%] left-[30%] w-[110px] h-[90px]'
                  : 'top-[22%] left-[24%] w-[52%] h-[50%]'
              }`}
            >
              {/* Graphic Layer */}
              {selectedGraphic && (
                <div className="relative mb-2 max-w-[85%] max-h-[85px] overflow-hidden rounded">
                  <img
                    src={selectedGraphic}
                    alt="Custom Print"
                    className="w-full h-full object-contain mix-blend-multiply drop-shadow-sm"
                  />
                  <button
                    onClick={() => setSelectedGraphic(null)}
                    className="absolute top-0 right-0 bg-red-600 text-white rounded-full w-4 h-4 text-[10px] flex items-center justify-center"
                  >
                    ×
                  </button>
                </div>
              )}

              {/* Text Layer */}
              {customText && (
                <div
                  style={{
                    color: textColor,
                    fontFamily: selectedFont,
                    fontSize: `${placement === 'chest' ? Math.max(12, fontSize * 0.6) : fontSize}px`,
                    textShadow: textColor === '#ffffff' ? '0 1px 3px rgba(0,0,0,0.8)' : 'none',
                    letterSpacing: textCurve ? '0.15em' : 'normal',
                  }}
                  className="font-bold leading-tight select-none break-words max-w-full px-1"
                >
                  {customText}
                </div>
              )}
            </div>
          </div>

          <div className="mt-4 text-[11px] text-[#727785] flex items-center gap-1.5">
            <Sparkles className="w-3.5 h-3.5 text-[#0058be]" />
            <span>Kornit DTG 1200 DPI CMYK+W Print Preview (Garment simulation)</span>
          </div>

        </div>

        {/* Right Customization Controls (5 Columns) */}
        <div className="lg:col-span-5 bg-white rounded-2xl p-6 border border-[#e2e2e2] shadow-sm flex flex-col gap-6">
          
          {/* Tool Tabs */}
          <div className="flex border-b border-[#eeeeee] pb-2 gap-2">
            <button
              onClick={() => setActiveTab('text')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'text' ? 'bg-[#d8e2ff] text-[#0058be]' : 'text-[#555f6f] hover:bg-[#f3f3f4]'
              }`}
            >
              <Type className="w-4 h-4" /> Text
            </button>
            <button
              onClick={() => setActiveTab('graphic')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'graphic' ? 'bg-[#d8e2ff] text-[#0058be]' : 'text-[#555f6f] hover:bg-[#f3f3f4]'
              }`}
            >
              <ImageIcon className="w-4 h-4" /> Artwork
            </button>
            <button
              onClick={() => setActiveTab('color')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'color' ? 'bg-[#d8e2ff] text-[#0058be]' : 'text-[#555f6f] hover:bg-[#f3f3f4]'
              }`}
            >
              <Palette className="w-4 h-4" /> Color
            </button>
            <button
              onClick={() => setActiveTab('product')}
              className={`flex-1 py-2 px-3 rounded-lg text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors ${
                activeTab === 'product' ? 'bg-[#d8e2ff] text-[#0058be]' : 'text-[#555f6f] hover:bg-[#f3f3f4]'
              }`}
            >
              <Layers className="w-4 h-4" /> Blank
            </button>
          </div>

          {/* TAB 1: TEXT CUSTOMIZATION */}
          {activeTab === 'text' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-1.5">
                  Print Wording / Slogan
                </label>
                <input
                  type="text"
                  value={customText}
                  onChange={(e) => setCustomText(e.target.value)}
                  placeholder="Enter text here..."
                  className="w-full px-3 py-2 bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg text-sm text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be]"
                />
              </div>

              {/* Typography selection */}
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-1.5">
                  Font Family
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {FONTS.map((font) => (
                    <button
                      key={font}
                      onClick={() => setSelectedFont(font)}
                      style={{ fontFamily: font }}
                      className={`p-2 rounded-lg border text-xs font-bold transition-all text-center ${
                        selectedFont === font
                          ? 'border-[#0058be] bg-[#d8e2ff]/40 text-[#0058be]'
                          : 'border-[#e2e2e2] hover:bg-[#f9f9f9] text-[#1a1c1c]'
                      }`}
                    >
                      {font}
                    </button>
                  ))}
                </div>
              </div>

              {/* Font Color */}
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-1.5">
                  Ink Color
                </label>
                <div className="flex flex-wrap gap-2.5 items-center">
                  {['#ffffff', '#1a1c1c', '#0058be', '#ba1a1a', '#6b38d4', '#eab308', '#10b981'].map((hex) => (
                    <button
                      key={hex}
                      onClick={() => setTextColor(hex)}
                      style={{ backgroundColor: hex }}
                      className={`w-7 h-7 rounded-full border border-black/20 transition-all ${
                        textColor === hex ? 'ring-2 ring-[#0058be] ring-offset-2 scale-110' : 'hover:scale-105'
                      }`}
                    />
                  ))}
                </div>
              </div>

              {/* Font Size slider */}
              <div>
                <div className="flex justify-between text-xs font-bold text-[#1a1c1c] mb-1">
                  <span>Font Scale</span>
                  <span>{fontSize}px</span>
                </div>
                <input
                  type="range"
                  min="14"
                  max="44"
                  value={fontSize}
                  onChange={(e) => setFontSize(Number(e.target.value))}
                  className="w-full accent-[#0058be]"
                />
              </div>
            </div>
          )}

          {/* TAB 2: GRAPHIC / ARTWORK */}
          {activeTab === 'graphic' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-1.5">
                  Upload Custom Artwork
                </label>
                <input
                  type="file"
                  ref={fileInputRef}
                  onChange={handleFileUpload}
                  accept="image/png, image/jpeg, image/svg+xml"
                  className="hidden"
                />
                <button
                  onClick={() => fileInputRef.current?.click()}
                  className="w-full py-4 px-3 border-2 border-dashed border-[#c2c6d6] hover:border-[#0058be] rounded-xl flex flex-col items-center justify-center gap-1.5 transition-colors group cursor-pointer bg-[#f9f9f9]"
                >
                  <Upload className="w-6 h-6 text-[#727785] group-hover:text-[#0058be]" />
                  <span className="text-xs font-semibold text-[#1a1c1c]">Click to browse PNG, JPG or SVG</span>
                  <span className="text-[10px] text-[#727785]">Transparent 300 DPI recommended</span>
                </button>
              </div>

              <div>
                <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block mb-1.5">
                  Featured Vector Graphics
                </label>
                <div className="grid grid-cols-2 gap-2.5">
                  {PRESET_GRAPHICS.map((g) => (
                    <button
                      key={g.id}
                      onClick={() => setSelectedGraphic(g.url)}
                      className={`p-2 rounded-lg border text-left flex items-center gap-2 transition-all ${
                        selectedGraphic === g.url
                          ? 'border-[#0058be] bg-[#d8e2ff]/30 ring-1 ring-[#0058be]'
                          : 'border-[#e2e2e2] hover:bg-[#f9f9f9]'
                      }`}
                    >
                      <img src={g.url} alt={g.name} className="w-8 h-8 rounded object-cover" />
                      <span className="text-xs font-semibold text-[#1a1c1c]">{g.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: GARMENT COLOR */}
          {activeTab === 'color' && (
            <div className="flex flex-col gap-4 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block">
                Garment Blank Color
              </label>
              <div className="grid grid-cols-2 gap-2.5">
                {selectedProduct.colors.map((c) => (
                  <button
                    key={c.hex}
                    onClick={() => setSelectedColor(c)}
                    className={`p-2.5 rounded-lg border flex items-center gap-2.5 transition-all text-left ${
                      selectedColor.hex === c.hex
                        ? 'border-[#0058be] bg-[#d8e2ff]/30 ring-1 ring-[#0058be]'
                        : 'border-[#e2e2e2] hover:bg-[#f9f9f9]'
                    }`}
                  >
                    <span
                      className="w-5 h-5 rounded-full border border-black/10 shadow-xs"
                      style={{ backgroundColor: c.hex }}
                    />
                    <span className="text-xs font-medium text-[#1a1c1c]">{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* TAB 4: SWITCH PRODUCT BLANK */}
          {activeTab === 'product' && (
            <div className="flex flex-col gap-3 max-h-64 overflow-y-auto pr-1 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider block">
                Select Base Garment
              </label>
              {products.slice(0, 6).map((p) => (
                <button
                  key={p.id}
                  onClick={() => {
                    setSelectedProduct(p);
                    setSelectedColor(p.colors[0]);
                  }}
                  className={`p-2.5 rounded-lg border flex items-center justify-between transition-all ${
                    selectedProduct.id === p.id
                      ? 'border-[#0058be] bg-[#d8e2ff]/30 ring-1 ring-[#0058be]'
                      : 'border-[#e2e2e2] hover:bg-[#f9f9f9]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <img src={p.image} alt={p.name} className="w-10 h-10 rounded object-cover mix-blend-multiply" />
                    <div className="text-left">
                      <p className="text-xs font-bold text-[#1a1c1c]">{p.name}</p>
                      <p className="text-[10px] text-[#555f6f]">{p.spec}</p>
                    </div>
                  </div>
                  <span className="text-xs font-bold text-[#0058be]">${p.price.toFixed(2)}</span>
                </button>
              ))}
            </div>
          )}

          {/* Sizing & Quantity */}
          <div className="border-t border-[#eeeeee] pt-4 flex flex-col gap-3.5">
            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">Garment Size</span>
              <div className="flex gap-1.5">
                {selectedProduct.sizes.map((s) => (
                  <button
                    key={s}
                    onClick={() => setSelectedSize(s)}
                    className={`w-7 h-7 rounded text-[11px] font-bold transition-colors ${
                      selectedSize === s ? 'bg-[#0058be] text-white' : 'bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#e2e2e2]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-xs font-bold text-[#1a1c1c] uppercase tracking-wider">Quantity</span>
              <div className="flex items-center border border-[#c2c6d6] rounded-lg overflow-hidden">
                <button
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-[#f3f3f4]"
                >
                  -
                </button>
                <span className="px-3 py-1 text-xs font-bold min-w-[24px] text-center">{quantity}</span>
                <button
                  onClick={() => setQuantity((q) => q + 1)}
                  className="px-2.5 py-1 text-xs font-bold hover:bg-[#f3f3f4]"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Pricing Box & Volume Discounts */}
          <div className="p-3.5 bg-[#f9f9f9] rounded-xl border border-[#eeeeee] space-y-1.5">
            <div className="flex justify-between text-xs">
              <span className="text-[#555f6f]">Garment Base:</span>
              <span className="font-semibold text-[#1a1c1c]">${basePrice.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-xs">
              <span className="text-[#555f6f]">DTG Print Setup:</span>
              <span className="font-semibold text-[#1a1c1c]">${printCost.toFixed(2)}</span>
            </div>
            {discountRate > 0 && (
              <div className="flex justify-between text-xs text-emerald-600 font-semibold">
                <span>Volume Discount ({discountRate * 100}%):</span>
                <span>-${((itemUnitPrice - finalUnitPrice) * quantity).toFixed(2)}</span>
              </div>
            )}
            <div className="border-t border-[#e2e2e2] pt-2 flex justify-between items-baseline">
              <span className="font-bold text-sm text-[#1a1c1c]">Total ({quantity} pcs):</span>
              <span className="font-['Montserrat'] font-bold text-lg text-[#0058be]">
                ${totalCost.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Action Button */}
          <button
            onClick={handleAddToCart}
            className="w-full py-3 rounded-xl bg-[#0058be] hover:bg-[#2170e4] font-['Inter'] font-semibold text-sm text-white shadow-md shadow-[#0058be]/25 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-98"
          >
            <ShoppingBag className="w-4 h-4" />
            <span>Add Custom Garment to Cart</span>
          </button>

        </div>
      </div>
    </div>
  );
};
