import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export default async function AdminInventoryPage() {
  const listings = await prisma.listing.findMany({
    include: {
      category: true,
      priceOptions: { orderBy: { price: "asc" } },
      seller: { select: { name: true, businessName: true } },
    },
    orderBy: [{ source: "asc" }, { createdAt: "desc" }],
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Inventory</h1>
        <Button className="bg-green-600 hover:bg-green-700" asChild>
          <Link href="/admin/inventory/new">
            <Plus className="w-4 h-4 mr-2" /> Add Product
          </Link>
        </Button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Source</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Prices & Stock</th>
                <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                <th className="px-4 py-3 text-right font-medium text-gray-600">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50">
              {listings.map((listing) => (
                <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                  <td className="px-4 py-3">
                    <p className="font-medium text-gray-900">{listing.name}</p>
                    <p className="text-xs text-gray-400">{listing.brand}</p>
                  </td>
                  <td className="px-4 py-3 text-gray-500">{listing.category.name}</td>
                  <td className="px-4 py-3">
                    <Badge className={listing.source === "ADMIN" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"}>
                      {listing.source === "ADMIN" ? "Gross Tech" : listing.seller.businessName || listing.seller.name}
                    </Badge>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-1">
                      {listing.priceOptions.slice(0, 3).map((opt) => (
                        <span
                          key={opt.id}
                          className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${
                            opt.stock === 0
                              ? "bg-red-50 text-red-600"
                              : opt.stock <= 50
                              ? "bg-orange-50 text-orange-600"
                              : "bg-gray-100 text-gray-600"
                          }`}
                        >
                          {opt.weight}: ₹{opt.price}
                          <span className="font-semibold">({opt.stock})</span>
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`text-xs px-2 py-1 rounded-full ${listing.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {listing.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Link href={`/admin/inventory/${listing.id}/edit`} className="text-xs text-green-600 hover:underline">
                      Edit
                    </Link>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
