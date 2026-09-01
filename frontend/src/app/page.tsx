"use client";

import Link from "next/link";
import { Search, Bot, ArrowRight, ShieldCheck, Sparkles, LayoutDashboard, Truck, Star, Zap, CheckCircle2, ChevronRight } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { role } = useAuth();

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto pb-16">
      {/* Hero Section */}
      <section className="w-full pt-10 pb-16 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Next-Gen Smart Shopping & Verified Electronics</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
          High-Performance Tech, <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Powered by Smart AI Shopping
          </span>
        </h1>
        
        <p className="text-base sm:text-lg text-slate-600 max-w-2xl mx-auto mb-8 leading-relaxed">
          Find your dream setup in seconds. Ask our AI Shopping Assistant for tailored laptop recommendations, studio-grade audio gear, and desk setups with instant, secure Razorpay checkout.
        </p>
        
        {/* Dynamic CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link 
            href="/chat" 
            className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20"
          >
            <Bot className="w-4 h-4" />
            <span>Ask AI Shopping Assistant</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/shop" 
            className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-200 shadow-xs"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span>Explore All Products</span>
          </Link>

          {role === "merchant" && (
            <Link 
              href="/merchant" 
              className="w-full sm:w-auto px-7 py-3.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm border border-indigo-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Merchant Portal</span>
            </Link>
          )}
        </div>
      </section>
      
      {/* 3 Core Customer Value Propositions */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mb-16">
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Personalized AI Buyer Assistant</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Describe what you need in plain English—whether for gaming, video editing, or college—and get precision-matched products tailored to your exact budget.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-blue-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-blue-500" />
            <span>Natural language search & smart matching</span>
          </div>
        </div>
        
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-indigo-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">100% Genuine Guaranteed</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              All electronics and accessories are sourced from certified global distributors with manufacturer warranty and hassle-free 7-day replacement support.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-indigo-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-indigo-500" />
            <span>Official manufacturer warranty coverage</span>
          </div>
        </div>
        
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:shadow-md hover:border-emerald-300 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100">
              <Zap className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">Instant Razorpay Checkout</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Experience seamless, 256-bit encrypted checkout with UPI, Credit/Debit Cards, NetBanking, and EMI with instant order confirmation.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-xs font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
            <span>Encrypted payment security</span>
          </div>
        </div>
      </section>

      {/* Featured Categories Banner */}
      <section className="w-full bg-gradient-to-tr from-slate-900 via-indigo-950 to-slate-900 text-white rounded-3xl p-8 md:p-10 mx-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">Exclusive Store Collections</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">Upgrade Your Daily Workflow</h2>
          <p className="text-slate-300 text-xs sm:text-sm mt-1 max-w-xl">
            From RTX 4080 powerhouse laptops and 144Hz ultrawide monitors to Hi-Res studio headphones and zero-latency wireless mice.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/shop"
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md flex items-center gap-1.5"
          >
            <span>Shop Now</span>
            <ChevronRight className="w-4 h-4" />
          </Link>
          <Link
            href="/chat"
            className="px-5 py-3 bg-white/10 hover:bg-white/20 text-white rounded-xl font-bold text-xs transition-all border border-white/10"
          >
            Try AI Assistant
          </Link>
        </div>
      </section>
    </div>
  );
}