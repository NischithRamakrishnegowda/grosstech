"use client";

import { useState, useEffect } from "react";
import Script from "next/script";
import Link from "next/link";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { ArrowLeft, ShoppingCart, Lock, Loader2, Phone, Mail, MapPin, Package, Check } from "lucide-react";
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

export default function ItemDetailClient({
  item,
  listings,
  initialMode = "BULK",
}: {
  item: Item;
  listings: SellerListing[];
  initialMode?: "RETAIL" | "BULK";
}) {
  const { data: session } = useSession();
  const router = useRouter();
  const { addItem } = useCart();
  const [activeMode, setActiveMode] = useState<"RETAIL" | "BULK">(initialMode);
  const [addedOptId, setAddedOptId] = useState<string | null>(null);
  const [selectedOpts, setSelectedOpts] = useState<Record<string, string>>({});

  // Contact unlock state per seller
  const [unlockedSellers, setUnlockedSellers] = useState<Record<string, SellerContact>>({});
  const [unlockingId, setUnlockingId] = useState<string | null>(null);
  const [contactLoading, setContactLoading] = useState(true);

  // Check which sellers are already unlocked
  useEffect(() => {
    if (session?.user.role !== "BUYER") { setContactLoading(false); return; }
    const sellerIds = [...new Set(listings.map((l) => l.seller.id))];
    let loaded = 0;
    sellerIds.forEach((sellerId) => {
      fetch(`/api/seller/contact/${sellerId}`)
        .then((r) => r.json())
        .then((data) => {
          if (!data.locked) {
            setUnlockedSellers((prev) => ({ ...prev, [sellerId]: data.seller }));
          }
        })
        .catch(() => {})
        .finally(() => {
          loaded++;
          if (loaded >= sellerIds.length) setContactLoading(false);
        });
    });
    if (sellerIds.length === 0) setContactLoading(false);
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

  function getSelectedOpt(listing: SellerListing): PriceOption {
    const id = selectedOpts[listing.id];
    return (
      listing.priceOptions.find((o) => o.id === id) ??
      listing.priceOptions.find((o) => o.stock > 0) ??
      listing.priceOptions[0]
    );
  }

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
      imageUrl: item.imageUrl || undefined,
      quantity: opt.minQty > 1 ? opt.minQty : 1,
      mode: opt.mode as "RETAIL" | "BULK",
    });
    setAddedOptId(opt.id);
    setTimeout(() => setAddedOptId(null), 1500);
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
    }
  }

  async function handleUnlockContact(sellerId: string) {
    if (!session) {
      router.push(`/login?callbackUrl=/products/items/${item.slug}`);
      return;
    }
    if (unlockingId) return;
    setUnlockingId(sellerId);
    try {
      const res = await fetch("/api/payments/contact-unlock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sellerId }),
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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8">
      <Link
        href="/products"
        className="inline-flex items-center gap-1.5 text-sm text-gray-500 hover:text-green-600 transition-colors mb-5"
      >
        <ArrowLeft className="w-4 h-4" /> Back to Products
      </Link>

      {/* Item header — responsive */}
      <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-6">
        <div className="w-20 h-20 sm:w-24 sm:h-24 rounded-2xl bg-gradient-to-br from-gray-50 to-gray-100 overflow-hidden shrink-0">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
          )}
        </div>
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{item.name}</h1>
          <div className="flex items-center gap-2 mt-1.5">
            <Badge variant="secondary">{item.category.name}</Badge>
            <span className="text-sm text-gray-500">
              {filteredListings.length} seller{filteredListings.length !== 1 ? "s" : ""} offering {activeMode.toLowerCase()}
            </span>
          </div>
        </div>
      </div>

      {/* Mode toggle — sticky on mobile */}
      {hasRetail && hasBulk && (
        <div className="sticky top-[64px] z-10 bg-gray-50 -mx-4 px-4 sm:-mx-6 sm:px-6 lg:-mx-8 lg:px-8 py-3 mb-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <span className="text-sm font-medium text-gray-500 hidden sm:block">Mode:</span>
            <div className="flex rounded-xl border border-gray-200 overflow-hidden shadow-sm bg-white">
              <button
                onClick={() => setActiveMode("RETAIL")}
                aria-pressed={activeMode === "RETAIL"}
                className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeMode === "RETAIL"
                    ? "bg-green-600 text-white"
                    : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Retail
              </button>
              <button
                onClick={() => setActiveMode("BULK")}
                aria-pressed={activeMode === "BULK"}
                className={`px-5 py-2.5 text-sm font-semibold transition-all duration-200 ${
                  activeMode === "BULK"
                    ? "bg-blue-600 text-white"
                    : "text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
              >
                Bulk
              </button>
            </div>
            {activeMode === "BULK" && (
              <span className="text-xs text-blue-600 bg-blue-50 px-2 py-1 rounded-lg font-medium animate-fade-in">
                Wholesale pricing
              </span>
            )}
          </div>
        </div>
      )}

      {/* Only one mode available — just show a badge */}
      {(hasRetail !== hasBulk) && hasBulk && (
        <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 mb-4">Bulk Only</Badge>
      )}

      {/* Seller listings with smooth transitions */}
      <div className="min-h-[200px]">
        {filteredListings.length === 0 ? (
          <div className="text-center py-16 animate-fade-in">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600">No {activeMode.toLowerCase()} listings</h3>
            <p className="text-sm text-gray-400 mt-1">
              {activeMode === "BULK"
                ? "No bulk options available. Try switching to Retail."
                : "No retail options. Try switching to Bulk."}
            </p>
            {hasRetail && hasBulk && (
              <Button
                variant="outline"
                size="sm"
                className="mt-4"
                onClick={() => setActiveMode(activeMode === "BULK" ? "RETAIL" : "BULK")}
              >
                Switch to {activeMode === "BULK" ? "Retail" : "Bulk"}
              </Button>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            {filteredListings.map((listing, i) => {
              const contact = unlockedSellers[listing.seller.id];
              return (
                <div
                  key={listing.id}
                  className="bg-white rounded-2xl border border-gray-100 shadow-sm animate-fade-up"
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  {/* Mobile layout: stacked / Desktop: side by side */}
                  <div className="p-4 sm:p-5">
                    <div className="flex flex-col lg:flex-row gap-4">
                      {/* Seller info + price options */}
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-2">
                          <div>
                            <h3 className="font-semibold text-gray-900 text-base">
                              {listing.seller.businessName || listing.seller.name}
                            </h3>
                            {listing.brand && (
                              <p className="text-sm text-gray-500">Brand: {listing.brand}</p>
                            )}
                          </div>
                          {activeMode === "BULK" && (
                            <Badge className="bg-blue-100 text-blue-700 hover:bg-blue-100 shrink-0">Bulk</Badge>
                          )}
                        </div>

                        {listing.description && (
                          <p className="text-sm text-gray-600 line-clamp-2 mb-3">{listing.description}</p>
                        )}

                        {/* Price option cards */}
                        <div className="grid grid-cols-2 sm:flex sm:flex-wrap gap-2 mb-3">
                          {listing.priceOptions.map((opt) => {
                            const isBuyer = session?.user.role === "BUYER";
                            const isSelected = isBuyer && getSelectedOpt(listing).id === opt.id;
                            return (
                              <button
                                key={opt.id}
                                onClick={() => setSelectedOpts((prev) => ({ ...prev, [listing.id]: opt.id }))}
                                disabled={opt.stock === 0 || (session?.user.role !== "BUYER" && !!session)}
                                className={`relative text-left border-2 rounded-xl px-3 py-2.5 transition-all duration-200 ${
                                  isSelected && opt.stock > 0
                                    ? "border-green-500 bg-green-50 text-green-700"
                                    : opt.stock === 0
                                      ? "border-gray-100 bg-gray-50 text-gray-400 cursor-not-allowed"
                                      : "border-gray-200 hover:border-green-400 hover:bg-green-50 active:scale-[0.97] text-gray-700"
                                }`}
                              >
                                <div className="font-semibold text-sm">{opt.weight}</div>
                                <div className="font-bold text-green-600 text-base">₹{opt.price}</div>
                                <div className="text-xs text-gray-400 mt-0.5">
                                  {opt.stock === 0 ? "Out of stock" : `${opt.stock} avail.`}
                                </div>
                                {opt.minQty > 1 && (
                                  <div className="text-xs text-blue-600 font-medium mt-0.5">Min: {opt.minQty}</div>
                                )}
                              </button>
                            );
                          })}
                        </div>

                        {/* Add to Cart — uses selected option */}
                        {session?.user.role === "BUYER" && listing.priceOptions.some((o) => o.stock > 0) && (() => {
                          const opt = getSelectedOpt(listing);
                          const isAdded = addedOptId === opt.id;
                          return (
                            <Button
                              size="sm"
                              disabled={isAdded}
                              className="bg-green-600 hover:bg-green-700 active:scale-[0.97] transition-all"
                              onClick={() => handleAddToCart(listing, opt)}
                            >
                              {isAdded ? <Check className="w-4 h-4 mr-1.5" /> : <ShoppingCart className="w-4 h-4 mr-1.5" />}
                              {isAdded ? "Added!" : `Add to Cart · ${opt.weight}`}
                            </Button>
                          );
                        })()}
                      </div>

                      {/* Contact section */}
                      <div className="lg:w-56 xl:w-64 shrink-0 border-t lg:border-t-0 lg:border-l border-gray-100 pt-4 lg:pt-0 lg:pl-4">
                        {contactLoading ? (
                          <div className="space-y-2 animate-pulse">
                            <div className="h-3 bg-gray-100 rounded w-16 mb-3" />
                            <div className="h-4 bg-gray-100 rounded w-full" />
                            <div className="h-4 bg-gray-100 rounded w-3/4" />
                          </div>
                        ) : session?.user.role === "BUYER" ? (
                          contact ? (
                            <div className="space-y-2.5 text-sm animate-fade-in">
                              <p className="text-xs font-semibold text-green-600 uppercase tracking-wider flex items-center gap-1">
                                <Check className="w-3 h-3" /> Contact Unlocked
                              </p>
                              {contact.phone && (
                                <a href={`tel:${contact.phone}`} className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                                  <Phone className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                  <span className="font-medium">{contact.phone}</span>
                                </a>
                              )}
                              <a href={`mailto:${contact.email}`} className="flex items-center gap-2 text-gray-600 hover:text-green-600 transition-colors">
                                <Mail className="w-3.5 h-3.5 text-green-500 shrink-0" />
                                <span className="truncate">{contact.email}</span>
                              </a>
                              {(contact.city || contact.state) && (
                                <div className="flex items-start gap-2 text-gray-500">
                                  <MapPin className="w-3.5 h-3.5 text-green-500 mt-0.5 shrink-0" />
                                  <span className="text-xs">{[contact.city, contact.state].filter(Boolean).join(", ")}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div>
                              <div className="blur-sm select-none text-sm text-gray-400 space-y-2 mb-3 pointer-events-none" aria-hidden="true">
                                <div className="flex items-center gap-2"><Phone className="w-3.5 h-3.5" />+91 98765 •••••</div>
                                <div className="flex items-center gap-2"><Mail className="w-3.5 h-3.5" />seller@•••••.com</div>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                className="w-full border-green-500 text-green-600 hover:bg-green-50 active:scale-[0.97] transition-all"
                                onClick={() => handleUnlockContact(listing.seller.id)}
                                disabled={unlockingId === listing.seller.id}
                              >
                                {unlockingId === listing.seller.id ? (
                                  <Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />
                                ) : (
                                  <Lock className="w-3.5 h-3.5 mr-1.5" />
                                )}
                                Unlock Contact — ₹{CONTACT_UNLOCK_FEE}
                              </Button>
                            </div>
                          )
                        ) : (
                          <p className="text-xs text-gray-400 italic">
                            <Link href={`/login?callbackUrl=/products/items/${item.slug}`} className="text-green-600 font-medium hover:underline">
                              Sign in as a buyer
                            </Link>
                            {" "}to view and unlock seller contact details
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="lazyOnload" />

    </div>
  );
}
