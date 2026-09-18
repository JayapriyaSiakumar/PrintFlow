import { DesignElement, DesignSide, Product, ProductColor, ProductCustomizationView } from '../types';
import { PrintableAreaConfig } from '../components/customizer/types';
import { getEffectiveCustomizationConfig, resolvePrintableAreaPixels } from './customizationEngine';

// Cache for preloaded HTMLImageElements to make re-renders instant
const loadedImageCache = new Map<string, HTMLImageElement>();

/**
 * Safely loads an image with CORS enabled, falling back to /api/proxy-image if needed
 * to prevent browser canvas tainting errors.
 */
export async function loadSafeImage(url: string): Promise<HTMLImageElement> {
  if (!url) {
    throw new Error('Image URL is required');
  }

  // Check cache
  const cached = loadedImageCache.get(url);
  if (cached && cached.complete && cached.naturalWidth > 0) {
    return cached;
  }

  // If already data URL or blob, load directly
  if (url.startsWith('data:') || url.startsWith('blob:')) {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        loadedImageCache.set(url, img);
        resolve(img);
      };
      img.onerror = (e) => reject(new Error(`Failed to load data URL image: ${e}`));
      img.src = url;
    });
  }

  // Try direct load with crossOrigin = 'anonymous'
  try {
    const directImg = await new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Direct CORS load failed'));
      // Append cache buster if external to bypass potential non-CORS cached responses
      const sep = url.includes('?') ? '&' : '?';
      img.src = `${url}${sep}_pf_cors=1`;
    });
    loadedImageCache.set(url, directImg);
    return directImg;
  } catch {
    // Fallback to proxy route
    const proxyUrl = `/api/proxy-image?url=${encodeURIComponent(url)}`;
    return new Promise((resolve, reject) => {
      const proxyImg = new Image();
      proxyImg.crossOrigin = 'anonymous';
      proxyImg.onload = () => {
        loadedImageCache.set(url, proxyImg);
        resolve(proxyImg);
      };
      proxyImg.onerror = (e) => reject(new Error(`Proxy image load failed for ${url}: ${e}`));
      proxyImg.src = proxyUrl;
    });
  }
}

export interface PreviewGenerationOptions {
  product: Product | null;
  selectedColor: ProductColor;
  activeSide: DesignSide;
  printArea?: PrintableAreaConfig;
  view?: ProductCustomizationView;
  elements: DesignElement[];
  width?: number;
  height?: number;
}

export interface GeneratedPreviewResult {
  dataUrl: string;
  url?: string;
  publicId?: string;
}

/**
 * Generates a full composite preview image where:
 * 1. FIRST LAYER (BASE): Generic product mockup image for the active view + optional tint
 * 2. SECOND LAYER (OVERLAY): Customer customizations (text, graphics, cliparts)
 *
 * This ensures that every preview (preview modal, cart item, saved design, order)
 * is guaranteed to contain the realistic product image as the base layer!
 */
