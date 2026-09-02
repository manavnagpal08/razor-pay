"use client";

import { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { 
  ShoppingCart, 
  Bot, 
  LayoutDashboard, 
  LogIn, 
  UserPlus, 
  LogOut, 
  Sparkles,
  ShoppingBag,
  ChevronDown,
  User,
  Shield,
  Store
} from "lucide-react";

export function Navbar() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  const { user, role, cartCount, logout, loading } = useAuth();
  const [profileOpen, setProfileOpen] = useState(false);
  const profileRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (profileRef.current && !profileRef.current.contains(event.target as Node)) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (isEmbed || pathname === "/chat") return null;

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-slate-200/80 bg-white/95 backdrop-blur-md shadow-xs">
      <div className="container mx-auto px-4 h-16 flex items-center justify-between">
        
        {/* Brand */}
        <div className="flex items-center gap-6">
          <Link href="/" className="flex items-center gap-2.5 group">
            <img 
              src="/logo.png" 
              alt="BuyFlow" 
              className="w-9 h-9 rounded-xl object-contain shadow-sm shadow-blue-500/10 group-hover:scale-105 transition-transform" 
            />
            <span className="font-extrabold text-lg tracking-tight text-slate-900">
              Buy<span className="text-blue-600 font-black">Flow</span>
            </span>
          </Link>
        </div>
        
        {/* Center: Clean whitespace (Catalog & AI Assistant removed from header as requested) */}
        <div className="flex-1"></div>
        
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

          {/* Auth State & Clickable Profile Dropdown */}
          {!loading && (
            <>
              {user ? (
                <div className="relative" ref={profileRef}>
                  <button
                    type="button"
                    onClick={() => setProfileOpen(!profileOpen)}
                    className="flex items-center gap-2.5 p-1.5 pr-2.5 rounded-2xl hover:bg-slate-100 border border-slate-200/70 transition-all cursor-pointer focus:outline-none"
                    title="Account Profile"
                  >
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-600 to-indigo-600 text-white font-black text-xs flex items-center justify-center shadow-xs">
                      {user.email ? user.email.charAt(0).toUpperCase() : "U"}
                    </div>

                    <div className="hidden sm:flex flex-col items-start text-left">
                      <span className="text-xs font-bold text-slate-800 leading-tight max-w-[120px] truncate">
                        {user.displayName || user.email?.split("@")[0]}
                      </span>
                      <span className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                        {role === "merchant" ? "Merchant" : "Customer"}
                      </span>
                    </div>

                    <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${profileOpen ? "rotate-180" : ""}`} />
                  </button>

                  {/* Profile Dropdown Menu */}
                  {profileOpen && (
                    <div className="absolute right-0 top-full mt-2 w-64 bg-white rounded-2xl shadow-2xl border border-slate-200 py-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-4 py-2.5 border-b border-slate-100">
                        <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Signed in as</p>
                        <p className="text-xs font-bold text-slate-900 truncate mt-0.5">{user.displayName || user.email?.split("@")[0]}</p>
                        <p className="text-[11px] font-mono text-slate-500 truncate">{user.email}</p>
                        <div className="mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold ${
                            role === "merchant" ? "bg-indigo-50 text-indigo-700 border border-indigo-100" : "bg-emerald-50 text-emerald-700 border border-emerald-100"
                          }`}>
                            <Shield className="w-2.5 h-2.5" />
                            <span>{role === "merchant" ? "Merchant Administrator" : "Verified Customer"}</span>
                          </span>
                        </div>
                      </div>

                      <div className="p-1 space-y-0.5">
                        {role === "merchant" ? (
                          <Link
                            href="/merchant"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-indigo-600 rounded-xl transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4 text-indigo-500" />
                            <span>Merchant Dashboard</span>
                          </Link>
                        ) : (
                          <Link
                            href="/shop"
                            onClick={() => setProfileOpen(false)}
                            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-blue-600 rounded-xl transition-colors"
                          >
                            <Store className="w-4 h-4 text-blue-500" />
                            <span>Shop Storefront</span>
                          </Link>
                        )}
                      </div>

                      <div className="pt-1 mt-1 border-t border-slate-100 p-1">
                        <button
                          type="button"
                          onClick={() => {
                            setProfileOpen(false);
                            logout();
                          }}
                          className="w-full flex items-center gap-2 px-3 py-2 text-xs font-bold text-rose-600 hover:bg-rose-50 rounded-xl transition-colors text-left"
                        >
                          <LogOut className="w-4 h-4" />
                          <span>Sign Out</span>
                        </button>
                      </div>
                    </div>
                  )}
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
                    className="px-3.5 py-1.5 text-xs font-bold text-white bg-blue-600 hover:bg-blue-700 rounded-xl transition-colors flex items-center gap-1.5 shadow-xs"
                  >
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Sign Up</span>
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