"use client"
import React, { Suspense } from "react"
import { XCircle, ArrowLeft } from "lucide-react"
import { useSearchParams } from "next/navigation"
import Link from "next/link"

function OrderFailedContent() {
  const searchParams = useSearchParams()
  const reason = searchParams.get("reason") || "Payment verification failed."

  return (
    <div className="max-w-3xl mx-auto p-4 py-16 text-center">
      <XCircle className="w-16 h-16 text-red-500 mx-auto mb-6" />
      <h1 className="text-3xl font-bold text-slate-900 mb-4">Payment Failed</h1>
      <p className="text-slate-600 mb-8">{reason}</p>
      <div className="bg-white p-6 rounded-xl border border-slate-200 shadow-sm inline-block text-left mb-8 max-w-md w-full">
        <p className="text-sm text-slate-500 mb-4">
          Please check your payment details and try again. No amount was deducted from your account.
        </p>
      </div>
      <div>
        <Link href="/cart" className="inline-flex items-center gap-2 bg-blue-600 text-white px-6 py-3 rounded-xl font-semibold hover:bg-blue-700 transition-colors">
          <ArrowLeft className="w-5 h-5" /> Return to Cart
        </Link>
      </div>
    </div>
  )
}

export default function OrderFailedPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <OrderFailedContent />
    </Suspense>
  )
}
