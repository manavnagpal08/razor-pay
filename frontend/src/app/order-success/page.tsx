"use client"
import React, { Suspense } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { CheckCircle } from "lucide-react"

function OrderSuccessContent() {
  const searchParams = useSearchParams()
  const orderId = searchParams.get("order_id")

  return (
    <div className="max-w-2xl mx-auto p-4 py-24 text-center">
      <CheckCircle className="w-20 h-20 text-green-500 mx-auto mb-6" />
      <h1 className="text-4xl font-bold text-slate-900 mb-4">Payment Successful!</h1>
      <p className="text-lg text-slate-600 mb-8">
        Your order <span className="font-semibold text-slate-800">{orderId}</span> has been confirmed.
      </p>
      
      <div className="bg-slate-50 border border-slate-200 p-6 rounded-xl mb-8">
        <p className="text-slate-500">
          We've received your verified payment through Razorpay and your items are being prepared for shipping.
        </p>
      </div>

      <Link href="/shop" className="bg-blue-600 text-white px-8 py-3 rounded-lg font-bold hover:bg-blue-700 transition-colors">
        Continue Shopping
      </Link>
    </div>
  )
}

export default function OrderSuccessPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <OrderSuccessContent />
    </Suspense>
  )
}
