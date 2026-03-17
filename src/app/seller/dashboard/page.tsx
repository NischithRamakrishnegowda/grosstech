import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Package, Plus, TrendingUp } from "lucide-react";
import { Button } from "@/components/ui/button";

export default async function SellerDashboardPage() {
  const session = await getServerSession(authOptions);
  if (!session) return null;

  const [activeListings, totalListings] = await Promise.all([
    prisma.listing.count({ where: { sellerId: session.user.id, isActive: true } }),
    prisma.listing.count({ where: { sellerId: session.user.id } }),
  ]);

  const recentListings = await prisma.listing.findMany({
    where: { sellerId: session.user.id },
    include: { priceOptions: { orderBy: { price: "asc" }, take: 1 }, category: true },
    orderBy: { createdAt: "desc" },
    take: 5,
  });

  return (
    <div>
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Welcome back!</h1>
          <p className="text-gray-500 mt-1 text-sm">Manage your listings and track performance</p>
        </div>
        <Button className="bg-green-600 hover:bg-green-700" asChild>
          <Link href="/seller/listings/new">
            <Plus className="w-4 h-4 mr-2" />
            Add Listing
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-8">
        {[
          { label: "Active Listings", value: activeListings, icon: Package, color: "bg-green-100 text-green-600" },
          { label: "Total Listings", value: totalListings, icon: TrendingUp, color: "bg-blue-100 text-blue-600" },
        ].map((stat) => (
          <div key={stat.label} className="bg-white rounded-2xl border border-gray-100 p-5 flex items-center gap-4">
            <div className={`w-12 h-12 rounded-xl ${stat.color} flex items-center justify-center`}>
              <stat.icon className="w-6 h-6" />
            </div>
            <div>
              <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              <p className="text-sm text-gray-500">{stat.label}</p>
            </div>
          </div>
        ))}
      </div>

      {/* Recent listings */}
      <div className="bg-white rounded-2xl border border-gray-100 p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="font-semibold text-gray-900">Recent Listings</h2>
          <Link href="/seller/listings" className="text-sm text-green-600 hover:underline">View all</Link>
        </div>
        {recentListings.length === 0 ? (
          <p className="text-gray-400 text-sm py-4 text-center">No listings yet. Add your first product!</p>
        ) : (
          <div className="space-y-3">
            {recentListings.map((listing) => (
              <div key={listing.id} className="flex items-center justify-between py-2 border-b last:border-0">
                <div>
                  <p className="font-medium text-gray-800 text-sm">{listing.name}</p>
                  <p className="text-xs text-gray-400">{listing.category.name}</p>
                </div>
                <div className="text-right">
                  {listing.priceOptions[0] && (
                    <p className="text-sm font-bold text-green-600">From ₹{listing.priceOptions[0].price}</p>
                  )}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${listing.isActive ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                    {listing.isActive ? "Active" : "Inactive"}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
