"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Lock, Loader2, Phone, Mail, MapPin, Package } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { toast } from "sonner";
import { CONTACT_UNLOCK_FEE } from "@/lib/constants";
import ContactUnlockMockModal from "@/components/checkout/ContactUnlockMockModal";

interface PriceOption {
  id: string;
  weight: string;
  price: number;
  stock: number;
  mode: string;
  minQty: number;
}

interface SellerListing {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  priceOptions: PriceOption[];
  seller: { id: string; name: string; businessName: string | null };
}

interface Item {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
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

export default function ItemDetailClient({
  item,
  listings,
}: {
  item: Item;
  listings: SellerListing[];
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  const [activeMode, setActiveMode] = useState<"RETAIL" | "BULK">("RETAIL");

  // Contact unlock state per seller
  const [unlockedSellers, setUnlockedSellers] = useState<Record<string, SellerContact>>({});
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [mockModal, setMockModal] = useState<{ razorpayOrderId: string; sellerId: string } | null>(null);

  const emoji = CATEGORY_EMOJIS[item.category.slug] || "📦";

  // Check which sellers are already unlocked
  useEffect(() => {
    if (session?.user.role !== "BUYER") return;
    const sellerIds = [...new Set(listings.map((l) => l.seller.id))];
    sellerIds.forEach((sellerId) => {
      fetch(`/api/seller/contact/${sellerId}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.locked) {
            setUnlockedSellers((prev) => ({ ...prev, [sellerId]: data.seller }));
          }
        })
        .catch(() => {});
    });
  }, [session, listings]);

  // Filter listings by mode
  const filteredListings = listings
    .map((listing) => ({
      ...listing,
      priceOptions: listing.priceOptions.filter((opt) => opt.mode === activeMode),
    }))
    .filter((listing) => listing.priceOptions.length > 0);

  const hasRetail = listings.some((l) => l.priceOptions.some((o) => o.mode === "RETAIL"));
  const hasBulk = listings.some((l) => l.priceOptions.some((o) => o.mode === "BULK"));

  function handleAddToCart(listing: SellerListing, opt: PriceOption) {
    if (!session) {
      router.push(`/login?callbackUrl=/products/items/${item.slug}`);
      return;
    }
    addItem({
      listingId: listing.id,
      priceOptionId: opt.id,
      name: `${item.name}${listing.brand ? ` (${listing.brand})` : ""}`,
      brand: listing.brand || undefined,
      weight: opt.weight,
      price: opt.price,
      stock: opt.stock,
      imageUrl: listing.imageUrl || undefined,
      quantity: opt.minQty > 1 ? opt.minQty : 1,
      mode: opt.mode as "RETAIL" | "BULK",
    });
    toast.success(`${item.name} (${opt.weight}) added to cart`);
  }

  async function verifyAndReveal(razorpayOrderId: string, razorpayPaymentId: string, razorpaySignature: string, sellerId: string) {
    try {
      const verifyRes = await fetch("/api/payments/contact-unlock/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ razorpayOrderId, razorpayPaymentId, razorpaySignature, sellerId }),
      });
      if (verifyRes.ok) {
        const contactRes = await fetch(`/api/seller/contact/${sellerId}`);
        const contactData = await contactRes.json();
        if (!contactData.locked) {
          setUnlockedSellers((prev) => ({ ...prev, [sellerId]: contactData.seller }));
          toast.success("Seller contact unlocked!");
        }
      } else {
        toast.error("Payment verification failed");
      }
    } finally {
      setUnlockingId(null);
      setMockModal(null);
    }
  }

  async function handleUnlockContact(sellerId: string) {
    if (!session) {
      router.push(`/login?callbackUrl=/products/items/${item.slug}`);
      return;
    }
    if (unlockingId) return; // prevent double-click
    setUnlockingId(sellerId);
    try {
      const res = await fetch("/api/payments/contact-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);

      if (data.isMock) {
        setMockModal({ razorpayOrderId: data.razorpayOrderId, sellerId });
        setUnlockingId(null);
        return;
      }

      const Razorpay = (window as unknown as { Razorpay: new (opts: unknown) => { open: () => void } }).Razorpay;
      const rzp = new Razorpay({
        key: data.keyId,
        amount: data.amount,
        currency: data.currency,
        order_id: data.razorpayOrderId,
        name: "Gross Tech",
        description: "Seller Contact Unlock",
        handler: async (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => {
          await verifyAndReveal(response.razorpay_order_id, response.razorpay_payment_id, response.razorpay_signature, sellerId);
        },
        prefill: { email: session.user.email || "" },
        theme: { color: "#16a34a" },
        modal: { ondismiss: () => setUnlockingId(null) },
      });
      rzp.open();
    } catch {
      toast.error("Failed to initiate payment");
      setUnlockingId(null);
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

      {/* Item header */}
      <div className="flex items-center gap-4 mb-8">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-3xl shrink-0">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover rounded-2xl" />
          ) : (
            emoji
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{item.name}</h1>
          <div className="flex items-center gap-2 mt-1">
            <Badge variant="secondary">{item.category.name}</Badge>
            <span className="text-sm text-gray-500">{filteredListings.length} seller{filteredListings.length !== 1 ? "s" : ""}</span>
          </div>
        </div>
      </div>

      {/* Mode toggle */}
      {(hasRetail || hasBulk) && (
        <div className="flex rounded-xl border border-gray-200 overflow-hidden w-fit mb-6">
          {hasRetail && (
            <button
              onClick={() => setActiveMode("RETAIL")}
              aria-pressed={activeMode === "RETAIL"}
              className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeMode === "RETAIL" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Retail
            </button>
          )}
          {hasBulk && (
            <button
              onClick={() => setActiveMode("BULK")}
              aria-pressed={activeMode === "BULK"}
              className={`px-5 py-2.5 text-sm font-semibold transition-colors ${
                activeMode === "BULK" ? "bg-green-600 text-white" : "bg-white text-gray-600 hover:bg-gray-50"
              }`}
            >
              Bulk
            </button>
          )}
        </div>
      )}

      {/* Seller listings */}
      {filteredListings.length === 0 ? (
        <div className="text-center py-16">
          <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
          <h3 className="text-lg font-semibold text-gray-600">No {activeMode.toLowerCase()} listings</h3>
          <p className="text-sm text-gray-400 mt-1">
            {activeMode === "BULK" ? "No bulk options available for this item yet." : "No retail options available."}
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredListings.map((listing) => {
            const contact = unlockedSellers[listing.seller.id];
            return (
              <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
                <div className="flex flex-col sm:flex-row gap-4">
                  {/* Seller info */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2 mb-3">
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {listing.seller.businessName || listing.seller.name}
                        </h3>
                        {listing.brand && <p className="text-sm text-gray-500">{listing.brand}</p>}
                      </div>
                      {activeMode === "BULK" && (
                        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100">Bulk</Badge>
                      )}
                    </div>

                    {listing.description && (
                      <p className="text-sm text-gray-600 line-clamp-2 mb-3">{listing.description}</p>
                    )}

                    {/* Price options */}
                    <div className="flex flex-wrap gap-2 mb-4">
                      {listing.priceOptions.map((opt) => (
                        <div key={opt.id} className="flex items-center gap-2">
                          <button
                            onClick={() => handleAddToCart(listing, opt)}
                            disabled={opt.stock === 0 || (session?.user.role !== "BUYER" && !!session)}
                            className={`text-sm border-2 rounded-xl px-3 py-2 transition-all ${
                              opt.stock === 0
                                ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                : "border-gray-200 hover:border-green-400 hover:bg-green-50 text-gray-700"
                            }`}
                          >
                            <div className="font-semibold">{opt.weight}</div>
                            <div className="font-bold text-green-600">₹{opt.price}</div>
                            <div className="text-xs text-gray-400">
                              {opt.stock === 0 ? "Out of stock" : `${opt.stock} avail.`}
                            </div>
                            {opt.minQty > 1 && (
                              <div className="text-xs text-blue-600 font-medium">Min: {opt.minQty}</div>
                            )}
                          </button>
                        </div>
                      ))}
                    </div>

                    {/* Quick add to cart */}
                    {session?.user.role === "BUYER" && listing.priceOptions.some((o) => o.stock > 0) && (
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => {
                          const opt = listing.priceOptions.find((o) => o.stock > 0);
                          if (opt) handleAddToCart(listing, opt);
                        }}
                      >
                        <ShoppingCart className="w-4 h-4 mr-1" />
                        Add to Cart
                      </Button>
                    )}
                  </div>

                  {/* Contact section */}
                  <div className="sm:w-64 shrink-0 border-t sm:border-t-0 sm:border-l border-gray-100 pt-4 sm:pt-0 sm:pl-4">
                    {session?.user.role === "BUYER" ? (
                      contact ? (
                        <div className="space-y-2 text-sm animate-fade-in">
                          <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Contact</p>
                          {contact.phone && (
                            <div className="flex items-center gap-2 text-gray-600">
                              <Phone className="w-3.5 h-3.5 text-green-500" />
                              <a href={`tel:${contact.phone}`} className="hover:text-green-600 font-medium">{contact.phone}</a>
                            </div>
                          )}
                          <div className="flex items-center gap-2 text-gray-600">
                            <Mail className="w-3.5 h-3.5 text-green-500" />
                            <a href={`mailto:${contact.email}`} className="hover:text-green-600 truncate">{contact.email}</a>
                          </div>
                          {(contact.street || contact.city) && (
                            <div className="flex items-start gap-2 text-gray-600">
                              <MapPin className="w-3.5 h-3.5 text-green-500 mt-0.5" />
                              <span className="text-xs">{[contact.city, contact.state].filter(Boolean).join(", ")}</span>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div>
                          <div className="blur-sm select-none text-sm text-gray-600 space-y-1.5 mb-3 pointer-events-none">
                            <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />+91 ••••••</div>
                            <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />••••@••••</div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full border-green-500 text-green-600 hover:bg-green-50 text-xs"
                            onClick={() => handleUnlockContact(listing.seller.id)}
                            disabled={unlockingId === listing.seller.id}
                          >
                            {unlockingId === listing.seller.id ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
                            ) : (
                              <Lock className="w-3.5 h-3.5 mr-1" />
                            )}
                            Unlock — ₹{CONTACT_UNLOCK_FEE}
                          </Button>
                        </div>
                      )
                    ) : (
                      <p className="text-xs text-gray-400">Sign in as a buyer to unlock seller contact</p>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

      {mockModal && (
        <ContactUnlockMockModal
          razorpayOrderId={mockModal.razorpayOrderId}
          amount={CONTACT_UNLOCK_FEE * 100}
          sellerId={mockModal.sellerId}
          onSuccess={(orderId, paymentId, sig) => verifyAndReveal(orderId, paymentId, sig, mockModal.sellerId)}
          onClose={() => { setMockModal(null); setUnlockingId(null); }}
        />
      )}
    </div>
  );
}
