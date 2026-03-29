import Link from "next/link";
import { Users, Tag } from "lucide-react";

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
      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden hover:shadow-lg hover:border-green-200 transition-all duration-300 hover:-translate-y-0.5">
        {/* Image */}
        <div className="aspect-[4/3] bg-gradient-to-br from-gray-50 to-gray-100 relative overflow-hidden">
          {item.imageUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={item.imageUrl}
              alt={item.name}
              className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-300 text-sm">No image</div>
          )}
          <span className="absolute top-2 left-2 text-[10px] sm:text-xs font-semibold bg-white/90 backdrop-blur-sm text-gray-600 px-2 py-0.5 rounded-lg shadow-sm">
            {item.category.name}
          </span>
        </div>

        {/* Info */}
        <div className="p-3 sm:p-4">
          <h3 className="font-bold text-gray-900 text-sm sm:text-lg leading-tight group-hover:text-green-700 transition-colors line-clamp-1">
            {item.name}
          </h3>

          <div className="flex items-center justify-between mt-1.5 sm:mt-2 gap-1">
            <div className="flex items-center gap-1 text-xs sm:text-sm text-gray-500">
              <Users className="w-3 sm:w-3.5 h-3 sm:h-3.5 shrink-0" />
              <span>{item.sellerCount} seller{item.sellerCount !== 1 ? "s" : ""}</span>
            </div>
            {item.lowestPrice !== null && (
              <div className="flex items-center gap-0.5 sm:gap-1 text-xs sm:text-sm shrink-0">
                <Tag className="w-3 sm:w-3.5 h-3 sm:h-3.5 text-green-600" />
                <span className="font-semibold text-green-600">₹{item.lowestPrice}</span>
              </div>
            )}
          </div>
        </div>
      </div>
    </Link>
  );
}
