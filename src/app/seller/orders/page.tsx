import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PAYMENT_HELD: "bg-blue-100 text-blue-700",
  RELEASED_TO_SELLER: "bg-green-100 text-green-700",
  CANCELLED: "bg-red-100 text-red-700",
};

export default async function SellerOrdersPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

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
        <div className="bg-white rounded-2xl border border-gray-100 p-10 text-center text-gray-400">
          No orders yet.
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
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[order.status] || "bg-gray-100"}`}>
                  {order.status.replace(/_/g, " ")}
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
