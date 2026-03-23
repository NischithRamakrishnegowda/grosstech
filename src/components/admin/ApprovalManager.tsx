"use client";

import { useState } from "react";
import { Check, X, Loader2, Package, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface PriceOption {
  id: string;
  weight: string;
  price: number;
  stock: number;
}

interface PendingListing {
  id: string;
  name: string;
  brand: string | null;
  description: string | null;
  imageUrl: string | null;
  createdAt: string;
  category: { id: string; name: string };
  priceOptions: PriceOption[];
  seller: { id: string; name: string; email: string; businessName: string | null };
}

export default function ApprovalManager({ listings: initial }: { listings: PendingListing[] }) {
  const [listings, setListings] = useState(initial);
  const [actionId, setActionId] = useState<string | null>(null);
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState("");

  async function handleApprove(id: string) {
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "approve" }),
      });
      if (!res.ok) throw new Error("Failed to approve");
      setListings((prev) => prev.filter((l) => l.id !== id));
      toast.success("Listing approved and seller notified");
    } catch {
      toast.error("Failed to approve listing");
    } finally {
      setActionId(null);
    }
  }

  async function handleReject(id: string) {
    if (!rejectReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionId(id);
    try {
      const res = await fetch(`/api/admin/approvals/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "reject", reason: rejectReason.trim() }),
      });
      if (!res.ok) throw new Error("Failed to reject");
      setListings((prev) => prev.filter((l) => l.id !== id));
      setRejectId(null);
      setRejectReason("");
      toast.success("Listing rejected and seller notified");
    } catch {
      toast.error("Failed to reject listing");
    } finally {
      setActionId(null);
    }
  }

  if (listings.length === 0) {
    return (
      <div className="text-center py-16">
        <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
        <h3 className="text-lg font-semibold text-gray-600">No pending listings</h3>
        <p className="text-sm text-gray-400 mt-1">All seller listings have been reviewed</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-gray-500">{listings.length} listing{listings.length !== 1 ? "s" : ""} awaiting review</p>

      {listings.map((listing) => (
        <div key={listing.id} className="bg-white rounded-2xl border border-gray-100 p-5 shadow-sm">
          <div className="flex flex-col sm:flex-row gap-4">
            {/* Image */}
            <div className="w-full sm:w-28 h-28 rounded-xl bg-gray-50 flex items-center justify-center overflow-hidden shrink-0">
              {listing.imageUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={listing.imageUrl} alt={listing.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="w-8 h-8 text-gray-300" />
              )}
            </div>

            {/* Details */}
            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div>
                  <h3 className="font-semibold text-gray-900">{listing.name}</h3>
                  {listing.brand && <p className="text-sm text-gray-500">{listing.brand}</p>}
                </div>
                <Badge variant="secondary">{listing.category.name}</Badge>
              </div>

              {listing.description && (
                <p className="text-sm text-gray-600 line-clamp-2 mb-3">{listing.description}</p>
              )}

              {/* Price options */}
              <div className="flex flex-wrap gap-2 mb-3">
                {listing.priceOptions.map((opt) => (
                  <span key={opt.id} className="text-xs bg-gray-50 border border-gray-100 rounded-lg px-2.5 py-1 text-gray-600">
                    {opt.weight}: <span className="font-semibold text-gray-900">₹{opt.price}</span>
                    <span className="text-gray-400 ml-1">({opt.stock} qty)</span>
                  </span>
                ))}
              </div>

              {/* Seller info */}
              <div className="flex items-center gap-2 text-sm text-gray-500">
                <User className="w-3.5 h-3.5" />
                <span>{listing.seller.businessName || listing.seller.name}</span>
                <span className="text-gray-300">·</span>
                <span>{listing.seller.email}</span>
              </div>

              <p className="text-xs text-gray-400 mt-1">
                Submitted {new Date(listing.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
              </p>
            </div>
          </div>

          {/* Actions */}
          <div className="mt-4 pt-4 border-t border-gray-50">
            {rejectId === listing.id ? (
              <div className="space-y-3">
                <textarea
                  value={rejectReason}
                  onChange={(e) => setRejectReason(e.target.value)}
                  placeholder="Reason for rejection (will be sent to seller)..."
                  className="w-full rounded-xl border border-gray-200 px-4 py-3 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-red-200 focus:border-red-300"
                  rows={3}
                  autoFocus
                />
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => handleReject(listing.id)}
                    disabled={actionId === listing.id}
                  >
                    {actionId === listing.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <X className="w-4 h-4 mr-1" />}
                    Confirm Reject
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => { setRejectId(null); setRejectReason(""); }}
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex gap-2">
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleApprove(listing.id)}
                  disabled={actionId === listing.id}
                >
                  {actionId === listing.id ? <Loader2 className="w-4 h-4 animate-spin mr-1" /> : <Check className="w-4 h-4 mr-1" />}
                  Approve
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  className="border-red-200 text-red-600 hover:bg-red-50"
                  onClick={() => setRejectId(listing.id)}
                >
                  <X className="w-4 h-4 mr-1" />
                  Reject
                </Button>
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}
