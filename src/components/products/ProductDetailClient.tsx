"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft, Lock, Phone, Mail, MapPin, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { CONTACT_UNLOCK_FEE } from "@/lib/constants";

interface PriceOption {
  id: string;
  weight: string;
  price: number;
  stock: number;
}

interface Listing {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  source: string;
  category: { id: string; name: string; slug: string };
  priceOptions: PriceOption[];
  seller: { id: string; name: string; businessName: string | null; address: string | null };
}

interface SellerContact {
  name: string;
  phone: string | null;
  email: string;
  address: string | null;
  businessName: string | null;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  rice: "🌾", sugar: "🍚", oil: "🫙", pulses: "🫘", spices: "🌶️",
};

export default function ProductDetailClient({ listing }: { listing: Listing }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  const [selectedOption, setSelectedOption] = useState<PriceOption>(listing.priceOptions[0]);
  const [contactInfo, setContactInfo] = useState<SellerContact | null>(null);
  const [contactLocked, setContactLocked] = useState(true);
  const [contactLoading, setContactLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const emoji = CATEGORY_EMOJIS[listing.category.slug] || "📦";

  useEffect(() => {
    if (session) {
      fetch(`/api/seller/contact/${listing.seller.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.locked) {
            setContactInfo(data.seller);
            setContactLocked(false);
          }
        })
        .catch(() => {});
    }
  }, [session, listing.seller.id]);

  function handleAddToCart() {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${listing.id}`);
      return;
    }
    addItem({
      listingId: listing.id,
      priceOptionId: selectedOption.id,
      name: listing.name,
      brand: listing.brand || undefined,
      weight: selectedOption.weight,
      price: selectedOption.price,
      imageUrl: listing.imageUrl || undefined,
      quantity: 1,
    });
    toast.success(`${listing.name} (${selectedOption.weight}) added to cart`);
  }

  async function handleUnlockContact() {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${listing.id}`);
      return;
    }
    setUnlockLoading(true);
    try {
      const res = await fetch("/api/payments/contact-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId: listing.seller.id }),
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
        description: "Seller Contact Unlock",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          setContactLoading(true);
          const verifyRes = await fetch("/api/payments/contact-unlock/verify", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              sellerId: listing.seller.id,
            }),
          });
          if (verifyRes.ok) {
            const contactRes = await fetch(`/api/seller/contact/${listing.seller.id}`);
            const contactData = await contactRes.json();
            if (!contactData.locked) {
              setContactInfo(contactData.seller);
              setContactLocked(false);
              toast.success("Seller contact unlocked!");
            }
          }
          setContactLoading(false);
        },
        prefill: { email: session.user.email || "" },
        theme: { color: "#16a34a" },
      });
      rzp.open();
    } catch (err) {
      toast.error("Failed to initiate payment");
      console.error(err);
    } finally {
      setUnlockLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link href="/products" className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700 mb-6">
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-10">
        {/* Image */}
        <div className="bg-white rounded-2xl border border-gray-100 aspect-square flex items-center justify-center text-8xl shadow-sm">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            emoji
          )}
        </div>

        {/* Details */}
        <div className="space-y-5">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{listing.category.name}</Badge>
              {listing.source === "ADMIN" && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Gross Tech Verified</Badge>
              )}
            </div>
            <h1 className="text-3xl font-bold text-gray-900">{listing.name}</h1>
            {listing.brand && <p className="text-gray-500 mt-1">by {listing.brand}</p>}
          </div>

          {listing.description && (
            <p className="text-gray-600 leading-relaxed">{listing.description}</p>
          )}

          {/* Price options */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-2">Select Quantity</p>
            <div className="flex flex-wrap gap-2">
              {listing.priceOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt)}
                  disabled={opt.stock === 0}
                  className={`px-4 py-2 rounded-xl border-2 text-sm font-medium transition-all ${
                    selectedOption.id === opt.id
                      ? "border-green-500 bg-green-50 text-green-700"
                      : opt.stock === 0
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                      : "border-gray-200 hover:border-green-300 text-gray-700"
                  }`}
                >
                  <div>{opt.weight}</div>
                  <div className="font-bold">₹{opt.price}</div>
                  {opt.stock === 0 && <div className="text-xs">Out of stock</div>}
                </button>
              ))}
            </div>
          </div>

          {/* Selected price display */}
          <div className="bg-green-50 rounded-xl p-4">
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">₹{selectedOption.price}</span>
              <span className="text-gray-500">/ {selectedOption.weight}</span>
            </div>
            <p className="text-xs text-gray-500 mt-1">+ ₹20 platform fee at checkout</p>
          </div>

          <Button
            size="lg"
            className="w-full bg-green-600 hover:bg-green-700"
            onClick={handleAddToCart}
            disabled={selectedOption.stock === 0}
          >
            <ShoppingCart className="w-5 h-5 mr-2" />
            {selectedOption.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>

          {/* Seller info */}
          <div className="border rounded-2xl p-5">
            <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
            <p className="text-sm text-gray-600 mb-3">
              <span className="font-medium">
                {listing.seller.businessName || listing.seller.name}
              </span>
            </p>

            {contactLocked ? (
              <div className="relative">
                <div className="blur-sm select-none text-sm text-gray-600 space-y-1.5 mb-3">
                  <div className="flex items-center gap-2"><Phone className="w-4 h-4" />+91 ••••••••••</div>
                  <div className="flex items-center gap-2"><Mail className="w-4 h-4" />••••@••••.com</div>
                  <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />•••••, Karnataka</div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full border-green-500 text-green-600 hover:bg-green-50"
                  onClick={handleUnlockContact}
                  disabled={unlockLoading || contactLoading}
                >
                  {unlockLoading || contactLoading ? (
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                  ) : (
                    <Lock className="w-4 h-4 mr-2" />
                  )}
                  Unlock Seller Contact — ₹{CONTACT_UNLOCK_FEE}
                </Button>
              </div>
            ) : contactInfo ? (
              <div className="space-y-2 text-sm">
                {contactInfo.phone && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Phone className="w-4 h-4 text-green-500" />
                    {contactInfo.phone}
                  </div>
                )}
                <div className="flex items-center gap-2 text-gray-600">
                  <Mail className="w-4 h-4 text-green-500" />
                  {contactInfo.email}
                </div>
                {contactInfo.address && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <MapPin className="w-4 h-4 text-green-500" />
                    {contactInfo.address}
                  </div>
                )}
              </div>
            ) : null}
          </div>
        </div>
      </div>

      {/* Load Razorpay script */}
      <script src="https://checkout.razorpay.com/v1/checkout.js" async />
    </div>
  );
}
