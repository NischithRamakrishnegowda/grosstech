"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Clock, AlertCircle, Wallet, Landmark, X, Loader2, Truck, PackageCheck } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { toast } from "sonner";
import { useState } from "react";
import { PLATFORM_FEE } from "@/lib/constants";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtOrder: number;
  listing: { name: string; seller?: { id: string; name: string; businessName: string | null; upiId: string | null; accountNumber: string | null; ifscCode: string | null } };
  priceOption: { weight: string };
}

interface Order {
  id: string;
  total: number;
  status: string;
  releaseScheduledAt: Date | null;
  createdAt: Date;
  deliveryOption: string;
  deliveryCharge: number | null;
  buyer: { name: string; email: string };
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAYMENT_HELD: "bg-blue-100 text-blue-700",
  FAILED: "bg-red-100 text-red-700",
  RELEASED_TO_SELLER: "bg-green-100 text-green-700",
  CANCELLED: "bg-gray-100 text-gray-600",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Processing",
  PAYMENT_HELD: "Order Placed",
  FAILED: "Failed",
  RELEASED_TO_SELLER: "Released",
  CANCELLED: "Cancelled",
};

// Group items by seller
function groupBySeller(items: OrderItem[]) {
  const groups: Record<string, { seller: OrderItem["listing"]["seller"]; items: OrderItem[]; subtotal: number }> = {};
  for (const item of items) {
    const sellerId = item.listing.seller?.id || "unknown";
    if (!groups[sellerId]) {
      groups[sellerId] = { seller: item.listing.seller, items: [], subtotal: 0 };
    }
    groups[sellerId].items.push(item);
    groups[sellerId].subtotal += item.priceAtOrder * item.quantity;
  }
  return Object.values(groups);
}

function SellerPaymentInfo({ seller }: { seller: OrderItem["listing"]["seller"] }) {
  if (!seller) return null;
  const hasUpi = !!seller.upiId;
  const hasBank = !!seller.accountNumber && !!seller.ifscCode;
  if (!hasUpi && !hasBank) {
    return <p className="text-xs text-red-400 mt-1">No payment details on file</p>;
  }
  return (
    <div className="flex flex-wrap gap-2 mt-1">
      {hasUpi && (
        <span className="text-xs bg-purple-50 text-purple-600 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 w-fit">
          <Wallet className="w-3 h-3" />
          {seller.upiId}
        </span>
      )}
      {hasBank && (
        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full font-mono flex items-center gap-1 w-fit">
          <Landmark className="w-3 h-3" />
          {seller.accountNumber} · {seller.ifscCode}
        </span>
      )}
    </div>
  );
}

