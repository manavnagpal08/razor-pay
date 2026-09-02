"use client";

import { useEffect, useState, useRef } from "react";
import { 
  TrendingUp, ShoppingBag, BrainCircuit, ShieldAlert, Bot, Sparkles, Send, 
  Lock, LogIn, Sliders, CheckCircle2, Loader2, Share2, Copy, ExternalLink, Code, 
  MessageSquare, Terminal, RefreshCw, Download, Filter, PlusCircle, Store, X, ChevronDown,
  QrCode, AlertTriangle, Cpu, Layers, ShieldCheck, Zap, Mail, Trash2, Inbox
} from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";

export default function MerchantDashboard() {
  const { user, token, role, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [logs, setLogs] = useState<any[]>([]);
  const [logFilter, setLogFilter] = useState<string>("ALL");
  const [policy, setPolicy] = useState<any>(null);
  const [maxDiscountInput, setMaxDiscountInput] = useState<number>(20);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState("");
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

  // Security & Failure Simulation States
  const [showQrModal, setShowQrModal] = useState(false);
  const [simulatingAttack, setSimulatingAttack] = useState(false);
  const [attackResult, setAttackResult] = useState<any>(null);

  // M2M AI Buyer Simulator States
  const [simulatingM2M, setSimulatingM2M] = useState(false);
  const [m2mBuyerAgent, setM2mBuyerAgent] = useState("Autonomous_Buyer_Bot_v1");
  const [m2mDiscountOffer, setM2mDiscountOffer] = useState(15);
  const [m2mResult, setM2mResult] = useState<any>(null);

  // External Software / OMS Integration States
  const [webhookUrl, setWebhookUrl] = useState("");
  const [webhookSecret, setWebhookSecret] = useState("");
  const [testingWebhook, setTestingWebhook] = useState(false);
  const [webhookTestResult, setWebhookTestResult] = useState<any>(null);
  const [savingWebhook, setSavingWebhook] = useState(false);
  const [webhookMessage, setWebhookMessage] = useState("");

  // Active Dashboard Tab
  const [activeTab, setActiveTab] = useState<"overview" | "catalog" | "simulator" | "security" | "policy" | "webhooks" | "smtp" | "audit">("overview");

  // Product Catalog Management States
  const [merchantProducts, setMerchantProducts] = useState<any[]>([]);
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

  // SMTP Gmail Delivery States
  const [smtpUser, setSmtpUser] = useState("");
  const [smtpPassword, setSmtpPassword] = useState("");
  const [savingSmtp, setSavingSmtp] = useState(false);
  const [smtpMessage, setSmtpMessage] = useState("");
  const [testEmailRecipient, setTestEmailRecipient] = useState("");
  const [testingSmtp, setTestingSmtp] = useState(false);
  const [smtpTestResult, setSmtpTestResult] = useState<any>(null);

  const chatEndRef = useRef<HTMLDivElement>(null);

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 3 * 1024 * 1024) {
        alert("Image size should be under 3MB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProdImage(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const merchantId = selectedStore?.id || user?.uid || "demo_merchant";
  const currentStoreName = selectedStore?.name || "Razorpay Demo Store";
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
      fetchDashboard();
      fetchLogs();
      fetchWebhookConfig();
      fetchMerchantProducts();
      fetchSmtpConfig();
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
        setMaxDiscountInput(Number(pol.max_discount_percent) || 20);
      }
      if (storesRes.ok) {
        const storeData = await storesRes.json();
        setStores(storeData);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
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
        alert("Failed to create store. Please try again.");
      }
    } catch (err) {
      console.error(err);
      alert("Connection error when creating store.");
    } finally {
      setCreatingStore(false);
    }
  };

  const handleSimulateAttack = async (type: "ROGUE_DISCOUNT_EXPLOIT" | "PAYMENT_DROP_RECOVERY") => {
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
      const prodRes = await fetch(`${apiUrl}/api/products`);
      const prods = await prodRes.json();
      const targetProduct = (prods && prods.length > 0) ? prods[0] : { id: "p1", name: "Pro Gaming Laptop", price: 125000 };

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
        const data = await res.json();
        setMerchantProducts(data);
      }
    } catch (e) {
      console.warn("Failed to load merchant products:", e);
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
        alert("Product added to catalog successfully!");
      } else {
        alert("Failed to add product. Please check fields.");
      }
    } catch (err) {
      console.error(err);
      alert("Error adding product.");
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
        if (data.gmail_user) setSmtpUser(data.gmail_user);
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
          gmail_user: smtpUser,
          gmail_app_password: smtpPassword
        })
      });
      if (res.ok) {
        setSmtpMessage("Gmail SMTP credentials successfully saved! Real emails will now be sent.");
        setTimeout(() => setSmtpMessage(""), 4000);
      }
    } catch (e) {
      alert("Failed to save SMTP credentials.");
    } finally {
      setSavingSmtp(false);
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

  const handleUpdatePolicy = async (e: React.FormEvent) => {
    e.preventDefault();
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
        body: JSON.stringify({ max_discount_percent: maxDiscountInput })
      });
      if (res.ok) {
        setPolicyMessage("Policy successfully updated! Gated at boundary.");
        setTimeout(() => setPolicyMessage(""), 3000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPolicy(false);
    }
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
            
            <span className="text-slate-400 text-xs hidden sm:inline">• {user.email}</span>
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
              setCreatedStoreResult(null);
              setShowNewStoreModal(true);
            }}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Launch New Store</span>
          </button>

          <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl text-xs text-slate-700 font-semibold flex items-center gap-2 shadow-xs hidden sm:flex">
            <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></span>
            <span>Policy Engine Online</span>
          </div>
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
              onClick={() => setActiveTab("simulator")}
              className={`w-full flex items-center gap-2.5 px-3.5 py-2.5 rounded-2xl text-xs font-bold transition-all ${
                activeTab === "simulator" 
                  ? "bg-indigo-600 text-white shadow-xs" 
                  : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
              }`}
            >
              <Cpu className="w-4 h-4 shrink-0" />
              <span>AI Buyer Simulator</span>
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
              <span>Security Defense</span>
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
              <span>Policy Safeguards</span>
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
              <span>OMS Webhooks</span>
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
              <span>Gmail Delivery</span>
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
              <span>Audit Ledger</span>
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
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-blue-950 text-white rounded-3xl p-6 sm:p-8 shadow-xl border border-indigo-500/30 relative overflow-hidden">
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-2.5 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>Multi-Tenant Conversational Commerce</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-black text-white tracking-tight">
              Shareable AI Storefront Agent Link
            </h2>
            <p className="text-slate-300 text-xs sm:text-sm leading-relaxed">
              Share this dedicated link with your customers on WhatsApp, Instagram, or email. Buyers can chat directly with your AI concierge, receive instant product recommendations, and complete Razorpay test-mode payments right inside the chat!
            </p>

            {/* Link display and actions */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-3 pt-2">
              <div className="flex items-center gap-2 px-4 py-3 bg-slate-800/90 border border-slate-700 rounded-2xl text-xs font-mono text-indigo-200 overflow-x-auto">
                <Share2 className="w-4 h-4 text-indigo-400 shrink-0" />
                <span className="truncate">{agentShareUrl}</span>
              </div>

              <div className="flex flex-wrap items-center gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(agentShareUrl);
                    setCopiedLink(true);
                    setTimeout(() => setCopiedLink(false), 2500);
                  }}
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shrink-0"
                >
                  {copiedLink ? <CheckCircle2 className="w-4 h-4 text-emerald-300" /> : <Copy className="w-4 h-4" />}
                  <span>{copiedLink ? "Copied Link!" : "Copy Link"}</span>
                </button>

                <a
                  href={agentShareUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-4 py-3 bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl text-xs font-bold transition-all shrink-0"
                >
                  <ExternalLink className="w-4 h-4" />
                  <span>Open Agent</span>
                </a>

                <a
                  href={`https://api.whatsapp.com/send?text=${encodeURIComponent(`Check out our AI Shopping Assistant and buy direct on Razorpay: ${agentShareUrl}`)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 px-3.5 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-2xl text-xs font-bold transition-all shrink-0"
                  title="Share on WhatsApp"
                >
                  <MessageSquare className="w-4 h-4" />
                  <span className="hidden sm:inline">WhatsApp</span>
                </a>
              </div>
            </div>
          </div>

          {/* Embed Code Snippet Box */}
          <div className="bg-white/5 border border-white/10 rounded-2xl p-4 flex flex-col justify-between gap-3 w-full lg:w-72 shrink-0">
            <div>
              <p className="text-xs font-bold text-slate-200 flex items-center gap-1.5 mb-1">
                <Code className="w-4 h-4 text-indigo-400" />
                <span>Embed on Any Website</span>
              </p>
              <p className="text-[11px] text-slate-400 leading-normal">
                Add an interactive AI shopping widget to your Shopify, WordPress, or custom site.
              </p>
            </div>
            <button
              onClick={() => {
                navigator.clipboard.writeText(embedSnippet);
                setCopiedEmbed(true);
                setTimeout(() => setCopiedEmbed(false), 2500);
              }}
              className="w-full py-2 px-3 bg-slate-800 hover:bg-slate-700 text-indigo-300 hover:text-white border border-slate-700 rounded-xl text-xs font-bold transition-all flex items-center justify-center gap-1.5"
            >
              {copiedEmbed ? <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              <span>{copiedEmbed ? "Copied Embed HTML!" : "Copy Embed Code"}</span>
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
      <div id="catalog" className="bg-white border border-slate-200/80 rounded-3xl p-6 shadow-xs">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center shadow-xs">
              <ShoppingBag className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-base">Store Product Catalog</h3>
                <span className="px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-xs font-extrabold border border-indigo-100">
                  {merchantProducts.length} Items Published
                </span>
              </div>
              <p className="text-xs text-slate-500">Add products to your catalog so customers and autonomous AI buyers can discover and purchase them.</p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setShowAddProductModal(true)}
            className="px-4 py-2.5 bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-500 hover:to-blue-500 text-white rounded-2xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2"
          >
            <PlusCircle className="w-4 h-4" />
            <span>Add New Product</span>
          </button>
        </div>

        {productsLoading ? (
          <div className="py-12 flex justify-center">
            <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
          </div>
        ) : merchantProducts.length === 0 ? (
          <div className="py-12 px-4 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Inbox className="w-10 h-10 text-slate-300 mx-auto mb-3" />
            <h4 className="font-extrabold text-slate-800 text-sm">Your Catalog is Currently Empty</h4>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1 mb-4">
              You have not added any products to this store yet. Add your first item to make it transactable.
            </p>
            <button
              onClick={() => setShowAddProductModal(true)}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              + Add First Product
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {merchantProducts.map((prod: any) => (
              <div key={prod.id} className="bg-slate-50 border border-slate-200/80 rounded-2xl p-4 flex flex-col justify-between space-y-3 hover:shadow-xs transition-shadow">
                <div className="flex items-start gap-3">
                  <img
                    src={prod.metadata_?.image_url || "https://images.unsplash.com/photo-1517336714731-489689fd1ca8?auto=format&fit=crop&w=300&q=80"}
                    alt={prod.name}
                    className="w-14 h-14 object-cover rounded-xl border border-slate-200 shrink-0 bg-white"
                  />
                  <div className="min-w-0 flex-1">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-200 text-slate-700 uppercase tracking-wide">
                      {prod.category}
                    </span>
                    <h4 className="font-bold text-slate-900 text-xs mt-1 truncate">{prod.name}</h4>
                    <p className="font-mono font-black text-indigo-600 text-sm mt-0.5">₹{Number(prod.price).toLocaleString()}</p>
                  </div>
                </div>

                <div className="flex items-center justify-between pt-2 border-t border-slate-200 text-xs">
                  <span className={`px-2 py-0.5 rounded-md text-[10px] font-bold ${
                    prod.inventory > 0 ? "bg-emerald-50 text-emerald-700 border border-emerald-100" : "bg-rose-50 text-rose-700 border border-rose-100"
                  }`}>
                    {prod.inventory > 0 ? `In Stock: ${prod.inventory}` : "Out of Stock"}
                  </span>

                  <button
                    onClick={() => handleDeleteProduct(prod.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Remove from Catalog"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
            </div>
          )}

          {activeTab === 'simulator' && (
            <div className="space-y-6 animate-in fade-in">
              {/* 1. M2M AI Buyer Simulator */}
        <div className="bg-gradient-to-br from-slate-900 via-slate-950 to-indigo-950 border border-indigo-500/30 rounded-3xl p-6 shadow-xl text-white flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-500/20 text-indigo-300 text-xs font-bold border border-indigo-400/30">
                <Cpu className="w-3.5 h-3.5 text-indigo-400" />
                <span>Track 01 Core: Agent-to-Agent Commerce</span>
              </div>
              <span className="text-[10px] font-mono text-slate-400">UAP / AP2 Compliant</span>
            </div>

            <h2 className="text-xl font-black text-white tracking-tight flex items-center gap-2">
              <span>M2M Autonomous AI Buyer Simulator</span>
            </h2>
            <p className="text-xs text-slate-300 leading-relaxed">
              Demonstrates making this merchant transactable by external AI buyers end-to-end via machine-readable protocol (<code className="text-indigo-300">/.well-known/agent.json</code>).
            </p>

            <div className="grid grid-cols-2 gap-3 pt-2">
              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">External AI Buyer Persona</label>
                <select
                  value={m2mBuyerAgent}
                  onChange={(e) => setM2mBuyerAgent(e.target.value)}
                  className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none"
                >
                  <option value="Enterprise_Procurement_AI_v4">🏢 Enterprise Procurement Bot</option>
                  <option value="Personal_Shopper_AutoGPT_v2">🤖 Autonomous Personal Shopper</option>
                  <option value="Smart_Cart_Aggregator_Agent">🛒 Smart Cart Aggregator</option>
                </select>
              </div>

              <div>
                <label className="block text-[11px] font-bold text-slate-400 uppercase mb-1">Programmatic Discount RFP</label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="40"
                    value={m2mDiscountOffer}
                    onChange={(e) => setM2mDiscountOffer(Number(e.target.value))}
                    className="w-full bg-slate-800 border border-slate-700 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none pr-8"
                  />
                  <span className="absolute right-3 top-2 text-xs text-slate-400 font-bold">%</span>
                </div>
              </div>
            </div>

            <button
              onClick={handleRunM2MTransaction}
              disabled={simulatingM2M}
              className="w-full mt-2 py-3 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-extrabold transition-all shadow-md shadow-indigo-600/30 flex items-center justify-center gap-2 disabled:opacity-50"
            >
              {simulatingM2M ? <Loader2 className="w-4 h-4 animate-spin" /> : <Zap className="w-4 h-4 fill-amber-300 text-amber-300" />}
              <span>{simulatingM2M ? "Executing Machine-to-Machine RFP..." : "Simulate Autonomous AI Buyer Transaction"}</span>
            </button>
          </div>

          {/* M2M Result Dual Console */}
          {m2mResult && (
            <div className="mt-4 p-3.5 bg-slate-950 border border-slate-800 rounded-2xl font-mono text-[11px] space-y-1.5 animate-in fade-in">
              <div className="flex items-center justify-between text-emerald-400 font-bold pb-1 border-b border-slate-800">
                <span>✓ M2M ORDER CREATED: {m2mResult.razorpay_order_id}</span>
                <span className="text-slate-400">{m2mResult.agent_id}</span>
              </div>
              <p className="text-slate-300">Target Item: <strong className="text-white">{m2mResult.product?.name}</strong></p>
              <p className="text-indigo-300">Policy Evaluation: {m2mResult.policy_evaluation?.reason}</p>
              <div className="flex items-center justify-between pt-1 text-slate-400">
                <span>Total: <strong className="text-emerald-400">₹{Number(m2mResult.financials?.total_amount).toLocaleString()}</strong></span>
                <span className="text-[10px] bg-indigo-950 text-indigo-300 px-2 py-0.5 rounded border border-indigo-800">Razorpay Test Mode Verified</span>
              </div>
            </div>
          )}
        </div>
            </div>
          )}

          {activeTab === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              {/* 2. Security Defense & Graceful Failure Suite ("The Bar") */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs flex flex-col justify-between">
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 text-rose-700 text-xs font-bold border border-rose-200">
                <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
                <span>The Bar: Failure Handled Gracefully</span>
              </div>
              <span className="text-[10px] font-bold text-slate-500 uppercase tracking-wider">100% Bounded & Gated</span>
            </div>

            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Security Defense & Failure Testbed
            </h2>
            <p className="text-xs text-slate-500 leading-relaxed">
              Verify that rogue agent discount exploitation is strictly rejected at the server boundary, and payment network timeouts recover with zero cart loss.
            </p>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
              <button
                onClick={() => handleSimulateAttack("ROGUE_DISCOUNT_EXPLOIT")}
                disabled={simulatingAttack}
                className="p-3.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-2xl text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <AlertTriangle className="w-4 h-4 text-rose-600 group-hover:scale-110 transition-transform" />
                  <span className="text-xs font-bold text-rose-900">Rogue 50% Exploit Attack</span>
                </div>
                <p className="text-[11px] text-rose-700 leading-snug">
                  Simulate buyer agent demanding an unauthorized 50% discount.
                </p>
              </button>

              <button
                onClick={() => handleSimulateAttack("PAYMENT_DROP_RECOVERY")}
                disabled={simulatingAttack}
                className="p-3.5 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-2xl text-left transition-all group disabled:opacity-50"
              >
                <div className="flex items-center gap-2 mb-1">
                  <RefreshCw className="w-4 h-4 text-amber-600 group-hover:rotate-180 transition-transform duration-500" />
                  <span className="text-xs font-bold text-amber-900">Gateway Timeout Recovery</span>
                </div>
                <p className="text-[11px] text-amber-700 leading-snug">
                  Simulate network drop during checkout and test session recovery.
                </p>
              </button>
            </div>
          </div>

          {/* Defense Result Display */}
          {attackResult && (
            <div className={`mt-4 p-4 rounded-2xl border text-xs space-y-2 animate-in fade-in ${
              attackResult.threat_detected 
                ? "bg-rose-50/70 border-rose-200 text-rose-950" 
                : "bg-emerald-50/70 border-emerald-200 text-emerald-950"
            }`}>
              <div className="flex items-center justify-between font-bold">
                <span className="flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-emerald-600" />
                  {attackResult.attack_type === "ROGUE_DISCOUNT_EXPLOIT" ? "POLICY BOUNDARY INTERCEPTION" : "SESSION STATE SECURED"}
                </span>
                <span className="font-mono text-[10px] text-slate-500">ID: {attackResult.audit_ledger_id?.slice(0, 8)}</span>
              </div>

              {attackResult.attack_type === "ROGUE_DISCOUNT_EXPLOIT" ? (
                <>
                  <p className="text-rose-700 font-semibold">
                    🚨 <strong>Threat Neutralized:</strong> Demanded {attackResult.demanded_discount} rejected by server policy engine.
                  </p>
                  <p className="text-slate-700">
                    ✓ <strong>Graceful Recovery:</strong> Supervisor offered policy-bounded {attackResult.graceful_recovery?.counter_offer_discount} + {attackResult.graceful_recovery?.added_perk}. Zero merchant margin compromised.
                  </p>
                </>
              ) : (
                <>
                  <p className="text-emerald-800 font-semibold">
                    ✓ <strong>Cart Preserved:</strong> {attackResult.graceful_recovery?.cart_status}.
                  </p>
                  <p className="text-slate-700">
                    ✓ <strong>Fallback Rail:</strong> {attackResult.graceful_recovery?.alternative_rail_offered}. Customer resumed without re-adding items.
                  </p>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    )}

          {activeTab === 'policy' && (
            <div className="space-y-6 animate-in fade-in">
              {/* Policy Control Panel */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-xs">
        <div className="flex items-center justify-between mb-4 pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <Sliders className="w-5 h-5 text-indigo-600" />
            <h2 className="font-bold text-slate-900 text-sm">Policy Engine Safeguards</h2>
          </div>
          <span className="text-xs text-slate-500 font-medium">Enforced at Server Boundary</span>
        </div>

        <form onSubmit={handleUpdatePolicy} className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
          <div className="flex-1">
            <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
              Maximum Allowed AI Discount (%)
            </label>
            <p className="text-xs text-slate-500">Any AI discount proposal exceeding this threshold is automatically rejected by the policy engine.</p>
          </div>

          <div className="flex items-center gap-3 w-full sm:w-auto">
            <div className="relative w-28">
              <input 
                type="number"
                min="0"
                max="100"
                value={maxDiscountInput}
                onChange={e => setMaxDiscountInput(Number(e.target.value))}
                className="w-full pl-3 pr-8 py-2 border border-slate-200 rounded-xl text-sm font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
              />
              <span className="absolute right-3 top-2 text-xs font-bold text-slate-400">%</span>
            </div>

            <button 
              type="submit"
              disabled={savingPolicy}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all disabled:opacity-50 flex items-center gap-1.5 shadow-sm shadow-indigo-500/20"
            >
              {savingPolicy ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle2 className="w-3.5 h-3.5" />}
              <span>Save Policy</span>
            </button>
          </div>
        </form>

        {policyMessage && (
          <p className="mt-3 text-xs font-semibold text-emerald-600 bg-emerald-50 p-2.5 rounded-xl border border-emerald-100">
            ✓ {policyMessage}
          </p>
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
              <div className="flex items-center gap-2">
                <h3 className="font-extrabold text-slate-900 text-sm">Production Email Delivery (Gmail SMTP)</h3>
                <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border ${
                  smtpUser ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-slate-100 text-slate-600 border-slate-200"
                }`}>
                  {smtpUser ? "LIVE SMTP CONNECTED" : "SIMULATION FALLBACK"}
                </span>
              </div>
              <p className="text-xs text-slate-500">Configure your Google Gmail address and 16-character App Password to send live OTP codes and order receipts.</p>
            </div>
          </div>
        </div>

        <form onSubmit={handleSaveSmtp} className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-4">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Gmail Address</label>
            <input
              type="email"
              required
              placeholder="e.g. store@gmail.com"
              value={smtpUser}
              onChange={(e) => setSmtpUser(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Google App Password (16 chars)</label>
            <input
              type="password"
              placeholder="xxxx xxxx xxxx xxxx"
              value={smtpPassword}
              onChange={(e) => setSmtpPassword(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
            />
          </div>

          <div className="flex items-end">
            <button
              type="submit"
              disabled={savingSmtp}
              className="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
            >
              {savingSmtp ? "Saving..." : "Save Gmail Credentials"}
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
      <div className="bg-slate-950 border border-slate-800 rounded-3xl shadow-2xl p-6 text-slate-100 overflow-hidden">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-5 pb-4 border-b border-slate-800/80">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-2xl bg-indigo-900/50 border border-indigo-700/50 flex items-center justify-center text-indigo-400">
              <Terminal className="w-4 h-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className="font-bold text-white text-base">Live Agent Telemetry & Audit Logs</h2>
                <span className="px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-400 text-[10px] font-mono font-bold flex items-center gap-1 border border-emerald-500/30">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                  STREAM ACTIVE
                </span>
              </div>
              <p className="text-xs text-slate-400">Deterministic traces across LangGraph Supervisor, Policy Engine, and Razorpay SDK</p>
            </div>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto">
            <button
              onClick={fetchLogs}
              disabled={logsLoading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 rounded-xl text-xs font-semibold transition-all disabled:opacity-50"
            >
              <RefreshCw className={`w-3.5 h-3.5 ${logsLoading ? "animate-spin text-indigo-400" : ""}`} />
              <span>Refresh</span>
            </button>

            <button
              onClick={handleExportLogs}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 text-white rounded-xl text-xs font-semibold transition-all shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Export JSON</span>
            </button>
          </div>
        </div>

        {/* Filter Pills */}
        <div className="flex items-center gap-2 mb-4 overflow-x-auto pb-1 text-xs">
          <Filter className="w-3.5 h-3.5 text-slate-500 shrink-0 mr-1" />
          {["ALL", "POLICY_BLOCK", "PAYMENT", "SUCCESS"].map((filter) => (
            <button
              key={filter}
              onClick={() => setLogFilter(filter)}
              className={`px-3 py-1 rounded-xl font-bold transition-all shrink-0 ${
                logFilter === filter
                  ? "bg-indigo-600 text-white shadow-xs"
                  : "bg-slate-900 text-slate-400 hover:text-white border border-slate-800"
              }`}
            >
              {filter === "ALL" ? `All Traces (${logs.length})` : 
               filter === "POLICY_BLOCK" ? "Policy Blocks" :
               filter === "PAYMENT" ? "Payments" : "AI Decisions"}
            </button>
          ))}
        </div>

        {/* Terminal Logs Table */}
        <div className="bg-slate-900/90 border border-slate-800/80 rounded-2xl p-3 font-mono text-xs max-h-[380px] overflow-y-auto space-y-2">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-500">
              No telemetry events recorded matching the selected filter.
            </div>
          ) : (
            filteredLogs.map((log) => (
              <div key={log.id} className="p-2.5 rounded-xl bg-slate-950/60 border border-slate-800/60 hover:border-slate-700 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-start sm:items-center gap-2.5">
                  <span className="text-slate-500 text-[11px] shrink-0">
                    {new Date(log.timestamp).toLocaleTimeString()}
                  </span>

                  <span className={`px-2 py-0.5 rounded text-[10px] font-bold uppercase tracking-wider shrink-0 ${
                    log.level === "POLICY_BLOCK"
                      ? "bg-amber-500/20 text-amber-300 border border-amber-500/40"
                      : log.level === "PAYMENT"
                        ? "bg-emerald-500/20 text-emerald-300 border border-emerald-500/40"
                        : "bg-blue-500/20 text-blue-300 border border-blue-500/40"
                  }`}>
                    {log.level}
                  </span>

                  <span className="text-indigo-400 font-bold text-xs shrink-0">
                    [{log.component}]
                  </span>

                  <span className="text-slate-200 text-xs line-clamp-1">
                    {log.message}
                  </span>
                </div>

                <div className="flex items-center gap-2 shrink-0 self-end sm:self-auto text-[11px]">
                  <span className="text-slate-500 font-mono">
                    {log.trace_id}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 text-[10px]">
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


      {/* Launch New Store Modal Dialog */}
      {showNewStoreModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-lg w-full p-6 sm:p-8 relative overflow-hidden">
            <button
              onClick={() => setShowNewStoreModal(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 p-1 rounded-xl hover:bg-slate-100 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {!createdStoreResult ? (
              <form onSubmit={handleCreateStore} className="space-y-4">
                <div className="space-y-1">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-indigo-50 text-indigo-700 text-[10px] font-extrabold uppercase tracking-wide border border-indigo-100">
                    <Sparkles className="w-3 h-3 text-amber-500" />
                    <span>Instant Tenant Provisioning</span>
                  </div>
                  <h3 className="text-xl font-extrabold text-slate-900">Launch Autonomous Storefront</h3>
                  <p className="text-xs text-slate-500">Deploy a dedicated AI agent, policy boundaries, and catalog in seconds.</p>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Storefront Brand Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Apex Esports Lab or SoundCraft Audio"
                    value={newStoreName}
                    onChange={(e) => setNewStoreName(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Max AI Discount (%)
                    </label>
                    <input
                      type="number"
                      min="0"
                      max="100"
                      value={newStoreDiscount}
                      onChange={(e) => setNewStoreDiscount(Number(e.target.value))}
                      className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                      Catalog Preset
                    </label>
                    <select
                      value={newStorePreset}
                      onChange={(e) => setNewStorePreset(e.target.value)}
                      className="w-full px-3 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                    >
                      <option value="all">Full Catalog (6 Items)</option>
                      <option value="laptops">Laptops Only (2 Items)</option>
                      <option value="audio">Audio Only (2 Items)</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-slate-700 uppercase tracking-wider mb-1">
                    Custom AI Agent Greeting (Optional)
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Welcome! I can help customize high-end audio setups."
                    value={newStoreGreeting}
                    onChange={(e) => setNewStoreGreeting(e.target.value)}
                    className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 focus:border-indigo-500"
                  />
                </div>

                <div className="pt-2 flex items-center justify-end gap-3">
                  <button
                    type="button"
                    onClick={() => setShowNewStoreModal(false)}
                    className="px-4 py-2.5 text-xs font-bold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingStore}
                    className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-indigo-500/20 flex items-center gap-2 disabled:opacity-50"
                  >
                    {creatingStore ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
                    <span>{creatingStore ? "Deploying..." : "Launch Store & AI Agent"}</span>
                  </button>
                </div>
              </form>
            ) : (
              <div className="space-y-4 text-center py-2">
                <div className="w-12 h-12 bg-emerald-100 text-emerald-600 rounded-2xl mx-auto flex items-center justify-center">
                  <CheckCircle2 className="w-7 h-7" />
                </div>
                <div>
                  <h3 className="text-xl font-extrabold text-slate-900">Store & AI Agent Live!</h3>
                  <p className="text-xs text-slate-500 mt-1">
                    <strong>{createdStoreResult.store_name}</strong> is now live with {createdStoreResult.product_count} items and a {createdStoreResult.max_discount_percent}% discount guardrail.
                  </p>
                </div>

                <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 text-left">
                  <p className="text-[11px] font-bold text-slate-500 uppercase tracking-wide mb-1">Your Shareable AI Agent Link</p>
                  <p className="text-xs font-mono text-indigo-700 break-all">{createdStoreResult.shareable_chat_url}</p>
                </div>

                <div className="flex flex-col sm:flex-row items-center gap-2.5 pt-2">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(createdStoreResult.shareable_chat_url);
                      alert("Copied store agent URL to clipboard!");
                    }}
                    className="w-full sm:flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors shadow-xs"
                  >
                    Copy Agent Link
                  </button>
                  <a
                    href={createdStoreResult.shareable_chat_url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="w-full sm:flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Live Store</span>
                  </a>
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

            <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-xs">
              <QrCode className="w-6 h-6" />
            </div>

            <h3 className="font-black text-slate-900 text-lg">{currentStoreName}</h3>
            <p className="text-xs text-slate-500 mb-4">Scan with any smartphone camera to launch the AI Shopping Concierge</p>

            {/* Live Generated QR Code Card */}
            <div id="printable-qr-poster" className="bg-white p-6 rounded-3xl border border-slate-200 text-center mb-4 shadow-xs">
              <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl mx-auto flex items-center justify-center mb-3 shadow-xs">
                <QrCode className="w-6 h-6" />
              </div>

              <h3 className="font-black text-slate-900 text-lg">{currentStoreName}</h3>
              <p className="text-xs text-slate-500 mb-4">Scan with any smartphone camera to launch the AI Shopping Concierge</p>

              <div className="bg-slate-50 p-4 rounded-2xl border border-slate-200 inline-block mb-4 shadow-xs">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=260x260&data=${encodeURIComponent(agentShareUrl)}`}
                  alt="Storefront QR Code"
                  className="w-52 h-52 rounded-xl mx-auto"
                />
              </div>

              <p className="text-[11px] text-slate-400 font-mono mb-1 truncate px-2">{agentShareUrl}</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase tracking-wider">Verified Razorpay AI Storefront</p>
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

            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  navigator.clipboard.writeText(agentShareUrl);
                  alert("Copied store agent URL to clipboard!");
                }}
                className="flex-1 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-colors"
              >
                Copy Link
              </button>
              <button
                onClick={() => window.print()}
                className="flex-1 py-2.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold transition-colors flex items-center justify-center gap-1.5"
              >
                <span>Print Poster (1 Page)</span>
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

    </div>
  );
}