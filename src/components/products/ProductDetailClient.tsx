"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ShoppingCart, ArrowLeft, Lock, Phone, Mail, MapPin, Loader2, Package2 } from "lucide-react";
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
  minQty: number;
  mode: string;
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
  seller: { id: string; name: string; businessName: string | null };
}

interface SellerContact {
  name: string;
  phone: string | null;
  email: string;
  street: string | null;
  city: string | null;
  state: string | null;
  pincode: string | null;
  businessName: string | null;
}

const CATEGORY_EMOJIS: Record<string, string> = {
  grains: "🌾", sugar: "🍚", oil: "🫙", pulses: "🫘", spices: "🌶️",
};

const CATEGORY_IMAGES: Record<string, string> = {
  grains: "/categories/rice.jpg",
  sugar:  "/categories/sugar.jpg",
  oil:    "/categories/oil.jpg",
  pulses: "/categories/pulses.jpg",
  spices: "/categories/spices.jpg",
};

const GRAIN_IMAGES: Array<{ match: string; src: string }> = [
  { match: "wheat",   src: "/categories/wheat.jpg" },
  { match: "ragi",    src: "/categories/ragi.jpg" },
  { match: "corn",    src: "/categories/corn.jpg" },
  { match: "rice",    src: "/categories/rice.jpg" },
  { match: "basmati", src: "/categories/rice.jpg" },
];

function getImageSrc(slug: string, name: string): string | null {
  if (slug === "grains") {
    const lc = name.toLowerCase();
    const match = GRAIN_IMAGES.find((g) => lc.includes(g.match));
    return match ? match.src : "/categories/rice.jpg";
  }
  return CATEGORY_IMAGES[slug] || null;
}

