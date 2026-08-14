import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ItemDetailClient from "@/components/products/ItemDetailClient";
import { getCachedItemDetail, getAllItemSlugs } from "@/lib/cache";

// Pre-render all known item pages at build time
export async function generateStaticParams() {
  const slugs = await getAllItemSlugs();
  return slugs.map(({ slug }) => ({ slug }));
}

export const revalidate = 60;

export default async function ItemDetailPage({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ mode?: string }>;
}) {
  const { slug } = await params;
  const { mode } = await searchParams;

  const data = await getCachedItemDetail(slug);
  if (!data) notFound();

  // Auto-detect: if URL specifies a mode use it, otherwise default to whichever
  // mode actually has listings — avoids landing on "not available" screen
  const hasBulk   = data.listings.some((l) => l.priceOptions.some((o) => o.mode === "BULK"));
  const hasRetail  = data.listings.some((l) => l.priceOptions.some((o) => o.mode === "RETAIL"));
  const initialMode: "RETAIL" | "BULK" =
    mode === "RETAIL" ? "RETAIL"
    : mode === "BULK"  ? "BULK"
    : hasBulk          ? "BULK"
    : hasRetail        ? "RETAIL"
    : "BULK";

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <ItemDetailClient
          item={data.item}
          listings={data.listings}
          initialMode={initialMode}
        />
      </main>
      <Footer />
    </div>
  );
}
