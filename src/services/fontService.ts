export interface GoogleFont {
  family: string;
  category: 'sans-serif' | 'serif' | 'display' | 'handwriting' | 'monospace';
  variants?: string[];
  popularityRank?: number;
}

const loadedFonts = new Set<string>();

/**
 * Dynamically injects the Google Font CSS link into document head and awaits font face readiness
 */
export async function loadGoogleFont(fontFamily: string): Promise<void> {
  if (!fontFamily) return;

  const normalized = fontFamily.trim();
  if (loadedFonts.has(normalized)) {
    // Already injected
    if (typeof document !== 'undefined' && 'fonts' in document) {
      try {
        await document.fonts.load(`16px "${normalized}"`);
      } catch {
        // Ignore font load wait error
      }
    }
    return;
  }

  // Common system fonts don't need Google Fonts injection
  const systemFonts = ['Arial', 'Helvetica', 'Times New Roman', 'Courier New', 'Georgia', 'Verdana', 'Impact'];
  if (systemFonts.includes(normalized)) {
    loadedFonts.add(normalized);
    return;
  }

  if (typeof document === 'undefined') return;

  // Format font family for Google Fonts CSS2 URL
  const formattedFamily = normalized.replace(/\s+/g, '+');
  const fontUrl = `https://fonts.googleapis.com/css2?family=${formattedFamily}:ital,wght@0,400;0,600;0,700;0,800;1,400;1,700&display=swap`;

  // Create stylesheet link
  const linkId = `gfont-${normalized.toLowerCase().replace(/[^a-z0-9]/g, '-')}`;
  if (!document.getElementById(linkId)) {
    const link = document.createElement('link');
    link.id = linkId;
    link.rel = 'stylesheet';
    link.href = fontUrl;
    document.head.appendChild(link);
  }

  loadedFonts.add(normalized);

  // Wait for font to be loaded in document.fonts
  if ('fonts' in document) {
    try {
      await Promise.race([
        document.fonts.load(`16px "${normalized}"`),
        new Promise((resolve) => setTimeout(resolve, 1500)), // 1.5s fallback
      ]);
    } catch (e) {
      console.warn(`Font load note for "${normalized}":`, e);
    }
  }
}

/**
 * Fetches Google Fonts from the backend API
 */
export async function fetchGoogleFonts(options?: {
  search?: string;
  category?: string;
  sort?: string;
  limit?: number;
}): Promise<GoogleFont[]> {
  try {
    const params = new URLSearchParams();
    if (options?.search) params.set('search', options.search);
    if (options?.category && options.category !== 'all') params.set('category', options.category);
    if (options?.sort) params.set('sort', options.sort);
    if (options?.limit) params.set('limit', String(options.limit));

    const res = await fetch(`/api/fonts?${params.toString()}`);
    if (!res.ok) throw new Error(`Failed to fetch fonts: ${res.statusText}`);
    const data = await res.json();
    return data.fonts || [];
  } catch (err) {
    console.warn('Could not fetch fonts from /api/fonts, returning fallback list:', err);
    return [
      { family: 'Montserrat', category: 'sans-serif', popularityRank: 1 },
      { family: 'Inter', category: 'sans-serif', popularityRank: 2 },
      { family: 'Roboto', category: 'sans-serif', popularityRank: 3 },
      { family: 'Open Sans', category: 'sans-serif', popularityRank: 4 },
      { family: 'Playfair Display', category: 'serif', popularityRank: 5 },
      { family: 'Bebas Neue', category: 'display', popularityRank: 6 },
      { family: 'Pacifico', category: 'handwriting', popularityRank: 7 },
      { family: 'Space Grotesk', category: 'sans-serif', popularityRank: 8 },
      { family: 'Oswald', category: 'sans-serif', popularityRank: 9 },
      { family: 'Lobster', category: 'display', popularityRank: 10 },
      { family: 'Dancing Script', category: 'handwriting', popularityRank: 11 },
      { family: 'Caveat', category: 'handwriting', popularityRank: 12 },
      { family: 'Roboto Mono', category: 'monospace', popularityRank: 13 },
      { family: 'Cinzel', category: 'serif', popularityRank: 14 },
    ];
  }
}
