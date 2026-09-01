"use client";

import Link from "next/link";
import { Search, Bot, ArrowRight, ShieldCheck, Sparkles, LayoutDashboard, Lock, Zap, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function Home() {
  const { user, role } = useAuth();

  return (
    <div className="flex flex-col items-center max-w-6xl mx-auto pb-16">
      {/* Hero Section */}
      <section className="w-full pt-12 pb-20 text-center px-4">
        <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-50 border border-blue-100 text-blue-700 text-xs font-bold mb-6 shadow-xs">
          <Sparkles className="w-3.5 h-3.5" />
          <span>Razorpay AI Multi-Tenant Commerce OS</span>
        </div>
        
        <h1 className="text-4xl sm:text-6xl md:text-7xl font-black text-slate-900 tracking-tight mb-6 leading-[1.1]">
          Conversational Shopping with <br />
          <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">
            Deterministic Financial Safety
          </span>
        </h1>
        
        <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto mb-10 leading-relaxed">
          An autonomous multi-agent commerce engine. Customers shop naturally using AI while merchants set strict policy boundaries and receive 100% explainable telemetry.
        </p>
        
        {/* Dynamic CTAs */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3.5 max-w-md mx-auto">
          <Link 
            href="/chat" 
            className="w-full sm:w-auto px-7 py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm shadow-md shadow-blue-500/20"
          >
            <Bot className="w-4 h-4" />
            <span>Launch AI Buyer</span>
            <ArrowRight className="w-4 h-4" />
          </Link>
          
          <Link 
            href="/shop" 
            className="w-full sm:w-auto px-7 py-4 bg-white hover:bg-slate-50 text-slate-800 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm border border-slate-200 shadow-xs"
          >
            <Search className="w-4 h-4 text-slate-500" />
            <span>Browse Catalog</span>
          </Link>

          {role === "merchant" && (
            <Link 
              href="/merchant" 
              className="w-full sm:w-auto px-7 py-4 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold rounded-2xl transition-all flex items-center justify-center gap-2 text-sm border border-indigo-200"
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Merchant Portal</span>
            </Link>
          )}
        </div>
      </section>
      
      {/* 3 Core Agentic Pillars */}
      <section className="w-full grid grid-cols-1 md:grid-cols-3 gap-6 px-4 mb-16">
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:border-blue-200 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center mb-5 border border-blue-100">
              <Bot className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Autonomous LangGraph Supervisor</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Interprets natural conversational queries, extracts hard filters (price, categories), and runs semantic vector matching over PostgreSQL pgvector embeddings.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-blue-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-blue-500" />
            <span>Gemini Embeddings + Semantic Search</span>
          </div>
        </div>
        
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:border-indigo-200 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center mb-5 border border-indigo-100">
              <ShieldCheck className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Deterministic Policy Engine</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              AI proposes upsells and discounts, but the server-side Policy Engine enforces strict merchant limits. The AI cannot manipulate prices or bypass approval gates.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-indigo-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-indigo-500" />
            <span>100% Explainable Audit Ledger</span>
          </div>
        </div>
        
        <div className="bg-white p-7 rounded-3xl border border-slate-200/80 shadow-xs hover:border-emerald-200 transition-all flex flex-col justify-between">
          <div>
            <div className="w-12 h-12 bg-emerald-50 text-emerald-600 rounded-2xl flex items-center justify-center mb-5 border border-emerald-100">
              <Lock className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-bold text-slate-900 mb-2">Production Razorpay Gateway</h3>
            <p className="text-slate-500 text-xs leading-relaxed">
              Real Razorpay Standard Checkout SDK integration with server-side order generation and HMAC-SHA256 webhook signature verification.
            </p>
          </div>
          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] font-bold text-emerald-600 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
            <span>Zero-tamper Payment Verification</span>
          </div>
        </div>
      </section>

      {/* Tenant Banner */}
      <section className="w-full bg-slate-900 text-white rounded-3xl p-8 md:p-10 mx-4 flex flex-col md:flex-row items-center justify-between gap-6 shadow-xl">
        <div>
          <span className="text-[10px] font-extrabold uppercase tracking-widest text-blue-400">Multi-Tenant Architecture</span>
          <h2 className="text-2xl sm:text-3xl font-black mt-1">Ready for Multi-Store Deployments</h2>
          <p className="text-slate-400 text-xs sm:text-sm mt-1 max-w-xl">
            Each merchant has isolated data scopes, custom discount policies, dedicated AI Copilots, and independent Razorpay credential isolation.
          </p>
        </div>
        <div className="flex gap-3 shrink-0">
          <Link
            href="/register"
            className="px-5 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-bold text-xs transition-all shadow-md"
          >
            Create Store Account
          </Link>
          <Link
            href="/login"
            className="px-5 py-3 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-xl font-bold text-xs transition-all border border-slate-700"
          >
            Merchant Sign In
          </Link>
        </div>
      </section>
    </div>
  );
}