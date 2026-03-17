"use client";

import Link from "next/link";
import { ShoppingCart, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useCart } from "@/context/CartContext";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

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
  rice: "🌾",
  sugar: "🍚",
  oil: "🫙",
  pulses: "🫘",
  spices: "🌶️",
};

export default function ProductCard({ listing }: { listing: Listing }) {
  const { addItem } = useCart();
  const { data: session } = useSession();
  const router = useRouter();

  const lowestPrice = listing.priceOptions[0];
  const emoji = CATEGORY_EMOJIS[listing.category.slug] || "📦";

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
      imageUrl: listing.imageUrl || undefined,
      quantity: 1,
    });
    toast.success(`${listing.name} (${lowestPrice.weight}) added to cart`);
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-md transition-all hover:-translate-y-0.5 overflow-hidden group">
      {/* Image / Emoji */}
      <Link href={`/products/${listing.id}`}>
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center text-6xl group-hover:scale-105 transition-transform">
          {listing.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
          ) : (
            emoji
          )}
        </div>
      </Link>

      <div className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <Link href={`/products/${listing.id}`} className="block">
              <h3 className="font-semibold text-gray-900 truncate hover:text-green-700 transition-colors">
                {listing.name}
              </h3>
              {listing.brand && (
                <p className="text-xs text-gray-400 mt-0.5">{listing.brand}</p>
              )}
            </Link>
          </div>
          <Badge variant="secondary" className="text-xs shrink-0">
            {listing.category.name}
          </Badge>
        </div>

        {lowestPrice && (
          <div className="flex items-center gap-1 mt-2">
            <Tag className="w-3.5 h-3.5 text-green-500" />
            <span className="text-green-600 font-bold">₹{lowestPrice.price}</span>
            <span className="text-xs text-gray-400">/ {lowestPrice.weight}</span>
          </div>
        )}

        <p className="text-xs text-gray-400 mt-1">
          {listing.source === "ADMIN" ? "Gross Tech" : (listing.seller.businessName || listing.seller.name)}
        </p>

        <div className="flex gap-2 mt-3">
          <Button
            size="sm"
            variant="outline"
            className="flex-1 text-xs"
            asChild
          >
            <Link href={`/products/${listing.id}`}>Details</Link>
          </Button>
          <Button
            size="sm"
            className="flex-1 bg-green-600 hover:bg-green-700 text-xs"
            onClick={handleAddToCart}
            disabled={!lowestPrice || lowestPrice.stock === 0}
          >
            <ShoppingCart className="w-3.5 h-3.5 mr-1" />
            {lowestPrice?.stock === 0 ? "Out of Stock" : "Add to Cart"}
          </Button>
        </div>
      </div>
    </div>
  );
}