export default function ProductDetailClient({ listing }: { listing: Listing }) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem, items: cartItems } = useCart();
  const [selectedOption, setSelectedOption] = useState<PriceOption>(listing.priceOptions[0]);
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);
  const [contactInfo, setContactInfo] = useState<SellerContact | null>(null);
  const [contactLocked, setContactLocked] = useState(true);
  const [contactChecking, setContactChecking] = useState(false);
  const [contactLoading, setContactLoading] = useState(false);
  const [unlockLoading, setUnlockLoading] = useState(false);

  const emoji = CATEGORY_EMOJIS[listing.category.slug] || "📦";
  const imageSrc = listing.imageUrl || getImageSrc(listing.category.slug, listing.name);
  const isLowStock = selectedOption.stock > 0 && selectedOption.stock <= 50;

  useEffect(() => {
    if (session?.user.role === "BUYER") {
      setContactChecking(true);
      fetch(`/api/seller/contact/${listing.seller.id}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.locked) {
            setContactInfo(data.seller);
            setContactLocked(false);
          }
        })
        .catch(() => {})
        .finally(() => setContactChecking(false));
    }
  }, [session, listing.seller.id]);

  const isBuyer = !session || session.user.role === "BUYER";

  function handleAddToCart() {
    if (!session) {
      router.push(`/login?callbackUrl=/products/${listing.id}`);
      return;
    }
    const alreadyInCart = cartItems.some((i) => i.priceOptionId === selectedOption.id);
    addItem({
      listingId: listing.id,
      priceOptionId: selectedOption.id,
      name: listing.name,
      brand: listing.brand || undefined,
      weight: selectedOption.weight,
      price: selectedOption.price,
      stock: selectedOption.stock,
      imageUrl: listing.imageUrl || undefined,
      quantity: alreadyInCart ? 1 : (selectedOption.minQty > 1 ? selectedOption.minQty : 1),
      minQty: selectedOption.minQty > 1 ? selectedOption.minQty : undefined,
      mode: selectedOption.mode as "RETAIL" | "BULK",
    });
    toast.success(`${listing.name} (${selectedOption.weight}) added to cart`);
  }

  async function verifyAndReveal(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string) {
    setContactLoading(true);
    try {
      const verifyRes = await fetch("/api/payments/contact-unlock/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, sellerId: listing.seller.id }),
      });
      if (verifyRes.ok) {
        const contactRes = await fetch(`/api/seller/contact/${listing.seller.id}`);
        const contactData = await contactRes.json();
        if (!contactData.locked) {
          setContactInfo(contactData.seller);
          setContactLocked(false);
          toast.success("Seller contact unlocked!");
        }
      } else {
        toast.error("Payment verification failed");
      }
    } finally {
      setContactLoading(false);
      setUnlockLoading(false);
    }
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
          await verifyAndReveal(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature);
        },
        prefill: { email: session.user.email || "" },
        theme: { color: "#16a34a" },
        modal: { ondismiss: () => setUnlockLoading(false) },
      });
      rzp.open();
    } catch (err) {
      toast.error("Failed to initiate payment");
      console.error(err);
      setUnlockLoading(false);
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-green-600 transition-colors mb-6"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Product image with shimmer loader */}
        <div className="rounded-2xl aspect-square overflow-hidden border border-slate-100 bg-slate-50 relative animate-fade-in">
          {imageSrc && !imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer" />
          )}
          {imageSrc && !imgError ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={imageSrc}
              alt={listing.name}
              className={`w-full h-full object-cover transition-opacity duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
              onLoad={() => setImgLoaded(true)}
              onError={() => setImgError(true)}
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-[120px] select-none">
              {emoji}
            </div>
          )}
        </div>

        {/* Details */}
        <div className="space-y-5 animate-fade-up">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge variant="secondary">{listing.category.name}</Badge>
              {listing.source === "ADMIN" && (
                <Badge className="bg-green-100 text-green-700 hover:bg-green-100">Gross Tech Verified</Badge>
              )}
            </div>
            <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{listing.name}</h1>
            {listing.brand && <p className="text-gray-500 mt-1">by {listing.brand}</p>}
          </div>

          {listing.description && (
            <p className="text-gray-600 leading-relaxed">{listing.description}</p>
          )}

          {/* Price options */}
          <div>
            <p className="text-sm font-medium text-gray-700 mb-3">Select Pack Size</p>
            <div className="flex flex-wrap gap-2">
              {listing.priceOptions.map((opt) => (
                <button
                  key={opt.id}
                  onClick={() => setSelectedOption(opt)}
                  disabled={opt.stock === 0}
                  className={`px-4 py-2.5 rounded-xl border-2 text-sm font-medium transition-all duration-200 ${
                    selectedOption.id === opt.id
                      ? "border-green-500 bg-green-50 text-green-700 shadow-sm scale-[1.03]"
                      : opt.stock === 0
                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed opacity-60"
                      : "border-gray-200 hover:border-green-300 hover:bg-green-50/50 text-gray-700 hover:scale-[1.02]"
                  }`}
                >
                  <div className="font-semibold">{opt.weight}</div>
                  <div className="font-bold text-base">₹{opt.price}</div>
                  <div className={`text-xs mt-0.5 ${opt.stock === 0 ? "text-red-400" : opt.stock <= 50 ? "text-orange-500 font-medium" : "text-gray-400"}`}>
                    {opt.stock === 0 ? "Out of stock" : opt.stock <= 50 ? `Only ${opt.stock} left` : `${opt.stock} available`}
                  </div>
                </button>
              ))}
            </div>
          </div>

          {/* Selected price display */}
          <div className={`rounded-xl p-4 transition-all duration-300 ${selectedOption.stock === 0 ? "bg-gray-50" : "bg-gradient-to-r from-green-50 to-emerald-50 border border-green-100"}`}>
            <div className="flex items-baseline gap-2">
              <span className="text-3xl font-bold text-green-600">₹{selectedOption.price}</span>
              <span className="text-gray-500">/ {selectedOption.weight}</span>
            </div>
            <div className="flex items-center gap-3 mt-2">
              <p className="text-xs text-gray-500">+ ₹20 platform fee at checkout</p>
              {selectedOption.stock > 0 && (
                <span className={`inline-flex items-center gap-1 text-xs font-medium px-2 py-0.5 rounded-full ${isLowStock ? "bg-orange-100 text-orange-600" : "bg-green-100 text-green-600"}`}>
                  <Package2 className="w-3 h-3" />
                  {isLowStock ? `Only ${selectedOption.stock} units left` : `${selectedOption.stock} units in stock`}
                </span>
              )}
            </div>
          </div>

          {isBuyer ? (
            <Button
              size="lg"
              className="w-full bg-green-600 hover:bg-green-700 transition-all duration-200 active:scale-[0.98]"
              onClick={handleAddToCart}
              disabled={selectedOption.stock === 0}
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {selectedOption.stock === 0 ? "Out of Stock" : "Add to Cart"}
            </Button>
          ) : (
            <Link href="/signup?role=BUYER" className="w-full">
              <Button size="lg" variant="outline" className="w-full border-green-600 text-green-700 hover:bg-green-50">
                Create a Buyer Account to Purchase
              </Button>
            </Link>
          )}

          {/* Seller info */}
          <div className="border border-gray-100 rounded-2xl p-5 bg-white shadow-sm">
            <h3 className="font-semibold text-gray-900 mb-3">Seller Information</h3>
            <p className="text-sm text-gray-700 font-medium">
              {listing.seller.businessName || listing.seller.name}
            </p>

            {/* Contact unlock — only for logged-in BUYER accounts */}
            {session?.user.role === "BUYER" && (
              <div className="mt-3">
                {contactChecking ? (
                  <div className="space-y-2.5 animate-pulse">
                    <div className="h-4 bg-slate-100 rounded w-3/4" />
                    <div className="h-4 bg-slate-100 rounded w-1/2" />
                    <div className="h-9 bg-slate-100 rounded-xl w-full mt-3" />
                  </div>
                ) : contactLocked ? (
                  <div className="relative">
                    <div className="blur-sm select-none text-sm text-gray-600 space-y-1.5 mb-3 pointer-events-none">
                      <div className="flex items-center gap-2"><Phone className="w-4 h-4" />+91 ••••••••••</div>
                      <div className="flex items-center gap-2"><Mail className="w-4 h-4" />••••@••••.com</div>
                      <div className="flex items-center gap-2"><MapPin className="w-4 h-4" />•••••, Karnataka</div>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full border-green-500 text-green-600 hover:bg-green-50 transition-all duration-200"
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
                  <div className="space-y-2 text-sm animate-fade-in">
                    {contactInfo.phone && (
                      <div className="flex items-center gap-2 text-gray-600">
                        <Phone className="w-4 h-4 text-green-500" />
                        <a href={`tel:${contactInfo.phone}`} className="hover:text-green-600 transition-colors font-medium">
                          {contactInfo.phone}
                        </a>
                      </div>
                    )}
                    <div className="flex items-center gap-2 text-gray-600">
                      <Mail className="w-4 h-4 text-green-500" />
                      <a href={`mailto:${contactInfo.email}`} className="hover:text-green-600 transition-colors">
                        {contactInfo.email}
                      </a>
                    </div>
                    {(contactInfo.street || contactInfo.city) && (
                      <div className="flex items-start gap-2 text-gray-600">
                        <MapPin className="w-4 h-4 text-green-500 mt-0.5" />
                        <span>
                          {[contactInfo.street, contactInfo.city, contactInfo.state, contactInfo.pincode].filter(Boolean).join(", ")}
                        </span>
                      </div>
                    )}
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>
      </div>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

    </div>
  );
}
