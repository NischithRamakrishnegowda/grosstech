import Link from "next/link";
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
    <section className="py-10 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Featured Products</h2>
          <Link href="/products" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
            See all →
          </Link>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
          {items.map((item) => (
            <ItemCard key={item.id} item={item} />
          ))}
        </div>
      </div>
    </section>
  );
}
