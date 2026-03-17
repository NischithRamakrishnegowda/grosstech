import { prisma } from "@/lib/prisma";
import { DollarSign, ShoppingBag, Users, TrendingUp } from "lucide-react";

export default async function AdminDashboardPage() {
  const [totalOrders, totalListings, totalUsers] = await Promise.all([
    prisma.order.count(),
    prisma.listing.count({ where: { isActive: true } }),
    prisma.user.count({ where: { role: "BUYER" } }),
  ]);

  const revenueData = await prisma.order.aggregate({
    _sum: { total: true },
    where: { status: { not: "CANCELLED" } },
  });

  const totalRevenue = revenueData._sum.total || 0;

  const pendingPayouts = await prisma.order.count({
    where: {
      status: "PAYMENT_HELD",
      releaseScheduledAt: { lte: new Date() },
    },
  });

  const stats = [
    { label: "Total Revenue", value: `₹${totalRevenue.toFixed(0)}`, icon: DollarSign, color: "bg-green-100 text-green-600", change: "All time" },
    { label: "Total Orders", value: totalOrders, icon: ShoppingBag, color: "bg-blue-100 text-blue-600", change: "All orders" },
    { label: "Total Buyers", value: totalUsers, icon: Users, color: "bg-purple-100 text-purple-600", change: "Registered" },
    { label: "Active Listings", value: totalListings, icon: TrendingUp, color: "bg-orange-100 text-orange-600", change: "Products live" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Admin Dashboard</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {stats.map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5">
            <div className="flex items-center justify-between mb-3">
              <div className={`w-10 h-10 rounded-xl ${stat.color} flex items-center justify-center`}>
                <stat.icon className="w-5 h-5" />
              </div>
              <span className="text-xs text-gray-400">{stat.change}</span>
            </div>
            <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
            <p className="text-sm text-gray-500 mt-0.5">{stat.label}</p>
          </div>
        ))}
      </div>

      {pendingPayouts > 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-center justify-between">
          <div>
            <p className="font-semibold text-amber-800">{pendingPayouts} orders ready for payout</p>
            <p className="text-sm text-amber-600">3-day hold period has passed</p>
          </div>
          <a href="/admin/orders" className="text-sm font-medium text-amber-700 underline">
            Review Payouts →
          </a>
        </div>
      )}
    </div>
  );
}
