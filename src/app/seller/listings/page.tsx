import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import SellerListingsTable from "@/components/seller/SellerListingsTable";

export default async function SellerListingsPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

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
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Listings</h1>
        <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" asChild>
          <Link href="/seller/listings/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Product
          </Link>
        </Button>
      </div>

      <SellerListingsTable listings={JSON.parse(JSON.stringify(listings))} />
    </div>
  );
}
