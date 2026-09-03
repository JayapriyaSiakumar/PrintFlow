import React from 'react';
import { useApp } from '../context/AppContext';
import { X, Heart, ShoppingBag, Palette, Trash2, ArrowRight, Sparkles } from 'lucide-react';

export const WishlistDrawer: React.FC = () => {
  const {
    isWishlistOpen,
    setIsWishlistOpen,
    favorites,
    toggleFavorite,
    products,
    addToCart,
    setQuickViewProduct,
    setDesigningProduct,
    setActiveView,
  } = useApp();

  if (!isWishlistOpen) return null;

  const favoriteProducts = products.filter((p) => favorites.includes(p.id));

  const handleAddToCart = (product: typeof products[0]) => {
    addToCart({
      productId: product.id,
      product: product,
      size: product.sizes[0] || 'M',
      color: product.colors[0],
      quantity: 1,
      unitPrice: product.price,
    });
  };

  const handleCustomize = (product: typeof products[0]) => {
    setIsWishlistOpen(false);
    setDesigningProduct(product);
    setActiveView('design-tool');
  };

  const handleAddAllToCart = () => {
    favoriteProducts.forEach((product) => {
      addToCart({
        productId: product.id,
        product: product,
        size: product.sizes[0] || 'M',
        color: product.colors[0],
        quantity: 1,
        unitPrice: product.price,
      });
    });
    setIsWishlistOpen(false);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden select-none">
      {/* Backdrop */}
      <div
        onClick={() => setIsWishlistOpen(false)}
        className="absolute inset-0 bg-black/40 backdrop-blur-sm transition-opacity animate-in fade-in duration-200"
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white shadow-2xl flex flex-col animate-in slide-in-from-right duration-250">
          
          {/* Header */}
          <div className="p-5 border-b border-[#e2e2e2] flex items-center justify-between bg-[#f9f9f9]">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600">
                <Heart className="w-4 h-4 fill-rose-500 text-rose-500" />
              </div>
              <div>
                <h2 className="font-semibold text-base text-[#1a1c1c] flex items-center gap-2">
                  My Wishlist
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full bg-rose-100 text-rose-700">
                    {favorites.length}
                  </span>
                </h2>
                <p className="text-[11px] text-[#555f6f]">Your saved merchandise and favorites</p>
              </div>
            </div>

            <button
              onClick={() => setIsWishlistOpen(false)}
              className="p-2 rounded-lg text-[#555f6f] hover:text-[#1a1c1c] hover:bg-[#eeeeee] transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* List or Empty State */}
          <div className="flex-1 overflow-y-auto p-5 divide-y divide-[#f0f0f2]">
            {favoriteProducts.length === 0 ? (
              <div className="h-full flex flex-col items-center justify-center text-center py-12 px-4">
                <div className="w-16 h-16 rounded-full bg-rose-50 flex items-center justify-center text-rose-400 mb-4 shadow-inner">
                  <Heart className="w-8 h-8 text-rose-400" />
                </div>
                <h3 className="font-semibold text-base text-[#1a1c1c] mb-1">Your wishlist is empty</h3>
                <p className="text-xs text-[#555f6f] max-w-xs mb-6">
                  Save items you love by tapping the heart icon on any product in our catalog to keep track of them here.
                </p>
                <button
                  onClick={() => {
                    setIsWishlistOpen(false);
                    setActiveView('products');
                  }}
                  className="px-5 py-2.5 bg-[#0058be] text-white text-xs font-semibold rounded-lg hover:bg-[#2170e4] active:scale-95 transition-all shadow-sm shadow-[#0058be]/20 cursor-pointer flex items-center gap-2"
                >
                  <Sparkles className="w-4 h-4" />
                  Explore Catalog
                </button>
              </div>
            ) : (
              favoriteProducts.map((product) => (
                <div key={product.id} className="py-4 first:pt-0 last:pb-0 flex gap-4 group">
                  {/* Thumbnail */}
                  <div
                    onClick={() => {
                      setIsWishlistOpen(false);
                      setQuickViewProduct(product);
                    }}
                    className="relative w-20 h-24 rounded-lg bg-[#eeeeee] flex-shrink-0 overflow-hidden cursor-pointer"
                  >
                    <img
                      src={product.image}
                      alt={product.name}
                      className="w-full h-full object-cover mix-blend-multiply group-hover:scale-105 transition-transform"
                    />
                    {product.tag && (
                      <span className="absolute top-1 left-1 text-[8px] font-bold uppercase tracking-wider bg-[#0058be] text-white px-1.5 py-0.5 rounded">
                        {product.tag}
                      </span>
                    )}
                  </div>

                  {/* Details */}
                  <div className="flex-1 flex flex-col justify-between">
                    <div>
                      <div className="flex items-start justify-between gap-1">
                        <h4
                          onClick={() => {
                            setIsWishlistOpen(false);
                            setQuickViewProduct(product);
                          }}
                          className="font-medium text-xs text-[#1a1c1c] hover:text-[#0058be] cursor-pointer line-clamp-1 transition-colors"
                        >
                          {product.name}
                        </h4>
                        <button
                          onClick={() => toggleFavorite(product.id)}
                          className="text-[#727785] hover:text-rose-600 p-1 rounded transition-colors"
                          title="Remove from wishlist"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>

                      <p className="text-[11px] text-[#555f6f] mt-0.5">{product.category} • {product.spec}</p>

                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="font-bold text-sm text-[#1a1c1c]">${product.price.toFixed(2)}</span>
                        {product.stock > 0 ? (
                          <span className="text-[10px] text-emerald-600 font-medium bg-emerald-50 px-1.5 py-0.5 rounded">
                            In Stock
                          </span>
                        ) : (
                          <span className="text-[10px] text-amber-600 font-medium bg-amber-50 px-1.5 py-0.5 rounded">
                            Made to Order
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Quick Actions */}
                    <div className="flex items-center gap-2 mt-3">
                      <button
                        onClick={() => handleAddToCart(product)}
                        className="flex-1 py-1.5 px-2.5 bg-[#0058be] hover:bg-[#2170e4] text-white text-[11px] font-semibold rounded-md transition-all active:scale-95 flex items-center justify-center gap-1 shadow-sm shadow-[#0058be]/20 cursor-pointer"
                      >
                        <ShoppingBag className="w-3.5 h-3.5" />
                        Add to Cart
                      </button>
                      <button
                        onClick={() => handleCustomize(product)}
                        className="py-1.5 px-2.5 bg-[#eeeeee] hover:bg-[#e2e2e2] text-[#1a1c1c] text-[11px] font-medium rounded-md transition-colors flex items-center gap-1 cursor-pointer"
                        title="Open in Design Studio"
                      >
                        <Palette className="w-3.5 h-3.5 text-[#6b38d4]" />
                        Customize
                      </button>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>

          {/* Footer Actions */}
          {favoriteProducts.length > 0 && (
            <div className="p-4 border-t border-[#e2e2e2] bg-[#f9f9f9] space-y-2">
              <button
                onClick={handleAddAllToCart}
                className="w-full py-2.5 bg-[#0058be] hover:bg-[#2170e4] text-white text-xs font-semibold rounded-lg transition-all active:scale-95 flex items-center justify-center gap-2 shadow-sm shadow-[#0058be]/20 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                Add All to Cart ({favoriteProducts.length} items)
              </button>

              <div className="flex justify-between items-center pt-1 text-xs">
                <button
                  onClick={() => {
                    favoriteProducts.forEach((p) => toggleFavorite(p.id));
                  }}
                  className="text-[11px] text-[#727785] hover:text-[#ba1a1a] transition-colors"
                >
                  Clear Wishlist
                </button>
                <button
                  onClick={() => {
                    setIsWishlistOpen(false);
                    setActiveView('products');
                  }}
                  className="text-[11px] text-[#0058be] font-medium hover:underline flex items-center gap-1"
                >
                  Continue Shopping <ArrowRight className="w-3 h-3" />
                </button>
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
};
