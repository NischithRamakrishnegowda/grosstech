import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SellerListingsTable from "@/components/seller/SellerListingsTable";

export default async function SellerListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const listings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Button className="bg-green-600 hover:bg-green-700" asChild>
          <Link href="/seller/listings/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <SellerListingsTable listings={listings} />
    </div>
  );
}
