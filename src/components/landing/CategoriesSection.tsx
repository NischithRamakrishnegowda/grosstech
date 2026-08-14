import Link from "next/link";
import Image from "next/image";
import { ArrowRight } from "lucide-react";

const CATEGORY_COLORS: Record<string, { from: string; to: string; text: string }> = {
  grains:  { from: "#78350f", to: "#92400e", text: "#fef3c7" },
  sugar:   { from: "#1e3a5f", to: "#1e40af", text: "#dbeafe" },
  oil:     { from: "#713f12", to: "#a16207", text: "#fef9c3" },
  pulses:  { from: "#7c2d12", to: "#c2410c", text: "#ffedd5" },
  spices:  { from: "#6b1c1c", to: "#b91c1c", text: "#fee2e2" },
  default: { from: "#1a2e1a", to: "#14532d", text: "#dcfce7" },
};

interface Category {
  id: string;
  name: string;
  slug: string;
  imageUrl?: string | null;
  _count: { items: number };
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  if (!categories.length) return null;

  return (
    <section className="py-14 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header */}
        <div className="flex items-end justify-between mb-8">
          <div>
            <p className="text-xs font-bold text-green-600 uppercase tracking-widest mb-1">Categories</p>
            <h2 className="text-2xl sm:text-3xl font-black text-gray-900">Shop by Category</h2>
          </div>
          <Link
            href="/products"
            className="hidden sm:flex items-center gap-1 text-sm font-semibold text-gray-500 hover:text-green-600 transition-colors"
          >
            All products <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>

        {/* Category grid */}
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {categories.map((cat, i) => {
            const colors = CATEGORY_COLORS[cat.slug] ?? CATEGORY_COLORS.default;

            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group relative rounded-2xl overflow-hidden aspect-[4/3] block"
                style={{
                  background: `linear-gradient(135deg, ${colors.from} 0%, ${colors.to} 100%)`,
                }}
              >
                {/* Category image if available */}
                {cat.imageUrl && (
                  <Image
                    src={cat.imageUrl}
                    alt={cat.name}
                    fill
                    className="object-cover opacity-30 group-hover:opacity-40 transition-opacity"
                    sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 20vw"
                  />
                )}

                {/* Gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent" />

                {/* Content */}
                <div className="absolute inset-0 flex flex-col justify-end p-3">
                  <span
                    className="text-sm font-bold leading-tight"
                    style={{ color: colors.text }}
                  >
                    {cat.name}
                  </span>
                  <span className="text-xs mt-0.5 opacity-70" style={{ color: colors.text }}>
                    {cat._count.items} items
                  </span>
                </div>

                {/* Hover arrow */}
                <div className="absolute top-2.5 right-2.5 w-6 h-6 rounded-full bg-white/10 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                  <ArrowRight className="w-3 h-3 text-white" />
                </div>
              </Link>
            );
          })}
        </div>

        {/* Mobile view all */}
        <div className="sm:hidden mt-4 text-center">
          <Link href="/products" className="text-sm font-semibold text-green-600 hover:underline">
            View all products →
          </Link>
        </div>
      </div>
    </section>
  );
}
