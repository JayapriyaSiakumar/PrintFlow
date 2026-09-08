import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Size, CategoryItem } from '../types';
import { AVAILABLE_COLORS } from '../data/initialData';
import { Check, RotateCcw, ChevronRight, Layers } from 'lucide-react';

const DEFAULT_CATEGORIES: { name: string; slug: string }[] = [
  { name: 'Apparel', slug: 'apparel' },
  { name: 'Home Decor', slug: 'home-decor' },
  { name: 'Accessories', slug: 'accessories' },
  { name: 'Stationery', slug: 'stationery' },
];
const SIZES: Size[] = ['XS', 'S', 'M', 'L', 'XL', '2XL'];

export const SidebarFilters: React.FC = () => {
  const {
    filters,
    categories,
    subcategories,
    setCategory,
    setSubcategory,
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
    (filters.category && filters.category !== 'All') ||
    filters.subcategory ||
    filters.sizes.length > 0 ||
    filters.colors.length > 0 ||
    filters.minPrice !== '' ||
    filters.maxPrice !== '' ||
    filters.searchQuery !== '';

  const activeCategories = categories && categories.length > 0
    ? categories.filter(c => c.status !== false)
    : DEFAULT_CATEGORIES.map(c => ({ id: c.slug, name: c.name, slug: c.slug, status: true } as CategoryItem));

  return (
    <aside className="w-full lg:w-64 flex-shrink-0 flex flex-col gap-8 select-none">
      
      {/* Categories */}
      <div className="flex flex-col gap-4">
        <div className="flex items-center justify-between">
          <span className="font-['Inter'] text-sm font-bold text-[#1a1c1c] uppercase tracking-widest flex items-center gap-1.5">
            <Layers className="w-4 h-4 text-[#0058be]" />
            Categories
          </span>
          {hasActiveFilters && (
            <button
              onClick={handleReset}
              className="text-xs text-[#0058be] hover:underline flex items-center gap-1 font-medium cursor-pointer"
            >
              <RotateCcw className="w-3 h-3" /> Reset
            </button>
          )}
        </div>

        <div className="flex flex-col gap-1.5">
          {/* All Categories option */}
          <label
            onClick={() => {
              setCategory('All');
              setSubcategory(undefined);
            }}
            className="flex items-center gap-3 py-1 px-1.5 rounded-lg hover:bg-[#e8e8e8]/60 cursor-pointer group transition-colors"
          >
            <div
              className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                filters.category === 'All' || !filters.category ? 'bg-[#0058be] text-white' : 'bg-[#e2e2e2] text-transparent group-hover:bg-[#dadada]'
              }`}
            >
              <Check className={`w-3 h-3 stroke-[3] transition-opacity ${filters.category === 'All' || !filters.category ? 'opacity-100' : 'opacity-0'}`} />
            </div>
            <span
              className={`font-['Inter'] text-sm transition-colors ${
                filters.category === 'All' || !filters.category ? 'font-semibold text-[#0058be]' : 'text-[#424754] group-hover:text-[#0058be]'
              }`}
            >
              All Products
            </span>
          </label>

          {activeCategories.map((cat) => {
            const isSelected =
              filters.category?.toLowerCase() === cat.name.toLowerCase() ||
              filters.category?.toLowerCase() === cat.slug.toLowerCase() ||
              filters.category === cat.id;

            // Find child subcategories for this category
            const childSubcategories = (subcategories || []).filter((sub) => {
              if (sub.status === false) return false;
              const subCatId = typeof sub.category === 'object' ? sub.category.id || sub.category._id : sub.category;
              const catId = cat.id || cat._id;
              const catName = cat.name.toLowerCase();
              const catSlug = cat.slug.toLowerCase();
              return subCatId === catId || subCatId === catName || subCatId === catSlug;
            });

            return (
              <div key={cat.id || cat.slug} className="flex flex-col">
                <div
                  onClick={() => {
                    if (isSelected) {
                      // Clicking selected category toggles to All
                      setCategory('All');
                      setSubcategory(undefined);
                    } else {
                      setCategory(cat.name);
                    }
                  }}
                  className={`flex items-center justify-between py-1.5 px-2 rounded-lg cursor-pointer group transition-colors ${
                    isSelected ? 'bg-[#d8e2ff]/40 text-[#0058be]' : 'hover:bg-[#e8e8e8]/60 text-[#424754]'
                  }`}
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className={`w-4 h-4 rounded flex items-center justify-center transition-all ${
                        isSelected ? 'bg-[#0058be] text-white' : 'bg-[#e2e2e2] text-transparent group-hover:bg-[#dadada]'
                      }`}
                    >
                      <Check className={`w-3 h-3 stroke-[3] transition-opacity ${isSelected ? 'opacity-100' : 'opacity-0'}`} />
                    </div>
                    <span
                      className={`font-['Inter'] text-sm ${
                        isSelected ? 'font-semibold text-[#0058be]' : 'group-hover:text-[#0058be]'
                      }`}
                    >
                      {cat.name}
                    </span>
                  </div>

                  {childSubcategories.length > 0 && (
                    <span className="text-[11px] font-medium text-[#727785] bg-white/70 px-1.5 py-0.5 rounded-md border border-[#e2e2e2]">
                      {childSubcategories.length}
                    </span>
                  )}
                </div>

                {/* Subcategories (visible when category is selected) */}
                {isSelected && childSubcategories.length > 0 && (
                  <div className="ml-5 pl-2.5 my-1.5 border-l-2 border-[#0058be]/25 flex flex-col gap-1">
                    {/* All in Category */}
                    <button
                      type="button"
                      onClick={() => setSubcategory(undefined)}
                      className={`text-left text-xs py-1 px-2 rounded flex items-center justify-between transition-colors ${
                        !filters.subcategory || filters.subcategory === 'All'
                          ? 'font-bold text-[#0058be] bg-[#0058be]/10'
                          : 'text-[#585e6e] hover:text-[#0058be] hover:bg-[#f0f0f2]'
                      }`}
                    >
                      <span>All {cat.name}</span>
                      {(!filters.subcategory || filters.subcategory === 'All') && (
                        <Check className="w-3 h-3 text-[#0058be]" />
                      )}
                    </button>

                    {childSubcategories.map((sub) => {
                      const isSubSelected =
                        filters.subcategory?.toLowerCase() === sub.name.toLowerCase() ||
                        filters.subcategory?.toLowerCase() === sub.slug.toLowerCase() ||
                        filters.subcategory === sub.id;

                      return (
                        <button
                          key={sub.id || sub.slug}
                          type="button"
                          onClick={() => setSubcategory(isSubSelected ? undefined : sub.name)}
                          className={`text-left text-xs py-1 px-2 rounded flex items-center justify-between transition-colors ${
                            isSubSelected
                              ? 'font-bold text-[#0058be] bg-[#0058be]/10'
                              : 'text-[#585e6e] hover:text-[#0058be] hover:bg-[#f0f0f2]'
                          }`}
                        >
                          <div className="flex items-center gap-1.5">
                            <ChevronRight className={`w-3 h-3 ${isSubSelected ? 'text-[#0058be]' : 'text-[#a1a5b0]'}`} />
                            <span>{sub.name}</span>
                          </div>
                          {isSubSelected && <Check className="w-3 h-3 text-[#0058be]" />}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
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
