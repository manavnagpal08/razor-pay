"use client";

import Link from "next/link";
import { useState } from "react";
import { ShoppingCart, Check, Loader2, Star, Sparkles } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export function ProductCard({ product }: { product: any }) {
  const { token, refreshCartCount } = useAuth();
  const [adding, setAdding] = useState(false);
  const [added, setAdded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const imageUrl = product.metadata_?.image_url || product.metadata?.image_url || product.image_url;

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!token) {
      alert("Please sign in to add items to your cart.");
      window.location.href = "/login";
      return;
    }

    setAdding(true);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/cart/items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });
      if (res.ok) {
        setAdded(true);
        await refreshCartCount();
        setTimeout(() => setAdded(false), 2000);
      } else {
        alert("Could not add to cart. Please check inventory.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAdding(false);
    }
  };

  return (
    <div className="bg-white border border-slate-200/90 rounded-3xl overflow-hidden hover:shadow-xl hover:border-blue-400 hover:-translate-y-1 transition-all duration-300 group flex flex-col h-full">
      {/* Product Image Showcase */}
      <Link href={`/products/${product.id}`} className="aspect-square bg-slate-50 relative overflow-hidden flex items-center justify-center p-4 border-b border-slate-100">
        {imageUrl && !imgError ? (
          <img 
            src={imageUrl} 
            alt={product.name} 
            onError={() => setImgError(true)}
            className="w-full h-full object-cover rounded-2xl group-hover:scale-105 transition-transform duration-500" 
          />
        ) : (
          <div className="w-full h-full bg-slate-100 rounded-2xl flex flex-col items-center justify-center text-slate-400 p-4 text-center">
            <span className="text-4xl mb-2">
              {product.category === 'laptops' ? '💻' : product.category === 'audio' ? '🎧' : '⚡'}
            </span>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-slate-400">{product.category}</span>
          </div>
        )}

        {/* Category & Stock Badges */}
        <div className="absolute top-3.5 left-3.5 flex flex-col gap-1.5 z-10">
          <span className="text-[10px] font-black uppercase tracking-wider bg-white/95 backdrop-blur-md text-blue-700 px-2.5 py-1 rounded-lg border border-slate-200/80 shadow-xs">
            {product.category}
          </span>
          {product.inventory === 0 && (
            <span className="bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-md shadow-xs">
              Out of Stock
            </span>
          )}
        </div>

        {/* Quick View Pill */}
        <div className="absolute bottom-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity bg-slate-900/80 backdrop-blur-xs text-white text-[10px] font-bold px-2.5 py-1 rounded-lg shadow-sm">
          Quick View →
        </div>
      </Link>
      
      {/* Product Details */}
      <div className="p-5 flex flex-col flex-grow justify-between">
        <div>
          {/* Rating */}
          <div className="flex items-center gap-1 text-amber-500 text-xs font-bold mb-1.5">
            <Star className="w-3.5 h-3.5 fill-amber-400 text-amber-400" />
            <span className="text-slate-800">4.9</span>
            <span className="text-slate-400 font-normal text-[11px]">(48 reviews)</span>
          </div>

          <Link href={`/products/${product.id}`} className="block group-hover:text-blue-600 transition-colors">
            <h3 className="font-bold text-slate-900 text-base leading-snug mb-1 line-clamp-1">
              {product.name}
            </h3>
          </Link>

          <p className="text-slate-500 text-xs mb-4 line-clamp-2 leading-relaxed">
            {product.description}
          </p>
        </div>
        
        <div className="flex items-center justify-between pt-3 border-t border-slate-100 mt-2">
          <div>
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider block">Price</span>
            <div className="font-black text-lg text-slate-900 leading-tight">
              ₹{Number(product.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}
            </div>
          </div>
          
          <button 
            onClick={handleAddToCart}
            disabled={product.inventory === 0 || adding}
            className={`h-9 px-3.5 rounded-xl font-bold text-xs flex items-center gap-1.5 transition-all shadow-xs ${
              added 
                ? 'bg-emerald-600 text-white' 
                : 'bg-slate-900 hover:bg-blue-600 text-white disabled:opacity-40 disabled:cursor-not-allowed'
            }`}
            title="Add to Cart"
          >
            {adding ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : added ? (
              <>
                <Check className="w-3.5 h-3.5" />
                <span>Added</span>
              </>
            ) : (
              <>
                <ShoppingCart className="w-3.5 h-3.5" />
                <span>Add</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}