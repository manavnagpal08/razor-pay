"use client";

import { useEffect, useState, useRef } from "react";
import { TrendingUp, ShoppingBag, BrainCircuit, ShieldAlert, Bot, Sparkles, Send, Lock, LogIn, Sliders, CheckCircle2, Loader2 } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line, Legend } from "recharts";
import { useAuth } from "@/context/AuthContext";
import { getApiUrl } from "@/utils/api";
import Link from "next/link";

export default function MerchantDashboard() {
  const { user, token, role, loading: authLoading } = useAuth();
  const [metrics, setMetrics] = useState<any>(null);
  const [activity, setActivity] = useState<any[]>([]);
  const [policy, setPolicy] = useState<any>(null);
  const [maxDiscountInput, setMaxDiscountInput] = useState<number>(20);
  const [savingPolicy, setSavingPolicy] = useState(false);
  const [policyMessage, setPolicyMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [chatInput, setChatInput] = useState("");
  const [chatMessages, setChatMessages] = useState<{role: string, text: string}[]>([]);
  const [copilotLoading, setCopilotLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const chartData = [
    { name: 'Mon', revenue: metrics ? Math.round(Number(metrics.revenue) * 0.1) : 4000, aiDriven: 2400 },
    { name: 'Tue', revenue: metrics ? Math.round(Number(metrics.revenue) * 0.15) : 3000, aiDriven: 1398 },
    { name: 'Wed', revenue: metrics ? Math.round(Number(metrics.revenue) * 0.25) : 5500, aiDriven: 3800 },
    { name: 'Thu', revenue: metrics ? Math.round(Number(metrics.revenue) * 0.18) : 2780, aiDriven: 2100 },
    { name: 'Fri', revenue: metrics ? Math.round(Number(metrics.revenue) * 0.32) : 6890, aiDriven: 4800 },
    { name: 'Sat', revenue: metrics ? Math.round(Number(metrics.revenue) * 0.45) : 8390, aiDriven: 6200 },
    { name: 'Sun', revenue: metrics ? Number(metrics.revenue) || 12000 : 9490, aiDriven: 7300 },
  ];

  useEffect(() => {
    if (token) {
      fetchDashboard();
    } else if (!authLoading) {
      setLoading(false);
    }
  }, [token, authLoading]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [chatMessages, copilotLoading]);

  const fetchDashboard = async () => {
    try {
      const apiUrl = getApiUrl();
      
      const metricsRes = await fetch(`${apiUrl}/api/merchant/dashboard`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (metricsRes.ok) {
        setMetrics(await metricsRes.json());
      }

      const activityRes = await fetch(`${apiUrl}/api/merchant/ai-activity`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (activityRes.ok) {
        setActivity(await activityRes.json());
      }

      const policyRes = await fetch(`${apiUrl}/api/merchant/policies`, {
        headers: { "Authorization": `Bearer ${token}` }
      });
      if (policyRes.ok) {
        const pData = await policyRes.json();
        setPolicy(pData);
        if (pData.max_discount_percent !== undefined) {
          setMaxDiscountInput(Number(pData.max_discount_percent));
        }
      }
    } catch (e) {
      console.warn("Failed to fetch dashboard data", e);
    } finally {
      setLoading(false);
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
        body: JSON.stringify({ max_discount_percent: Number(maxDiscountInput) })
      });
      if (res.ok) {
        const updated = await res.json();
        setPolicy(updated);
        setPolicyMessage("Policy updated! AI agents will strictly follow the new cap.");
        setTimeout(() => setPolicyMessage(""), 4000);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setSavingPolicy(false);
    }
  };

  const sendCopilotQuery = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim() || !token) return;

    const userText = chatInput;
    setChatInput("");
    setChatMessages(prev => [...prev, { role: "user", text: userText }]);
    setCopilotLoading(true);

    try {
      const apiUrl = getApiUrl();
      const res = await fetch(`${apiUrl}/api/merchant/copilot`, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": `Bearer ${token}`
        },
        body: JSON.stringify({ query: userText })
      });
      
      if (res.ok) {
        const data = await res.json();
        setChatMessages(prev => [...prev, { role: "bot", text: data.response }]);
      } else {
        setChatMessages(prev => [...prev, { role: "bot", text: "Unable to process query. Please verify merchant permissions." }]);
      }
    } catch (e) {
      setChatMessages(prev => [...prev, { role: "bot", text: "Error: Copilot unreachable." }]);
    } finally {
      setCopilotLoading(false);
    }
  };

  if (loading || authLoading) {
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
    <div className="space-y-6 max-w-7xl mx-auto pb-12">
      {/* Title & Tenant Status */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-end gap-4">
        <div>
          <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Merchant Control Center</h1>
          <p className="text-slate-500 text-sm">Tenant: <strong className="text-slate-800">Razorpay Demo Store</strong> • Logged in as {user.email}</p>
        </div>
        <div className="bg-white border border-slate-200 px-4 py-2 rounded-2xl text-xs text-slate-700 font-semibold flex items-center gap-2 shadow-xs">
          <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.7)] animate-pulse"></span>
          <span>Policy Engine & AI Orchestrator Online</span>
        </div>
      </div>
      
      {/* KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <TrendingUp className="w-5 h-5 text-indigo-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Gross Revenue</h3>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">₹{Number(metrics?.revenue || 0).toLocaleString()}</p>
          <p className="text-[11px] text-emerald-600 font-bold mt-1">↑ Verified Razorpay Captures</p>
        </div>
        
        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <ShoppingBag className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Paid Orders</h3>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{metrics?.orders || 0}</p>
          <p className="text-[11px] text-slate-500 mt-1 font-medium">AOV: ₹{Number(metrics?.average_order_value || 0).toLocaleString()}</p>
        </div>
        
        <div className="bg-gradient-to-br from-indigo-600 to-blue-700 p-6 rounded-3xl shadow-md shadow-indigo-500/20 text-white">
          <div className="flex items-center gap-2.5 text-indigo-100 mb-2">
            <BrainCircuit className="w-5 h-5" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-indigo-100">AI Recommendations</h3>
          </div>
          <p className="text-3xl font-extrabold">{metrics?.ai_recommendations || 0}</p>
          <p className="text-[11px] text-indigo-200 mt-1 font-medium">
            <span className="text-white font-bold">{metrics?.upsell_proposals || 0}</span> Upsells | <span className="text-white font-bold">{metrics?.cross_sell_proposals || 0}</span> Cross-sells
          </p>
        </div>

        <div className="bg-white p-6 rounded-3xl border border-slate-200/80 shadow-xs">
          <div className="flex items-center gap-2.5 text-slate-600 mb-2">
            <ShieldAlert className="w-5 h-5 text-amber-500" />
            <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">Policy Blocks</h3>
          </div>
          <p className="text-3xl font-extrabold text-slate-900">{metrics?.policy_blocks || 0}</p>
          <p className="text-[11px] text-amber-600 font-semibold mt-1">Autonomous violations prevented</p>
        </div>
      </div>

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

      {/* Analytics Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-6">Revenue vs AI Assisted Conversions</h2>
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
        </div>

        <div className="bg-white border border-slate-200/80 rounded-3xl shadow-xs p-6">
          <h2 className="text-sm font-bold text-slate-900 mb-6">AI Conversions by Volume</h2>
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
              Live Audit Trail
            </span>
          </div>
          <div className="overflow-y-auto flex-1">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="bg-slate-50 sticky top-0 border-b border-slate-100">
                <tr className="text-[10px] text-slate-500 uppercase tracking-wider font-bold">
                  <th className="p-3.5">Agent & Action</th>
                  <th className="p-3.5">Reasoning & Inputs</th>
                  <th className="p-3.5 text-right">Policy Decision</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {activity.map((act: any, i: number) => (
                  <tr key={i} className="hover:bg-slate-50/70 transition-colors">
                    <td className="p-3.5">
                      <div className="font-bold text-slate-900">{act.agent || act.agent_name}</div>
                      <span className="text-indigo-600 text-[10px] font-bold uppercase tracking-wide">
                        {act.action || act.action_type}
                      </span>
                    </td>
                    <td className="p-3.5 text-xs text-slate-600 max-w-[280px]">
                      <p className="line-clamp-2" title={act.reason}>{act.reason}</p>
                    </td>
                    <td className="p-3.5 text-right">
                      {act.result?.allowed === false ? (
                        <span className="text-red-700 font-bold text-[10px] bg-red-50 px-2.5 py-1 rounded-full border border-red-100">BLOCKED</span>
                      ) : act.result?.response ? (
                        <span className="text-blue-700 font-bold text-[10px] bg-blue-50 px-2.5 py-1 rounded-full border border-blue-100">RESPONDED</span>
                      ) : (
                        <span className="text-emerald-700 font-bold text-[10px] bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-100">APPROVED</span>
                      )}
                    </td>
                  </tr>
                ))}
                {activity.length === 0 && (
                  <tr>
                    <td colSpan={3} className="p-12 text-center text-slate-400">
                      <Sparkles className="w-8 h-8 text-slate-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-slate-600">No autonomous actions recorded yet.</p>
                      <p className="text-[11px] text-slate-400 mt-0.5">As customers interact with AI Buyer, real-time agent audit logs will stream here.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}