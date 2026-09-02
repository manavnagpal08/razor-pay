"use client";

import { useEffect, useState } from "react";
import { ProductCard } from "@/components/product/ProductCard";
import { Search, Sparkles, Filter, Bot, Loader2 } from "lucide-react";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";

const FALLBACK_PRODUCTS = [
  {
    id: "prod-laptop-1",
    name: "Titanium Gaming Laptop X",
    category: "laptops",
    description: "High performance gaming laptop with RTX 4070 and 32GB RAM.",
    price: 145000.00,
    currency: "INR",
    inventory: 10,
  },
  {
    id: "prod-laptop-2",
    name: "Student Laptop Essential",
    category: "laptops",
    description: "Lightweight laptop for college and travel with 16GB RAM.",
    price: 55000.00,
    currency: "INR",
    inventory: 40,
  },
  {
    id: "prod-mouse-1",
    name: "Pro Gaming Mouse",
    category: "accessories",
    description: "Wireless ultra-lightweight gaming mouse with RGB.",
    price: 8500.00,
    currency: "INR",
    inventory: 150,
  },
  {
    id: "prod-headphone-1",
    name: "Noise Cancelling Headphones",
    category: "audio",
    description: "Premium over-ear headphones with active noise cancellation.",
    price: 25000.00,
    currency: "INR",
    inventory: 30,
  },
  {
    id: "prod-hub-1",
    name: "USB-C Hub Pro",
    category: "accessories",
    description: "7-in-1 USB-C hub with HDMI, SD card reader, and 100W PD charging.",
    price: 3500.00,
    currency: "INR",
    inventory: 200,
  }
];

export default function ShopPage() {
  const [products, setProducts] = useState<any[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/products`, { cache: "no-store" });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data) && data.length > 0) {
          setProducts(data);
        } else {
          setProducts(FALLBACK_PRODUCTS);
        }
      } else {
        setProducts(FALLBACK_PRODUCTS);
      }
    } catch (err) {
      console.warn("Backend products fetch failed, using catalog fallback", err);
      setProducts(FALLBACK_PRODUCTS);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => {
    const matchesCategory = selectedCategory === "all" || p.category === selectedCategory;
    const matchesSearch = searchQuery === "" || 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      p.description.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const categories = ["all", "laptops", "audio", "accessories"];

  return (
    <div className="space-y-8 max-w-7xl mx-auto pb-12">
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-600 to-indigo-700 rounded-3xl p-8 md:p-10 text-white shadow-lg shadow-blue-500/10 flex flex-col md:flex-row justify-between items-start md:items-end gap-6">
        <div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/20 text-white text-xs font-bold uppercase tracking-wider mb-3 backdrop-blur-xs">
            <Sparkles className="w-3.5 h-3.5" /> Razorpay Multi-Tenant Catalog
          </span>
          <h1 className="text-3xl md:text-4xl font-black tracking-tight">Verified Product Catalog</h1>
          <p className="text-blue-100 text-sm mt-1 max-w-xl">
            Browse live products backed by server-validated inventory, deterministic policies, and AI recommendations.
          </p>
        </div>

        <Link
          href="/chat"
          className="px-5 py-3 bg-white text-blue-700 hover:bg-blue-50 font-bold text-xs uppercase tracking-wider rounded-2xl flex items-center gap-2 shadow-md transition-all shrink-0"
        >
          <Bot className="w-4 h-4 text-blue-600" />
          <span>Ask AI Buyer Instead</span>
        </Link>
      </div>

      {/* Filter & Search Bar */}
      <div className="flex flex-col sm:flex-row gap-4 items-center justify-between bg-white p-4 rounded-2xl border border-slate-200 shadow-xs">
        {/* Category Pills */}
        <div className="flex items-center gap-2 overflow-x-auto w-full sm:w-auto pb-2 sm:pb-0">
          <Filter className="w-4 h-4 text-slate-400 mr-1 shrink-0" />
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold capitalize transition-all shrink-0 ${
                selectedCategory === cat
                  ? 'bg-blue-600 text-white shadow-xs'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full sm:w-72">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
          <input
            type="text"
            value={searchQuery}
            onChange={e => setSearchQuery(e.target.value)}
            placeholder="Search products..."
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 text-slate-800"
          />
        </div>
      </div>
      
      {/* Product Grid */}
      {loading ? (
        <div className="flex justify-center items-center h-48">
          <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
        </div>
      ) : filteredProducts.length === 0 ? (
        <div className="p-12 text-center bg-white border border-slate-200 rounded-3xl shadow-xs">
          <p className="text-slate-500 text-sm">No products found matching your filter criteria.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {filteredProducts.map((p: any) => (
            <ProductCard key={p.id} product={p} />
          ))}
        </div>
      )}
    </div>
  );
}