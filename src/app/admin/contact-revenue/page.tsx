import { prisma } from "@/lib/prisma";
import { Unlock, IndianRupee, Users, TrendingUp } from "lucide-react";

export default async function ContactRevenuePage() {
  const unlocks = await prisma.contactUnlock.findMany({
    where: { isPaid: true },
    include: {
      buyer: { select: { name: true, email: true, phone: true } },
      seller: { select: { name: true, businessName: true, email: true } },
    },
    orderBy: { unlockedAt: "desc" },
  });

  const totalRevenue = unlocks.reduce((sum, u) => sum + u.fee, 0);
  const uniqueBuyers = new Set(unlocks.map((u) => u.buyerId)).size;
  const uniqueSellers = new Set(unlocks.map((u) => u.sellerId)).size;

  function fmt(d: Date | null) {
    if (!d) return "—";
    return new Intl.DateTimeFormat("en-IN", {
      day: "2-digit", month: "short", year: "numeric",
      hour: "2-digit", minute: "2-digit",
    }).format(new Date(d));
  }

  return (
    <div>
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Info Purchase Revenue</h1>
        <p className="text-sm text-gray-500 mt-1">Payments collected when buyers unlock seller contact details</p>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 mb-6">
        <div className="bg-green-50 border border-green-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <IndianRupee className="w-4 h-4 text-green-600" />
            <p className="text-xs font-medium text-green-700">Total Revenue</p>
          </div>
          <p className="text-2xl font-bold text-green-700">₹{totalRevenue.toLocaleString("en-IN")}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4">
          <div className="flex items-center gap-2 mb-1">
            <TrendingUp className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-medium text-slate-500">Total Unlocks</p>
          </div>
          <p className="text-2xl font-bold text-slate-700">{unlocks.length}</p>
        </div>
        <div className="bg-slate-50 border border-slate-100 rounded-2xl p-4 col-span-2 sm:col-span-1">
          <div className="flex items-center gap-2 mb-1">
            <Users className="w-4 h-4 text-slate-500" />
            <p className="text-xs font-medium text-slate-500">Buyers / Sellers</p>
          </div>
          <p className="text-2xl font-bold text-slate-700">{uniqueBuyers} / {uniqueSellers}</p>
        </div>
      </div>

      {unlocks.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-2xl border border-gray-100">
          <Unlock className="w-10 h-10 text-gray-200 mx-auto mb-3" />
          <p className="text-gray-400 text-sm">No contact unlocks yet</p>
        </div>
      ) : (
        <>
          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {unlocks.map((u) => (
              <div key={u.id} className="bg-white rounded-2xl border border-gray-100 p-4 shadow-sm">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Buyer</p>
                    <p className="font-semibold text-gray-900 text-sm">{u.buyer.name}</p>
                    <p className="text-xs text-gray-400">{u.buyer.email}</p>
                    {u.buyer.phone && <p className="text-xs text-gray-400">{u.buyer.phone}</p>}
                  </div>
                  <span className="bg-green-50 text-green-700 font-bold text-sm px-3 py-1 rounded-xl border border-green-100">
                    ₹{u.fee}
                  </span>
                </div>
                <div className="border-t border-gray-50 pt-3">
                  <p className="text-xs font-semibold text-gray-400 uppercase tracking-wide mb-1">Seller Info Purchased</p>
                  <p className="font-medium text-gray-800 text-sm">{u.seller.businessName || u.seller.name}</p>
                  <p className="text-xs text-gray-400">{u.seller.email}</p>
                </div>
                <p className="text-[11px] text-gray-300 mt-2">{fmt(u.unlockedAt)}</p>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-100 overflow-hidden shadow-sm">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Buyer</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Contact</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Seller Info Purchased</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Amount</th>
                  <th className="text-left px-5 py-3 font-semibold text-gray-500 text-xs uppercase tracking-wide">Date</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {unlocks.map((u) => (
                  <tr key={u.id} className="hover:bg-gray-50/50 transition-colors">
                    <td className="px-5 py-4">
                      <p className="font-semibold text-gray-900">{u.buyer.name}</p>
                      <p className="text-xs text-gray-400">{u.buyer.email}</p>
                    </td>
                    <td className="px-5 py-4 text-gray-500 text-xs">{u.buyer.phone || "—"}</td>
                    <td className="px-5 py-4">
                      <p className="font-medium text-gray-800">{u.seller.businessName || u.seller.name}</p>
                      <p className="text-xs text-gray-400">{u.seller.email}</p>
                    </td>
                    <td className="px-5 py-4">
                      <span className="bg-green-50 text-green-700 font-bold px-2.5 py-1 rounded-lg text-xs border border-green-100">
                        ₹{u.fee}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-xs text-gray-400 whitespace-nowrap">{fmt(u.unlockedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}
