"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useState } from "react";
import { PLATFORM_FEE } from "@/lib/constants";

export default function CheckoutClient() {
  const { items, removeItem, updateQty, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [paying, setPaying] = useState(false);

  const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const total = subtotal + PLATFORM_FEE;

  async function handlePayment() {
    if (!session) {
      router.push("/login?callbackUrl=/checkout");
      return;
    }
    if (items.length === 0) {
      toast.error("Your cart is empty");
      return;
    }

    setPaying(true);
    try {
      const res = await fetch("/api/payments/create-order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: items.map((i) => ({
            listingId: i.listingId,
            priceOptionId: i.priceOptionId,
            quantity: i.quantity,
          })),
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      const Razorpay = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      const rzp = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "Gross Tech",
        description: "Order Payment",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          const verifyRes = await fetch("/api/payments/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              items: items.map((i) => ({
                listingId: i.listingId,
                priceOptionId: i.priceOptionId,
                quantity: i.quantity,
              })),
            }),
          });
          if (verifyRes.ok) {
            const { orderId } = await verifyRes.json();
            clearCart();
            router.push(`/checkout/success?orderId=${orderId}`);
          } else {
            toast.error("Payment verification failed");
          }
        },
        prefill: { name: session.user.name || "", email: session.user.email || "" },
        theme: { color: "#16a34a" },
        modal: { ondismiss: () => setPaying(false) },
      });
      rzp.open();
    } catch {
      toast.error("Failed to initiate payment");
      setPaying(false);
    }
  }

  if (items.length === 0) {
    return (
      <div className="text-center py-20 animate-fade-up">
        <ShoppingCart className="w-16 h-16 text-gray-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Your cart is empty</h2>
        <p className="text-gray-400 mt-2">Add some products to continue</p>
        <Button className="mt-6 bg-green-600 hover:bg-green-700 transition-all duration-200" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      {/* Cart items */}
      <div className="lg:col-span-2 space-y-3">
        {items.map((item, idx) => (
          <div
            key={item.priceOptionId}
            className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-all duration-200 animate-slide-right"
            style={{ animationDelay: `${idx * 60}ms` }}
          >
            <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center text-2xl shrink-0">
              {item.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
              ) : "📦"}
            </div>
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-gray-900 truncate">{item.name}</p>
              <p className="text-sm text-gray-500">{item.brand ? `${item.brand} · ` : ""}{item.weight}</p>
              <p className="text-green-600 font-bold mt-1">₹{item.price} <span className="text-xs text-gray-400 font-normal">/ unit</span></p>
              {item.quantity >= item.stock && (
                <p className="text-xs text-orange-500 flex items-center gap-1 mt-1">
                  <AlertCircle className="w-3 h-3" /> Max stock reached
                </p>
              )}
            </div>
            <div className="flex flex-col items-end gap-2 shrink-0">
              <button
                onClick={() => removeItem(item.priceOptionId)}
                className="text-gray-300 hover:text-red-500 transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => updateQty(item.priceOptionId, item.quantity - 1)}
                  disabled={item.quantity <= 1}
                  className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <Minus className="w-3 h-3" />
                </button>
                <span className="w-6 text-center text-sm font-semibold">{item.quantity}</span>
                <button
                  onClick={() => updateQty(item.priceOptionId, item.quantity + 1)}
                  disabled={item.quantity >= item.stock}
                  className="w-7 h-7 rounded-full border flex items-center justify-center hover:bg-gray-100 transition-colors disabled:opacity-40"
                >
                  <Plus className="w-3 h-3" />
                </button>
              </div>
              <p className="text-sm font-bold text-gray-800">₹{item.price * item.quantity}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Order summary */}
      <div className="bg-white rounded-2xl border border-gray-100 p-4 sm:p-6 h-fit lg:sticky lg:top-24 shadow-sm animate-fade-in">
        <h2 className="font-bold text-gray-900 mb-4 text-lg">Order Summary</h2>

        <div className="space-y-3 text-sm">
          {items.map((item) => (
            <div key={item.priceOptionId} className="flex justify-between text-gray-500">
              <span className="truncate mr-2">{item.name} × {item.quantity}</span>
              <span className="shrink-0 font-medium text-gray-700">₹{item.price * item.quantity}</span>
            </div>
          ))}
          <Separator />
          <div className="flex justify-between text-gray-600">
            <span>Subtotal</span>
            <span>₹{subtotal}</span>
          </div>
          <div className="flex justify-between text-gray-600">
            <span>Platform Fee</span>
            <span>₹{PLATFORM_FEE}</span>
          </div>
          <Separator />
          <div className="flex justify-between font-bold text-gray-900 text-base">
            <span>Total</span>
            <span className="text-green-600">₹{total}</span>
          </div>
        </div>

        <Button
          size="lg"
          className="w-full mt-6 bg-green-600 hover:bg-green-700 transition-all duration-200 active:scale-[0.98]"
          onClick={handlePayment}
          disabled={paying}
        >
          {paying ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Pay ₹{total} via Razorpay
        </Button>

        <p className="text-xs text-gray-400 text-center mt-3">
          Secure payment powered by Razorpay
        </p>
      </div>

      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
