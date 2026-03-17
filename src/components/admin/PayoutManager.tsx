"use client";

import { useRouter } from "next/navigation";
import { CheckCircle, Clock } from "lucide-react";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";

interface OrderItem {
  id: string;
  quantity: number;
  priceAtOrder: number;
  listing: { name: string; seller?: { name: string; businessName: string | null } };
  priceOption: { weight: string };
}

interface Order {
  id: string;
  total: number;
  status: string;
  releaseScheduledAt: Date | null;
  createdAt: Date;
  buyer: { name: string; email: string };
  items: OrderItem[];
}

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAYMENT_HELD: "bg-blue-100 text-blue-700",
  RELEASED_TO_SELLER: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default function PayoutManager({
  readyOrders,
  allOrders,
}: {
  readyOrders: Order[];
  allOrders: Order[];
}) {
  const router = useRouter();

  async function handleRelease(orderId: string) {
    const res = await fetch(`/api/admin/payouts/${orderId}`, { method: "PUT" });
    if (res.ok) {
      toast.success("Payment released to seller!");
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
          <div className="space-y-3">
            {readyOrders.map((order) => (
              <div key={order.id} className="bg-white rounded-2xl border-2 border-green-200 p-5">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="font-semibold text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</p>
                    <p className="text-xs text-gray-400">Buyer: {order.buyer.name}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600">₹{order.total}</p>
                    <p className="text-xs text-gray-400">
                      Held since {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </p>
                  </div>
                </div>
                <div className="space-y-1 mb-4">
                  {order.items.map((item) => (
                    <p key={item.id} className="text-sm text-gray-600">
                      {item.listing.name} ({item.priceOption.weight}) × {item.quantity} —{" "}
                      <span className="font-medium">{item.listing.seller?.businessName || item.listing.seller?.name}</span>
                    </p>
                  ))}
                </div>
                <Button
                  size="sm"
                  className="bg-green-600 hover:bg-green-700"
                  onClick={() => handleRelease(order.id)}
                >
                  <CheckCircle className="w-4 h-4 mr-2" />
                  Mark Released to Seller
                </Button>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* All orders */}
      <div>
        <h2 className="font-semibold text-gray-900 mb-4">All Orders</h2>
        <div className="bg-white rounded-2xl border border-gray-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Order</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Buyer</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Total</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Status</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Date</th>
                  <th className="px-4 py-3 text-left font-medium text-gray-600">Release Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {allOrders.map((order) => (
                  <tr key={order.id} className="hover:bg-gray-50/50">
                    <td className="px-4 py-3 font-mono text-xs text-gray-600">
                      #{order.id.slice(-8).toUpperCase()}
                    </td>
                    <td className="px-4 py-3 text-gray-700">{order.buyer.name}</td>
                    <td className="px-4 py-3 font-semibold text-green-600">₹{order.total}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-1 rounded-full ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                        {order.status.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {new Date(order.createdAt).toLocaleDateString("en-IN")}
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">
                      {order.releaseScheduledAt ? (
                        <span className="flex items-center gap-1">
                          <Clock className="w-3 h-3" />
                          {new Date(order.releaseScheduledAt).toLocaleDateString("en-IN")}
                        </span>
                      ) : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
