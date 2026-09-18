import React, { useState, useEffect } from 'react';
import {
  GenericCustomizationConfig,
  ProductCustomizationView,
  PrintableAreaShape,
} from '../../types';
import {
  CUSTOMIZATION_PRESETS,
  resolvePrintableAreaPixels,
} from '../../utils/customizationEngine';
import { CloudinaryImageUploader } from './CloudinaryImageUploader';
import {
  Sparkles,
  Plus,
  Trash2,
  Code,
  Sliders,
  Check,
  AlertTriangle,
  Copy,
  ChevronDown,
  ChevronUp,
  Layers,
  Info,
  Maximize2,
  Minimize2,
  AlignCenterHorizontal,
  AlignCenterVertical,
  Crosshair,
  ShieldCheck,
  Eye,
  Box,
} from 'lucide-react';

interface CustomizationConfigEditorProps {
  value: GenericCustomizationConfig | undefined;
  onChange: (config: GenericCustomizationConfig) => void;
  defaultMockupUrl?: string;
  defaultBackMockupUrl?: string;
  productCategory?: string;
}

// Common angles supported across products
const ANGLE_PRESETS = [
  { id: 'front', label: 'Front View', icon: '👕', description: 'Primary face / chest / front facade' },
  { id: 'back', label: 'Back View', icon: '🔄', description: 'Rear surface / back graphic / back panel' },
  { id: 'left_side', label: 'Left Side / Sleeve', icon: '👈', description: 'Left profile, sleeve or side spine' },
  { id: 'right_side', label: 'Right Side / Sleeve', icon: '👉', description: 'Right profile, sleeve or side panel' },
  { id: 'top', label: 'Top View', icon: '🔝', description: 'Cap crown, rim, lid, or top surface' },
  { id: 'bottom', label: 'Bottom View', icon: '🔻', description: 'Gusset, base stamp, or bottom panel' },
  { id: 'wrap', label: 'Panoramic Wrap', icon: '🌐', description: '360° cylindrical continuous print' },
];

// Product-specific print area portions
interface PrintAreaPreset {
  id: string;
  name: string;
  category: string;
  shape: PrintableAreaShape;
  x: number;
  y: number;
  width: number;
  height: number;
  borderRadius?: number;
  safeMargin: number;
}

