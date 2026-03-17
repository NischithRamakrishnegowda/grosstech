import Link from "next/link";
import { ArrowRight } from "lucide-react";
import ProductCard from "@/components/products/ProductCard";

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

export default function FeaturedProducts({ listings }: { listings: Listing[] }) {
  if (listings.length === 0) return null;

  return (
    <section className="py-16">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Featured Products</h2>
            <p className="text-gray-500 mt-1">Best deals from our trusted sellers</p>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-green-600 font-medium hover:text-green-700 text-sm"
          >
            View all <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {listings.map((listing) => (
            <ProductCard key={listing.id} listing={listing} />
          ))}
        </div>
      </div>
    </section>
  );
}
