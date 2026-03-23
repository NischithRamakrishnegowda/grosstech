import { notFound } from "next/navigation";
import Header from "@/components/layout/Header";
import Footer from "@/components/layout/Footer";
import ProductDetailClient from "@/components/products/ProductDetailClient";
import { prisma } from "@/lib/prisma";

export default async function ProductDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const listing = await prisma.listing.findUnique({
    where: { id, isActive: true, status: "APPROVED" },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: {
        select: { id: true, name: true, businessName: true },
      },
    },
  });

  if (!listing) notFound();

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 bg-gray-50">
        <ProductDetailClient listing={listing} />
      </main>
      <Footer />
    </div>
  );
}
