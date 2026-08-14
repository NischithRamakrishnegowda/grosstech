import Link from "next/link";
import Image from "next/image";
import { Wheat, Bean, Droplets, Candy, Flame, Tag } from "lucide-react";

const TILE_STYLE: Record<string, { bg: string; border: string; icon: React.ElementType; iconColor: string }> = {
  grains:  { bg: "bg-amber-50",  border: "border-amber-100",  icon: Wheat,    iconColor: "text-amber-600"  },
  pulses:  { bg: "bg-orange-50", border: "border-orange-100", icon: Bean,     iconColor: "text-orange-600" },
  oil:     { bg: "bg-yellow-50", border: "border-yellow-100", icon: Droplets, iconColor: "text-yellow-600" },
  sugar:   { bg: "bg-sky-50",    border: "border-sky-100",    icon: Candy,    iconColor: "text-sky-600"    },
  spices:  { bg: "bg-red-50",    border: "border-red-100",    icon: Flame,    iconColor: "text-red-600"    },
  default: { bg: "bg-primary-50",border: "border-primary-100",icon: Tag,      iconColor: "text-primary-600"},
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
    <section className="py-10 bg-white border-t border-gray-100">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">

        <div className="flex items-center justify-between mb-5">
          <h2 className="text-lg font-black text-gray-900">Shop by Category</h2>
          <Link href="/products" className="text-xs font-bold text-primary-600 hover:text-primary-700 transition-colors">
            See all →
          </Link>
        </div>

        <div className="flex gap-3 overflow-x-auto pb-2 -mx-4 px-4 sm:mx-0 sm:px-0 sm:grid sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 scrollbar-hide">
          {categories.map((cat) => {
            const style = TILE_STYLE[cat.slug] ?? TILE_STYLE.default;
            const Icon = style.icon;

            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className={`shrink-0 w-28 sm:w-auto flex flex-col items-center gap-2.5 p-4 rounded-2xl border ${style.bg} ${style.border} hover:shadow-md transition-all duration-200 group`}
              >
                <div className="w-14 h-14 rounded-xl overflow-hidden relative flex items-center justify-center bg-white shadow-sm">
                  {cat.imageUrl ? (
                    <Image src={cat.imageUrl} alt={cat.name} fill className="object-cover" sizes="56px" />
                  ) : (
                    <Icon className={`w-7 h-7 ${style.iconColor}`} strokeWidth={1.5} />
                  )}
                </div>
                <div className="text-center">
                  <p className="text-xs font-bold text-gray-800 group-hover:text-primary-700 transition-colors">{cat.name}</p>
                  <p className="text-[10px] text-gray-400 mt-0.5">{cat._count.items} items</p>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
