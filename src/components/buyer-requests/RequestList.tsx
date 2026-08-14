"use client";

import { useState } from "react";
import { useSession } from "next-auth/react";
import useSWR from "swr";
import { Send, Loader2, Package, MapPin, Clock, Phone, Mail, CheckCircle2, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface BuyerRequest {
  id: string;
  description: string;
  quantity: string | null;
  isResolved: boolean;
  createdAt: string;
  buyer: {
    id: string;
    name: string;
    businessName: string | null;
    city: string | null;
    state: string | null;
    phone?: string | null;
    email?: string | null;
  };
  item: { id: string; name: string; slug: string; category: { name: string } } | null;
}

interface ItemOption {
  id: string;
  name: string;
  slug: string;
  categoryId: string;
}

const fetcher = (url: string) => fetch(url).then((r) => r.json());

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 60) return `${mins}m ago`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.floor(hours / 24);
  if (days < 30) return `${days}d ago`;
  return new Date(dateStr).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
}

export default function RequestList() {
  const { data: session } = useSession();
  const { data: requests, mutate } = useSWR<BuyerRequest[]>("/api/buyer-requests", fetcher);
  const { data: items = [] } = useSWR<ItemOption[]>("/api/items?all=true", fetcher);
  const isBuyer = session?.user.role === "BUYER";
  const isAdmin = session?.user.role === "ADMIN";
  const canResolve = isAdmin || session?.user.role === "SELLER";
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  async function toggleResolve(req: BuyerRequest) {
    setResolvingId(req.id);
    try {
      const res = await fetch(`/api/buyer-requests/${req.id}/resolve`, { method: "PUT" });
      if (!res.ok) { toast.error("Failed to update"); return; }
      const { isResolved } = await res.json();
      mutate(
        (prev) => prev?.map((r) => r.id === req.id ? { ...r, isResolved } : r),
        false
      );
    } catch { toast.error("Something went wrong"); }
    finally { setResolvingId(null); }
  }

  const [description, setDescription] = useState("");
  const [quantity, setQuantity] = useState("");
  const [itemId, setItemId] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!description.trim()) { toast.error("Describe what you need"); return; }
    setSubmitting(true);
    try {
      const res = await fetch("/api/buyer-requests", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          description: description.trim(),
          quantity: quantity.trim() || undefined,
          itemId: itemId || undefined,
        }),
      });
      if (!res.ok) { const e = await res.json(); throw new Error(e.error); }
      const newReq = await res.json();
      mutate((prev) => [newReq, ...(prev || [])], false);
      setDescription("");
      setQuantity("");
      setItemId("");
      toast.success("Purchase request posted!");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Failed to post request");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Post form — buyers only */}
      {isBuyer && (
        <form onSubmit={handleSubmit} className="bg-white rounded-2xl border border-gray-100 p-5 mb-8 shadow-sm">
          <h2 className="font-semibold text-gray-900 mb-4">Post a Purchase Request</h2>
          <div className="space-y-4">
            <div className="space-y-1.5">
              <Label>What do you need? *</Label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="e.g. Looking for premium quality basmati rice for my restaurant, need regular supply..."
                rows={3}
                className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label>Item (optional)</Label>
                <select
                  value={itemId}
                  onChange={(e) => setItemId(e.target.value)}
                  className="w-full rounded-xl border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring"
                >
                  <option value="">Any item</option>
                  {items.map((item) => (
                    <option key={item.id} value={item.id}>{item.name}</option>
                  ))}
                </select>
              </div>
              <div className="space-y-1.5">
                <Label>Quantity (optional)</Label>
                <Input
                  value={quantity}
                  onChange={(e) => setQuantity(e.target.value)}
                  placeholder="e.g. 100kg, 50 bags"
                />
              </div>
            </div>
            <Button type="submit" disabled={submitting} className="bg-green-600 hover:bg-green-700">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin mr-1.5" /> : <Send className="w-4 h-4 mr-1.5" />}
              Post Request
            </Button>
          </div>
        </form>
      )}

      {/* Request list */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">
          Purchase Requests
          {requests && <span className="text-gray-400 font-normal ml-2">({requests.length})</span>}
        </h2>

        {!requests ? (
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="bg-white rounded-2xl border border-gray-100 p-5 animate-pulse">
                <div className="h-4 bg-gray-100 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-100 rounded w-1/2 mb-2" />
                <div className="h-3 bg-gray-50 rounded w-1/3" />
              </div>
            ))}
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16">
            <Package className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <h3 className="text-lg font-semibold text-gray-600">No purchase requests yet</h3>
            <p className="text-sm text-gray-400 mt-1">
              {isBuyer ? "Be the first to post what you need!" : "Buyer requests will appear here."}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {requests.map((req) => (
              <div key={req.id} className={`bg-white rounded-2xl border p-5 shadow-sm transition-shadow ${req.isResolved ? "border-gray-100 opacity-60" : "border-gray-200 hover:shadow-md"}`}>
                <div className="flex items-start justify-between gap-3 mb-3">
                  <div className="min-w-0">
                    <p className="font-medium text-gray-900">
                      {isBuyer ? "Your Request" : (req.buyer.businessName || req.buyer.name)}
                    </p>
                    {!isBuyer && (req.buyer.city || req.buyer.state) && (
                      <p className="text-xs text-gray-400 flex items-center gap-1 mt-0.5">
                        <MapPin className="w-3 h-3" />
                        {[req.buyer.city, req.buyer.state].filter(Boolean).join(", ")}
                      </p>
                    )}
                    {/* Contact details — admin only */}
                    {isAdmin && (
                      <div className="flex flex-wrap gap-3 mt-1.5">
                        {req.buyer.phone && (
                          <a href={`tel:${req.buyer.phone}`} className="text-xs text-green-600 flex items-center gap-1 hover:underline">
                            <Phone className="w-3 h-3" /> {req.buyer.phone}
                          </a>
                        )}
                        {req.buyer.email && (
                          <a href={`mailto:${req.buyer.email}`} className="text-xs text-green-600 flex items-center gap-1 hover:underline">
                            <Mail className="w-3 h-3" /> {req.buyer.email}
                          </a>
                        )}
                      </div>
                    )}
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <span className="text-xs text-gray-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      {timeAgo(req.createdAt)}
                    </span>
                    {/* Resolved badge */}
                    {req.isResolved ? (
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Resolved
                      </span>
                    ) : (
                      <span className="text-xs bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full font-medium flex items-center gap-1">
                        <Circle className="w-3 h-3" /> Open
                      </span>
                    )}
                  </div>
                </div>

                <p className="text-sm text-gray-700 leading-relaxed mb-3">{req.description}</p>

                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="flex flex-wrap items-center gap-2">
                    {req.item && (
                      <span className="text-xs bg-green-50 text-green-700 px-2.5 py-1 rounded-full font-medium">
                        {req.item.name}
                      </span>
                    )}
                    {req.item?.category && (
                      <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full">
                        {req.item.category.name}
                      </span>
                    )}
                    {req.quantity && (
                      <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full font-medium">
                        Qty: {req.quantity}
                      </span>
                    )}
                  </div>

                  {/* Resolve toggle — admin and seller only */}
                  {canResolve && (
                    <button
                      onClick={() => toggleResolve(req)}
                      disabled={resolvingId === req.id}
                      className={`text-xs font-semibold flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition-all ${
                        req.isResolved
                          ? "bg-gray-100 text-gray-500 hover:bg-red-50 hover:text-red-600"
                          : "bg-green-50 text-green-700 hover:bg-green-100"
                      }`}
                    >
                      {resolvingId === req.id ? (
                        <Loader2 className="w-3 h-3 animate-spin" />
                      ) : req.isResolved ? (
                        <Circle className="w-3 h-3" />
                      ) : (
                        <CheckCircle2 className="w-3 h-3" />
                      )}
                      {req.isResolved ? "Mark Open" : "Mark Resolved"}
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
