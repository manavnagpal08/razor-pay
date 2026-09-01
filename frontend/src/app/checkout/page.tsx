"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Script from "next/script";
import { ShieldCheck, Lock, ArrowLeft, Loader2, CheckCircle2 } from "lucide-react";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function CheckoutPage() {
  const router = useRouter();
  const { user, token, refreshCartCount } = useAuth();
  const [cart, setCart] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [orderProcessing, setOrderProcessing] = useState(false);
  const [scriptLoaded, setScriptLoaded] = useState(false);

  useEffect(() => {
    if (token) {
      fetchCart();
    } else {
      setLoading(false);
    }
  }, [token]);

  const fetchCart = async () => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/cart/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        }
      });
      if (res.ok) {
        const data = await res.json();
        if (!data.items || data.items.length === 0) {
          router.push("/cart");
          return;
        }
        setCart(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCheckout = async () => {
    if (!cart || !token) return;
    setOrderProcessing(true);

    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      
      // 1. Create Order Server-Side
      const orderRes = await fetch(`${apiUrl}/api/orders/`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ cart_id: cart.id })
      });
      
      const orderData = await orderRes.json();

      if (!orderRes.ok) {
        alert("Order creation rejected by policy engine: " + (orderData.detail || "Unknown error"));
        setOrderProcessing(false);
        return;
      }

      // 2. Launch Razorpay Standard Checkout
      const options = {
        key: orderData.key_id,
        amount: Math.round(Number(orderData.amount) * 100),
        currency: orderData.currency || "INR",
        name: "Razorpay AI Commerce",
        description: "Order #" + orderData.internal_order_id.substring(0, 8),
        order_id: orderData.razorpay_order_id,
        handler: async function (response: any) {
          await verifyPayment(
            orderData.internal_order_id, 
            response.razorpay_order_id, 
            response.razorpay_payment_id, 
            response.razorpay_signature
          );
        },
        prefill: {
          name: user?.displayName || "Valued Customer",
          email: user?.email || "customer@example.com",
          contact: "9999999999"
        },
        theme: {
          color: "#2563eb"
        },
        modal: {
          ondismiss: function() {
            setOrderProcessing(false);
          }
        }
      };

      // @ts-ignore
      if (typeof window !== "undefined" && window.Razorpay) {
        // @ts-ignore
        const rzp = new window.Razorpay(options);
        rzp.on('payment.failed', function (response: any) {
          router.push(`/order-failed?reason=${encodeURIComponent(response.error?.description || "Payment failed")}`);
        });
        rzp.open();
      } else {
        alert("Razorpay checkout SDK is loading. Please try again in a moment.");
        setOrderProcessing(false);
      }

    } catch (e) {
      console.error(e);
      setOrderProcessing(false);
      alert("Failed to initiate payment. Please try again.");
    }
  };

  const verifyPayment = async (internal_order_id: string, rzp_order_id: string, rzp_payment_id: string, signature: string) => {
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
      const res = await fetch(`${apiUrl}/api/orders/verify`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({
          internal_order_id,
          razorpay_order_id: rzp_order_id,
          razorpay_payment_id: rzp_payment_id,
          signature
        })
      });
      const data = await res.json();
      
      if (data.success) {
        await refreshCartCount();
        router.push(`/order-success?order_id=${data.order_id}`);
      } else {
        router.push(`/order-failed?reason=${encodeURIComponent(data.message || "Signature mismatch")}`);
      }
    } catch (e) {
      console.error(e);
      router.push("/order-failed?reason=verification_error");
    } finally {
      setOrderProcessing(false);
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
        <Lock className="w-8 h-8 text-blue-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Authentication Required</h2>
        <p className="text-slate-500 text-sm mb-6">Please log in to proceed with secure payment verification.</p>
        <Link href="/login" className="inline-block w-full py-3.5 bg-blue-600 text-white rounded-xl font-bold hover:bg-blue-700 transition-colors shadow-md shadow-blue-500/20">
          Sign In
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto p-4 py-8">
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      <Link href="/cart" className="inline-flex items-center gap-1.5 text-sm font-semibold text-slate-500 hover:text-slate-800 mb-6 transition-colors">
        <ArrowLeft className="w-4 h-4" />
        <span>Back to Cart</span>
      </Link>

      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2.5">
            <Lock className="w-7 h-7 text-blue-600" />
            <span>Secure Checkout</span>
          </h1>
          <p className="text-slate-500 text-sm mt-1">Direct integration with Razorpay Payment Gateway</p>
        </div>
      </div>
      
      <div className="bg-white p-8 rounded-3xl border border-slate-200/90 shadow-sm mb-6 space-y-6">
        <h2 className="text-lg font-bold text-slate-900 border-b border-slate-100 pb-3">Order Items</h2>
        
        <div className="space-y-3 divide-y divide-slate-100">
          {cart.items.map((item: any) => (
            <div key={item.id} className="pt-3 flex justify-between items-center text-sm">
              <div>
                <p className="font-bold text-slate-900">{item.name}</p>
                <p className="text-xs text-slate-500">Qty: {item.quantity} × ₹{Number(item.unit_price).toLocaleString()}</p>
              </div>
              <p className="font-extrabold text-slate-900">₹{Number(item.subtotal).toLocaleString()}</p>
            </div>
          ))}
        </div>
        
        <div className="bg-slate-50 p-5 rounded-2xl space-y-2.5 border border-slate-100 text-sm">
          <div className="flex justify-between text-slate-600">
            <span>Subtotal</span>
            <span className="font-semibold text-slate-900">₹{Number(cart.subtotal).toLocaleString()}</span>
          </div>
          {Number(cart.discount) > 0 && (
            <div className="flex justify-between text-emerald-600 font-medium">
              <span>Merchant Applied Discount</span>
              <span>-₹{Number(cart.discount).toLocaleString()}</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-extrabold text-slate-900 pt-3 border-t border-slate-200 mt-2">
            <span>Total Payable</span>
            <span className="text-blue-600">₹{Number(cart.total).toLocaleString()}</span>
          </div>
        </div>
        
        <div className="flex items-start gap-3 text-xs text-blue-900 bg-blue-50/80 p-4 rounded-2xl border border-blue-100">
          <ShieldCheck className="w-5 h-5 text-blue-600 shrink-0 mt-0.5" />
          <div>
            <p className="font-bold mb-0.5">Cryptographically Verified Amount</p>
            <p className="text-blue-700 leading-relaxed">
              Amounts are calculated strictly server-side by the Policy Engine. Webhook & signature verification prevents client-side tampering.
            </p>
          </div>
        </div>
        
        <button 
          onClick={handleCheckout} 
          disabled={orderProcessing}
          className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl transition-all shadow-md shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {orderProcessing ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              <span>Opening Razorpay Modal...</span>
            </>
          ) : (
            <span>Pay ₹{Number(cart.total).toLocaleString()} with Razorpay</span>
          )}
        </button>
      </div>
    </div>
  );
}