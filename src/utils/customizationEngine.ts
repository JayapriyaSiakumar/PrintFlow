import {
  Product,
  ProductCustomizationView,
  GenericCustomizationConfig,
  PrintableAreaDefinition,
  PrintableAreaShape,
} from '../types';

export const VIRTUAL_STAGE_WIDTH = 500;
export const VIRTUAL_STAGE_HEIGHT = 540;

/**
 * Resolves a PrintableAreaDefinition (whether percentages or virtual canvas pixels)
 * into concrete pixel coordinates on a canvas of (stageWidth x stageHeight).
 */
export function resolvePrintableAreaPixels(
  area: PrintableAreaDefinition,
  stageWidth: number = VIRTUAL_STAGE_WIDTH,
  stageHeight: number = VIRTUAL_STAGE_HEIGHT
): {
  x: number;
  y: number;
  top: number;
  left: number;
  width: number;
  height: number;
  safeMargin: number;
  shape: PrintableAreaShape;
  borderRadius: number;
} {
  const isPercent =
    area.isPercentage ||
    (area.x <= 100 && area.y <= 100 && area.width <= 100 && area.height <= 100 && area.width > 0);

  let x: number;
  let y: number;
  let width: number;
  let height: number;

  if (isPercent) {
    x = Math.round((area.x / 100) * stageWidth);
    y = Math.round((area.y / 100) * stageHeight);
    width = Math.round((area.width / 100) * stageWidth);
    height = Math.round((area.height / 100) * stageHeight);
  } else {
    // Relative to standard virtual stage dimensions
    const scaleX = stageWidth / VIRTUAL_STAGE_WIDTH;
    const scaleY = stageHeight / VIRTUAL_STAGE_HEIGHT;
    x = Math.round(area.x * scaleX);
    y = Math.round(area.y * scaleY);
    width = Math.round(area.width * scaleX);
    height = Math.round(area.height * scaleY);
  }

  const safeMargin = area.safeMargin ?? 12;
  const shape: PrintableAreaShape = area.shape || 'rectangle';
  const borderRadius = area.borderRadius ?? (shape === 'rounded' ? 16 : 0);

  return {
    x,
    y,
    top: y,
    left: x,
    width,
    height,
    safeMargin,
    shape,
    borderRadius,
  };
}

/**
 * Common preset templates for various customizable product categories.
 * Admin can select these with one click to populate all views and printable areas.
 */
