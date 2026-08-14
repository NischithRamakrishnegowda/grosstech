import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ItemCard from "@/components/products/ItemCard";

interface Item {
  id: string;
  name: string;
  slug: string;
  imageUrl: string | null;
  category: { id: string; name: string; slug: string };
  sellerCount: number;
  lowestPrice: number | null;
}

export default function FeaturedProducts({ items }: { items: Item[] }) {
  if (!items.length) return null;

  return (
    <section className="py-14 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Featured</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Top Products</h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
