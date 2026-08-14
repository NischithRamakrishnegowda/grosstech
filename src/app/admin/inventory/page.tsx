import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import AdminInventoryClient from "./AdminInventoryClient";

export default async function AdminInventoryPage() {
  const listings = await prisma.listing.findMany({
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: { select: { id: true, name: true, businessName: true } },
    },
    orderBy: [{ source: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Button className="bg-green-600 hover:bg-green-700 w-full sm:w-auto" asChild>
          <Link href="/admin/inventory/new">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Link>
        </Button>
      </div>
      <AdminInventoryClient listings={JSON.parse(JSON.stringify(listings))} />
    </div>
  );
}
