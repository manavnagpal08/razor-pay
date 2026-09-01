"use client";

import Link from "next/link";
import { ShieldCheck, Zap, Bot, ArrowUpRight, Terminal, Lock } from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function Footer() {
  return (
    <footer className="w-full border-t border-slate-200 bg-white/95 text-slate-600 mt-20">
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-12">
          
          {/* Company Bio */}
          <div className="md:col-span-2 space-y-4">
            <div className="flex items-center gap-2.5">
              <div className="w-8 h-8 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20">
                <span className="text-white font-black text-base leading-none">R</span>
              </div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Razorpay <span className="text-blue-600 font-semibold text-sm">AI Commerce OS</span>
              </span>
            </div>

            <p className="text-slate-500 text-xs sm:text-sm max-w-md leading-relaxed">
              Autonomous conversational commerce powered by LangGraph, Google Gemini, and PostgreSQL pgvector. Deterministic policy engines enforce financial integrity at the server boundary.
            </p>

            <div className="flex items-center gap-3 pt-2">
              <a 
                href="https://github.com/manavnagpal08/razor-pay" 
                target="_blank" 
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-sm group"
              >
                <GithubIcon className="w-4 h-4" />
                <span>View on GitHub</span>
                <ArrowUpRight className="w-3.5 h-3.5 text-slate-400 group-hover:text-white transition-colors" />
              </a>

              <div className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                <span>Supabase PostgreSQL Live</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Platform</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Catalog & Storefront</Link></li>
              <li><Link href="/chat" className="hover:text-blue-600 transition-colors flex items-center gap-1"><span>AI Buyer Agent</span> <span className="text-[10px] bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded font-bold">AI</span></Link></li>
              <li><Link href="/merchant" className="hover:text-blue-600 transition-colors">Merchant Control Center</Link></li>
              <li><Link href="/cart" className="hover:text-blue-600 transition-colors">Cart & Zero-Tamper Pricing</Link></li>
            </ul>
          </div>

          {/* Architecture & Security */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Security & Trust</h4>
            <ul className="space-y-2 text-xs text-slate-500">
              <li className="flex items-center gap-1.5"><ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" /> <span>Deterministic Policy Engine</span></li>
              <li className="flex items-center gap-1.5"><Lock className="w-3.5 h-3.5 text-blue-600 shrink-0" /> <span>Razorpay Standard Checkout</span></li>
              <li className="flex items-center gap-1.5"><Terminal className="w-3.5 h-3.5 text-purple-600 shrink-0" /> <span>HMAC-SHA256 Webhooks</span></li>
              <li className="flex items-center gap-1.5"><Zap className="w-3.5 h-3.5 text-amber-600 shrink-0" /> <span>pgvector 768-D Semantic Search</span></li>
            </ul>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Razorpay AI Commerce OS. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <a href="https://github.com/manavnagpal08/razor-pay" target="_blank" rel="noopener noreferrer" className="hover:text-slate-700 font-medium">Repository</a>
            <span>•</span>
            <span className="text-slate-500 font-semibold">Track 01: Agentic Commerce</span>
          </div>
        </div>
      </div>
    </footer>
  );
}