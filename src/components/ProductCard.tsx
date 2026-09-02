import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { Heart } from 'lucide-react';

interface ProductCardProps {
  product: Product;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product }) => {
  const { isFavorite, toggleFavorite, setQuickViewProduct, setDesigningProduct, setActiveView } = useApp();
  const favorited = isFavorite(product.id);

  const handleCustomize = (e: React.MouseEvent) => {
    e.stopPropagation();
    setDesigningProduct(product);
    setActiveView('design-tool');
  };

  const handleView = (e: React.MouseEvent) => {
    e.stopPropagation();
    setQuickViewProduct(product);
  };

  return (
    <div className="group flex flex-col gap-3 bg-[#f9f9f9] rounded-xl transition-all duration-300 hover:-translate-y-1 hover:shadow-xl p-2 border border-transparent hover:border-[#e2e2e2]">
      
      {/* Image Container */}
      <div 
        onClick={handleView}
        className="relative w-full aspect-[4/5] bg-[#eeeeee] rounded-lg overflow-hidden cursor-pointer"
      >
        <img
          src={product.image}
          alt={product.name}
          className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform duration-500"
          loading="lazy"
        />

        {/* Tag Badge */}
        {product.tag && (
          <div
            className={`absolute top-3 left-3 rounded px-2 py-1 shadow-sm ${
              product.tag === 'Bestseller'
                ? 'bg-[#6b38d4] text-white'
                : product.tag === 'New'
                ? 'bg-[#0058be] text-white'
                : product.tag === 'Eco'
                ? 'bg-emerald-600 text-white'
                : 'bg-[#2170e4] text-white'
            }`}
          >
            <span className="font-['Inter'] font-bold text-[10px] uppercase tracking-wider">
              {product.tag}
            </span>
          </div>
        )}

        {/* Favorite Heart Button */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite(product.id);
          }}
          className="absolute top-3 right-3 bg-white/90 backdrop-blur-md rounded-md p-1.5 shadow-sm hover:scale-110 active:scale-90 transition-transform cursor-pointer"
          title={favorited ? 'Remove from favorites' : 'Add to favorites'}
        >
          <Heart
            className={`w-4 h-4 transition-colors ${
              favorited ? 'fill-[#0058be] text-[#0058be]' : 'text-[#1a1c1c] hover:text-[#0058be]'
            }`}
          />
        </button>
      </div>

      {/* Info Block */}
      <div className="flex flex-col gap-1 px-1 pb-1">
        <div className="flex justify-between items-start gap-2">
          <h3 
            onClick={handleView}
            className="font-['Inter'] font-semibold text-sm text-[#1a1c1c] line-clamp-1 cursor-pointer hover:text-[#0058be] transition-colors"
          >
            {product.name}
          </h3>
          <span className="font-['Inter'] font-bold text-sm text-[#1a1c1c] whitespace-nowrap">
            ${product.price.toFixed(2)}
          </span>
        </div>

        <p className="font-['Inter'] text-xs text-[#555f6f]">
          {product.spec}
        </p>

        {/* Action Buttons */}
        <div className="flex gap-2 mt-2">
          <button
            type="button"
            onClick={handleView}
            className="flex-1 py-2 rounded-lg bg-[#eeeeee] hover:bg-[#e8e8e8] transition-colors font-['Inter'] font-semibold text-xs text-[#1a1c1c] text-center cursor-pointer active:scale-98"
          >
            View
          </button>
          <button
            type="button"
            onClick={handleCustomize}
            className="flex-1 py-2 rounded-lg bg-[#0058be] hover:bg-[#2170e4] transition-colors font-['Inter'] font-semibold text-xs text-white text-center cursor-pointer active:scale-98 shadow-sm shadow-[#0058be]/20"
          >
            Customize
          </button>
        </div>
      </div>

    </div>
  );
};
