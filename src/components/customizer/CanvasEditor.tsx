import React, { useEffect, useRef, useState, useCallback } from 'react';
import Konva from 'konva';
import { DesignElement, DesignSide, Product, ProductColor } from '../../types';
import { PrintableAreaConfig } from './types';
import { ZoomControls } from './ZoomControls';
import { Eye, EyeOff, Lock, Unlock, Move } from 'lucide-react';

interface CanvasEditorProps {
  product: Product | null;
  selectedColor: ProductColor;
  activeSide: DesignSide;
  printArea: PrintableAreaConfig;
  elements: DesignElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onCommitHistory?: () => void;
  showGuides?: boolean;
  onExportPreviewRef?: React.MutableRefObject<(() => Promise<string>) | null>;
}

export const CanvasEditor: React.FC<CanvasEditorProps> = ({
  product,
  selectedColor,
  activeSide,
  printArea,
  elements,
  selectedElementId,
  onSelectElement,
  onUpdateElement,
  onCommitHistory,
  showGuides = true,
  onExportPreviewRef,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const stageRef = useRef<Konva.Stage | null>(null);
  const layerRef = useRef<Konva.Layer | null>(null);
  const guideLayerRef = useRef<Konva.Layer | null>(null);
  const transformerRef = useRef<Konva.Transformer | null>(null);

  // Loaded images cache
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());

  // Zoom state
  const [zoom, setZoom] = useState<number>(1);
  const [panPosition, setPanPosition] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [isPanning, setIsPanning] = useState<boolean>(false);
  const startPanRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Snap guide states
  const [snapX, setSnapX] = useState<boolean>(false);
  const [snapY, setSnapY] = useState<boolean>(false);

  // Virtual stage dimensions
  const STAGE_WIDTH = 500;
  const STAGE_HEIGHT = 540;

  // Zoom handlers
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

  // Mouse wheel zoom
  const handleWheel = (e: React.WheelEvent<HTMLDivElement>) => {
    e.preventDefault();
    if (e.ctrlKey || e.metaKey) {
      // Zoom
      const direction = e.deltaY > 0 ? -1 : 1;
      const factor = 0.08;
      setZoom((prev) => {
        const next = prev + direction * factor;
        return +Math.min(2.5, Math.max(0.6, next)).toFixed(2);
      });
    } else if (zoom > 1) {
      // Pan when zoomed in
      setPanPosition((prev) => ({
        x: prev.x - e.deltaX * 0.8,
        y: prev.y - e.deltaY * 0.8,
      }));
    }
  };

  // Panning start
  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      // Middle click or Alt+drag to pan
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

  // Expose exportPreviewDataUrl
  useEffect(() => {
    if (onExportPreviewRef) {
      onExportPreviewRef.current = async () => {
        const stage = stageRef.current;
        const guideLayer = guideLayerRef.current;
        const transformer = transformerRef.current;
        if (!stage || !layerRef.current) return '';

        // Temporarily hide guides and transformer
        if (guideLayer) guideLayer.visible(false);
        if (transformer) transformer.visible(false);

        // Deselect node visually during snapshot
        const oldNodes = transformer ? transformer.nodes() : [];
        if (transformer) transformer.nodes([]);

        // Reset stage scale for exact snapshot
        const oldScale = stage.scale();
        const oldPos = stage.position();
        stage.scale({ x: 1, y: 1 });
        stage.position({ x: 0, y: 0 });
        stage.draw();

        const dataUrl = stage.toDataURL({
          pixelRatio: 2,
          mimeType: 'image/png',
        });

        // Restore
        stage.scale(oldScale);
        stage.position(oldPos);
        if (guideLayer) guideLayer.visible(true);
        if (transformer) {
          transformer.nodes(oldNodes);
          transformer.visible(true);
        }
        stage.draw();

        return dataUrl;
      };
    }
  }, [onExportPreviewRef]);

  // Initialize Stage & Layers
  useEffect(() => {
    if (!containerRef.current) return;

    // Stage
    const stage = new Konva.Stage({
      container: containerRef.current,
      width: STAGE_WIDTH,
      height: STAGE_HEIGHT,
    });
    stageRef.current = stage;

    // Background and Design Layers
    const mainLayer = new Konva.Layer();
    const guideLayer = new Konva.Layer();
    stage.add(mainLayer);
    stage.add(guideLayer);
    layerRef.current = mainLayer;
    guideLayerRef.current = guideLayer;

    // Transformer
    const tr = new Konva.Transformer({
      rotateAnchorOffset: 24,
      rotationSnaps: [0, 45, 90, 135, 180, 225, 270, 315],
      borderStroke: '#0058be',
      borderStrokeWidth: 1.5,
      borderDash: [4, 4],
      anchorStroke: '#0058be',
      anchorFill: '#ffffff',
      anchorSize: 9,
      anchorCornerRadius: 2,
      enabledAnchors: [
        'top-left',
        'top-right',
        'bottom-left',
        'bottom-right',
        'middle-left',
        'middle-right',
        'top-center',
        'bottom-center',
      ],
      boundBoxFunc: (oldBox, newBox) => {
        // Prevent element from shrinking to negative size
        if (Math.abs(newBox.width) < 15 || Math.abs(newBox.height) < 15) {
          return oldBox;
        }
        return newBox;
      },
    });
    mainLayer.add(tr);
    transformerRef.current = tr;

    // Deselect when clicking on empty stage
    stage.on('click tap', (e) => {
      if (e.target === stage || e.target.name() === 'background-mockup') {
        onSelectElement(null);
      }
    });

    return () => {
      stage.destroy();
      stageRef.current = null;
    };
  }, []);

  // Update Guides (Printable Area & Safe Zone)
  useEffect(() => {
    const guideLayer = guideLayerRef.current;
    if (!guideLayer) return;

    guideLayer.destroyChildren();

    if (showGuides) {
      // Printable Area Outer Dashed Box
      const printBox = new Konva.Rect({
        x: printArea.left,
        y: printArea.top,
        width: printArea.width,
        height: printArea.height,
        stroke: '#0058be',
        strokeWidth: 1.5,
        dash: [6, 4],
        opacity: 0.8,
        listening: false,
      });
      guideLayer.add(printBox);

      // Safe Zone Inner Box
      const safeBox = new Konva.Rect({
        x: printArea.left + printArea.safeMargin,
        y: printArea.top + printArea.safeMargin,
        width: printArea.width - printArea.safeMargin * 2,
        height: printArea.height - printArea.safeMargin * 2,
        stroke: '#16a34a',
        strokeWidth: 1,
        dash: [3, 3],
        opacity: 0.5,
        listening: false,
      });
      guideLayer.add(safeBox);

      // Printable Area Label Tag
      const labelTag = new Konva.Text({
        x: printArea.left + 6,
        y: printArea.top - 16,
        text: `Printable Area (${printArea.width} × ${printArea.height})`,
        fontSize: 10,
        fontFamily: 'Inter',
        fontStyle: 'bold',
        fill: '#0058be',
        listening: false,
      });
      guideLayer.add(labelTag);
    }

    guideLayer.batchDraw();
  }, [printArea, showGuides]);

  // Render Elements on Konva Layer
  useEffect(() => {
    const layer = layerRef.current;
    const tr = transformerRef.current;
    if (!layer || !tr) return;

    // Remove old element nodes (keep transformer)
    const children = layer.getChildren().slice();
    for (const child of children) {
      if (child !== tr) {
        child.destroy();
      }
    }

    let selectedNode: Konva.Shape | null = null;

    // Create a group for the printable area to position elements nicely
    const printGroup = new Konva.Group({
      x: printArea.left,
      y: printArea.top,
      name: 'print-group',
    });
    layer.add(printGroup);

    elements.forEach((el) => {
      if (el.visible === false) return;

      let node: Konva.Shape | null = null;

      if (el.type === 'text') {
        const textNode = new Konva.Text({
          id: el.id,
          name: 'design-element',
          x: el.x,
          y: el.y,
          width: el.width,
          text: el.text || 'Add Text',
          fontSize: el.fontSize || 24,
          fontFamily: el.fontFamily || 'Montserrat',
          fill: el.fill || '#111111',
          fontStyle: el.fontStyle || 'normal',
          align: el.align || 'center',
          letterSpacing: el.letterSpacing || 0,
          rotation: el.rotation || 0,
          scaleX: el.scaleX || 1,
          scaleY: el.scaleY || 1,
          opacity: el.opacity ?? 1,
          draggable: !el.locked,
        });

        node = textNode;
      } else if (el.type === 'image' && el.src) {
        // Image node
        let cachedImg = imageCacheRef.current.get(el.src);
        if (!cachedImg) {
          cachedImg = new window.Image();
          cachedImg.crossOrigin = 'anonymous';
          cachedImg.src = el.src;
          cachedImg.onload = () => {
            layer.batchDraw();
          };
          imageCacheRef.current.set(el.src, cachedImg);
        }

        const imgNode = new Konva.Image({
          id: el.id,
          name: 'design-element',
          x: el.x,
          y: el.y,
          width: el.width,
          height: el.height,
          image: cachedImg,
          rotation: el.rotation || 0,
          scaleX: el.scaleX || 1,
          scaleY: el.scaleY || 1,
          opacity: el.opacity ?? 1,
          draggable: !el.locked,
        });

        node = imgNode;
      }

      if (node) {
        // Click to select
        node.on('click tap', (e) => {
          e.cancelBubble = true;
          onSelectElement(el.id);
        });

        // Snap to center calculation during drag
        node.on('dragmove', () => {
          const centerX = printArea.width / 2;
          const centerY = printArea.height / 2;
          const nodeCenterActualX = node!.x() + (node!.width() * (node!.scaleX() || 1)) / 2;
          const nodeCenterActualY = node!.y() + (node!.height() * (node!.scaleY() || 1)) / 2;

          const snapThreshold = 6;
          const nearCenterX = Math.abs(nodeCenterActualX - centerX) < snapThreshold;
          const nearCenterY = Math.abs(nodeCenterActualY - centerY) < snapThreshold;

          setSnapX(nearCenterX);
          setSnapY(nearCenterY);

          if (nearCenterX) {
            node!.x(centerX - (node!.width() * (node!.scaleX() || 1)) / 2);
          }
          if (nearCenterY) {
            node!.y(centerY - (node!.height() * (node!.scaleY() || 1)) / 2);
          }
        });

        // Drag end: commit updates
        node.on('dragend', () => {
          setSnapX(false);
          setSnapY(false);
          onUpdateElement(el.id, {
            x: Math.round(node!.x()),
            y: Math.round(node!.y()),
          });
          if (onCommitHistory) onCommitHistory();
        });

        // Transform end: commit updates
        node.on('transformend', () => {
          const scaleX = node!.scaleX();
          const scaleY = node!.scaleY();
          const rotation = Math.round(node!.rotation());

          onUpdateElement(el.id, {
            x: Math.round(node!.x()),
            y: Math.round(node!.y()),
            rotation,
            scaleX,
            scaleY,
          });
          if (onCommitHistory) onCommitHistory();
        });

        printGroup.add(node);

        if (el.id === selectedElementId) {
          selectedNode = node;
        }
      }
    });

    // Attach transformer to selected node
    if (selectedNode) {
      tr.nodes([selectedNode]);
      tr.moveToTop();
    } else {
      tr.nodes([]);
    }

    layer.batchDraw();
  }, [elements, selectedElementId, printArea]);

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
        className="relative transition-transform duration-100 ease-out origin-center flex items-center justify-center pointer-events-auto"
        style={{
          width: `${STAGE_WIDTH}px`,
          height: `${STAGE_HEIGHT}px`,
          transform: `translate(${panPosition.x}px, ${panPosition.y}px) scale(${zoom})`,
          cursor: isPanning ? 'grabbing' : zoom > 1 ? 'grab' : 'default',
        }}
      >
        {/* Garment / Product Image */}
        <div className="absolute inset-0 flex items-center justify-center p-4">
          <img
            src={product?.image || 'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80'}
            alt={product?.name || 'Product Mockup'}
            className="w-full h-full object-contain pointer-events-none drop-shadow-md select-none transition-all duration-300"
            style={{
              filter:
                selectedColor.hex.toLowerCase() === '#ffffff'
                  ? 'none'
                  : `drop-shadow(0 4px 12px rgba(0,0,0,0.1))`,
            }}
          />

          {/* Color Tint Blend Overlay */}
          {selectedColor.hex.toLowerCase() !== '#ffffff' && (
            <div
              className="absolute inset-0 pointer-events-none mix-blend-multiply opacity-35 rounded-2xl"
              style={{ backgroundColor: selectedColor.hex }}
            />
          )}

          {/* Back side indicator watermark */}
          {activeSide === 'back' && (
            <span className="absolute top-6 right-6 px-2 py-0.5 rounded text-[10px] font-bold bg-black/40 text-white tracking-widest uppercase">
              Back View
            </span>
          )}
        </div>

        {/* Konva Canvas Container */}
        <div
          ref={containerRef}
          className="absolute inset-0 z-10"
          style={{ width: `${STAGE_WIDTH}px`, height: `${STAGE_HEIGHT}px` }}
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
        <span>Click to select • Drag handles to rotate & resize</span>
      </div>
    </div>
  );
};
