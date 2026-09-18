import { Router, Request, Response } from 'express';

const router = Router();

export interface GoogleFontItem {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants?: string[];
  subsets?: string[];
  popularityRank?: number;
}

// Curated high-quality Google Fonts catalog across all typography categories
export const CURATED_GOOGLE_FONTS: GoogleFontItem[] = [
  // Sans-Serif
  { family: 'Roboto', category: 'sans-serif', popularityRank: 1 },
  { family: 'Open Sans', category: 'sans-serif', popularityRank: 2 },
  { family: 'Montserrat', category: 'sans-serif', popularityRank: 3 },
  { family: 'Lato', category: 'sans-serif', popularityRank: 4 },
  { family: 'Poppins', category: 'sans-serif', popularityRank: 5 },
  { family: 'Inter', category: 'sans-serif', popularityRank: 6 },
  { family: 'Oswald', category: 'sans-serif', popularityRank: 7 },
  { family: 'Raleway', category: 'sans-serif', popularityRank: 8 },
  { family: 'Nunito', category: 'sans-serif', popularityRank: 9 },
  { family: 'Rubik', category: 'sans-serif', popularityRank: 10 },
  { family: 'Work Sans', category: 'sans-serif', popularityRank: 11 },
  { family: 'Plus Jakarta Sans', category: 'sans-serif', popularityRank: 12 },
  { family: 'Outfit', category: 'sans-serif', popularityRank: 13 },
  { family: 'DM Sans', category: 'sans-serif', popularityRank: 14 },
  { family: 'Space Grotesk', category: 'sans-serif', popularityRank: 15 },
  { family: 'Quicksand', category: 'sans-serif', popularityRank: 16 },
  { family: 'Syne', category: 'sans-serif', popularityRank: 17 },
  { family: 'Barlow', category: 'sans-serif', popularityRank: 18 },
  { family: 'Kanit', category: 'sans-serif', popularityRank: 19 },
  { family: 'Urbanist', category: 'sans-serif', popularityRank: 20 },

  // Serif
  { family: 'Playfair Display', category: 'serif', popularityRank: 21 },
  { family: 'Merriweather', category: 'serif', popularityRank: 22 },
  { family: 'Lora', category: 'serif', popularityRank: 23 },
  { family: 'PT Serif', category: 'serif', popularityRank: 24 },
  { family: 'Cinzel', category: 'serif', popularityRank: 25 },
  { family: 'Cormorant Garamond', category: 'serif', popularityRank: 26 },
  { family: 'Bodoni Moda', category: 'serif', popularityRank: 27 },
  { family: 'EB Garamond', category: 'serif', popularityRank: 28 },
  { family: 'Prata', category: 'serif', popularityRank: 29 },
  { family: 'DM Serif Display', category: 'serif', popularityRank: 30 },
  { family: 'Castoro Titling', category: 'serif', popularityRank: 31 },

  // Display
  { family: 'Bebas Neue', category: 'display', popularityRank: 32 },
  { family: 'Anton', category: 'display', popularityRank: 33 },
  { family: 'Abril Fatface', category: 'display', popularityRank: 34 },
  { family: 'Righteous', category: 'display', popularityRank: 35 },
  { family: 'Lobster', category: 'display', popularityRank: 36 },
  { family: 'Bangers', category: 'display', popularityRank: 37 },
  { family: 'Russo One', category: 'display', popularityRank: 38 },
  { family: 'Comfortaa', category: 'display', popularityRank: 39 },
  { family: 'Press Start 2P', category: 'display', popularityRank: 40 },
  { family: 'Cinzel Decorative', category: 'display', popularityRank: 41 },
  { family: 'Alfa Slab One', category: 'display', popularityRank: 42 },
  { family: 'Black Ops One', category: 'display', popularityRank: 43 },
  { family: 'Monoton', category: 'display', popularityRank: 44 },
  { family: 'Fredoka', category: 'display', popularityRank: 45 },
  { family: 'Titan One', category: 'display', popularityRank: 46 },
  { family: 'Creepster', category: 'display', popularityRank: 47 },

  // Handwriting / Script
  { family: 'Pacifico', category: 'handwriting', popularityRank: 48 },
  { family: 'Dancing Script', category: 'handwriting', popularityRank: 49 },
  { family: 'Caveat', category: 'handwriting', popularityRank: 50 },
  { family: 'Great Vibes', category: 'handwriting', popularityRank: 51 },
  { family: 'Satisfy', category: 'handwriting', popularityRank: 52 },
  { family: 'Sacramento', category: 'handwriting', popularityRank: 53 },
  { family: 'Shadows Into Light', category: 'handwriting', popularityRank: 54 },
  { family: 'Permanent Marker', category: 'handwriting', popularityRank: 55 },
  { family: 'Kalam', category: 'handwriting', popularityRank: 56 },
  { family: 'Courgette', category: 'handwriting', popularityRank: 57 },
  { family: 'Architects Daughter', category: 'handwriting', popularityRank: 58 },
  { family: 'Indie Flower', category: 'handwriting', popularityRank: 59 },
  { family: 'Gloria Hallelujah', category: 'handwriting', popularityRank: 60 },

  // Monospace
  { family: 'Roboto Mono', category: 'monospace', popularityRank: 61 },
  { family: 'Space Mono', category: 'monospace', popularityRank: 62 },
  { family: 'Fira Code', category: 'monospace', popularityRank: 63 },
  { family: 'JetBrains Mono', category: 'monospace', popularityRank: 64 },
  { family: 'Source Code Pro', category: 'monospace', popularityRank: 65 },
  { family: 'VT323', category: 'monospace', popularityRank: 66 },
];

