"use client";

import Link from "next/link";
import Script from "next/script";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { Minus, Plus, Trash2, ShoppingCart, Loader2, AlertCircle, MapPin, Phone, ShieldAlert, Truck, PackageCheck, Package } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { PLATFORM_FEE } from "@/lib/constants";

export default function CheckoutClient() {
  const { items, removeItem, updateQty, clearCart } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [paying, setPaying] = useState(false);
  const [deliveryOption, setDeliveryOption] = useState<"SELF_PICKUP" | "DELIVERY">("SELF_PICKUP");

  // Shipping fields (prefilled from session)
  const [lane1, setLane1] = useState("");
  const [lane2, setLane2] = useState("");
  const [landmark, setLandmark] = useState("");
  const [pincode, setPincode] = useState("");
  const [shippingPhone, setShippingPhone] = useState("");
  const [secondaryPhone, setSecondaryPhone] = useState("");

  useEffect(() => {
    if (session?.user?.phone) {
      setShippingPhone(session.user.phone);
    }
    // Auto-fill address from user profile
    if (session?.user) {
      fetch("/api/user/address")
        .then((r) => r.json())
        .then((data) => {
          if (data.street && !lane1) setLane1(data.street);
          if (data.pincode && !pincode) setPincode(data.pincode);
        })
        .catch(() => {});
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

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
    if (deliveryOption === "DELIVERY") {
      if (!lane1.trim()) {
        toast.error("Please enter your street address (Lane 1)");
        return;
      }
      if (!pincode.trim() || !/^\d{6}$/.test(pincode.trim())) {
        toast.error("Please enter a valid 6-digit pincode");
        return;
      }
    }

    const shippingAddress = [lane1.trim(), lane2.trim(), landmark.trim(), `Pincode: ${pincode.trim()}`]
      .filter(Boolean)
      .join(", ");

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
          shippingAddress,
          shippingPhone,
          secondaryPhone,
          deliveryOption,
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
            }),
          });
          if (verifyRes.ok) {
            const { orderId } = await verifyRes.json();
            clearCart();
            router.push(`/checkout/success?orderId=${orderId}`);
          } else {
            await fetch("/api/payments/update-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ internalOrderId: data.internalOrderId, status: "FAILED" }),
            }).catch(() => {});
            toast.error("Payment verification failed");
            setPaying(false);
          }
        },
        prefill: {
          name: session.user.name || "",
          email: session.user.email || "",
          contact: shippingPhone,
        },
        theme: { color: "#16a34a" },
        modal: {
          ondismiss: () => {
            fetch("/api/payments/update-status", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({ internalOrderId: data.internalOrderId, status: "CANCELLED" }),
            }).catch(() => {});
            setPaying(false);
          },
        },
      });
      rzp.open();
    } catch {
      toast.error("Failed to initiate payment");
      setPaying(false);
    }
  }

  // Block sellers and admins
  if (session && session.user.role !== "BUYER") {
    return (
      <div className="text-center py-20 animate-fade-up">
        <ShieldAlert className="w-16 h-16 text-slate-200 mx-auto mb-4" />
        <h2 className="text-xl font-semibold text-gray-700">Buyers only</h2>
        <p className="text-gray-400 mt-2 max-w-sm mx-auto">
          Purchasing is only available for buyer accounts. Sign in with a buyer account to shop.
        </p>
        <Button className="mt-6 bg-green-600 hover:bg-green-700" asChild>
          <Link href="/products">Browse Products</Link>
        </Button>
      </div>
    );
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
    <>
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left column: cart + shipping */}
        <div className="lg:col-span-2 space-y-4">
          {/* Cart items */}
          {items.map((item, idx) => (
            <div
              key={item.priceOptionId}
              className="bg-white rounded-2xl border border-gray-100 p-4 flex gap-4 hover:shadow-md transition-all duration-200 animate-slide-right"
              style={{ animationDelay: `${idx * 60}ms` }}
            >
              <div className="w-16 h-16 bg-gradient-to-br from-gray-50 to-gray-100 rounded-xl flex items-center justify-center shrink-0 overflow-hidden">
                {item.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-xl" />
                ) : (
                  <Package className="w-7 h-7 text-gray-300" />
                )}
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
                  aria-label={`Remove ${item.name}`}
                  className="p-2 -m-1 text-gray-300 hover:text-red-500 active:scale-90 transition-all"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => updateQty(item.priceOptionId, item.quantity - 1)}
                    disabled={item.quantity <= 1}
                    aria-label="Decrease quantity"
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-40"
                  >
                    <Minus className="w-4 h-4" />
                  </button>
                  <span className="w-8 text-center text-sm font-bold">{item.quantity}</span>
                  <button
                    onClick={() => updateQty(item.priceOptionId, item.quantity + 1)}
                    disabled={item.quantity >= item.stock}
                    aria-label="Increase quantity"
                    className="w-10 h-10 rounded-xl border border-gray-200 flex items-center justify-center hover:bg-gray-100 active:scale-90 transition-all disabled:opacity-40"
                  >
                    <Plus className="w-4 h-4" />
                  </button>
                </div>
                <p className="text-sm font-bold text-gray-800">₹{item.price * item.quantity}</p>
              </div>
            </div>
          ))}

          {/* Delivery option */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 animate-fade-in">
            <h3 className="font-semibold text-gray-900 mb-3">Delivery Option</h3>
            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() => setDeliveryOption("SELF_PICKUP")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  deliveryOption === "SELF_PICKUP"
                    ? "border-green-500 bg-green-50 text-green-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <PackageCheck className="w-6 h-6" />
                <span className="font-semibold text-sm">Self Pickup</span>
                <span className="text-xs text-gray-400">Pick up from seller</span>
              </button>
              <button
                type="button"
                onClick={() => setDeliveryOption("DELIVERY")}
                className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                  deliveryOption === "DELIVERY"
                    ? "border-blue-500 bg-blue-50 text-blue-700"
                    : "border-gray-200 hover:border-gray-300 text-gray-600"
                }`}
              >
                <Truck className="w-6 h-6" />
                <span className="font-semibold text-sm">Delivery</span>
                <span className="text-xs text-gray-400">Delivered to you</span>
              </button>
            </div>
            {deliveryOption === "DELIVERY" && (
              <p className="text-xs text-blue-600 mt-3 bg-blue-50 rounded-lg px-3 py-2">
                Delivery charge will be calculated based on your location and communicated separately by admin/seller.
              </p>
            )}
          </div>

          {/* Shipping details */}
          <div className="bg-white rounded-2xl border border-gray-100 p-5 space-y-4 animate-fade-in">
            <h3 className="font-semibold text-gray-900 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-green-600" />
              {deliveryOption === "DELIVERY" ? "Delivery Address" : "Your Address"}
              {deliveryOption === "SELF_PICKUP" && <span className="text-xs font-normal text-gray-400">(optional)</span>}
            </h3>

            <div className="space-y-1.5">
              <Label>Lane 1 {deliveryOption === "DELIVERY" && <span className="text-red-500">*</span>}</Label>
              <Input
                placeholder="House no., Street, Area"
                value={lane1}
                onChange={(e) => setLane1(e.target.value)}
              />
            </div>
            <div className="space-y-1.5">
              <Label>Lane 2 <span className="text-gray-400 text-xs">(optional)</span></Label>
              <Input
                placeholder="Apartment, Building, Colony"
                value={lane2}
                onChange={(e) => setLane2(e.target.value)}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Pincode {deliveryOption === "DELIVERY" && <span className="text-red-500">*</span>}</Label>
                <Input
                  placeholder="6-digit pincode"
                  maxLength={6}
                  value={pincode}
                  onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Landmark <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input
                  placeholder="Near school, temple, etc."
                  value={landmark}
                  onChange={(e) => setLandmark(e.target.value)}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label className="flex items-center gap-1.5">
                  <Phone className="w-3.5 h-3.5" /> Contact Phone
                </Label>
                <Input
                  type="tel"
                  placeholder={session?.user?.phone || "Primary phone"}
                  value={shippingPhone}
                  onChange={(e) => setShippingPhone(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label>Alternate Phone <span className="text-gray-400 text-xs">(optional)</span></Label>
                <Input
                  type="tel"
                  placeholder="Secondary number"
                  value={secondaryPhone}
                  onChange={(e) => setSecondaryPhone(e.target.value)}
                />
              </div>
            </div>

            {session?.user && (
              <p className="text-xs text-slate-400">
                Order confirmation will be sent to <span className="text-slate-600">{session.user.email}</span>
              </p>
            )}
          </div>
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
            <div className="flex justify-between text-gray-600">
              <span>Delivery</span>
              <span className={deliveryOption === "DELIVERY" ? "text-blue-600 text-xs" : ""}>
                {deliveryOption === "DELIVERY" ? "Charged separately" : "Self Pickup"}
              </span>
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
      </div>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />
    </>
  );
}
