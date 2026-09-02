import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { ProductCard } from './ProductCard';
import { SortOption } from '../types';
import { ChevronDown, ChevronLeft, ChevronRight, Search, SlidersHorizontal, Sparkles } from 'lucide-react';

export const ProductGrid: React.FC = () => {
  const { products, filters, setSortBy, setSearchQuery, loadingProducts } = useApp();
  const [isSortOpen, setIsSortOpen] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 6;

  const sortLabels: Record<SortOption, string> = {
    newest: 'Newest Arrivals',
    'price-asc': 'Price: Low to High',
    'price-desc': 'Price: High to Low',
    popular: 'Most Popular',
  };

  const handleSelectSort = (opt: SortOption) => {
    setSortBy(opt);
    setIsSortOpen(false);
  };

  const totalPages = Math.ceil(products.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const currentProducts = products.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="flex-1 flex flex-col gap-8">
      
      {/* Top Bar: Title & Controls */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="font-['Montserrat'] font-bold text-4xl sm:text-5xl text-[#1a1c1c] tracking-tight">
            {filters.category}
          </h1>
          <p className="font-['Inter'] text-xs text-[#555f6f] mt-1">
            Showing {products.length} creator-ready customizable blanks & canvas items
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto justify-between sm:justify-end">
          
          {/* Search Input */}
          <div className="relative flex-1 sm:w-56">
            <Search className="w-4 h-4 text-[#727785] absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search garments..."
              value={filters.searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2 bg-[#eeeeee] rounded-lg text-xs font-['Inter'] text-[#1a1c1c] focus:outline-none focus:ring-2 focus:ring-[#0058be] placeholder:text-[#727785]"
            />
          </div>

          {/* Sort Dropdown */}
          <div className="flex items-center gap-2 relative">
            <span className="font-['Inter'] text-sm text-[#424754] hidden md:inline">Sort by:</span>
            <div className="relative">
              <button
                type="button"
                onClick={() => setIsSortOpen(!isSortOpen)}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-[#eeeeee] hover:bg-[#e8e8e8] rounded-lg font-['Inter'] font-semibold text-xs text-[#1a1c1c] transition-colors cursor-pointer"
              >
                <span>{sortLabels[filters.sortBy]}</span>
                <ChevronDown className={`w-4 h-4 transition-transform ${isSortOpen ? 'rotate-180' : ''}`} />
              </button>

              {isSortOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-48 bg-white rounded-xl shadow-xl border border-[#e2e2e2] z-30 py-1.5 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
                  {(['newest', 'price-asc', 'price-desc', 'popular'] as SortOption[]).map((opt) => (
                    <button
                      key={opt}
                      onClick={() => handleSelectSort(opt)}
                      className={`w-full text-left px-4 py-2 font-['Inter'] text-xs transition-colors ${
                        filters.sortBy === opt
                          ? 'text-[#0058be] font-bold bg-[#d8e2ff]/50'
                          : 'text-[#1a1c1c] hover:bg-[#f3f3f4]'
                      }`}
                    >
                      {sortLabels[opt]}
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Grid of Products */}
      {loadingProducts ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6 py-12">
          {[1, 2, 3, 4, 5, 6].map((n) => (
            <div key={n} className="animate-pulse flex flex-col gap-3 p-2 bg-[#f9f9f9] rounded-xl">
              <div className="w-full aspect-[4/5] bg-[#e2e2e2] rounded-lg"></div>
              <div className="h-4 bg-[#e2e2e2] rounded w-3/4"></div>
              <div className="h-3 bg-[#e2e2e2] rounded w-1/2"></div>
            </div>
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="p-12 text-center bg-white rounded-2xl border border-dashed border-[#c2c6d6] my-6">
          <SlidersHorizontal className="w-10 h-10 text-[#727785] mx-auto mb-3 opacity-60" />
          <h3 className="font-['Montserrat'] font-semibold text-lg text-[#1a1c1c]">No products match your filters</h3>
          <p className="font-['Inter'] text-sm text-[#555f6f] mt-1 max-w-md mx-auto">
            Try adjusting your category, sizing, or color criteria to view available print blanks.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-6">
          {currentProducts.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      )}

      {/* Pagination matching screenshot: < 1 2 3 ... > */}
      {products.length > itemsPerPage && (
        <div className="flex justify-center mt-6">
          <div className="flex items-center gap-1.5 select-none">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#e8e8e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`w-10 h-10 rounded-lg flex items-center justify-center font-['Inter'] font-semibold text-sm transition-colors ${
                  currentPage === pageNum
                    ? 'bg-[#0058be] text-white shadow-sm'
                    : 'bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#e8e8e8]'
                }`}
              >
                {pageNum}
              </button>
            ))}

            {totalPages > 3 && <span className="text-[#555f6f] px-1 font-bold">...</span>}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="w-10 h-10 rounded-lg flex items-center justify-center bg-[#eeeeee] text-[#1a1c1c] hover:bg-[#e8e8e8] disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        </div>
      )}

    </div>
  );
};