let cachedGoogleFonts: GoogleFontItem[] | null = null;
let lastFetchTime = 0;
const CACHE_TTL_MS = 1000 * 60 * 60; // 1 hour cache

router.get('/', async (req: Request, res: Response) => {
  try {
    const search = ((req.query.search as string) || '').trim().toLowerCase();
    const category = ((req.query.category as string) || 'all').toLowerCase();
    const sort = ((req.query.sort as string) || 'popularity').toLowerCase();
    const limit = Math.min(100, Math.max(1, parseInt((req.query.limit as string) || '50', 10)));

    let fontsList: GoogleFontItem[] = CURATED_GOOGLE_FONTS;

    // Check if Google Fonts API Key is available
    const apiKey = process.env.GOOGLE_FONTS_API_KEY;
    if (apiKey) {
      const now = Date.now();
      if (!cachedGoogleFonts || now - lastFetchTime > CACHE_TTL_MS) {
        try {
          const response = await fetch(
            `https://www.googleapis.com/webfonts/v1/webfonts?sort=popularity&key=${apiKey}`
          );
          if (response.ok) {
            const data = await response.json();
            if (Array.isArray(data.items)) {
              cachedGoogleFonts = data.items.map((item: any, idx: number) => ({
                family: item.family,
                category: item.category as GoogleFontItem['category'],
                variants: item.variants,
                subsets: item.subsets,
                popularityRank: idx + 1,
              }));
              lastFetchTime = now;
            }
          }
        } catch (fetchErr) {
          console.warn('Google Fonts API live fetch warning, using fallback list:', fetchErr);
        }
      }
      if (cachedGoogleFonts && cachedGoogleFonts.length > 0) {
        fontsList = cachedGoogleFonts;
      }
    }

    // Filter by search term
    if (search) {
      fontsList = fontsList.filter((f) => f.family.toLowerCase().includes(search));
    }

    // Filter by category
    if (category && category !== 'all') {
      fontsList = fontsList.filter((f) => f.category === category);
    }

    // Sort
    if (sort === 'alpha') {
      fontsList = [...fontsList].sort((a, b) => a.family.localeCompare(b.family));
    } else {
      fontsList = [...fontsList].sort(
        (a, b) => (a.popularityRank || 999) - (b.popularityRank || 999)
      );
    }

    const total = fontsList.length;
    const paginated = fontsList.slice(0, limit);

    return res.json({
      success: true,
      total,
      count: paginated.length,
      fonts: paginated,
    });
  } catch (err: any) {
    return res.status(500).json({ success: false, error: err.message });
  }
});

export default router;
