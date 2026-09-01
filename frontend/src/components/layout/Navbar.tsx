"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingCart, 
  Bot, 
  LayoutDashboard, 
  LogIn, 
  UserPlus, 
  LogOut, 
  ArrowUpRight
} from "lucide-react";

function GithubIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
    </svg>
  );
}

export function Navbar() {
  const pathname = usePathname();
  const { user, role, cartCount, logout, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/90 backdrop-blur-md shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand & Store/Tenant Indicator */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg leading-none">R</span>
            </div>
            <div>
              <span className="font-extrabold text-lg tracking-tight text-slate-900 flex items-center gap-1.5">
                Razorpay <span className="text-blue-600 font-semibold text-xs px-2 py-0.5 bg-blue-50 rounded-md border border-blue-100">AI Commerce OS</span>
              </span>
            </div>
          </Link>

          {/* Live Supabase / Tenant Status */}
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 bg-slate-50 text-slate-600 rounded-full text-xs font-medium border border-slate-200">
            <span className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_6px_rgba(16,185,129,0.8)] animate-pulse"></span>
            <span>Tenant: <strong className="text-slate-800 font-semibold">OmniCommerce Enterprise</strong></span>
          </div>
        </div>
        
        {/* Nav Links based on Auth Role */}
        <div className="hidden md:flex items-center space-x-1 text-sm font-medium">
          <Link 
            href="/shop" 
            className={`px-3 py-1.5 rounded-xl transition-colors ${
              pathname === '/shop' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            Catalog
          </Link>

          <Link 
            href="/chat" 
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
              pathname === '/chat' 
                ? 'bg-blue-600 text-white font-bold shadow-xs' 
                : 'text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold'
            }`}
          >
            <Bot className="w-4 h-4" />
            <span>AI Buyer</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
          </Link>

          {role === "merchant" && (
            <Link 
              href="/merchant" 
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl transition-all ${
                pathname === '/merchant' 
                  ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                  : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold'
              }`}
            >
              <LayoutDashboard className="w-4 h-4" />
              <span>Merchant Portal</span>
            </Link>
          )}

          {/* GitHub Repo Link */}
          <a
            href="https://github.com/manavnagpal08/razor-pay"
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-slate-700 hover:bg-slate-100 transition-colors font-semibold text-xs border border-slate-200 ml-2"
            title="GitHub Repository"
          >
            <GithubIcon className="w-3.5 h-3.5" />
            <span>GitHub</span>
            <ArrowUpRight className="w-3 h-3 text-slate-400" />
          </a>
        </div>
        
        {/* Right Side: Cart & User Account Controls */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          {role !== "merchant" && (
            <Link 
              href="/cart" 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative text-slate-700 flex items-center justify-center border border-slate-200/60 shadow-2xs"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4 h-4" />
              {cartCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 w-5 h-5 bg-blue-600 text-white text-[11px] font-black flex items-center justify-center rounded-full shadow-sm animate-in zoom-in-50">
                  {cartCount}
                </span>
              )}
            </Link>
          )}

          {/* Auth State Button */}
          {!loading && (
            <>
              {user ? (
                <div className="flex items-center gap-2 pl-2 border-l border-slate-200">
                  <div className="hidden sm:flex flex-col items-end text-right">
                    <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                      {user.displayName || user.email?.split("@")[0]}
                    </span>
                    <span className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">
                      {role === "merchant" ? "Merchant Admin" : "Shopper"}
                    </span>
                  </div>
                  
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-sm">
                    {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                  </div>

                  <button
                    onClick={() => logout()}
                    className="p-2 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                    title="Sign Out"
                  >
                    <LogOut className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-2">
                  <Link
                    href="/login"
                    className="px-3.5 py-1.5 text-xs font-bold text-slate-700 hover:text-blue-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <LogIn className="w-3.5 h-3.5" />
                    <span>Sign In</span>
                  </Link>
                  
                  <Link
                    href="/register"
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl shadow-xs shadow-blue-500/20 transition-all flex items-center gap-1.5"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Register</span>
                  </Link>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </nav>
  );
}