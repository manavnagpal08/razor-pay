"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { ShoppingCart, Trash2, ShieldCheck, ArrowRight, Loader2, LogIn } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";

export default function CartPage() {
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const { user, token, refreshCartCount } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cart/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
      }
    } catch (e) {
      console.error("Failed to load cart", e);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (itemId: string, qty: number) => {
    if (!cart || !token) return;
    setUpdatingId(itemId);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cart/${cart.id}/items/${itemId}`, {
        method: "PATCH",
        headers: { 
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json" 
        },
        body: JSON.stringify({ quantity: qty })
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
        await refreshCartCount();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  const removeItem = async (itemId: string) => {
    if (!cart || !token) return;
    setUpdatingId(itemId);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cart/${cart.id}/items/${itemId}`, {
        method: "DELETE",
        headers: {
          "Authorization": `Bearer ${token}`
        }
      });
      if (res.ok) {
        const data = await res.json();
        setCart(data);
        await refreshCartCount();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setUpdatingId(null);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <div className="w-14 h-14 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4">
          <ShoppingCart className="w-7 h-7" />
        </div>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Sign In Required</h2>
        <p className="text-slate-500 text-sm mb-6">Please sign in to access your persistent shopping cart and server-validated pricing.</p>
        <Link 
          href="/login" 
          className="inline-flex items-center justify-center gap-2 w-full py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold transition-all shadow-md shadow-blue-500/20"
        >
          <LogIn className="w-4 h-4" />
          <span>Sign In to Continue</span>
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto p-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <ShoppingCart className="w-7 h-7 text-blue-600" />
            Your Cart
          </h1>
          <p className="text-slate-500 text-sm mt-1">Tenant-scoped cart with real-time server policy verification</p>
        </div>
        <Link href="/shop" className="text-sm font-semibold text-blue-600 hover:underline">
          + Add more items
        </Link>
      </div>
      
      {(!cart || !cart.items || cart.items.length === 0) ? (
        <div className="text-center bg-white p-12 rounded-3xl shadow-xs border border-slate-200/80">
          <div className="w-16 h-16 bg-slate-50 rounded-2xl flex items-center justify-center text-slate-400 mx-auto mb-4">
            <ShoppingCart className="w-8 h-8" />
          </div>
          <h3 className="text-xl font-bold text-slate-800 mb-1">Your cart is empty</h3>
          <p className="text-slate-500 text-sm mb-6 max-w-sm mx-auto">Explore our catalog or ask our AI Buyer to find the perfect gear for you.</p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/shop" className="bg-blue-600 text-white px-6 py-3 rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-sm shadow-blue-500/20">
              Browse Catalog
            </Link>
            <Link href="/chat" className="bg-slate-100 text-slate-700 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors">
              Talk to AI Buyer
            </Link>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-4">
            {cart.validation?.issues?.length > 0 && (
              <div className="bg-amber-50 border border-amber-200 text-amber-900 p-4 rounded-2xl">
                <h4 className="font-bold text-xs uppercase tracking-wider mb-1">Policy Validation Alert</h4>
                <ul className="list-disc pl-5 text-xs space-y-1">
                  {cart.validation.issues.map((issue: string, i: number) => (
                    <li key={i}>{issue}</li>
                  ))}
                </ul>
              </div>
            )}
          
            {cart.items.map((item: any) => (
              <div key={item.id} className="bg-white p-5 rounded-2xl border border-slate-200/80 flex justify-between items-center shadow-xs">
                <div>
                  <h3 className="font-bold text-slate-900 text-base">{item.name}</h3>
                  <p className="text-slate-500 text-xs mt-0.5">₹{Number(item.unit_price).toLocaleString()} each</p>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="flex items-center border border-slate-200 rounded-xl overflow-hidden bg-slate-50">
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity - 1)} 
                      disabled={updatingId === item.id}
                      className="px-3 py-1.5 hover:bg-slate-200 font-bold text-slate-700 disabled:opacity-50 transition-colors"
                    >
                      -
                    </button>
                    <span className="px-3 py-1.5 text-xs font-bold text-slate-900 min-w-[28px] text-center">
                      {updatingId === item.id ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : item.quantity}
                    </span>
                    <button 
                      onClick={() => updateQuantity(item.id, item.quantity + 1)} 
                      disabled={updatingId === item.id}
                      className="px-3 py-1.5 hover:bg-slate-200 font-bold text-slate-700 disabled:opacity-50 transition-colors"
                    >
                      +
                    </button>
                  </div>
                  
                  <div className="w-24 text-right font-extrabold text-slate-900 text-base">
                    ₹{Number(item.subtotal).toLocaleString()}
                  </div>
                  
                  <button 
                    onClick={() => removeItem(item.id)} 
                    disabled={updatingId === item.id}
                    className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                    title="Remove item"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          {/* Order Summary & Checkout Action */}
          <div className="bg-white p-6 rounded-3xl border border-slate-200 shadow-xs h-fit space-y-6">
            <h2 className="text-lg font-bold text-slate-900">Summary</h2>
            
            <div className="space-y-3 text-sm">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal</span>
                <span className="font-semibold text-slate-900">₹{Number(cart.subtotal).toLocaleString()}</span>
              </div>
              {Number(cart.discount) > 0 && (
                <div className="flex justify-between text-emerald-600 font-medium">
                  <span>Merchant Discount</span>
                  <span>-₹{Number(cart.discount).toLocaleString()}</span>
                </div>
              )}
              <div className="flex justify-between text-slate-600">
                <span>Estimated Taxes</span>
                <span className="text-slate-900 font-medium">Included</span>
              </div>
            </div>
            
            <div className="border-t border-slate-100 pt-4">
              <div className="flex justify-between text-xl font-extrabold text-slate-900">
                <span>Total Payable</span>
                <span className="text-blue-600">₹{Number(cart.total).toLocaleString()}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5 bg-slate-50 p-2.5 rounded-xl border border-slate-100">
                <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Zero-tamper server price guarantees</span>
              </p>
            </div>
            
            <button 
              onClick={() => router.push("/checkout")}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 group"
            >
              <span>Proceed to Checkout</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}