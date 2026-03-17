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
  return prisma.category.findMany({ orderBy: { name: "asc" } });
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

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {category ? categories.find((c) => c.slug === category)?.name || "Products" : "All Products"}
              </h1>
              <p className="text-gray-500 text-sm mt-1">{listings.length} products available</p>
            </div>

            {/* Category filter */}
            <div className="flex flex-wrap gap-2">
              <a
                href="/products"
                className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                  !category
                    ? "bg-green-600 text-white"
                    : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"
                }`}
              >
                All
              </a>
              {categories.map((cat) => (
                <a
                  key={cat.id}
                  href={`/products?category=${cat.slug}`}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium transition-colors ${
                    category === cat.slug
                      ? "bg-green-600 text-white"
                      : "bg-white border border-gray-200 text-gray-600 hover:border-green-400"
                  }`}
                >
                  {cat.name}
                </a>
              ))}
            </div>
          </div>

          {listings.length === 0 ? (
            <div className="text-center py-20 text-gray-400">
              <p className="text-lg">No products found in this category.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {listings.map((listing) => (
                <ProductCard key={listing.id} listing={listing} />
              ))}
            </div>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
}
