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
  Sparkles,
  ShoppingBag
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const { user, role, cartCount, logout, loading } = useAuth();

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <div className="w-9 h-9 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-xl flex items-center justify-center shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
              <span className="text-white font-black text-lg leading-none">R</span>
            </div>
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Razorpay <span className="text-blue-600 font-semibold text-sm">Store</span>
            </span>
          </Link>
        </div>
        
        {/* Nav Links */}
        <div className="hidden md:flex items-center space-x-1 text-sm font-medium">
          {role === "merchant" ? (
            <>
              <Link 
                href="/merchant" 
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  pathname === '/merchant' 
                    ? 'bg-indigo-600 text-white font-bold shadow-xs' 
                    : 'text-indigo-600 bg-indigo-50 hover:bg-indigo-100 font-semibold'
                }`}
              >
                <LayoutDashboard className="w-4 h-4" />
                <span>Merchant Control Center</span>
              </Link>

              <Link 
                href="/merchant#catalog" 
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-semibold"
              >
                Product Catalog
              </Link>

              <Link 
                href="/merchant#webhooks" 
                className="px-3.5 py-1.5 rounded-xl text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition-colors font-semibold"
              >
                OMS Webhooks
              </Link>

              <Link 
                href="/chat" 
                target="_blank"
                className="flex items-center gap-1 px-3.5 py-1.5 rounded-xl text-emerald-700 bg-emerald-50 hover:bg-emerald-100 transition-colors font-semibold text-xs border border-emerald-200/50"
              >
                <span>Live AI Storefront</span>
                <Sparkles className="w-3 h-3 text-amber-500" />
              </Link>
            </>
          ) : (
            <>
              <Link 
                href="/shop" 
                className={`px-3.5 py-1.5 rounded-xl transition-colors ${
                  pathname === '/shop' ? 'bg-slate-100 text-blue-600 font-bold' : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                Catalog
              </Link>

              <Link 
                href="/chat" 
                className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl transition-all ${
                  pathname === '/chat' 
                    ? 'bg-blue-600 text-white font-bold shadow-xs' 
                    : 'text-blue-600 bg-blue-50 hover:bg-blue-100 font-semibold'
                }`}
              >
                <Bot className="w-4 h-4" />
                <span>AI Shopping Assistant</span>
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-blue-500 animate-ping"></span>
              </Link>
            </>
          )}
        </div>
        
        {/* Right Side: Cart & User Account Controls */}
        <div className="flex items-center gap-3">
          {/* Cart Icon */}
          {role !== "merchant" && (
            <Link 
              href="/cart" 
              className="p-2 hover:bg-slate-100 rounded-xl transition-colors relative text-slate-700 flex items-center justify-center border border-slate-200/80 shadow-xs"
              title="Shopping Cart"
            >
              <ShoppingCart className="w-4.5 h-4.5" />
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
                      {role === "merchant" ? "Merchant" : "Customer"}
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