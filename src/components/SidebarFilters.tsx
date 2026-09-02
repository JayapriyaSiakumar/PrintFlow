import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category, Size } from '../types';
import { AVAILABLE_COLORS } from '../data/initialData';
import { Check, RotateCcw } from 'lucide-react';

const CATEGORIES: Category[] = ['Apparel', 'Home Decor', 'Accessories', 'Stationery'];
const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

export const SidebarFilters: React.FC = () => {
  const {
    filters,
    setCategory,
    toggleSizeFilter,
    toggleColorFilter,
    setPriceRange,
    resetFilters,
  } = useApp();

  const [minInput, setMinInput] = useState(filters.minPrice || '');
  const [maxInput, setMaxInput] = useState(filters.maxPrice || '');

  const handleApplyPrice = (e: React.FormEvent) => {
    e.preventDefault();
    setPriceRange(minInput, maxInput);
  };

  const handleReset = () => {
    setMinInput('');
    setMaxInput('');
    resetFilters();
  };

  const hasActiveFilters =
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.searchQuery !== '';

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 select-none">
      
      {/* Categories */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-['Inter'] text-sm font-bold text-[#1a1c1c] uppercase tracking-widest">
            Categories
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-[#0058be] hover:underline flex items-center gap-1 font-medium"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex flex-col gap-2.5">
          {CATEGORIES.map((cat) => {
            const isSelected = filters.category === cat;
            return (
              <label
                key={cat}
                onClick={() => setCategory(cat)}
                className="flex items-center gap-3.5 cursor-pointer group"
              >
                <div
                  className={`w-5 h-5 rounded flex items-center justify-center transition-all ${
                    isSelected ? 'bg-[#0058be] text-white' : 'bg-[#e2e2e2] text-transparent group-hover:bg-[#dadada]'
                  }`}
                >
                  <Check className={`w-3.5 h-3.5 stroke-[3] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                </div>
                <span
                  className={`font-['Inter'] text-sm transition-colors ${
                    isSelected ? 'font-semibold text-[#0058be]' : 'text-[#424754] group-hover:text-[#0058be]'
                  }`}
                >
                  {cat}
                </span>
              </label>
            );
          })}
        </div>
      </div>

      {/* Sizing */}
      <div className="flex flex-col gap-3.5">
        <span className="font-['Inter'] text-sm font-bold text-[#1a1c1c] uppercase tracking-widest">
          Sizing
        </span>
        <div className="flex flex-wrap gap-2">
          {SIZES.map((size) => {
            const isSelected = filters.sizes.includes(size);
            return (
              <button
                key={size}
                type="button"
                onClick={() => toggleSizeFilter(size)}
                className={`w-10 h-10 rounded font-['Inter'] text-sm font-medium transition-all ${
                  isSelected
                    ? 'bg-[#0058be] text-white shadow-sm ring-2 ring-[#0058be]/30'
                    : 'bg-[#e2e2e2] text-[#1a1c1c] hover:bg-[#dadada] active:scale-95'
                }`}
              >
                {size}
              </button>
            );
          })}
        </div>
      </div>

      {/* Colors */}
      <div className="flex flex-col gap-3.5">
        <span className="font-['Inter'] text-sm font-bold text-[#1a1c1c] uppercase tracking-widest">
          Colors
        </span>
        <div className="flex flex-wrap gap-3 items-center">
          {AVAILABLE_COLORS.map((col) => {
            const isSelected = filters.colors.includes(col.hex.toLowerCase());
            return (
              <button
                key={col.hex}
                type="button"
                title={col.name}
                onClick={() => toggleColorFilter(col.hex)}
                style={{ backgroundColor: col.hex }}
                className={`w-8 h-8 rounded-full border border-black/10 transition-all hover:scale-110 active:scale-95 ${
                  isSelected
                    ? 'ring-2 ring-[#0058be] ring-offset-2 ring-offset-[#f9f9f9] scale-105'
                    : 'shadow-sm'
                }`}
              />
            );
          })}
        </div>
      </div>

      {/* Price Range */}
      <form onSubmit={handleApplyPrice} className="flex flex-col gap-3.5">
        <span className="font-['Inter'] text-sm font-bold text-[#1a1c1c] uppercase tracking-widest">
          Price Range
        </span>
        <div className="flex items-center gap-2.5">
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#727785]">$</span>
            <input
              type="number"
              min="0"
              placeholder="Min"
              value={minInput}
              onChange={(e) => setMinInput(e.target.value)}
              className="w-full pl-6 pr-2.5 py-1.5 bg-[#e2e2e2] rounded font-['Inter'] text-sm text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be] placeholder:text-[#727785]"
            />
          </div>
          <span className="text-[#424754] font-medium">-</span>
          <div className="relative flex-1">
            <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs text-[#727785]">$</span>
            <input
              type="number"
              min="0"
              placeholder="Max"
              value={maxInput}
              onChange={(e) => setMaxInput(e.target.value)}
              className="w-full pl-6 pr-2.5 py-1.5 bg-[#e2e2e2] rounded font-['Inter'] text-sm text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be] placeholder:text-[#727785]"
            />
          </div>
        </div>
        <button
          type="submit"
          className="w-full py-2 rounded bg-[#e2e2e2] hover:bg-[#0058be] hover:text-white transition-colors font-semibold text-sm text-[#1a1c1c] mt-1 cursor-pointer active:scale-98"
        >
          Apply
        </button>
      </form>

    </aside>
  );
};
