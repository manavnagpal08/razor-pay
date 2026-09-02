"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  Send, Loader2, Bot, User as UserIcon, Sparkles, LogIn, ArrowRight, 
  ShieldCheck, CheckCircle2, ShoppingCart, Zap, Check, ChevronDown, ChevronUp, Tag
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: number]: boolean }>({});
  const { user, token, refreshCartCount } = useAuth();
  
  const suggestedPrompts = [
    "Show me accessories for my laptop setup",
    "Find me a high performance gaming laptop under ₹150,000",
    "I need lightweight noise cancelling headphones for travel",
    "Find an essential student laptop under ₹60,000"
  ];

  const toggleReasoning = (idx: number) => {
    setExpandedReasoning(prev => ({ ...prev, [idx]: !prev[idx] }));
  };

  const handleAddToCart = async (product: any) => {
    if (!token) {
      alert("Please sign in to add items to your cart.");
      window.location.href = "/login";
      return;
    }

    setAddingId(product.id);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/cart/items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });
      if (res.ok) {
        await refreshCartCount();
        setAddedId(product.id);
        setTimeout(() => setAddedId(null), 2500);
      } else {
        alert("Failed to add to cart.");
      }
    } catch (e) {
      console.error(e);
      alert("Failed to add to cart.");
    } finally {
      setAddingId(null);
    }
  };

  const handleSend = async (text: string) => {
    if (!text.trim()) return;
    
    const userMsg = { role: "user", text };
    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/ai/chat/search`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          ...(token ? { "Authorization": `Bearer ${token}` } : {})
        },
        body: JSON.stringify({ 
          text,
          thread_id: user?.uid || "guest_session"
        })
      });
      
      if (!res.ok) throw new Error("Failed to process intent");
      
      const data = await res.json();
      
      const responseText = data.summary || (data.intent?.category 
        ? `I analyzed your intent for ${data.intent.category}${data.intent?.max_price ? ` under ₹${data.intent.max_price.toLocaleString()}` : ""}. Here are the best matched options:`
        : "Here are the most relevant items I found for your request:");

      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          text: responseText, 
          results: data.results || [],
          intent: data.intent,
          upsell: data.upsell,
          cross_sell: data.cross_sell,
          reasoning: data.reasoning
        }
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I encountered an error processing your request. Please ensure the backend is active.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-130px)] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Razorpay AI Shopping Concierge
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Gemini 2.5 Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">Autonomous intent parser, recommendation engine & policy guardrails</p>
          </div>
        </div>

        {!user && (
          <Link 
            href="/login"
            className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-600 rounded-xl hover:bg-blue-100 transition-colors border border-blue-200/50"
          >
            <LogIn className="w-3.5 h-3.5" />
            <span>Sign in for saved carts</span>
          </Link>
        )}
      </div>
      
      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">How can I help you shop today?</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                Describe the products, specs, budget, or use case in plain language. The AI will curate, rank, and verify products server-side.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-4">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(prompt)}
                  className="p-4 text-xs font-semibold text-left bg-white border border-slate-200 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-slate-700 hover:text-blue-600 group flex items-center justify-between"
                >
                  <span>"{prompt}"</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-blue-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xs ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : 'bg-blue-600 text-white'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
              </div>
              
              <div className={`max-w-[92%] ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start w-full'}`}>
                
                {/* Assistant Reasoning Capsule */}
                {msg.role === 'assistant' && msg.reasoning && (
                  <div className="mb-2.5 w-full">
                    <button
                      onClick={() => toggleReasoning(idx)}
                      className="flex items-center gap-1.5 px-3 py-1 bg-slate-100/90 hover:bg-slate-200/80 rounded-lg text-[11px] font-semibold text-slate-600 transition-colors"
                    >
                      <Zap className="w-3 h-3 text-amber-500" />
                      <span>AI Reasoning & Intent Inspector</span>
                      {expandedReasoning[idx] ? <ChevronUp className="w-3 h-3 ml-1" /> : <ChevronDown className="w-3 h-3 ml-1" />}
                    </button>
                    {expandedReasoning[idx] && (
                      <div className="mt-2 p-3.5 bg-slate-900 text-slate-200 text-xs rounded-2xl space-y-1.5 font-mono shadow-md border border-slate-800">
                        <p className="text-emerald-400">✓ Category: {msg.reasoning.intent_extracted?.category} | Budget: {msg.reasoning.intent_extracted?.budget}</p>
                        <p className="text-blue-400">✓ Keywords: {msg.reasoning.intent_extracted?.keywords?.join(", ") || "General search"}</p>
                        <p className="text-purple-400">✓ Policy Engine: {msg.reasoning.policy_verification}</p>
                        <p className="text-amber-400">✓ Catalog Engine: {msg.reasoning.catalog_scanned}</p>
                      </div>
                    )}
                  </div>
                )}

                {/* Message Bubble */}
                <div className={`p-4 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none text-sm' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none text-sm' 
                      : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none shadow-xs text-sm'
                }`}>
                  <p className="leading-relaxed font-medium">{msg.text}</p>
                </div>
                
                {/* Results View */}
                {msg.results && msg.results.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 w-full">
                    {msg.results.map((r: any) => {
                      const prod = r.product;
                      const imageUrl = prod.metadata_?.image_url || prod.metadata?.image_url || prod.image_url;
                      const isAdded = addedId === prod.id;
                      const isAdding = addingId === prod.id;

                      return (
                        <div key={prod.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-blue-400 transition-all duration-200 flex flex-col justify-between group">
                          {/* Image & Badges */}
                          <div className="relative aspect-[16/10] bg-slate-50 flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
                            {imageUrl ? (
                              <img src={imageUrl} alt={prod.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                              </div>
                            )}

                            {r.match_type === "BEST_MATCH" && (
                              <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Best Match
                              </span>
                            )}
                            <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-blue-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wide">
                              {prod.category}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">
                                {prod.name}
                              </h4>
                              <p className="text-xs text-slate-500 line-clamp-2 mb-3 leading-relaxed">
                                {prod.description}
                              </p>

                              {/* Price */}
                              <div className="flex items-baseline gap-2 mb-3">
                                <span className="text-lg font-black text-slate-900">
                                  ₹{Number(prod.price).toLocaleString()}
                                </span>
                                <span className="text-[11px] text-emerald-600 font-bold bg-emerald-50 px-2 py-0.5 rounded">
                                  Verified Price
                                </span>
                              </div>
                            </div>

                            {/* Reasons / Specs */}
                            <div className="pt-2.5 border-t border-slate-100 space-y-2">
                              {r.reasons && r.reasons.length > 0 && (
                                <div className="space-y-1">
                                  {r.reasons.slice(0, 2).map((reason: string, rIdx: number) => (
                                    <p key={rIdx} className="text-[11px] text-slate-600 flex items-center gap-1.5 font-medium">
                                      <CheckCircle2 className="w-3 h-3 text-emerald-500 shrink-0" />
                                      <span className="truncate">{reason}</span>
                                    </p>
                                  ))}
                                </div>
                              )}

                              {/* Action Buttons */}
                              <div className="flex items-center gap-2 pt-1">
                                <Link 
                                  href={`/products/${prod.id}`}
                                  className="flex-1 text-center py-2 px-3 text-xs font-bold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                                >
                                  View Specs
                                </Link>
                                <button
                                  onClick={() => handleAddToCart(prod)}
                                  disabled={isAdding}
                                  className={`flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                    isAdded 
                                      ? "bg-emerald-600 text-white" 
                                      : "bg-blue-600 hover:bg-blue-700 text-white shadow-xs hover:shadow"
                                  }`}
                                >
                                  {isAdding ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : isAdded ? (
                                    <>
                                      <Check className="w-3.5 h-3.5" />
                                      <span>Added</span>
                                    </>
                                  ) : (
                                    <>
                                      <ShoppingCart className="w-3.5 h-3.5" />
                                      <span>Add to Cart</span>
                                    </>
                                  )}
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Intelligent Upsell Spotlight */}
                {msg.upsell && msg.upsell.upgrade_product_id && (
                  <div className="mt-4 bg-gradient-to-r from-indigo-900 to-blue-900 text-white rounded-3xl p-5 w-full shadow-md border border-indigo-700/50 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-1.5 text-amber-400 font-extrabold text-xs uppercase tracking-wider">
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>Recommended Pro Upgrade</span>
                      </div>
                      <p className="text-sm font-semibold text-slate-100">
                        {msg.upsell.reasons ? msg.upsell.reasons.join(" ") : "Higher performance option available within policy margin."}
                      </p>
                      <p className="text-xs text-slate-300">
                        Verified by Merchant Policy Engine (Under maximum discount cap).
                      </p>
                    </div>
                    <Link 
                      href={`/products/${msg.upsell.upgrade_product_id}`} 
                      className="shrink-0 flex items-center gap-2 bg-white text-indigo-900 px-4 py-2.5 rounded-2xl font-bold text-xs hover:bg-amber-300 hover:text-slate-900 transition-all shadow-sm"
                    >
                      <span>Explore Upgrade</span>
                      <ArrowRight className="w-3.5 h-3.5" />
                    </Link>
                  </div>
                )}

                {/* Follow-up Quick Chips */}
                {msg.results && msg.results.length > 0 && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    <button 
                      onClick={() => handleSend("What discounts or offers apply to these items?")}
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-full text-xs font-semibold text-slate-600 transition-all"
                    >
                      🏷️ Check available offers
                    </button>
                    <button 
                      onClick={() => handleSend("Compare the top 2 products in detail")}
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-full text-xs font-semibold text-slate-600 transition-all"
                    >
                      ⚖️ Compare top 2 specs
                    </button>
                    <button 
                      onClick={() => handleSend("Show budget-friendly alternatives under ₹5,000")}
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-blue-400 hover:text-blue-600 rounded-full text-xs font-semibold text-slate-600 transition-all"
                    >
                      💰 Under ₹5,000 options
                    </button>
                  </div>
                )}

              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3.5">
            <div className="w-8 h-8 bg-blue-600 rounded-2xl flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none p-4 flex items-center gap-3 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">Agent Supervisor Reasoning...</p>
                <p className="text-[11px] text-slate-500">Extracting intent, scanning catalog & validating policy guardrails</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Input Form */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-2 relative"
        >
          <input 
            type="text" 
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type what you need (e.g. 'Show me accessories for my laptop setup' or 'MacBook under ₹90,000')..."
            className="flex-grow bg-slate-50 border border-slate-200 rounded-2xl py-3.5 pl-4 pr-12 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-600 focus:bg-white transition-all placeholder:text-slate-400"
            disabled={loading}
          />
          <button 
            type="submit"
            disabled={loading || !input.trim()}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 hover:bg-blue-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-blue-600 shadow-sm"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
          </button>
        </form>
      </div>

    </div>
  );
}