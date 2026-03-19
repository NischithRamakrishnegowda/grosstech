"use client";

import Link from "next/link";
import { ShoppingCart, Package2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import { useState } from "react";

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
  seller: { id: string; name: string; businessName: string | null };
}

const CATEGORY_EMOJIS: Record<string, string> = {
  grains: "🌾", sugar: "🍚", oil: "🫙", pulses: "🫘", spices: "🌶️",
};

const CATEGORY_PILL: Record<string, string> = {
  grains: "bg-amber-50 text-amber-700",
  sugar:  "bg-sky-50 text-sky-700",
  oil:    "bg-yellow-50 text-yellow-700",
  pulses: "bg-orange-50 text-orange-700",
  spices: "bg-red-50 text-red-700",
};

// Local category images (from public/categories/)
const CATEGORY_IMAGES: Record<string, string> = {
  grains: "/categories/rice.jpg",
  sugar:  "/categories/sugar.jpg",
  oil:    "/categories/oil.jpg",
  pulses: "/categories/pulses.jpg",
  spices: "/categories/spices.jpg",
};

// Per-grain product images keyed by name keyword
const GRAIN_IMAGES: Array<{ match: string; src: string }> = [
  { match: "wheat",  src: "/categories/wheat.jpg" },
  { match: "ragi",   src: "/categories/ragi.jpg" },
  { match: "corn",   src: "/categories/corn.jpg" },
  { match: "rice",   src: "/categories/rice.jpg" },
  { match: "basmati",src: "/categories/rice.jpg" },
];

function getImageSrc(slug: string, name: string): string | null {
  if (slug === "grains") {
    const lc = name.toLowerCase();
    const match = GRAIN_IMAGES.find((g) => lc.includes(g.match));
    return match ? match.src : "/categories/rice.jpg";
  }
  return CATEGORY_IMAGES[slug] || null;
}

