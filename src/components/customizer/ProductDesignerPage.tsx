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
  ProductCustomizationView,
  SideDesignState,
  Size,
} from '../../types';
import { useApp } from '../../context/AppContext';
import { CanvasEditor } from './CanvasEditor';
import { ToolPanel } from './ToolPanel';
import { PreviewModal } from './PreviewModal';
import { PrintQualityWarning } from './PrintQualityWarning';
import { getProductPrintArea, PrintableAreaConfig } from './types';
import { generateProductPreview } from '../../utils/previewGenerator';
import {
  getEffectiveCustomizationConfig,
  resolvePrintableAreaPixels,
} from '../../utils/customizationEngine';

interface ProductDesignerPageProps {
  onClose?: () => void;
}

interface EditorHistorySnapshot {
  viewsElements: Record<string, DesignElement[]>;
  activeViewId: string;
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

  // Dynamic Customization Configuration (Derived data-driven for ANY product)
  const customizationConfig = useMemo(
    () => getEffectiveCustomizationConfig(product),
    [product]
  );
  const views: ProductCustomizationView[] = customizationConfig.views;

  // Active View / Surface (Front, Back, Wrap, Sleeve, etc.)
  const [activeViewId, setActiveViewId] = useState<string>(() => views[0]?.id || 'front');

  // Keep activeViewId synchronized with available views
  useEffect(() => {
    if (views.length > 0 && !views.some((v) => v.id === activeViewId)) {
      setActiveViewId(views[0].id);
    }
  }, [views, activeViewId]);

  // Current view definition
  const currentView = useMemo(
    () => views.find((v) => v.id === activeViewId) || views[0],
    [views, activeViewId]
  );

  // Variant state
  const [selectedColor, setSelectedColor] = useState<ProductColor>(
    product.colors[0] || { name: 'Standard', hex: '#ffffff' }
  );
  const [selectedSize, setSelectedSize] = useState<Size>(
    product.sizes[1] || product.sizes[0] || 'Standard'
  );
  const [quantity, setQuantity] = useState<number>(1);

  // Generic data-driven elements mapped by view ID (e.g. { 'front': [...], 'back': [...], 'wrap': [...] })
  const [viewsElements, setViewsElements] = useState<Record<string, DesignElement[]>>({});

  // Elements on current active view
  const currentElements = viewsElements[activeViewId] || [];

  // Selection
  const [selectedElementId, setSelectedElementId] = useState<string | null>(null);

  // Undo / Redo History Stack (Generic across all surfaces)
  const [history, setHistory] = useState<EditorHistorySnapshot[]>([]);
  const [historyIndex, setHistoryIndex] = useState<number>(-1);

  // Modals & Dynamic Snapshot States
  const [isPreviewModalOpen, setIsPreviewModalOpen] = useState<boolean>(false);
  const [viewsPreviews, setViewsPreviews] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [isAddingToCart, setIsAddingToCart] = useState<boolean>(false);

  // Ref to trigger stage snapshot
  const exportPreviewRef = useRef<(() => Promise<string>) | null>(null);

