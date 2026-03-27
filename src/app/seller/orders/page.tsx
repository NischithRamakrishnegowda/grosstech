import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Truck, Package, ShoppingBag } from "lucide-react";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAYMENT_HELD: "bg-blue-100 text-blue-700",
  RELEASED_TO_SELLER: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Processing",
  PAYMENT_HELD: "Order Placed",
  RELEASED_TO_SELLER: "Payment Released",
  CANCELLED: "Cancelled",
  FAILED: "Failed",
};

export default async function SellerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const orders = await prisma.order.findMany({
    where: {
      items: { some: { listing: { sellerId: session.user.id } } },
    },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        where: { listing: { sellerId: session.user.id } },
        include: {
          listing: { select: { name: true } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Orders for My Products</h1>

      {orders.length === 0 ? (
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center">
          <ShoppingBag className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-500 font-medium">No orders yet</p>
          <p className="text-gray-400 text-sm mt-1">Orders for your products will appear here</p>
        </div>
      ) : (
        <div className="space-y-4">
          {orders.map((order) => (
            <div key={order.id} className="bg-white rounded-2xl border border-gray-100 p-5">
              <div className="flex justify-between items-start mb-3">
                <div>
                  <p className="font-medium text-gray-900">Order #{order.id.slice(-8).toUpperCase()}</p>
                  <p className="text-xs text-gray-400">Buyer: {order.buyer.name} ({order.buyer.email})</p>
                  <p className="text-xs text-gray-400">
                    {new Date(order.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100 text-gray-600"}`}>
                  {STATUS_LABELS[order.status] || order.status.replace(/_/g, " ")}
                </span>
              </div>

              <div className="space-y-1.5 mb-3">
                {order.items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-gray-600">{item.listing.name} ({item.priceOption.weight}) × {item.quantity}</span>
                    <span className="font-medium">₹{item.priceAtOrder * item.quantity}</span>
                  </div>
                ))}
              </div>

              <div className="flex flex-wrap gap-2 mb-2">
                {order.deliveryOption === "DELIVERY" ? (
                  <span className="text-xs bg-blue-50 text-blue-600 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <Truck className="w-3 h-3" /> Delivery
                    {order.deliveryCharge != null ? ` · ₹${order.deliveryCharge}` : " · charge TBD"}
                  </span>
                ) : (
                  <span className="text-xs bg-gray-100 text-gray-500 px-2.5 py-1 rounded-full inline-flex items-center gap-1.5">
                    <Package className="w-3 h-3" /> Self Pickup
                  </span>
                )}
              </div>

              {order.status === "PAYMENT_HELD" && order.releaseScheduledAt && (
                <p className="text-xs text-amber-600 bg-amber-50 px-3 py-1.5 rounded-lg">
                  Payment releases on {new Date(order.releaseScheduledAt).toLocaleDateString("en-IN")}
                </p>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
