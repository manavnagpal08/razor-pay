"use client";

import { usePathname, useSearchParams } from "next/navigation";
import { Navbar } from "./Navbar";
import { Footer } from "./Footer";
import React from "react";

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const isChat = pathname === "/chat" || searchParams.get("embed") === "true";

  if (isChat) {
    return (
      <main className="w-full h-screen p-0 m-0 overflow-hidden bg-slate-50 flex flex-col justify-center items-center">
        {children}
      </main>
    );
  }

  return (
    <div className="min-h-screen flex flex-col justify-between bg-slate-50">
      <Navbar />
      <main className="w-full max-w-[1680px] mx-auto px-4 sm:px-6 lg:px-8 py-5 flex-1">
        {children}
      </main>
      <Footer />
    </div>
  );
}
