"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { 
  Send, Loader2, Bot, User as UserIcon, Sparkles, LogIn, ArrowRight, 
  ShieldCheck, CheckCircle2, ShoppingCart, Zap, Check, ChevronDown, ChevronUp, Store, ExternalLink,
  Mic, MicOff, Volume2, VolumeX, Radio, Truck, Package, MapPin, Calendar, KeyRound, X, Search
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";

function ChatContent() {
  const searchParams = useSearchParams();
  const merchantParam = searchParams.get("merchant") || "demo_merchant";

  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [addingId, setAddingId] = useState<string | null>(null);
  const [addedId, setAddedId] = useState<string | null>(null);
  const [instantBuyingId, setInstantBuyingId] = useState<string | null>(null);
  const [scriptLoaded, setScriptLoaded] = useState(false);
  const [expandedReasoning, setExpandedReasoning] = useState<{ [key: number]: boolean }>({});
  const [merchantInfo, setMerchantInfo] = useState<any>(null);
  const [isListening, setIsListening] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [speechSupported, setSpeechSupported] = useState(false);
  const { user, token, refreshCartCount } = useAuth();

  // In-Chat OTP Authentication & Frictionless Guest Checkout States
  const [guestVerifiedToken, setGuestVerifiedToken] = useState<string | null>(null);
  const [guestCustomer, setGuestCustomer] = useState<any>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pendingProductToBuy, setPendingProductToBuy] = useState<any>(null);

  // In-Chat Order Tracking States
  const [showTrackingModal, setShowTrackingModal] = useState(false);
  const [trackingEmail, setTrackingEmail] = useState("");
  const [trackingLoading, setTrackingLoading] = useState(false);
  const [trackingData, setTrackingData] = useState<any>(null);
  const [trackingError, setTrackingError] = useState("");
  
  const suggestedPrompts = [
    "Show me accessories for my laptop setup",
    "Find me a high performance gaming laptop under ₹150,000",
    "I need lightweight noise cancelling headphones for travel",
    "Find an essential student laptop under ₹60,000"
  ];

  // Fetch Public Merchant Storefront Metadata
  useEffect(() => {
    const fetchMerchantData = async () => {
      try {
        const apiUrl = getApiUrl();
        const res = await fetch(`${apiUrl}/api/merchant/public/${merchantParam}`);
        if (res.ok) {
          const data = await res.json();
          setMerchantInfo(data);
        }
      } catch (err) {
        console.warn("Failed to fetch merchant profile:", err);
      }
    };
    fetchMerchantData();
  }, [merchantParam]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSpeechSupported(true);
    }
  }, []);

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      alert("Speech recognition is not supported on this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.lang = "en-IN";

      recognition.onstart = () => {
        setIsListening(true);
      };

      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results)
          .map((result: any) => result[0].transcript)
          .join("");
        setInput(transcript);
      };

      recognition.onerror = (event: any) => {
        console.warn("Speech recognition error:", event.error);
        setIsListening(false);
      };

      recognition.onend = () => {
        setIsListening(false);
      };

      recognition.start();
    } catch (err) {
      console.warn("Failed to initialize voice recognition:", err);
      setIsListening(false);
    }
  };

  const speakText = (text: string) => {
    if (typeof window === "undefined" || !("speechSynthesis" in window)) return;
    try {
      window.speechSynthesis.cancel();
      const clean = text.replace(/[*_#`~\[\]]/g, "").slice(0, 250);
      const utterance = new SpeechSynthesisUtterance(clean);
      utterance.rate = 1.0;
      utterance.pitch = 1.0;
      utterance.onstart = () => setIsSpeaking(true);
      utterance.onend = () => setIsSpeaking(false);
      utterance.onerror = () => setIsSpeaking(false);
      window.speechSynthesis.speak(utterance);
    } catch (e) {
      console.warn("TTS error:", e);
      setIsSpeaking(false);
    }
  };

  const stopSpeaking = () => {
    if (typeof window !== "undefined" && "speechSynthesis" in window) {
      window.speechSynthesis.cancel();
      setIsSpeaking(false);
    }
  };

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

  // Effective authenticated token (User Login OR Verified Guest Session)
  const effectiveToken = token || guestVerifiedToken;

  // Send OTP for In-Chat Verification
  const handleSendOtp = async () => {
    if (!otpEmail.trim()) {
      setOtpError("Please enter your email address.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/chat/auth/send-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail.trim(),
          phone: otpPhone.trim() || undefined,
          purpose: "CHECKOUT"
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        if (data.otp_hint) {
          setOtpCode(data.otp_hint); // Prefill demo OTP for fast hackathon testing!
        }
      } else {
        setOtpError(data.detail || "Failed to send verification code.");
      }
    } catch (e) {
      setOtpError("Connection error while sending verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Verify In-Chat OTP
  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!otpCode.trim()) {
      setOtpError("Please enter the 6-digit verification code.");
      return;
    }
    setOtpLoading(true);
    setOtpError("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/chat/auth/verify-otp`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: otpEmail.trim(),
          otp: otpCode.trim(),
          name: otpName.trim() || "Valued Shopper",
          phone: otpPhone.trim() || undefined
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setGuestVerifiedToken(data.token);
        setGuestCustomer(data.customer);
        setShowOtpModal(false);
        setOtpSent(false);

        // Auto-launch checkout if customer clicked "Buy Now"
        if (pendingProductToBuy) {
          const prod = pendingProductToBuy;
          setPendingProductToBuy(null);
          proceedWithCheckout(prod, data.token);
        }
      } else {
        setOtpError(data.detail || "Invalid code. Please use test code: 482910");
      }
    } catch (e) {
      setOtpError("Failed to verify code. Please try again.");
    } finally {
      setOtpLoading(false);
    }
  };

  // Order Tracking Handler
  const handleTrackOrders = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingEmail.trim()) {
      setTrackingError("Please enter the email address used for your order.");
      return;
    }
    setTrackingLoading(true);
    setTrackingError("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/chat/orders/track`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: trackingEmail.trim() })
      });
      const data = await res.json();
      if (res.ok && data.found) {
        setTrackingData(data);
      } else {
        setTrackingError(data.message || "No orders found matching this email.");
      }
    } catch (e) {
      setTrackingError("Failed to retrieve order tracking.");
    } finally {
      setTrackingLoading(false);
    }
  };

  // 1-Click Conversational In-App Razorpay Checkout
  const handleInstantBuy = async (product: any) => {
    if (!effectiveToken) {
      setPendingProductToBuy(product);
      setOtpError("");
      setShowOtpModal(true);
      return;
    }
    proceedWithCheckout(product, effectiveToken);
  };

  const proceedWithCheckout = async (product: any, activeToken: string) => {
    if (!scriptLoaded && !(window as any).Razorpay) {
      alert("Razorpay payment gateway is loading. Please retry in a few seconds.");
      return;
    }

    setInstantBuyingId(product.id);
    try {
      const apiUrl = getApiUrl();

      // 1. Create temporary direct cart for this single item
      const cartRes = await fetch(`${apiUrl}/api/cart/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({})
      });
      if (!cartRes.ok) throw new Error("Failed to create checkout cart");
      const cartData = await cartRes.json();

      // 2. Add product to the checkout cart
      await fetch(`${apiUrl}/api/cart/items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });

      // 3. Create Razorpay order
      const orderRes = await fetch(`${apiUrl}/api/orders/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cart_id: cartData.id })
      });
      if (!orderRes.ok) throw new Error("Failed to create Razorpay order");
      const orderData = await orderRes.json();

      // 4. Launch Razorpay Checkout Modal directly in the chat!
      const customerEmail = user?.email || guestCustomer?.email || otpEmail || "shopper@example.com";
      const customerName = user?.displayName || guestCustomer?.name || otpName || "Valued Customer";

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || "INR",
        name: merchantInfo?.name || "OmniCommerce Store",
        description: `Order for ${product.name}`,
        order_id: orderData.razorpay_order_id,
        handler: async function (response: any) {
          try {
            const verifyRes = await fetch(`${apiUrl}/api/orders/verify`, {
              method: "POST",
              headers: {
                "Authorization": `Bearer ${activeToken}`,
                "Content-Type": "application/json"
              },
              body: JSON.stringify({
                internal_order_id: orderData.internal_order_id,
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                signature: response.razorpay_signature
              })
            });
            const verifyData = await verifyRes.json();
            if (verifyData.success) {
              await refreshCartCount();
              setMessages(prev => [
                ...prev,
                {
                  role: "assistant",
                  text: `🎉 Payment Successful! Your order for "${product.name}" has been confirmed via Razorpay test-mode. Payment ID: ${response.razorpay_payment_id}. Your items are being prepared for shipping!`,
                  isSuccess: true
                }
              ]);

              // Notify host merchant website if embedded in an iframe!
              if (typeof window !== "undefined" && window.parent && window.parent !== window) {
                window.parent.postMessage({
                  type: "RAZORPAY_AI_ORDER_COMPLETED",
                  merchant_id: merchantParam,
                  order_id: response.razorpay_order_id,
                  payment_id: response.razorpay_payment_id,
                  amount: orderData.amount_paise / 100,
                  product_name: product.name
                }, "*");
              }
            } else {
              alert("Payment verification failed.");
            }
          } catch (e) {
            console.error(e);
            alert("Payment verification failed.");
          }
        },
        prefill: {
          email: customerEmail,
          name: customerName,
          contact: otpPhone || undefined
        },
        theme: { color: "#4f46e5" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err) {
      console.error(err);
      alert("Failed to initiate instant payment. Please try again.");
    } finally {
      setInstantBuyingId(null);
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
          thread_id: user?.uid || "guest_session",
          merchant_id: merchantParam
        })
      });
      
      if (!res.ok) throw new Error("Failed to process intent");
      
      const data = await res.json();
      
      const responseText = data.summary || (data.intent?.category 
        ? `I analyzed your intent for ${data.intent.category}${data.intent?.max_price ? ` under ₹${data.intent.max_price.toLocaleString()}` : ""}. Here are the best matched options:`
        : "Here are the most relevant items I found for your request:");

      const newMsg = { 
        role: "assistant", 
        text: responseText, 
        results: data.results || [],
        intent: data.intent,
        upsell: data.upsell,
        cross_sell: data.cross_sell,
        reasoning: data.reasoning
      };

      setMessages(prev => [...prev, newMsg]);

      if (voiceEnabled) {
        speakText(responseText);
      }
    } catch (err) {
      setMessages(prev => [...prev, { role: "assistant", text: "Sorry, I encountered an error processing your request. Please ensure the backend is active.", isError: true }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto flex flex-col h-[calc(100vh-130px)] bg-white rounded-3xl shadow-sm border border-slate-200 overflow-hidden">
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Header with Multi-Tenant Merchant Branding & Voice Controls */}
      <div className="p-4 px-6 border-b border-slate-100 bg-slate-50/80 backdrop-blur-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-gradient-to-tr from-indigo-600 to-blue-600 rounded-2xl flex items-center justify-center text-white shadow-sm shadow-indigo-500/20">
            <Bot className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="font-bold text-slate-900 text-base">
                {merchantInfo?.name || "OmniCommerce"} AI Shopping Concierge
              </h2>
              <span className="px-2 py-0.5 rounded-full bg-emerald-100 text-emerald-700 text-[10px] font-extrabold uppercase tracking-wide flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                Verified Merchant Store
              </span>
            </div>
            <p className="text-xs text-slate-500 flex items-center gap-1.5">
              <span>{merchantInfo?.product_count || 6} Catalog Items</span>
              <span>•</span>
              <span className="text-indigo-600 font-semibold">Razorpay Test Mode Active</span>
              <span>•</span>
              <span>Autonomous In-Chat Checkout</span>
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2.5">
          {/* Voice Output Toggle */}
          <button
            type="button"
            onClick={() => {
              if (isSpeaking) stopSpeaking();
              setVoiceEnabled(!voiceEnabled);
            }}
            className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
              voiceEnabled 
                ? "bg-indigo-600 text-white shadow-xs ring-2 ring-indigo-300" 
                : "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50"
            }`}
            title={voiceEnabled ? "Voice Output Active (Click to mute)" : "Enable Voice Output"}
          >
            {voiceEnabled ? <Volume2 className="w-3.5 h-3.5 text-white" /> : <VolumeX className="w-3.5 h-3.5 text-slate-400" />}
            <span className="hidden sm:inline">{voiceEnabled ? "Voice ON" : "Voice OFF"}</span>
          </button>

          {/* Order Tracking Button */}
          <button
            type="button"
            onClick={() => {
              setTrackingError("");
              setShowTrackingModal(true);
            }}
            className="px-3 py-1.5 bg-white text-slate-700 border border-slate-200 hover:bg-slate-50 rounded-xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            title="Track Order & Shipment Status"
          >
            <Truck className="w-3.5 h-3.5 text-indigo-600" />
            <span className="hidden sm:inline">Track Order</span>
          </button>

          {!user ? (
            <Link 
              href="/login"
              className="flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 bg-indigo-50 text-indigo-600 rounded-xl hover:bg-indigo-100 transition-colors border border-indigo-200/50"
            >
              <LogIn className="w-3.5 h-3.5" />
              <span>Sign In</span>
            </Link>
          ) : (
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-slate-800">{user.email}</p>
              <p className="text-[10px] text-emerald-600 font-bold">● Connected Customer</p>
            </div>
          )}
        </div>
      </div>
      
      {/* Chat Messages Area */}
      <div className="flex-grow overflow-y-auto p-6 space-y-6 bg-slate-50/40">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center space-y-6 py-8">
            <div className="w-16 h-16 bg-indigo-50 border border-indigo-100 rounded-3xl flex items-center justify-center text-indigo-600 shadow-sm">
              <Sparkles className="w-8 h-8" />
            </div>
            <div>
              <h3 className="text-2xl font-extrabold text-slate-900 mb-2">
                {merchantInfo ? `Welcome to ${merchantInfo.name}!` : "How can I help you shop today?"}
              </h3>
              <p className="text-slate-500 max-w-md mx-auto text-sm leading-relaxed">
                Describe the hardware specs, budget, or use case in plain language. The AI will curate, rank, and execute direct Razorpay checkout inside this chat.
              </p>
            </div>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 w-full max-w-xl mt-4">
              {suggestedPrompts.map((prompt, i) => (
                <button 
                  key={i} 
                  onClick={() => handleSend(prompt)}
                  className="p-4 text-xs font-semibold text-left bg-white border border-slate-200 rounded-2xl hover:border-indigo-400 hover:shadow-md transition-all text-slate-700 hover:text-indigo-600 group flex items-center justify-between"
                >
                  <span>"{prompt}"</span>
                  <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition-opacity text-indigo-600 shrink-0 ml-2" />
                </button>
              ))}
            </div>
          </div>
        ) : (
          messages.map((msg, idx) => (
            <div key={idx} className={`flex gap-3.5 ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
              <div className={`w-8 h-8 rounded-2xl flex-shrink-0 flex items-center justify-center shadow-xs ${
                msg.role === 'user' ? 'bg-slate-900 text-white' : msg.isSuccess ? 'bg-emerald-600 text-white' : 'bg-indigo-600 text-white'
              }`}>
                {msg.role === 'user' ? <UserIcon className="w-4 h-4" /> : msg.isSuccess ? <Check className="w-4 h-4" /> : <Bot className="w-4 h-4" />}
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
                    : msg.isSuccess
                      ? 'bg-emerald-50 text-emerald-900 border border-emerald-200 rounded-tl-none text-sm font-semibold shadow-xs'
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
                      const isInstantBuying = instantBuyingId === prod.id;

                      return (
                        <div key={prod.id} className="bg-white border border-slate-200 rounded-3xl overflow-hidden shadow-xs hover:shadow-lg hover:border-indigo-400 transition-all duration-200 flex flex-col justify-between group">
                          {/* Image & Badges */}
                          <div className="relative aspect-[16/10] bg-slate-50 flex items-center justify-center p-3 border-b border-slate-100 overflow-hidden">
                            {imageUrl ? (
                              <img src={imageUrl} alt={prod.name} className="h-full object-contain group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                                <Sparkles className="w-6 h-6" />
                              </div>
                            )}

                            {r.match_type === "BEST_MATCH" && (
                              <span className="absolute top-2.5 right-2.5 bg-emerald-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full shadow-xs flex items-center gap-1">
                                <Sparkles className="w-2.5 h-2.5" /> Best Match
                              </span>
                            )}
                            <span className="absolute top-2.5 left-2.5 bg-white/90 backdrop-blur-sm text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-md border border-slate-200 uppercase tracking-wide">
                              {prod.category}
                            </span>
                          </div>

                          {/* Content */}
                          <div className="p-4 flex-grow flex flex-col justify-between">
                            <div>
                              <h4 className="font-bold text-slate-900 text-sm mb-1 line-clamp-1 group-hover:text-indigo-600 transition-colors">
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

                              {/* Action Buttons: Instant Buy & Add to Cart */}
                              <div className="flex items-center gap-2 pt-1">
                                <button
                                  onClick={() => handleInstantBuy(prod)}
                                  disabled={isInstantBuying}
                                  className="flex-1 flex items-center justify-center gap-1.5 py-2 px-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50"
                                >
                                  {isInstantBuying ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                  ) : (
                                    <>
                                      <Zap className="w-3.5 h-3.5 fill-amber-300 text-amber-300" />
                                      <span>Buy Now</span>
                                    </>
                                  )}
                                </button>

                                <button
                                  onClick={() => handleAddToCart(prod)}
                                  disabled={isAdding}
                                  className={`p-2 rounded-xl text-xs font-bold transition-all ${
                                    isAdded 
                                      ? "bg-emerald-600 text-white" 
                                      : "bg-slate-100 hover:bg-slate-200 text-slate-700"
                                  }`}
                                  title="Add to Cart"
                                >
                                  {isAdding ? (
                                    <Loader2 className="w-4 h-4 animate-spin" />
                                  ) : isAdded ? (
                                    <Check className="w-4 h-4" />
                                  ) : (
                                    <ShoppingCart className="w-4 h-4" />
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
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-full text-xs font-semibold text-slate-600 transition-all"
                    >
                      🏷️ Check available offers
                    </button>
                    <button 
                      onClick={() => handleSend("Compare the top 2 products in detail")}
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-full text-xs font-semibold text-slate-600 transition-all"
                    >
                      ⚖️ Compare top 2 specs
                    </button>
                    <button 
                      onClick={() => handleSend("Show budget-friendly alternatives under ₹10,000")}
                      className="px-3 py-1 bg-white border border-slate-200 hover:border-indigo-400 hover:text-indigo-600 rounded-full text-xs font-semibold text-slate-600 transition-all"
                    >
                      💰 Under ₹10,000 options
                    </button>
                  </div>
                )}

              </div>
            </div>
          ))
        )}
        
        {loading && (
          <div className="flex gap-3.5">
            <div className="w-8 h-8 bg-indigo-600 rounded-2xl flex items-center justify-center text-white shadow-xs">
              <Bot className="w-4 h-4" />
            </div>
            <div className="bg-white border border-slate-200 rounded-3xl rounded-tl-none p-4 flex items-center gap-3 shadow-xs">
              <Loader2 className="w-4 h-4 animate-spin text-indigo-600" />
              <div className="space-y-0.5">
                <p className="text-xs font-bold text-slate-800">Agent Supervisor Reasoning...</p>
                <p className="text-[11px] text-slate-500">Extracting intent, scanning merchant catalog & validating policy guardrails</p>
              </div>
            </div>
          </div>
        )}
      </div>
      
      {/* Floating Speaking Indicator */}
      {isSpeaking && (
        <div className="mx-6 mb-2 p-3 bg-gradient-to-r from-slate-900 to-indigo-950 text-white rounded-2xl shadow-lg flex items-center justify-between border border-indigo-500/40 animate-pulse">
          <div className="flex items-center gap-2.5">
            <Radio className="w-4 h-4 text-indigo-400 animate-spin" />
            <span className="text-xs font-bold text-slate-100">Voice AI Speaking Response...</span>
          </div>
          <button 
            onClick={stopSpeaking} 
            className="text-[11px] bg-white/10 hover:bg-white/20 px-3 py-1 rounded-xl text-slate-200 hover:text-white font-bold transition-colors"
          >
            Mute Voice
          </button>
        </div>
      )}

      {/* Input Form */}
      <div className="p-4 bg-white border-t border-slate-100">
        <form 
          onSubmit={(e) => { e.preventDefault(); handleSend(input); }}
          className="flex gap-2 relative items-center"
        >
          {speechSupported && (
            <button
              type="button"
              onClick={isListening ? () => setIsListening(false) : startVoiceInput}
              className={`p-3 rounded-2xl transition-all flex items-center justify-center shrink-0 ${
                isListening 
                  ? "bg-rose-600 text-white animate-pulse shadow-lg shadow-rose-500/40 ring-4 ring-rose-200" 
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200 hover:text-indigo-600"
              }`}
              title={isListening ? "Listening... Speak now" : "Speak to Shopping Concierge"}
            >
              {isListening ? <Mic className="w-5 h-5 animate-bounce text-white" /> : <Mic className="w-5 h-5" />}
            </button>
          )}

          <div className="relative flex-grow">
            <input 
              type="text" 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : "Ask in plain language (or click mic to speak)..."}
              className={`w-full bg-slate-50 border rounded-2xl py-3.5 pl-4 pr-12 text-sm text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-600 focus:bg-white transition-all placeholder:text-slate-400 ${
                isListening ? "border-rose-400 bg-rose-50/20" : "border-slate-200"
              }`}
              disabled={loading}
            />
            <button 
              type="submit"
              disabled={loading || !input.trim()}
              className="absolute right-2 top-2 bottom-2 aspect-square bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl flex items-center justify-center transition-colors disabled:opacity-50 disabled:hover:bg-indigo-600 shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
      </div>

      {/* In-Chat OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-8 relative">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setPendingProductToBuy(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg text-center">Instant Checkout Verification</h3>
            <p className="text-xs text-slate-500 text-center mb-5">
              Zero passwords needed. Enter your details for automated order dispatch and delivery tracking.
            </p>

            {otpError && (
              <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Rahul Sharma"
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Address (For Invoice & Updates)</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. rahul@gmail.com"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Mobile Number (Optional for WhatsApp Alerts)</label>
                  <input
                    type="tel"
                    placeholder="e.g. +91 9876543210"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <button
                  type="button"
                  onClick={handleSendOtp}
                  disabled={otpLoading || !otpEmail.trim()}
                  className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 disabled:opacity-50"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  <span>Send 6-Digit Verification Code</span>
                </button>
              </div>
            ) : (
              <form onSubmit={handleVerifyOtp} className="space-y-4">
                <div className="bg-indigo-50/70 border border-indigo-100 rounded-2xl p-3 text-center">
                  <p className="text-xs text-indigo-900 font-semibold">Verification code sent to <strong>{otpEmail}</strong></p>
                  <p className="text-[11px] text-indigo-600 mt-0.5">Test Mode Code: <strong className="font-mono bg-white px-2 py-0.5 rounded border border-indigo-200">482910</strong></p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Enter 6-Digit Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    required
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value)}
                    placeholder="482910"
                    className="w-full text-center tracking-[0.3em] font-mono text-lg font-black px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setOtpSent(false)}
                    className="flex-1 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors"
                  >
                    Back
                  </button>
                  <button
                    type="submit"
                    disabled={otpLoading || otpCode.length < 6}
                    className="flex-2 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-500/20 flex items-center justify-center gap-1.5 disabled:opacity-50"
                  >
                    {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                    <span>Verify & Launch Razorpay</span>
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* In-Chat Order Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowTrackingModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                <Truck className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-slate-900 text-lg">Live Order & Shipment Tracking</h3>
                <p className="text-xs text-slate-500">Track shipments across BlueDart, Delhivery, and local fulfillment</p>
              </div>
            </div>

            <form onSubmit={handleTrackOrders} className="flex gap-2 mb-4">
              <input
                type="email"
                required
                placeholder="Enter order email address..."
                value={trackingEmail}
                onChange={(e) => setTrackingEmail(e.target.value)}
                className="flex-1 px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <button
                type="submit"
                disabled={trackingLoading}
                className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {trackingLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Search className="w-3.5 h-3.5" />}
                <span>Track</span>
              </button>
            </form>

            {trackingError && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-xl text-xs text-amber-800 mb-4">
                {trackingError}
              </div>
            )}

            {trackingData && trackingData.orders && (
              <div className="space-y-4">
                {trackingData.orders.map((ord: any) => (
                  <div key={ord.order_id} className="bg-slate-50 border border-slate-200 rounded-2xl p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div>
                        <span className="text-[11px] font-mono text-slate-400">Order #{ord.order_id.slice(0, 8)}</span>
                        <h4 className="font-extrabold text-slate-900 text-sm">₹{Number(ord.amount).toLocaleString()}</h4>
                      </div>
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-extrabold tracking-wide uppercase">
                        {ord.status}
                      </span>
                    </div>

                    <div className="grid grid-cols-3 gap-2 text-xs text-slate-600 bg-white p-2.5 rounded-xl border border-slate-100">
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Courier</p>
                        <p className="font-semibold text-slate-800 text-[11px] truncate">{ord.courier}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">AWB Number</p>
                        <p className="font-mono text-indigo-600 font-bold text-[11px] truncate">{ord.tracking_number}</p>
                      </div>
                      <div>
                        <p className="text-[10px] text-slate-400 uppercase font-bold">Expected</p>
                        <p className="font-semibold text-emerald-600 text-[11px] truncate">{ord.estimated_delivery}</p>
                      </div>
                    </div>

                    {/* Shipment Timeline */}
                    <div className="pt-2 border-t border-slate-200 space-y-2">
                      <p className="text-[11px] font-bold text-slate-700 uppercase">Live Shipment Milestones</p>
                      {ord.timeline.map((step: any, idx: number) => (
                        <div key={idx} className="flex items-start gap-2.5 text-xs">
                          <div className={`w-3.5 h-3.5 rounded-full mt-0.5 flex items-center justify-center shrink-0 ${
                            step.completed ? "bg-emerald-500 text-white" : "bg-slate-200 text-slate-400"
                          }`}>
                            {step.completed && <Check className="w-2.5 h-2.5" />}
                          </div>
                          <div>
                            <p className={`font-semibold ${step.completed ? "text-slate-900" : "text-slate-400"}`}>
                              {step.stage}
                            </p>
                            <p className="text-[11px] text-slate-500">{step.detail}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}