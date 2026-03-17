"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PriceOption {
  id: string;
  weight: string;
  price: number;
  stock: number;
}

interface Listing {
  id: string;
  name: string;
  brand: string | null;
  isActive: boolean;
  category: { name: string };
  priceOptions: PriceOption[];
}

export default function SellerListingsTable({ listings }: { listings: Listing[] }) {
  const router = useRouter();

  async function handleDelete(id: string, name: string) {
    if (!confirm(`Deactivate "${name}"?`)) return;
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    if (res.ok) {
      toast.success("Listing deactivated");
      router.refresh();
    } else {
      toast.error("Failed to deactivate");
    }
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
        No listings yet. Add your first product!
      </div>
    );
  }

  return (
    <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead className="bg-gray-50 border-b">
            <tr>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Product</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Category</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Prices & Stock</th>
              <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
              <th className="px-4 py-3 text-right font-medium text-gray-600">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-50">
            {listings.map((listing) => (
              <tr key={listing.id} className="hover:bg-gray-50/50 transition-colors">
                <td className="px-4 py-3">
                  <p className="font-medium text-gray-900">{listing.name}</p>
                  {listing.brand && <p className="text-xs text-gray-400">{listing.brand}</p>}
                </td>
                <td className="px-4 py-3 text-gray-500">{listing.category.name}</td>
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
                            : "bg-green-50 text-green-700"
                        }`}
                      >
                        {opt.weight}: ₹{opt.price}
                        <span className="font-semibold">({opt.stock})</span>
                      </span>
                    ))}
                    {listing.priceOptions.length > 3 && (
                      <span className="text-xs text-gray-400">+{listing.priceOptions.length - 3} more</span>
                    )}
                  </div>
                </td>
                <td className="px-4 py-3">
                  <Badge className={listing.isActive ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-gray-100 text-gray-500 hover:bg-gray-100"}>
                    {listing.isActive ? "Active" : "Inactive"}
                  </Badge>
                </td>
                <td className="px-4 py-3">
                  <div className="flex justify-end gap-2">
                    <Link href={`/products/${listing.id}`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                      <Eye className="w-4 h-4" />
                    </Link>
                    <Link href={`/seller/listings/${listing.id}/edit`} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </Link>
                    <button
                      onClick={() => handleDelete(listing.id, listing.name)}
                      className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