export default function ProductCard({ listing }: { listing: Listing }) {
  const { addItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const lowestPrice = listing.priceOptions[0];
  const totalStock = listing.priceOptions.reduce((s, o) => s + o.stock, 0);
  const emoji = CATEGORY_EMOJIS[listing.category.slug] || "📦";
  const isLowStock = totalStock > 0 && totalStock <= 50;
  const isOutOfStock = totalStock === 0;

  const imageSrc = getImageSrc(listing.category.slug, listing.name);

  const isBuyer = !session || session.user.role === "BUYER";

  function handleAddToCart() {
    if (!session) {
      router.push("/login?callbackUrl=/products");
      return;
    }
    if (!lowestPrice) return;
    addItem({
      listingId: listing.id,
      priceOptionId: lowestPrice.id,
      name: listing.name,
      brand: listing.brand || undefined,
      weight: lowestPrice.weight,
      price: lowestPrice.price,
      stock: lowestPrice.stock,
      imageUrl: listing.imageUrl || undefined,
      quantity: 1,
    });
    toast.success(`${listing.name} (${lowestPrice.weight}) added to cart`);
  }

  return (
    <div className={`rounded-2xl overflow-hidden border border-slate-100 hover:border-slate-200 hover:shadow-md transition-all duration-300 group bg-white ${isOutOfStock ? "opacity-60" : ""}`}>
      {/* Image area */}
      <Link href={`/products/${listing.id}`} className="block relative aspect-[4/3] overflow-hidden bg-slate-50">

        {/* Shimmer loader — shown while image is loading */}
        {imageSrc && !imgLoaded && !imgError && (
          <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer" />
        )}

        {/* Image */}
        {imageSrc && !imgError && (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={imageSrc}
            alt={listing.name}
            className={`absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-all duration-500 ${imgLoaded ? "opacity-100" : "opacity-0"}`}
            onLoad={() => setImgLoaded(true)}
            onError={() => setImgError(true)}
          />
        )}

        {/* Emoji fallback — shown only if no image or image failed */}
        {(!imageSrc || imgError) && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-7xl group-hover:scale-110 transition-transform duration-300 inline-block select-none">
              {emoji}
            </span>
          </div>
        )}

        {/* Category badge */}
        <span className={`absolute top-3 left-3 z-20 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm ${CATEGORY_PILL[listing.category.slug] || "bg-slate-50 text-slate-600"}`}>
          {listing.category.name}
        </span>

        {/* Low stock badge */}
        {isLowStock && (
          <span className="absolute top-3 right-3 z-20 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
            Only {totalStock} left
          </span>
        )}

        {/* Out of stock overlay */}
        {isOutOfStock && (
          <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center">
            <span className="bg-white text-slate-500 text-xs font-semibold px-4 py-1.5 rounded-full border border-slate-200">
              Out of Stock
            </span>
          </div>
        )}

        {/* Price pill — only shown over image */}
        {imageSrc && !imgError && imgLoaded && lowestPrice && !isOutOfStock && (
          <div className="absolute bottom-3 right-3 z-20 bg-white/90 backdrop-blur-sm rounded-xl px-3 py-1.5 shadow-sm">
            <span className="text-green-600 font-bold text-sm">₹{lowestPrice.price}</span>
            <span className="text-slate-400 text-[11px]">/{lowestPrice.weight}</span>
          </div>
        )}
      </Link>

      {/* Content */}
      <div className="p-4">
        <div className="mb-3">
          <div className="flex items-start justify-between gap-2">
            <Link href={`/products/${listing.id}`}>
              <h3 className="font-semibold text-slate-900 text-[15px] hover:text-green-700 transition-colors leading-snug">
                {listing.name}
              </h3>
            </Link>
            {/* Price shown in content when no image loaded */}
            {(!imageSrc || imgError) && lowestPrice && !isOutOfStock && (
              <div className="shrink-0 text-right">
                <span className="text-green-600 font-bold text-sm">₹{lowestPrice.price}</span>
                <span className="text-slate-400 text-[11px] block">{lowestPrice.weight}</span>
              </div>
            )}
          </div>
          <div className="flex items-center justify-between mt-1">
            <p className="text-xs text-slate-400">
              {listing.brand ? listing.brand + " · " : ""}
              {listing.source === "ADMIN" ? "Gross Tech" : (listing.seller.businessName || listing.seller.name)}
            </p>
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-orange-500" : "text-slate-400"}`}>
              <Package2 className="w-3 h-3" />
              {isOutOfStock ? "Out of stock" : `${totalStock} units`}
            </span>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs h-9 rounded-xl border-slate-200 text-slate-600 hover:border-green-400 hover:text-green-600 transition-all duration-200"
            asChild
          >
            <Link href={`/products/${listing.id}`}>
              <span className="hidden sm:inline">Details</span>
              <span className="sm:hidden">View</span>
            </Link>
          </Button>
          {isBuyer ? (
            <Button
              size="sm"
              className="flex-1 h-9 rounded-xl bg-green-600 hover:bg-green-700 text-xs transition-all duration-200 active:scale-95 disabled:opacity-50"
              onClick={handleAddToCart}
              disabled={!lowestPrice || isOutOfStock}
            >
              <ShoppingCart className="w-3.5 h-3.5 sm:mr-1.5 shrink-0" />
              <span className="hidden sm:inline">{isOutOfStock ? "Sold Out" : "Add to Cart"}</span>
              <span className="sm:hidden">{isOutOfStock ? "Sold Out" : "Add"}</span>
            </Button>
          ) : (
            <Link href="/signup?role=BUYER" className="flex-1">
              <div className="h-9 rounded-xl bg-green-50 border border-green-200 text-xs text-green-700 font-medium flex items-center justify-center hover:bg-green-100 transition-colors cursor-pointer w-full">
                <span className="hidden sm:inline">Sign up to buy</span>
                <span className="sm:hidden">Sign up</span>
              </div>
            </Link>
          )}
        </div>
      </div>
    </div>
  );
}