const PRINT_AREA_PORTION_PRESETS: PrintAreaPreset[] = [
  // Apparel
  {
    id: 'chest_standard',
    name: 'Standard Chest (Apparel)',
    category: 'Apparel',
    shape: 'rectangle',
    x: 28,
    y: 22,
    width: 44,
    height: 54,
    safeMargin: 12,
  },
  {
    id: 'full_back_oversized',
    name: 'Full Back / Oversized Graphic',
    category: 'Apparel',
    shape: 'rectangle',
    x: 24,
    y: 18,
    width: 52,
    height: 62,
    safeMargin: 12,
  },
  {
    id: 'pocket_badge',
    name: 'Left Chest / Pocket Emblem',
    category: 'Apparel',
    shape: 'rectangle',
    x: 58,
    y: 24,
    width: 20,
    height: 22,
    safeMargin: 8,
  },
  {
    id: 'sleeve_strip',
    name: 'Sleeve / Side Band',
    category: 'Apparel',
    shape: 'rectangle',
    x: 32,
    y: 26,
    width: 36,
    height: 44,
    safeMargin: 8,
  },
  // Drinkware / Mugs
  {
    id: 'mug_side',
    name: 'Mug Single Side (Curved)',
    category: 'Drinkware / Home Decor',
    shape: 'rounded',
    x: 24,
    y: 24,
    width: 42,
    height: 52,
    borderRadius: 12,
    safeMargin: 10,
  },
  {
    id: 'mug_wrap_360',
    name: 'Mug Panoramic Wrap (360°)',
    category: 'Drinkware / Home Decor',
    shape: 'rectangle',
    x: 12,
    y: 22,
    width: 76,
    height: 54,
    safeMargin: 12,
  },
  {
    id: 'mug_top_rim',
    name: 'Top Rim / Cup Opening',
    category: 'Drinkware / Home Decor',
    shape: 'circle',
    x: 26,
    y: 26,
    width: 48,
    height: 48,
    safeMargin: 8,
  },
  {
    id: 'base_stamp',
    name: 'Bottom Stamp / Base',
    category: 'Drinkware / Accessories',
    shape: 'circle',
    x: 28,
    y: 28,
    width: 44,
    height: 44,
    safeMargin: 8,
  },
  // Headwear / Hats
  {
    id: 'cap_crown_front',
    name: 'Cap Front Crown Panel',
    category: 'Headwear',
    shape: 'rounded',
    x: 30,
    y: 34,
    width: 40,
    height: 26,
    borderRadius: 14,
    safeMargin: 8,
  },
  {
    id: 'cap_profile_side',
    name: 'Cap Side Profile Panel',
    category: 'Headwear',
    shape: 'rounded',
    x: 32,
    y: 38,
    width: 36,
    height: 24,
    borderRadius: 10,
    safeMargin: 8,
  },
  {
    id: 'cap_top_crown',
    name: 'Cap Top Crown (Button View)',
    category: 'Headwear',
    shape: 'circle',
    x: 28,
    y: 28,
    width: 44,
    height: 44,
    safeMargin: 10,
  },
  // Bags / Totes
  {
    id: 'tote_center',
    name: 'Tote Bag Body Center',
    category: 'Bags & Accessories',
    shape: 'rectangle',
    x: 25,
    y: 32,
    width: 50,
    height: 50,
    safeMargin: 14,
  },
  {
    id: 'tote_bottom_gusset',
    name: 'Tote Bottom Gusset',
    category: 'Bags & Accessories',
    shape: 'rectangle',
    x: 20,
    y: 42,
    width: 60,
    height: 24,
    safeMargin: 8,
  },
  // Stationery / Phone Cases / Flat
  {
    id: 'notebook_cover',
    name: 'Notebook / Book Cover',
    category: 'Stationery',
    shape: 'rectangle',
    x: 22,
    y: 14,
    width: 56,
    height: 72,
    safeMargin: 14,
  },
  {
    id: 'notebook_spine',
    name: 'Book Spine (Narrow Side)',
    category: 'Stationery',
    shape: 'rectangle',
    x: 44,
    y: 14,
    width: 12,
    height: 72,
    safeMargin: 4,
  },
  {
    id: 'full_bleed_canvas',
    name: 'Full Bleed Edge-to-Edge',
    category: 'Canvas & Wall Art',
    shape: 'rectangle',
    x: 10,
    y: 10,
    width: 80,
    height: 80,
    safeMargin: 16,
  },
];

