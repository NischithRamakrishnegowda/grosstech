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
    <section className="py-16 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-end justify-between mb-10 animate-fade-up">
          <div>
            <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-1">Featured</p>
            <h2 className="text-3xl font-black text-slate-900">Top Products</h2>
          </div>
          <Link
            href="/products"
            className="flex items-center gap-1 text-green-600 font-semibold hover:text-green-700 text-sm transition-colors"
          >
            View all <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {listings.map((listing, i) => (
            <div
              key={listing.id}
              className="animate-fade-up"
              style={{ animationDelay: `${i * 80}ms` }}
            >
              <ProductCard listing={listing} />
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
