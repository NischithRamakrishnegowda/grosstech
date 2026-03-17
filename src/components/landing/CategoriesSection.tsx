import React from "react";
import Link from "next/link";
import { Wheat, Candy, Droplets, Bean, Flame } from "lucide-react";

const CATEGORY_CONFIG: Record<string, { icon: React.ElementType; accent: string; light: string }> = {
  grains: { icon: Wheat,    accent: "text-amber-600",  light: "bg-amber-50 group-hover:bg-amber-100" },
  sugar:  { icon: Candy,    accent: "text-sky-600",    light: "bg-sky-50 group-hover:bg-sky-100" },
  oil:    { icon: Droplets, accent: "text-yellow-600", light: "bg-yellow-50 group-hover:bg-yellow-100" },
  pulses: { icon: Bean,     accent: "text-orange-600", light: "bg-orange-50 group-hover:bg-orange-100" },
  spices: { icon: Flame,    accent: "text-red-600",    light: "bg-red-50 group-hover:bg-red-100" },
};

interface Category {
  id: string;
  name: string;
  slug: string;
  _count: { listings: number };
}

export default function CategoriesSection({ categories }: { categories: Category[] }) {
  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-10 animate-fade-up">
          <p className="text-sm font-semibold text-green-600 uppercase tracking-wide mb-1">Categories</p>
          <h2 className="text-3xl font-black text-slate-900">Shop by Category</h2>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-5 gap-3">
          {categories.map((cat, i) => {
            const cfg = CATEGORY_CONFIG[cat.slug] ?? { icon: Wheat, accent: "text-slate-600", light: "bg-slate-50 group-hover:bg-slate-100" };
            const Icon = cfg.icon;
            return (
              <Link
                key={cat.id}
                href={`/products?category=${cat.slug}`}
                className="group flex flex-col items-center justify-center gap-2.5 bg-white border border-slate-100 rounded-2xl py-5 px-3 hover:border-slate-200 hover:shadow-md transition-all duration-200 animate-scale-in"
                style={{ animationDelay: `${i * 60}ms` }}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center transition-colors duration-200 ${cfg.light}`}>
                  <Icon className={`w-5 h-5 ${cfg.accent}`} strokeWidth={1.75} />
                </div>
                <div className="text-center">
                  <div className="font-semibold text-slate-800 text-xs">{cat.name}</div>
                  <div className="text-slate-400 text-[10px] mt-0.5">{cat._count.listings} products</div>
                </div>
              </Link>
            );
          })}
        </div>
      </div>
    </section>
  );
}
