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
  const initialMode: "RETAIL" | "BULK" = mode === "RETAIL" ? "RETAIL" : "BULK";

  const data = await getCachedItemDetail(slug);
  if (!data) notFound();

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
