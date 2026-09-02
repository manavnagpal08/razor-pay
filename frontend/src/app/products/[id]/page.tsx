"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { ArrowLeft, ShoppingCart, CheckCircle, ShieldCheck, Loader2, Check, Sparkles, Star, Zap, Truck } from "lucide-react";
import { useParams, useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";

export default function ProductDetailPage() {
  const params = useParams();
  const router = useRouter();
  const { user, token, refreshCartCount } = useAuth();
  const [product, setProduct] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [addingToCart, setAddingToCart] = useState(false);
  const [added, setAdded] = useState(false);
  const [quantity, setQuantity] = useState(1);
  const [imgError, setImgError] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/products/${params.id}`, { cache: "no-store" });
        if (res.ok) {
          setProduct(await res.json());
        }
      } catch (err) {
        console.error("Failed to fetch product", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [params.id]);

  const handleAddToCart = async () => {
    if (!token) {
      alert("Please sign in to add items to your cart.");
      router.push("/login");
      return;
    }

    setAddingToCart(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cart/items`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ product_id: product.id, quantity })
      });
      if (res.ok) {
        setAdded(true);
        await refreshCartCount();
        setTimeout(() => setAdded(false), 2500);
      } else {
        alert("Failed to add to cart. Please verify stock availability.");
      }
    } catch (err) {
      console.error(err);
    } finally {
      setAddingToCart(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center p-4">
        <h1 className="text-2xl font-bold text-slate-800 mb-2">Product Not Found</h1>
        <p className="text-slate-500 text-sm mb-6">The requested product could not be found in the current store catalog.</p>
        <Link href="/shop" className="px-6 py-2.5 bg-blue-600 text-white rounded-xl font-bold text-xs hover:bg-blue-700 transition-colors shadow-xs">
          Return to Catalog
        </Link>
      </div>
    );
  }

  const imageUrl = product.metadata_?.image_url || product.metadata?.image_url || product.image_url;

  return (
    <div className="max-w-6xl mx-auto pb-12">
      <Link href="/shop" className="inline-flex items-center text-xs font-bold text-slate-500 hover:text-slate-900 mb-6 transition-colors gap-1.5 uppercase tracking-wider">
        <ArrowLeft className="w-3.5 h-3.5" /> Back to catalog
      </Link>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
        {/* High-Res Product Visual */}
        <div className="bg-slate-50 border border-slate-200/80 shadow-sm rounded-3xl p-6 aspect-square flex items-center justify-center relative overflow-hidden">
          {imageUrl && !imgError ? (
            <img 
              src={imageUrl} 
              alt={product.name} 
              onError={() => setImgError(true)}
              className="w-full h-full object-cover rounded-2xl shadow-inner" 
            />
          ) : (
            <div className="w-full h-full bg-white rounded-2xl flex flex-col items-center justify-center border border-slate-200 text-slate-400 text-center p-6">
              <span className="text-6xl mb-3">
                {product.category === 'laptops' ? '💻' : product.category === 'audio' ? '🎧' : '⚡'}
              </span>
              <span className="text-xs font-bold text-blue-600 uppercase tracking-widest">{product.category}</span>
            </div>
          )}

          {product.inventory === 0 && (
            <div className="absolute top-6 left-6 bg-red-600 text-white font-bold text-xs px-3.5 py-1 rounded-full shadow-md">
              Out of Stock
            </div>
          )}
        </div>
        
        {/* Product Details & Purchase Card */}
        <div className="flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-3">
              <span className="text-xs font-black text-blue-600 uppercase tracking-widest bg-blue-50 px-2.5 py-1 rounded-lg border border-blue-100">
                {product.category}
              </span>
              <div className="flex items-center gap-1 text-amber-500 text-xs font-bold">
                <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                <span className="text-slate-800">4.9</span>
                <span className="text-slate-400 font-normal">(120+ verified reviews)</span>
              </div>
            </div>

            <h1 className="text-3xl sm:text-4xl font-black text-slate-900 mb-3 tracking-tight">{product.name}</h1>
            
            <div className="text-3xl sm:text-4xl font-black text-slate-900 mb-6 pb-6 border-b border-slate-100 flex items-baseline gap-3">
              <span>₹{Number(product.price).toLocaleString("en-IN", { maximumFractionDigits: 2 })}</span>
              <span className="text-xs text-slate-400 font-bold uppercase tracking-wider">Inclusive of all taxes</span>
            </div>
            
            <p className="text-sm text-slate-600 mb-8 leading-relaxed">
              {product.description}
            </p>
          </div>
          
          {/* Purchase Action Box */}
          <div className="bg-white shadow-sm border border-slate-200 rounded-3xl p-6 mb-8 space-y-5">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-1.5 font-bold text-emerald-700 bg-emerald-50 border border-emerald-100 px-3 py-1 rounded-full">
                <CheckCircle className="w-3.5 h-3.5" /> {product.inventory > 0 ? `In Stock (${product.inventory} units available)` : 'Out of Stock'}
              </div>
              <div className="flex items-center gap-1.5 font-medium text-slate-500">
                <Truck className="w-3.5 h-3.5 text-blue-600" /> Express 2-Day Delivery
              </div>
            </div>
            
            <div className="flex items-center gap-4">
              {/* Quantity Selector */}
              <div className="flex items-center border border-slate-200 rounded-2xl bg-slate-50 p-1">
                <button 
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  -
                </button>
                <span className="w-10 text-center text-sm font-bold text-slate-900">{quantity}</span>
                <button 
                  onClick={() => setQuantity(Math.min(product.inventory || 10, quantity + 1))}
                  className="w-9 h-9 flex items-center justify-center font-bold text-slate-600 hover:bg-slate-200 rounded-xl transition-colors"
                >
                  +
                </button>
              </div>

              {/* Add to Cart Button */}
              <button 
                onClick={handleAddToCart}
                disabled={product.inventory === 0 || addingToCart}
                className={`flex-1 h-12 rounded-2xl font-bold text-sm flex items-center justify-center gap-2 transition-all shadow-md ${
                  added 
                    ? 'bg-emerald-600 text-white shadow-emerald-500/20' 
                    : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed'
                }`}
              >
                {addingToCart ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : added ? (
                  <>
                    <Check className="w-5 h-5" />
                    <span>Added {quantity} to Cart!</span>
                  </>
                ) : (
                  <>
                    <ShoppingCart className="w-5 h-5" />
                    <span>Add to Cart • ₹{(Number(product.price) * quantity).toLocaleString()}</span>
                  </>
                )}
              </button>
            </div>

            <div className="flex items-center justify-center gap-2 text-[11px] text-slate-500 pt-2 border-t border-slate-100">
              <ShieldCheck className="w-4 h-4 text-emerald-600" />
              <span>Razorpay 256-Bit SSL Encrypted Checkout • 100% Price Integrity</span>
            </div>
          </div>
          
          {/* Specifications */}
          <div className="space-y-3">
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wider">Engineered Specifications</h3>
            
            {product.features && Object.keys(product.features).length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {Object.entries(product.features).map(([key, value]) => (
                  <div key={key} className="bg-slate-50 border border-slate-100 rounded-2xl p-3 flex flex-col">
                    <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider mb-0.5">{key.replace('_', ' ')}</span>
                    <span className="font-extrabold text-slate-800 text-xs">{String(value)}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-400 text-xs italic">Standard specifications apply.</p>
            )}
          </div>
          
          {/* Use Cases */}
          {product.use_cases && product.use_cases.length > 0 && (
            <div className="mt-6 pt-6 border-t border-slate-100">
              <h3 className="text-xs font-bold text-slate-900 mb-3 uppercase tracking-wider">Recommended For</h3>
              <div className="flex flex-wrap gap-2">
                {product.use_cases.map((uc: string, idx: number) => (
                  <span key={idx} className="bg-blue-50 text-blue-700 px-3 py-1 rounded-xl text-xs font-bold uppercase tracking-wide border border-blue-100">
                    {uc}
                  </span>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}