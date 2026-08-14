"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Modal } from "@/components/ui/Modal";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface PriceOption { id: string; weight: string; price: number; stock: number; }
interface Listing {
  id: string;
  name: string;
  brand: string | null;
  source: string;
  isActive: boolean;
  status: string;
  category: { name: string };
  priceOptions: PriceOption[];
  seller: { id: string; name: string; businessName: string | null };
}

export default function AdminInventoryClient({ listings: initial }: { listings: Listing[] }) {
  const router = useRouter();
  const [listings, setListings] = useState(initial);
  const [removeTarget, setRemoveTarget] = useState<Listing | null>(null);
  const [reason, setReason] = useState("");
  const [removing, setRemoving] = useState(false);

  async function handleRemove() {
    if (!removeTarget || !reason.trim()) { toast.error("Please provide a reason"); return; }
    setRemoving(true);
    try {
      const res = await fetch(`/api/admin/listings/${removeTarget.id}/remove`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reason: reason.trim() }),
      });
      const json = await res.json();
      if (!res.ok) { toast.error(json.error || "Failed"); return; }
      setListings((prev) => prev.filter((l) => l.id !== removeTarget.id));
      toast.success("Listing removed — seller notified by email");
      setRemoveTarget(null);
      setReason("");
      router.refresh();
    } catch { toast.error("Something went wrong"); }
    finally { setRemoving(false); }
  }

  const stockClass = (stock: number) =>
    stock === 0 ? "bg-red-50 text-red-600" : stock <= 50 ? "bg-orange-50 text-orange-600" : "bg-gray-100 text-gray-600";

  return (
    <>
      {/* Remove modal */}
      <Modal
        open={!!removeTarget}
        onClose={() => { setRemoveTarget(null); setReason(""); }}
        title={`Remove "${removeTarget?.name}"`}
      >
        <div className="space-y-3">
          <p className="text-sm text-gray-500">
            This will deactivate the listing and notify <strong>{removeTarget?.seller.businessName || removeTarget?.seller.name}</strong> by email with your reason. They can create a new listing addressing your concern.
          </p>
          <div>
            <label className="text-xs font-semibold text-gray-700 block mb-1.5">Reason for removal *</label>
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder="e.g. Incorrect pricing, misleading description, product not allowed..."
              rows={3}
              className="w-full rounded-xl border border-gray-200 px-3 py-2.5 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-300"
              autoFocus
            />
          </div>
          <div className="flex justify-end gap-2 pt-1">
            <Button variant="outline" size="sm" onClick={() => { setRemoveTarget(null); setReason(""); }}>Cancel</Button>
            <Button
              size="sm"
              disabled={removing || !reason.trim()}
              onClick={handleRemove}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {removing && <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />}
              Remove & Notify Seller
            </Button>
          </div>
        </div>
      </Modal>

      {/* Mobile cards */}
      <div className="md:hidden space-y-3">
        {listings.map((listing) => (
          <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 p-4">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="min-w-0">
                <p className="font-semibold text-gray-900 truncate">{listing.name}</p>
                {listing.brand && <p className="text-xs text-gray-400">{listing.brand}</p>}
                <p className="text-xs text-gray-500 mt-0.5">{listing.category.name}</p>
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <Badge className={listing.source === "ADMIN" ? "bg-green-100 text-green-700 hover:bg-green-100" : "bg-blue-100 text-blue-700 hover:bg-blue-100"}>
                  {listing.source === "ADMIN" ? "Gross Tech" : listing.seller.businessName || listing.seller.name}
                </Badge>
                <span className={`text-xs px-2 py-0.5 rounded-full ${listing.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                  {listing.isActive ? "Active" : "Inactive"}
                </span>
              </div>
            </div>
            <div className="flex flex-wrap gap-1 mb-3">
              {listing.priceOptions.slice(0, 3).map((opt) => (
                <span key={opt.id} className={`text-xs px-1.5 py-0.5 rounded ${stockClass(opt.stock)}`}>
                  {opt.weight}: ₹{opt.price} ({opt.stock})
                </span>
              ))}
            </div>
            <div className="pt-2 border-t border-gray-50">
              {listing.source === "ADMIN" ? (
                <Link href={`/admin/inventory/${listing.id}/edit`} className="text-sm text-green-600 hover:underline font-medium flex items-center gap-1">
                  <Pencil className="w-3.5 h-3.5" /> Edit
                </Link>
              ) : (
                <button
                  onClick={() => setRemoveTarget(listing)}
                  className="text-sm text-red-500 hover:text-red-700 font-medium flex items-center gap-1"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove listing
                </button>
              )}
            </div>
          </div>
        ))}
        {listings.length === 0 && (
          <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">No products yet.</div>
        )}
      </div>

      {/* Desktop table */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
                        <span key={opt.id} className={`text-xs px-1.5 py-0.5 rounded flex items-center gap-1 ${stockClass(opt.stock)}`}>
                          {opt.weight}: ₹{opt.price} <span className="font-semibold">({opt.stock})</span>
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
                    {listing.source === "ADMIN" ? (
                      <Link href={`/admin/inventory/${listing.id}/edit`} className="inline-flex items-center gap-1 text-xs text-green-600 hover:underline">
                        <Pencil className="w-3.5 h-3.5" /> Edit
                      </Link>
                    ) : (
                      <button
                        onClick={() => setRemoveTarget(listing)}
                        className="inline-flex items-center gap-1 text-xs text-red-500 hover:text-red-700"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Remove
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
