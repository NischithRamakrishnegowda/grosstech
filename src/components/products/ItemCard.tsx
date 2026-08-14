import Link from "next/link";
import Image from "next/image";
import { Users, ChevronRight, Package } from "lucide-react";

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

  return (
    <Link href={href} className="block group">
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-primary-100 transition-all duration-200">

        {/* Image */}
        <div className="aspect-square relative bg-gray-50 overflow-hidden">
          {item.imageUrl ? (
            <Image
              src={item.imageUrl}
              alt={item.name}
              fill
              className="object-cover group-hover:scale-105 transition-transform duration-300"
              sizes="(max-width: 640px) 50vw, (max-width: 1280px) 33vw, 25vw"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center">
              <Package className="w-12 h-12 text-gray-200" />
            </div>
          )}
        </div>

        {/* Info */}
        <div className="p-3">
          <p className="text-[10px] font-semibold text-gray-400 uppercase tracking-wide mb-1">
            {item.category.name}
          </p>
          <h3 className="font-bold text-gray-900 text-sm leading-snug line-clamp-2 min-h-[2.5rem] group-hover:text-primary-700 transition-colors">
            {item.name}
          </h3>

          <div className="flex items-end justify-between mt-2.5">
            <div>
              {item.lowestPrice !== null ? (
                <>
                  <p className="text-[10px] text-gray-400 leading-none mb-0.5">from</p>
                  <p className="text-base font-black text-gray-900 leading-none">₹{item.lowestPrice}</p>
                </>
              ) : (
                <p className="text-xs text-gray-400">No listing</p>
              )}
            </div>

            <div className="flex flex-col items-end gap-1.5">
              <div className="flex items-center gap-1 text-[10px] text-gray-400">
                <Users className="w-3 h-3" />
                <span>{item.sellerCount} seller{item.sellerCount !== 1 ? "s" : ""}</span>
              </div>
              <div className="w-7 h-7 rounded-lg bg-primary-600 group-hover:bg-primary-700 transition-colors flex items-center justify-center">
                <ChevronRight className="w-4 h-4 text-white" />
              </div>
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
