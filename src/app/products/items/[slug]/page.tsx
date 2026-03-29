import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ItemDetailClient from "@/components/products/ItemDetailClient";
import { prisma } from "@/lib/prisma";

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

  const item = await prisma.item.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!item) notFound();

  const listings = await prisma.listing.findMany({
    where: {
      itemId: item.id,
      isActive: true,
      status: "APPROVED",
    },
    include: {
      priceOptions: { orderBy: { price: "asc" } },
      seller: {
        select: { id: true, name: true, businessName: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <ItemDetailClient
          item={JSON.parse(JSON.stringify(item))}
          listings={JSON.parse(JSON.stringify(listings))}
          initialMode={initialMode}
        />
      </main>
      <Footer />
    </div>
  );
}
