import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ItemCard from "@/components/products/ItemCard";
import ProductFilters from "@/components/products/ProductFilters";
import { ProductGridWrapper } from "@/components/products/ProductGridWrapper";
import { getCachedProductItems, getCachedProductCategories } from "@/lib/cache";
import { Search } from "lucide-react";

interface SearchParams {
  category?: string;
  search?: string;
  mode?: string;
  minPrice?: string;
  maxPrice?: string;
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const priceMode = params.mode === "RETAIL" ? "RETAIL" : "BULK";
  const [items, rawCategories] = await Promise.all([
    getCachedProductItems(params),
    getCachedProductCategories(priceMode),
  ]);
  const categories = rawCategories.map((c) => ({ ...c, itemCount: c._count.items }));

  const activeCategory = categories.find((c) => c.slug === params.category);
  const mode = params.mode === "RETAIL" ? "Retail" : "Bulk";

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
          <div className="mb-4">
            <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
              {activeCategory ? activeCategory.name : "All Products"}
              {params.search && <span className="text-gray-400 font-normal"> matching &ldquo;{params.search}&rdquo;</span>}
            </h1>
            <p className="text-gray-500 mt-1">
              <span className="font-semibold text-green-600">{items.length}</span> {mode.toLowerCase()} item{items.length !== 1 ? "s" : ""} available
            </p>
          </div>

          <Suspense fallback={<div className="h-[130px] animate-pulse bg-gray-50 rounded-2xl" />}>
            <ProductFilters categories={categories} />
          </Suspense>
        </div>
      </div>

      <ProductGridWrapper>
      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {items.length === 0 ? (
            <div className="text-center py-24 animate-fade-up">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Search className="w-8 h-8 text-gray-300" />
              </div>
              <h2 className="text-xl font-bold text-gray-700">No items found</h2>
              <p className="text-gray-400 mt-2">
                {params.mode === "BULK"
                  ? "No retail listings available. Try switching to bulk mode."
                  : "Try a different category or search term."}
              </p>
              <a href="/products" className="mt-6 inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors">
                View all items
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {items.map((item, i) => (
                <div key={item.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <ItemCard item={item} mode={priceMode} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      </ProductGridWrapper>
      <Footer />
    </div>
  );
}
