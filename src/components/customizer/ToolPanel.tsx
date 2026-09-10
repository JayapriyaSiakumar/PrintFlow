import React, { useState, useRef } from 'react';
import {
  Type,
  Image as ImageIcon,
  Layers,
  Sparkles,
  Plus,
  Trash2,
  Copy,
  AlignCenter,
  AlignLeft,
  AlignRight,
  Bold,
  Italic,
  RotateCw,
  Eye,
  EyeOff,
  Lock,
  Unlock,
  UploadCloud,
  ChevronUp,
  ChevronDown,
  Info,
  Check,
} from 'lucide-react';
import { DesignElement, DesignSide, Product, ProductColor, Size } from '../../types';
import {
  FONT_OPTIONS,
  PRESET_COLORS,
  SAMPLE_CLIPART,
  ClipartItem,
  PrintableAreaConfig,
} from './types';

interface ToolPanelProps {
  product: Product | null;
  activeSide: DesignSide;
  printArea: PrintableAreaConfig;
  elements: DesignElement[];
  selectedElementId: string | null;
  onSelectElement: (id: string | null) => void;
  onAddElement: (element: DesignElement) => void;
  onUpdateElement: (id: string, updates: Partial<DesignElement>) => void;
  onDeleteElement: (id: string) => void;
  onDuplicateElement: (id: string) => void;
  onReorderElements: (newElements: DesignElement[]) => void;
  selectedColor: ProductColor;
  onSelectColor: (color: ProductColor) => void;
  selectedSize: Size;
  onSelectSize: (size: Size) => void;
}