export async function generateProductPreview(
  options: PreviewGenerationOptions
): Promise<GeneratedPreviewResult> {
  const {
    product,
    selectedColor,
    activeSide,
    printArea: explicitPrintArea,
    view: explicitView,
    elements,
    width = 600,
    height = 648,
  } = options;

  // 1. Determine effective customization configuration & view
  const config = getEffectiveCustomizationConfig(product);
  const currentView =
    explicitView ||
    config.views.find((v) => v.id === activeSide) ||
    config.views[0];

  // 2. Determine base product mockup image
  const baseImageUrl =
    currentView?.mockupUrl ||
    product?.mockupImages?.find((m) => m.side === activeSide)?.url ||
    product?.image ||
    'https://images.unsplash.com/photo-1521572267360-ee0c2909d518?auto=format&fit=crop&w=800&q=80';

  // 3. Setup Offscreen Canvas
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Canvas 2D context not available');
  }

  // Scale factor between CanvasEditor virtual size (500x540) and export canvas
  const VIRTUAL_STAGE_WIDTH = 500;
  const VIRTUAL_STAGE_HEIGHT = 540;
  const scale = width / VIRTUAL_STAGE_WIDTH;

  // --- LAYER 1: CRISP BACKGROUND CARD ---
  ctx.fillStyle = '#fcfcfd';
  ctx.fillRect(0, 0, width, height);

  // --- LAYER 1: BASE PRODUCT MOCKUP IMAGE (MANDATORY FIRST LAYER) ---
  try {
    const baseImg = await loadSafeImage(baseImageUrl);

    const padding = 16 * scale;
    const availW = width - padding * 2;
    const availH = height - padding * 2;
    const naturalW = baseImg.naturalWidth || 500;
    const naturalH = baseImg.naturalHeight || 540;
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

    const drawX = Math.round((width - drawW) / 2);
    const drawY = Math.round((height - drawH) / 2);

    // Draw the product image as base
    ctx.drawImage(baseImg, drawX, drawY, drawW, drawH);

    // Color Tint Overlay if enabled by product config & color is not pure white
    const tintingEnabled = config.colorTinting?.enabled !== false;
    if (tintingEnabled && selectedColor.hex && selectedColor.hex.toLowerCase() !== '#ffffff') {
      ctx.save();
      ctx.globalCompositeOperation = (config.colorTinting?.blendMode as GlobalCompositeOperation) || 'multiply';
      ctx.fillStyle = selectedColor.hex;
      ctx.globalAlpha = config.colorTinting?.opacity || 0.36;
      ctx.fillRect(drawX, drawY, drawW, drawH);
      ctx.restore();
    }

    // View Label Indicator (if product has multiple views)
    if (config.views.length > 1 && currentView && currentView.name) {
      ctx.save();
      const badgeText = currentView.name.toUpperCase();
      ctx.font = `bold ${Math.round(9 * scale)}px Inter, sans-serif`;
      const textMetrics = ctx.measureText(badgeText);
      const pillW = Math.max(80 * scale, textMetrics.width + 20 * scale);
      const pillH = 22 * scale;
      const pillX = width - pillW - 16 * scale;
      const pillY = 16 * scale;

      ctx.fillStyle = 'rgba(26, 28, 28, 0.75)';
      ctx.beginPath();
      if (ctx.roundRect) {
        ctx.roundRect(pillX, pillY, pillW, pillH, 11 * scale);
      } else {
        ctx.rect(pillX, pillY, pillW, pillH);
      }
      ctx.fill();

      ctx.fillStyle = '#ffffff';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText(badgeText, pillX + pillW / 2, pillY + pillH / 2);
      ctx.restore();
    }
  } catch (err) {
    console.warn('Warning: could not draw base image to canvas:', err);
    // Draw placeholder silhouette if image load failed
    ctx.fillStyle = selectedColor.hex || '#f1f5f9';
    ctx.beginPath();
    if (ctx.roundRect) {
      ctx.roundRect(width * 0.15, height * 0.1, width * 0.7, height * 0.8, 16 * scale);
    } else {
      ctx.rect(width * 0.15, height * 0.1, width * 0.7, height * 0.8);
    }
    ctx.fill();
  }

  // --- LAYER 2: CUSTOMIZATION OVERLAY (TEXT & GRAPHICS) ---
  const resolvedArea = currentView?.printableArea
    ? resolvePrintableAreaPixels(currentView.printableArea, VIRTUAL_STAGE_WIDTH, VIRTUAL_STAGE_HEIGHT)
    : {
        x: explicitPrintArea?.left ?? 135,
        y: explicitPrintArea?.top ?? 110,
        width: explicitPrintArea?.width ?? 230,
        height: explicitPrintArea?.height ?? 310,
        safeMargin: explicitPrintArea?.safeMargin ?? 14,
        shape: explicitPrintArea?.shape ?? 'rectangle',
        borderRadius: explicitPrintArea?.borderRadius ?? 0,
      };

  const printLeft = (explicitPrintArea ? explicitPrintArea.left : resolvedArea.x) * scale;
  const printTop = (explicitPrintArea ? explicitPrintArea.top : resolvedArea.y) * scale;

  // Filter visible elements
  const visibleElements = elements.filter((el) => el.visible !== false);

  for (const el of visibleElements) {
    ctx.save();
    // Element position is relative to printable area
    const elX = printLeft + (el.x * scale);
    const elY = printTop + (el.y * scale);
    const elW = el.width * (el.scaleX || 1) * scale;
    const elH = el.height * (el.scaleY || 1) * scale;

    ctx.translate(elX + elW / 2, elY + elH / 2);
    if (el.rotation) {
      ctx.rotate((el.rotation * Math.PI) / 180);
    }
    if (el.opacity !== undefined) {
      ctx.globalAlpha = el.opacity;
    }

    if (el.type === 'text' && el.text) {
      const fontSize = Math.round((el.fontSize || 24) * (el.scaleY || 1) * scale);
      const fontStyle = el.fontStyle || 'normal';
      const fontFamily = el.fontFamily || 'Montserrat';

      ctx.font = `${fontStyle} ${fontSize}px "${fontFamily}", sans-serif`;
      ctx.fillStyle = el.fill || '#111111';
      ctx.textAlign = (el.align as CanvasTextAlign) || 'center';
      ctx.textBaseline = 'middle';

      // Draw text centered at (0, 0)
      ctx.fillText(el.text, 0, 0);
    } else if (el.type === 'image' && el.src) {
      try {
        const img = await loadSafeImage(el.src);
        ctx.drawImage(img, -elW / 2, -elH / 2, elW, elH);
      } catch (e) {
        console.warn('Could not draw element image:', e);
      }
    }

    ctx.restore();
  }

  // 3. Export to high-res PNG Data URL
  const dataUrl = canvas.toDataURL('image/png');

  // 4. Try uploading to Cloudinary preview endpoint (graceful fallback)
  let cloudUrl = '';
  let cloudPublicId = '';
  try {
    const token = localStorage.getItem('token');
    const uploadRes = await fetch('/api/upload/preview', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { Authorization: `Bearer ${token}` } : {}),
      },
      body: JSON.stringify({
        imageDataUrl: dataUrl,
        productId: product?.id,
        side: activeSide,
      }),
    });

    if (uploadRes.ok) {
      const json = await uploadRes.json();
      if (json.success && json.url) {
        cloudUrl = json.url;
        cloudPublicId = json.publicId || '';
      }
    }
  } catch (err) {
    // Graceful fallback: dataUrl is returned
    console.debug('Preview upload to Cloudinary skipped or unavailable:', err);
  }

  return {
    dataUrl,
    url: cloudUrl || dataUrl,
    publicId: cloudPublicId,
  };
}
