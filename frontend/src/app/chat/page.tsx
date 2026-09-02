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
import { Toast } from "@/components/ui/Toast";

function ChatContent() {
  const searchParams = useSearchParams();
  const merchantParam = searchParams.get("merchant") || "demo_merchant";
  const isEmbed = searchParams.get("embed") === "true";

  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => setToast({ message, type });
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
  
  // Toggle View: AI Concierge vs Store Catalog
  const [viewMode, setViewMode] = useState<"chat" | "catalog">("chat");
  const [catalogProducts, setCatalogProducts] = useState<any[]>([]);
  const [loadingCatalog, setLoadingCatalog] = useState(false);

  const fetchStoreCatalog = async () => {
    setLoadingCatalog(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/products/merchant/${merchantParam}`);
      if (res.ok) {
        const data = await res.json();
        setCatalogProducts(data);
      }
    } catch (err) {
      console.warn("Failed to fetch store catalog:", err);
    } finally {
      setLoadingCatalog(false);
    }
  };

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
    fetchStoreCatalog();
  }, [merchantParam]);

  useEffect(() => {
    if (typeof window !== "undefined" && ("webkitSpeechRecognition" in window || "SpeechRecognition" in window)) {
      setSpeechSupported(true);
    }
  }, []);

  // Auto-prompt Name & Email verification when customer lands via QR code or direct link
  useEffect(() => {
    if (typeof window !== "undefined") {
      const savedGuestToken = localStorage.getItem(`buyflow_token_${merchantParam}`);
      const savedName = localStorage.getItem("buyflow_customer_name");
      const savedEmail = localStorage.getItem("buyflow_customer_email");
      if (savedGuestToken) {
        setGuestVerifiedToken(savedGuestToken);
        if (savedName) setOtpName(savedName);
        if (savedEmail) setOtpEmail(savedEmail);
      } else if (!token) {
        // Customer scanned QR or clicked link: Prompt for name and email OTP verification
        setShowOtpModal(true);
      }
    }
  }, [token, merchantParam]);

  const startVoiceInput = () => {
    if (typeof window === "undefined") return;
    const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
    if (!SpeechRecognition) {
      showToast("Speech recognition is not supported on this browser. Please use Chrome, Edge, or Safari.", "info");
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
      showToast("Please sign in to add items to your cart.", "info");
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
        showToast(`Added ${product.title || product.name || "item"} to cart!`, "success");
        setTimeout(() => setAddedId(null), 2500);
      } else {
        showToast("Failed to add to cart.", "error");
      }
    } catch (e) {
      console.error(e);
      showToast("Failed to add to cart.", "error");
    } finally {
      setAddingId(null);
    }
  };

  // Effective authenticated token (User Login OR Verified Guest Session)
  const effectiveToken = token || guestVerifiedToken;

  // Send OTP for In-Chat Verification
  const handleSendOtp = async () => {
    if (!otpName.trim()) {
      setOtpError("Please enter your name.");
      return;
    }
    if (!otpEmail.trim() || !otpEmail.includes("@")) {
      setOtpError("Please enter a valid email address.");
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
          purpose: "CHECKOUT",
          merchant_id: merchantParam
        })
      });
      const data = await res.json();
      if (res.ok) {
        setOtpSent(true);
        showToast(`Verification code sent to ${otpEmail}!`, "success");
        if (data.otp_hint) {
          setOtpCode(data.otp_hint); // Pre-fill test OTP for instantaneous test flow
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
          phone: otpPhone.trim() || undefined,
          merchant_id: merchantParam
        })
      });
      const data = await res.json();
      if (res.ok && data.token) {
        setGuestVerifiedToken(data.token);
        setGuestCustomer(data.customer);
        if (typeof window !== "undefined") {
          localStorage.setItem(`buyflow_token_${merchantParam}`, data.token);
          localStorage.setItem("buyflow_customer_name", otpName.trim());
          localStorage.setItem("buyflow_customer_email", otpEmail.trim());
        }
        setShowOtpModal(false);
        setOtpSent(false);
        showToast("Email verified successfully!", "success");

        // Welcome message greeting customer by name
        setMessages(prev => [
          ...prev,
          {
            role: "assistant",
            text: `🎉 Welcome, ${otpName.trim()}! Your account is verified. I am your AI Shopping Concierge for ${merchantInfo?.name || "our store"}. What products are you looking for today? Tell me what you need or ask for recommendations!`
          }
        ]);

        // Auto-launch checkout if customer clicked "Buy Now"
        if (pendingProductToBuy) {
          const prod = pendingProductToBuy;
          setPendingProductToBuy(null);
          proceedWithCheckout(prod, data.token);
        }
      } else {
        setOtpError(data.detail || "Invalid code. Please enter the 6-digit code sent to your email.");
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
      showToast("Razorpay payment gateway is loading. Please retry in a few seconds.", "info");
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
      if (!cartRes.ok) {
        const errJson = await cartRes.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to create checkout cart");
      }
      const cartData = await cartRes.json();

      // 2. Add product to the checkout cart
      const itemRes = await fetch(`${apiUrl}/api/cart/items`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ product_id: product.id, quantity: 1 })
      });
      if (!itemRes.ok) {
        const errJson = await itemRes.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to add item to checkout cart");
      }

      // 3. Create Razorpay order
      const orderRes = await fetch(`${apiUrl}/api/orders/`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${activeToken}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ cart_id: cartData.id })
      });
      if (!orderRes.ok) {
        const errJson = await orderRes.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to create Razorpay order");
      }
      const orderData = await orderRes.json();

      // 4. Launch Razorpay Checkout Modal directly in the chat!
      const customerEmail = user?.email || guestCustomer?.email || otpEmail || "shopper@example.com";
      const customerName = user?.displayName || guestCustomer?.name || otpName || "Valued Customer";
      const prodName = product.title || product.name || "Product";

      const options = {
        key: orderData.key_id,
        amount: orderData.amount_paise,
        currency: orderData.currency || "INR",
        name: merchantInfo?.name || "BuyFlow Store",
        description: `Order for ${prodName}`,
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
                  text: `🎉 Payment Successful! Your order for "${prodName}" has been confirmed via Razorpay test-mode. Payment ID: ${response.razorpay_payment_id}. Your items are being prepared for shipping!`,
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
                  product_name: prodName
                }, "*");
              }
            } else {
              showToast("Payment verification failed.", "error");
            }
          } catch (e) {
            console.error(e);
            showToast("Payment verification failed.", "error");
          }
        },
        prefill: {
          email: customerEmail,
          name: customerName,
          contact: otpPhone || undefined
        },
        theme: { color: "#2563eb" }
      };

      const rzp = new (window as any).Razorpay(options);
      rzp.open();
    } catch (err: any) {
      console.error(err);
      showToast(err.message || "Failed to initiate instant payment. Please try again.", "error");
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

      const prods = data.results || data.products || [];

      const newMsg = { 
        role: "assistant", 
        text: responseText, 
        products: prods,
        results: prods,
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
    <div className={
      isEmbed 
        ? "w-full h-screen bg-slate-50 text-slate-900 flex flex-col justify-between overflow-hidden font-sans" 
        : "max-w-xl mx-auto flex flex-col h-[calc(100vh-30px)] my-auto bg-white text-slate-900 rounded-3xl border border-slate-200/90 shadow-2xl overflow-hidden font-sans"
    }>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Clean Light Header */}
      <div className="p-3 px-4 bg-white/95 border-b border-slate-100 backdrop-blur-md flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-2.5">
          {/* Avatar with Online Status */}
          <div className="relative">
            <div className="w-9 h-9 rounded-full bg-slate-100 border border-slate-200 p-0.5 shadow-xs flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BuyFlow" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="absolute bottom-0 right-0 w-2.5 h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"></span>
          </div>

          <div>
            <h3 className="font-extrabold text-slate-900 text-sm tracking-tight line-clamp-1">
              {merchantInfo?.name || "BuyFlow Store"}
            </h3>
            <p className="text-[11px] font-bold text-blue-600 flex items-center gap-1">
              <span>AI Shopping Concierge</span>
              <span className="text-emerald-500 font-normal">• Online</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-2">
          <div className="flex items-center bg-slate-100 p-1 rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("chat")}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "chat" 
                  ? "bg-white text-blue-600 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Chat</span>
            </button>
            <button
              type="button"
              onClick={() => {
                setViewMode("catalog");
                if (catalogProducts.length === 0) fetchStoreCatalog();
              }}
              className={`px-3 py-1 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
                viewMode === "catalog" 
                  ? "bg-white text-blue-600 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span>Catalog ({catalogProducts.length || merchantInfo?.product_count || 0})</span>
            </button>
          </div>

          {/* Track Orders Button */}
          <button
            type="button"
            onClick={() => {
              setTrackingError("");
              setShowTrackingModal(true);
            }}
            className="p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all"
            title="Track Orders"
          >
            <Truck className="w-4 h-4 text-blue-600" />
          </button>
        </div>
      </div>

      {/* Main Content Area */}
      {viewMode === "catalog" ? (
        <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-slate-50/60">
          <div className="flex items-center justify-between pb-3 border-b border-slate-200">
            <div>
              <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-1.5">
                <Store className="w-4 h-4 text-blue-600" />
                <span>{merchantInfo?.name || "Store"} Catalog</span>
              </h4>
              <p className="text-[11px] text-slate-500">Directly browse items or buy instantly</p>
            </div>
            <button
              onClick={() => setViewMode("chat")}
              className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
            >
              <Bot className="w-3.5 h-3.5" />
              <span>Back to Chat</span>
            </button>
          </div>

          {loadingCatalog ? (
            <div className="py-20 text-center">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600 mx-auto mb-2" />
              <p className="text-xs text-slate-500">Loading catalog items...</p>
            </div>
          ) : catalogProducts.length === 0 ? (
            <div className="py-16 text-center bg-white rounded-3xl border border-dashed border-slate-200 p-6">
              <Package className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-500 mb-3">No products available in this storefront yet.</p>
              <button
                onClick={() => setViewMode("chat")}
                className="px-4 py-2 bg-blue-600 text-white rounded-xl text-xs font-bold"
              >
                Ask AI Assistant Anything
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {catalogProducts.map((prod) => (
                <div key={prod.id} className="bg-white border border-slate-200/90 rounded-2xl p-3 flex flex-col justify-between group hover:border-blue-400 transition-all shadow-xs">
                  <div>
                    <div className="w-full h-32 bg-slate-100 rounded-xl mb-2.5 overflow-hidden flex items-center justify-center relative border border-slate-100">
                      {(prod.image_url || prod.metadata_?.image_url || prod.metadata?.image_url) ? (
                        <img 
                          src={prod.image_url || prod.metadata_?.image_url || prod.metadata?.image_url} 
                          alt={prod.title || prod.name} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                        />
                      ) : (
                        <Package className="w-8 h-8 text-slate-400" />
                      )}
                      <span className="absolute top-2 right-2 px-2 py-0.5 rounded-full text-[10px] font-bold bg-white/90 text-blue-700 border border-blue-100 shadow-xs">
                        {prod.category}
                      </span>
                    </div>
                    <h5 className="font-bold text-slate-900 text-xs mb-1 line-clamp-1 group-hover:text-blue-600 transition-colors">{prod.title || prod.name}</h5>
                    <p className="text-[11px] text-slate-500 line-clamp-2 mb-2 leading-relaxed">{prod.description || "High-performance tech item."}</p>
                  </div>

                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <div>
                      <p className="text-xs font-black text-slate-900">₹{Number(prod.price).toLocaleString("en-IN")}</p>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <button
                        onClick={() => {
                          setViewMode("chat");
                          handleSend(`Tell me more about the ${prod.title || prod.name} and why I should buy it.`);
                        }}
                        className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[11px] font-semibold transition-colors"
                      >
                        Ask AI
                      </button>
                      <button
                        onClick={() => handleInstantBuy(prod)}
                        disabled={instantBuyingId === prod.id}
                        className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-lg text-[11px] font-bold transition-all shadow-xs flex items-center gap-1"
                      >
                        {instantBuyingId === prod.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-white" />}
                        <span>Buy</span>
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        /* Focused Light Chat Stream */
        <div className="flex-grow overflow-y-auto p-4 space-y-3.5 bg-slate-50/50">
          {messages.length === 0 ? (
            /* Clean Light Welcome State */
            <div className="space-y-3.5 py-4">
              <div className="bg-white border border-slate-200/90 rounded-3xl p-5 text-center shadow-sm space-y-3">
                <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center shadow-xs">
                  <Sparkles className="w-5 h-5 text-blue-600" />
                </div>
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base mb-1">
                    Hi! How can I help you today? 👋
                  </h4>
                  <p className="text-xs text-slate-500 leading-relaxed max-w-sm mx-auto">
                    I'm the official AI concierge for <strong>{merchantInfo?.name || "this store"}</strong>. Ask about products, compare specs, find offers, or checkout with Razorpay.
                  </p>
                </div>
              </div>

              {/* Quick Suggestion Pills */}
              <div className="space-y-2">
                <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider pl-1">Suggested Inquiries</p>
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => handleSend("What are the best deals and recommended products?")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-all shadow-xs"
                  >
                    ⚡ Best deals & recommendations
                  </button>
                  <button
                    onClick={() => handleSend("Show me high-performance laptops under ₹100,000")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-all shadow-xs"
                  >
                    💻 Laptops under ₹100,000
                  </button>
                  <button
                    onClick={() => handleSend("Are there any active discounts or coupons available?")}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-all shadow-xs"
                  >
                    💰 Any active discounts?
                  </button>
                  <button
                    onClick={() => {
                      setTrackingError("");
                      setShowTrackingModal(true);
                    }}
                    className="px-3 py-1.5 rounded-xl bg-white hover:bg-blue-50 border border-slate-200 text-[11px] font-semibold text-slate-700 hover:text-blue-600 transition-all shadow-xs flex items-center gap-1"
                  >
                    <Truck className="w-3 h-3 text-blue-600" />
                    <span>Track my order</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            /* Active Messages */
            <div className="space-y-3.5">
              <div className="flex justify-center">
                <span className="text-[10px] bg-slate-200/70 text-slate-600 px-2.5 py-0.5 rounded-full font-medium">
                  Today
                </span>
              </div>

              {messages.map((msg, idx) => (
                <div key={idx} className={`flex gap-2.5 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                  {msg.role !== "user" && (
                    <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs mt-0.5">
                      <Bot className="w-3.5 h-3.5" />
                    </div>
                  )}

                  <div className={`max-w-[85%] ${msg.role === "user" ? "items-end" : "items-start"}`}>
                    {/* Reasoning Drawer */}
                    {msg.role === "assistant" && msg.reasoning && (
                      <div className="mb-1.5">
                        <button
                          onClick={() => toggleReasoning(idx)}
                          className="flex items-center gap-1 px-2 py-0.5 bg-slate-100 hover:bg-slate-200 border border-slate-200 rounded-lg text-[10px] font-semibold text-slate-600 transition-colors"
                        >
                          <Zap className="w-3 h-3 text-amber-500" />
                          <span>AI Reasoning</span>
                          {expandedReasoning[idx] ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                        </button>
                        {expandedReasoning[idx] && (
                          <div className="mt-1 p-2.5 bg-slate-900 text-slate-200 text-[10px] rounded-xl font-mono border border-slate-800 space-y-0.5">
                            <p className="text-emerald-400">✓ Category: {msg.reasoning.intent_extracted?.category || "general"}</p>
                            <p className="text-blue-400">✓ Policy: {msg.reasoning.policy_verification || "Server boundary verified"}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Message Bubble */}
                    <div className={`p-3.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                      msg.role === "user"
                        ? "bg-blue-600 text-white font-medium rounded-tr-xs"
                        : "bg-white border border-slate-200/90 text-slate-800 rounded-tl-xs"
                    }`}>
                      <p className="whitespace-pre-wrap">{msg.text}</p>
                      <span className={`text-[9px] block text-right mt-1 font-mono ${
                        msg.role === "user" ? "text-blue-200" : "text-slate-400"
                      }`}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Product Recommendations */}
                    {((msg.products && msg.products.length > 0) || (msg.results && msg.results.length > 0)) && (
                      <div className="mt-2.5 grid grid-cols-1 gap-2 w-full">
                        {(msg.products || msg.results).map((prod: any) => {
                          const prodImg = prod.image_url || prod.metadata_?.image_url || prod.metadata?.image_url;
                          const prodName = prod.title || prod.name;
                          return (
                            <div key={prod.id} className="bg-white border border-slate-200 rounded-2xl p-3 flex items-center justify-between gap-3 shadow-xs hover:border-blue-400 transition-colors">
                              <div className="flex items-center gap-2.5 min-w-0">
                                <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center">
                                  {prodImg ? (
                                    <img src={prodImg} alt={prodName} className="w-full h-full object-cover" />
                                  ) : (
                                    <Package className="w-5 h-5 text-slate-400" />
                                  )}
                                </div>
                                <div className="min-w-0">
                                  <h5 className="font-bold text-slate-900 text-xs truncate">{prodName}</h5>
                                  <p className="text-xs font-black text-blue-600">₹{Number(prod.price).toLocaleString("en-IN")}</p>
                                </div>
                              </div>

                              <div className="flex items-center gap-1.5 shrink-0">
                                <button
                                  type="button"
                                  onClick={() => handleInstantBuy(prod)}
                                  disabled={instantBuyingId === prod.id}
                                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1 shadow-xs"
                                >
                                  {instantBuyingId === prod.id ? <Loader2 className="w-3 h-3 animate-spin" /> : <Zap className="w-3 h-3 fill-white" />}
                                  <span>Buy Now</span>
                                </button>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                </div>
              ))}

              {/* Typing Animation when AI is replying */}
              {loading && (
                <div className="flex gap-2.5 justify-start items-center animate-in fade-in duration-200">
                  <div className="w-7 h-7 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs font-bold text-xs mt-0.5">
                    <Bot className="w-3.5 h-3.5" />
                  </div>
                  <div className="bg-white border border-slate-200/90 rounded-2xl rounded-tl-xs px-4 py-3 shadow-xs flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.3s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce [animation-delay:-0.15s]"></span>
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-bounce"></span>
                    <span className="text-[11px] font-medium text-slate-400 ml-1.5">BuyFlow Concierge is replying...</span>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Clean Light Input Bar */}
      <div className="p-3 bg-white border-t border-slate-100 shrink-0">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
          <div className="relative flex items-center bg-slate-100 border border-slate-200/90 rounded-full px-3 py-1 focus-within:border-blue-500 focus-within:bg-white transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : "Type your message..."}
              className="flex-1 bg-transparent px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none"
            />

            {/* Voice Input */}
            {speechSupported && (
              <button
                type="button"
                onClick={startVoiceInput}
                className={`p-2 rounded-full mr-1 transition-all ${
                  isListening ? "bg-rose-600 text-white animate-pulse" : "text-slate-500 hover:text-blue-600 hover:bg-slate-200"
                }`}
                title="Voice input"
              >
                <Mic className="w-4 h-4" />
              </button>
            )}

            {/* Send Button */}
            <button
              type="submit"
              disabled={loading || !input.trim()}
              className="p-2 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-xs"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-1.5 font-medium">
          Powered by BuyFlow AI Commerce
        </p>
      </div>

      {/* In-Chat OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative text-slate-900">
            <button
              onClick={() => {
                setShowOtpModal(false);
                setPendingProductToBuy(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-xs">
              <KeyRound className="w-6 h-6" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-lg text-center">
              Welcome to {merchantInfo?.name || "BuyFlow Store"}
            </h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              Enter your name and email to receive your OTP code and unlock personalized AI shopping concierge access.
            </p>

            {otpError && (
              <div className="mb-3 p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium text-center">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Your Full Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Manav Nagpal"
                    value={otpName}
                    onChange={(e) => setOtpName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Email Address (for OTP)</label>
                  <input
                    type="email"
                    required
                    placeholder="e.g. customer@gmail.com"
                    value={otpEmail}
                    onChange={(e) => setOtpEmail(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Phone Number (Optional)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9876543210"
                    value={otpPhone}
                    onChange={(e) => setOtpPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors"
                  />
                </div>

                <button
                  type="button"
                  disabled={otpLoading || !otpEmail.trim() || !otpName.trim()}
                  onClick={handleSendOtp}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 mt-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Send Verification OTP</span>
                </button>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="text-center p-3 bg-slate-50 rounded-2xl border border-slate-200">
                  <p className="text-xs text-slate-600">Enter the 6-digit code sent to</p>
                  <p className="text-xs font-bold text-blue-600 font-mono mt-0.5">{otpEmail}</p>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1 text-center">6-Digit Verification Code</label>
                  <input
                    type="text"
                    maxLength={6}
                    value={otpCode}
                    onChange={(e) => setOtpCode(e.target.value.trim())}
                    placeholder="• • • • • •"
                    className="w-full text-center tracking-[0.4em] text-xl font-mono py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-blue-600 focus:outline-none focus:border-blue-500 focus:bg-white transition-all font-black"
                  />
                </div>

                <button
                  type="button"
                  disabled={otpLoading || otpCode.length < 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 shadow-md shadow-blue-500/20 disabled:opacity-50 cursor-pointer"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Verify & Start Shopping</span>
                </button>

                <div className="flex items-center justify-between pt-2 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpCode("");
                    }}
                    className="text-slate-500 hover:text-blue-600 font-medium"
                  >
                    ← Edit email
                  </button>

                  <button
                    type="button"
                    disabled={otpLoading}
                    onClick={handleSendOtp}
                    className="text-blue-600 hover:underline font-bold"
                  >
                    Resend Code
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Order Tracking Modal */}
      {showTrackingModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 relative text-slate-900 max-h-[85vh] overflow-y-auto">
            <button
              onClick={() => {
                setShowTrackingModal(false);
                setTrackingData(null);
              }}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="w-11 h-11 bg-blue-50 text-blue-600 rounded-2xl mx-auto flex items-center justify-center mb-2.5">
              <Truck className="w-5 h-5" />
            </div>

            <h3 className="font-extrabold text-slate-900 text-base text-center">Track Your Orders</h3>
            <p className="text-xs text-slate-500 text-center mb-4">
              Enter your email address to look up live courier tracking status.
            </p>

            <div className="flex gap-2 mb-3">
              <input
                type="email"
                placeholder="Enter your email..."
                value={trackingEmail}
                onChange={(e) => setTrackingEmail(e.target.value)}
                className="flex-1 px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
              />
              <button
                type="button"
                disabled={trackingLoading || !trackingEmail.trim()}
                onClick={handleTrackOrders}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {trackingLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Track"}
              </button>
            </div>

            {trackingError && (
              <div className="p-2.5 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 mb-3 font-medium">
                {trackingError}
              </div>
            )}

            {trackingData && (
              <div className="space-y-2.5 pt-2 border-t border-slate-100">
                <p className="text-xs text-slate-600 font-bold">Found {trackingData.orders?.length || 0} order(s):</p>
                {trackingData.orders?.map((ord: any) => (
                  <div key={ord.id} className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-1.5">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-mono text-blue-600 font-bold">{ord.id}</span>
                      <span className="text-emerald-600 font-extrabold">₹{ord.amount}</span>
                    </div>
                    <p className="text-[11px] text-slate-600">Carrier: {ord.shipping?.carrier} • AWB: {ord.shipping?.tracking_number}</p>
                    <p className="text-[11px] text-indigo-600 font-semibold">Status: {ord.shipping?.status}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* In-App Toast Notification */}
      {toast && (
        <Toast
          message={toast.message}
          type={toast.type}
          onClose={() => setToast(null)}
        />
      )}

    </div>
  );
}

export default function ChatPage() {
  return (
    <Suspense fallback={
      <div className="flex justify-center items-center h-[70vh]">
        <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
      </div>
    }>
      <ChatContent />
    </Suspense>
  );
}
