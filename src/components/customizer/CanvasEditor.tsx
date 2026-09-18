import React, { useEffect, useRef, useState, useCallback } from 'react';
import { Canvas, Rect, Text, IText, FabricImage, Group, FabricObject } from 'fabric';
import { DesignElement, DesignSide, Product, ProductColor, ProductCustomizationView } from '../../types';
import { PrintableAreaConfig } from './types';
import { ZoomControls } from './ZoomControls';
import { Move } from 'lucide-react';
import { generateProductPreview, loadSafeImage } from '../../utils/previewGenerator';
import { getEffectiveCustomizationConfig } from '../../utils/customizationEngine';
import { loadGoogleFont } from '../../services/fontService';

interface CanvasEditorProps {
  product: Product | null;
  selectedColor: ProductColor;
  activeSide: DesignSide;
  activeView?: ProductCustomizationView;
  printArea: PrintableAreaConfig;
  elements: DesignElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onCommitHistory?: () => void;
  showGuides?: boolean;
  onExportPreviewRef?: React.MutableRefObject<(() => Promise<string>) | null>;
}

// Global Fabric object styling defaults for a polished designer UI
FabricObject.ownDefaults.borderColor = '#0058be';
FabricObject.ownDefaults.borderDashArray = [4, 4];
FabricObject.ownDefaults.borderScaleFactor = 1.5;
FabricObject.ownDefaults.cornerColor = '#ffffff';
FabricObject.ownDefaults.cornerStrokeColor = '#0058be';
FabricObject.ownDefaults.cornerSize = 10;
FabricObject.ownDefaults.cornerStyle = 'circle';
FabricObject.ownDefaults.transparentCorners = false;

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  product,
  selectedColor,
  activeSide,
  activeView,
  printArea,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onCommitHistory,
  showGuides = true,
  onExportPreviewRef,
}) => {
  const canvasElRef = useRef<HTMLCanvasElement>(null);
  const fabricRef = useRef<Canvas | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Cached images
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const baseImageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Prevent circular update loops between Fabric events and React state
  const isInternalUpdatingRef = useRef<boolean>(false);

  // Zoom and Pan state
  const [zoom, setZoom] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Snap guide state
  const [snapX, setSnapX] = useState<boolean>(false);
  const [snapY, setSnapY] = useState<boolean>(false);

  // Stage dimensions in virtual coordinate units
  const STAGE_WIDTH = 500;
  const STAGE_HEIGHT = 540;

  // Zoom controls
  const handleZoomIn = () => setZoom((prev) => Math.min(2.5, +(prev + 0.15).toFixed(2)));
  const handleZoomOut = () => setZoom((prev) => Math.max(0.6, +(prev - 0.15).toFixed(2)));
  const handleResetZoom = () => {
    setZoom(1);
    setPanPosition({ x: 0, y: 0 });
  };
  const handleFitToScreen = () => {
    if (!containerRef.current) return;
    const { clientWidth, clientHeight } = containerRef.current;
    const scaleX = (clientWidth - 40) / STAGE_WIDTH;
    const scaleY = (clientHeight - 40) / STAGE_HEIGHT;
    const fitScale = Math.min(scaleX, scaleY, 1.2);
    setZoom(+Math.max(0.6, fitScale).toFixed(2));
    setPanPosition({ x: 0, y: 0 });
  };

  // Mouse wheel zoom / pan
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      const direction = e.deltaY > 0 ? -1 : 1;
      const factor = 0.08;
      setZoom((prev) => {
        const next = prev + direction * factor;
        return +Math.min(2.5, Math.max(0.6, next)).toFixed(2);
      });
    } else if (zoom > 1) {
      setPanPosition((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // Panning handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      setIsPanning(true);
      startPanRef.current = { x: e.clientX - panPosition.x, y: e.clientY - panPosition.y };
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (isPanning) {
      setPanPosition({
        x: e.clientX - startPanRef.current.x,
        y: e.clientY - startPanRef.current.y,
      });
    }
  };

  const handleMouseUp = () => {
    if (isPanning) setIsPanning(false);
  };

  // 1. Initialize Fabric Canvas
  useEffect(() => {
    if (!canvasElRef.current) return;

    const canvas = new Canvas(canvasElRef.current, {
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
      selection: true,
      preserveObjectStacking: true,
      backgroundColor: '#fcfcfd',
    });

    fabricRef.current = canvas;

    // Selection handlers
    const handleSelection = (e: any) => {
      if (isInternalUpdatingRef.current) return;
      const selected = e.selected?.[0];
      if (selected && (selected as any).data?.id) {
        onSelectElement((selected as any).data.id);
      }
    };

    const handleCleared = () => {
      if (isInternalUpdatingRef.current) return;
      onSelectElement(null);
    };

    canvas.on('selection:created', handleSelection);
    canvas.on('selection:updated', handleSelection);
    canvas.on('selection:cleared', handleCleared);

    // Object moving: snap-to-center guidelines
    canvas.on('object:moving', (e: any) => {
      const target = e.target;
      if (!target || !(target as any).data?.id) return;

      const printCenterX = printArea.left + printArea.width / 2;
      const printCenterY = printArea.top + printArea.height / 2;

      const objCenterX = target.left + (target.getScaledWidth() || 0) / 2;
      const objCenterY = target.top + (target.getScaledHeight() || 0) / 2;

      const snapThreshold = 6;
      const nearCenterX = Math.abs(objCenterX - printCenterX) < snapThreshold;
      const nearCenterY = Math.abs(objCenterY - printCenterY) < snapThreshold;

      setSnapX(nearCenterX);
      setSnapY(nearCenterY);

      if (nearCenterX) {
        target.set({ left: printCenterX - (target.getScaledWidth() || 0) / 2 });
      }
      if (nearCenterY) {
        target.set({ top: printCenterY - (target.getScaledHeight() || 0) / 2 });
      }
    });

    // Object modified: update state
    canvas.on('object:modified', (e: any) => {
      setSnapX(false);
      setSnapY(false);

      const target = e.target;
      if (!target || !(target as any).data?.id) return;

      const id = (target as any).data.id;
      const relX = Math.round(target.left - printArea.left);
      const relY = Math.round(target.top - printArea.top);
      const rotation = Math.round(target.angle || 0);
      const scaleX = +(target.scaleX || 1).toFixed(3);
      const scaleY = +(target.scaleY || 1).toFixed(3);

      isInternalUpdatingRef.current = true;
      onUpdateElement(id, {
        x: relX,
        y: relY,
        rotation,
        scaleX,
        scaleY,
      });
      isInternalUpdatingRef.current = false;

      if (onCommitHistory) onCommitHistory();
    });

    return () => {
      canvas.dispose();
      fabricRef.current = null;
    };
  }, []);

  // 2. Render Base Product Mockup & Background
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    const config = getEffectiveCustomizationConfig(product);
    const currentView =
      activeView ||
      config.views.find((v) => v.id === activeSide) ||
      config.views[0];

    const activeSideMockup = product?.mockupImages?.find((m) => m.side === activeSide);
    const productImageUrl =
      currentView?.mockupUrl ||
      activeSideMockup?.url ||
      product?.image ||
      'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80';

    const drawBaseProduct = (img: HTMLImageElement) => {
      if (!fabricRef.current) return;

      // Remove existing background and base objects
      const existingBase = canvas
        .getObjects()
        .filter((o) => (o as any).name?.startsWith('base-'));
      existingBase.forEach((o) => canvas.remove(o));

      // Calculate aspect ratio
      const padding = 16;
      const availW = STAGE_WIDTH - padding * 2;
      const availH = STAGE_HEIGHT - padding * 2;
      const naturalW = img.naturalWidth || 500;
      const naturalH = img.naturalHeight || 540;
      const imgRatio = naturalW / naturalH;
      const targetRatio = availW / availH;

      let drawW = availW;
      let drawH = availH;
      if (imgRatio > targetRatio) {
        drawW = availW;
        drawH = availW / imgRatio;
      } else {
        drawH = availH;
        drawW = availH * imgRatio;
      }

      const drawX = Math.round((STAGE_WIDTH - drawW) / 2);
      const drawY = Math.round((STAGE_HEIGHT - drawH) / 2);

      // 1. FabricImage for Product Mockup
      const scaleX = drawW / naturalW;
      const scaleY = drawH / naturalH;

      const productMockup = new FabricImage(img, {
        left: drawX,
        top: drawY,
        scaleX,
        scaleY,
        selectable: false,
        evented: false,
        hoverCursor: 'default',
        name: 'base-product-image',
      });
      canvas.insertAt(productMockup, 0);

      // 2. Color tint overlay if enabled
      const tintingEnabled = config.colorTinting?.enabled !== false;
      if (tintingEnabled && selectedColor.hex && selectedColor.hex.toLowerCase() !== '#ffffff') {
        const tintRect = new Rect({
          left: drawX,
          top: drawY,
          width: drawW,
          height: drawH,
          fill: selectedColor.hex,
          opacity: config.colorTinting?.opacity || 0.36,
          rx: 8,
          ry: 8,
          selectable: false,
          evented: false,
          name: 'base-color-tint',
        });
        canvas.insertAt(tintRect, 1);
      }

      // 3. Dynamic View Indicator Pill
      if (config.views.length > 1 && currentView && currentView.name) {
        const badgeText = currentView.name.toUpperCase();
        const estWidth = Math.max(90, badgeText.length * 9 + 24);

        const badgeBg = new Rect({
          width: estWidth,
          height: 22,
          fill: '#1a1c1c',
          opacity: 0.75,
          rx: 11,
          ry: 11,
          originX: 'center',
          originY: 'center',
        });

        const badgeLabel = new Text(badgeText, {
          fontSize: 9,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fill: '#ffffff',
          originX: 'center',
          originY: 'center',
        });

        const badgeGroup = new Group([badgeBg, badgeLabel], {
          left: STAGE_WIDTH - estWidth - 16,
          top: 16,
          selectable: false,
          evented: false,
        });
        (badgeGroup as any).name = 'base-view-badge';

        canvas.add(badgeGroup);
      }

      canvas.requestRenderAll();
    };

    const cached = baseImageCacheRef.current.get(productImageUrl);
    if (cached && cached.complete && cached.naturalWidth > 0) {
      drawBaseProduct(cached);
    } else {
      let isCurrent = true;
      loadSafeImage(productImageUrl)
        .then((img) => {
          if (!isCurrent) return;
          baseImageCacheRef.current.set(productImageUrl, img);
          drawBaseProduct(img);
        })
        .catch((err) => {
          console.warn('Failed to load base product image:', err);
        });
      return () => {
        isCurrent = false;
      };
    }
  }, [product, selectedColor, activeSide, activeView]);

  // 3. Render Guides (Printable Area Boundary & Safe Zone)
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    // Remove existing guide objects
    const existingGuides = canvas
      .getObjects()
      .filter((o) => (o as any).name?.startsWith('guide-'));
    existingGuides.forEach((o) => canvas.remove(o));

    if (showGuides) {
      const isCircle = printArea.shape === 'circle';
      const isRounded = printArea.shape === 'rounded' || isCircle;
      const cornerRadius = isCircle
        ? Math.min(printArea.width, printArea.height) / 2
        : printArea.borderRadius || (isRounded ? 16 : 0);

      // Outer dashed printable area box
      const printBox = new Rect({
        left: printArea.left,
        top: printArea.top,
        width: printArea.width,
        height: printArea.height,
        fill: 'transparent',
        stroke: '#0058be',
        strokeWidth: 1.5,
        strokeDashArray: [6, 4],
        rx: cornerRadius,
        ry: cornerRadius,
        opacity: 0.8,
        selectable: false,
        evented: false,
        name: 'guide-print-box',
      });
      canvas.add(printBox);

      // Safe zone inner box
      const safeW = Math.max(20, printArea.width - printArea.safeMargin * 2);
      const safeH = Math.max(20, printArea.height - printArea.safeMargin * 2);
      const safeRadius = Math.max(0, cornerRadius - printArea.safeMargin);

      const safeBox = new Rect({
        left: printArea.left + printArea.safeMargin,
        top: printArea.top + printArea.safeMargin,
        width: safeW,
        height: safeH,
        fill: 'transparent',
        stroke: '#16a34a',
        strokeWidth: 1,
        strokeDashArray: [3, 3],
        rx: safeRadius,
        ry: safeRadius,
        opacity: 0.5,
        selectable: false,
        evented: false,
        name: 'guide-safe-box',
      });
      canvas.add(safeBox);

      // Printable area label tag
      const labelTag = new Text(
        `Printable Area (${printArea.width} × ${printArea.height}${printArea.shape ? ` • ${printArea.shape}` : ''})`,
        {
          left: printArea.left + 6,
          top: Math.max(6, printArea.top - 18),
          fontSize: 10,
          fontFamily: 'Inter',
          fontWeight: 'bold',
          fill: '#0058be',
          selectable: false,
          evented: false,
          name: 'guide-label',
        }
      );
      canvas.add(labelTag);
    }

    canvas.requestRenderAll();
  }, [printArea, showGuides]);

  // 4. Render Design Elements on Fabric Canvas
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas) return;

    let isMounted = true;

    // Remove existing user design objects (keep base and guides)
    const existingDesignObjects = canvas
      .getObjects()
      .filter((o) => (o as any).name?.startsWith('element-'));
    existingDesignObjects.forEach((o) => canvas.remove(o));

    const renderElementsAsync = async () => {
      for (const el of elements) {
        if (el.visible === false) continue;

        const absLeft = printArea.left + el.x;
        const absTop = printArea.top + el.y;

        if (el.type === 'text') {
          // Preload Google Font before rendering text element
          if (el.fontFamily) {
            await loadGoogleFont(el.fontFamily);
          }
          if (!isMounted) return;

          const textObj = new IText(el.text || 'Your Text', {
            left: absLeft,
            top: absTop,
            fontSize: el.fontSize || 24,
            fontFamily: el.fontFamily || 'Montserrat',
            fill: el.fill || '#111111',
            fontWeight: el.fontStyle === 'bold' ? 'bold' : 'normal',
            fontStyle: el.fontStyle === 'italic' ? 'italic' : 'normal',
            textAlign: el.align || 'center',
            charSpacing: (el.letterSpacing || 0) * 50,
            angle: el.rotation || 0,
            scaleX: el.scaleX || 1,
            scaleY: el.scaleY || 1,
            opacity: el.opacity ?? 1,
            selectable: !el.locked,
            evented: !el.locked,
            lockMovementX: !!el.locked,
            lockMovementY: !!el.locked,
            lockRotation: !!el.locked,
            lockScalingX: !!el.locked,
            lockScalingY: !!el.locked,
            name: `element-${el.id}`,
            data: { id: el.id },
          });

          canvas.add(textObj);
        } else if (el.type === 'image' && el.src) {
          let cachedImg = imageCacheRef.current.get(el.src);
          if (!cachedImg) {
            try {
              cachedImg = await loadSafeImage(el.src);
              imageCacheRef.current.set(el.src, cachedImg);
            } catch (err) {
              console.warn('Failed to load design element image:', el.src, err);
            }
          }
          if (!isMounted) return;

          if (cachedImg) {
            const naturalW = cachedImg.naturalWidth || el.width;
            const naturalH = cachedImg.naturalHeight || el.height;
            const baseScaleX = (el.width / naturalW) * (el.scaleX || 1);
            const baseScaleY = (el.height / naturalH) * (el.scaleY || 1);

            const imgObj = new FabricImage(cachedImg, {
              left: absLeft,
              top: absTop,
              scaleX: baseScaleX,
              scaleY: baseScaleY,
              angle: el.rotation || 0,
              opacity: el.opacity ?? 1,
              selectable: !el.locked,
              evented: !el.locked,
              lockMovementX: !!el.locked,
              lockMovementY: !!el.locked,
              lockRotation: !!el.locked,
              lockScalingX: !!el.locked,
              lockScalingY: !!el.locked,
              name: `element-${el.id}`,
              data: { id: el.id },
            });

            canvas.add(imgObj);
          }
        }
      }

      // Synchronize active selection
      if (selectedElementId) {
        const targetObj = canvas
          .getObjects()
          .find((o) => (o as any).data?.id === selectedElementId);
        if (targetObj) {
          isInternalUpdatingRef.current = true;
          canvas.setActiveObject(targetObj);
          isInternalUpdatingRef.current = false;
        }
      } else {
        isInternalUpdatingRef.current = true;
        canvas.discardActiveObject();
        isInternalUpdatingRef.current = false;
      }

      canvas.requestRenderAll();
    };

    renderElementsAsync();

    return () => {
      isMounted = false;
    };
  }, [elements, printArea]);

  // 5. Synchronize external selectedElementId changes
  useEffect(() => {
    const canvas = fabricRef.current;
    if (!canvas || isInternalUpdatingRef.current) return;

    if (selectedElementId) {
      const obj = canvas
        .getObjects()
        .find((o) => (o as any).data?.id === selectedElementId);
      if (obj && canvas.getActiveObject() !== obj) {
        isInternalUpdatingRef.current = true;
        canvas.setActiveObject(obj);
        canvas.requestRenderAll();
        isInternalUpdatingRef.current = false;
      }
    } else {
      if (canvas.getActiveObject()) {
        isInternalUpdatingRef.current = true;
        canvas.discardActiveObject();
        canvas.requestRenderAll();
        isInternalUpdatingRef.current = false;
      }
    }
  }, [selectedElementId]);

  // 6. Expose exportPreviewDataUrl with Fabric composite export
  useEffect(() => {
    if (onExportPreviewRef) {
      onExportPreviewRef.current = async () => {
        try {
          // Generate high-definition composite preview with base product mockup as Layer 1
          const previewResult = await generateProductPreview({
            product,
            selectedColor,
            activeSide,
            view: activeView,
            printArea,
            elements,
          });
          if (previewResult.dataUrl) {
            return previewResult.dataUrl;
          }
        } catch (err) {
          console.warn('Dedicated preview generator note, using Fabric canvas export:', err);
        }

        const canvas = fabricRef.current;
        if (!canvas) return '';

        // Temporarily hide guides and selection for clean export
        const guideObjects = canvas
          .getObjects()
          .filter((o) => (o as any).name?.startsWith('guide-'));
        const activeObj = canvas.getActiveObject();

        guideObjects.forEach((g) => (g.visible = false));
        canvas.discardActiveObject();
        canvas.renderAll();

        let dataUrl = '';
        try {
          dataUrl = canvas.toDataURL({
            format: 'png',
            multiplier: 2,
          });
        } catch (e) {
          console.warn('canvas.toDataURL failed:', e);
        }

        // Restore guides and selection
        guideObjects.forEach((g) => (g.visible = true));
        if (activeObj) {
          canvas.setActiveObject(activeObj);
        }
        canvas.requestRenderAll();

        return dataUrl;
      };
    }
  }, [onExportPreviewRef, product, selectedColor, activeSide, activeView, printArea, elements]);

  return (
    <div
      id="customizer-canvas-viewport"
      className="relative w-full h-full flex items-center justify-center overflow-hidden select-none bg-[#f4f6fa] rounded-2xl border border-[#e2e8f0]"
      onWheel={handleWheel}
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
    >
      {/* Background Product Mockup Card */}
      <div
        id="product-mockup-stage"
        className="relative transition-transform duration-100 ease-out origin-center flex items-center justify-center pointer-events-auto rounded-3xl shadow-xl overflow-hidden bg-white border border-[#e2e8f0]"
        style={{
          width: `${STAGE_WIDTH}px`,
          height: `${STAGE_HEIGHT}px`,
          transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`,
          cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        }}
      >
        {/* Fabric.js HTML5 Canvas Container */}
        <canvas
          ref={canvasElRef}
          width={STAGE_WIDTH}
          height={STAGE_HEIGHT}
          className="absolute inset-0 z-10"
        />

        {/* Snap-to-center guidelines */}
        {snapX && (
          <div
            className="absolute top-0 bottom-0 border-l border-dashed border-red-500 z-20 pointer-events-none"
            style={{ left: `${printArea.left + printArea.width / 2}px` }}
          />
        )}
        {snapY && (
          <div
            className="absolute left-0 right-0 border-t border-dashed border-red-500 z-20 pointer-events-none"
            style={{ top: `${printArea.top + printArea.height / 2}px` }}
          />
        )}
      </div>

      {/* Floating Zoom Controls Bar */}
      <div className="absolute bottom-4 left-4 z-30">
        <ZoomControls
          zoom={zoom}
          onZoomIn={handleZoomIn}
          onZoomOut={handleZoomOut}
          onResetZoom={handleResetZoom}
          onFitToScreen={handleFitToScreen}
        />
      </div>

      {/* Helper interaction chip */}
      <div className="absolute bottom-4 right-4 z-30 hidden md:flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/90 backdrop-blur-sm border border-[#e2e8f0] text-[11px] text-[#555f6f] shadow-xs">
        <Move className="w-3 h-3 text-[#0058be]" />
        <span>Fabric.js Editor • Click to select • Drag handles to rotate & resize</span>
      </div>
    </div>
  );
};
