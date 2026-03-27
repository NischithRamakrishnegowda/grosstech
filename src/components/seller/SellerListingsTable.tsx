"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { Pencil, Trash2, Eye, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { useState, Fragment } from "react";

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
  status: string;
  rejectionReason: string | null;
  category: { name: string };
  priceOptions: PriceOption[];
}

const STATUS_STYLES: Record<string, string> = {
  PENDING_APPROVAL: "bg-amber-100 text-amber-700 hover:bg-amber-100",
  APPROVED: "bg-green-100 text-green-700 hover:bg-green-100",
  REJECTED: "bg-red-100 text-red-700 hover:bg-red-100",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING_APPROVAL: "Pending",
  APPROVED: "Active",
  REJECTED: "Rejected",
};

export default function SellerListingsTable({ listings }: { listings: Listing[] }) {
  const router = useRouter();
  const [expandedRejection, setExpandedRejection] = useState<string | null>(null);
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);

  async function handleDelete(id: string) {
    const res = await fetch(`/api/listings/${id}`, { method: "DELETE" });
    setDeleteConfirmId(null);
    if (res.ok) {
      toast.success("Listing deactivated");
      router.refresh();
    } else {
      toast.error("Failed to deactivate");
    }
  }

  function getStatusDisplay(listing: Listing) {
    if (listing.status === "APPROVED" && !listing.isActive) return { style: "bg-gray-100 text-gray-500 hover:bg-gray-100", label: "Inactive" };
    return { style: STATUS_STYLES[listing.status] || "", label: STATUS_LABELS[listing.status] || listing.status };
  }

  if (listings.length === 0) {
    return (
      <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
        No listings yet. Add your first product!
      </div>
    );
  }

  return (
    <>
      {/* Mobile card view */}
      <div className="md:hidden space-y-3">
        {listings.map((listing) => {
          const statusDisplay = getStatusDisplay(listing);
          return (
            <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 p-4">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 truncate">{listing.name}</p>
                  {listing.brand && <p className="text-xs text-gray-400">{listing.brand}</p>}
                  <p className="text-xs text-gray-500 mt-0.5">{listing.category.name}</p>
                </div>
                <Badge className={`shrink-0 ${statusDisplay.style}`}>
                  {statusDisplay.label}
                </Badge>
              </div>

              {/* Rejection reason */}
              {listing.status === "REJECTED" && listing.rejectionReason && (
                <div className="mb-3 p-2.5 bg-red-50 rounded-lg border border-red-100">
                  <div className="flex items-start gap-2">
                    <AlertCircle className="w-3.5 h-3.5 text-red-500 mt-0.5 shrink-0" />
                    <p className="text-xs text-red-700">{listing.rejectionReason}</p>
                  </div>
                </div>
              )}

              <div className="flex flex-wrap gap-1 mb-3">
                {listing.priceOptions.slice(0, 3).map((opt) => (
                  <span
                    key={opt.id}
                    className={`text-xs px-1.5 py-0.5 rounded ${
                      opt.stock === 0
                        ? "bg-red-50 text-red-600"
                        : opt.stock <= 50
                        ? "bg-orange-50 text-orange-600"
                        : "bg-green-50 text-green-700"
                    }`}
                  >
                    {opt.weight}: ₹{opt.price} ({opt.stock})
                  </span>
                ))}
              </div>
              <div className="flex items-center gap-3 pt-2 border-t border-gray-50">
                <Link href={`/products/${listing.id}`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-blue-500 transition-colors">
                  <Eye className="w-3.5 h-3.5" /> View
                </Link>
                <Link href={`/seller/listings/${listing.id}/edit`} className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-green-600 transition-colors">
                  <Pencil className="w-3.5 h-3.5" /> {listing.status === "REJECTED" ? "Edit & Resubmit" : "Edit"}
                </Link>
                {listing.status !== "PENDING_APPROVAL" && (
                  <div className="ml-auto">
                    {deleteConfirmId === listing.id ? (
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-gray-500">Deactivate?</span>
                        <button onClick={() => handleDelete(listing.id)} className="text-xs text-red-600 font-semibold hover:underline">Yes</button>
                        <button onClick={() => setDeleteConfirmId(null)} className="text-xs text-gray-400 hover:underline">No</button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirmId(listing.id)}
                        className="flex items-center gap-1.5 text-xs text-gray-500 hover:text-red-500 transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5" /> Deactivate
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Desktop table view */}
      <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden">
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
              {listings.map((listing) => {
                const statusDisplay = getStatusDisplay(listing);
                return (
                  <Fragment key={listing.id}>
                    <tr className="hover:bg-gray-50/50 transition-colors">
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
                        <Badge className={statusDisplay.style}>
                          {statusDisplay.label}
                        </Badge>
                        {listing.status === "REJECTED" && listing.rejectionReason && (
                          <button
                            onClick={() => setExpandedRejection(expandedRejection === listing.id ? null : listing.id)}
                            className="block text-xs text-red-500 hover:text-red-700 mt-1 underline"
                          >
                            {expandedRejection === listing.id ? "Hide reason" : "View reason"}
                          </button>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex justify-end items-center gap-2">
                          <Link href={`/products/${listing.id}`} className="p-1.5 text-gray-400 hover:text-blue-500 transition-colors">
                            <Eye className="w-4 h-4" />
                          </Link>
                          <Link href={`/seller/listings/${listing.id}/edit`} className="p-1.5 text-gray-400 hover:text-green-600 transition-colors" title={listing.status === "REJECTED" ? "Edit & Resubmit" : "Edit"}>
                            <Pencil className="w-4 h-4" />
                          </Link>
                          {listing.status !== "PENDING_APPROVAL" && (
                            deleteConfirmId === listing.id ? (
                              <div className="flex items-center gap-1.5 text-xs">
                                <span className="text-gray-500 hidden lg:inline">Deactivate?</span>
                                <button onClick={() => handleDelete(listing.id)} className="text-red-600 font-semibold hover:underline px-1">Yes</button>
                                <button onClick={() => setDeleteConfirmId(null)} className="text-gray-400 hover:underline px-1">No</button>
                              </div>
                            ) : (
                              <button
                                onClick={() => setDeleteConfirmId(listing.id)}
                                className="p-1.5 text-gray-400 hover:text-red-500 transition-colors"
                                title="Deactivate"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                    {expandedRejection === listing.id && listing.rejectionReason && (
                      <tr>
                        <td colSpan={5} className="px-4 py-3 bg-red-50">
                          <div className="flex items-start gap-2">
                            <AlertCircle className="w-4 h-4 text-red-500 mt-0.5 shrink-0" />
                            <p className="text-sm text-red-700">{listing.rejectionReason}</p>
                          </div>
                        </td>
                      </tr>
                    )}
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </>
  );
}
