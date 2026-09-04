"use client";

import { useState, useEffect, Suspense } from "react";
import { useSearchParams } from "next/navigation";
import Script from "next/script";
import Link from "next/link";
import { 
  Send, Loader2, Bot, User, User as UserIcon, Sparkles, LogIn, ArrowRight, 
  ShieldCheck, CheckCircle2, ShoppingCart, Zap, Check, ChevronDown, ChevronUp, Store, ExternalLink,
  Mic, MicOff, Volume2, VolumeX, Radio, Truck, Package, MapPin, Calendar, KeyRound, X, Search, Mail, Phone
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import { Toast } from "@/components/ui/Toast";
import { FormattedChatMessage, toDisplayText } from "@/components/FormattedChatMessage";

const asArray = (value: unknown): any[] => Array.isArray(value) ? value : [];

const normalizeOffer = (value: unknown) => {
  if (!value || typeof value !== "object" || Array.isArray(value)) return null;
  const offer = value as Record<string, any>;
  return {
    ...offer,
    title: toDisplayText(offer.title || "Verified Store Offer"),
    code: toDisplayText(offer.code || "STOREOFFER"),
    description: toDisplayText(offer.description || ""),
    discount_percent: Number(offer.discount_percent ?? offer.discount ?? 0),
  };
};

function ChatContent() {
  const searchParams = useSearchParams();
  const [activeMerchantId, setActiveMerchantId] = useState<string>(() => {
    if (typeof window !== "undefined") {
      const urlMerchant = new URLSearchParams(window.location.search).get("merchant");
      if (urlMerchant) return urlMerchant;
      const stored = localStorage.getItem("buyflow_active_merchant_id") || localStorage.getItem("buyflow_merchant_id");
      if (stored && stored !== "demo_merchant") return stored;
    }
    return "demo_merchant";
  });
  
  useEffect(() => {
    const fromUrl = searchParams.get("merchant");
    if (fromUrl) {
      setActiveMerchantId(fromUrl);
    } else {
      const fromStorage = localStorage.getItem("buyflow_active_merchant_id") || localStorage.getItem("buyflow_merchant_id");
      if (fromStorage && fromStorage !== "demo_merchant") setActiveMerchantId(fromStorage);
    }
  }, [searchParams]);

  const merchantParam = searchParams.get("merchant") || activeMerchantId;
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
  const [appliedPromo, setAppliedPromo] = useState<any>(null);
  const { user, token, refreshCartCount } = useAuth();

  // In-Chat OTP Authentication & Frictionless Guest Checkout States
  const [guestVerifiedToken, setGuestVerifiedToken] = useState<string | null>(null);
  const [guestCustomer, setGuestCustomer] = useState<any>(null);
  const [showOtpModal, setShowOtpModal] = useState(false);
  const [otpEmail, setOtpEmail] = useState("");
  const [otpName, setOtpName] = useState("");
  const [otpPhone, setOtpPhone] = useState("");
  const [otpCode, setOtpCode] = useState("");
  const [otpDigits, setOtpDigits] = useState<string[]>(["", "", "", "", "", ""]);
  const [resendCooldown, setResendCooldown] = useState(0);
  const [otpSent, setOtpSent] = useState(false);
  const [otpLoading, setOtpLoading] = useState(false);
  const [otpError, setOtpError] = useState("");
  const [pendingProductToBuy, setPendingProductToBuy] = useState<any>(null);

  useEffect(() => {
    if (resendCooldown > 0) {
      const timer = setTimeout(() => setResendCooldown((prev) => prev - 1), 1000);
      return () => clearTimeout(timer);
    }
  }, [resendCooldown]);

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
      } else {
        // Customer scanned QR or opened storefront link: Prompt for name and email OTP verification
        setShowOtpModal(true);
      }
    }
  }, [merchantParam]);

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
        setOtpDigits(["", "", "", "", "", ""]);
        setOtpCode("");
        setResendCooldown(60);
        showToast(`Verification code sent to ${otpEmail}! Check your inbox.`, "success");
        setTimeout(() => {
          const firstInput = document.getElementById("otp-digit-0");
          firstInput?.focus();
        }, 150);
      } else {
        setOtpError(data.detail || "Failed to send verification code.");
      }
    } catch (e) {
      setOtpError("Connection error while sending verification code.");
    } finally {
      setOtpLoading(false);
    }
  };

  const handleDigitChange = (index: number, val: string) => {
    const clean = val.replace(/\D/g, "");
    const newDigits = [...otpDigits];
    
    // Handle pasting 6 digits
    if (clean.length > 1) {
      const chars = clean.slice(0, 6).split("");
      for (let i = 0; i < 6; i++) {
        newDigits[i] = chars[i] || "";
      }
      setOtpDigits(newDigits);
      setOtpCode(newDigits.join(""));
      const targetIdx = Math.min(chars.length, 5);
      const nextEl = document.getElementById(`otp-digit-${targetIdx}`);
      nextEl?.focus();
      return;
    }

    newDigits[index] = clean;
    setOtpDigits(newDigits);
    setOtpCode(newDigits.join(""));

    if (clean && index < 5) {
      const nextEl = document.getElementById(`otp-digit-${index + 1}`);
      nextEl?.focus();
    }
  };

  const handleDigitKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !otpDigits[index] && index > 0) {
      const prevEl = document.getElementById(`otp-digit-${index - 1}`);
      prevEl?.focus();
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
    const actualProd = product.product || product;
    if (!effectiveToken) {
      setPendingProductToBuy(actualProd);
      setOtpError("");
      setShowOtpModal(true);
      return;
    }
    proceedWithCheckout(actualProd, effectiveToken);
  };

  const proceedWithCheckout = async (product: any, activeToken: string) => {
    const actualProd = product.product || product;
    const prodId = actualProd.id || product.id;

    if (!scriptLoaded && !(window as any).Razorpay) {
      showToast("Razorpay payment gateway is loading. Please retry in a few seconds.", "info");
      return;
    }

    setInstantBuyingId(prodId);
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
        body: JSON.stringify({ product_id: prodId, quantity: 1 })
      });
      if (!itemRes.ok) {
        const errJson = await itemRes.json().catch(() => ({}));
        throw new Error(errJson.detail || "Failed to add item to checkout cart");
      }

      // 2.5 Auto-apply active promo code if available
      if (appliedPromo?.code) {
        try {
          await fetch(`${apiUrl}/api/cart/${cartData.id}/apply-promo`, {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${activeToken}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({ code: appliedPromo.code })
          });
        } catch (e) {
          console.warn("Auto-applied promo note:", e);
        }
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

      const responseText = toDisplayText(data.summary || data.message || data.response || (data.intent?.category
        ? `I analyzed your intent for ${data.intent.category}${data.intent?.max_price ? ` under ₹${data.intent.max_price.toLocaleString()}` : ""}. Here are the best matched options:`
        : "Here are the most relevant items I found for your request:"));

      const prods = asArray(data.results).length > 0 ? asArray(data.results) : asArray(data.products);
      const safeOffer = normalizeOffer(data.offer);

      const newMsg = { 
        role: "assistant", 
        text: responseText, 
        products: prods,
        results: prods,
        alternatives: asArray(data.alternatives),
        intent: data.intent && typeof data.intent === "object" ? data.intent : null,
        upsell: data.upsell && typeof data.upsell === "object" ? data.upsell : null,
        cross_sell: data.cross_sell && typeof data.cross_sell === "object" ? data.cross_sell : null,
        offer: safeOffer,
        reasoning: data.reasoning && typeof data.reasoning === "object" ? data.reasoning : null
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
        ? "w-full h-[100dvh] bg-slate-50 text-slate-900 flex flex-col justify-between overflow-hidden font-sans" 
        : "w-full max-w-xl mx-auto flex flex-col h-[100dvh] sm:h-[calc(100vh-32px)] sm:my-auto bg-white text-slate-900 sm:rounded-3xl sm:border sm:border-slate-200/90 sm:shadow-2xl overflow-hidden font-sans"
    }>
      <Script 
        src="https://checkout.razorpay.com/v1/checkout.js" 
        strategy="lazyOnload"
        onLoad={() => setScriptLoaded(true)}
      />

      {/* Clean Light Mobile-First Header */}
      <div className="p-2.5 sm:p-3 px-3 sm:px-4 bg-white/95 border-b border-slate-100 backdrop-blur-md flex items-center justify-between shrink-0 z-20 shadow-xs">
        <div className="flex items-center gap-2 sm:gap-2.5 min-w-0">
          {/* Avatar with Online Status */}
          <div className="relative shrink-0">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-full bg-slate-100 border border-slate-200 p-0.5 shadow-xs flex items-center justify-center overflow-hidden">
              <img src="/logo.png" alt="BuyFlow" className="w-full h-full object-contain rounded-full" />
            </div>
            <span className="absolute bottom-0 right-0 w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full bg-emerald-500 ring-2 ring-white animate-pulse"></span>
          </div>

          <div className="min-w-0">
            <h3 className="font-black text-slate-900 text-xs sm:text-sm tracking-tight truncate">
              {merchantInfo?.name || "BuyFlow Store"}
            </h3>
            <p className="text-[10px] sm:text-[11px] font-bold text-blue-600 flex items-center gap-1 truncate">
              <span>AI Concierge</span>
              <span className="text-emerald-500 font-normal">• Online</span>
            </p>
          </div>
        </div>

        {/* View Switcher & Actions */}
        <div className="flex items-center gap-1 sm:gap-2 shrink-0">
          <div className="flex items-center bg-slate-100 p-0.5 sm:p-1 rounded-xl sm:rounded-2xl border border-slate-200/80">
            <button
              type="button"
              onClick={() => setViewMode("chat")}
              className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
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
              className={`px-2.5 sm:px-3 py-1 rounded-lg sm:rounded-xl text-[11px] sm:text-xs font-bold transition-all flex items-center gap-1 ${
                viewMode === "catalog" 
                  ? "bg-white text-blue-600 shadow-xs" 
                  : "text-slate-600 hover:text-slate-900"
              }`}
            >
              <Store className="w-3.5 h-3.5" />
              <span className="hidden xs:inline">Catalog</span>
              <span className="text-[10px] opacity-75">({catalogProducts.length || merchantInfo?.product_count || 0})</span>
            </button>
          </div>

          {/* Track Orders Button */}
          <button
            type="button"
            onClick={() => {
              setTrackingError("");
              setShowTrackingModal(true);
            }}
            className="p-1.5 sm:p-2 rounded-xl bg-slate-50 border border-slate-200 text-slate-600 hover:text-blue-600 hover:border-blue-200 transition-all cursor-pointer"
            title="Track Orders"
          >
            <Truck className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-blue-600" />
          </button>

          {/* Customer OTP Verification Badge / Button */}
          <button
            type="button"
            onClick={() => {
              setOtpError("");
              setShowOtpModal(true);
            }}
            className={`flex items-center gap-1 px-2 sm:px-2.5 py-1 sm:py-1.5 rounded-xl border text-[11px] sm:text-xs font-bold transition-all cursor-pointer ${
              guestVerifiedToken
                ? "bg-emerald-50 text-emerald-700 border-emerald-200 hover:bg-emerald-100"
                : "bg-blue-50 text-blue-600 border-blue-200 hover:bg-blue-100 animate-pulse"
            }`}
            title={guestVerifiedToken ? `Verified as ${otpName || "Customer"}` : "Verify Customer OTP"}
          >
            <KeyRound className="w-3.5 h-3.5" />
            <span className="truncate max-w-[65px] sm:max-w-none">{guestVerifiedToken ? (otpName?.split(" ")[0] || "Verified") : "Verify"}</span>
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
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Best deals & recommendations</span>
                  </button>
                  <button
                    onClick={() => handleSend("Show me high-performance laptops under ₹100,000")}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Package className="w-3.5 h-3.5 text-indigo-600" />
                    <span>Laptops under ₹100,000</span>
                  </button>
                  <button
                    onClick={() => handleSend("Are there any active discounts or campaigns available?")}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Zap className="w-3.5 h-3.5 text-amber-500" />
                    <span>Active discounts & offers</span>
                  </button>
                  <button
                    onClick={() => {
                      setTrackingError("");
                      setShowTrackingModal(true);
                    }}
                    className="px-3.5 py-2 rounded-xl bg-white hover:bg-indigo-50 border border-slate-200/90 hover:border-indigo-300 text-xs font-semibold text-slate-700 hover:text-indigo-600 transition-all shadow-xs flex items-center gap-1.5 cursor-pointer"
                  >
                    <Truck className="w-3.5 h-3.5 text-indigo-600" />
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
                            <p className="text-emerald-400">✓ Category: {toDisplayText(msg.reasoning.intent_extracted?.category || "general")}</p>
                            <p className="text-blue-400">✓ Policy: {toDisplayText(msg.reasoning.policy_verification || "Server boundary verified")}</p>
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
                      <FormattedChatMessage text={msg.text} isUser={msg.role === "user"} />
                      
                      {/* Autonomous Offer / Discount Badge */}
                      {msg.offer && (
                        <div className="mt-3 p-2.5 px-3 bg-gradient-to-r from-emerald-50 to-teal-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-2 shadow-xs">
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-base shrink-0">🏷️</span>
                            <div className="min-w-0">
                              <p className="font-black text-emerald-900 text-xs truncate">
                                {toDisplayText(msg.offer.title)} ({toDisplayText(msg.offer.code)})
                              </p>
                              <p className="text-[10px] text-emerald-700 font-medium">
                                {toDisplayText(msg.offer.description || `${msg.offer.discount_percent}% discount automatically verified`)}
                              </p>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => {
                              setAppliedPromo(msg.offer);
                              showToast(`Applied coupon ${toDisplayText(msg.offer.code)} (${Number(msg.offer.discount_percent || 0)}% off)!`, "success");
                            }}
                            className={`px-3 py-1 rounded-lg text-[11px] font-bold shrink-0 transition-all cursor-pointer shadow-xs ${
                              appliedPromo?.code === msg.offer.code
                                ? "bg-emerald-700 text-white"
                                : "bg-emerald-600 hover:bg-emerald-500 text-white"
                            }`}
                          >
                            {appliedPromo?.code === msg.offer.code ? "✓ Active" : "Apply Code"}
                          </button>
                        </div>
                      )}

                      <span className={`text-[9px] block text-right mt-1 font-mono ${
                        msg.role === "user" ? "text-blue-200" : "text-slate-400"
                      }`}>
                        {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>

                    {/* Product Recommendations */}
                    {((msg.products && msg.products.length > 0) || (msg.results && msg.results.length > 0)) && (
                      <div className="mt-2.5 grid grid-cols-1 gap-2.5 w-full">
                        {asArray(msg.products || msg.results)
                          .filter((rawProd: any) => {
                            const rawRecord = rawProd && typeof rawProd === "object" ? rawProd : {};
                            const prod = rawRecord.product && typeof rawRecord.product === "object" ? rawRecord.product : rawRecord;
                            return prod && (prod.name || prod.title || prod.id);
                          })
                          .map((rawProd: any, idx: number) => {
                            const rawRecord = rawProd && typeof rawProd === "object" ? rawProd : {};
                            const prod = rawRecord.product && typeof rawRecord.product === "object" ? rawRecord.product : rawRecord;
                            const prodId = toDisplayText(prod.id || rawRecord.id || `prod_${idx}`);
                            const prodImg = toDisplayText(prod.image_url || prod.metadata_?.image_url || prod.metadata?.image_url || rawRecord.image_url);
                            const prodName = toDisplayText(prod.name || prod.title || rawRecord.name || "Featured Product");
                            const prodPrice = Number(prod.price ?? rawRecord.price ?? 0);
                            const prodReason = toDisplayText(rawRecord.reasons?.[0] || prod.description || "");
                            const formattedPrice = isNaN(prodPrice) ? "0" : prodPrice.toLocaleString("en-IN");
                            const matchBadge = rawRecord.match_type === "BEST_MATCH" ? "Best Match" : (rawRecord.match_type === "ALTERNATIVE" ? "Top Pick" : null);

                            return (
                              <div 
                                key={prodId} 
                                className="bg-white border border-slate-200/90 hover:border-blue-500 rounded-2xl p-3 sm:p-3.5 flex flex-col xs:flex-row items-start xs:items-center justify-between gap-2.5 sm:gap-3.5 shadow-sm hover:shadow-md transition-all group"
                              >
                                <div className="flex items-center gap-2.5 sm:gap-3 min-w-0 flex-1 w-full">
                                  <div className="w-12 h-12 sm:w-14 sm:h-14 bg-slate-100 rounded-xl overflow-hidden shrink-0 border border-slate-100 flex items-center justify-center relative">
                                    {prodImg ? (
                                      <img src={prodImg} alt={prodName} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                                    ) : (
                                      <Package className="w-5 h-5 text-slate-400" />
                                    )}
                                  </div>
                                  <div className="min-w-0 flex-1">
                                    <div className="flex items-center gap-1.5 flex-wrap">
                                      <h5 className="font-bold text-slate-900 text-xs sm:text-sm truncate leading-snug group-hover:text-blue-600 transition-colors">
                                        {prodName}
                                      </h5>
                                      {matchBadge && (
                                        <span className="px-1.5 py-0.5 bg-blue-50 text-blue-700 border border-blue-200 text-[9px] font-bold rounded-md uppercase tracking-wider">
                                          {matchBadge}
                                        </span>
                                      )}
                                    </div>
                                    {prodReason && (
                                      <p className="text-[10px] sm:text-[11px] text-slate-500 line-clamp-1 mt-0.5 font-medium">
                                        {prodReason}
                                      </p>
                                    )}
                                    <div className="flex items-center gap-2 mt-0.5 sm:mt-1">
                                      <p className="text-xs sm:text-sm font-black text-blue-600">
                                        ₹{formattedPrice}
                                      </p>
                                      {prod.category && (
                                        <span className="px-1.5 py-0.5 bg-slate-100 text-slate-600 text-[9px] sm:text-[10px] font-semibold rounded-md uppercase tracking-wider truncate max-w-[100px]">
                                          {toDisplayText(prod.category)}
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-2 w-full xs:w-auto shrink-0 justify-end pt-1 xs:pt-0 border-t xs:border-t-0 border-slate-100">
                                  <button
                                    type="button"
                                    onClick={() => handleInstantBuy(prod)}
                                    disabled={instantBuyingId === prodId}
                                    className="w-full xs:w-auto px-3.5 py-1.5 sm:py-2 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-xs shadow-blue-500/20 active:scale-95 cursor-pointer disabled:opacity-50 min-h-[36px]"
                                  >
                                    {instantBuyingId === prodId ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Zap className="w-3.5 h-3.5 fill-white" />}
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

      {/* Active Promo Notification Bar */}
      {appliedPromo && (
        <div className="px-3.5 py-1.5 bg-gradient-to-r from-emerald-500 to-teal-600 text-white flex items-center justify-between text-xs font-bold shadow-xs animate-in slide-in-from-bottom-2">
          <div className="flex items-center gap-2 min-w-0">
            <span>🏷️</span>
            <span className="truncate">Promo Active: <span className="font-mono bg-white/20 px-1.5 py-0.5 rounded text-[11px]">{appliedPromo.code}</span> ({appliedPromo.discount_percent}% off applied at checkout)</span>
          </div>
          <button
            type="button"
            onClick={() => {
              setAppliedPromo(null);
              showToast("Promo code removed.", "info");
            }}
            className="text-[11px] text-white/80 hover:text-white underline cursor-pointer shrink-0 ml-2"
          >
            Remove
          </button>
        </div>
      )}

      {/* Clean Light Mobile-First Input Bar */}
      <div className="p-2.5 sm:p-3 bg-white border-t border-slate-100 shrink-0 pb-safe">
        <form onSubmit={(e) => { e.preventDefault(); handleSend(input); }}>
          <div className="relative flex items-center bg-slate-100 border border-slate-200/90 rounded-full px-2.5 sm:px-3 py-0.5 sm:py-1 focus-within:border-blue-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-blue-500/15 transition-all shadow-inner">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={isListening ? "Listening to your voice..." : "Type your message..."}
              className="flex-1 bg-transparent px-2.5 sm:px-3 py-2 text-sm sm:text-xs text-slate-900 placeholder-slate-400 focus:outline-none min-h-[38px] sm:min-h-[40px]"
            />

            {/* Voice Input */}
            {speechSupported && (
              <button
                type="button"
                onClick={startVoiceInput}
                className={`p-2 rounded-full mr-1 transition-all shrink-0 cursor-pointer ${
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
              className="p-2 sm:p-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-bold transition-all disabled:opacity-40 disabled:hover:bg-blue-600 shadow-xs shrink-0 cursor-pointer"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
            </button>
          </div>
        </form>
        <p className="text-[10px] text-slate-400 text-center mt-1 font-medium">
          Powered by BuyFlow AI Commerce
        </p>
      </div>

      {/* In-Chat OTP Verification Modal */}
      {showOtpModal && (
        <div className="fixed inset-0 bg-slate-950/70 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 z-50 animate-in fade-in duration-200 overflow-y-auto">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-100 max-w-sm sm:max-w-md w-full p-4 sm:p-7 relative text-slate-900 animate-in zoom-in-95 duration-200 overflow-hidden my-auto">
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-blue-500/10 rounded-full blur-2xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-indigo-500/10 rounded-full blur-2xl pointer-events-none"></div>

            <button
              onClick={() => {
                setShowOtpModal(false);
                setPendingProductToBuy(null);
              }}
              className="absolute top-3 right-3 sm:top-4 sm:right-4 text-slate-400 hover:text-slate-600 p-2 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Glowing Icon Header */}
            <div className="text-center mb-4 sm:mb-5">
              <div className="w-12 h-12 sm:w-14 sm:h-14 bg-gradient-to-tr from-blue-600 via-indigo-600 to-violet-600 text-white rounded-2xl mx-auto flex items-center justify-center mb-2.5 sm:mb-3 shadow-lg shadow-blue-500/25 ring-4 ring-blue-50">
                <KeyRound className="w-6 h-6 sm:w-7 sm:h-7" />
              </div>

              <div className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-extrabold uppercase tracking-wider mb-1 border border-blue-100">
                <Sparkles className="w-3 h-3 text-blue-600" />
                <span>Verified Shopper Access</span>
              </div>

              <h3 className="font-black text-slate-900 text-lg sm:text-xl tracking-tight">
                {merchantInfo?.name || "BuyFlow Store"}
              </h3>
              <p className="text-[11px] sm:text-xs text-slate-500 mt-1 max-w-xs mx-auto font-medium leading-relaxed">
                Enter your details to receive an instant verification code and unlock your AI shopping concierge.
              </p>
            </div>

            {otpError && (
              <div className="mb-3.5 p-2.5 sm:p-3 bg-rose-50 border border-rose-200/80 rounded-2xl text-xs text-rose-700 font-semibold text-center animate-in shake">
                {otpError}
              </div>
            )}

            {!otpSent ? (
              <div className="space-y-3">
                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Full Name</label>
                  <div className="relative">
                    <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="text"
                      required
                      placeholder="e.g. Manav Nagpal"
                      value={otpName}
                      onChange={(e) => setOtpName(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Email Address (for OTP)</label>
                  <div className="relative">
                    <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="email"
                      required
                      placeholder="e.g. customer@gmail.com"
                      value={otpEmail}
                      onChange={(e) => setOtpEmail(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">Phone Number (Optional)</label>
                  <div className="relative">
                    <Phone className="w-4 h-4 text-slate-400 absolute left-3.5 top-3.5" />
                    <input
                      type="tel"
                      placeholder="e.g. 09896817707"
                      value={otpPhone}
                      onChange={(e) => setOtpPhone(e.target.value)}
                      className="w-full pl-10 pr-3.5 py-2.5 sm:py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm sm:text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white focus:ring-4 focus:ring-blue-500/10 transition-all font-medium"
                    />
                  </div>
                </div>

                <button
                  type="button"
                  disabled={otpLoading || !otpEmail.trim() || !otpName.trim()}
                  onClick={handleSendOtp}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] min-h-[44px]"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <KeyRound className="w-4 h-4" />}
                  <span>Send Verification Code</span>
                </button>

                <p className="text-[10px] text-slate-400 text-center font-medium pt-0.5">
                  🔒 Encrypted authentication • Instant order tracking enabled
                </p>
              </div>
            ) : (
              <div className="space-y-3.5 animate-in fade-in duration-200">
                <div className="text-center p-3 bg-blue-50/70 rounded-2xl border border-blue-200/80">
                  <div className="flex items-center justify-center gap-1.5 text-xs text-blue-600 font-semibold mb-0.5">
                    <span className="w-2 h-2 rounded-full bg-blue-600 animate-ping"></span>
                    <span>Live Verification Code Sent</span>
                  </div>
                  <p className="text-xs font-bold text-slate-800 font-mono truncate px-2">{otpEmail}</p>
                  <p className="text-[10px] sm:text-[11px] text-slate-500 mt-1 font-medium">Please check your inbox or spam folder for your 6-digit code.</p>
                </div>

                <div>
                  <label className="block text-[10px] sm:text-[11px] font-bold text-slate-600 uppercase mb-2 text-center tracking-wider">
                    Enter 6-Digit Code
                  </label>
                  
                  {/* 6 Individual Responsive Digit Boxes */}
                  <div className="flex items-center justify-center gap-1.5 xs:gap-2 sm:gap-2.5 max-w-full">
                    {[0, 1, 2, 3, 4, 5].map((idx) => (
                      <input
                        key={idx}
                        id={`otp-digit-${idx}`}
                        type="text"
                        inputMode="numeric"
                        pattern="[0-9]*"
                        maxLength={1}
                        value={otpDigits[idx] || ""}
                        onChange={(e) => handleDigitChange(idx, e.target.value)}
                        onKeyDown={(e) => handleDigitKeyDown(idx, e)}
                        className="w-10 h-12 xs:w-11 xs:h-13 sm:w-12 sm:h-14 text-center text-lg xs:text-xl sm:text-2xl font-black font-mono bg-slate-50 border-2 border-slate-200 focus:border-blue-600 focus:bg-white focus:ring-4 focus:ring-blue-500/15 rounded-xl text-slate-900 transition-all outline-none shrink-0"
                      />
                    ))}
                  </div>
                </div>

                <button
                  type="button"
                  disabled={otpLoading || otpDigits.join("").length < 6}
                  onClick={handleVerifyOtp}
                  className="w-full py-3 sm:py-3.5 bg-gradient-to-r from-blue-600 via-indigo-600 to-violet-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs sm:text-sm font-bold transition-all shadow-lg shadow-blue-500/25 flex items-center justify-center gap-2 disabled:opacity-50 cursor-pointer active:scale-[0.99] mt-2 min-h-[44px]"
                >
                  {otpLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                  <span>Verify & Start Shopping</span>
                </button>

                <div className="flex items-center justify-between pt-1 text-[11px]">
                  <button
                    type="button"
                    onClick={() => {
                      setOtpSent(false);
                      setOtpDigits(["", "", "", "", "", ""]);
                      setOtpCode("");
                    }}
                    className="text-slate-500 hover:text-blue-600 font-medium cursor-pointer p-1"
                  >
                    ← Edit email
                  </button>

                  <button
                    type="button"
                    disabled={otpLoading || resendCooldown > 0}
                    onClick={handleSendOtp}
                    className={`font-bold transition-colors p-1 ${
                      resendCooldown > 0 
                        ? "text-slate-400 cursor-not-allowed" 
                        : "text-blue-600 hover:underline cursor-pointer"
                    }`}
                  >
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : "Resend Code"}
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
              <div className="space-y-3.5 pt-2 border-t border-slate-100">
                <div className="flex items-center justify-between">
                  <p className="text-xs text-slate-700 font-bold">
                    Found {trackingData.orders?.length || 0} order(s) for <span className="text-blue-600">{toDisplayText(trackingData.customer_name || trackingEmail)}</span>:
                  </p>
                </div>

                {trackingData.orders?.map((ord: any, ordIdx: number) => {
                  const ordId = ord.order_id || ord.id || ord.razorpay_order_id || `order_${ordIdx}`;
                  const courier = ord.courier || ord.shipping?.carrier || "BlueDart Express FastAir";
                  const awb = ord.tracking_number || ord.shipping?.tracking_number || "BD-AIR-892104";
                  const status = ord.status || ord.shipping?.status || "IN_TRANSIT";
                  const amount = Number(ord.amount || 0).toLocaleString("en-IN");
                  const estDelivery = ord.estimated_delivery || "Today by 7:00 PM";
                  const stages = Array.isArray(ord.timeline) ? ord.timeline : [
                    { stage: "Order Confirmed", detail: "Payment verified", completed: true },
                    { stage: "In Transit", detail: `${courier} (${awb})`, completed: true },
                    { stage: "Out for Delivery", detail: estDelivery, completed: false }
                  ];

                  return (
                    <div key={ordId} className="bg-slate-50/90 border border-slate-200 rounded-2xl p-4 space-y-3 shadow-2xs">
                      {/* Top Bar: Order ID, Status, Amount */}
                      <div className="flex items-start justify-between gap-2 border-b border-slate-200/70 pb-2.5">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Order ID</span>
                            <span className="font-mono text-blue-600 font-bold text-xs">{ordId}</span>
                          </div>
                          <p className="text-[10px] text-slate-500 mt-0.5 font-medium">
                            {ord.created_at ? new Date(ord.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : "Recent Order"}
                          </p>
                        </div>
                        <div className="text-right">
                          <span className="text-sm font-black text-slate-900 block">₹{amount}</span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800 border border-emerald-200 mt-0.5">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                            {status === "IN_TRANSIT" ? "In Transit" : (status === "PAID" ? "Order Confirmed" : status)}
                          </span>
                        </div>
                      </div>

                      {/* Courier & AWB Information */}
                      <div className="grid grid-cols-2 gap-2 bg-white p-2.5 rounded-xl border border-slate-200/80 text-[11px]">
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">Courier Partner</p>
                          <p className="font-bold text-slate-800 flex items-center gap-1 mt-0.5">
                            <Truck className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            <span className="truncate">{courier}</span>
                          </p>
                        </div>
                        <div>
                          <p className="text-[9px] text-slate-400 font-bold uppercase tracking-wider">AWB Tracking No.</p>
                          <p className="font-mono font-bold text-slate-800 mt-0.5 select-all truncate">
                            {awb}
                          </p>
                        </div>
                        <div className="col-span-2 pt-1 border-t border-slate-100 flex items-center justify-between text-[10px]">
                          <span className="text-slate-500 font-medium">Est. Delivery:</span>
                          <span className="font-bold text-indigo-700">{estDelivery}</span>
                        </div>
                      </div>

                      {/* Live Shipment Progress Tracker */}
                      <div className="pt-1">
                        <p className="text-[10px] font-bold text-slate-600 uppercase tracking-wider mb-2">Live Shipment Journey</p>
                        <div className="space-y-2">
                          {stages.map((stg: any, sIdx: number) => (
                            <div key={sIdx} className="flex items-start gap-2.5 text-xs">
                              <div className="flex flex-col items-center mt-0.5">
                                <div className={`w-4 h-4 rounded-full flex items-center justify-center text-[9px] font-bold shadow-2xs ${
                                  stg.completed 
                                    ? "bg-emerald-600 text-white" 
                                    : "bg-slate-200 text-slate-500 border border-slate-300"
                                }`}>
                                  {stg.completed ? "✓" : sIdx + 1}
                                </div>
                                {sIdx < stages.length - 1 && (
                                  <div className={`w-0.5 h-4 my-0.5 ${
                                    stg.completed ? "bg-emerald-500" : "bg-slate-200"
                                  }`} />
                                )}
                              </div>
                              <div className="flex-1 min-w-0">
                                <p className={`font-bold text-[11px] leading-tight ${
                                  stg.completed ? "text-slate-900" : "text-slate-400"
                                }`}>
                                  {stg.stage}
                                </p>
                                {stg.detail && (
                                  <p className="text-[10px] text-slate-500 mt-0.5 leading-snug">
                                    {stg.detail}
                                  </p>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })}
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
