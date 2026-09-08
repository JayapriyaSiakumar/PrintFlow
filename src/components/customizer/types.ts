import { DesignElement, DesignSide, Product, ProductColor, Size } from '../../types';

export interface EditorHistoryState {
  sides: {
    front: { elements: DesignElement[] };
    back: { elements: DesignElement[] };
  };
  activeSide: DesignSide;
}

export interface PrintableAreaConfig {
  width: number; // width in virtual canvas units (e.g., 280)
  height: number; // height in virtual canvas units (e.g., 380)
  top: number; // offset from mockup top (e.g., 110)
  left: number; // offset from mockup left (e.g., 110)
  safeMargin: number; // safe-zone margin (e.g., 14)
}

export const FONT_OPTIONS = [
  { name: 'Montserrat (Modern Bold)', value: 'Montserrat', fontStyle: 'font-bold' },
  { name: 'Inter (Clean Sans)', value: 'Inter', fontStyle: 'font-normal' },
  { name: 'Playfair Display (Serif Elegance)', value: 'Playfair Display', fontStyle: 'font-serif' },
  { name: 'Bebas Neue (Display Headline)', value: 'Bebas Neue', fontStyle: 'tracking-wider font-bold' },
  { name: 'Pacifico (Brush Script)', value: 'Pacifico', fontStyle: 'italic' },
  { name: 'Space Grotesk (Tech Modern)', value: 'Space Grotesk', fontStyle: 'font-medium' },
  { name: 'Roboto Mono (Monospace)', value: 'Roboto Mono', fontStyle: 'font-mono' },
  { name: 'Oswald (Condensed Impact)', value: 'Oswald', fontStyle: 'font-semibold' },
];

export const PRESET_COLORS = [
  { name: 'Crisp White', hex: '#ffffff', border: true },
  { name: 'Pitch Black', hex: '#111111' },
  { name: 'Royal Blue', hex: '#0058be' },
  { name: 'Sky Cyan', hex: '#38bdf8' },
  { name: 'Emerald Green', hex: '#16a34a' },
  { name: 'Vibrant Crimson', hex: '#dc2626' },
  { name: 'Sunset Orange', hex: '#f97316' },
  { name: 'Solar Amber', hex: '#eab308' },
  { name: 'Royal Purple', hex: '#7c3aed' },
  { name: 'Blush Pink', hex: '#ec4899' },
  { name: 'Warm Cream', hex: '#fef08a' },
  { name: 'Gunmetal Gray', hex: '#4b5563' },
];

export interface ClipartItem {
  id: string;
  name: string;
  category: 'emblems' | 'waves' | 'abstract' | 'nature';
  svgUrl: string;
}

export const SAMPLE_CLIPART: ClipartItem[] = [
  {
    id: 'clip-1',
    name: 'Mountain Peak Emblem',
    category: 'nature',
    svgUrl: 'https://images.unsplash.com/photo-1506744038136-46273834b3fb?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'clip-2',
    name: 'Tokyo Neon Cyber Wave',
    category: 'waves',
    svgUrl: 'https://images.unsplash.com/photo-1579783902614-a3fb3927b675?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'clip-3',
    name: 'Botanical Leaf Branch',
    category: 'nature',
    svgUrl: 'https://images.unsplash.com/photo-1518531933037-91b2f5f229cc?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'clip-4',
    name: 'Minimal Geometric Sun',
    category: 'abstract',
    svgUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'clip-5',
    name: 'Vintage Crest Badge',
    category: 'emblems',
    svgUrl: 'https://images.unsplash.com/photo-1544816155-12df9643f363?auto=format&fit=crop&w=400&q=80',
  },
  {
    id: 'clip-6',
    name: 'Cosmic Starburst',
    category: 'abstract',
    svgUrl: 'https://images.unsplash.com/photo-1507499739999-097706ad8914?auto=format&fit=crop&w=400&q=80',
  },
];

/**
 * Returns printable area bounds configured per product category
 */
export function getProductPrintArea(product?: Product | null, side: DesignSide = 'front'): PrintableAreaConfig {
  const cat = typeof product?.category === 'object' ? product.category.slug : (product?.categoryName || product?.category || '').toLowerCase();

  if (cat.includes('drinkware') || cat.includes('mug')) {
    return {
      width: 220,
      height: 240,
      top: 140,
      left: 140,
      safeMargin: 12,
    };
  }

  if (cat.includes('tote') || cat.includes('bag')) {
    return {
      width: 240,
      height: 260,
      top: 150,
      left: 130,
      safeMargin: 15,
    };
  }

  if (cat.includes('hat') || cat.includes('headwear')) {
    return {
      width: 180,
      height: 120,
      top: 190,
      left: 160,
      safeMargin: 10,
    };
  }

  if (cat.includes('stationery') || cat.includes('poster') || cat.includes('canvas')) {
    return {
      width: 260,
      height: 360,
      top: 70,
      left: 120,
      safeMargin: 15,
    };
  }

  // Default Apparel (T-Shirts, Hoodies, Sweatshirts)
  if (side === 'back') {
    return {
      width: 240,
      height: 330,
      top: 90,
      left: 130,
      safeMargin: 14,
    };
  }

  return {
    width: 230,
    height: 310,
    top: 110,
    left: 135,
    safeMargin: 14,
  };
}
