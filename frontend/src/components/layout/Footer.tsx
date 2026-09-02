"use client";

import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { Heart } from "lucide-react";

export function Footer() {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isEmbed = searchParams.get("embed") === "true";
  if (isEmbed || pathname === "/chat") return null;
  return (
    <footer className="w-full border-t border-slate-200/80 bg-white text-slate-600 mt-20">
      {/* Main Footer Links */}
      <div className="container mx-auto px-4 py-12 max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          
          {/* Brand */}
          <div className="md:col-span-1 space-y-3">
            <div className="flex items-center gap-2.5">
              <img 
                src="/logo.png" 
                alt="BuyFlow" 
                className="w-8 h-8 rounded-xl object-contain shadow-xs" 
              />
              <span className="font-extrabold text-lg tracking-tight text-slate-900">
                Buy<span className="text-blue-600 font-black">Flow</span>
              </span>
            </div>
            <p className="text-slate-500 text-xs leading-relaxed">
              Your premier destination for high-performance computing, audio gear, and productivity accessories, curated with next-generation smart shopping.
            </p>
          </div>

          {/* Catalog */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Categories</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">High-Performance Laptops</Link></li>
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Studio & ANC Audio</Link></li>
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Productivity Accessories</Link></li>
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Curved Gaming Monitors</Link></li>
            </ul>
          </div>

          {/* Customer Experience */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">Customer Support</h4>
            <ul className="space-y-2 text-xs font-medium">
              <li><Link href="/chat" className="hover:text-blue-600 transition-colors">AI Shopping Assistant</Link></li>
              <li><Link href="/cart" className="hover:text-blue-600 transition-colors">Order Tracking & Cart</Link></li>
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Warranty & Replacements</Link></li>
              <li><Link href="/shop" className="hover:text-blue-600 transition-colors">Contact Support Team</Link></li>
            </ul>
          </div>

          {/* Trust & Guarantees */}
          <div className="space-y-3">
            <h4 className="text-xs font-extrabold uppercase tracking-widest text-slate-900">100% Genuine Guarantee</h4>
            <p className="text-slate-500 text-xs leading-relaxed">
              All items are sourced directly from authorized manufacturers and covered under comprehensive warranty with verified payment protection.
            </p>
            <div className="pt-2">
              <span className="inline-block px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold border border-blue-100">
                Official Razorpay Verified Store
              </span>
            </div>
          </div>

        </div>

        {/* Bottom copyright */}
        <div className="pt-8 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-400">
          <p>© 2026 Razorpay Commerce. All rights reserved.</p>
          <div className="flex items-center gap-6 font-medium">
            <Link href="/shop" className="hover:text-slate-700">Privacy Policy</Link>
            <span>•</span>
            <Link href="/shop" className="hover:text-slate-700">Terms of Service</Link>
            <span>•</span>
            <Link href="/shop" className="hover:text-slate-700">Security Standard</Link>
          </div>
        </div>
      </div>
    </footer>
  );
}