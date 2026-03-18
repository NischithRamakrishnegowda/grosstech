import { prisma } from "@/lib/prisma";
import { Users, ShoppingBag, DollarSign, RefreshCw } from "lucide-react";

export default async function AdminAnalyticsPage() {
  const orders = await prisma.order.findMany({
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          listing: { select: { name: true, seller: { select: { name: true, businessName: true } } } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const uniqueBuyers = new Set(orders.map((o) => o.buyerId)).size;

  // Per-buyer breakdown
  const buyerMap: Record<string, { name: string; email: string; orderCount: number; totalSpent: number; products: string[] }> = {};
  for (const order of orders) {
    if (!buyerMap[order.buyerId]) {
      buyerMap[order.buyerId] = {
        name: order.buyer.name,
        email: order.buyer.email,
        orderCount: 0,
        totalSpent: 0,
        products: [],
      };
    }
    buyerMap[order.buyerId].orderCount += 1;
    buyerMap[order.buyerId].totalSpent += order.total;
    for (const item of order.items) {
      if (!buyerMap[order.buyerId].products.includes(item.listing.name)) {
        buyerMap[order.buyerId].products.push(item.listing.name);
      }
    }
  }

  const buyers = Object.values(buyerMap).sort((a, b) => b.orderCount - a.orderCount);
  const repeatCustomers = buyers.filter((b) => b.orderCount >= 2);

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Analytics</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Total Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: DollarSign, color: "bg-green-100 text-green-600" },
          { label: "Total Orders", value: orders.length, icon: ShoppingBag, color: "bg-blue-100 text-blue-600" },
          { label: "Unique Buyers", value: uniqueBuyers, icon: Users, color: "bg-purple-100 text-purple-600" },
          { label: "Repeat Customers", value: repeatCustomers.length, icon: RefreshCw, color: "bg-orange-100 text-orange-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center shrink-0`}>
              <stat.icon className="w-5 h-5" />
            </div>
            <div>
              <p className="text-xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-xs text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* All buyers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Buyer Activity</h2>
          {buyers.length === 0 ? (
            <p className="text-gray-400 text-sm">No orders yet.</p>
          ) : (
            <div className="space-y-3">
              {buyers.map((buyer) => (
                <div key={buyer.email} className="flex items-center justify-between py-2 border-b last:border-0">
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800 truncate">{buyer.name}</p>
                    <p className="text-xs text-gray-400 truncate">{buyer.email}</p>
                    <p className="text-xs text-gray-400">{buyer.products.slice(0, 2).join(", ")}</p>
                  </div>
                  <div className="text-right shrink-0 ml-3">
                    <p className="font-bold text-green-600 text-sm">₹{buyer.totalSpent.toFixed(0)}</p>
                    <p className="text-xs text-gray-500">{buyer.orderCount} order{buyer.orderCount > 1 ? "s" : ""}</p>
                    {buyer.orderCount >= 2 && (
                      <span className="text-xs bg-orange-100 text-orange-600 px-1.5 py-0.5 rounded-full">Repeat</span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Repeat customers */}
        <div className="bg-white rounded-2xl border border-gray-100 p-5">
          <h2 className="font-semibold text-gray-900 mb-4">Repeat Customers</h2>
          {repeatCustomers.length === 0 ? (
            <p className="text-gray-400 text-sm text-center py-8">No repeat customers yet.</p>
          ) : (
            <div className="space-y-3">
              {repeatCustomers.map((buyer, i) => (
                <div key={buyer.email} className="flex items-center gap-3 py-2 border-b last:border-0">
                  <div className="w-8 h-8 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center text-sm font-bold shrink-0">
                    {i + 1}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm text-gray-800">{buyer.name}</p>
                    <p className="text-xs text-gray-400">{buyer.orderCount} orders · ₹{buyer.totalSpent.toFixed(0)} total</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
