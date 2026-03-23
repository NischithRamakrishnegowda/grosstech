import Link from "next/link";
import { Users, Tag } from "lucide-react";
import { Badge } from "@/components/ui/badge";

const CATEGORY_EMOJIS: Record<string, string> = {
  grains: "🌾", sugar: "🍚", oil: "🫙", pulses: "🫘", spices: "🌶️",
};

interface ItemCardProps {
  item: {
    id: string;
    name: string;
    slug: string;
    imageUrl: string | null;
    category: { id: string; name: string; slug: string };
    sellerCount: number;
    lowestPrice: number | null;
  };
}

export default function ItemCard({ item }: ItemCardProps) {
  const emoji = CATEGORY_EMOJIS[item.category.slug] || "📦";

  return (
    <Link href={`/products/items/${item.slug}`} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300 hover:-translate-y-0.5">
        {/* Image / Emoji */}
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center relative overflow-hidden">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
          ) : (
            <span className="text-5xl select-none group-hover:scale-110 transition-transform duration-300">{emoji}</span>
          )}
          <Badge
            className="absolute top-2 left-2 text-xs"
            variant="secondary"
          >
            {item.category.name}
          </Badge>
        </div>

        {/* Info */}
        <div className="p-4">
          <h3 className="font-bold text-gray-900 text-lg group-hover:text-green-700 transition-colors">
            {item.name}
          </h3>

          <div className="flex items-center justify-between mt-2">
            <div className="flex items-center gap-1.5 text-sm text-gray-500">
              <Users className="w-3.5 h-3.5" />
              <span>{item.sellerCount} seller{item.sellerCount !== 1 ? "s" : ""}</span>
            </div>
            {item.lowestPrice !== null && (
              <div className="flex items-center gap-1 text-sm">
                <Tag className="w-3.5 h-3.5 text-green-600" />
                <span className="font-semibold text-green-600">From ₹{item.lowestPrice}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