export const CustomizationConfigEditor: React.FC<CustomizationConfigEditorProps> = ({
  value,
  onChange,
  defaultMockupUrl = '',
  defaultBackMockupUrl = '',
  productCategory = '',
}) => {
  const [editorMode, setEditorMode] = useState<'visual' | 'json'>('visual');
  const [jsonText, setJsonText] = useState<string>('');
  const [jsonError, setJsonError] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');
  const [expandedViewIndex, setExpandedViewIndex] = useState<number>(0);
  const [quickAngle, setQuickAngle] = useState<string>('front');

  // Initialize config if undefined
  const currentConfig: GenericCustomizationConfig = value || {
    enabled: true,
    previewType: 'canvas_2d',
    colorTinting: { enabled: true, blendMode: 'multiply', opacity: 0.35 },
    views: [
      {
        id: 'front',
        name: 'Front View',
        mockupUrl: defaultMockupUrl,
        printableArea: {
          x: 28,
          y: 22,
          width: 44,
          height: 54,
          isPercentage: true,
          shape: 'rectangle',
          safeMargin: 12,
        },
        allowedElementTypes: ['text', 'image'],
      },
    ],
  };

  // Sync state to json string whenever external value changes
  useEffect(() => {
    try {
      setJsonText(JSON.stringify(currentConfig, null, 2));
      setJsonError(null);
    } catch {
      // ignore
    }
  }, [value]);

  const handleApplyPreset = (presetId: string) => {
    setSelectedPresetId(presetId);
    const found = CUSTOMIZATION_PRESETS.find((p) => p.id === presetId);
    if (!found) return;

    const cloned: GenericCustomizationConfig = JSON.parse(JSON.stringify(found.config));
    if (cloned.views.length > 0 && defaultMockupUrl && !cloned.views[0].mockupUrl) {
      cloned.views[0].mockupUrl = defaultMockupUrl;
    }
    if (cloned.views.length > 1 && defaultBackMockupUrl && !cloned.views[1].mockupUrl) {
      cloned.views[1].mockupUrl = defaultBackMockupUrl;
    }

    onChange(cloned);
    setJsonText(JSON.stringify(cloned, null, 2));
    setJsonError(null);
  };

  const handleJsonChange = (text: string) => {
    setJsonText(text);
    try {
      const parsed = JSON.parse(text);
      if (!parsed || typeof parsed !== 'object') {
        throw new Error('Config must be a valid JSON object');
      }
      if (!Array.isArray(parsed.views)) {
        throw new Error('Config must have a "views" array');
      }
      setJsonError(null);
      onChange(parsed as GenericCustomizationConfig);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleFormatJson = () => {
    try {
      const parsed = JSON.parse(jsonText);
      const formatted = JSON.stringify(parsed, null, 2);
      setJsonText(formatted);
      setJsonError(null);
      onChange(parsed);
    } catch (err: any) {
      setJsonError(err.message);
    }
  };

  const handleCopyJson = () => {
    navigator.clipboard.writeText(jsonText);
  };

  // Visual editing helpers
  const updateConfigField = <K extends keyof GenericCustomizationConfig>(
    field: K,
    val: GenericCustomizationConfig[K]
  ) => {
    const updated = { ...currentConfig, [field]: val };
    onChange(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const updateView = (index: number, updates: Partial<ProductCustomizationView>) => {
    const nextViews = [...currentConfig.views];
    nextViews[index] = { ...nextViews[index], ...updates };
    const updated = { ...currentConfig, views: nextViews };
    onChange(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const updateViewPrintableArea = (
    index: number,
    field: string,
    val: any
  ) => {
    const nextViews = [...currentConfig.views];
    const currView = nextViews[index];
    nextViews[index] = {
      ...currView,
      printableArea: {
        ...currView.printableArea,
        [field]: val,
      },
    };
    const updated = { ...currentConfig, views: nextViews };
    onChange(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  const applyPrintAreaPreset = (viewIndex: number, preset: PrintAreaPreset) => {
    const nextViews = [...currentConfig.views];
    const currView = nextViews[viewIndex];
    nextViews[viewIndex] = {
      ...currView,
      printableArea: {
        ...currView.printableArea,
        x: preset.x,
        y: preset.y,
        width: preset.width,
        height: preset.height,
        shape: preset.shape,
        borderRadius: preset.borderRadius ?? 0,
        safeMargin: preset.safeMargin,
        isPercentage: true,
      },
    };
    const updated = { ...currentConfig, views: nextViews };
    onChange(updated);
    setJsonText(JSON.stringify(updated, null, 2));
  };

  // Center alignment helpers
  const centerPrintAreaHorizontally = (viewIndex: number) => {
    const view = currentConfig.views[viewIndex];
    const w = view.printableArea.width || 40;
    const newX = Math.max(0, Math.round(((100 - w) / 2) * 10) / 10);
    updateViewPrintableArea(viewIndex, 'x', newX);
  };

  const centerPrintAreaVertically = (viewIndex: number) => {
    const view = currentConfig.views[viewIndex];
    const h = view.printableArea.height || 50;
    const newY = Math.max(0, Math.round(((100 - h) / 2) * 10) / 10);
    updateViewPrintableArea(viewIndex, 'y', newY);
  };

  const addViewByAngle = (angleId: string) => {
    const foundAngle = ANGLE_PRESETS.find((a) => a.id === angleId);
    const existingCount = currentConfig.views.filter((v) => v.id.startsWith(angleId)).length;
    const uniqueId = existingCount === 0 ? angleId : `${angleId}_${existingCount + 1}`;
    const name = foundAngle?.label || `Surface (${angleId})`;

    // Choose recommended printable area preset for this angle
    let recommendedArea: any = {
      x: 28,
      y: 22,
      width: 44,
      height: 54,
      shape: 'rectangle',
      safeMargin: 12,
      isPercentage: true,
    };

    if (angleId === 'back') {
      recommendedArea = { x: 26, y: 18, width: 48, height: 58, shape: 'rectangle', safeMargin: 12, isPercentage: true };
    } else if (angleId === 'left_side' || angleId === 'right_side') {
      recommendedArea = { x: 32, y: 28, width: 36, height: 40, shape: 'rectangle', safeMargin: 8, isPercentage: true };
    } else if (angleId === 'top' || angleId === 'bottom') {
      recommendedArea = { x: 26, y: 26, width: 48, height: 48, shape: 'circle', safeMargin: 8, isPercentage: true };
    } else if (angleId === 'wrap') {
      recommendedArea = { x: 12, y: 22, width: 76, height: 54, shape: 'rectangle', safeMargin: 12, isPercentage: true };
    }

    const newView: ProductCustomizationView = {
      id: uniqueId,
      name,
      mockupUrl: angleId === 'front' ? defaultMockupUrl : angleId === 'back' ? defaultBackMockupUrl : '',
      printableArea: recommendedArea,
      allowedElementTypes: ['text', 'image'],
    };

    const updated = {
      ...currentConfig,
      views: [...currentConfig.views, newView],
    };
    onChange(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setExpandedViewIndex(currentConfig.views.length);
  };

  const removeView = (index: number) => {
    if (currentConfig.views.length <= 1) {
      alert('A customizable product must have at least one printable surface angle.');
      return;
    }
    const nextViews = currentConfig.views.filter((_, i) => i !== index);
    const updated = { ...currentConfig, views: nextViews };
    onChange(updated);
    setJsonText(JSON.stringify(updated, null, 2));
    setExpandedViewIndex(Math.max(0, index - 1));
  };

  return (
    <div className="bg-[#fcfcfd] border border-[#e2e8f0] rounded-2xl p-4 sm:p-5 space-y-4 shadow-2xs">
      {/* Policy Reminder Banner: Product Only Mockups */}
      <div className="flex items-start gap-3 p-3.5 bg-amber-50/80 border border-amber-200/90 rounded-xl text-amber-900 text-xs">
        <ShieldCheck className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <div>
          <span className="font-bold block text-amber-950">
            Mandatory Requirement: Product-Only Imagery (No Faces or People)
          </span>
          <p className="text-amber-800 text-[11px] leading-relaxed mt-0.5">
            All mockup images must showcase <strong>only the product itself</strong> (flat lays, clean studio packshots, or isolated 3D renders). Do NOT include human models, faces, hands, or background clutter. Configure every angle (Front, Back, Side, Top, Bottom) as clean product blanks.
          </p>
        </div>
      </div>

      {/* Header with Title & Mode Switcher */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#eeeeee]">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1 rounded-lg bg-purple-100 text-purple-700">
              <Layers className="w-4 h-4" />
            </span>
            <h4 className="font-bold text-sm text-[#1a1c1c]">
              Personalization Surfaces & Print Area Geometry
            </h4>
          </div>
          <p className="text-xs text-[#555f6f] mt-0.5">
            Configure multi-angle views (Front, Back, Side, Top, Bottom) and calibrate the print area portion for this product.
          </p>
        </div>

        <div className="flex items-center gap-2">
          {/* Preset Selector */}
          <div className="relative">
            <select
              value={selectedPresetId}
              onChange={(e) => handleApplyPreset(e.target.value)}
              className="px-2.5 py-1.5 bg-white border border-[#dce2ee] rounded-xl text-xs font-semibold text-[#1a1c1c] hover:border-purple-400 focus:outline-none focus:ring-2 focus:ring-purple-600/30"
            >
              <option value="">⚡ Apply Template Preset...</option>
              {CUSTOMIZATION_PRESETS.map((preset) => (
                <option key={preset.id} value={preset.id}>
                  {preset.name} ({preset.category})
                </option>
              ))}
            </select>
          </div>

          {/* Mode Switcher */}
          <div className="flex bg-[#eeeeee] p-0.5 rounded-xl text-xs font-semibold">
            <button
              type="button"
              onClick={() => setEditorMode('visual')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                editorMode === 'visual'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-[#555f6f] hover:text-[#1a1c1c]'
              }`}
            >
              <Sliders className="w-3.5 h-3.5" />
              <span>Visual</span>
            </button>
            <button
              type="button"
              onClick={() => setEditorMode('json')}
              className={`px-3 py-1 rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer ${
                editorMode === 'json'
                  ? 'bg-white text-purple-700 shadow-xs'
                  : 'text-[#555f6f] hover:text-[#1a1c1c]'
              }`}
            >
              <Code className="w-3.5 h-3.5" />
              <span>JSON</span>
            </button>
          </div>
        </div>
      </div>

      {/* Global Config Toggles */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 p-3 bg-white rounded-xl border border-[#e2e8f0]">
        <label className="flex items-center gap-2.5 cursor-pointer text-xs font-semibold text-[#1a1c1c]">
          <input
            type="checkbox"
            checked={currentConfig.enabled}
            onChange={(e) => updateConfigField('enabled', e.target.checked)}
            className="w-4 h-4 text-purple-600 rounded focus:ring-purple-500 border-gray-300"
          />
          <span>Customization Enabled</span>
        </label>

        <div>
          <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
            Extra Surface Pricing ($)
          </label>
          <input
            type="number"
            step="0.5"
            min="0"
            value={currentConfig.extraViewPrice ?? 4.5}
            onChange={(e) => updateConfigField('extraViewPrice', parseFloat(e.target.value) || 0)}
            placeholder="4.50"
            className="w-full px-2.5 py-1 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg"
          />
        </div>

        <div>
          <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
            Color Tinting Blend Mode
          </label>
          <select
            value={currentConfig.colorTinting?.blendMode || 'multiply'}
            onChange={(e) =>
              updateConfigField('colorTinting', {
                enabled: currentConfig.colorTinting?.enabled ?? true,
                blendMode: e.target.value as any,
                opacity: currentConfig.colorTinting?.opacity ?? 0.36,
              })
            }
            className="w-full px-2.5 py-1 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg"
          >
            <option value="multiply">Multiply (Apparel / Fabrics)</option>
            <option value="overlay">Overlay (Hard Goods / Coated)</option>
            <option value="source-atop">Source Atop</option>
          </select>
        </div>
      </div>

      {/* ================= MODE: VISUAL ================= */}
      {editorMode === 'visual' && (
        <div className="space-y-4">
          {/* Quick Add Angle Bar */}
          <div className="p-3 bg-purple-50/70 border border-purple-100 rounded-xl space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold text-purple-900 flex items-center gap-1.5">
                <Box className="w-3.5 h-3.5 text-purple-700" />
                Add Angle / View for this Product:
              </span>
              <span className="text-[11px] text-purple-600 font-medium">
                {currentConfig.views.length} active surface{currentConfig.views.length !== 1 ? 's' : ''}
              </span>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ANGLE_PRESETS.map((angle) => {
                const isExisting = currentConfig.views.some((v) => v.id.startsWith(angle.id));
                return (
                  <button
                    key={angle.id}
                    type="button"
                    onClick={() => addViewByAngle(angle.id)}
                    className={`px-2.5 py-1.5 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-all cursor-pointer ${
                      isExisting
                        ? 'bg-purple-200/80 text-purple-900 border border-purple-300 shadow-2xs'
                        : 'bg-white text-[#1a1c1c] border border-purple-200 hover:bg-purple-100/60'
                    }`}
                    title={angle.description}
                  >
                    <span>{angle.icon}</span>
                    <span>{angle.label}</span>
                    <Plus className="w-3 h-3 text-purple-700 ml-0.5" />
                  </button>
                );
              })}
            </div>
          </div>

          {/* Views List */}
          <div className="space-y-3">
            {currentConfig.views.map((view, idx) => {
              const isExpanded = expandedViewIndex === idx;
              const area = view.printableArea;

              return (
                <div
                  key={view.id || idx}
                  className="bg-white rounded-xl border border-[#e2e8f0] overflow-hidden shadow-2xs"
                >
                  {/* View Header */}
                  <div
                    onClick={() => setExpandedViewIndex(isExpanded ? -1 : idx)}
                    className="p-3 bg-[#fafbfc] flex items-center justify-between cursor-pointer select-none hover:bg-[#f4f6fa] transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-md bg-purple-100 text-purple-700 text-xs font-bold flex items-center justify-center">
                        {idx + 1}
                      </div>
                      <div>
                        <span className="font-bold text-xs text-[#1a1c1c]">{view.name}</span>
                        <span className="text-[11px] text-[#727785] ml-2 font-mono">
                          ID: "{view.id}"
                        </span>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="text-[11px] font-semibold text-purple-600 bg-purple-50 px-2 py-0.5 rounded">
                        {area.shape || 'rectangle'} ({Math.round(area.width)}% × {Math.round(area.height)}%)
                      </span>

                      {currentConfig.views.length > 1 && (
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            removeView(idx);
                          }}
                          className="p-1 text-[#ba1a1a] hover:bg-red-50 rounded cursor-pointer"
                          title="Delete Angle"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      )}

                      {isExpanded ? (
                        <ChevronUp className="w-4 h-4 text-[#727785]" />
                      ) : (
                        <ChevronDown className="w-4 h-4 text-[#727785]" />
                      )}
                    </div>
                  </div>

                  {/* Expanded Body */}
                  {isExpanded && (
                    <div className="p-4 border-t border-[#eeeeee] space-y-4">
                      {/* 1. Angle & Mockup Configuration */}
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="space-y-3">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
                                Angle Identifier (side)
                              </label>
                              <select
                                value={view.id}
                                onChange={(e) => updateView(idx, { id: e.target.value })}
                                className="w-full px-2.5 py-1.5 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg font-mono font-semibold"
                              >
                                <option value="front">front (Front View)</option>
                                <option value="back">back (Back View)</option>
                                <option value="left_side">left_side (Left Sleeve/Profile)</option>
                                <option value="right_side">right_side (Right Sleeve/Profile)</option>
                                <option value="top">top (Top View / Crown)</option>
                                <option value="bottom">bottom (Bottom View / Base)</option>
                                <option value="wrap">wrap (Panoramic Wrap 360°)</option>
                                <option value={view.id}>{view.id} (Custom Angle)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
                                Display Label
                              </label>
                              <input
                                type="text"
                                required
                                value={view.name}
                                onChange={(e) => updateView(idx, { name: e.target.value })}
                                placeholder="e.g. Front Chest, Left Profile"
                                className="w-full px-2.5 py-1.5 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg"
                              />
                            </div>
                          </div>

                          {/* Image Mockup Uploader */}
                          <CloudinaryImageUploader
                            label={`Mockup Blank (${view.name}) - Product Only`}
                            value={view.mockupUrl || ''}
                            publicId={view.mockupPublicId || ''}
                            onChange={(url, publicId) => {
                              updateView(idx, {
                                mockupUrl: url,
                                mockupPublicId: publicId || '',
                              });
                            }}
                            uploadEndpoint="/api/upload/mockup"
                            helperText="Strictly product only. Clean isolated product blank with transparent/white background."
                          />

                          {/* Shape and Safe Margin */}
                          <div className="grid grid-cols-3 gap-2">
                            <div>
                              <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
                                Shape
                              </label>
                              <select
                                value={area.shape || 'rectangle'}
                                onChange={(e) =>
                                  updateViewPrintableArea(idx, 'shape', e.target.value as PrintableAreaShape)
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg"
                              >
                                <option value="rectangle">Rectangle</option>
                                <option value="rounded">Rounded Box</option>
                                <option value="circle">Circle / Round</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
                                Radius (px)
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="50"
                                disabled={area.shape !== 'rounded'}
                                value={area.borderRadius ?? 8}
                                onChange={(e) =>
                                  updateViewPrintableArea(idx, 'borderRadius', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg disabled:opacity-50"
                              />
                            </div>
                            <div>
                              <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
                                Safe Margin
                              </label>
                              <input
                                type="number"
                                min="0"
                                max="40"
                                value={area.safeMargin ?? 12}
                                onChange={(e) =>
                                  updateViewPrintableArea(idx, 'safeMargin', parseInt(e.target.value) || 0)
                                }
                                className="w-full px-2.5 py-1.5 text-xs bg-[#f9f9f9] border border-[#e2e2e2] rounded-lg"
                              />
                            </div>
                          </div>
                        </div>

                        {/* Visual Stage & Real-time Mockup Coordinate Preview */}
                        <div className="flex flex-col space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-[11px] font-bold text-[#1a1c1c] flex items-center gap-1.5">
                              <Crosshair className="w-3.5 h-3.5 text-purple-700" />
                              Print Area Portion Live Preview
                            </span>
                            <div className="flex items-center gap-1">
                              <button
                                type="button"
                                onClick={() => centerPrintAreaHorizontally(idx)}
                                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-[#1a1c1c] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Center Horizontally"
                              >
                                <AlignCenterHorizontal className="w-3 h-3" />
                                <span>Center X</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => centerPrintAreaVertically(idx)}
                                className="px-2 py-0.5 rounded bg-gray-100 hover:bg-gray-200 text-[#1a1c1c] text-[10px] font-semibold flex items-center gap-1 cursor-pointer"
                                title="Center Vertically"
                              >
                                <AlignCenterVertical className="w-3 h-3" />
                                <span>Center Y</span>
                              </button>
                            </div>
                          </div>

                          {/* Stage Mockup Frame */}
                          <div className="w-full h-52 bg-slate-100 rounded-xl border border-slate-300 relative overflow-hidden flex items-center justify-center">
                            {view.mockupUrl ? (
                              <img
                                src={view.mockupUrl}
                                alt={view.name}
                                className="w-full h-full object-contain p-2"
                              />
                            ) : defaultMockupUrl ? (
                              <img
                                src={defaultMockupUrl}
                                alt="Fallback Base Mockup"
                                className="w-full h-full object-contain p-2 opacity-50"
                              />
                            ) : (
                              <div className="flex flex-col items-center justify-center p-4 text-center">
                                <span className="text-2xl mb-1">📦</span>
                                <span className="text-xs text-slate-500 font-medium">
                                  No image assigned. Enter a product-only mockup URL.
                                </span>
                              </div>
                            )}

                            {/* Overlay Printable Area */}
                            <div
                              className="absolute border-2 border-dashed border-purple-600 bg-purple-500/20 pointer-events-none flex flex-col items-center justify-center text-center transition-all"
                              style={{
                                left: `${area.x}%`,
                                top: `${area.y}%`,
                                width: `${area.width}%`,
                                height: `${area.height}%`,
                                borderRadius:
                                  area.shape === 'circle'
                                    ? '50%'
                                    : area.shape === 'rounded'
                                    ? `${area.borderRadius || 8}px`
                                    : '0px',
                              }}
                            >
                              <span className="text-[10px] font-bold text-purple-950 bg-white/80 px-1.5 py-0.5 rounded shadow-xs">
                                Printable Area ({Math.round(area.width)}% × {Math.round(area.height)}%)
                              </span>
                              <span className="text-[9px] text-purple-900 font-mono mt-0.5">
                                X: {area.x}% | Y: {area.y}%
                              </span>
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* 2. Print Area Portion Presets & Fine Tuning */}
                      <div className="pt-2 border-t border-slate-100 space-y-3">
                        <div>
                          <label className="text-[11px] font-bold text-[#555f6f] block mb-1">
                            🎯 Quick Print Area Presets (Calibrated for Product Types)
                          </label>
                          <div className="flex flex-wrap gap-1.5">
                            {PRINT_AREA_PORTION_PRESETS.map((p) => (
                              <button
                                key={p.id}
                                type="button"
                                onClick={() => applyPrintAreaPreset(idx, p)}
                                className="px-2.5 py-1 bg-white hover:bg-purple-50 text-[#1a1c1c] hover:text-purple-700 border border-slate-200 hover:border-purple-300 rounded-lg text-xs font-medium transition-all cursor-pointer shadow-2xs"
                              >
                                {p.name}
                              </button>
                            ))}
                          </div>
                        </div>

                        {/* Sliders & Numeric Inputs for Precise Dimensions */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-slate-50 p-3 rounded-xl border border-slate-200">
                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-[#555f6f]">Left X (%)</span>
                              <span className="text-[11px] font-mono text-purple-700 font-bold">{area.x}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="80"
                              step="0.5"
                              value={area.x}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'x', parseFloat(e.target.value) || 0)
                              }
                              className="w-full accent-purple-600"
                            />
                            <input
                              type="number"
                              min="0"
                              max="80"
                              step="0.5"
                              value={area.x}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'x', parseFloat(e.target.value) || 0)
                              }
                              className="w-full mt-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-[#555f6f]">Top Y (%)</span>
                              <span className="text-[11px] font-mono text-purple-700 font-bold">{area.y}%</span>
                            </div>
                            <input
                              type="range"
                              min="0"
                              max="80"
                              step="0.5"
                              value={area.y}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'y', parseFloat(e.target.value) || 0)
                              }
                              className="w-full accent-purple-600"
                            />
                            <input
                              type="number"
                              min="0"
                              max="80"
                              step="0.5"
                              value={area.y}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'y', parseFloat(e.target.value) || 0)
                              }
                              className="w-full mt-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-[#555f6f]">Width (%)</span>
                              <span className="text-[11px] font-mono text-purple-700 font-bold">{area.width}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              step="0.5"
                              value={area.width}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'width', parseFloat(e.target.value) || 10)
                              }
                              className="w-full accent-purple-600"
                            />
                            <input
                              type="number"
                              min="5"
                              max="95"
                              step="0.5"
                              value={area.width}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'width', parseFloat(e.target.value) || 10)
                              }
                              className="w-full mt-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            />
                          </div>

                          <div>
                            <div className="flex justify-between items-center mb-1">
                              <span className="text-[11px] font-bold text-[#555f6f]">Height (%)</span>
                              <span className="text-[11px] font-mono text-purple-700 font-bold">{area.height}%</span>
                            </div>
                            <input
                              type="range"
                              min="5"
                              max="95"
                              step="0.5"
                              value={area.height}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'height', parseFloat(e.target.value) || 10)
                              }
                              className="w-full accent-purple-600"
                            />
                            <input
                              type="number"
                              min="5"
                              max="95"
                              step="0.5"
                              value={area.height}
                              onChange={(e) =>
                                updateViewPrintableArea(idx, 'height', parseFloat(e.target.value) || 10)
                              }
                              className="w-full mt-1 px-2 py-1 text-xs bg-white border border-slate-200 rounded"
                            />
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ================= MODE: RAW JSON ================= */}
      {editorMode === 'json' && (
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="text-[#555f6f] font-mono">
              GenericCustomizationConfig Schema (JSON)
            </span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleCopyJson}
                className="px-2 py-1 rounded bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Copy className="w-3 h-3" />
                <span>Copy</span>
              </button>
              <button
                type="button"
                onClick={handleFormatJson}
                className="px-2 py-1 rounded bg-purple-50 hover:bg-purple-100 text-purple-700 font-semibold flex items-center gap-1 cursor-pointer"
              >
                <Sparkles className="w-3 h-3" />
                <span>Format JSON</span>
              </button>
            </div>
          </div>

          <textarea
            rows={14}
            value={jsonText}
            onChange={(e) => handleJsonChange(e.target.value)}
            className={`w-full p-3 font-mono text-xs rounded-xl border bg-[#1e1e24] text-emerald-300 focus:outline-none focus:ring-2 ${
              jsonError ? 'border-red-500 focus:ring-red-500' : 'border-neutral-700 focus:ring-purple-500'
            }`}
            spellCheck={false}
          />

          {jsonError ? (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 p-2.5 rounded-xl border border-red-200">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>JSON Syntax Error: {jsonError}</span>
            </div>
          ) : (
            <div className="flex items-center gap-2 text-[11px] text-emerald-700 bg-emerald-50 p-2 rounded-xl border border-emerald-200">
              <Check className="w-3.5 h-3.5" />
              <span>Valid Customization Schema JSON</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
};
