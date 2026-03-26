"use client";

import Link from "next/link";
import { Package2 } from "lucide-react";
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

const CATEGORY_IMAGES: Record<string, string> = {
  grains: "/categories/rice.jpg",
  sugar:  "/categories/sugar.jpg",
  oil:    "/categories/oil.jpg",
  pulses: "/categories/pulses.jpg",
  spices: "/categories/spices.jpg",
};

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
  const [imgLoaded, setImgLoaded] = useState(false);
  const [imgError, setImgError] = useState(false);

  const lowestPrice = listing.priceOptions[0];
  const totalStock = listing.priceOptions.reduce((s, o) => s + o.stock, 0);
  const emoji = CATEGORY_EMOJIS[listing.category.slug] || "📦";
  const isOutOfStock = totalStock === 0;
  const isLowStock = totalStock > 0 && totalStock <= 50;

  const imageSrc = listing.imageUrl || getImageSrc(listing.category.slug, listing.name);

  return (
    <Link href={`/products/${listing.id}`} className="block group">
      <div className={`rounded-2xl overflow-hidden border border-slate-100 hover:border-green-200 hover:shadow-lg transition-all duration-300 bg-white hover:-translate-y-0.5 ${isOutOfStock ? "opacity-60" : ""}`}>
        {/* Image */}
        <div className="relative aspect-[4/3] overflow-hidden bg-slate-50">
          {imageSrc && !imgLoaded && !imgError && (
            <div className="absolute inset-0 bg-gradient-to-r from-slate-100 via-slate-50 to-slate-100 animate-shimmer" />
          )}
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
          {(!imageSrc || imgError) && (
            <div className="absolute inset-0 flex items-center justify-center">
              <span className="text-7xl group-hover:scale-110 transition-transform duration-300 inline-block select-none">
                {emoji}
              </span>
            </div>
          )}

          <span className={`absolute top-3 left-3 z-20 text-[11px] font-semibold px-2.5 py-1 rounded-full bg-white/80 backdrop-blur-sm ${CATEGORY_PILL[listing.category.slug] || "bg-slate-50 text-slate-600"}`}>
            {listing.category.name}
          </span>

          {isLowStock && (
            <span className="absolute top-3 right-3 z-20 bg-orange-500 text-white text-[10px] font-bold px-2.5 py-1 rounded-full">
              Only {totalStock} left
            </span>
          )}

          {isOutOfStock && (
            <div className="absolute inset-0 z-20 bg-white/60 flex items-center justify-center">
              <span className="bg-white text-slate-500 text-xs font-semibold px-4 py-1.5 rounded-full border border-slate-200">
                Out of Stock
              </span>
            </div>
          )}
        </div>

        {/* Content */}
        <div className="p-3 sm:p-4">
          <h3 className="font-semibold text-slate-900 text-sm sm:text-[15px] leading-snug group-hover:text-green-700 transition-colors line-clamp-1">
            {listing.name}
          </h3>

          <div className="flex items-center justify-between mt-1.5">
            <p className="text-xs text-slate-400 truncate">
              {listing.brand ? listing.brand + " · " : ""}
              {listing.source === "ADMIN" ? "Gross Tech" : "Verified Seller"}
            </p>
            {lowestPrice && !isOutOfStock && (
              <div className="flex items-center gap-0.5 shrink-0">
                <span className="font-bold text-sm text-green-600">₹{lowestPrice.price}</span>
                <span className="text-[11px] text-slate-400">/{lowestPrice.weight}</span>
              </div>
            )}
          </div>

          <div className="flex items-center mt-1">
            <span className={`inline-flex items-center gap-1 text-[10px] font-medium ${isOutOfStock ? "text-red-400" : isLowStock ? "text-orange-500" : "text-slate-400"}`}>
              <Package2 className="w-3 h-3" />
              {isOutOfStock ? "Out of stock" : `${totalStock} units`}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}