export const CUSTOMIZATION_PRESETS: {
  id: string;
  name: string;
  category: string;
  config: GenericCustomizationConfig;
}[] = [
  {
    id: 'preset-tshirt',
    name: 'T-Shirt (Front & Back)',
    category: 'Apparel',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: true, blendMode: 'multiply', opacity: 0.36 },
      views: [
        {
          id: 'front',
          name: 'Front View',
          mockupUrl: '',
          printableArea: {
            x: 27, // %
            y: 20.4, // %
            width: 46, // %
            height: 57.4, // %
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'back',
          name: 'Back View',
          mockupUrl: '',
          printableArea: {
            x: 26,
            y: 16.7,
            width: 48,
            height: 61.1,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-hoodie',
    name: 'Hoodie (Front Chest & Full Back)',
    category: 'Apparel',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: true, blendMode: 'multiply', opacity: 0.36 },
      views: [
        {
          id: 'front',
          name: 'Front Chest',
          mockupUrl: '',
          printableArea: {
            x: 28,
            y: 26,
            width: 44,
            height: 48,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 12,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'back',
          name: 'Full Back',
          mockupUrl: '',
          printableArea: {
            x: 25,
            y: 20,
            width: 50,
            height: 58,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-mug',
    name: 'Ceramic Mug (Wrap-Around Print)',
    category: 'Home Decor',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'wrap',
          name: 'Panoramic Wrap',
          mockupUrl: '',
          printableArea: {
            x: 28,
            y: 26,
            width: 44,
            height: 44.4,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 12,
            safeMargin: 12,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-tote',
    name: 'Canvas Tote / Bag (Front & Back)',
    category: 'Accessories',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'front',
          name: 'Front Side',
          mockupUrl: '',
          printableArea: {
            x: 26,
            y: 27.8,
            width: 48,
            height: 48.1,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'back',
          name: 'Back Side',
          mockupUrl: '',
          printableArea: {
            x: 26,
            y: 27.8,
            width: 48,
            height: 48.1,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-cap',
    name: 'Dad Hat / Baseball Cap (Front Crown, Left & Right)',
    category: 'Accessories',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: true, blendMode: 'multiply', opacity: 0.35 },
      views: [
        {
          id: 'front',
          name: 'Front Crown Panel',
          mockupUrl: '',
          printableArea: {
            x: 32,
            y: 35.2,
            width: 36,
            height: 22.2,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 16,
            safeMargin: 10,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'left',
          name: 'Left Profile',
          mockupUrl: '',
          printableArea: {
            x: 35,
            y: 38,
            width: 30,
            height: 18,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 12,
            safeMargin: 8,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-phone-case',
    name: 'Phone Case / Mobile Skin',
    category: 'Accessories',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'case_back',
          name: 'Back Case Surface',
          mockupUrl: '',
          printableArea: {
            x: 30,
            y: 12,
            width: 40,
            height: 76,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 24,
            safeMargin: 10,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-notebook',
    name: 'Notebook / Journal (Cover)',
    category: 'Stationery',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'cover',
          name: 'Front Cover',
          mockupUrl: '',
          printableArea: {
            x: 24,
            y: 13,
            width: 52,
            height: 66.7,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'back_cover',
          name: 'Back Cover',
          mockupUrl: '',
          printableArea: {
            x: 24,
            y: 13,
            width: 52,
            height: 66.7,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-cushion',
    name: 'Cushion / Pillow (Square)',
    category: 'Home Decor',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'front',
          name: 'Front Face',
          mockupUrl: '',
          printableArea: {
            x: 20,
            y: 18.5,
            width: 60,
            height: 63,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 18,
            safeMargin: 16,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'back',
          name: 'Back Face',
          mockupUrl: '',
          printableArea: {
            x: 20,
            y: 18.5,
            width: 60,
            height: 63,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 18,
            safeMargin: 16,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
  {
    id: 'preset-shoes',
    name: 'Custom Shoes / Footwear',
    category: 'Footwear',
    config: {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'lateral',
          name: 'Outer Profile (Lateral)',
          mockupUrl: '',
          printableArea: {
            x: 22,
            y: 35,
            width: 56,
            height: 32,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 12,
            safeMargin: 10,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'medial',
          name: 'Inner Profile (Medial)',
          mockupUrl: '',
          printableArea: {
            x: 22,
            y: 35,
            width: 56,
            height: 32,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 12,
            safeMargin: 10,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    },
  },
];

/**
 * Returns the effective customization configuration for any product.
 * If the product already has an explicit customizationConfig stored in the database,
 * it is returned directly. Otherwise, it dynamically creates a pristine,
 * category-tailored configuration using the product's primary and mockup images.
 */
export function getEffectiveCustomizationConfig(
  product?: Product | null
): GenericCustomizationConfig {
  if (
    product?.customizationConfig &&
    product.customizationConfig.views &&
    product.customizationConfig.views.length > 0
  ) {
    // Fill in mockup images if blank
    const views = product.customizationConfig.views.map((v) => {
      let mockup = v.mockupUrl;
      if (!mockup) {
        const found = product.mockupImages?.find((m) => m.side === v.id);
        mockup = found?.url || (v.id === 'front' ? product.image : undefined) || product.image;
      }
      return {
        ...v,
        mockupUrl: mockup,
      };
    });

    return {
      ...product.customizationConfig,
      views,
    };
  }

  // Fallback generation based on product category & attributes
  const catSlug =
    typeof product?.category === 'object'
      ? product.category.slug
      : (product?.categoryName || product?.category || '').toLowerCase();

  const prodImage =
    product?.image ||
    'https://images.unsplash.com/photo-1581655353564-df123a1eb820?auto=format&fit=crop&w=800&q=80';

  const backMockup = product?.mockupImages?.find((m) => m.side === 'back')?.url;

  // 1. Mug / Drinkware
  if (catSlug.includes('drinkware') || catSlug.includes('mug')) {
    return {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'wrap',
          name: 'Wrap-Around Surface',
          mockupUrl: prodImage,
          printableArea: {
            x: 28,
            y: 26,
            width: 44,
            height: 44.4,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 12,
            safeMargin: 12,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    };
  }

  // 2. Bags / Totes / Backpacks
  if (catSlug.includes('tote') || catSlug.includes('bag')) {
    return {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'front',
          name: 'Front Side',
          mockupUrl: prodImage,
          printableArea: {
            x: 26,
            y: 27.8,
            width: 48,
            height: 48.1,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
        {
          id: 'back',
          name: 'Back Side',
          mockupUrl: backMockup || prodImage,
          printableArea: {
            x: 26,
            y: 27.8,
            width: 48,
            height: 48.1,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    };
  }

  // 3. Headwear / Caps / Hats
  if (catSlug.includes('hat') || catSlug.includes('cap') || catSlug.includes('headwear')) {
    return {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: true, blendMode: 'multiply', opacity: 0.35 },
      views: [
        {
          id: 'front',
          name: 'Front Crown Panel',
          mockupUrl: prodImage,
          printableArea: {
            x: 32,
            y: 35.2,
            width: 36,
            height: 22.2,
            isPercentage: true,
            shape: 'rounded',
            borderRadius: 16,
            safeMargin: 10,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    };
  }

  // 4. Stationery / Journals / Canvas Prints
  if (
    catSlug.includes('stationery') ||
    catSlug.includes('journal') ||
    catSlug.includes('poster') ||
    catSlug.includes('canvas')
  ) {
    return {
      enabled: true,
      previewType: 'canvas_2d',
      colorTinting: { enabled: false },
      views: [
        {
          id: 'front',
          name: 'Front Surface',
          mockupUrl: prodImage,
          printableArea: {
            x: 24,
            y: 13,
            width: 52,
            height: 66.7,
            isPercentage: true,
            shape: 'rectangle',
            safeMargin: 14,
          },
          allowedElementTypes: ['text', 'image'],
        },
      ],
    };
  }

  // 5. Default Apparel (T-Shirts, Hoodies, Sweatshirts)
  const isApparel = catSlug.includes('apparel') || !catSlug;
  return {
    enabled: true,
    previewType: 'canvas_2d',
    colorTinting: {
      enabled: isApparel,
      blendMode: 'multiply',
      opacity: 0.36,
    },
    views: [
      {
        id: 'front',
        name: 'Front',
        mockupUrl: prodImage,
        printableArea: {
          x: 27,
          y: 20.4,
          width: 46,
          height: 57.4,
          isPercentage: true,
          shape: 'rectangle',
          safeMargin: 14,
        },
        allowedElementTypes: ['text', 'image'],
      },
      {
        id: 'back',
        name: 'Back',
        mockupUrl: backMockup || prodImage,
        printableArea: {
          x: 26,
          y: 16.7,
          width: 48,
          height: 61.1,
          isPercentage: true,
          shape: 'rectangle',
          safeMargin: 14,
        },
        allowedElementTypes: ['text', 'image'],
      },
    ],
  };
}
