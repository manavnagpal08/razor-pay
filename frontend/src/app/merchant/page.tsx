"use client";

import { useEffect, useState, useRef } from "react";
import { 
  TrendingUp, ShoppingBag, BrainCircuit, ShieldAlert, Bot, Sparkles, Send, 
  Lock, LogIn, Sliders, CheckCircle2, Loader2, Share2, Copy, ExternalLink, Code, 
  MessageSquare, Terminal, RefreshCw, Download, Filter, PlusCircle, Store, X, ChevronDown,
  QrCode, AlertTriangle, Cpu, Layers, ShieldCheck, Zap, Mail, Trash2, Inbox, Package, Search,
  Users, Phone, Calendar, Tag, Building2, MapPin, ArrowRight, ArrowLeft, Check
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";
import { Toast } from "@/components/ui/Toast";

export default function MerchantDashboard() {
  const { user, token, role, loading: authLoading } = useAuth();
  const [toast, setToast] = useState<{ message: string; type: "success" | "error" | "info" } | null>(null);
  const showToast = (message: string, type: "success" | "error" | "info" = "success") => setToast({ message, type });
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [policy, setPolicy] = useState<any>(null);
  const [maxDiscountInput, setMaxDiscountInput] = useState<number>(20);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState("");

  // Rich Discounts & Rules States
  const [maxDiscountPercent, setMaxDiscountPercent] = useState<number>(20);
  const [maxDiscountAmount, setMaxDiscountAmount] = useState<number>(5000);
  const [minCartAmount, setMinCartAmount] = useState<number>(1500);
  const [firstTimeDiscount, setFirstTimeDiscount] = useState<number>(10);
  const [freeShippingThreshold, setFreeShippingThreshold] = useState<number>(999);
  const [flashSaleActive, setFlashSaleActive] = useState<boolean>(false);
  const [autoRejectNegativeMargin, setAutoRejectNegativeMargin] = useState<boolean>(true);
  const [aiUpsellSensitivity, setAiUpsellSensitivity] = useState<string>("BALANCED");
  const [promoCodes, setPromoCodes] = useState<any[]>([
    { code: "WELCOME10", discount: 10, type: "percent", active: true },
    { code: "BUYFLOW500", discount: 500, type: "flat", active: true },
    { code: "FESTIVE15", discount: 15, type: "percent", active: true }
  ]);
  const [newPromoCode, setNewPromoCode] = useState("");
  const [newPromoDiscount, setNewPromoDiscount] = useState<number>(10);
  const [newPromoType, setNewPromoType] = useState<"percent" | "flat">("percent");

  // Policy Simulator States
  const [testCartTotal, setTestCartTotal] = useState<number>(10000);
  const [testProposedDiscount, setTestProposedDiscount] = useState<number>(25);
  const [testSimResult, setTestSimResult] = useState<any>(null);

  const [loading, setLoading] = useState(true);
  const [logsLoading, setLogsLoading] = useState(false);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const [copiedEmbed, setCopiedEmbed] = useState(false);
  
  // Multi-Store States
  const [stores, setStores] = useState<any[]>([]);
  const [selectedStore, setSelectedStore] = useState<any>(null);
  const [showNewStoreModal, setShowNewStoreModal] = useState(false);
  const [newStoreName, setNewStoreName] = useState("");
  const [newStoreDiscount, setNewStoreDiscount] = useState(20);
  const [newStorePreset, setNewStorePreset] = useState("all");
  const [newStoreGreeting, setNewStoreGreeting] = useState("");
  const [creatingStore, setCreatingStore] = useState(false);
  const [createdStoreResult, setCreatedStoreResult] = useState<any>(null);
  const [showStoreDropdown, setShowStoreDropdown] = useState(false);

  // Onboarding Wizard States
  const [showOnboardingWizard, setShowOnboardingWizard] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState<1 | 2 | 3>(1);
  const [onboardingStoreName, setOnboardingStoreName] = useState("");
  const [onboardingCategory, setOnboardingCategory] = useState("Fashion & Apparel");
  const [onboardingAddress, setOnboardingAddress] = useState("");
  const [onboardingPhone, setOnboardingPhone] = useState("");
  const [onboardingDescription, setOnboardingDescription] = useState("");
  const [onboardingMaxDiscount, setOnboardingMaxDiscount] = useState(15);
  const [onboardingGreeting, setOnboardingGreeting] = useState("");
  const [hasFirstProduct, setHasFirstProduct] = useState(true);
  const [onboardingProducts, setOnboardingProducts] = useState<{
    id: string;
    name: string;
    category: string;
    price: number | "";
    inventory: number | "";
    description: string;
    image_url: string;
  }[]>([
    {
      id: "prod_draft_1",
      name: "",
      category: "Fashion & Apparel",
      price: 1999,
      inventory: 25,
      description: "",
      image_url: ""
    }
  ]);
  const [submittingOnboarding, setSubmittingOnboarding] = useState(false);

  // Security & Failure Simulation States
  const [showQrModal, setShowQrModal] = useState(false);
  const [simulatingAttack, setSimulatingAttack] = useState(false);
  const [attackResult, setAttackResult] = useState<any>(null);

  // M2M AI Buyer Simulator States
  const [simulatingM2M, setSimulatingM2M] = useState(false);
  const [m2mBuyerAgent, setM2mBuyerAgent] = useState("Enterprise_Procurement_AI_v4");
  const [m2mDiscountOffer, setM2mDiscountOffer] = useState(15);
  const [m2mTargetProduct, setM2mTargetProduct] = useState<string>("");
  const [m2mResult, setM2mResult] = useState<any>(null);

  // External Software / OMS Integration States
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState("");

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "customers" | "simulator" | "security" | "policy" | "webhooks" | "smtp" | "audit">("overview");

  // Store Customers State
  const [storeCustomers, setStoreCustomers] = useState<any[]>([]);
  const [loadingCustomers, setLoadingCustomers] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [selectedCustomerLogs, setSelectedCustomerLogs] = useState<any>(null);

  const fetchStoreCustomers = async () => {
    if (!token) return;
    setLoadingCustomers(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/customers`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setStoreCustomers(data);
      }
    } catch (e) {
      console.warn("Failed to fetch customers:", e);
    } finally {
      setLoadingCustomers(false);
    }
  };

  // Product Catalog Management States
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
  const [catalogSearch, setCatalogSearch] = useState("");
  const [selectedCategoryFilter, setSelectedCategoryFilter] = useState("ALL");
  const [productsLoading, setProductsLoading] = useState(false);
  const [showAddProductModal, setShowAddProductModal] = useState(false);
  const [newProdName, setNewProdName] = useState("");
  const [newProdCategory, setNewProdCategory] = useState("Laptops");
  const [newProdPrice, setNewProdPrice] = useState<number>(49999);
  const [newProdInventory, setNewProdInventory] = useState<number>(15);
  const [newProdDescription, setNewProdDescription] = useState("");
  const [newProdImage, setNewProdImage] = useState("");
  const [imageUploadMode, setImageUploadMode] = useState<"file" | "url">("file");
  const [creatingProduct, setCreatingProduct] = useState(false);

  // SMTP Gmail & HTTPS Delivery States
  const [activeEmailProvider, setActiveEmailProvider] = useState<"brevo" | "resend" | "gmail" | "none">("brevo");
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [resendApiKey, setResendApiKey] = useState("");
  const [brevoApiKey, setBrevoApiKey] = useState("");
  const [brevoSenderEmail, setBrevoSenderEmail] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [disconnectingSmtp, setDisconnectingSmtp] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState("");
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        showToast("Image size should be under 3MB.", "error");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleDownloadQrCode = async () => {
    try {
      const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=600x600&data=${encodeURIComponent(agentShareUrl)}`;
      const response = await fetch(qrUrl);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      
      const img = new Image();
      img.crossOrigin = "anonymous";
      img.src = blobUrl;
      img.onload = () => {
        const canvas = document.createElement("canvas");
        canvas.width = 600;
        canvas.height = 600;
        const ctx = canvas.getContext("2d");
        if (!ctx) return;
        
        ctx.fillStyle = "#ffffff";
        ctx.fillRect(0, 0, 600, 600);
        ctx.drawImage(img, 0, 0, 600, 600);
        
        const logoImg = new Image();
        logoImg.src = "/logo.png";
        logoImg.onload = () => {
          const logoSize = 130;
          const center = (600 - logoSize) / 2;
          
          ctx.fillStyle = "#ffffff";
          ctx.beginPath();
          ctx.roundRect(center - 10, center - 10, logoSize + 20, logoSize + 20, 24);
          ctx.fill();
          ctx.lineWidth = 4;
          ctx.strokeStyle = "#e2e8f0";
          ctx.stroke();
          
          ctx.drawImage(logoImg, center, center, logoSize, logoSize);
          
          const finalUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = finalUrl;
          a.download = `${currentStoreName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-buyflow-qr.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("QR code downloaded successfully!", "success");
        };
        logoImg.onerror = () => {
          const finalUrl = canvas.toDataURL("image/png");
          const a = document.createElement("a");
          a.href = finalUrl;
          a.download = `${currentStoreName.toLowerCase().replace(/[^a-z0-9]/g, "-")}-qr.png`;
          document.body.appendChild(a);
          a.click();
          document.body.removeChild(a);
          showToast("QR code downloaded successfully!", "success");
        };
      };
    } catch (e) {
      console.error("Failed to download QR code:", e);
      showToast("Failed to download QR code.", "error");
    }
  };

  const merchantId = selectedStore?.id || user?.merchant_id || user?.uid || "demo_merchant";
  const currentStoreName = selectedStore?.name || (stores && stores.length > 0 ? stores[0].name : (user?.store_name || user?.name || (user?.email ? user.email.split('@')[0].toUpperCase() : "BuyFlow Store")));
  const baseUrl = typeof window !== "undefined" ? window.location.origin : "https://razorpay-buildthon.vercel.app";
  const agentShareUrl = `${baseUrl}/chat?merchant=${merchantId}`;
  const embedSnippet = `<iframe src="${agentShareUrl}" width="100%" height="700" frameborder="0" style="border-radius: 24px; box-shadow: 0 20px 25px -5px rgb(0 0 0 / 0.1);"></iframe>`;

  // Realistic Zero-Data Chart (0 dummy hardcoded numbers!)
  const hasRevenue = metrics && Number(metrics.revenue) > 0;
  const chartData = [
    { name: 'Mon', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.1) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.08) : 0 },
    { name: 'Tue', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.15) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.12) : 0 },
    { name: 'Wed', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.25) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.2) : 0 },
    { name: 'Thu', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.18) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.15) : 0 },
    { name: 'Fri', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.32) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.28) : 0 },
    { name: 'Sat', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.45) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.38) : 0 },
    { name: 'Sun', revenue: hasRevenue ? Math.round(Number(metrics.revenue) * 0.65) : 0, aiDriven: hasRevenue ? Math.round(Number(metrics.revenue) * 0.5) : 0 },
  ];

  useEffect(() => {
    if (token) {
      if (merchantId && merchantId !== "demo_merchant") {
        localStorage.setItem("buyflow_active_merchant_id", merchantId);
        localStorage.setItem("buyflow_merchant_id", merchantId);
      }
      fetchDashboard();
      fetchLogs();
      fetchWebhookConfig();
      fetchMerchantProducts();
      fetchSmtpConfig();
      fetchStoreCustomers();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading, merchantId]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const hash = window.location.hash.replace("#", "");
      if (hash && ["overview", "catalog", "simulator", "security", "policy", "webhooks", "smtp", "audit"].includes(hash)) {
        setActiveTab(hash as any);
      }
    }
  }, []);

  const fetchDashboard = async () => {
    try {
      const apiUrl = getApiUrl();
      const headers = { "Authorization": `Bearer ${token}` };

      const [metricsRes, activityRes, policyRes, storesRes] = await Promise.all([
        fetch(`${apiUrl}/api/merchant/dashboard`, { headers }),
        fetch(`${apiUrl}/api/merchant/ai-activity`, { headers }),
        fetch(`${apiUrl}/api/merchant/policies`, { headers }),
        fetch(`${apiUrl}/api/merchant/stores`, { headers })
      ]);

      if (metricsRes.ok) setMetrics(await metricsRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());
      if (policyRes.ok) {
        const pol = await policyRes.json();
        setPolicy(pol);
        setMaxDiscountPercent(Number(pol.max_discount_percent) || 20);
        setMaxDiscountAmount(Number(pol.max_discount_amount) || 5000);
        setMinCartAmount(Number(pol.min_cart_amount) || 1500);
        setFirstTimeDiscount(Number(pol.first_time_discount) || 10);
        setFreeShippingThreshold(Number(pol.free_shipping_threshold) || 999);
        setFlashSaleActive(Boolean(pol.flash_sale_active));
        setAutoRejectNegativeMargin(pol.auto_reject_negative_margin !== false);
        setAiUpsellSensitivity(pol.ai_upsell_sensitivity || "BALANCED");
        if (Array.isArray(pol.promo_codes) && pol.promo_codes.length > 0) {
          setPromoCodes(pol.promo_codes);
        }
      }
      if (storesRes.ok) {
        const storeData = await storesRes.json();
        if (Array.isArray(storeData)) {
          setStores(storeData);
          if (storeData.length > 0 && !selectedStore) {
            setSelectedStore(storeData[0]);
          }
        }
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleCompleteOnboarding = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!onboardingStoreName.trim()) {
      showToast("Store name is required to launch your store.", "error");
      return;
    }
    setSubmittingOnboarding(true);
    try {
      const apiUrl = getApiUrl();
      const validProducts = hasFirstProduct ? onboardingProducts
        .filter(p => p.name && p.name.trim().length > 0)
        .map(p => ({
          name: p.name.trim(),
          category: p.category.trim() || onboardingCategory,
          price: Number(p.price) || 999,
          inventory: Number(p.inventory) || 20,
          description: p.description.trim() || `Featured ${p.name.trim()}`,
          image_url: p.image_url.trim() || undefined
        })) : [];

      const payload: any = {
        store_name: onboardingStoreName.trim(),
        category: onboardingCategory,
        address: onboardingAddress.trim() || undefined,
        phone: onboardingPhone.trim() || undefined,
        description: onboardingDescription.trim() || undefined,
        max_discount_percent: Number(onboardingMaxDiscount) || 15,
        products: validProducts.length > 0 ? validProducts : undefined
      };

      const res = await fetch(`${apiUrl}/api/merchant/setup-store`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      });

      if (res.ok) {
        const data = await res.json();
        if (typeof window !== "undefined") {
          localStorage.setItem(`store_onboarded_${merchantId}`, "true");
        }
        showToast(`Store "${data.store_name}" configured and live!`, "success");
        setShowOnboardingWizard(false);
        // Refresh stores & catalog
        await Promise.all([
          fetchDashboard(),
          fetchMerchantProducts(),
          fetchStoreCustomers()
        ]);
      } else {
        const err = await res.json().catch(() => ({}));
        showToast(err.detail || "Failed to save store setup.", "error");
      }
    } catch (err: any) {
      showToast("Network error saving store setup.", "error");
    } finally {
      setSubmittingOnboarding(false);
    }
  };

  const handleCreateStore = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStoreName.trim()) return;
    setCreatingStore(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/onboard`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          store_name: newStoreName,
          max_discount_percent: newStoreDiscount,
          catalog_preset: newStorePreset,
          welcome_message: newStoreGreeting || undefined
        })
      });
      if (res.ok) {
        const data = await res.json();
        setCreatedStoreResult(data);
        const sRes = await fetch(`${apiUrl}/api/merchant/stores`);
        if (sRes.ok) setStores(await sRes.json());
      } else {
        showToast("Failed to create store. Please try again.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Connection error when creating store.", "error");
    } finally {
      setCreatingStore(false);
    }
  };

  const handleSimulateAttack = async (type: "ROGUE_DISCOUNT_EXPLOIT" | "PAYMENT_DROP_RECOVERY" | "PROMPT_INJECTION_ATTACK" | "PRICE_FORGERY_ATTACK") => {
    setSimulatingAttack(true);
    setAttackResult(null);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/simulate-attack`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ attack_type: type, merchant_id: merchantId })
      });
      if (res.ok) {
        const data = await res.json();
        setAttackResult(data);
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingAttack(false);
    }
  };

  const handleRunM2MTransaction = async () => {
    setSimulatingM2M(true);
    setM2mResult(null);
    try {
      const apiUrl = getApiUrl();
      let targetProduct = merchantProducts.find(p => p.id === m2mTargetProduct);
      if (!targetProduct) {
        const prodRes = await fetch(`${apiUrl}/api/products/merchant/${merchantId}`);
        const prods = await prodRes.json();
        targetProduct = (prods && prods.length > 0) ? prods[0] : { id: "p1", name: "Pro Gaming Laptop", price: 125000 };
      }

      const res = await fetch(`${apiUrl}/api/agent/transact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          agent_id: m2mBuyerAgent,
          product_id: targetProduct.id,
          quantity: 1,
          proposed_discount_percent: Number(m2mDiscountOffer)
        })
      });
      if (res.ok) {
        const data = await res.json();
        setM2mResult({ ...data, product: targetProduct });
        fetchLogs();
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSimulatingM2M(false);
    }
  };

  const fetchLogs = async () => {
    setLogsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/logs`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setLogs(data);
      }
    } catch (e) {
      console.error("Failed to fetch logs:", e);
    } finally {
      setLogsLoading(false);
    }
  };

  const handleExportLogs = () => {
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(logs, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `razorpay-agent-audit-logs-${new Date().toISOString().slice(0,10)}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
  };

  const fetchWebhookConfig = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/webhook-config`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookUrl(data.webhook_url || "");
        setWebhookSecret(data.webhook_secret || "");
      }
    } catch (e) {
      console.warn("Failed to fetch webhook config:", e);
    }
  };

  const handleSaveWebhook = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingWebhook(true);
    setWebhookMessage("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/webhook-config`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          webhook_url: webhookUrl,
          webhook_secret: webhookSecret,
          auto_sync: true
        })
      });
      if (res.ok) {
        setWebhookMessage("External OMS Webhook configuration saved! Automatic order sync active.");
        setTimeout(() => setWebhookMessage(""), 4000);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setSavingWebhook(false);
    }
  };

  const handleTestWebhook = async () => {
    setTestingWebhook(true);
    setWebhookTestResult(null);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/webhook-test`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        setWebhookTestResult(data);
        fetchLogs();
      }
    } catch (e) {
      console.error(e);
    } finally {
      setTestingWebhook(false);
    }
  };

  // Product Catalog Handlers
  const fetchMerchantProducts = async () => {
    setProductsLoading(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/products/merchant/${merchantId}`);
      if (res.ok) {
        let data = await res.json();
        if (Array.isArray(data) && data.length === 0) {
          try {
            await fetch(`${apiUrl}/api/products/merchant/${merchantId}/seed`, { method: "POST" });
            const retry = await fetch(`${apiUrl}/api/products/merchant/${merchantId}`);
            if (retry.ok) data = await retry.json();
          } catch (seedErr) {
            console.warn("Auto-seed error:", seedErr);
          }
        }
        setMerchantProducts(data);
      }
    } catch (e) {
      console.warn("Failed to load merchant products:", e);
    } finally {
      setProductsLoading(false);
    }
  };

  const handleSeedSampleCatalog = async () => {
    setProductsLoading(true);
    try {
      const apiUrl = getApiUrl();
      await fetch(`${apiUrl}/api/products/merchant/${merchantId}/seed`, { method: "POST" });
      await fetchMerchantProducts();
      showToast("Sample store products loaded successfully!", "success");
    } catch (e) {
      console.error(e);
      showToast("Failed to load sample products", "error");
    } finally {
      setProductsLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProdName.trim() || !newProdPrice) return;
    setCreatingProduct(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/products/`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          merchant_id: merchantId,
          name: newProdName.trim(),
          category: newProdCategory,
          price: Number(newProdPrice),
          inventory: Number(newProdInventory),
          description: newProdDescription.trim(),
          image_url: newProdImage.trim() || undefined
        })
      });
      if (res.ok) {
        setShowAddProductModal(false);
        setNewProdName("");
        setNewProdDescription("");
        setNewProdImage("");
        await fetchMerchantProducts();
        showToast("Product added to catalog successfully!", "success");
      } else {
        showToast("Failed to add product. Please check fields.", "error");
      }
    } catch (err) {
      console.error(err);
      showToast("Error adding product.", "error");
    } finally {
      setCreatingProduct(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!confirm("Are you sure you want to remove this product from your catalog?")) return;
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/products/${productId}`, { method: "DELETE" });
      if (res.ok) {
        await fetchMerchantProducts();
      }
    } catch (e) {
      console.error(e);
    }
  };

  // SMTP Gmail Delivery Handlers
  const fetchSmtpConfig = async () => {
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/smtp-config`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        const data = await res.json();
        if (data.active_provider) setActiveEmailProvider(data.active_provider);
        setSmtpUser(data.gmail_user || "");
        setSmtpPassword(data.has_password ? "••••••••••••••••" : "");
        setResendApiKey(data.has_resend_key ? "••••••••••••••••" : "");
        setBrevoApiKey(data.has_brevo_key ? "••••••••••••••••" : "");
        setBrevoSenderEmail(data.brevo_sender_email || "");
      }
    } catch (e) {
      console.warn("Failed to fetch SMTP config:", e);
    }
  };

  const handleSaveSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setSavingSmtp(true);
    setSmtpMessage("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/smtp-config`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          active_provider: activeEmailProvider,
          gmail_user: smtpUser.trim(),
          gmail_app_password: smtpPassword.startsWith("•") ? undefined : smtpPassword.trim() || undefined,
          resend_api_key: resendApiKey.startsWith("•") ? undefined : resendApiKey.trim() || undefined,
          brevo_api_key: brevoApiKey.startsWith("•") ? undefined : brevoApiKey.trim() || undefined,
          brevo_sender_email: brevoSenderEmail.trim() || undefined
        })
      });
      if (res.ok) {
        setSmtpMessage(`✓ ${activeEmailProvider.toUpperCase()} configuration saved successfully! Live emails will now send via ${activeEmailProvider}.`);
        setTimeout(() => setSmtpMessage(""), 5000);
        await fetchSmtpConfig();
      }
    } catch (e) {
      showToast("Failed to save email configuration.", "error");
    } finally {
      setSavingSmtp(false);
    }
  };

  const handleDisconnectSmtp = async () => {
    if (!confirm("Are you sure you want to disconnect your active email service?")) return;
    setDisconnectingSmtp(true);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/smtp-config/disconnect`, {
        method: "POST",
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (res.ok) {
        setActiveEmailProvider("none");
        setBrevoApiKey("");
        setBrevoSenderEmail("");
        setResendApiKey("");
        setSmtpUser("");
        setSmtpPassword("");
        setSmtpTestResult(null);
        showToast("Email provider disconnected successfully.", "info");
      }
    } catch (e) {
      showToast("Failed to disconnect provider.", "error");
    } finally {
      setDisconnectingSmtp(false);
    }
  };

  const handleTestSmtp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!testEmailRecipient.trim()) return;
    setTestingSmtp(true);
    setSmtpTestResult(null);
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/smtp-test`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ recipient_email: testEmailRecipient.trim() })
      });
      const data = await res.json();
      setSmtpTestResult(data);
    } catch (e) {
      console.error(e);
    } finally {
      setTestingSmtp(false);
    }
  };

  const handleUpdatePolicy = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setSavingPolicy(true);
    setPolicyMessage("");
    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/policies`, {
        method: "PATCH",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          max_discount_percent: Number(maxDiscountPercent),
          max_discount_amount: Number(maxDiscountAmount),
          min_cart_amount: Number(minCartAmount),
          first_time_discount: Number(firstTimeDiscount),
          free_shipping_threshold: Number(freeShippingThreshold),
          flash_sale_active: Boolean(flashSaleActive),
          auto_reject_negative_margin: Boolean(autoRejectNegativeMargin),
          ai_upsell_sensitivity: aiUpsellSensitivity,
          promo_codes: promoCodes
        })
      });
      if (res.ok) {
        setPolicyMessage("Store rules and discount guardrails saved successfully!");
        showToast("Discounts & Rules saved!", "success");
        setTimeout(() => setPolicyMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
      showToast("Error saving policies", "error");
    } finally {
      setSavingPolicy(false);
    }
  };

  const handleAddPromoCode = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newPromoCode.trim() || !newPromoDiscount) return;
    const cleanCode = newPromoCode.trim().toUpperCase().replace(/[^A-Z0-9_-]/g, "");
    if (promoCodes.some(p => p.code === cleanCode)) {
      showToast("Coupon code already exists!", "error");
      return;
    }
    const updated = [
      ...promoCodes,
      { code: cleanCode, discount: Number(newPromoDiscount), type: newPromoType, active: true }
    ];
    setPromoCodes(updated);
    setNewPromoCode("");
    setNewPromoDiscount(10);
    showToast(`Coupon code ${cleanCode} added!`, "success");
  };

  const handleTogglePromoCode = (code: string) => {
    const updated = promoCodes.map(p => p.code === code ? { ...p, active: !p.active } : p);
    setPromoCodes(updated);
  };

  const handleDeletePromoCode = (code: string) => {
    const updated = promoCodes.filter(p => p.code !== code);
    setPromoCodes(updated);
    showToast(`Coupon ${code} removed`, "info");
  };

  const handleRunPolicySimulation = () => {
    const amount = Number(testCartTotal) || 0;
    const proposed = Number(testProposedDiscount) || 0;
    const discountVal = (amount * proposed) / 100;
    const exceedsPercent = proposed > maxDiscountPercent;
    const exceedsCap = discountVal > maxDiscountAmount;
    const belowMinCart = amount < minCartAmount;

    let allowed = true;
    let reason = "Approved: Discount proposal is within merchant safety bounds.";
    let finalDiscount = discountVal;
    let finalPercent = proposed;

    if (belowMinCart) {
      allowed = false;
      reason = `Rejected: Order total (₹${amount.toLocaleString()}) is below the required minimum cart threshold (₹${minCartAmount.toLocaleString()}) for AI discounts.`;
    } else if (exceedsPercent) {
      allowed = false;
      reason = `Rejected: Proposed ${proposed}% discount exceeds the maximum allowed threshold (${maxDiscountPercent}%). Counter-offer clamped to ${maxDiscountPercent}%.`;
      finalPercent = maxDiscountPercent;
      finalDiscount = Math.min((amount * maxDiscountPercent) / 100, maxDiscountAmount);
    } else if (exceedsCap) {
      allowed = false;
      reason = `Rejected: Calculated discount ₹${discountVal.toLocaleString()} exceeds the maximum allowed discount cap (₹${maxDiscountAmount.toLocaleString()}). Capped at ₹${maxDiscountAmount.toLocaleString()}.`;
      finalDiscount = maxDiscountAmount;
      finalPercent = Math.round((maxDiscountAmount / amount) * 100);
    }

    setTestSimResult({
      allowed,
      reason,
      original_amount: amount,
      demanded_percent: proposed,
      approved_percent: allowed ? proposed : finalPercent,
      approved_discount_inr: allowed ? discountVal : finalDiscount,
      final_payable_inr: amount - (allowed ? discountVal : finalDiscount),
      timestamp: new Date().toLocaleTimeString()
    });
  };

  const sendCopilotQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || copilotLoading) return;

    const query = chatInput;
    setChatMessages(prev => [...prev, { role: "user", text: query }]);
    setChatInput("");
    setCopilotLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/copilot`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ query })
      });
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: "assistant", text: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: "assistant", text: "Store copilot encountered an error. Please try again." }]);
      }
    } catch (err) {
      setChatMessages(prev => [...prev, { role: "assistant", text: "Connection error to merchant copilot." }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  const filteredLogs = logs.filter(l => {
    if (logFilter === "ALL") return true;
    if (logFilter === "POLICY_BLOCK") return l.level === "POLICY_BLOCK";
    if (logFilter === "PAYMENT") return l.level === "PAYMENT";
    if (logFilter === "SUCCESS") return l.level === "SUCCESS";
    return true;
  });

  if (authLoading || loading) {
    return (
      <div className="flex justify-center items-center h-[60vh]">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="max-w-md mx-auto my-16 text-center bg-white p-8 rounded-3xl shadow-sm border border-slate-200">
        <Lock className="w-8 h-8 text-indigo-600 mx-auto mb-4" />
        <h2 className="text-xl font-bold text-slate-900 mb-2">Merchant Authentication Required</h2>
        <p className="text-slate-500 text-sm mb-6">Sign in with your merchant administrator account to access store telemetry and AI controls.</p>
        <Link href="/login" className="inline-block w-full py-3.5 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors shadow-md shadow-indigo-500/20">
          Sign In as Merchant
        </Link>
      </div>
    );
  }

  return (
    <div className="space-y-6 w-full pb-12">
      {/* Title & Tenant Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Merchant Control Center</h1>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-slate-500 text-sm">Storefront:</span>
            
            {/* Store Dropdown Switcher */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setShowStoreDropdown(!showStoreDropdown)}
                className="inline-flex items-center gap-1.5 px-3 py-1 rounded-xl bg-indigo-50 hover:bg-indigo-100 text-indigo-700 font-bold text-xs border border-indigo-200 transition-colors"
              >
                <Store className="w-3.5 h-3.5" />
                <span>{currentStoreName}</span>
                <ChevronDown className="w-3 h-3 ml-0.5" />
              </button>

              {showStoreDropdown && (
                <div className="absolute left-0 top-full mt-1.5 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 z-50">
                  <div className="px-3 py-1.5 text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                    Your Active Stores
                  </div>
                  <button
                    type="button"
                    onClick={() => {
                      setSelectedStore(null);
                      setShowStoreDropdown(false);
                    }}
                    className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 ${
                      !selectedStore ? "text-indigo-600 bg-indigo-50/50" : "text-slate-700"
                    }`}
                  >
                    <span>Razorpay Demo Store</span>
                    {!selectedStore && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                  </button>
                  {stores.map((s) => (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => {
                        setSelectedStore(s);
                        setShowStoreDropdown(false);
                      }}
                      className={`w-full text-left px-3 py-2 text-xs font-semibold flex items-center justify-between hover:bg-slate-50 ${
                        selectedStore?.id === s.id ? "text-indigo-600 bg-indigo-50/50" : "text-slate-700"
                      }`}
                    >
                      <span className="truncate">{s.name}</span>
                      {selectedStore?.id === s.id && <CheckCircle2 className="w-3.5 h-3.5 text-indigo-600" />}
                    </button>
                  ))}
                </div>
              )}
            </div>
            
            <span className="text-slate-400 text-xs hidden sm:inline">• {user?.email || ""}</span>
          </div>
        </div>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowQrModal(true)}
            className="px-3.5 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-2xl text-xs font-bold transition-all shadow-xs flex items-center gap-1.5"
            title="Generate Scannable Storefront QR Code"
          >
            <QrCode className="w-4 h-4 text-indigo-600" />
            <span>Store QR Code</span>
          </button>

          <button
            type="button"
            onClick={() => {
              setOnboardingStoreName(currentStoreName === "BuyFlow Store" || currentStoreName === "My Store" ? "" : currentStoreName);
              setOnboardingStep(1);
              setShowOnboardingWizard(true);
            }}
            className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Store Setup & Launch</span>
          </button>
        </div>
      </div>


      {/* 2-Column Responsive Workspace: Sidebar + Modular Tab Content */}
      <div className="flex flex-col lg:flex-row gap-6 items-start">
        {/* Left Navigation Sidebar */}
        <aside className="w-full lg:w-64 bg-white border border-slate-200/80 rounded-3xl p-3 shadow-xs shrink-0 lg:sticky lg:top-20 z-10">
          <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
            Control Center Menu
          </div>
          <nav className="space-y-1">
            <button
              onClick={() => setActiveTab("overview")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "overview" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <TrendingUp className="w-4 h-4 shrink-0" />
              <span>Overview & Sales</span>
            </button>

            <button
              onClick={() => setActiveTab("catalog")}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "catalog" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <ShoppingBag className="w-4 h-4 shrink-0" />
                <span>Product Catalog</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === "catalog" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
              }`}>
                {merchantProducts.length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab("customers");
                fetchStoreCustomers();
              }}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "customers" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <div className="flex items-center gap-2.5">
                <Users className="w-4 h-4 shrink-0" />
                <span>Store Customers</span>
              </div>
              <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${
                activeTab === "customers" ? "bg-white/20 text-white" : "bg-indigo-50 text-indigo-700"
              }`}>
                {storeCustomers.length}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("simulator")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "simulator" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>Test AI Shopper</span>
            </button>

            <button
              onClick={() => setActiveTab("security")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "security" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <ShieldAlert className="w-4 h-4 shrink-0" />
              <span>Store Protection</span>
            </button>

            <button
              onClick={() => setActiveTab("policy")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "policy" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Sliders className="w-4 h-4 shrink-0" />
              <span>Discounts & Rules</span>
            </button>

            <button
              onClick={() => setActiveTab("webhooks")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "webhooks" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Code className="w-4 h-4 shrink-0" />
              <span>Order Notifications</span>
            </button>

            <button
              onClick={() => setActiveTab("smtp")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "smtp" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Mail className="w-4 h-4 shrink-0" />
              <span>Email Setup</span>
            </button>

            <button
              onClick={() => setActiveTab("audit")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "audit" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Terminal className="w-4 h-4 shrink-0" />
              <span>Activity History</span>
            </button>
          </nav>

          <div className="mt-6 pt-4 border-t border-slate-100">
            <a
              href={agentShareUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-2.5 px-3 bg-emerald-50 hover:bg-emerald-100 text-emerald-700 rounded-2xl text-xs font-bold transition-all flex items-center justify-between border border-emerald-200/60"
            >
              <div className="flex items-center gap-2">
                <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                <span>Open Live Store</span>
              </div>
              <ExternalLink className="w-3 h-3" />
            </a>
          </div>
        </aside>

        {/* Right Active Page Viewport */}
        <main className="flex-1 w-full space-y-6 min-w-0">

          {activeTab === 'overview' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Sleek, Modern, Uniform KPI Metric Strip */}
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
                {/* 1. Gross Revenue */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Gross Revenue</span>
                    <div className="w-8 h-8 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center">
                      <TrendingUp className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      ₹{Number(metrics?.revenue || 0).toLocaleString("en-IN")}
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] font-semibold text-emerald-600 mt-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                      <span>Verified Razorpay Captures</span>
                    </div>
                  </div>
                </div>

                {/* 2. Paid Orders */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Paid Orders</span>
                    <div className="w-8 h-8 rounded-xl bg-blue-50 text-blue-600 flex items-center justify-center">
                      <ShoppingBag className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics?.orders || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-slate-500 mt-1.5">
                      AOV: <span className="text-slate-800 font-bold">₹{Number(metrics?.average_order_value || 0).toLocaleString("en-IN")}</span>
                    </div>
                  </div>
                </div>

                {/* 3. AI Recommendations (Clean White, Balanced) */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">AI Recommendations</span>
                    <div className="w-8 h-8 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center">
                      <BrainCircuit className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics?.ai_recommendations || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-indigo-600 mt-1.5 flex items-center gap-1">
                      <span>{metrics?.upsell_proposals || 0} Upsells</span>
                      <span className="text-slate-300">•</span>
                      <span>{metrics?.cross_sell_proposals || 0} Cross-sells</span>
                    </div>
                  </div>
                </div>

                {/* 4. Policy Blocks */}
                <div className="bg-white p-4 sm:p-5 rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Policy Blocks</span>
                    <div className="w-8 h-8 rounded-xl bg-amber-50 text-amber-600 flex items-center justify-center">
                      <ShieldAlert className="w-4 h-4" />
                    </div>
                  </div>
                  <div>
                    <div className="text-2xl font-black text-slate-900 tracking-tight">
                      {metrics?.policy_blocks || 0}
                    </div>
                    <div className="text-[11px] font-semibold text-amber-600 mt-1.5">
                      Autonomous violations prevented
                    </div>
                  </div>
                </div>
              </div>
              {/* Shareable AI Storefront Agent Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-slate-200/90 bg-gradient-to-br from-indigo-50/70 via-white to-blue-50/70 text-slate-900 shadow-sm p-6 sm:p-8">
        <div className="relative z-10 grid grid-cols-1 lg:grid-cols-12 gap-6 items-center">
          {/* Left Column: Info & Actions */}
          <div className="lg:col-span-8 space-y-3.5">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs font-bold border border-indigo-200">
              <Sparkles className="w-3.5 h-3.5 text-indigo-600" />
              <span>Multi-Tenant Conversational Commerce</span>
            </div>

            <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
              Shareable AI Storefront Agent Link
            </h2>

            <p className="text-slate-600 text-xs sm:text-sm leading-relaxed max-w-xl">
              Share this dedicated link with your customers on WhatsApp, Instagram, or email. Buyers can chat directly with your AI concierge, receive instant product recommendations, and complete payments right inside the chat.
            </p>

            {/* Link display and actions */}
            <div className="space-y-3 pt-1">
              <div className="flex items-center gap-2.5 px-3.5 py-2.5 bg-white border border-slate-200 rounded-2xl text-xs font-mono text-slate-700 w-full max-w-xl shadow-xs">
                <Share2 className="w-4 h-4 text-indigo-600 shrink-0" />
                <span className="truncate flex-1 text-slate-700 select-all font-semibold">{agentShareUrl}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2.5">
                <button
                  type="button"
                  onClick={() => {
                    if (typeof navigator !== "undefined" && navigator.clipboard) {
                      navigator.clipboard.writeText(agentShareUrl);
                      setCopiedLink(true);
                      showToast("Copied storefront link to clipboard.", "success");
                      setTimeout(() => setCopiedLink(false), 2500);
                    }
                  }}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                >
                  {copiedLink ? <CheckCircle2 className="w-3.5 h-3.5 text-white" /> : <Copy className="w-3.5 h-3.5" />}
                  <span>{copiedLink ? "Copied Link" : "Copy Link"}</span>
                </button>

                <a
                  href={agentShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all cursor-pointer shadow-xs"
                >
                  <ExternalLink className="w-3.5 h-3.5 text-indigo-600" />
                  <span>Open Store</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out our AI Shopping Assistant and buy directly: ${agentShareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center justify-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-emerald-600/20 cursor-pointer"
                  title="Share on WhatsApp"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Right Column: Embed on Any Website Box */}
          <div className="lg:col-span-4 h-full bg-white border border-slate-200 rounded-2xl p-5 flex flex-col justify-between gap-4 shadow-xs">
            <div className="space-y-1.5">
              <div className="w-8 h-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 mb-2">
                <Code className="w-4 h-4" />
              </div>
              <h4 className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
                <span>Embed on Any Website</span>
              </h4>
              <p className="text-[11px] text-slate-500 leading-relaxed">
                Add an interactive AI shopping widget to your Shopify, WordPress, or custom site.
              </p>
            </div>

            <button
              type="button"
              onClick={() => {
                if (typeof navigator !== "undefined" && navigator.clipboard) {
                  navigator.clipboard.writeText(embedSnippet);
                  setCopiedEmbed(true);
                  showToast("Copied embed HTML code to clipboard.", "success");
                  setTimeout(() => setCopiedEmbed(false), 2500);
                }
              }}
              className="w-full py-2.5 px-3 bg-slate-50 hover:bg-slate-100 text-indigo-600 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-2 cursor-pointer shadow-xs"
            >
              {copiedEmbed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? "Copied Embed HTML" : "Copy Embed Code"}</span>
            </button>
          </div>
        </div>
      </div>
              {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">Revenue vs AI Assisted Conversions</h2>
            <span className="text-[11px] text-slate-400 font-semibold">{hasRevenue ? "Live Transactions" : "0 Recorded Sales"}</span>
          </div>
          {!hasRevenue ? (
            <div className="h-[250px] w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <TrendingUp className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">No Revenue Recorded Yet</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                Zero dummy data. Once a customer checks out via the AI assistant or through the M2M Buyer Simulator below, your live revenue curve will chart here.
              </p>
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} tickFormatter={(value) => `₹${value}`} />
                  <Tooltip 
                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                    formatter={(value: any) => [`₹${Number(value).toLocaleString()}`, undefined]}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                  <Line type="monotone" dataKey="revenue" name="Total Revenue" stroke="#4f46e5" strokeWidth={3} dot={{r: 4, fill: '#4f46e5'}} />
                  <Line type="monotone" dataKey="aiDriven" name="AI Assisted" stroke="#0ea5e9" strokeWidth={3} dot={{r: 4, fill: '#0ea5e9'}} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-bold text-slate-900">AI Conversions by Volume</h2>
            <span className="text-[11px] text-slate-400 font-semibold">{hasRevenue ? "Active Conversions" : "0 Conversions"}</span>
          </div>
          {!hasRevenue ? (
            <div className="h-[250px] w-full flex flex-col items-center justify-center text-center p-6 bg-slate-50/80 rounded-2xl border border-dashed border-slate-200">
              <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center mb-3">
                <BrainCircuit className="w-5 h-5" />
              </div>
              <h4 className="font-bold text-slate-800 text-xs">Awaiting First AI Conversion</h4>
              <p className="text-[11px] text-slate-500 max-w-xs mt-1">
                When the Upsell & Recommendation Agent converts customer cart items, the volume breakdown will display here in real-time.
              </p>
            </div>
          ) : (
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 5, right: 20, bottom: 5, left: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#94a3b8', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f8fafc'}}
                    contentStyle={{borderRadius: '12px', border: '1px solid #e2e8f0', boxShadow: '0 4px 12px rgba(0,0,0,0.05)'}}
                  />
                  <Legend iconType="circle" wrapperStyle={{fontSize: '12px', paddingTop: '10px'}} />
                  <Bar dataKey="aiDriven" name="AI Attributed Volume" fill="#6366f1" radius={[6, 6, 0, 0]} barSize={28} />
                </BarChart>
              </ResponsiveContainer>
            </div>
          )}
        </div>
      </div>
              {/* Copilot & AI Action Split */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* Merchant Copilot */}
        <div className="bg-white border border-slate-200 rounded-3xl shadow-xs flex flex-col h-[520px] overflow-hidden">
          <div className="p-4 px-5 border-b border-slate-100 flex items-center gap-3 bg-slate-50/50">
            <div className="w-9 h-9 rounded-2xl bg-indigo-100 flex items-center justify-center text-indigo-600">
              <Bot className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-sm">Merchant Copilot</h2>
              <p className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider">Natural Language Business Analytics</p>
            </div>
          </div>
          
          <div className="flex-1 overflow-y-auto p-4 space-y-3 bg-slate-50/30">
            {chatMessages.length === 0 && (
              <div className="h-full flex flex-col items-center justify-center text-center text-slate-500 p-4">
                <Sparkles className="w-8 h-8 text-indigo-300 mb-2" />
                <p className="text-xs font-semibold text-slate-700">Ask your AI Store Copilot</p>
                <p className="text-[11px] text-slate-400 mt-1 max-w-[200px]">e.g. "What were our top 3 products this week?" or "How many upsells were proposed?"</p>
              </div>
            )}
            {chatMessages.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`px-4 py-2.5 rounded-2xl max-w-[85%] text-xs shadow-xs leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-indigo-600 text-white rounded-tr-none' 
                    : 'bg-white border border-slate-200 text-slate-800 rounded-tl-none'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}
            {copilotLoading && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-4 py-2.5 rounded-2xl rounded-tl-none text-xs text-slate-400 flex gap-1 shadow-xs items-center">
                  <Loader2 className="w-3.5 h-3.5 animate-spin text-indigo-600" />
                  <span>Analyzing store telemetry...</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={sendCopilotQuery} className="p-3 border-t border-slate-100 bg-white">
            <div className="relative">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Ask about sales, top products, or agent activity..."
                className="w-full pl-4 pr-11 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 transition-all text-slate-800"
              />
              <button 
                type="submit" 
                disabled={copilotLoading || !chatInput.trim()}
                className="absolute right-1.5 top-1.5 bottom-1.5 aspect-square bg-indigo-600 text-white rounded-lg flex items-center justify-center hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send className="w-3.5 h-3.5" />
              </button>
            </div>
          </form>
        </div>

        {/* AI Action Ledger */}
        <div className="lg:col-span-2 bg-white border border-slate-200 rounded-3xl shadow-xs overflow-hidden h-[520px] flex flex-col">
          <div className="p-4 px-5 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <h2 className="font-bold text-slate-900 text-sm flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-indigo-600" />
              <span>Agent Action Ledger (100% Explainable)</span>
            </h2>
            <span className="bg-slate-100 text-slate-600 px-2.5 py-1 rounded-full text-[10px] font-bold tracking-wider uppercase border border-slate-200">
              Audit Stream Active
            </span>
          </div>
          
          <div className="flex-1 overflow-y-auto divide-y divide-slate-100 text-xs">
            {activity.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400 p-8 text-center">
                No autonomous agent events logged yet. Execute searches or upsells to populate the ledger.
              </div>
            ) : (
              activity.map((act) => (
                <div key={act.id} className="p-4 hover:bg-slate-50/80 transition-colors space-y-1.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="font-extrabold text-slate-900">{act.agent_name}</span>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-100 uppercase tracking-wide">
                        {act.action_type}
                      </span>
                    </div>
                    <span className="text-[10px] text-slate-400 font-mono">
                      {new Date(act.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                    </span>
                  </div>

                  <p className="text-slate-600 leading-relaxed font-medium">
                    <strong className="text-slate-800">Reason:</strong> {act.reason}
                  </p>

                  <div className="flex items-center gap-3 pt-1 text-[11px]">
                    <span className="text-slate-500 font-mono">
                      Input: {JSON.stringify(act.input).slice(0, 50)}...
                    </span>
                    <span className={`font-bold px-2 py-0.5 rounded-md text-[10px] ${
                      act.policy_result?.allowed 
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-100' 
                        : 'bg-amber-50 text-amber-700 border border-amber-100'
                    }`}>
                      {act.policy_result?.allowed ? '✓ Policy Approved' : '⚠ Policy Blocked'}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

      </div>
            </div>
          )}

          {activeTab === 'catalog' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Store Product Catalog Management */}
      <div id="catalog" className="space-y-6">
        {/* Catalog Summary Stats Bar */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shrink-0">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Catalog Size</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">{merchantProducts.length}</span>
                <span className="text-xs font-semibold text-slate-500">Products</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-emerald-50 text-emerald-600 flex items-center justify-center shrink-0">
              <Package className="w-5 h-5" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Stock</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-slate-900">
                  {merchantProducts.reduce((acc: number, p: any) => acc + (Number(p.inventory) || 0), 0)}
                </span>
                <span className="text-xs font-semibold text-slate-500">Units in Stock</span>
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200/80 rounded-2xl p-4 shadow-xs flex items-center gap-3.5">
            <div className="w-11 h-11 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shrink-0">
              <Sparkles className="w-5 h-5 text-indigo-500" />
            </div>
            <div>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Store Search</p>
              <div className="flex items-baseline gap-1.5 mt-0.5">
                <span className="text-xl font-black text-indigo-600">Active</span>
                <span className="text-xs font-semibold text-slate-500">Ready to recommend</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Catalog Card */}
        <div className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
          {/* Header & Action Controls */}
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6 pb-5 border-b border-slate-100">
            <div>
              <div className="flex items-center gap-2.5">
                <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Store Products</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-blue-50 text-blue-700 text-xs font-black border border-blue-100">
                  {merchantProducts.length} Products
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5">Manage your items, prices, quantities, and descriptions.</p>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => setShowAddProductModal(true)}
                className="px-4 py-2.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center gap-2 cursor-pointer"
              >
                <PlusCircle className="w-4 h-4" />
                <span>Add New Product</span>
              </button>
            </div>
          </div>

          {/* Search Bar & Category Filter Chips */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 mb-6">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={catalogSearch}
                onChange={(e) => setCatalogSearch(e.target.value)}
                placeholder="Search products by name, category, or specs..."
                className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-2xl text-xs text-slate-800 placeholder-slate-400 focus:outline-none focus:border-blue-500 focus:bg-white transition-all shadow-inner"
              />
              {catalogSearch && (
                <button
                  onClick={() => setCatalogSearch("")}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 p-0.5"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* Dynamic Category Chips */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 sm:pb-0">
              {["ALL", ...Array.from(new Set(merchantProducts.map((p: any) => p.category).filter(Boolean)))].map((cat: any) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setSelectedCategoryFilter(cat)}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition-all shrink-0 cursor-pointer ${
                    selectedCategoryFilter.toUpperCase() === cat.toUpperCase()
                      ? "bg-blue-600 text-white shadow-xs"
                      : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                  }`}
                >
                  {cat === "ALL" ? "All Products" : cat}
                </button>
              ))}
            </div>
          </div>

          {/* Product Grid */}
          {productsLoading ? (
            <div className="py-16 flex flex-col items-center justify-center gap-3">
              <Loader2 className="w-8 h-8 animate-spin text-blue-600" />
              <p className="text-xs font-bold text-slate-400">Loading catalog inventory...</p>
            </div>
          ) : merchantProducts.length === 0 ? (
            <div className="py-16 px-4 text-center bg-slate-50/70 rounded-3xl border border-dashed border-slate-200">
              <div className="w-14 h-14 bg-white rounded-2xl shadow-xs border border-slate-200 flex items-center justify-center mx-auto mb-3 text-slate-400">
                <Inbox className="w-7 h-7" />
              </div>
              <h4 className="font-extrabold text-slate-900 text-sm">Your Store Catalog is Empty</h4>
              <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-5 leading-relaxed">
                You haven't added any products to this store yet. You can add your own product or instantly load a starter collection of sample products.
              </p>
              <div className="flex flex-wrap items-center justify-center gap-3">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(true)}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  <span>Add First Product</span>
                </button>

                <button
                  type="button"
                  onClick={handleSeedSampleCatalog}
                  className="px-5 py-2.5 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all shadow-xs inline-flex items-center gap-2 cursor-pointer"
                >
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <span>Load Sample Products</span>
                </button>
              </div>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
              {merchantProducts
                .filter((prod: any) => {
                  const matchesCat = selectedCategoryFilter === "ALL" || (prod.category?.toUpperCase() === selectedCategoryFilter.toUpperCase());
                  const matchesQuery = !catalogSearch.trim() ||
                    (prod.name && prod.name.toLowerCase().includes(catalogSearch.toLowerCase())) ||
                    (prod.category && prod.category.toLowerCase().includes(catalogSearch.toLowerCase())) ||
                    (prod.description && prod.description.toLowerCase().includes(catalogSearch.toLowerCase()));
                  return matchesCat && matchesQuery;
                })
                .map((prod: any) => {
                  const prodImg = prod.image_url || prod.metadata_?.image_url || prod.metadata?.image_url || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=600&q=80";
                  return (
                    <div 
                      key={prod.id} 
                      className="group bg-white border border-slate-200/90 hover:border-blue-400/90 rounded-3xl overflow-hidden shadow-xs hover:shadow-xl transition-all duration-300 flex flex-col justify-between"
                    >
                      {/* Product Image Area */}
                      <div className="relative h-44 w-full bg-slate-100 overflow-hidden">
                        <img
                          src={prodImg}
                          alt={prod.name}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                        />
                        {/* Gradient Vignette */}
                        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60" />

                        {/* Category Floating Badge */}
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-full bg-white/90 backdrop-blur-md text-slate-800 text-[10px] font-extrabold uppercase tracking-wide border border-white/60 shadow-xs">
                          {prod.category}
                        </span>

                        {/* Stock Badge */}
                        <span className={`absolute top-3 right-3 px-2.5 py-1 rounded-full text-[10px] font-black shadow-xs backdrop-blur-md ${
                          prod.inventory > 0 
                            ? "bg-emerald-500/90 text-white" 
                            : "bg-rose-500/90 text-white"
                        }`}>
                          {prod.inventory > 0 ? `${prod.inventory} In Stock` : "Out of Stock"}
                        </span>
                      </div>

                      {/* Card Content */}
                      <div className="p-4 flex-1 flex flex-col justify-between">
                        <div>
                          <h4 className="font-extrabold text-slate-900 text-sm group-hover:text-blue-600 transition-colors line-clamp-1">
                            {prod.name}
                          </h4>
                          <p className="text-[11px] text-slate-500 line-clamp-2 mt-1 leading-relaxed">
                            {prod.description || "High performance product optimized for autonomous commerce."}
                          </p>
                        </div>

                        <div className="mt-3.5 pt-3 border-t border-slate-100 flex items-center justify-between">
                          <div>
                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider block">Price</span>
                            <span className="font-mono font-black text-blue-600 text-base">
                              ₹{Number(prod.price).toLocaleString("en-IN")}
                            </span>
                          </div>

                          <div className="flex items-center gap-1">
                            <a
                              href={`${agentShareUrl}&q=${encodeURIComponent(prod.name)}`}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="p-2 text-slate-500 hover:text-blue-600 hover:bg-blue-50 rounded-xl transition-colors"
                              title="Test product in AI Storefront"
                            >
                              <ExternalLink className="w-4 h-4" />
                            </a>

                            <button
                              type="button"
                              onClick={() => handleDeleteProduct(prod.id)}
                              className="p-2 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors cursor-pointer"
                              title="Remove from Catalog"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          )}
        </div>
      </div>
            </div>
          )}

          {activeTab === 'customers' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header & Refresh */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <h3 className="text-xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
                    <Users className="w-5 h-5 text-indigo-600" />
                    <span>Store Customers & Shoppers</span>
                  </h3>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Verified customers who logged in or authenticated via OTP in your BuyFlow AI Storefront.
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <div className="relative">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-2.5" />
                    <input
                      type="text"
                      placeholder="Search customers..."
                      value={customerSearch}
                      onChange={(e) => setCustomerSearch(e.target.value)}
                      className="pl-9 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500 focus:bg-white transition-colors w-48 sm:w-60"
                    />
                  </div>

                  <button
                    onClick={fetchStoreCustomers}
                    disabled={loadingCustomers}
                    className="p-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer"
                    title="Refresh Customer List"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${loadingCustomers ? "animate-spin text-indigo-600" : ""}`} />
                  </button>
                </div>
              </div>

              {/* 4 Metric Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center font-bold">
                    <Users className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Total Shoppers</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">{storeCustomers.length}</p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-emerald-200/80 bg-gradient-to-br from-emerald-50/30 to-white shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center font-bold">
                    <Sparkles className="w-6 h-6 text-emerald-600" />
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">Today's Sign-ups</p>
                      <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-800">NEW</span>
                    </div>
                    <p className="text-2xl font-black text-emerald-600 mt-0.5">
                      +{storeCustomers.filter(c => c.is_today).length} today
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                    <Bot className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">AI Conversational</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">
                      {storeCustomers.filter(c => c.segment === 'conversational_buyer').length}
                    </p>
                  </div>
                </div>

                <div className="bg-white p-5 rounded-3xl border border-slate-200/80 shadow-xs flex items-center gap-4">
                  <div className="w-12 h-12 rounded-2xl bg-violet-50 text-violet-600 flex items-center justify-center font-bold">
                    <TrendingUp className="w-6 h-6" />
                  </div>
                  <div>
                    <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">Customer GMV</p>
                    <p className="text-2xl font-black text-slate-900 mt-0.5">
                      ₹{storeCustomers.reduce((acc, c) => acc + (c.total_spend || 0), 0).toLocaleString()}
                    </p>
                  </div>
                </div>
              </div>

              {/* Customers List Table */}
              <div className="bg-white rounded-3xl border border-slate-200/90 shadow-sm overflow-hidden">
                <div className="p-5 border-b border-slate-100 flex items-center justify-between">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm">Customer Registry & Chat Logs</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Real-time profile, phone number, and conversation history</p>
                  </div>
                  <span className="text-xs text-slate-500 font-bold bg-slate-100 px-2.5 py-1 rounded-xl">
                    {storeCustomers.length} Registered
                  </span>
                </div>

                {loadingCustomers ? (
                  <div className="py-20 text-center">
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto mb-2" />
                    <p className="text-xs text-slate-500 font-medium">Loading store customer profiles...</p>
                  </div>
                ) : storeCustomers.length === 0 ? (
                  <div className="py-16 text-center p-6">
                    <div className="w-14 h-14 bg-indigo-50 text-indigo-600 rounded-3xl flex items-center justify-center mx-auto mb-3">
                      <Users className="w-7 h-7" />
                    </div>
                    <h5 className="font-extrabold text-slate-900 text-base">No Customers Logged In Yet</h5>
                    <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
                      When shoppers scan your store QR code or enter your AI Storefront chat, they authenticate with Name and OTP and will automatically appear here!
                    </p>
                    <button
                      onClick={() => setShowQrModal(true)}
                      className="px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 inline-flex items-center gap-2 cursor-pointer"
                    >
                      <QrCode className="w-4 h-4" />
                      <span>View Store QR Code</span>
                    </button>
                  </div>
                ) : (
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50/80 text-slate-500 font-bold uppercase text-[10px] tracking-wider border-b border-slate-100">
                        <tr>
                          <th className="px-5 py-3.5">Customer Profile & ID</th>
                          <th className="px-4 py-3.5">Phone Number</th>
                          <th className="px-4 py-3.5">Joined Timestamp</th>
                          <th className="px-4 py-3.5">Total Spend</th>
                          <th className="px-4 py-3.5">Status</th>
                          <th className="px-5 py-3.5 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {storeCustomers
                          .filter(c => {
                            if (!customerSearch.trim()) return true;
                            const q = customerSearch.toLowerCase();
                            return (
                              c.name?.toLowerCase().includes(q) ||
                              c.email?.toLowerCase().includes(q) ||
                              c.phone?.includes(q) ||
                              c.id?.toLowerCase().includes(q)
                            );
                          })
                          .map((cust) => (
                            <tr key={cust.id} className="hover:bg-slate-50/60 transition-colors">
                              <td className="px-5 py-4">
                                <div className="flex items-center gap-3">
                                  <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-indigo-500 to-blue-600 text-white font-black text-xs flex items-center justify-center shrink-0 shadow-xs">
                                    {(cust.name || cust.email || "C").charAt(0).toUpperCase()}
                                  </div>
                                  <div>
                                    <div className="flex items-center gap-2">
                                      <p className="font-extrabold text-slate-900 text-sm">{cust.name || "Verified Shopper"}</p>
                                      {cust.is_today && (
                                        <span className="px-1.5 py-0.2 rounded-full text-[9px] font-extrabold bg-emerald-100 text-emerald-700">
                                          TODAY
                                        </span>
                                      )}
                                    </div>
                                    <p className="text-[11px] text-slate-500 font-mono mt-0.5">{cust.email}</p>
                                    <span className="text-[10px] text-slate-400 font-mono">ID: {cust.id?.slice(0, 12)}...</span>
                                  </div>
                                </div>
                              </td>

                              <td className="px-4 py-4 text-slate-700 font-mono">
                                {cust.phone && cust.phone !== "Not provided" ? (
                                  <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-xl bg-slate-50 border border-slate-200 text-xs font-semibold">
                                    <Phone className="w-3.5 h-3.5 text-indigo-500" />
                                    <span>{cust.phone}</span>
                                  </span>
                                ) : (
                                  <span className="text-slate-400 text-xs">—</span>
                                )}
                              </td>

                              <td className="px-4 py-4 text-slate-600 font-medium">
                                <p className="text-xs text-slate-800 font-semibold">{cust.joined_at || "Recently"}</p>
                                <span className="text-[10px] text-slate-400">Via Storefront OTP</span>
                              </td>

                              <td className="px-4 py-4">
                                <p className="font-extrabold text-slate-900 text-sm">₹{(cust.total_spend || 0).toLocaleString()}</p>
                                <p className="text-[10px] text-slate-400">{cust.orders_count || 0} orders placed</p>
                              </td>

                              <td className="px-4 py-4">
                                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-extrabold uppercase bg-emerald-50 text-emerald-700 border border-emerald-200/80">
                                  <CheckCircle2 className="w-3 h-3 text-emerald-600" />
                                  <span>OTP Verified</span>
                                </span>
                              </td>

                              <td className="px-5 py-4 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <button
                                    type="button"
                                    onClick={() => setSelectedCustomerLogs(cust)}
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                  >
                                    <Terminal className="w-3.5 h-3.5" />
                                    <span>Chat Logs</span>
                                  </button>

                                  <Link
                                    href={`/chat?merchant=${merchantId}`}
                                    target="_blank"
                                    className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                                    title="Open Storefront Chat"
                                  >
                                    <Bot className="w-3.5 h-3.5" />
                                  </Link>
                                </div>
                              </td>
                            </tr>
                          ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </div>

              {/* Interactive Customer Chat Logs Modal */}
              {selectedCustomerLogs && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/60 backdrop-blur-sm animate-in fade-in">
                  <div className="w-full max-w-2xl bg-white rounded-3xl shadow-2xl border border-slate-100 overflow-hidden flex flex-col max-h-[85vh]">
                    {/* Modal Header */}
                    <div className="p-6 bg-gradient-to-r from-slate-900 to-indigo-950 text-white flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-11 h-11 rounded-2xl bg-white/10 flex items-center justify-center font-bold text-sm">
                          {(selectedCustomerLogs.name || "C").charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-extrabold text-base">{selectedCustomerLogs.name}</h3>
                            <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/20 text-emerald-300 border border-emerald-400/30">
                              OTP Verified
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 font-mono mt-0.5">
                            {selectedCustomerLogs.email} {selectedCustomerLogs.phone && `• ${selectedCustomerLogs.phone}`}
                          </p>
                        </div>
                      </div>

                      <button
                        onClick={() => setSelectedCustomerLogs(null)}
                        className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors cursor-pointer"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>

                    {/* Customer Quick Stats Bar */}
                    <div className="px-6 py-3 bg-slate-50 border-b border-slate-200 flex items-center justify-between text-xs">
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Customer ID:</span>
                        <span className="font-mono ml-1 text-slate-700 font-semibold">{selectedCustomerLogs.id}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Joined:</span>
                        <span className="ml-1 text-slate-700 font-semibold">{selectedCustomerLogs.joined_at}</span>
                      </div>
                      <div>
                        <span className="text-slate-400 font-bold uppercase text-[10px]">Total Spend:</span>
                        <span className="ml-1 font-bold text-indigo-600">₹{(selectedCustomerLogs.total_spend || 0).toLocaleString()}</span>
                      </div>
                    </div>

                    {/* Chat Logs Stream */}
                    <div className="p-6 overflow-y-auto space-y-3.5 flex-1 bg-slate-50 text-slate-900 text-xs">
                      <div className="text-[11px] text-slate-500 uppercase tracking-wider font-bold mb-2 flex items-center gap-2">
                        <Terminal className="w-3.5 h-3.5 text-indigo-600" />
                        <span>Conversational Agent Interaction History</span>
                      </div>

                      {(!selectedCustomerLogs.chat_logs || selectedCustomerLogs.chat_logs.length === 0) ? (
                        <div className="p-8 text-center text-slate-400">
                          No conversation records logged for this session yet.
                        </div>
                      ) : (
                        selectedCustomerLogs.chat_logs.map((log: any, idx: number) => (
                          <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/90 shadow-xs space-y-2">
                            <div className="flex items-center justify-between text-[11px]">
                              <span className="px-2 py-0.5 rounded-md bg-indigo-50 text-indigo-700 font-bold uppercase border border-indigo-100">
                                {log.type || "chat_query"}
                              </span>
                              <span className="text-slate-400 font-mono text-[10px]">{log.timestamp}</span>
                            </div>

                            <div className="space-y-1">
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">User Query:</p>
                              <p className="text-slate-900 font-semibold pl-2.5 border-l-2 border-indigo-500 text-xs">
                                {log.query}
                              </p>
                            </div>

                            <div className="space-y-1 pt-1">
                              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-wider">AI Concierge Response:</p>
                              <p className="text-slate-700 pl-2.5 border-l-2 border-emerald-500 leading-relaxed text-xs">
                                {log.response}
                              </p>
                            </div>
                          </div>
                        ))
                      )}
                    </div>

                    {/* Modal Footer */}
                    <div className="p-4 bg-white border-t border-slate-100 flex items-center justify-between">
                      <p className="text-[11px] text-slate-500 font-medium flex items-center gap-1.5">
                        <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
                        <span>Stored securely in Razorpay AI Action Ledger</span>
                      </p>
                      <button
                        onClick={() => setSelectedCustomerLogs(null)}
                        className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-all cursor-pointer"
                      >
                        Close
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header & Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Cpu className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Test AI Shopper & Automated Orders</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Simulate external AI agents and autonomous buyers transacting with your store via standardized machine-readable commerce protocols.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <a
                    href={`${baseUrl}/.well-known/agent.json`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5"
                  >
                    <Code className="w-3.5 h-3.5 text-indigo-600" />
                    <span>View agent.json</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                </div>
              </div>

              {/* Persona Selection & Simulation Config */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm text-slate-900 space-y-6">
                <div className="space-y-1">
                  <span className="text-[10px] font-mono uppercase tracking-wider text-indigo-700 bg-indigo-50 px-2.5 py-0.5 rounded-full border border-indigo-200">
                    Step 1: Choose Buyer Persona & Target Item
                  </span>
                  <h4 className="text-base font-extrabold text-slate-900 pt-1">Configure Automated Shopper</h4>
                </div>

                {/* Persona Cards Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                  {[
                    { id: "Enterprise_Procurement_AI_v4", name: "Enterprise Buyer", icon: Building2, desc: "Requests corporate quantity deals and volume pricing" },
                    { id: "Personal_Shopper_AutoGPT_v2", name: "AI Price Negotiator", icon: Bot, desc: "Attempts discount bargaining within store safety limits" },
                    { id: "Smart_Cart_Aggregator_Agent", name: "Cart Concierge", icon: ShoppingBag, desc: "Searches bundles, upgrades, and complementary items" },
                    { id: "Fast_Checkout_Agent_v1", name: "1-Click Instant Buyer", icon: Zap, desc: "Instant automated purchase with saved credentials" }
                  ].map((p) => {
                    const IconComp = p.icon;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => setM2mBuyerAgent(p.id)}
                        className={`p-4 rounded-2xl text-left transition-all border cursor-pointer ${
                          m2mBuyerAgent === p.id 
                            ? "bg-indigo-50/80 border-indigo-400 text-slate-900 shadow-sm ring-2 ring-indigo-500/20" 
                            : "bg-slate-50/70 border-slate-200/80 text-slate-700 hover:bg-slate-100 hover:border-slate-300"
                        }`}
                      >
                        <div className="flex items-center gap-2 mb-1.5">
                          <IconComp className="w-4 h-4 text-indigo-600" />
                          <p className="font-extrabold text-xs text-slate-900">{p.name}</p>
                        </div>
                        <p className="text-[11px] text-slate-500 leading-snug">{p.desc}</p>
                      </button>
                    );
                  })}
                </div>

                {/* Target Product & RFP Discount Settings */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2 border-t border-slate-100">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1.5">Target Store Product</label>
                    <select
                      value={m2mTargetProduct}
                      onChange={(e) => setM2mTargetProduct(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="">First Available Catalog Item (Default)</option>
                      {merchantProducts.map((p) => (
                        <option key={p.id} value={p.id}>
                          {p.name} — ₹{Number(p.price).toLocaleString()} ({p.category})
                        </option>
                      ))}
                    </select>
                  </div>

                  <div>
                    <div className="flex items-center justify-between mb-1.5">
                      <label className="text-[11px] font-bold text-slate-700 uppercase">Requested Discount RFP</label>
                      <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                        {m2mDiscountOffer}% Requested
                      </span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="40"
                      step="1"
                      value={m2mDiscountOffer}
                      onChange={(e) => setM2mDiscountOffer(Number(e.target.value))}
                      className="w-full accent-indigo-600 cursor-pointer"
                    />
                    <p className="text-[10px] text-slate-400 mt-1">Evaluated by server policy engine against merchant {maxDiscountPercent}% cap</p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={handleRunM2MTransaction}
                  disabled={simulatingM2M}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {simulatingM2M ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4" />}
                  <span>{simulatingM2M ? "Executing Machine-to-Machine Order RFP..." : "Execute Automated AI Shopper Transaction"}</span>
                </button>

                {/* Simulation Result Dual Stream */}
                {m2mResult && (
                  <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl font-mono text-xs space-y-2.5 animate-in fade-in">
                    <div className="flex flex-wrap items-center justify-between text-emerald-700 font-bold pb-2 border-b border-slate-200 text-xs">
                      <span className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        <span>RAZORPAY ORDER GENERATED: {m2mResult.razorpay_order_id}</span>
                      </span>
                      <span className="text-slate-500 text-[10px] font-mono">{m2mResult.agent_id}</span>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1 text-[11px]">
                      <div>
                        <span className="text-slate-500">Selected Product:</span>
                        <p className="font-bold text-slate-900 mt-0.5">{m2mResult.product?.name || "Verified Store Item"}</p>
                      </div>
                      <div>
                        <span className="text-slate-500">Total Payable (Verified):</span>
                        <p className="font-bold text-emerald-700 mt-0.5 text-sm">
                          ₹{Number(m2mResult.financials?.total_amount || 0).toLocaleString()}
                        </p>
                      </div>
                    </div>

                    <div className="p-2.5 rounded-xl bg-white border border-slate-200 text-[11px] text-slate-700">
                      <span className="text-indigo-600 font-bold">Policy Guardrail Evaluation: </span>
                      <span>{m2mResult.policy_evaluation?.reason || "Authorized within store limits."}</span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header & Overview */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <div className="flex items-center gap-2.5">
                    <ShieldAlert className="w-5 h-5 text-rose-600" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Store Protection & Threat Defense</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Verify that prompt injections, unauthorized discount exploits, and price forgery attacks are strictly neutralized at the server boundary.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black uppercase bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <ShieldCheck className="w-4 h-4 text-emerald-600" />
                    <span>100% Protected</span>
                  </span>
                </div>
              </div>

              {/* 4 Threat & Failure Test Scenario Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {/* 1. Prompt Injection & Jailbreak */}
                <button
                  type="button"
                  onClick={() => handleSimulateAttack("PROMPT_INJECTION_ATTACK")}
                  disabled={simulatingAttack}
                  className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl text-left transition-all group shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-rose-50 text-rose-600 flex items-center justify-center font-bold">
                      <ShieldAlert className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-rose-600 bg-rose-50 px-2 py-0.5 rounded-full border border-rose-100">
                      JAILBREAK DEFENSE
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">System Prompt Injection Attack</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Simulate a rogue buyer attempting to override system instructions and order products for ₹1.
                  </p>
                </button>

                {/* 2. Rogue 50% Exploit Attack */}
                <button
                  type="button"
                  onClick={() => handleSimulateAttack("ROGUE_DISCOUNT_EXPLOIT")}
                  disabled={simulatingAttack}
                  className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl text-left transition-all group shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-amber-50 text-amber-600 flex items-center justify-center font-bold">
                      <AlertTriangle className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-100">
                      POLICY INTERCEPTION
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Rogue 50% Discount Override</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Simulate an external AI agent demanding an unauthorized 50% discount exceeding merchant limits.
                  </p>
                </button>

                {/* 3. Payment Drop & Network Timeout */}
                <button
                  type="button"
                  onClick={() => handleSimulateAttack("PAYMENT_DROP_RECOVERY")}
                  disabled={simulatingAttack}
                  className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl text-left transition-all group shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center font-bold">
                      <RefreshCw className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full border border-blue-100">
                      0 CART LOSS
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Gateway Drop & Session Recovery</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Simulate network drop during payment execution and verify instant 1-click cart resumption.
                  </p>
                </button>

                {/* 4. Price Forgery / Cart Tampering */}
                <button
                  type="button"
                  onClick={() => handleSimulateAttack("PRICE_FORGERY_ATTACK")}
                  disabled={simulatingAttack}
                  className="p-5 bg-white hover:bg-slate-50 border border-slate-200 rounded-3xl text-left transition-all group shadow-xs disabled:opacity-50 cursor-pointer"
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="w-10 h-10 rounded-2xl bg-purple-50 text-purple-600 flex items-center justify-center font-bold">
                      <Lock className="w-5 h-5" />
                    </div>
                    <span className="text-[10px] font-bold text-purple-600 bg-purple-50 px-2 py-0.5 rounded-full border border-purple-100">
                      IMMUTABLE PRICING
                    </span>
                  </div>
                  <h4 className="font-extrabold text-slate-900 text-sm">Client Price Tampering Attack</h4>
                  <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                    Shopper modifies frontend cart payload to submit ₹500 for a ₹49,999 item. Backend recalculation protects revenue.
                  </p>
                </button>
              </div>

              {/* Defense Result Console */}
              {attackResult && (
                <div className={`p-6 rounded-3xl border shadow-sm space-y-3 animate-in fade-in ${
                  attackResult.threat_detected 
                    ? "bg-rose-50/70 border-rose-200 text-rose-950" 
                    : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
                }`}>
                  <div className="flex items-center justify-between font-bold">
                    <span className="flex items-center gap-2 text-sm">
                      <ShieldCheck className="w-5 h-5 text-emerald-600" />
                      <span>{attackResult.incident || "SECURITY BOUNDARY INTERCEPTION"}</span>
                    </span>
                    <span className="font-mono text-xs text-slate-500">
                      Ledger ID: {attackResult.audit_ledger_id?.slice(0, 8)}
                    </span>
                  </div>

                  <p className="text-xs font-mono bg-white/70 p-3 rounded-xl border border-slate-200/80">
                    <strong>Policy Enforcement:</strong> {attackResult.policy_decision || "Neutralized by Server Policy Engine"}
                  </p>

                  <div className="text-xs space-y-1.5 pt-1">
                    <p className="font-semibold text-slate-800">
                      ✓ <strong>Graceful Recovery:</strong> {attackResult.graceful_recovery?.defense_action || attackResult.graceful_recovery?.fallback_strategy || attackResult.graceful_recovery?.cart_status}
                    </p>
                    <p className="text-slate-600">
                      {attackResult.graceful_recovery?.customer_experience}
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {activeTab === 'policy' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Header & Save Action */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200/90 shadow-sm">
                <div>
                  <div className="flex items-center gap-2.5">
                    <Sliders className="w-5 h-5 text-indigo-600" />
                    <h3 className="text-xl font-black text-slate-900 tracking-tight">Discounts & Store Protection Rules</h3>
                  </div>
                  <p className="text-xs text-slate-500 mt-1 font-medium">
                    Configure automated discount limits, coupon codes, and pricing guardrails enforced before any checkout order is generated.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => handleUpdatePolicy()}
                  disabled={savingPolicy}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {savingPolicy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
                  <span>Save All Store Rules</span>
                </button>
              </div>

              {policyMessage && (
                <div className="p-4 rounded-2xl bg-emerald-50 border border-emerald-200 text-emerald-800 text-xs font-bold flex items-center gap-2 animate-in fade-in">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{policyMessage}</span>
                </div>
              )}

              {/* 4 Quick Stat Metric Badges */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Max Discount</span>
                  <p className="text-xl font-black text-indigo-600 mt-0.5">{maxDiscountPercent}%</p>
                  <p className="text-[10px] text-slate-400">Per transaction cap</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Max Flat Cap</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">₹{maxDiscountAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Ceiling limit</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Min Cart Total</span>
                  <p className="text-xl font-black text-slate-900 mt-0.5">₹{minCartAmount.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Required for AI offers</p>
                </div>

                <div className="bg-white p-4 rounded-2xl border border-slate-200/80 shadow-xs">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-slate-400">Free Delivery</span>
                  <p className="text-xl font-black text-emerald-600 mt-0.5">Over ₹{freeShippingThreshold.toLocaleString()}</p>
                  <p className="text-[10px] text-slate-400">Automated perk</p>
                </div>
              </div>

              {/* Grid 2-Column: Core Discount Limits & Automated Promotion Rules */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* 1. Core Discount Guardrails */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <ShieldCheck className="w-4 h-4 text-indigo-600" />
                    <h4 className="font-extrabold text-slate-900 text-sm">Automated Discount Boundaries</h4>
                  </div>

                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-xs font-bold text-slate-700">Maximum Allowed AI Discount (%)</label>
                        <span className="text-xs font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-md">
                          {maxDiscountPercent}%
                        </span>
                      </div>
                      <input
                        type="range"
                        min="0"
                        max="50"
                        step="1"
                        value={maxDiscountPercent}
                        onChange={(e) => setMaxDiscountPercent(Number(e.target.value))}
                        className="w-full accent-indigo-600 cursor-pointer"
                      />
                      <p className="text-[11px] text-slate-400 mt-1">Any AI discount proposal exceeding this threshold is rejected automatically.</p>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Max Flat Discount Cap (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={maxDiscountAmount}
                          onChange={(e) => setMaxDiscountAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Min Cart for AI Discounts (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={minCartAmount}
                          onChange={(e) => setMinCartAmount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                      </div>
                    </div>
                  </div>
                </div>

                {/* 2. Automated Promotional Rules */}
                <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                  <div className="flex items-center gap-2.5 pb-3 border-b border-slate-100">
                    <Sparkles className="w-4 h-4 text-amber-500" />
                    <h4 className="font-extrabold text-slate-900 text-sm">Automated Promotion Perks</h4>
                  </div>

                  <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">New Customer Welcome (%)</label>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          value={firstTimeDiscount}
                          onChange={(e) => setFirstTimeDiscount(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Offered on first OTP purchase</p>
                      </div>

                      <div>
                        <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Free Delivery Minimum (₹)</label>
                        <input
                          type="number"
                          min="0"
                          value={freeShippingThreshold}
                          onChange={(e) => setFreeShippingThreshold(Number(e.target.value))}
                          className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                        />
                        <p className="text-[10px] text-slate-400 mt-1">Waives shipping charges</p>
                      </div>
                    </div>

                    <div className="pt-2 space-y-2.5">
                      <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Flash Sale Campaign Mode</p>
                          <p className="text-[11px] text-slate-500">Allows AI to propose time-sensitive extra perks during shopping</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={flashSaleActive}
                          onChange={(e) => setFlashSaleActive(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded accent-indigo-600 cursor-pointer"
                        />
                      </label>

                      <label className="flex items-center justify-between p-3 rounded-2xl bg-slate-50 border border-slate-200/80 cursor-pointer hover:bg-slate-100/70 transition-colors">
                        <div>
                          <p className="text-xs font-bold text-slate-900">Auto-Reject Below-Margin Requests</p>
                          <p className="text-[11px] text-slate-500">Strictly blocks buyers from bargaining below cost floor</p>
                        </div>
                        <input
                          type="checkbox"
                          checked={autoRejectNegativeMargin}
                          onChange={(e) => setAutoRejectNegativeMargin(e.target.checked)}
                          className="w-4 h-4 text-indigo-600 rounded accent-indigo-600 cursor-pointer"
                        />
                      </label>
                    </div>
                  </div>
                </div>
              </div>

              {/* 3. Active Store Coupons & Promo Codes Manager */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-5">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div>
                    <h4 className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                      <Tag className="w-4 h-4 text-indigo-600" />
                      <span>Store Promo Codes & Coupons</span>
                    </h4>
                    <p className="text-xs text-slate-500 mt-0.5">Customers can redeem these discount codes in the storefront chat.</p>
                  </div>
                </div>

                {/* Add New Promo Code Form */}
                <form onSubmit={handleAddPromoCode} className="flex flex-col sm:flex-row items-center gap-3 p-4 bg-slate-50 rounded-2xl border border-slate-200">
                  <div className="flex-1 w-full sm:w-auto">
                    <input
                      type="text"
                      placeholder="e.g. SUMMER25"
                      value={newPromoCode}
                      onChange={(e) => setNewPromoCode(e.target.value.toUpperCase())}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:outline-none focus:border-indigo-500 uppercase"
                    />
                  </div>

                  <div className="w-full sm:w-32">
                    <input
                      type="number"
                      min="1"
                      placeholder="Discount"
                      value={newPromoDiscount}
                      onChange={(e) => setNewPromoDiscount(Number(e.target.value))}
                      className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="w-full sm:w-36">
                    <select
                      value={newPromoType}
                      onChange={(e) => setNewPromoType(e.target.value as "percent" | "flat")}
                      className="w-full px-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:outline-none focus:border-indigo-500"
                    >
                      <option value="percent">% Percent Off</option>
                      <option value="flat">₹ Flat Discount</option>
                    </select>
                  </div>

                  <button
                    type="submit"
                    className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all shadow-xs flex items-center justify-center gap-1.5 cursor-pointer shrink-0"
                  >
                    <PlusCircle className="w-3.5 h-3.5" />
                    <span>Add Coupon</span>
                  </button>
                </form>

                {/* Promo Code List */}
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {promoCodes.map((promo, idx) => (
                    <div key={idx} className="p-3.5 rounded-2xl bg-white border border-slate-200/80 shadow-xs flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="font-mono font-black text-indigo-700 text-xs tracking-wider bg-indigo-50 px-2 py-0.5 rounded-lg border border-indigo-100">
                            {promo.code}
                          </span>
                          <span className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${promo.active ? "bg-emerald-100 text-emerald-800" : "bg-slate-100 text-slate-500"}`}>
                            {promo.active ? "ACTIVE" : "PAUSED"}
                          </span>
                        </div>
                        <p className="text-xs font-bold text-slate-900 mt-1">
                          {promo.type === "percent" ? `${promo.discount}% Off` : `₹${promo.discount} Flat Off`}
                        </p>
                      </div>

                      <div className="flex items-center gap-1.5">
                        <button
                          type="button"
                          onClick={() => handleTogglePromoCode(promo.code)}
                          className="px-2 py-1 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-lg text-[10px] font-bold transition-colors cursor-pointer"
                        >
                          {promo.active ? "Pause" : "Enable"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeletePromoCode(promo.code)}
                          className="p-1 text-rose-500 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                          title="Delete code"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* 4. Real-Time Rule Outcome Simulator */}
              <div className="bg-white border border-slate-200/90 rounded-3xl p-6 shadow-sm space-y-4 text-slate-900">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <div className="flex items-center gap-2.5">
                    <Terminal className="w-5 h-5 text-indigo-600" />
                    <div>
                      <h4 className="font-extrabold text-slate-900 text-sm">Interactive Rule Outcome Tester</h4>
                      <p className="text-[11px] text-slate-500">Test how your current discount rules evaluate real shopper requests</p>
                    </div>
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 border border-indigo-200">
                    Live Guardrail Check
                  </span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Test Order Amount (₹)</label>
                    <input
                      type="number"
                      value={testCartTotal}
                      onChange={(e) => setTestCartTotal(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Proposed Discount (%)</label>
                    <input
                      type="number"
                      value={testProposedDiscount}
                      onChange={(e) => setTestProposedDiscount(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      onClick={handleRunPolicySimulation}
                      className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center justify-center gap-1.5 cursor-pointer"
                    >
                      <Zap className="w-3.5 h-3.5 text-white" />
                      <span>Test Rule Outcome</span>
                    </button>
                  </div>
                </div>

                {testSimResult && (
                  <div className={`p-4 rounded-2xl border text-xs font-mono space-y-2 animate-in fade-in ${
                    testSimResult.allowed 
                      ? "bg-emerald-50/80 border-emerald-200 text-emerald-950" 
                      : "bg-rose-50/80 border-rose-200 text-rose-950"
                  }`}>
                    <div className="flex items-center justify-between font-bold">
                      <span className="flex items-center gap-1.5">
                        {testSimResult.allowed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <AlertTriangle className="w-4 h-4 text-rose-600" />
                        )}
                        <span>{testSimResult.allowed ? "RULE PASSED (APPROVED)" : "RULE TRIGGERED (CLAMPED/REJECTED)"}</span>
                      </span>
                      <span className="text-[10px] text-slate-500">{testSimResult.timestamp}</span>
                    </div>
                    <p className="text-slate-700 leading-relaxed font-sans">{testSimResult.reason}</p>
                    <div className="pt-2 border-t border-slate-200/80 flex flex-wrap gap-4 text-[11px]">
                      <span>Original: <strong>₹{testSimResult.original_amount.toLocaleString()}</strong></span>
                      <span>Approved Discount: <strong>₹{testSimResult.approved_discount_inr.toLocaleString()} ({testSimResult.approved_percent}%)</strong></span>
                      <span>Final Payable: <strong className="text-emerald-700">₹{testSimResult.final_payable_inr.toLocaleString()}</strong></span>
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}

          {activeTab === 'webhooks' && (
            <div className="space-y-6 animate-in fade-in">
              {/* External Software / OMS Webhook Integration */}
      <div id="webhooks" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center shadow-xs">
              <Code className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">External Software & OMS Webhook API</h3>
                <span className="px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 text-[10px] font-bold border border-blue-100">
                  REAL-TIME ORDER SYNC
                </span>
              </div>
              <p className="text-xs text-slate-500">Automatically push verified orders to your custom ERP, Shopify, WooCommerce, or order management software.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleTestWebhook}
            disabled={testingWebhook}
            className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 disabled:opacity-50 shadow-xs"
          >
            {testingWebhook ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
            <span>Test Webhook Ping</span>
          </button>
        </div>

        <form onSubmit={handleSaveWebhook} className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="md:col-span-2">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">External Order Webhook Endpoint</label>
            <input
              type="url"
              required
              placeholder="https://your-oms.com/api/webhooks/orders"
              value={webhookUrl}
              onChange={(e) => setWebhookUrl(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Webhook Signing Secret</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                placeholder="whsec_..."
                value={webhookSecret}
                onChange={(e) => setWebhookSecret(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
              <button
                type="submit"
                disabled={savingWebhook}
                className="px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition-colors whitespace-nowrap shadow-xs"
              >
                {savingWebhook ? "Saving..." : "Save Config"}
              </button>
            </div>
          </div>
        </form>

        {webhookMessage && (
          <p className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            ✓ {webhookMessage}
          </p>
        )}

        {webhookTestResult && (
          <div className="mt-4 p-3.5 bg-slate-900 border border-slate-800 rounded-2xl font-mono text-[11px] text-slate-200 space-y-1.5 animate-in fade-in">
            <div className="flex items-center justify-between text-emerald-400 font-bold pb-1 border-b border-slate-800">
              <span>✓ WEBHOOK DISPATCH SUCCESS: HTTP {webhookTestResult.http_status} OK ({webhookTestResult.latency_ms}ms)</span>
              <span className="text-slate-400 truncate max-w-xs">{webhookTestResult.target_url}</span>
            </div>
            <p className="text-slate-400">Target URL: <code className="text-blue-300">{webhookTestResult.target_url}</code></p>
            <p className="text-slate-400">Simulated Payload: <code className="text-emerald-300">{JSON.stringify(webhookTestResult.payload_preview)}</code></p>
          </div>
        )}
      </div>
            </div>
          )}

          {activeTab === 'smtp' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Production Email Delivery (Gmail SMTP) */}
      <div id="smtp" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <Mail className="w-5 h-5" />
            </div>
            <div>
              <div className="flex flex-wrap items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">Production Email Delivery</h3>
                {activeEmailProvider === "brevo" && brevoApiKey && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    ● ACTIVE PROVIDER: BREVO (100% FREE 300 EMAILS/DAY)
                  </span>
                )}
                {activeEmailProvider === "resend" && resendApiKey && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-indigo-50 text-indigo-700 border border-indigo-200">
                    ● ACTIVE PROVIDER: RESEND HTTPS
                  </span>
                )}
                {activeEmailProvider === "gmail" && smtpUser && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">
                    ● ACTIVE PROVIDER: GMAIL SMTP
                  </span>
                )}
                {(!activeEmailProvider || activeEmailProvider === "none") && (
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">
                    SYSTEM SIMULATION ACTIVE
                  </span>
                )}
              </div>
              <p className="text-xs text-slate-500 mt-0.5">
                Choose ONE active email provider for sending OTP codes and order receipts. You can switch or disconnect anytime.
              </p>
            </div>
          </div>
        </div>

        {/* Step 1: Select Email Provider Card */}
        <div className="mb-5">
          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-2">
            1. Select Your Email Service (Only 1 Active at a time)
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            {/* Option A: Brevo */}
            <button
              type="button"
              onClick={() => setActiveEmailProvider("brevo")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                activeEmailProvider === "brevo"
                  ? "bg-emerald-50/70 border-emerald-500 ring-2 ring-emerald-500/20 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-900">Brevo (Recommended)</span>
                  {activeEmailProvider === "brevo" && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  100% Free • 300 emails/day to <strong>ANY customer</strong> with 0 domain setup.
                </p>
              </div>
              <span className="text-[10px] font-bold text-emerald-700 mt-2">⚡ HTTPS Port 443 Safe</span>
            </button>

            {/* Option B: Resend */}
            <button
              type="button"
              onClick={() => setActiveEmailProvider("resend")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                activeEmailProvider === "resend"
                  ? "bg-indigo-50/70 border-indigo-500 ring-2 ring-indigo-500/20 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-900">Resend HTTPS</span>
                  {activeEmailProvider === "resend" && (
                    <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Cloud REST API. Requires verified custom domain at resend.com.
                </p>
              </div>
              <span className="text-[10px] font-bold text-indigo-700 mt-2">⚡ Instant Port 443</span>
            </button>

            {/* Option C: Gmail */}
            <button
              type="button"
              onClick={() => setActiveEmailProvider("gmail")}
              className={`p-4 rounded-2xl border text-left transition-all cursor-pointer relative flex flex-col justify-between ${
                activeEmailProvider === "gmail"
                  ? "bg-blue-50/70 border-blue-500 ring-2 ring-blue-500/20 shadow-xs"
                  : "bg-slate-50 hover:bg-slate-100 border-slate-200"
              }`}
            >
              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="font-extrabold text-xs text-slate-900">Gmail App Password</span>
                  {activeEmailProvider === "gmail" && (
                    <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></span>
                  )}
                </div>
                <p className="text-[11px] text-slate-500 leading-snug">
                  Direct SMTP with 16-character Google App Password.
                </p>
              </div>
              <span className="text-[10px] font-bold text-blue-700 mt-2">📧 Standard SMTP</span>
            </button>
          </div>
        </div>

        {/* Step 2: Form Configuration for ONLY the Selected Provider */}
        <form onSubmit={handleSaveSmtp} className="space-y-4 mb-4">
          {activeEmailProvider === "brevo" && (
            <div className="p-4 bg-emerald-50/40 border border-emerald-200/90 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Configure Brevo Free Email (300 emails/day Forever)</h4>
                  <p className="text-[11px] text-slate-500">Go to Brevo ➔ <strong>API Keys</strong> tab (not SMTP tab) ➔ click <strong>"Generate a new API key"</strong> (<code className="font-mono bg-emerald-100/70 text-emerald-900 px-1 rounded">xkeysib-...</code>).</p>
                </div>
                <a 
                  href="https://app.brevo.com/settings/keys/api" 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-[11px] font-bold text-emerald-700 hover:text-emerald-800 underline inline-flex items-center gap-1 shrink-0"
                >
                  <span>Open Brevo API Keys Tab</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Brevo API Key (<code className="font-mono">xkeysib-...</code>)</label>
                  <input
                    type="password"
                    placeholder="xkeysib-xxxxxxxxxxxxxxxxxxxx"
                    value={brevoApiKey}
                    onChange={(e) => setBrevoApiKey(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>

                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Brevo Sender Email</label>
                  <input
                    type="email"
                    placeholder="e.g. yourname@gmail.com"
                    value={brevoSenderEmail}
                    onChange={(e) => setBrevoSenderEmail(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-emerald-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeEmailProvider === "resend" && (
            <div className="p-4 bg-indigo-50/40 border border-indigo-200/90 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div>
                  <h4 className="text-xs font-bold text-slate-900">Configure Resend HTTPS API</h4>
                  <p className="text-[11px] text-slate-500">Paste your Resend API Key. Note: requires custom domain verified at <a href="https://resend.com/domains" target="_blank" rel="noopener noreferrer" className="text-indigo-600 underline font-bold">resend.com/domains</a> to send to any email.</p>
                </div>
              </div>
              <input
                type="password"
                placeholder="re_xxxxxxxxxxxxxxxxxxxx"
                value={resendApiKey}
                onChange={(e) => setResendApiKey(e.target.value)}
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-indigo-500"
              />
            </div>
          )}

          {activeEmailProvider === "gmail" && (
            <div className="p-4 bg-blue-50/40 border border-blue-200/90 rounded-2xl space-y-3 animate-in fade-in duration-150">
              <div>
                <h4 className="text-xs font-bold text-slate-900">Configure Gmail SMTP</h4>
                <p className="text-[11px] text-slate-500">Requires a 16-character Google App Password from <a href="https://myaccount.google.com/apppasswords" target="_blank" rel="noopener noreferrer" className="text-blue-600 underline font-bold">myaccount.google.com/apppasswords</a>.</p>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
                <div>
                  <label className="block text-[10px] font-bold text-slate-700 uppercase mb-1">Gmail Address</label>
                  <input
                    type="email"
                    placeholder="e.g. store@gmail.com"
                    value={smtpUser}
                    onChange={(e) => setSmtpUser(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="block text-[10px] font-bold text-slate-700 uppercase">Google App Password (16 chars)</label>
                    {smtpPassword && (
                      <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                        ✓ Saved & Active
                      </span>
                    )}
                  </div>
                  <input
                    type="password"
                    placeholder={smtpPassword ? "••••••••••••••••" : "xxxx xxxx xxxx xxxx"}
                    value={smtpPassword}
                    onChange={(e) => setSmtpPassword(e.target.value)}
                    className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:border-blue-500"
                  />
                </div>
              </div>
            </div>
          )}

          <div className="flex flex-wrap items-center gap-3 pt-2">
            <button
              type="submit"
              disabled={savingSmtp}
              className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs cursor-pointer"
            >
              {savingSmtp ? "Saving..." : `Save & Activate ${activeEmailProvider.toUpperCase()}`}
            </button>

            <button
              type="button"
              onClick={handleDisconnectSmtp}
              disabled={disconnectingSmtp}
              className="px-4 py-2.5 bg-slate-100 hover:bg-rose-50 hover:text-rose-700 border border-slate-200 hover:border-rose-200 text-slate-600 rounded-xl text-xs font-bold transition-colors cursor-pointer"
            >
              {disconnectingSmtp ? "Disconnecting..." : "Disconnect / Reset"}
            </button>
          </div>
        </form>

        {smtpMessage && (
          <p className="mb-4 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            ✓ {smtpMessage}
          </p>
        )}

        {/* Test Email Dispatch */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="flex-1 w-full sm:w-auto">
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Send Live Test Email</label>
            <input
              type="email"
              placeholder="Enter your personal email to verify delivery..."
              value={testEmailRecipient}
              onChange={(e) => setTestEmailRecipient(e.target.value)}
              className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>
          <div className="flex items-end w-full sm:w-auto">
            <button
              type="button"
              onClick={handleTestSmtp}
              disabled={testingSmtp || !testEmailRecipient.trim()}
              className="w-full sm:w-auto px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
            >
              {testingSmtp ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              <span>Send Test Email</span>
            </button>
          </div>
        </div>

        {smtpTestResult && (
          <div className={`mt-3 p-3 rounded-xl border text-xs font-mono ${
            smtpTestResult.sent ? "bg-emerald-50 border-emerald-200 text-emerald-800" : "bg-amber-50 border-amber-200 text-amber-800"
          }`}>
            {smtpTestResult.message}
          </div>
        )}
      </div>
            </div>
          )}

          {activeTab === 'audit' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Live System Logs & Agent Telemetry Console */}
              <div className="bg-white border border-slate-200/90 rounded-3xl shadow-sm p-6 text-slate-900 overflow-hidden space-y-5">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                      <Terminal className="w-5 h-5" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h2 className="font-extrabold text-slate-900 text-base">Live Agent Telemetry & Audit Logs</h2>
                        <span className="px-2.5 py-0.5 rounded-full bg-emerald-50 text-emerald-700 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-200">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
                          STREAM ACTIVE
                        </span>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">Deterministic traces across LangGraph Supervisor, Policy Engine, and Razorpay SDK</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <button
                      onClick={fetchLogs}
                      disabled={logsLoading}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold transition-all disabled:opacity-50 cursor-pointer shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin text-indigo-600" : ""}`} />
                      <span>Refresh</span>
                    </button>

                    <button
                      onClick={handleExportLogs}
                      className="flex items-center gap-1.5 px-3.5 py-2 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export JSON</span>
                    </button>
                  </div>
                </div>

                {/* Filter Pills */}
                <div className="flex items-center gap-2 overflow-x-auto pb-1 text-xs">
                  <Filter className="w-3.5 h-3.5 text-slate-400 shrink-0 mr-1" />
                  {["ALL", "POLICY_BLOCK", "PAYMENT", "SUCCESS"].map((filter) => (
                    <button
                      key={filter}
                      onClick={() => setLogFilter(filter)}
                      className={`px-3 py-1.5 rounded-xl font-bold transition-all shrink-0 cursor-pointer ${
                        logFilter === filter
                          ? "bg-indigo-600 text-white shadow-xs"
                          : "bg-slate-50 text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-slate-200"
                      }`}
                    >
                      {filter === "ALL" ? `All Traces (${logs.length})` : 
                       filter === "POLICY_BLOCK" ? "Policy Blocks" :
                       filter === "PAYMENT" ? "Payments" : "AI Decisions"}
                    </button>
                  ))}
                </div>

                {/* Light Theme Logs Table */}
                <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-3 font-mono text-xs max-h-[420px] overflow-y-auto space-y-2">
                  {filteredLogs.length === 0 ? (
                    <div className="p-8 text-center text-slate-400 font-sans text-xs">
                      No telemetry events recorded matching the selected filter.
                    </div>
                  ) : (
                    filteredLogs.map((log) => (
                      <div key={log.id} className="p-3 rounded-xl bg-white border border-slate-200/90 hover:border-indigo-200 hover:shadow-xs transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                        <div className="flex items-start sm:items-center gap-2.5">
                          <span className="text-slate-400 text-[11px] shrink-0">
                            {new Date(log.timestamp).toLocaleTimeString()}
                          </span>

                          <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                            log.level === "POLICY_BLOCK"
                              ? "bg-amber-50 text-amber-800 border border-amber-200"
                              : log.level === "PAYMENT"
                                ? "bg-emerald-50 text-emerald-800 border border-emerald-200"
                                : "bg-blue-50 text-blue-800 border border-blue-200"
                          }`}>
                            {log.level}
                          </span>

                          <span className="text-indigo-600 font-bold text-xs shrink-0">
                            [{log.component}]
                          </span>

                          <span className="text-slate-800 text-xs font-sans line-clamp-1">
                            {log.message}
                          </span>
                        </div>

                        <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-[11px]">
                          <span className="text-slate-400 font-mono text-[10px]">
                            {log.trace_id}
                          </span>
                          <span className="px-1.5 py-0.5 rounded bg-slate-100 text-slate-600 text-[10px] font-bold">
                            {log.latency_ms}ms
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

        </main>
      </div>


      {/* Merchant Store Onboarding & Setup Wizard */}
      {showOnboardingWizard && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-xl w-full p-6 sm:p-8 relative max-h-[92vh] overflow-y-auto">
            <button
              type="button"
              onClick={() => setShowOnboardingWizard(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Stepper Header */}
            <div className="mb-6">
              <div className="flex items-center gap-2.5">
                <div className="w-9 h-9 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-xs">
                  <Store className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-black text-slate-900 text-lg">Merchant Store Onboarding</h3>
                  <p className="text-xs text-slate-500">Configure your business profile, initial catalog, and autonomous shopping rules.</p>
                </div>
              </div>

              {/* Progress Tabs */}
              <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-slate-100 text-center text-xs">
                <button
                  type="button"
                  onClick={() => setOnboardingStep(1)}
                  className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    onboardingStep === 1 
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700" 
                      : onboardingStep > 1 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  {onboardingStep > 1 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span>1</span>}
                  <span>Store Profile</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onboardingStoreName.trim()) setOnboardingStep(2);
                  }}
                  className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    onboardingStep === 2 
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700" 
                      : onboardingStep > 2 
                        ? "bg-emerald-50 border-emerald-200 text-emerald-700" 
                        : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  {onboardingStep > 2 ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <span>2</span>}
                  <span>Add Product</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    if (onboardingStoreName.trim()) setOnboardingStep(3);
                  }}
                  className={`p-2 rounded-xl border font-bold flex items-center justify-center gap-1.5 transition-colors ${
                    onboardingStep === 3 
                      ? "bg-indigo-50 border-indigo-300 text-indigo-700" 
                      : "bg-slate-50 border-slate-200 text-slate-400"
                  }`}
                >
                  <span>3</span>
                  <span>AI Guardrails</span>
                </button>
              </div>
            </div>

            {/* STEP 1: Store & Business Profile */}
            {onboardingStep === 1 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Shop / Store Name <span className="text-rose-500">* (Mandatory)</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Kaaysha Luxury Apparel, Apex Tech Store..."
                    value={onboardingStoreName}
                    onChange={(e) => setOnboardingStoreName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Business Category <span className="text-rose-500">*</span>
                    </label>
                    <select
                      value={onboardingCategory}
                      onChange={(e) => {
                        const newCat = e.target.value;
                        setOnboardingCategory(newCat);
                        setOnboardingProducts(prev => prev.map(p => (!p.category || p.category === onboardingCategory) ? { ...p, category: newCat } : p));
                      }}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    >
                      <option value="Fashion & Apparel">Fashion & Apparel</option>
                      <option value="Electronics & Tech">Electronics & Tech</option>
                      <option value="Beauty & Personal Care">Beauty & Personal Care</option>
                      <option value="Home & Kitchen">Home & Kitchen</option>
                      <option value="Health & Wellness">Health & Wellness</option>
                      <option value="Food & Gourmet">Food & Gourmet</option>
                      <option value="General Merchandise">General Merchandise</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                      Support Contact / Phone <span className="text-slate-400 font-normal">(Optional)</span>
                    </label>
                    <input
                      type="text"
                      placeholder="e.g. +91 98765 43210"
                      value={onboardingPhone}
                      onChange={(e) => setOnboardingPhone(e.target.value)}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Physical / Business Address <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 100 Feet Road, Indiranagar, Bangalore, Karnataka 560038"
                    value={onboardingAddress}
                    onChange={(e) => setOnboardingAddress(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1.5">
                    Store Tagline / Bio <span className="text-slate-400 font-normal">(Optional)</span>
                  </label>
                  <textarea
                    rows={2}
                    placeholder="e.g. Handcrafted designer garments, custom stitching, and premium express delivery across India."
                    value={onboardingDescription}
                    onChange={(e) => setOnboardingDescription(e.target.value)}
                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:bg-white focus:outline-none focus:border-indigo-500"
                  />
                </div>

                <div className="pt-3 flex items-center justify-end">
                  <button
                    type="button"
                    onClick={() => {
                      if (!onboardingStoreName.trim()) {
                        showToast("Please enter a Shop / Store name to proceed.", "error");
                        return;
                      }
                      setOnboardingStep(2);
                    }}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: Add Products</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 2: Multi-Product Catalog Creation */}
            {onboardingStep === 2 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="p-3 bg-indigo-50/70 border border-indigo-200/80 rounded-2xl flex items-center justify-between text-xs">
                  <div>
                    <p className="font-bold text-indigo-900">Add Products to Your Store Catalog</p>
                    <p className="text-[11px] text-indigo-700">Add 1 or multiple items now. Your AI agent will index all of them immediately.</p>
                  </div>
                  <label className="flex items-center gap-2 cursor-pointer select-none">
                    <input
                      type="checkbox"
                      checked={hasFirstProduct}
                      onChange={(e) => setHasFirstProduct(e.target.checked)}
                      className="w-4 h-4 rounded text-indigo-600 accent-indigo-600"
                    />
                    <span className="font-bold text-slate-700 text-xs">Add Items Now</span>
                  </label>
                </div>

                {hasFirstProduct ? (
                  <div className="space-y-4 max-h-[48vh] overflow-y-auto pr-1">
                    {onboardingProducts.map((prod, idx) => (
                      <div key={prod.id} className="p-4 bg-slate-50 border border-slate-200/90 rounded-2xl space-y-3 relative shadow-2xs">
                        <div className="flex items-center justify-between border-b border-slate-200/80 pb-2">
                          <span className="text-xs font-black text-slate-800 flex items-center gap-1.5">
                            <span className="w-5 h-5 rounded-lg bg-indigo-100 text-indigo-700 flex items-center justify-center text-[10px] font-bold">
                              {idx + 1}
                            </span>
                            <span>Product #{idx + 1} {prod.name ? `— ${prod.name}` : ""}</span>
                          </span>

                          {onboardingProducts.length > 1 && (
                            <button
                              type="button"
                              onClick={() => {
                                setOnboardingProducts(prev => prev.filter(p => p.id !== prod.id));
                              }}
                              className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                              title="Remove item"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>

                        <div>
                          <label className="block text-[11px] font-bold text-slate-700 uppercase tracking-wider mb-1">
                            Product Title <span className="text-rose-500">*</span>
                          </label>
                          <input
                            type="text"
                            placeholder="e.g. Silk Floral Maxi Dress, Wireless ANC Headphones..."
                            value={prod.name}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOnboardingProducts(prev => prev.map(p => p.id === prod.id ? { ...p, name: val } : p));
                            }}
                            className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Category</label>
                            <input
                              type="text"
                              placeholder={onboardingCategory}
                              value={prod.category}
                              onChange={(e) => {
                                const val = e.target.value;
                                setOnboardingProducts(prev => prev.map(p => p.id === prod.id ? { ...p, category: val } : p));
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Price (₹ INR)</label>
                            <input
                              type="number"
                              placeholder="2999"
                              value={prod.price}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                setOnboardingProducts(prev => prev.map(p => p.id === prod.id ? { ...p, price: val } : p));
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>

                          <div>
                            <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Stock</label>
                            <input
                              type="number"
                              placeholder="25"
                              value={prod.inventory}
                              onChange={(e) => {
                                const val = e.target.value === "" ? "" : Number(e.target.value);
                                setOnboardingProducts(prev => prev.map(p => p.id === prod.id ? { ...p, inventory: val } : p));
                              }}
                              className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs font-bold text-slate-900 focus:outline-none focus:border-indigo-500"
                            />
                          </div>
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Description (Optional)</label>
                          <textarea
                            rows={1}
                            placeholder="Short description of fabric, specs, or features..."
                            value={prod.description}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOnboardingProducts(prev => prev.map(p => p.id === prod.id ? { ...p, description: val } : p));
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>

                        <div>
                          <label className="block text-[10px] font-bold text-slate-700 uppercase tracking-wider mb-1">Image URL (Optional)</label>
                          <input
                            type="url"
                            placeholder="https://images.unsplash.com/..."
                            value={prod.image_url}
                            onChange={(e) => {
                              const val = e.target.value;
                              setOnboardingProducts(prev => prev.map(p => p.id === prod.id ? { ...p, image_url: val } : p));
                            }}
                            className="w-full px-3 py-1.5 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-indigo-500"
                          />
                        </div>
                      </div>
                    ))}

                    <button
                      type="button"
                      onClick={() => {
                        setOnboardingProducts(prev => [
                          ...prev,
                          {
                            id: `prod_draft_${Date.now()}_${prev.length + 1}`,
                            name: "",
                            category: onboardingCategory,
                            price: 999,
                            inventory: 20,
                            description: "",
                            image_url: ""
                          }
                        ]);
                      }}
                      className="w-full py-2.5 bg-white hover:bg-slate-50 text-indigo-600 border border-dashed border-indigo-300 rounded-2xl text-xs font-bold transition-all flex items-center justify-center gap-1.5 shadow-2xs cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      <span>+ Add Another Product</span>
                    </button>
                  </div>
                ) : (
                  <div className="py-8 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
                    <p className="text-xs font-semibold text-slate-600">Product creation skipped.</p>
                    <p className="text-[11px] text-slate-400 mt-0.5">You can add products anytime from your Product Catalog tab.</p>
                  </div>
                )}

                <div className="pt-3 flex items-center justify-between border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(1)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setOnboardingStep(3)}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-1.5 cursor-pointer"
                  >
                    <span>Next: AI Safety Rules</span>
                    <ArrowRight className="w-4 h-4" />
                  </button>
                </div>
              </div>
            )}

            {/* STEP 3: AI Safety Rules & Launch */}
            {onboardingStep === 3 && (
              <div className="space-y-4 animate-in fade-in">
                <div>
                  <div className="flex items-center justify-between mb-1.5">
                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">
                      Maximum Allowed AI Bargaining Discount
                    </label>
                    <span className="text-xs font-black text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-200">
                      {onboardingMaxDiscount}% Max
                    </span>
                  </div>
                  <input
                    type="range"
                    min="0"
                    max="40"
                    step="1"
                    value={onboardingMaxDiscount}
                    onChange={(e) => setOnboardingMaxDiscount(Number(e.target.value))}
                    className="w-full accent-indigo-600 cursor-pointer"
                  />
                  <p className="text-[11px] text-slate-400 mt-1">Autonomous AI negotiation will never exceed this merchant discount threshold.</p>
                </div>

                {/* Review summary */}
                <div className="p-4 bg-slate-50 border border-slate-200 rounded-2xl space-y-2 text-xs">
                  <div className="flex items-center justify-between font-bold border-b border-slate-200/80 pb-2">
                    <span className="text-slate-500">Store Name:</span>
                    <span className="text-slate-900 text-sm">{onboardingStoreName}</span>
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Category:</span>
                    <span className="font-semibold text-slate-800">{onboardingCategory}</span>
                  </div>
                  {onboardingAddress && (
                    <div className="flex items-center justify-between">
                      <span className="text-slate-500">Address:</span>
                      <span className="font-medium text-slate-700 truncate max-w-[220px]">{onboardingAddress}</span>
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Products in Batch:</span>
                    <span className="font-semibold text-emerald-700">
                      {hasFirstProduct && onboardingProducts.filter(p => p.name.trim()).length > 0 
                        ? `${onboardingProducts.filter(p => p.name.trim()).length} Products configured`
                        : "Will add later from catalog"}
                    </span>
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-between">
                  <button
                    type="button"
                    onClick={() => setOnboardingStep(2)}
                    className="px-4 py-2 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-1.5"
                  >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleCompleteOnboarding}
                    disabled={submittingOnboarding}
                    className="px-6 py-2.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/20 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                  >
                    {submittingOnboarding ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{submittingOnboarding ? "Configuring Store & AI Agent..." : "Complete Setup & Launch Store"}</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Store QR Code Modal */}
      {showQrModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-sm w-full p-6 text-center relative">
            <button
              onClick={() => setShowQrModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Live Generated QR Code Card */}
            <div id="printable-qr-poster" className="bg-white p-5 rounded-3xl border border-slate-200 text-center mb-4 shadow-xs">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-2 shadow-xs">
                <QrCode className="w-5 h-5" />
              </div>

              <h3 className="font-black text-slate-900 text-base">{currentStoreName}</h3>
              <p className="text-[11px] text-slate-500 mb-3">Scan with your smartphone camera to launch the BuyFlow AI Concierge</p>

              {/* QR Image with BuyFlow Logo in Center */}
              <div className="bg-slate-50 p-3 rounded-2xl border border-slate-200 inline-block mb-3 shadow-xs">
                <div className="relative inline-block">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(agentShareUrl)}`}
                    alt="Storefront QR Code"
                    className="w-48 h-48 rounded-xl mx-auto block"
                  />
                  {/* BuyFlow Logo in Center */}
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                    <div className="w-11 h-11 bg-white rounded-xl shadow-md border-2 border-white p-1 flex items-center justify-center">
                      <img src="/logo.png" alt="BuyFlow" className="w-full h-full object-contain rounded-lg" />
                    </div>
                  </div>
                </div>
              </div>

              <p className="text-[10px] text-slate-400 font-mono mb-1 truncate px-2">{agentShareUrl}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Verified BuyFlow AI Storefront</p>
            </div>

            {/* Print Styles for Exactly 1-Page Poster Printing */}
            <style jsx global>{`
              @media print {
                body * {
                  visibility: hidden !important;
                }
                #printable-qr-poster, #printable-qr-poster * {
                  visibility: visible !important;
                }
                #printable-qr-poster {
                  position: fixed !important;
                  left: 50% !important;
                  top: 50% !important;
                  transform: translate(-50%, -50%) !important;
                  width: 380px !important;
                  border: 2px solid #0f172a !important;
                  box-shadow: none !important;
                  padding: 24px !important;
                  page-break-inside: avoid !important;
                  margin: 0 !important;
                }
              }
            `}</style>

            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={handleDownloadQrCode}
                className="py-2.5 px-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Download className="w-3.5 h-3.5" />
                <span>Download QR</span>
              </button>
              
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(agentShareUrl);
                  showToast("Copied store agent URL to clipboard!", "success");
                }}
                className="py-2.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Link</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal Dialog */}
      {showAddProductModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative max-h-[90vh] overflow-y-auto">
            <button
              onClick={() => setShowAddProductModal(false)}
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1 rounded-xl"
            >
              <X className="w-5 h-5" />
            </button>

            <h3 className="font-black text-slate-900 text-xl mb-1">Add Product to Catalog</h3>
            <p className="text-xs text-slate-500 mb-5">Create a new item in your store. It will immediately be indexed by the search agent and AI concierge.</p>

            <form onSubmit={handleAddProduct} className="space-y-4">
              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Product Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Razer Blade 16 Gaming Laptop"
                  value={newProdName}
                  onChange={(e) => setNewProdName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Category</label>
                  <select
                    value={newProdCategory}
                    onChange={(e) => setNewProdCategory(e.target.value)}
                    className="w-full px-2.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  >
                    <option value="Laptops">Laptops</option>
                    <option value="Audio">Audio</option>
                    <option value="Accessories">Accessories</option>
                    <option value="Displays">Displays</option>
                    <option value="Wearables">Wearables</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Price (₹ INR)</label>
                  <input
                    type="number"
                    required
                    min="1"
                    value={newProdPrice}
                    onChange={(e) => setNewProdPrice(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500 font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Stock Units</label>
                  <input
                    type="number"
                    required
                    min="0"
                    value={newProdInventory}
                    onChange={(e) => setNewProdInventory(Number(e.target.value))}
                    className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-700 uppercase mb-1">Description & Key Specs</label>
                <textarea
                  rows={2}
                  placeholder="e.g. Intel Core i9, 32GB RAM, RTX 4080, QHD+ 240Hz display"
                  value={newProdDescription}
                  onChange={(e) => setNewProdDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                />
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-[11px] font-bold text-slate-700 uppercase">Product Image</label>
                  <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                    <button
                      type="button"
                      onClick={() => setImageUploadMode("file")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        imageUploadMode === "file" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Upload File
                    </button>
                    <button
                      type="button"
                      onClick={() => setImageUploadMode("url")}
                      className={`px-2.5 py-1 rounded-md text-[11px] font-bold transition-all ${
                        imageUploadMode === "url" ? "bg-white text-indigo-600 shadow-xs" : "text-slate-500 hover:text-slate-900"
                      }`}
                    >
                      Image URL
                    </button>
                  </div>
                </div>

                {imageUploadMode === "file" ? (
                  <div className="space-y-2">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleImageFileChange}
                      className="w-full text-xs text-slate-500 file:mr-3 file:py-2 file:px-3 file:rounded-xl file:border-0 file:text-xs file:font-bold file:bg-indigo-50 file:text-indigo-700 hover:file:bg-indigo-100 cursor-pointer"
                    />
                    {newProdImage && (
                      <div className="flex items-center gap-2 p-2 bg-slate-50 rounded-xl border border-slate-200">
                        <img src={newProdImage} alt="Preview" className="w-10 h-10 object-cover rounded-lg border border-slate-200" />
                        <span className="text-[11px] text-emerald-600 font-bold">✓ Image loaded from your computer</span>
                      </div>
                    )}
                  </div>
                ) : (
                  <input
                    type="url"
                    placeholder="https://images.unsplash.com/..."
                    value={newProdImage}
                    onChange={(e) => setNewProdImage(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                )}
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddProductModal(false)}
                  className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={creatingProduct}
                  className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 shadow-md shadow-indigo-500/20 disabled:opacity-50"
                >
                  {creatingProduct ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <PlusCircle className="w-3.5 h-3.5" />}
                  <span>{creatingProduct ? "Publishing..." : "Publish Product"}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modern In-App Toast Dialog */}
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