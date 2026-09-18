import React, { useState, useEffect, useRef, useMemo } from 'react';
import { Search, ChevronDown, Check, Sparkles, Filter, RefreshCw } from 'lucide-react';
import { fetchGoogleFonts, loadGoogleFont, GoogleFont } from '../../services/fontService';

interface FontSelectorDropdownProps {
  value: string;
  onChange: (fontFamily: string) => void;
  disabled?: boolean;
}

const CATEGORIES = [
  { id: 'all', label: 'All' },
  { id: 'sans-serif', label: 'Sans-Serif' },
  { id: 'serif', label: 'Serif' },
  { id: 'display', label: 'Display' },
  { id: 'handwriting', label: 'Handwriting' },
  { id: 'monospace', label: 'Monospace' },
];

export const FontSelectorDropdown: React.FC<FontSelectorDropdownProps> = ({
  value,
  onChange,
  disabled = false,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [fonts, setFonts] = useState<GoogleFont[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);

  // Load fonts on mount and when category changes
  useEffect(() => {
    let isCancelled = false;
    async function load() {
      setIsLoading(true);
      try {
        const fetched = await fetchGoogleFonts({
          category: selectedCategory,
          search,
          limit: 80,
        });
        if (!isCancelled) {
          setFonts(fetched);
        }
      } catch (err) {
        console.error('Error fetching Google fonts:', err);
      } finally {
        if (!isCancelled) setIsLoading(false);
      }
    }
    load();
    return () => {
      isCancelled = true;
    };
  }, [selectedCategory, search]);

  // Preload current font
  useEffect(() => {
    if (value) {
      loadGoogleFont(value);
    }
  }, [value]);

  // Preload top fonts for instant preview in the dropdown
  useEffect(() => {
    if (isOpen && fonts.length > 0) {
      // Preload the visible top 12 fonts
      fonts.slice(0, 15).forEach((f) => loadGoogleFont(f.family));
    }
  }, [isOpen, fonts]);

  // Close on outside click
  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      // Auto-focus search input
      setTimeout(() => searchInputRef.current?.focus(), 50);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const handleSelect = async (fontFamily: string) => {
    await loadGoogleFont(fontFamily);
    onChange(fontFamily);
    setIsOpen(false);
  };

  return (
    <div className="relative w-full" ref={dropdownRef}>
      {/* Selector Trigger Button */}
      <button
        type="button"
        id="google-font-dropdown-trigger"
        disabled={disabled}
        onClick={() => setIsOpen(!isOpen)}
        className={`w-full flex items-center justify-between px-3 py-2 text-xs rounded-xl border transition-all cursor-pointer ${
          isOpen
            ? 'border-[#0058be] ring-1 ring-[#0058be] bg-white shadow-xs'
            : 'border-[#e2e8f0] bg-white hover:border-[#cbd5e1]'
        } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <span
            className="text-sm text-[#1a1c1c] truncate font-medium"
            style={{ fontFamily: value || 'Montserrat' }}
          >
            {value || 'Montserrat'}
          </span>
          <span className="text-[10px] uppercase font-semibold text-[#727785] bg-[#f1f4f9] px-1.5 py-0.5 rounded-md shrink-0">
            Google Font
          </span>
        </div>
        <ChevronDown
          className={`w-3.5 h-3.5 text-[#555f6f] transition-transform shrink-0 ${
            isOpen ? 'rotate-180 text-[#0058be]' : ''
          }`}
        />
      </button>

      {/* Dropdown Menu Panel */}
      {isOpen && (
        <div className="absolute z-50 left-0 top-full mt-1.5 w-full bg-white rounded-xl shadow-xl border border-[#e2e8f0] overflow-hidden flex flex-col max-h-[380px] animate-in fade-in-50 zoom-in-95 duration-100">
          {/* Header & Search */}
          <div className="p-2.5 border-b border-[#f1f4f9] bg-[#fafafa] space-y-2">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#727785]" />
              <input
                ref={searchInputRef}
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search Google Fonts..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white border border-[#e2e8f0] rounded-lg focus:border-[#0058be] focus:ring-1 focus:ring-[#0058be] outline-none"
              />
              {isLoading && (
                <RefreshCw className="w-3 h-3 absolute right-2.5 top-1/2 -translate-y-1/2 text-[#727785] animate-spin" />
              )}
            </div>

            {/* Category Filter Pills */}
            <div className="flex items-center gap-1 overflow-x-auto pb-0.5 scrollbar-none text-[10px]">
              {CATEGORIES.map((cat) => (
                <button
                  key={cat.id}
                  type="button"
                  onClick={() => setSelectedCategory(cat.id)}
                  className={`px-2 py-0.5 rounded-full whitespace-nowrap font-medium transition-colors cursor-pointer ${
                    selectedCategory === cat.id
                      ? 'bg-[#0058be] text-white'
                      : 'bg-white text-[#555f6f] border border-[#e2e8f0] hover:bg-[#f1f5f9]'
                  }`}
                >
                  {cat.label}
                </button>
              ))}
            </div>
          </div>

          {/* Font List */}
          <div className="flex-1 overflow-y-auto p-1 divide-y divide-[#f8fafc]">
            {fonts.length === 0 && !isLoading ? (
              <div className="py-6 text-center text-xs text-[#727785]">
                No fonts found matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              fonts.map((f) => {
                const isSelected = f.family === value;
                return (
                  <button
                    key={f.family}
                    type="button"
                    onClick={() => handleSelect(f.family)}
                    onMouseEnter={() => loadGoogleFont(f.family)}
                    className={`w-full flex items-center justify-between px-3 py-2 rounded-lg text-left transition-colors cursor-pointer ${
                      isSelected
                        ? 'bg-blue-50/70 text-[#0058be]'
                        : 'hover:bg-[#f8fafc] text-[#1a1c1c]'
                    }`}
                  >
                    <div className="flex flex-col min-w-0 pr-2">
                      <span
                        className="text-base leading-tight truncate"
                        style={{ fontFamily: f.family }}
                      >
                        {f.family}
                      </span>
                      <span className="text-[10px] text-[#727785] capitalize">
                        {f.category}
                      </span>
                    </div>

                    {isSelected && (
                      <Check className="w-4 h-4 text-[#0058be] shrink-0" />
                    )}
                  </button>
                );
              })
            )}
          </div>

          {/* Footer note */}
          <div className="px-3 py-1.5 bg-[#f8fafc] border-t border-[#f1f4f9] flex items-center justify-between text-[10px] text-[#727785]">
            <span className="flex items-center gap-1">
              <Sparkles className="w-3 h-3 text-[#0058be]" />
              Integrated with Google Fonts API
            </span>
            <span>{fonts.length} styles</span>
          </div>
        </div>
      )}
    </div>
  );
};
