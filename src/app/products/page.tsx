import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductCard from "@/components/products/ProductCard";
import { prisma } from "@/lib/prisma";

export const revalidate = 30;

async function getListings(category?: string) {
  return prisma.listing.findMany({
    where: {
      isActive: true,
      ...(category ? { category: { slug: category } } : {}),
    },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" }, take: 1 },
      seller: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: { createdAt: "desc" },
  });
}

async function getCategories() {
  return prisma.category.findMany({
    orderBy: { name: "asc" },
    include: { _count: { select: { listings: { where: { isActive: true } } } } },
  });
}

export default async function ProductsPage({
  searchParams,
}: {
  searchParams: Promise<{ category?: string }>;
}) {
  const { category } = await searchParams;
  const [listings, categories] = await Promise.all([
    getListings(category),
    getCategories(),
  ]);

  const activeCategory = categories.find((c) => c.slug === category);

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      <Header />

      {/* Page header */}
      <div className="bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-6">
            <div>
              <h1 className="text-xl sm:text-2xl font-extrabold text-gray-900">
                {activeCategory ? activeCategory.name : "All Products"}
              </h1>
              <p className="text-gray-500 mt-1">
                <span className="font-semibold text-green-600">{listings.length}</span> products available
              </p>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <a
                href="/products"
                className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                  !category
                    ? "bg-green-600 text-white shadow-sm shadow-green-200"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
                }`}
              >
                All
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-sm font-semibold transition-all duration-200 ${
                    category === cat.slug
                      ? "bg-green-600 text-white shadow-sm shadow-green-200"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-green-400 hover:text-green-600"
                  }`}
                >
                  {cat.name}
                  <span className={`text-xs px-1.5 py-0.5 rounded-full ${category === cat.slug ? "bg-white/20" : "bg-gray-100 text-gray-500"}`}>
                    {cat._count.listings}
                  </span>
                </a>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {listings.length === 0 ? (
            <div className="text-center py-24 animate-fade-up">
              <div className="text-6xl mb-4">🔍</div>
              <h2 className="text-xl font-bold text-gray-700">No products found</h2>
              <p className="text-gray-400 mt-2">Try a different category or check back later.</p>
              <a href="/products" className="mt-6 inline-block bg-green-600 text-white font-semibold px-6 py-3 rounded-xl hover:bg-green-700 transition-colors">
                View all products
              </a>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-4">
              {listings.map((listing, i) => (
                <div key={listing.id} className="animate-fade-up" style={{ animationDelay: `${i * 50}ms` }}>
                  <ProductCard listing={listing} />
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
