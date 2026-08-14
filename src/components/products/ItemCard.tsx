import Link from "next/link";
import Image from "next/image";
import { Users, Package } from "lucide-react";

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
  mode?: string;
}

export default function ItemCard({ item, mode }: ItemCardProps) {
  const href = `/products/items/${item.slug}${mode === "RETAIL" ? "?mode=RETAIL" : ""}`;
  const isBulk = mode !== "RETAIL";

  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden transition-all duration-200 hover:shadow-md hover:border-gray-200 hover:-translate-y-0.5">

        {/* Image */}
        <div className="aspect-square bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center gap-2 text-gray-200">
              <Package className="w-10 h-10" />
            </div>
          )}

          {/* Category badge */}
          <span className="absolute top-2 left-2 text-[10px] font-semibold bg-white/90 backdrop-blur-sm text-gray-600 px-2 py-0.5 rounded-full shadow-sm border border-gray-100">
            {item.category.name}
          </span>

          {/* Mode badge */}
          <span className={`absolute top-2 right-2 text-[10px] font-bold px-2 py-0.5 rounded-full ${
            isBulk
              ? "bg-blue-600/90 backdrop-blur-sm text-white"
              : "bg-green-600/90 backdrop-blur-sm text-white"
          }`}>
            {isBulk ? "Bulk" : "Retail"}
          </span>
        </div>

        {/* Info */}
        <div className="p-3">
          <h3 className="font-bold text-gray-900 text-sm leading-snug group-hover:text-green-700 transition-colors line-clamp-2 min-h-[2.5rem]">
            {item.name}
          </h3>

          <div className="flex items-center justify-between mt-2 gap-1">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Users className="w-3 h-3 shrink-0" />
              <span>{item.sellerCount} seller{item.sellerCount !== 1 ? "s" : ""}</span>
            </div>

            {item.lowestPrice !== null ? (
              <div className="flex items-baseline gap-0.5 shrink-0">
                <span className="text-[10px] text-gray-400">from</span>
                <span className="text-sm font-black text-green-600">₹{item.lowestPrice}</span>
              </div>
            ) : (
              <span className="text-xs text-gray-400">—</span>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