export default function PayoutManager({
  readyOrders,
  allOrders,
}: {
  readyOrders: Order[];
  allOrders: Order[];
}) {
  const router = useRouter();
  const [releasing, setReleasing] = useState<string | null>(null);
  const [confirmOrder, setConfirmOrder] = useState<Order | null>(null);
  const [deliveryChargeInput, setDeliveryChargeInput] = useState<Record<string, string>>({});
  const [savingCharge, setSavingCharge] = useState<string | null>(null);

  async function handleSetDeliveryCharge(orderId: string) {
    const val = deliveryChargeInput[orderId];
    const charge = parseFloat(val);
    if (isNaN(charge) || charge < 0) {
      toast.error("Enter a valid delivery charge");
      return;
    }
    setSavingCharge(orderId);
    const res = await fetch(`/api/admin/orders/${orderId}/delivery-charge`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryCharge: charge }),
    });
    setSavingCharge(null);
    if (res.ok) {
      toast.success("Delivery charge saved");
      router.refresh();
    } else {
      toast.error("Failed to save delivery charge");
    }
  }

  async function handleRelease(orderId: string) {
    setReleasing(orderId);
    const res = await fetch(`/api/admin/payouts/${orderId}`, { method: "PUT" });
    setReleasing(null);
    setConfirmOrder(null);
    if (res.ok) {
      toast.success("Payment marked as released!");
      router.refresh();
    } else {
      toast.error("Failed to release payment");
    }
  }

  return (
    <div className="space-y-8">
      {/* Ready for payout */}
      {readyOrders.length > 0 && (
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="w-2.5 h-2.5 bg-green-500 rounded-full animate-pulse" />
            <h2 className="font-semibold text-gray-900">Ready for Payout ({readyOrders.length})</h2>
          </div>
          <div className="space-y-4">
            {readyOrders.map((order) => {
              const sellerGroups = groupBySeller(order.items);
              const netToSeller = order.total - PLATFORM_FEE;

              return (
                <div key={order.id} className="bg-white rounded-2xl border-2 border-green-200 p-5 shadow-sm">
                  <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-2 mb-4">
                    <div>
                      <p className="font-semibold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</p>
                      <p className="text-xs text-gray-400">Buyer: {order.buyer.name} ({order.buyer.email})</p>
                    </div>
                    <p className="text-xs text-gray-400">
                      Held since {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>

                  {/* Seller groups */}
                  {sellerGroups.map((group, i) => (
                    <div key={i} className="mb-4 bg-gray-50 rounded-xl p-4">
                      <p className="font-medium text-gray-800 text-sm">
                        {group.seller?.businessName || group.seller?.name || "Unknown Seller"}
                      </p>
                      <SellerPaymentInfo seller={group.seller} />
                      <div className="space-y-1 mt-2">
                        {group.items.map((item) => (
                          <p key={item.id} className="text-sm text-gray-600">
                            {item.listing.name} ({item.priceOption.weight}) x {item.quantity} = ₹{item.priceAtOrder * item.quantity}
                          </p>
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Delivery info */}
                  {order.deliveryOption === "DELIVERY" && (
                    <div className="mb-3 flex items-center gap-2 flex-wrap">
                      <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <Truck className="w-3 h-3" /> Delivery
                      </span>
                      <div className="flex items-center gap-1.5">
                        <Input
                          type="number"
                          min="0"
                          placeholder="Charge ₹"
                          className="h-7 w-24 text-xs"
                          value={deliveryChargeInput[order.id] ?? (order.deliveryCharge?.toString() || "")}
                          onChange={(e) => setDeliveryChargeInput((p) => ({ ...p, [order.id]: e.target.value }))}
                        />
                        <Button size="sm" className="h-7 text-xs" onClick={() => handleSetDeliveryCharge(order.id)} disabled={savingCharge === order.id}>
                          {savingCharge === order.id ? <Loader2 className="w-3 h-3 animate-spin" /> : "Save"}
                        </Button>
                      </div>
                    </div>
                  )}
                  {order.deliveryOption === "SELF_PICKUP" && (
                    <div className="mb-3">
                      <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full flex items-center gap-1 w-fit">
                        <PackageCheck className="w-3 h-3" /> Self Pickup
                      </span>
                    </div>
                  )}

                  {/* Fee breakdown */}
                  <div className="border-t border-gray-100 pt-3 mb-4 space-y-1 text-sm">
                    <div className="flex justify-between text-gray-500">
                      <span>Order Total</span>
                      <span>₹{order.total}</span>
                    </div>
                    <div className="flex justify-between text-gray-500">
                      <span>Platform Fee</span>
                      <span>- ₹{PLATFORM_FEE}</span>
                    </div>
                    {order.deliveryOption === "DELIVERY" && order.deliveryCharge != null && (
                      <div className="flex justify-between text-blue-600">
                        <span>Delivery Charge (separate)</span>
                        <span>₹{order.deliveryCharge}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-semibold text-green-700 pt-1 border-t border-dashed border-gray-200">
                      <span>Net to Release</span>
                      <span>₹{netToSeller}</span>
                    </div>
                  </div>

                  <Button
                    size="sm"
                    className="bg-green-600 hover:bg-green-700 w-full sm:w-auto"
                    onClick={() => setConfirmOrder(order)}
                  >
                    <CheckCircle className="w-4 h-4 mr-2" />
                    Release ₹{netToSeller} to Seller
                  </Button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* All orders */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">All Orders</h2>

        {allOrders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-lg font-medium">No orders yet</p>
          </div>
        ) : (
          <>
            {/* Mobile card view */}
            <div className="md:hidden space-y-3">
              {allOrders.map((order) => {
                const isPastDue = order.releaseScheduledAt && new Date(order.releaseScheduledAt) <= new Date();
                const sellerGroups = groupBySeller(order.items);
                const primarySeller = sellerGroups[0]?.seller;
                return (
                  <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                    <div className="flex items-start justify-between gap-2 mb-2">
                      <div className="min-w-0">
                        <p className="font-mono text-xs text-gray-500">#{order.id.slice(-8).toUpperCase()}</p>
                        <p className="font-semibold text-gray-900 mt-0.5">{order.buyer.name}</p>
                        {primarySeller && (
                          <div className="mt-0.5">
                            <p className="text-xs text-gray-400">
                              Seller: {primarySeller.businessName || primarySeller.name}
                            </p>
                            <SellerPaymentInfo seller={primarySeller} />
                          </div>
                        )}
                      </div>
                      <div className="text-right shrink-0">
                        <p className="font-bold text-green-600">₹{order.total}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                          {STATUS_LABELS[order.status] || order.status}
                        </span>
                      </div>
                    </div>
                    <p className="text-xs text-gray-400 mb-2">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                      {order.releaseScheduledAt && order.status === "PAYMENT_HELD" && (
                        <span className={`ml-2 ${isPastDue ? "text-green-600 font-medium" : "text-gray-400"}`}>
                          · Due {new Date(order.releaseScheduledAt).toLocaleDateString("en-IN")}
                        </span>
                      )}
                    </p>
                    <div className="mb-3">
                      {order.deliveryOption === "DELIVERY" ? (
                        <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <Truck className="w-3 h-3" /> Delivery{order.deliveryCharge != null ? ` · ₹${order.deliveryCharge}` : " · charge not set"}
                        </span>
                      ) : (
                        <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                          <PackageCheck className="w-3 h-3" /> Self Pickup
                        </span>
                      )}
                    </div>
                    {order.status === "PAYMENT_HELD" && (
                      <Button
                        size="sm"
                        variant={isPastDue ? "default" : "outline"}
                        className={`w-full ${isPastDue ? "bg-green-600 hover:bg-green-700" : "border-orange-300 text-orange-600 hover:bg-orange-50"}`}
                        onClick={() => isPastDue ? setConfirmOrder(order) : handleRelease(order.id)}
                        disabled={releasing === order.id}
                      >
                        {releasing === order.id ? (
                          <span className="flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" /> Releasing...</span>
                        ) : isPastDue ? (
                          <span className="flex items-center gap-1.5"><CheckCircle className="w-3.5 h-3.5" /> Release Payment</span>
                        ) : (
                          <span className="flex items-center gap-1.5"><AlertCircle className="w-3.5 h-3.5" /> Force Release</span>
                        )}
                      </Button>
                    )}
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
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Buyer</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Seller</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Delivery</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                      <th className="px-4 py-3 text-left font-medium text-gray-600">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-50">
                    {allOrders.map((order) => {
                      const isPastDue = order.releaseScheduledAt && new Date(order.releaseScheduledAt) <= new Date();
                      const sellerGroups = groupBySeller(order.items);
                      const primarySeller = sellerGroups[0]?.seller;
                      return (
                        <tr key={order.id} className="hover:bg-gray-50/50">
                          <td className="px-4 py-3 font-mono text-xs text-gray-600">#{order.id.slice(-8).toUpperCase()}</td>
                          <td className="px-4 py-3 text-gray-700">{order.buyer.name}</td>
                          <td className="px-4 py-3">
                            <p className="text-gray-700 text-xs font-medium">{primarySeller?.businessName || primarySeller?.name || "—"}</p>
                            {primarySeller && <SellerPaymentInfo seller={primarySeller} />}
                          </td>
                          <td className="px-4 py-3 font-semibold text-green-600">₹{order.total}</td>
                          <td className="px-4 py-3">
                            {order.deliveryOption === "DELIVERY" ? (
                              <span className="text-xs bg-blue-50 text-blue-600 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <Truck className="w-3 h-3" /> {order.deliveryCharge != null ? `₹${order.deliveryCharge}` : "TBD"}
                              </span>
                            ) : (
                              <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded-full inline-flex items-center gap-1">
                                <PackageCheck className="w-3 h-3" /> Pickup
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                              {STATUS_LABELS[order.status] || order.status.replace(/_/g, " ")}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">
                            {new Date(order.createdAt).toLocaleDateString("en-IN")}
                            {order.releaseScheduledAt && order.status === "PAYMENT_HELD" && (
                              <span className={`flex items-center gap-1 mt-0.5 ${isPastDue ? "text-green-600" : "text-gray-400"}`}>
                                <Clock className="w-3 h-3" />
                                Due {new Date(order.releaseScheduledAt).toLocaleDateString("en-IN")}
                              </span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {order.status === "PAYMENT_HELD" && (
                              <Button
                                size="sm"
                                variant={isPastDue ? "default" : "outline"}
                                className={isPastDue ? "bg-green-600 hover:bg-green-700 h-7 text-xs" : "h-7 text-xs border-orange-300 text-orange-600 hover:bg-orange-50"}
                                onClick={() => isPastDue ? setConfirmOrder(order) : handleRelease(order.id)}
                                disabled={releasing === order.id}
                              >
                                {releasing === order.id ? (
                                  <span className="flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" /> Releasing...</span>
                                ) : isPastDue ? (
                                  <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3" /> Release</span>
                                ) : (
                                  <span className="flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Force</span>
                                )}
                              </Button>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>

      {/* Confirmation Modal */}
      {confirmOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={() => setConfirmOrder(null)}>
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full p-6" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-bold text-gray-900">Confirm Payment Release</h3>
              <button onClick={() => setConfirmOrder(null)} className="text-gray-400 hover:text-gray-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="space-y-3 mb-5">
              <p className="text-sm text-gray-600">
                Order <span className="font-mono font-medium">#{confirmOrder.id.slice(-8).toUpperCase()}</span>
              </p>

              {groupBySeller(confirmOrder.items).map((group, i) => (
                <div key={i} className="bg-gray-50 rounded-xl p-3">
                  <p className="text-sm font-medium text-gray-800">{group.seller?.businessName || group.seller?.name}</p>
                  <SellerPaymentInfo seller={group.seller} />
                  <div className="mt-2 space-y-0.5">
                    {group.items.map((item) => (
                      <p key={item.id} className="text-xs text-gray-500">
                        {item.listing.name} ({item.priceOption.weight}) x{item.quantity}
                      </p>
                    ))}
                  </div>
                </div>
              ))}

              <div className="border-t border-gray-100 pt-3 space-y-1 text-sm">
                <div className="flex justify-between text-gray-500">
                  <span>Order Total</span>
                  <span>₹{confirmOrder.total}</span>
                </div>
                <div className="flex justify-between text-gray-500">
                  <span>Platform Fee</span>
                  <span>- ₹{PLATFORM_FEE}</span>
                </div>
                <div className="flex justify-between font-bold text-green-700 pt-1 border-t border-dashed border-gray-200">
                  <span>Amount to Release</span>
                  <span>₹{confirmOrder.total - PLATFORM_FEE}</span>
                </div>
              </div>
            </div>

            <div className="flex gap-3">
              <Button variant="outline" className="flex-1" onClick={() => setConfirmOrder(null)}>Cancel</Button>
              <Button
                className="flex-1 bg-green-600 hover:bg-green-700"
                onClick={() => handleRelease(confirmOrder.id)}
                disabled={releasing === confirmOrder.id}
              >
                {releasing === confirmOrder.id ? (
                  <><Loader2 className="w-4 h-4 animate-spin mr-1" /> Releasing...</>
                ) : (
                  <><CheckCircle className="w-4 h-4 mr-1" /> Confirm Release</>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
