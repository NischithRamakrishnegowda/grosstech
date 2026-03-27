import { Suspense } from "react";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ItemCard from "@/components/products/ItemCard";
import ProductFilters from "@/components/products/ProductFilters";
import { prisma } from "@/lib/prisma";
import { Search } from "lucide-react";

export const revalidate = 30;

interface SearchParams {
  category?: string;
  search?: string;
  mode?: string;
  minPrice?: string;
  maxPrice?: string;
}

async function getItems(params: SearchParams) {
  const { category, search, mode, minPrice, maxPrice } = params;
  const priceMode = mode === "BULK" ? "BULK" : "RETAIL";

  // Build listing filter for price mode and price range
  const priceOptionFilter: Record<string, unknown> = { mode: priceMode };
  if (minPrice) priceOptionFilter.price = { ...(priceOptionFilter.price as object || {}), gte: parseFloat(minPrice) };
  if (maxPrice) priceOptionFilter.price = { ...(priceOptionFilter.price as object || {}), lte: parseFloat(maxPrice) };

  const items = await prisma.item.findMany({
    where: {
      ...(category ? { category: { slug: category } } : {}),
      ...(search
        ? {
            OR: [
              { name: { contains: search, mode: "insensitive" } },
              { category: { name: { contains: search, mode: "insensitive" } } },
            ],
          }
        : {}),
      // Only show items that have at least one approved listing with matching price options
      listings: {
        some: {
          isActive: true,
          status: "APPROVED",
          priceOptions: { some: priceOptionFilter },
        },
      },
    },
    include: {
      category: true,
      _count: {
        select: {
          listings: {
            where: {
              isActive: true,
              status: "APPROVED",
              priceOptions: { some: priceOptionFilter },
            },
          },
        },
      },
      listings: {
        where: {
          isActive: true,
          status: "APPROVED",
          priceOptions: { some: priceOptionFilter },
        },
        include: {
          priceOptions: {
            where: priceOptionFilter,
            orderBy: { price: "asc" },
            take: 1,
          },
        },
        take: 1,
      },
    },
    orderBy: { name: "asc" },
  });

  return items.map((item) => ({
    id: item.id,
    name: item.name,
    slug: item.slug,
    imageUrl: item.imageUrl,
    category: item.category,
    sellerCount: item._count.listings,
    lowestPrice: item.listings[0]?.priceOptions[0]?.price ?? null,
  }));
}

async function getCategories() {
  const categories = await prisma.category.findMany({
    orderBy: { name: "asc" },
    include: {
      _count: {
        select: { items: true },
      },
    },
  });
  return categories.map((c) => ({
    id: c.id,
    name: c.name,
    slug: c.slug,
    itemCount: c._count.items,
  }));
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const params = await searchParams;
  const [items, categories] = await Promise.all([
    getItems(params),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === params.category);
  const mode = params.mode === "BULK" ? "Bulk" : "Retail";

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
                  ? "No bulk listings available. Try switching to retail mode."
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
                  <ItemCard item={item} />
                </div>
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
