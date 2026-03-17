import Link from "next/link";

const CATEGORY_EMOJIS: Record<string, string> = {
  rice: "🌾",
  sugar: "🍚",
  oil: "🫙",
  pulses: "🫘",
  spices: "🌶️",
};

const CATEGORY_COLORS: Record<string, string> = {
  rice: "from-amber-50 to-amber-100 border-amber-200 hover:border-amber-400",
  sugar: "from-blue-50 to-blue-100 border-blue-200 hover:border-blue-400",
  oil: "from-yellow-50 to-yellow-100 border-yellow-200 hover:border-yellow-400",
  pulses: "from-orange-50 to-orange-100 border-orange-200 hover:border-orange-400",
  spices: "from-red-50 to-red-100 border-red-200 hover:border-red-400",
};

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { listings: number };
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-10">
          <h2 className="text-3xl font-bold text-gray-900">Shop by Category</h2>
          <p className="text-gray-500 mt-2">Find daily essentials across all categories</p>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          {categories.map((cat) => (
            <Link
              key={cat.id}
              href={`/products?category=${cat.slug}`}
              className={`bg-gradient-to-br ${CATEGORY_COLORS[cat.slug] || "from-gray-50 to-gray-100 border-gray-200 hover:border-gray-400"} border-2 rounded-2xl p-5 text-center transition-all hover:shadow-md hover:-translate-y-0.5`}
            >
              <div className="text-4xl mb-2">{CATEGORY_EMOJIS[cat.slug] || "📦"}</div>
              <div className="font-semibold text-gray-800">{cat.name}</div>
              <div className="text-xs text-gray-500 mt-1">{cat._count.listings} products</div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}
