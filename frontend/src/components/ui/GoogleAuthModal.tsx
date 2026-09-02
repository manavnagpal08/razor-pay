"use client";

import { useState } from "react";
import { X, Loader2, User, Mail, Shield, CheckCircle2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";

interface GoogleAuthModalProps {
  isOpen: boolean;
  onClose: () => void;
  defaultRole?: "customer" | "merchant";
}

export function GoogleAuthModal({ isOpen, onClose, defaultRole = "customer" }: GoogleAuthModalProps) {
  const { loginWithGoogleEmail } = useAuth();
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState<"customer" | "merchant">(defaultRole);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const router = useRouter();

  if (!isOpen) return null;

  const quickAccounts = [
    { email: "screenerpro.ai@gmail.com", name: "ScreenerPro Admin" },
    { email: "manav.nagpal2005@gmail.com", name: "Manav Nagpal" },
    { email: "customer@gmail.com", name: "Verified Shopper" }
  ];

  const handleSelectQuickAccount = (accEmail: string, accName: string) => {
    setEmail(accEmail);
    setName(accName);
    setError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim() || !email.includes("@")) {
      setError("Please enter a valid Google email address.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const derivedName = name.trim() || email.split("@")[0];
      await loginWithGoogleEmail(email.trim(), derivedName, role);
      onClose();
      if (role === "merchant") {
        router.push("/merchant");
      } else {
        router.push("/shop");
      }
    } catch (err: any) {
      setError(err.message || "Failed to authenticate with Google. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-slate-950/60 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
      <div className="bg-white rounded-3xl shadow-2xl border border-slate-200 max-w-md w-full p-6 sm:p-7 relative text-slate-900 animate-in zoom-in-95 duration-200">
        {/* Close Button */}
        <button
          type="button"
          onClick={onClose}
          className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 p-1.5 rounded-xl hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Google Header */}
        <div className="text-center mb-5">
          <div className="w-12 h-12 bg-white rounded-2xl border border-slate-200/90 shadow-sm flex items-center justify-center mx-auto mb-3">
            <svg className="w-6 h-6" viewBox="0 0 24 24">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
            </svg>
          </div>

          <h3 className="font-extrabold text-slate-900 text-lg tracking-tight">Sign in with Google</h3>
          <p className="text-xs text-slate-500 mt-0.5">Choose an account to continue to BuyFlow</p>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-rose-50 border border-rose-200 rounded-xl text-xs text-rose-700 font-medium">
            {error}
          </div>
        )}

        {/* Quick Accounts Chooser */}
        <div className="mb-4">
          <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider mb-2">Quick Select Account</p>
          <div className="space-y-1.5">
            {quickAccounts.map((acc) => (
              <button
                key={acc.email}
                type="button"
                onClick={() => handleSelectQuickAccount(acc.email, acc.name)}
                className={`w-full p-2.5 rounded-2xl border text-left transition-all flex items-center justify-between cursor-pointer ${
                  email === acc.email 
                    ? "bg-blue-50/70 border-blue-300 ring-2 ring-blue-500/20 shadow-xs" 
                    : "bg-slate-50 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300"
                }`}
              >
                <div className="flex items-center gap-2.5 min-w-0">
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-black text-xs flex items-center justify-center shrink-0">
                    {acc.email.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-slate-800 truncate">{acc.name}</p>
                    <p className="text-[11px] text-slate-500 font-mono truncate">{acc.email}</p>
                  </div>
                </div>
                {email === acc.email && (
                  <CheckCircle2 className="w-4 h-4 text-blue-600 shrink-0" />
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Custom Input Form */}
        <form onSubmit={handleSubmit} className="space-y-3.5">
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Or Enter Google Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="email"
                required
                placeholder="your.email@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium"
              />
            </div>
          </div>

          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Full Name (Optional)</label>
            <div className="relative">
              <User className="w-4 h-4 text-slate-400 absolute left-3.5 top-3" />
              <input
                type="text"
                placeholder="e.g. Manav Nagpal"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full pl-10 pr-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-none focus:border-blue-500 focus:bg-white transition-colors font-medium"
              />
            </div>
          </div>

          {/* Role selector */}
          <div>
            <label className="block text-[11px] font-bold text-slate-600 uppercase mb-1">Account Role</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setRole("customer")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === "customer"
                    ? "bg-blue-600 text-white border-blue-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <span>Customer</span>
              </button>
              <button
                type="button"
                onClick={() => setRole("merchant")}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border flex items-center justify-center gap-1.5 cursor-pointer ${
                  role === "merchant"
                    ? "bg-indigo-600 text-white border-indigo-600 shadow-xs"
                    : "bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100"
                }`}
              >
                <Shield className="w-3.5 h-3.5" />
                <span>Merchant</span>
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full py-3 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-xl text-xs font-bold transition-all shadow-md shadow-blue-500/20 flex items-center justify-center gap-2 mt-2 disabled:opacity-50 cursor-pointer"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : (
              <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                <path fill="#fff" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#fff" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#fff" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"/>
                <path fill="#fff" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"/>
              </svg>
            )}
            <span>Continue with Google</span>
          </button>
        </form>
      </div>
    </div>
  );
}