export const ToolPanel: React.FC<ToolPanelProps> = ({
  product,
  activeSide,
  printArea,
  elements,
  selectedElementId,
  onSelectElement,
  onAddElement,
  onUpdateElement,
  onDeleteElement,
  onDuplicateElement,
  onReorderElements,
  selectedColor,
  onSelectColor,
  selectedSize,
  onSelectSize,
}) => {
  const [activeTab, setActiveTab] = useState<'text' | 'upload' | 'layers' | 'blank'>('text');
  const [newTextVal, setNewTextVal] = useState<string>('');
  const [clipartCategory, setClipartCategory] = useState<string>('all');
  const [isDraggingFile, setIsDraggingFile] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const selectedElement = elements.find((el) => el.id === selectedElementId);

  // Add new text element
  const handleAddText = (defaultText: string = 'Your Text Here', fontSize: number = 28, fontStyle: any = 'bold') => {
    const id = `el-txt-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const newEl: DesignElement = {
      id,
      type: 'text',
      text: defaultText,
      fontSize,
      fontFamily: 'Montserrat',
      fill: selectedColor.hex.toLowerCase() === '#ffffff' ? '#111111' : '#ffffff',
      fontStyle,
      align: 'center',
      x: Math.round(printArea.width / 2 - 100),
      y: Math.round(printArea.height / 2 - 25),
      width: 200,
      height: fontSize + 10,
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: elements.length + 1,
      visible: true,
      locked: false,
    };

    onAddElement(newEl);
    onSelectElement(id);
    setActiveTab('text');
  };

  // Center element in printable area
  const handleCenterElement = (id: string) => {
    const el = elements.find((item) => item.id === id);
    if (!el) return;
    const elWidth = el.width * (el.scaleX || 1);
    const elHeight = el.height * (el.scaleY || 1);
    onUpdateElement(id, {
      x: Math.round(Math.max(0, (printArea.width - elWidth) / 2)),
      y: Math.round(Math.max(0, (printArea.height - elHeight) / 2)),
    });
  };

  const [isUploadingImage, setIsUploadingImage] = useState<boolean>(false);

  // Upload image handler with Cloudinary integration
  const processUploadedImageFile = (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('Please upload a valid image file (PNG, JPG, SVG, WebP)');
      return;
    }

    setIsUploadingImage(true);
    const reader = new FileReader();
    reader.onload = (e) => {
      const initialSrc = e.target?.result as string;
      const img = new Image();
      img.onload = async () => {
        const id = `el-img-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
        // Fit within printable bounds while maintaining aspect ratio
        const maxInitialDim = 180;
        let w = img.naturalWidth || 200;
        let h = img.naturalHeight || 200;
        const aspect = w / h;

        if (w > h) {
          w = maxInitialDim;
          h = Math.round(maxInitialDim / aspect);
        } else {
          h = maxInitialDim;
          w = Math.round(maxInitialDim * aspect);
        }

        const newEl: DesignElement = {
          id,
          type: 'image',
          src: initialSrc,
          naturalWidth: img.naturalWidth,
          naturalHeight: img.naturalHeight,
          aspectRatio: aspect,
          width: w,
          height: h,
          x: Math.round(Math.max(0, (printArea.width - w) / 2)),
          y: Math.round(Math.max(0, (printArea.height - h) / 2)),
          rotation: 0,
          scaleX: 1,
          scaleY: 1,
          zIndex: elements.length + 1,
          visible: true,
          locked: false,
          dpiQuality: img.naturalWidth >= 1200 ? 'high' : img.naturalWidth >= 600 ? 'medium' : 'low',
        };

        onAddElement(newEl);
        onSelectElement(id);
        setActiveTab('upload');

        // Asynchronously upload to Cloudinary storage
        try {
          const formData = new FormData();
          formData.append('file', file);
          const token = localStorage.getItem('token');
          const res = await fetch('/api/upload/customer-file', {
            method: 'POST',
            headers: token ? { Authorization: `Bearer ${token}` } : undefined,
            body: formData,
          });

          if (res.ok) {
            const data = await res.json();
            if (data.success && data.url) {
              onUpdateElement(id, {
                src: data.url,
                publicId: data.publicId,
              });
            }
          }
        } catch (uploadErr) {
          console.warn('Background Cloudinary artwork upload error, retained local buffer:', uploadErr);
        } finally {
          setIsUploadingImage(false);
        }
      };
      img.src = initialSrc;
    };
    reader.readAsDataURL(file);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processUploadedImageFile(e.target.files[0]);
    }
  };

  const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDraggingFile(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processUploadedImageFile(e.dataTransfer.files[0]);
    }
  };

  // Add Clipart
  const handleAddClipart = (clip: ClipartItem) => {
    const id = `el-clip-${Date.now()}-${Math.random().toString(36).substr(2, 4)}`;
    const size = 160;
    const newEl: DesignElement = {
      id,
      type: 'image',
      src: clip.svgUrl,
      naturalWidth: 800,
      naturalHeight: 800,
      aspectRatio: 1,
      width: size,
      height: size,
      x: Math.round(Math.max(0, (printArea.width - size) / 2)),
      y: Math.round(Math.max(0, (printArea.height - size) / 2)),
      rotation: 0,
      scaleX: 1,
      scaleY: 1,
      zIndex: elements.length + 1,
      visible: true,
      locked: false,
      dpiQuality: 'high',
    };

    onAddElement(newEl);
    onSelectElement(id);
  };

  // Layer reordering
  const moveLayer = (index: number, direction: 'up' | 'down') => {
    const targetIndex = direction === 'up' ? index + 1 : index - 1;
    if (targetIndex < 0 || targetIndex >= elements.length) return;

    const updated = [...elements];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    onReorderElements(updated);
  };

  const filteredClipart =
    clipartCategory === 'all'
      ? SAMPLE_CLIPART
      : SAMPLE_CLIPART.filter((c) => c.category === clipartCategory);

  return (
    <div
      id="customizer-tool-panel"
      className="w-full h-full bg-white rounded-2xl border border-[#e2e8f0] flex flex-col shadow-xs overflow-hidden"
    >
      {/* Tool Navigation Bar */}
      <div className="flex border-b border-[#eeeeee] bg-[#fcfcfd] p-1.5 gap-1">
        <button
          id="tab-btn-text"
          type="button"
          onClick={() => setActiveTab('text')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'text'
              ? 'bg-white text-[#0058be] shadow-xs border border-[#dce2ee]'
              : 'text-[#555f6f] hover:text-[#1a1c1c] hover:bg-[#f3f4f6]'
          }`}
        >
          <Type className="w-3.5 h-3.5" />
          <span>Text</span>
        </button>

        <button
          id="tab-btn-upload"
          type="button"
          onClick={() => setActiveTab('upload')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'upload'
              ? 'bg-white text-[#0058be] shadow-xs border border-[#dce2ee]'
              : 'text-[#555f6f] hover:text-[#1a1c1c] hover:bg-[#f3f4f6]'
          }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>Graphics</span>
        </button>

        <button
          id="tab-btn-layers"
          type="button"
          onClick={() => setActiveTab('layers')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer relative ${
            activeTab === 'layers'
              ? 'bg-white text-[#0058be] shadow-xs border border-[#dce2ee]'
              : 'text-[#555f6f] hover:text-[#1a1c1c] hover:bg-[#f3f4f6]'
          }`}
        >
          <Layers className="w-3.5 h-3.5" />
          <span>Layers</span>
          {elements.length > 0 && (
            <span className="w-4 h-4 rounded-full bg-[#0058be] text-white text-[10px] font-bold flex items-center justify-center">
              {elements.length}
            </span>
          )}
        </button>

        <button
          id="tab-btn-blank"
          type="button"
          onClick={() => setActiveTab('blank')}
          className={`flex-1 py-2 px-2 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
            activeTab === 'blank'
              ? 'bg-white text-[#0058be] shadow-xs border border-[#dce2ee]'
              : 'text-[#555f6f] hover:text-[#1a1c1c] hover:bg-[#f3f4f6]'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Product</span>
        </button>
      </div>

      {/* Tool Content Scroll Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-5 text-[#1a1c1c]">
        {/* ================= TAB 1: TEXT TOOL ================= */}
        {activeTab === 'text' && (
          <div className="space-y-4">
            {/* Quick Add Presets */}
            <div>
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-2">
                Add New Typography
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleAddText('HEADING', 32, 'bold')}
                  className="py-2.5 px-2 rounded-xl border border-[#e2e8f0] hover:border-[#0058be] bg-white hover:bg-blue-50/40 text-center transition-all cursor-pointer"
                >
                  <span className="font-['Montserrat'] font-bold text-sm text-[#1a1c1c] block truncate">Heading</span>
                  <span className="text-[10px] text-[#727785]">32pt Bold</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddText('Subheading Title', 22, 'normal')}
                  className="py-2.5 px-2 rounded-xl border border-[#e2e8f0] hover:border-[#0058be] bg-white hover:bg-blue-50/40 text-center transition-all cursor-pointer"
                >
                  <span className="font-['Inter'] font-semibold text-xs text-[#1a1c1c] block truncate">Subheading</span>
                  <span className="text-[10px] text-[#727785]">22pt Semibold</span>
                </button>

                <button
                  type="button"
                  onClick={() => handleAddText('Vintage Script Callout', 26, 'italic')}
                  className="py-2.5 px-2 rounded-xl border border-[#e2e8f0] hover:border-[#0058be] bg-white hover:bg-blue-50/40 text-center transition-all cursor-pointer"
                >
                  <span className="font-serif italic text-xs text-[#1a1c1c] block truncate">Script</span>
                  <span className="text-[10px] text-[#727785]">26pt Italic</span>
                </button>
              </div>
            </div>

            {/* Selected Text Inspector */}
            {selectedElement && selectedElement.type === 'text' ? (
              <div className="space-y-4 pt-3 border-t border-[#eeeeee]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0058be] uppercase tracking-wider flex items-center gap-1.5">
                    <Type className="w-3.5 h-3.5" />
                    Selected Text Controls
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCenterElement(selectedElement.id)}
                    className="text-[11px] font-semibold text-[#555f6f] hover:text-[#0058be] flex items-center gap-1"
                  >
                    <AlignCenter className="w-3 h-3" />
                    <span>Center</span>
                  </button>
                </div>

                {/* Edit Text Content */}
                <div>
                  <label className="text-[11px] font-semibold text-[#555f6f] block mb-1">Text Content</label>
                  <input
                    type="text"
                    value={selectedElement.text || ''}
                    onChange={(e) => onUpdateElement(selectedElement.id, { text: e.target.value })}
                    placeholder="Enter your custom message..."
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#e2e8f0] focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none"
                  />
                </div>

                {/* Font Family */}
                <div>
                  <label className="text-[11px] font-semibold text-[#555f6f] block mb-1">Font Family</label>
                  <select
                    value={selectedElement.fontFamily || 'Montserrat'}
                    onChange={(e) => onUpdateElement(selectedElement.id, { fontFamily: e.target.value })}
                    className="w-full px-3 py-2 text-xs rounded-xl border border-[#e2e8f0] focus:border-[#0058be] outline-none bg-white cursor-pointer"
                  >
                    {FONT_OPTIONS.map((f) => (
                      <option key={f.value} value={f.value}>
                        {f.name}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Font Size & Letter Spacing */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <div className="flex justify-between text-[11px] text-[#555f6f] mb-1">
                      <span>Size</span>
                      <span className="font-mono font-bold">{selectedElement.fontSize || 24}px</span>
                    </div>
                    <input
                      type="range"
                      min="12"
                      max="72"
                      value={selectedElement.fontSize || 24}
                      onChange={(e) => onUpdateElement(selectedElement.id, { fontSize: Number(e.target.value) })}
                      className="w-full accent-[#0058be] cursor-pointer"
                    />
                  </div>

                  <div>
                    <div className="flex justify-between text-[11px] text-[#555f6f] mb-1">
                      <span>Spacing</span>
                      <span className="font-mono font-bold">{selectedElement.letterSpacing || 0}px</span>
                    </div>
                    <input
                      type="range"
                      min="-2"
                      max="10"
                      value={selectedElement.letterSpacing || 0}
                      onChange={(e) =>
                        onUpdateElement(selectedElement.id, { letterSpacing: Number(e.target.value) })
                      }
                      className="w-full accent-[#0058be] cursor-pointer"
                    />
                  </div>
                </div>

                {/* Alignment & Styles */}
                <div>
                  <label className="text-[11px] font-semibold text-[#555f6f] block mb-1.5">Style & Alignment</label>
                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => {
                        const isBold = selectedElement.fontStyle?.includes('bold');
                        const isItalic = selectedElement.fontStyle?.includes('italic');
                        let next = isBold ? (isItalic ? 'italic' : 'normal') : (isItalic ? 'bold italic' : 'bold');
                        onUpdateElement(selectedElement.id, { fontStyle: next as any });
                      }}
                      className={`p-2 rounded-lg border text-xs font-bold transition-colors ${
                        selectedElement.fontStyle?.includes('bold')
                          ? 'bg-[#0058be] text-white border-[#0058be]'
                          : 'border-[#e2e8f0] text-[#1a1c1c] hover:bg-gray-50'
                      }`}
                      title="Toggle Bold"
                    >
                      <Bold className="w-3.5 h-3.5" />
                    </button>

                    <button
                      type="button"
                      onClick={() => {
                        const isBold = selectedElement.fontStyle?.includes('bold');
                        const isItalic = selectedElement.fontStyle?.includes('italic');
                        let next = isItalic ? (isBold ? 'bold' : 'normal') : (isBold ? 'bold italic' : 'italic');
                        onUpdateElement(selectedElement.id, { fontStyle: next as any });
                      }}
                      className={`p-2 rounded-lg border text-xs font-bold transition-colors ${
                        selectedElement.fontStyle?.includes('italic')
                          ? 'bg-[#0058be] text-white border-[#0058be]'
                          : 'border-[#e2e8f0] text-[#1a1c1c] hover:bg-gray-50'
                      }`}
                      title="Toggle Italic"
                    >
                      <Italic className="w-3.5 h-3.5" />
                    </button>

                    <div className="w-[1px] h-5 bg-[#e2e2e2] mx-1" />

                    {(['left', 'center', 'right'] as const).map((align) => (
                      <button
                        key={align}
                        type="button"
                        onClick={() => onUpdateElement(selectedElement.id, { align })}
                        className={`p-2 rounded-lg border text-xs transition-colors ${
                          selectedElement.align === align
                            ? 'bg-[#0058be] text-white border-[#0058be]'
                            : 'border-[#e2e8f0] text-[#1a1c1c] hover:bg-gray-50'
                        }`}
                        title={`Align ${align}`}
                      >
                        {align === 'left' && <AlignLeft className="w-3.5 h-3.5" />}
                        {align === 'center' && <AlignCenter className="w-3.5 h-3.5" />}
                        {align === 'right' && <AlignRight className="w-3.5 h-3.5" />}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Text Color Swatches */}
                <div>
                  <div className="flex justify-between items-center mb-1.5">
                    <label className="text-[11px] font-semibold text-[#555f6f]">Print Ink Color</label>
                    <span className="text-[10px] font-mono text-[#727785]">{selectedElement.fill || '#111111'}</span>
                  </div>
                  <div className="grid grid-cols-6 gap-2">
                    {PRESET_COLORS.map((c) => (
                      <button
                        key={c.hex}
                        type="button"
                        onClick={() => onUpdateElement(selectedElement.id, { fill: c.hex })}
                        className="w-8 h-8 rounded-full flex items-center justify-center border transition-transform hover:scale-110 cursor-pointer relative"
                        style={{
                          backgroundColor: c.hex,
                          borderColor: c.border ? '#c2c6d6' : 'rgba(0,0,0,0.1)',
                        }}
                        title={c.name}
                      >
                        {selectedElement.fill?.toLowerCase() === c.hex.toLowerCase() && (
                          <Check
                            className={`w-3.5 h-3.5 ${
                              c.hex === '#ffffff' || c.hex === '#fef08a' ? 'text-black' : 'text-white'
                            }`}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Element Quick Action Toolbar */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#eeeeee]">
                  <button
                    type="button"
                    onClick={() => onDuplicateElement(selectedElement.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#1a1c1c] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteElement(selectedElement.id)}
                    className="py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-semibold text-[#ba1a1a] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-4 rounded-xl bg-blue-50/60 border border-blue-100 text-xs text-[#0058be]">
                <p className="font-semibold">💡 Click on any text on the product canvas to adjust typography, colors, and layout.</p>
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 2: GRAPHICS & UPLOAD ================= */}
        {activeTab === 'upload' && (
          <div className="space-y-5">
            {/* Drag & Drop Upload Box */}
            <div>
              <input
                ref={fileInputRef}
                type="file"
                accept="image/png,image/jpeg,image/webp,image/svg+xml"
                onChange={handleFileInputChange}
                className="hidden"
              />

              <div
                id="upload-dropzone"
                onDragOver={(e) => {
                  e.preventDefault();
                  setIsDraggingFile(true);
                }}
                onDragLeave={() => setIsDraggingFile(false)}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`p-6 border-2 border-dashed rounded-2xl text-center cursor-pointer transition-all ${
                  isDraggingFile
                    ? 'border-[#0058be] bg-blue-50/80 scale-[1.01]'
                    : 'border-[#cbd5e1] hover:border-[#0058be] bg-[#f8fafc] hover:bg-white'
                }`}
              >
                <UploadCloud className="w-8 h-8 text-[#0058be] mx-auto mb-2" />
                <p className="font-bold text-xs text-[#1a1c1c]">Click or Drag & Drop Artwork</p>
                <p className="text-[11px] text-[#727785] mt-1">PNG, JPG, SVG, WebP (up to 25MB)</p>
                <span className="inline-block mt-3 px-3 py-1 bg-[#0058be] text-white rounded-lg text-[11px] font-semibold shadow-xs">
                  Browse Files
                </span>
              </div>
            </div>

            {/* Selected Image Controls */}
            {selectedElement && selectedElement.type === 'image' && (
              <div className="space-y-4 pt-3 border-t border-[#eeeeee]">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#0058be] uppercase tracking-wider flex items-center gap-1.5">
                    <ImageIcon className="w-3.5 h-3.5" />
                    Selected Artwork Adjustments
                  </span>
                  <button
                    type="button"
                    onClick={() => handleCenterElement(selectedElement.id)}
                    className="text-[11px] font-semibold text-[#555f6f] hover:text-[#0058be] flex items-center gap-1"
                  >
                    <AlignCenter className="w-3 h-3" />
                    <span>Center</span>
                  </button>
                </div>

                {/* Opacity Slider */}
                <div>
                  <div className="flex justify-between text-[11px] text-[#555f6f] mb-1">
                    <span>Artwork Opacity</span>
                    <span className="font-mono font-bold">{Math.round((selectedElement.opacity ?? 1) * 100)}%</span>
                  </div>
                  <input
                    type="range"
                    min="10"
                    max="100"
                    value={Math.round((selectedElement.opacity ?? 1) * 100)}
                    onChange={(e) =>
                      onUpdateElement(selectedElement.id, { opacity: Number(e.target.value) / 100 })
                    }
                    className="w-full accent-[#0058be] cursor-pointer"
                  />
                </div>

                {/* Rotation & Flip Controls */}
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      const current = selectedElement.rotation || 0;
                      onUpdateElement(selectedElement.id, { rotation: (current + 90) % 360 });
                    }}
                    className="flex-1 py-2 px-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#1a1c1c] hover:bg-gray-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <RotateCw className="w-3.5 h-3.5 text-[#0058be]" />
                    <span>Rotate 90°</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const scaleX = selectedElement.scaleX || 1;
                      onUpdateElement(selectedElement.id, { scaleX: scaleX * -1 });
                    }}
                    className="flex-1 py-2 px-2.5 rounded-lg border border-[#e2e8f0] text-xs font-semibold text-[#1a1c1c] hover:bg-gray-50 flex items-center justify-center gap-1.5 cursor-pointer"
                  >
                    <span>Flip Horiz.</span>
                  </button>
                </div>

                {/* Duplicate / Delete Toolbar */}
                <div className="flex items-center gap-2 pt-2 border-t border-[#eeeeee]">
                  <button
                    type="button"
                    onClick={() => onDuplicateElement(selectedElement.id)}
                    className="flex-1 py-1.5 px-3 rounded-lg bg-gray-100 hover:bg-gray-200 text-xs font-semibold text-[#1a1c1c] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Copy className="w-3.5 h-3.5" />
                    <span>Duplicate</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => onDeleteElement(selectedElement.id)}
                    className="py-1.5 px-3 rounded-lg bg-red-50 hover:bg-red-100 text-xs font-semibold text-[#ba1a1a] flex items-center justify-center gap-1.5 transition-colors"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete</span>
                  </button>
                </div>
              </div>
            )}

            {/* Curated Sample Clipart Collection */}
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider">
                  Royalty-Free Clipart
                </label>
                <div className="flex gap-1 text-[11px]">
                  {['all', 'waves', 'nature', 'abstract'].map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setClipartCategory(cat)}
                      className={`px-2 py-0.5 rounded capitalize ${
                        clipartCategory === cat
                          ? 'bg-[#0058be] text-white font-semibold'
                          : 'text-[#727785] hover:bg-gray-100'
                      }`}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2.5">
                {filteredClipart.map((clip) => (
                  <button
                    key={clip.id}
                    type="button"
                    onClick={() => handleAddClipart(clip)}
                    className="p-2 rounded-xl border border-[#e2e8f0] hover:border-[#0058be] hover:shadow-xs bg-[#f8fafc] hover:bg-white text-center transition-all group cursor-pointer"
                  >
                    <div className="w-full h-16 rounded-lg bg-white overflow-hidden flex items-center justify-center mb-1.5">
                      <img
                        src={clip.svgUrl}
                        alt={clip.name}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                    <span className="text-[10px] font-semibold text-[#1a1c1c] block truncate">
                      {clip.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* ================= TAB 3: LAYERS ================= */}
        {activeTab === 'layers' && (
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-[#555f6f] uppercase tracking-wider">
                Active Layers on {activeSide === 'front' ? 'Front' : 'Back'} ({elements.length})
              </span>
            </div>

            {elements.length === 0 ? (
              <div className="p-8 text-center bg-[#f8fafc] rounded-2xl border border-[#e2e8f0] text-[#727785]">
                <Layers className="w-8 h-8 mx-auto mb-2 text-[#cbd5e1]" />
                <p className="text-xs font-semibold text-[#1a1c1c]">No layers on this side</p>
                <p className="text-[11px] mt-1">Add text or upload graphics to start building your design.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {elements
                  .slice()
                  .reverse()
                  .map((el, revIndex) => {
                    const originalIndex = elements.length - 1 - revIndex;
                    const isSelected = el.id === selectedElementId;

                    return (
                      <div
                        key={el.id}
                        onClick={() => onSelectElement(el.id)}
                        className={`p-2.5 rounded-xl border flex items-center justify-between gap-2 cursor-pointer transition-all ${
                          isSelected
                            ? 'border-[#0058be] bg-blue-50/50 shadow-xs ring-1 ring-[#0058be]'
                            : 'border-[#e2e8f0] bg-white hover:bg-[#fcfcfd]'
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="w-7 h-7 rounded-lg bg-gray-100 flex items-center justify-center flex-shrink-0">
                            {el.type === 'text' ? (
                              <Type className="w-3.5 h-3.5 text-[#0058be]" />
                            ) : (
                              <ImageIcon className="w-3.5 h-3.5 text-purple-600" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <h5 className="text-xs font-semibold text-[#1a1c1c] truncate">
                              {el.type === 'text' ? `"${el.text}"` : 'Artwork Image'}
                            </h5>
                            <span className="text-[10px] text-[#727785]">
                              {el.type === 'text' ? `${el.fontFamily} • ${el.fontSize}px` : 'Graphic Layer'}
                            </span>
                          </div>
                        </div>

                        {/* Layer quick toggles */}
                        <div className="flex items-center gap-1">
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateElement(el.id, { visible: el.visible === false ? true : false });
                            }}
                            className="p-1 text-[#727785] hover:text-[#1a1c1c] rounded"
                            title={el.visible === false ? 'Show Layer' : 'Hide Layer'}
                          >
                            {el.visible === false ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onUpdateElement(el.id, { locked: !el.locked });
                            }}
                            className="p-1 text-[#727785] hover:text-[#1a1c1c] rounded"
                            title={el.locked ? 'Unlock Layer' : 'Lock Layer'}
                          >
                            {el.locked ? <Lock className="w-3.5 h-3.5 text-amber-600" /> : <Unlock className="w-3.5 h-3.5" />}
                          </button>

                          <div className="flex flex-col">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(originalIndex, 'up');
                              }}
                              disabled={originalIndex === elements.length - 1}
                              className="p-0.5 text-[#727785] hover:text-[#1a1c1c] disabled:opacity-30"
                              title="Bring Forward"
                            >
                              <ChevronUp className="w-3 h-3" />
                            </button>
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                moveLayer(originalIndex, 'down');
                              }}
                              disabled={originalIndex === 0}
                              className="p-0.5 text-[#727785] hover:text-[#1a1c1c] disabled:opacity-30"
                              title="Send Backward"
                            >
                              <ChevronDown className="w-3 h-3" />
                            </button>
                          </div>

                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onDeleteElement(el.id);
                            }}
                            className="p-1 text-[#727785] hover:text-[#ba1a1a] rounded"
                            title="Delete Layer"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </div>
                    );
                  })}
              </div>
            )}
          </div>
        )}

        {/* ================= TAB 4: BLANK PRODUCT SPECS & COLOR ================= */}
        {activeTab === 'blank' && (
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-2">
                Fabrication Color Variant
              </label>
              <div className="flex flex-wrap gap-2.5">
                {product?.colors.map((col) => (
                  <button
                    key={col.name}
                    type="button"
                    onClick={() => onSelectColor(col)}
                    className={`w-9 h-9 rounded-full flex items-center justify-center border-2 transition-all cursor-pointer ${
                      selectedColor.hex === col.hex
                        ? 'border-[#0058be] ring-2 ring-[#0058be]/20 scale-105'
                        : 'border-black/15 hover:scale-105'
                    }`}
                    style={{ backgroundColor: col.hex }}
                    title={col.name}
                  >
                    {selectedColor.hex === col.hex && (
                      <Check
                        className={`w-4 h-4 ${
                          col.hex.toLowerCase() === '#ffffff' ? 'text-black' : 'text-white'
                        }`}
                      />
                    )}
                  </button>
                ))}
              </div>
              <span className="text-xs text-[#555f6f] mt-1.5 block">
                Selected: <strong className="text-[#1a1c1c]">{selectedColor.name}</strong>
              </span>
            </div>

            <div className="pt-3 border-t border-[#eeeeee]">
              <label className="text-xs font-bold text-[#555f6f] uppercase tracking-wider block mb-2">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-1.5">
                {product?.sizes.map((s) => (
                  <button
                    key={s}
                    type="button"
                    onClick={() => onSelectSize(s)}
                    className={`py-1.5 px-3 rounded-lg text-xs font-bold transition-all cursor-pointer ${
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

            <div className="p-3.5 rounded-xl bg-gray-50 border border-gray-200 text-xs space-y-2">
              <div className="flex items-center gap-1.5 text-[#0058be] font-bold">
                <Info className="w-3.5 h-3.5" />
                <span>Print-on-Demand Blank Details</span>
              </div>
              <p className="text-[#555f6f] leading-relaxed">
                {product?.description || 'Premium retail-grade garment pre-shrunk and optimized for Kornit DTG.'}
              </p>
              <div className="pt-2 border-t border-gray-200 flex justify-between text-[11px] text-[#727785]">
                <span>Print Method: Direct to Garment</span>
                <span>Inks: Oeko-Tex Water-Based</span>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