  // Data-driven printable area configuration calculated from product's view config
  const printArea: PrintableAreaConfig = useMemo(() => {
    if (currentView?.printableArea) {
      const resolved = resolvePrintableAreaPixels(currentView.printableArea);
      return {
        width: resolved.width,
        height: resolved.height,
        top: resolved.y,
        left: resolved.x,
        safeMargin: resolved.safeMargin,
        shape: resolved.shape,
        borderRadius: resolved.borderRadius,
      };
    }
    return getProductPrintArea(product, activeViewId);
  }, [currentView, product, activeViewId]);

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
        const restored: Record<string, DesignElement[]> = {};
        Object.entries(cfgSides).forEach(([key, sideData]: [string, any]) => {
          if (sideData?.elements && Array.isArray(sideData.elements)) {
            restored[key] = sideData.elements;
          }
        });
        setViewsElements(restored);
      } else if (editingCustomDesign.designText) {
        // Fallback for legacy simple designs
        const firstViewId = views[0]?.id || 'front';
        setViewsElements({
          [firstViewId]: [
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
          ],
        });
      }
    }
  }, [editingCustomDesign, product, views]);

  // Push history snapshot
  const pushHistory = (newViewsElements: Record<string, DesignElement[]>, viewId: string) => {
    const snapshot: EditorHistorySnapshot = {
      viewsElements: JSON.parse(JSON.stringify(newViewsElements)),
      activeViewId: viewId,
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
      setViewsElements(state.viewsElements);
      setActiveViewId(state.activeViewId);
      setHistoryIndex(prevIndex);
      setSelectedElementId(null);
    }
  };

  // Redo
  const handleRedo = () => {
    if (historyIndex < history.length - 1) {
      const nextIndex = historyIndex + 1;
      const state = history[nextIndex];
      setViewsElements(state.viewsElements);
      setActiveViewId(state.activeViewId);
      setHistoryIndex(nextIndex);
      setSelectedElementId(null);
    }
  };

  // Element actions on active view
  const handleAddElement = (newEl: DesignElement) => {
    setViewsElements((prev) => {
      const current = prev[activeViewId] || [];
      const updated = [...current, newEl];
      const nextState = { ...prev, [activeViewId]: updated };
      pushHistory(nextState, activeViewId);
      return nextState;
    });
  };

  const handleUpdateElement = (id: string, updates: Partial<DesignElement>) => {
    setViewsElements((prev) => {
      const current = prev[activeViewId] || [];
      const updated = current.map((el) => (el.id === id ? { ...el, ...updates } : el));
      return { ...prev, [activeViewId]: updated };
    });
  };

  const handleDeleteElement = (id: string) => {
    setViewsElements((prev) => {
      const current = prev[activeViewId] || [];
      const updated = current.filter((el) => el.id !== id);
      const nextState = { ...prev, [activeViewId]: updated };
      pushHistory(nextState, activeViewId);
      return nextState;
    });
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
    setViewsElements((prev) => {
      const nextState = { ...prev, [activeViewId]: newElements };
      pushHistory(nextState, activeViewId);
      return nextState;
    });
  };

  // Clear current view canvas
  const handleClearSide = () => {
    if (currentElements.length === 0) return;
    if (window.confirm(`Clear all design elements on ${currentView?.name || activeViewId}?`)) {
      setViewsElements((prev) => {
        const nextState = { ...prev, [activeViewId]: [] };
        pushHistory(nextState, activeViewId);
        return nextState;
      });
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

  // Base price + customization fee based on number of customized surfaces
  const customizedSurfacesCount = useMemo(() => {
    return (Object.values(viewsElements) as DesignElement[][]).filter((elems) => elems && elems.length > 0).length;
  }, [viewsElements]);

  const extraSurfacesCount = Math.max(0, customizedSurfacesCount - 1);
  const extraSurfacePrice = customizationConfig.pricing?.extraViewPrice ?? 3.5;
  const printFeePerItem = extraSurfacesCount * extraSurfacePrice;
  const baseItemPrice = product.price + printFeePerItem;
  const unitPrice = +(baseItemPrice * (1 - volumeDiscountPercent)).toFixed(2);
  const totalPrice = +(unitPrice * quantity).toFixed(2);

  // Helper to ensure full layered preview (product image as base layer) for any view
  const ensureLayeredPreview = async (viewId: string): Promise<string> => {
    const targetView = views.find((v) => v.id === viewId) || views[0];
    const sideElements = viewsElements[viewId] || [];
    const sidePrintArea = targetView?.printableArea
      ? resolvePrintableAreaPixels(targetView.printableArea)
      : getProductPrintArea(product, viewId);

    try {
      const res = await generateProductPreview({
        product,
        selectedColor,
        activeSide: viewId,
        view: targetView,
        printArea: sidePrintArea,
        elements: sideElements,
      });
      if (res.dataUrl) {
        setViewsPreviews((prev) => ({ ...prev, [viewId]: res.dataUrl }));
        return res.dataUrl;
      }
    } catch (e) {
      console.warn('generateProductPreview error:', e);
    }
    return viewsPreviews[viewId] || targetView?.mockupUrl || product.image || '';
  };

  // Handle View / Surface Switch with Auto-Snapshot
  const handleSwitchSide = async (viewId: string) => {
    if (viewId === activeViewId) return;
    await ensureLayeredPreview(activeViewId);
    setActiveViewId(viewId);
    setSelectedElementId(null);
  };

  // Open Realistic Preview Modal with Guaranteed Base Product Image
  const handleOpenPreview = async () => {
    // Generate active side snapshot with product image as Layer 1
    await ensureLayeredPreview(activeViewId);
    // Also generate previews for other views that have customized elements
    for (const v of views) {
      if (v.id !== activeViewId && (viewsElements[v.id]?.length || 0) > 0) {
        ensureLayeredPreview(v.id);
      }
    }
    setIsPreviewModalOpen(true);
  };

  // Save Design to Account
  const handleSaveToAccount = async () => {
    setIsSaving(true);
    try {
      const activeSnap = (await ensureLayeredPreview(activeViewId)) || viewsPreviews[activeViewId] || product.image;

      // Compile sides record with snapshots
      const compiledSides: Record<string, SideDesignState> = {};
      for (const v of views) {
        const vElems = viewsElements[v.id] || [];
        const vSnap = viewsPreviews[v.id] || (vElems.length > 0 ? await ensureLayeredPreview(v.id) : v.mockupUrl || product.image);
        compiledSides[v.id] = {
          elements: vElems,
          previewDataUrl: vSnap,
        };
      }

      const designConfig: ProductCustomizationConfig = {
        sides: compiledSides as any,
        activeSide: activeViewId,
        selectedColorHex: selectedColor.hex,
        selectedSize,
        previewFrontUrl: compiledSides['front']?.previewDataUrl || activeSnap,
        previewBackUrl: compiledSides['back']?.previewDataUrl || activeSnap,
        lastSavedAt: new Date().toISOString(),
      };

      // Extract primary text for title
      let primaryText = 'Custom Design';
      for (const elems of Object.values(viewsElements) as DesignElement[][]) {
        const found = elems.find((e) => e.type === 'text')?.text;
        if (found) {
          primaryText = found;
          break;
        }
      }

      await saveCustomDesign({
        name: `${product.name} Custom`,
        productId: product.id,
        productName: product.name,
        productImage: product.image,
        selectedColorHex: selectedColor.hex,
        selectedSize,
        designText: primaryText,
        placement: activeViewId,
        previewDataUrl: activeSnap,
        previewFrontUrl: compiledSides['front']?.previewDataUrl || activeSnap,
        previewBackUrl: compiledSides['back']?.previewDataUrl || activeSnap,
        sides: compiledSides as any,
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
      const activeSnap = (await ensureLayeredPreview(activeViewId)) || viewsPreviews[activeViewId] || product.image;

      const compiledSides: Record<string, SideDesignState> = {};
      for (const v of views) {
        const vElems = viewsElements[v.id] || [];
        const vSnap = viewsPreviews[v.id] || (vElems.length > 0 ? await ensureLayeredPreview(v.id) : v.mockupUrl || product.image);
        compiledSides[v.id] = {
          elements: vElems,
          previewDataUrl: vSnap,
        };
      }

      let primaryText = '';
      let textColor = '#ffffff';
      let fontFamily = 'Montserrat';
      for (const elems of Object.values(viewsElements) as DesignElement[][]) {
        const textEl = elems.find((e) => e.type === 'text');
        if (textEl) {
          primaryText = textEl.text;
          textColor = textEl.fill || '#ffffff';
          fontFamily = textEl.fontFamily || 'Montserrat';
          break;
        }
      }

      const designConfig: ProductCustomizationConfig = {
        sides: compiledSides as any,
        activeSide: activeViewId,
        selectedColorHex: selectedColor.hex,
        selectedSize,
        previewFrontUrl: compiledSides['front']?.previewDataUrl || activeSnap,
        previewBackUrl: compiledSides['back']?.previewDataUrl || activeSnap,
        lastSavedAt: new Date().toISOString(),
      };

      addToCart({
        productId: product.id,
        product: {
          ...product,
          image: activeSnap || product.image,
        },
        size: selectedSize,
        color: selectedColor,
        quantity,
        unitPrice,
        customDesign: {
          text: primaryText,
          textColor,
          fontFamily,
          placement: activeViewId,
          previewDataUrl: activeSnap,
          previewDataUrlBack: compiledSides['back']?.previewDataUrl || viewsPreviews['back'],
          sides: compiledSides as any,
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
          {/* Surface Pill Switcher (Dynamic for any product views: Front, Back, Wrap, Left, Right, etc.) */}
          {views.length > 1 ? (
            <div
              id="surface-side-switcher"
              className="flex items-center p-1 bg-[#f0f4fc] rounded-full border border-[#dce2ee] shadow-xs max-w-[280px] sm:max-w-none overflow-x-auto scrollbar-none"
            >
              {views.map((v) => {
                const count = (viewsElements[v.id] || []).length;
                const isActive = activeViewId === v.id;
                return (
                  <button
                    key={v.id}
                    id={`btn-side-${v.id}`}
                    type="button"
                    onClick={() => handleSwitchSide(v.id)}
                    className={`px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer whitespace-nowrap ${
                      isActive
                        ? 'bg-[#0058be] text-white shadow-xs'
                        : 'text-[#555f6f] hover:text-[#1a1c1c]'
                    }`}
                  >
                    <span>{v.name}</span>
                    {count > 0 && (
                      <span
                        className={`w-4 h-4 rounded-full text-[10px] flex items-center justify-center font-semibold ${
                          isActive ? 'bg-white text-[#0058be]' : 'bg-[#0058be] text-white'
                        }`}
                      >
                        {count}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>
          ) : (
            <div className="text-xs font-bold text-[#555f6f] px-3.5 py-1 bg-[#f0f4fc] rounded-full border border-[#dce2ee]">
              {views[0]?.name || 'Single Surface'}
            </div>
          )}

          {/* Undo / Redo Controls */}
          <div className="hidden sm:flex items-center gap-1">
            <button
              id="btn-undo"
              type="button"
              onClick={handleUndo}
              disabled={historyIndex <= 0}
              className="p-2 rounded-lg border border-[#e2e8f0] text-[#555f6f] hover:text-[#1a1c1c] hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Undo (Ctrl+Z)"
            >
              <RotateCcw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-redo"
              type="button"
              onClick={handleRedo}
              disabled={historyIndex >= history.length - 1}
              className="p-2 rounded-lg border border-[#e2e8f0] text-[#555f6f] hover:text-[#1a1c1c] hover:bg-gray-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title="Redo (Ctrl+Y)"
            >
              <RotateCw className="w-3.5 h-3.5" />
            </button>

            <button
              id="btn-clear-side"
              type="button"
              onClick={handleClearSide}
              disabled={currentElements.length === 0}
              className="p-2 rounded-lg border border-[#e2e8f0] text-[#727785] hover:text-[#ba1a1a] hover:bg-red-50 disabled:opacity-30 disabled:hover:bg-transparent transition-colors cursor-pointer"
              title={`Clear ${currentView?.name || activeViewId}`}
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
            activeSide={activeViewId}
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
              activeSide={activeViewId}
              activeView={currentView}
              printArea={printArea}
              elements={currentElements}
              selectedElementId={selectedElementId}
              onSelectElement={setSelectedElementId}
              onUpdateElement={handleUpdateElement}
              onCommitHistory={() => {
                pushHistory(viewsElements, activeViewId);
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
                {customizationConfig.printMethod || 'Custom Print'}
              </span>
              <h3 className="font-['Montserrat'] font-bold text-base text-[#1a1c1c] mt-1">
                {product.name}
              </h3>
              <p className="text-xs text-[#555f6f] mt-0.5">
                {product.description || 'Configurable customizable product.'}
              </p>
            </div>

            {/* Live Pricing Breakdown */}
            <div className="p-3.5 rounded-xl bg-[#f8fafc] border border-[#e2e8f0] space-y-2">
              <div className="flex justify-between items-baseline">
                <span className="text-xs text-[#555f6f]">Base Item Price:</span>
                <span className="font-semibold text-xs text-[#1a1c1c]">${product.price.toFixed(2)}</span>
              </div>

              {extraSurfacesCount > 0 && (
                <div className="flex justify-between items-baseline text-xs text-blue-700">
                  <span>Extra Surface Print ({extraSurfacesCount}x):</span>
                  <span className="font-semibold">+${printFeePerItem.toFixed(2)}</span>
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
                  <span className="text-[10px] text-[#727785]">
                    {customizedSurfacesCount <= 1
                      ? 'Includes custom print'
                      : `Includes ${customizedSurfacesCount} custom surfaces`}
                  </span>
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
            {product.colors && product.colors.length > 0 && (
              <div>
                <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-1.5">
                  Color / Finish
                </label>
                <div className="flex items-center gap-2">
                  {product.colors.map((c) => (
                    <button
                      key={c.name}
                      type="button"
                      onClick={() => setSelectedColor(c)}
                      className={`w-7 h-7 rounded-full border-2 transition-all cursor-pointer ${
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
            )}

            {/* Size / Option Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div>
                <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-1.5">
                  Size / Option
                </label>
                <div className="flex flex-wrap gap-1.5">
                  {product.sizes.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setSelectedSize(s)}
                      className={`py-1 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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
            )}

            {/* Quantity Selector */}
            <div>
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-1.5">
                Order Quantity
              </label>
              <div className="flex items-center justify-between border border-[#dce2ee] rounded-xl p-1 bg-[#fcfcfd]">
                <button
                  type="button"
                  onClick={() => setQuantity((q) => Math.max(1, q - 1))}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-sm text-[#1a1c1c] shadow-xs cursor-pointer"
                >
                  -
                </button>
                <span className="font-mono font-bold text-sm text-[#1a1c1c]">{quantity}</span>
                <button
                  type="button"
                  onClick={() => setQuantity((q) => q + 1)}
                  className="w-8 h-8 rounded-lg bg-white hover:bg-gray-100 flex items-center justify-center font-bold text-sm text-[#1a1c1c] shadow-xs cursor-pointer"
                >
                  +
                </button>
              </div>
            </div>

            {/* Customization Details Summary (Dynamic per view) */}
            <div className="p-3 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-1.5">
              {views.map((v) => (
                <div key={v.id} className="flex items-center justify-between">
                  <span className="text-[#727785]">{v.name}:</span>
                  <span className="font-semibold text-[#1a1c1c]">
                    {(viewsElements[v.id] || []).length} layers
                  </span>
                </div>
              ))}
              <div className="flex items-center justify-between pt-1 border-t border-gray-200">
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
        views={views}
        previewsByView={viewsPreviews}
        activeViewId={activeViewId}
        previewFrontUrl={viewsPreviews['front']}
        previewBackUrl={viewsPreviews['back']}
        onAddToCart={handleAddToCart}
        totalPrice={unitPrice}
      />
    </div>
  );
};
