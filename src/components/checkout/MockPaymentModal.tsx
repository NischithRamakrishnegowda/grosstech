"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { Loader2, CheckCircle2, XCircle, X } from "lucide-react";

interface MockPaymentModalProps {
  internalOrderId: string;
  razorpayOrderId: string;
  amount: number; // in paise
  onClose: () => void;
  onClearCart: () => void;
}

export default function MockPaymentModal({
  internalOrderId,
  razorpayOrderId,
  amount,
  onClose,
  onClearCart,
}: MockPaymentModalProps) {
  const router = useRouter();
  const [loading, setLoading] = useState<"success" | "fail" | "cancel" | null>(null);

  async function handleSuccess() {
    setLoading("success");
    try {
      const res = await fetch("/api/payments/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          razorpayOrderId,
          razorpayPaymentId: `mock_pay_${Date.now()}`,
          razorpaySignature: "mock_signature",
        }),
      });
      if (!res.ok) throw new Error("Verification failed");
      const { orderId } = await res.json();
      onClearCart();
      router.push(`/checkout/success?orderId=${orderId}`);
    } catch {
      toast.error("Payment simulation failed");
      setLoading(null);
    }
  }

  async function handleFail() {
    setLoading("fail");
    await updateStatus("FAILED");
    toast.error("Payment failed (simulated)");
    setLoading(null);
    onClose();
  }

  async function handleCancel() {
    setLoading("cancel");
    await updateStatus("CANCELLED");
    setLoading(null);
    onClose();
  }

  async function updateStatus(status: "FAILED" | "CANCELLED") {
    await fetch("/api/payments/update-status", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ internalOrderId, status }),
    }).catch(() => {});
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl p-6 w-full max-w-sm mx-4 relative animate-fade-up">
        <button
          onClick={handleCancel}
          disabled={loading !== null}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="text-center mb-6">
          <div className="inline-flex items-center justify-center w-12 h-12 rounded-full bg-yellow-50 border-2 border-yellow-200 mb-3">
            <span className="text-xl">🧪</span>
          </div>
          <h2 className="text-lg font-bold text-gray-900">Mock Payment</h2>
          <p className="text-sm text-gray-500 mt-1">Test mode — no real money charged</p>
          <p className="text-2xl font-bold text-green-600 mt-3">₹{(amount / 100).toFixed(0)}</p>
        </div>

        <div className="space-y-3">
          <Button
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleSuccess}
            disabled={loading !== null}
          >
            {loading === "success" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <CheckCircle2 className="w-4 h-4 mr-2" />
            )}
            Simulate Success
          </Button>

          <Button
            variant="outline"
            className="w-full border-red-200 text-red-600 hover:bg-red-50"
            onClick={handleFail}
            disabled={loading !== null}
          >
            {loading === "fail" ? (
              <Loader2 className="w-4 h-4 animate-spin mr-2" />
            ) : (
              <XCircle className="w-4 h-4 mr-2" />
            )}
            Simulate Failure
          </Button>

          <Button
            variant="ghost"
            className="w-full text-gray-500"
            onClick={handleCancel}
            disabled={loading !== null}
          >
            {loading === "cancel" ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
            Cancel
          </Button>
        </div>
      </div>
    </div>
  );
}
