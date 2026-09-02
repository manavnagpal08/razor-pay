"use client";

import React, { useEffect } from "react";
import { CheckCircle2, AlertCircle, X } from "lucide-react";

export interface ToastProps {
  message: string;
  type?: "success" | "error" | "info";
  onClose: () => void;
  duration?: number;
}

export function Toast({ message, type = "success", onClose, duration = 3500 }: ToastProps) {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, duration);
    return () => clearTimeout(timer);
  }, [onClose, duration]);

  return (
    <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
      <div className={`flex items-center gap-3 px-4 py-3 rounded-2xl shadow-xl border backdrop-blur-md ${
        type === "success"
          ? "bg-slate-900/95 text-white border-emerald-500/30"
          : type === "error"
          ? "bg-slate-900/95 text-white border-rose-500/30"
          : "bg-slate-900/95 text-white border-slate-700"
      }`}>
        {type === "success" && <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />}
        {type === "error" && <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />}
        <span className="text-xs font-semibold text-slate-100">{message}</span>
        <button
          onClick={onClose}
          className="ml-2 text-slate-400 hover:text-white transition-colors p-1"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
