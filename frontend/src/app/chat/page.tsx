"use client";

import { useState } from "react";
import Link from "next/link";
import { Send, Loader2, Bot, User as UserIcon, Sparkles, LogIn, ArrowRight, ShieldCheck, CheckCircle, ShoppingCart } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

export default function ChatPage() {
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const { user, token, refreshCartCount } = useAuth();
  
  const suggestedPrompts = [
    "Find me a high performance gaming laptop under ₹150,000",
    "I need lightweight noise cancelling headphones for travel",
    "Show me accessories for my laptop setup",
    "Find an essential student laptop under ₹60,000"
  ];

  const handleAddToCart = async (product: any) => {
    if (!token) {
      alert("Please sign in to add items to your cart.");
      window.location.href = "/login";
      return;
    }

    setAddingId(product.id);
    try {
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
        alert(`Added ${product.name} to cart!`);
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
      const apiUrl = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";
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
      
      setMessages(prev => [
        ...prev, 
        { 
          role: "assistant", 
          text: `I analyzed your intent for ${data.intent?.category || "products"}${data.intent?.max_price ? ` under ₹${data.intent.max_price.toLocaleString()}` : ""}. Here are the best matched options:`, 
          results: data.results,
          intent: data.intent,
          upsell: data.upsell,
          cross_sell: data.cross_sell
        }
      ]);
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I encountered an error processing your request. Please ensure the backend is active.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-5xl mx-auto flex flex-col h-[calc(100vh-140px)] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      
      {/* Header */}
      <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/70 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-blue-600 to-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-blue-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <h2 className="font-bold text-slate-900 text-base flex items-center gap-2">
              Razorpay AI Buyer
              <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 text-[10px] font-extrabold uppercase tracking-wide">
                Agent Active
              </span>
            </h2>
            <p className="text-xs text-slate-500">Autonomous conversational agent with server-side validation</p>
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
      
      {/* Chat Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/30">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-blue-50 border border-blue-100 rounded-3xl flex items-center justify-center text-blue-600 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-bold text-slate-900 mb-2">How can I help you shop today?</h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                Describe the products, specs, budget, or use case you're looking for in plain language.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-4">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(prompt)}
                  className="p-3.5 text-xs font-medium text-left bg-white border border-slate-200/80 rounded-2xl hover:border-blue-400 hover:shadow-md transition-all text-slate-700 hover:text-blue-600 group flex items-center justify-between"
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
              
              <div className={`max-w-[85%] ${msg.role === 'user' ? 'flex flex-col items-end' : 'flex flex-col items-start'}`}>
                <div className={`p-4 rounded-3xl ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white rounded-tr-none text-sm' 
                    : msg.isError 
                      ? 'bg-red-50 text-red-700 border border-red-100 rounded-tl-none text-sm' 
                      : 'bg-white border border-slate-200/80 text-slate-800 rounded-tl-none shadow-xs text-sm'
                }`}>
                  <p className="leading-relaxed">{msg.text}</p>
                </div>
                
                {/* Results View */}
                {msg.results && msg.results.length > 0 && (
                  <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 w-full">
                    {msg.results.map((r: any) => {
                      const prod = r.product;
                      return (
                        <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-4 shadow-xs flex flex-col justify-between relative hover:border-blue-300 transition-all">
                          {r.match_type === "BEST_MATCH" && (
                            <span className="absolute -top-2.5 right-3 bg-emerald-100 text-emerald-800 text-[10px] font-bold px-2 py-0.5 rounded-full border border-emerald-200 shadow-xs">
                              Best Match
                            </span>
                          )}
                          <div>
                            <span className="text-[10px] font-bold text-blue-600 uppercase tracking-wider">{prod.category}</span>
                            <h4 className="font-bold text-slate-900 text-sm mt-1 mb-1 line-clamp-1">{prod.name}</h4>
                            <p className="text-xs text-slate-500 mb-3 line-clamp-2">{prod.description}</p>
                            <div className="text-base font-extrabold text-slate-900 mb-3">
                              ₹{Number(prod.price).toLocaleString()}
                            </div>
                          </div>

                          <div className="space-y-2 pt-2 border-t border-slate-100">
                            {r.reasons && r.reasons.length > 0 && (
                              <p className="text-[11px] text-slate-500 italic line-clamp-1">
                                ✓ {r.reasons.join(" • ")}
                              </p>
                            )}
                            <div className="flex gap-2">
                              <Link 
                                href={`/products/${prod.id}`}
                                className="flex-1 text-center py-2 px-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors"
                              >
                                Details
                              </Link>
                              <button
                                onClick={() => handleAddToCart(prod)}
                                disabled={addingId === prod.id}
                                className="p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl transition-colors disabled:opacity-50"
                                title="Add to Cart"
                              >
                                {addingId === prod.id ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShoppingCart className="w-4 h-4" />}
                              </button>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Recommendation / Upsell View */}
                {msg.upsell && (
                  <div className="mt-4 bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200/70 rounded-2xl p-4 w-full shadow-xs">
                    <div className="flex items-center gap-2 text-blue-900 font-bold text-xs uppercase tracking-wider mb-1">
                      <Sparkles className="w-3.5 h-3.5 text-blue-600" />
                      <span>AI Upsell Recommendation</span>
                    </div>
                    <p className="text-xs text-blue-700 mb-2.5">{msg.upsell.reasons ? msg.upsell.reasons.join(" ") : "Recommended upgrade based on your preferences."}</p>
                    {msg.upsell.upgrade_product_id && (
                      <Link 
                        href={`/products/${msg.upsell.upgrade_product_id}`} 
                        className="inline-flex items-center gap-1.5 text-xs font-bold bg-white text-blue-700 px-3.5 py-1.5 rounded-xl hover:bg-blue-600 hover:text-white transition-all border border-blue-200 shadow-xs"
                      >
                        <span>View Upgrade Spec</span>
                        <ArrowRight className="w-3.5 h-3.5" />
                      </Link>
                    )}
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
            <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none p-4 flex items-center gap-2.5 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
              <span className="text-xs font-medium text-slate-500">Supervisor extracting intent & querying catalog...</span>
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
            onChange={e => setInput(e.target.value)}
            disabled={loading}
            placeholder="Type what you need (e.g. 'Show me RTX 4070 laptops with 32GB RAM under ₹150,000')..."
            className="flex-grow p-3.5 pl-5 pr-14 bg-slate-50 border border-slate-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all text-sm text-slate-800 placeholder-slate-400"
          />
          <button 
            type="submit" 
            disabled={!input.trim() || loading}
            className="absolute right-2 top-2 bottom-2 aspect-square bg-blue-600 text-white rounded-xl flex items-center justify-center hover:bg-blue-700 transition-colors disabled:opacity-50 shadow-sm shadow-blue-500/20"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
}