import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  ArrowLeft,
  RotateCcw,
  RotateCw,
  Eye,
  Save,
  ShoppingBag,
  Trash2,
  CheckCircle2,
  Tag,
  Layers,
  Sparkles,
  HelpCircle,
} from 'lucide-react';
import {
  DesignElement,
  DesignSide,
  Product,
  ProductColor,
  ProductCustomizationConfig,
  SideDesignState,
  Size,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { CanvasEditor } from './CanvasEditor';
import { ToolPanel } from './ToolPanel';
import { PreviewModal } from './PreviewModal';
import { PrintQualityWarning } from './PrintQualityWarning';
import { getProductPrintArea, PrintableAreaConfig, EditorHistoryState } from './types';
import { generateProductPreview } from '../../utils/previewGenerator';

interface ProductDesignerPageProps {
  onClose?: () => void;
}

export const ProductDesignerPage: React.FC<ProductDesignerPageProps> = ({ onClose }) => {
  const {
    products,
    designingProduct,
    setDesigningProduct,
    editingCustomDesign,
    setEditingCustomDesign,
    addToCart,
    saveCustomDesign,
    setActiveView,
    setIsCartOpen,
  } = useApp();

  // Active target product
  const product: Product = useMemo(() => {
    if (designingProduct) return designingProduct;
    if (products.length > 0) return products[0];
    return {
      id: 'prod-1',
      name: 'Heavyweight Cotton Crewneck Tee',
      slug: 'heavyweight-cotton-crewneck-tee',
      category: 'cat-apparel',
      categoryName: 'Apparel',
      price: 24.0,
      image: 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80',
      description: 'Pre-shrunk 100% ring-spun combed cotton blank.',
      colors: [
        { name: 'White', hex: '#ffffff' },
        { name: 'Black', hex: '#111111' },
        { name: 'Royal Navy', hex: '#1d2a44' },
      ],
      sizes: ['S', 'M', 'L', 'XL', '2XL'],
      inStock: true,
      rating: 4.9,
      reviewsCount: 142,
      tags: ['Heavyweight', 'DTG Ready'],
      createdAt: '2024-01-01T00:00:00.000Z',
    };
  }, [designingProduct, products]);

  // Variant state
  const [selectedColor, setSelectedColor] = useState<ProductColor>(product.colors[0] || { name: 'White', hex: '#ffffff' });
  const [selectedSize, setSelectedSize] = useState<Size>(product.sizes[1] || product.sizes[0] || 'M');
  const [quantity, setQuantity] = useState<number>(1);

  // Active Side: Front vs Back
  const [activeSide, setActiveSide] = useState<DesignSide>('front');

  // Independent side element state
  const [frontElements, setFrontElements] = useState<DesignElement[]>([]);
  const [backElements, setBackElements] = useState<DesignElement[]>([]);

  // Selection
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo History Stack
  const [history, setHistory] = useState<EditorHistoryState[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modals & Snapshot Ref
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [previewFrontUrl, setPreviewFrontUrl] = useState<string>('');
  const [previewBackUrl, setPreviewBackUrl] = useState<string>('');
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  // Ref to trigger stage snapshot
  const exportPreviewRef = useRef<(() => Promise<string>) | null>(null);

  // Printable area configuration based on product and side
  const printArea: PrintableAreaConfig = useMemo(
    () => getProductPrintArea(product, activeSide),
    [product, activeSide]
  );

  // Elements on current active side
  const currentElements = activeSide === 'front' ? frontElements : backElements;

  // Initialize or re-hydrate when editingCustomDesign changes
  useEffect(() => {
    if (editingCustomDesign) {
      if (editingCustomDesign.selectedColorHex) {
        const foundColor = product.colors.find(
          (c) => c.hex.toLowerCase() === editingCustomDesign.selectedColorHex.toLowerCase()
        );
        if (foundColor) setSelectedColor(foundColor);
      }
      if (editingCustomDesign.selectedSize && product.sizes.includes(editingCustomDesign.selectedSize as Size)) {
        setSelectedSize(editingCustomDesign.selectedSize as Size);
      }

      // Restore elements from designConfig or sides
      const cfgSides = editingCustomDesign.designConfig?.sides || editingCustomDesign.sides;
      if (cfgSides) {
        if (cfgSides.front?.elements) setFrontElements(cfgSides.front.elements);
        if (cfgSides.back?.elements) setBackElements(cfgSides.back.elements);
      } else if (editingCustomDesign.designText) {
        // Fallback for legacy simple designs
        setFrontElements([
          {
            id: 'legacy-txt-1',
            type: 'text',
            text: editingCustomDesign.designText,
            fontSize: 28,
            fontFamily: editingCustomDesign.designFont || 'Montserrat',
            fill: editingCustomDesign.designTextColor || '#ffffff',
            align: 'center',
            x: 40,
            y: 120,
            width: 200,
            height: 38,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
          },
        ]);
      }
    }
  }, [editingCustomDesign, product]);

  // Push history snapshot
  const pushHistory = (front: DesignElement[], back: DesignElement[], side: DesignSide) => {
    const snapshot: EditorHistoryState = {
      sides: {
        front: { elements: JSON.parse(JSON.stringify(front)) },
        back: { elements: JSON.parse(JSON.stringify(back)) },
      },
      activeSide: side,
    };

    setHistory((prev) => {
      const trimmed = prev.slice(0, historyIndex + 1);
      return [...trimmed, snapshot].slice(-25); // cap at 25 states
    });
    setHistoryIndex((prev) => Math.min(24, prev + 1));
  };

  // Undo
  const handleUndo = () => {
    if (historyIndex > 0) {
      const prevIndex = historyIndex - 1;
      const state = history[prevIndex];
      setFrontElements(state.sides.front.elements);
      setBackElements(state.sides.back.elements);
      setActiveSide(state.activeSide);
      setHistoryIndex(prevIndex);
      setSelectedElementId(null);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setFrontElements(state.sides.front.elements);
      setBackElements(state.sides.back.elements);
      setActiveSide(state.activeSide);
      setHistoryIndex(nextIndex);
      setSelectedElementId(null);
    }
  };

  // Element actions on active side
  const handleAddElement = (newEl: DesignElement) => {
    if (activeSide === 'front') {
      const updated = [...frontElements, newEl];
      setFrontElements(updated);
      pushHistory(updated, backElements, 'front');
    } else {
      const updated = [...backElements, newEl];
      setBackElements(updated);
      pushHistory(frontElements, updated, 'back');
    }
  };

  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => {
    if (activeSide === 'front') {
      setFrontElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      );
    } else {
      setBackElements((prev) =>
        prev.map((el) => (el.id === id ? { ...el, ...updates } : el))
      );
    }
  };

  const handleDeleteElement = (id: string) => {
    if (activeSide === 'front') {
      const updated = frontElements.filter((el) => el.id !== id);
      setFrontElements(updated);
      pushHistory(updated, backElements, 'front');
    } else {
      const updated = backElements.filter((el) => el.id !== id);
      setBackElements(updated);
      pushHistory(frontElements, updated, 'back');
    }
    if (selectedElementId === id) setSelectedElementId(null);
  };

  const handleDuplicateElement = (id: string) => {
    const el = currentElements.find((item) => item.id === id);
    if (!el) return;

    const duplicated: DesignElement = {
      ...JSON.parse(JSON.stringify(el)),
      id: `${el.type}-copy-${Date.now()}`,
      x: Math.min(printArea.width - 60, el.x + 15),
      y: Math.min(printArea.height - 60, el.y + 15),
    };

    handleAddElement(duplicated);
    setSelectedElementId(duplicated.id);
  };

  const handleReorderElements = (newElements: DesignElement[]) => {
    if (activeSide === 'front') {
      setFrontElements(newElements);
      pushHistory(newElements, backElements, 'front');
    } else {
      setBackElements(newElements);
      pushHistory(frontElements, newElements, 'back');
    }
  };

  // Clear current side canvas
  const handleClearSide = () => {
    if (currentElements.length === 0) return;
    if (window.confirm(`Clear all design elements on the ${activeSide} side?`)) {
      if (activeSide === 'front') {
        setFrontElements([]);
        pushHistory([], backElements, 'front');
      } else {
        setBackElements([]);
        pushHistory(frontElements, [], 'back');
      }
      setSelectedElementId(null);
    }
  };

  // Tiered bulk pricing calculation
  const volumeDiscountPercent = useMemo(() => {
    if (quantity >= 25) return 0.25;
    if (quantity >= 10) return 0.15;
    if (quantity >= 5) return 0.10;
    return 0;
  }, [quantity]);

  // Base price + customization fee ($3.50 if back is also customized)
  const hasBackCustomization = backElements.length > 0;
  const printFeePerItem = hasBackCustomization ? 3.50 : 0;
  const baseItemPrice = product.price + printFeePerItem;
  const unitPrice = +(baseItemPrice * (1 - volumeDiscountPercent)).toFixed(2);
  const totalPrice = +(unitPrice * quantity).toFixed(2);

  // Helper to ensure full layered preview (product image as base layer) for any side
  const ensureLayeredPreview = async (side: DesignSide): Promise<string> => {
    const isFront = side === 'front';
    const sideElements = isFront ? frontElements : backElements;
    const sidePrintArea = getProductPrintArea(product, side);

    try {
      const res = await generateProductPreview({
        product,
        selectedColor,
        activeSide: side,
        printArea: sidePrintArea,
        elements: sideElements,
      });
      if (res.dataUrl) {
        if (isFront) setPreviewFrontUrl(res.dataUrl);
        else setPreviewBackUrl(res.dataUrl);
        return res.dataUrl;
      }
    } catch (e) {
      console.warn('generateProductPreview error:', e);
    }
    return '';
  };

  // Handle Side Switch with Auto-Snapshot
  const handleSwitchSide = async (side: DesignSide) => {
    if (side === activeSide) return;
    await ensureLayeredPreview(activeSide);
    setActiveSide(side);
    setSelectedElementId(null);
  };

  // Open Realistic Preview Modal with Guaranteed Base Product Image
  const handleOpenPreview = async () => {
    // Generate active side snapshot with product image as Layer 1
    await ensureLayeredPreview(activeSide);
    // Also generate opposite side in background so when switching in modal it's ready
    ensureLayeredPreview(activeSide === 'front' ? 'back' : 'front');
    setIsPreviewModalOpen(true);
  };

  // Save Design to Account
  const handleSaveToAccount = async () => {
    setIsSaving(true);
    try {
      const snapFront = (await ensureLayeredPreview('front')) || previewFrontUrl;
      const snapBack = (await ensureLayeredPreview('back')) || previewBackUrl;

      const designConfig: ProductCustomizationConfig = {
        sides: {
          front: { elements: frontElements, previewDataUrl: snapFront || product.image },
          back: { elements: backElements, previewDataUrl: snapBack || snapFront || product.image },
        },
        activeSide,
        selectedColorHex: selectedColor.hex,
        selectedSize,
        previewFrontUrl: snapFront || product.image,
        previewBackUrl: snapBack || snapFront || product.image,
        lastSavedAt: new Date().toISOString(),
      };

      const primaryText =
        frontElements.find((e) => e.type === 'text')?.text ||
        backElements.find((e) => e.type === 'text')?.text ||
        'Custom Design';

      await saveCustomDesign({
        name: `${product.name} Custom`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        selectedColorHex: selectedColor.hex,
        selectedSize,
        designText: primaryText,
        placement: activeSide,
        previewDataUrl: snapFront || product.image,
        previewFrontUrl: snapFront || product.image,
        previewBackUrl: snapBack || snapFront || product.image,
        sides: designConfig.sides as any,
        designConfig,
      });
    } catch (err: any) {
      alert(err.message || 'Error saving design');
    } finally {
      setIsSaving(false);
    }
  };

  // Add Custom Product to Cart
  const handleAddToCart = async () => {
    setIsAddingToCart(true);
    try {
      const snapFront = (await ensureLayeredPreview('front')) || previewFrontUrl;
      const snapBack = (await ensureLayeredPreview('back')) || previewBackUrl;

      const primaryText =
        frontElements.find((e) => e.type === 'text')?.text ||
        backElements.find((e) => e.type === 'text')?.text ||
        '';

      const designConfig: ProductCustomizationConfig = {
        sides: {
          front: { elements: frontElements, previewDataUrl: snapFront || product.image },
          back: { elements: backElements, previewDataUrl: snapBack || snapFront || product.image },
        },
        activeSide,
        selectedColorHex: selectedColor.hex,
        selectedSize,
        previewFrontUrl: snapFront || product.image,
        previewBackUrl: snapBack || snapFront || product.image,
        lastSavedAt: new Date().toISOString(),
      };

      addToCart({
        productId: product.id,
        product: {
          ...product,
          image: snapFront || product.image,
        },
        size: selectedSize,
        color: selectedColor,
        quantity,
        unitPrice,
        customDesign: {
          text: primaryText,
          textColor: frontElements.find((e) => e.type === 'text')?.fill || '#ffffff',
          fontFamily: frontElements.find((e) => e.type === 'text')?.fontFamily || 'Montserrat',
          placement: hasBackCustomization ? 'back' : 'front',
          previewDataUrl: snapFront || product.image,
          previewDataUrlBack: snapBack || previewBackUrl,
          sides: designConfig.sides,
          designConfig,
        },
      });

      setIsCartOpen(true);
      if (onClose) onClose();
      else setActiveView('catalog');
    } catch (err: any) {
      alert(err.message || 'Error adding custom item to cart');
    } finally {
      setIsAddingToCart(false);
    }
  };

  return (
    <div
      id="customizer-full-page"
      className="fixed inset-0 z-40 bg-[#f8fafc] flex flex-col overflow-hidden select-none animate-in fade-in duration-200"
    >
      {/* ================= TOP APPLICATION HEADER ================= */}
      <header
        id="customizer-header"
        className="h-16 px-4 sm:px-6 bg-white border-b border-[#e2e8f0] flex items-center justify-between gap-4 z-30 flex-shrink-0"
      >
        {/* Left: Back to Catalog & Title */}
        <div className="flex items-center gap-3 min-w-0">
          <button
            id="btn-back-to-catalog"
            onClick={() => {
              if (onClose) onClose();
              else setActiveView('catalog');
              setEditingCustomDesign(null);
            }}
            className="w-9 h-9 rounded-xl border border-[#e2e8f0] hover:bg-[#f0f4fc] flex items-center justify-center text-[#1a1c1c] transition-colors cursor-pointer"
            title="Return to Catalog"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>

          <div className="min-w-0">
            <h1 className="font-['Montserrat'] font-bold text-sm sm:text-base text-[#1a1c1c] truncate">
              {product.name}
            </h1>
            <p className="text-[11px] text-[#555f6f] truncate">
              {product.categoryName} • Interactive Print Designer
            </p>
          </div>
        </div>

        {/* Center: Surface / Side Switcher & History Actions */}
        <div className="flex items-center gap-3">
          {/* Surface Pill Switcher (Front | Back) */}
          <div
            id="surface-side-switcher"
            className="flex items-center p-1 bg-[#f0f4fc] rounded-full border border-[#dce2ee] shadow-xs"
          >
            <button
              id="btn-side-front"
              type="button"
              onClick={() => handleSwitchSide('front')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSide === 'front'
                  ? 'bg-[#0058be] text-white shadow-xs'
                  : 'text-[#555f6f] hover:text-[#1a1c1c]'
              }`}
            >
              <span>Front</span>
              {frontElements.length > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold ${
                    activeSide === 'front' ? 'bg-white text-[#0058be]' : 'bg-[#0058be] text-white'
                  }`}
                >
                  {frontElements.length}
                </span>
              )}
            </button>

            <button
              id="btn-side-back"
              type="button"
              onClick={() => handleSwitchSide('back')}
              className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer ${
                activeSide === 'back'
                  ? 'bg-[#0058be] text-white shadow-xs'
                  : 'text-[#555f6f] hover:text-[#1a1c1c]'
              }`}
            >
              <span>Back</span>
              {backElements.length > 0 && (
                <span
                  className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold ${
                    activeSide === 'back' ? 'bg-white text-[#0058be]' : 'bg-[#0058be] text-white'
                  }`}
                >
                  {backElements.length}
                </span>
              )}
            </button>
          </div>

          {/* Undo / Redo Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              id="btn-undo"
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg border border-[#e2e8f0] text-[#555f6f] hover:text-[#1a1c1c] hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-redo"
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg border border-[#e2e8f0] text-[#555f6f] hover:text-[#1a1c1c] hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-clear-side"
              type="button"
              onClick={handleClearSide}
              disabled={currentElements.length === 0}
              className="p-2 rounded-lg border border-[#e2e8f0] text-[#727785] hover:text-[#ba1a1a] hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors"
              title={`Clear ${activeSide} side`}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Right: Preview & Save Quick Buttons */}
        <div className="flex items-center gap-2">
          <button
            id="btn-preview-mode"
            type="button"
            onClick={handleOpenPreview}
            className="py-2 px-3 sm:px-4 rounded-xl bg-white hover:bg-[#f0f4fc] border border-[#dce2ee] text-xs font-semibold text-[#1a1c1c] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
          >
            <Eye className="w-3.5 h-3.5 text-[#0058be]" />
            <span className="hidden sm:inline">Preview Mode</span>
          </button>

          <button
            id="btn-save-design"
            type="button"
            onClick={handleSaveToAccount}
            disabled={isSaving}
            className="py-2 px-3 sm:px-4 rounded-xl bg-white hover:bg-[#f0f4fc] border border-[#dce2ee] text-xs font-semibold text-[#0058be] flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs disabled:opacity-50"
          >
            <Save className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">{isSaving ? 'Saving...' : 'Save Design'}</span>
          </button>
        </div>
      </header>

      {/* ================= 3-COLUMN MAIN WORKSPACE ================= */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-12 gap-4 p-4 overflow-hidden">
        {/* Left Column: Customization Tool Panel (3 cols on large) */}
        <div className="lg:col-span-4 xl:col-span-3 h-full overflow-hidden flex flex-col">
          <ToolPanel
            product={product}
            activeSide={activeSide}
            printArea={printArea}
            elements={currentElements}
            selectedElementId={selectedElementId}
            onSelectElement={setSelectedElementId}
            onAddElement={handleAddElement}
            onUpdateElement={handleUpdateElement}
            onDeleteElement={handleDeleteElement}
            onDuplicateElement={handleDuplicateElement}
            onReorderElements={handleReorderElements}
            selectedColor={selectedColor}
            onSelectColor={setSelectedColor}
            selectedSize={selectedSize}
            onSelectSize={setSelectedSize}
          />
        </div>

        {/* Center Column: Interactive Canvas Stage (5 cols on large) */}
        <div className="lg:col-span-5 xl:col-span-6 h-full flex flex-col gap-3 min-h-0">
          {/* Real-time Quality Alert Banner */}
          <PrintQualityWarning elements={currentElements} printArea={printArea} />

          {/* Canvas Viewport */}
          <div className="flex-1 min-h-0 relative">
            <CanvasEditor
              product={product}
              selectedColor={selectedColor}
              activeSide={activeSide}
              printArea={printArea}
              elements={currentElements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onCommitHistory={() => {
                if (activeSide === 'front') pushHistory(frontElements, backElements, 'front');
                else pushHistory(frontElements, backElements, 'back');
              }}
              showGuides={true}
              onExportPreviewRef={exportPreviewRef}
            />
          </div>
        </div>

        {/* Right Column: Order Summary, Specs & Add to Cart (3 cols on large) */}
        <div className="lg:col-span-3 h-full bg-white rounded-2xl border border-[#e2e8f0] p-4 flex flex-col justify-between shadow-xs overflow-y-auto space-y-4">
          <div className="space-y-4">
            {/* Header & Product Specs */}
            <div>
              <span className="text-[10px] font-bold tracking-wider text-[#0058be] uppercase bg-blue-50 px-2 py-0.5 rounded">
                Custom Printing
              </span>
              <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c] mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-[#555f6f] mt-0.5">
                Printed using non-toxic pigment DTG inks on heavyweight cotton blank.
              </p>
            </div>

            {/* Live Pricing Breakdown */}
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#555f6f]">Base Garment Price:</span>
                <span className="font-semibold text-xs text-[#1a1c1c]">${product.price.toFixed(2)}</span>
              </div>

              {hasBackCustomization && (
                <div className="flex justify-between items-baseline text-xs text-blue-700">
                  <span>Back Print Surcharge:</span>
                  <span className="font-semibold">+$3.50</span>
                </div>
              )}

              {volumeDiscountPercent > 0 && (
                <div className="flex justify-between items-baseline text-xs text-emerald-700">
                  <span>Bulk Discount ({Math.round(volumeDiscountPercent * 100)}% off):</span>
                  <span className="font-semibold">-${(baseItemPrice * volumeDiscountPercent).toFixed(2)}/unit</span>
                </div>
              )}

              <div className="pt-2 border-t border-[#e2e8f0] flex justify-between items-baseline">
                <div>
                  <span className="font-bold text-xs text-[#1a1c1c] block">Unit Price:</span>
                  <span className="text-[10px] text-[#727785]">Includes front & back prints</span>
                </div>
                <div className="text-right">
                  <span className="font-['Montserrat'] font-bold text-lg text-[#0058be]">
                    ${unitPrice.toFixed(2)}
                  </span>
                  <span className="text-[10px] text-[#727785] block">ea.</span>
                </div>
              </div>
            </div>

            {/* Color Swatch Selector */}
            <div>
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-1.5">
                Selected Blank Color
              </label>
              <div className="flex items-center gap-2">
                {product.colors.map((c) => (
                  <button
                    key={c.name}
                    type="button"
                    onClick={() => setSelectedColor(c)}
                    className={`w-7 h-7 rounded-full border-2 transition-all ${
                      selectedColor.hex === c.hex
                        ? 'border-[#0058be] ring-2 ring-[#0058be]/20 scale-110'
                        : 'border-black/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: c.hex }}
                    title={c.name}
                  />
                ))}
                <span className="text-xs font-semibold text-[#1a1c1c] ml-1">{selectedColor.name}</span>
              </div>
            </div>

            {/* Size Selector */}
            <div>
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-1.5">
                Size
              </label>
              <div className="flex flex-wrap gap-1.5">
                {product.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => setSelectedSize(s)}
                    className={`py-1 px-3 rounded-lg text-xs font-bold transition-all ${
                      selectedSize === s
                        ? 'bg-[#0058be] text-white'
                        : 'bg-[#f0f4fc] text-[#1a1c1c] hover:bg-[#e2eaf8]'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>

            {/* Quantity Selector */}
            <div>
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-1.5">
                Order Quantity
              </label>
              <div className="flex items-center justify-between border border-[#dce2ee] rounded-xl p-1 bg-[#fcfcfd]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-sm text-[#1a1c1c] shadow-xs"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm text-[#1a1c1c]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-sm text-[#1a1c1c] shadow-xs"
                >
                  +
                </button>
              </div>
            </div>

            {/* Customization Details Summary */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              <div className="flex items-center justify-between">
                <span className="text-[#727785]">Front Elements:</span>
                <span className="font-semibold text-[#1a1c1c]">{frontElements.length} layers</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727785]">Back Elements:</span>
                <span className="font-semibold text-[#1a1c1c]">{backElements.length} layers</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-[#727785]">Production Turnaround:</span>
                <span className="font-semibold text-emerald-700">2-3 Business Days</span>
              </div>
            </div>
          </div>

          {/* Bottom Total & Primary Action Button */}
          <div className="pt-3 border-t border-[#eeeeee] space-y-3">
            <div className="flex justify-between items-baseline">
              <span className="font-bold text-xs text-[#555f6f]">Estimated Total:</span>
              <span className="font-['Montserrat'] font-bold text-xl text-[#1a1c1c]">
                ${totalPrice.toFixed(2)}
              </span>
            </div>

            <button
              id="btn-add-custom-to-cart"
              type="button"
              onClick={handleAddToCart}
              disabled={isAddingToCart}
              className="w-full py-3 px-4 rounded-xl bg-[#0058be] hover:bg-[#2170e4] font-['Inter'] font-semibold text-xs text-white flex items-center justify-center gap-2 transition-all shadow-md shadow-[#0058be]/25 cursor-pointer disabled:opacity-50"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>{isAddingToCart ? 'Compiling Artwork...' : 'Add Custom Product to Cart'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Realistic Preview Lightbox Modal */}
      <PreviewModal
        isOpen={isPreviewModalOpen}
        onClose={() => setIsPreviewModalOpen(false)}
        product={product}
        selectedColor={selectedColor}
        selectedSize={selectedSize}
        previewFrontUrl={previewFrontUrl}
        previewBackUrl={previewBackUrl}
        onAddToCart={handleAddToCart}
        totalPrice={unitPrice}
      />
    </div>
  );
};
