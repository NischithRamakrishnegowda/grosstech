import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const [totalOrders, revenueAgg, buyerGroups, recentOrders] = await Promise.all([
    prisma.order.count(),
    prisma.order.aggregate({ _sum: { total: true } }),
    prisma.order.groupBy({
      by: ["buyerId"],
      _count: { id: true },
      _sum: { total: true },
    }),
    prisma.order.findMany({
      select: {
        id: true,
        buyerId: true,
        total: true,
        status: true,
        createdAt: true,
        buyer: { select: { id: true, name: true, email: true } },
        items: {
          select: {
            listing: { select: { name: true } },
            priceOption: { select: { weight: true } },
          },
        },
      },
      orderBy: { createdAt: "desc" },
      take: 200,
    }),
    prisma.user.findMany({
      where: { role: "BUYER" },
      select: { id: true, name: true, email: true },
    }),
  ]);

  const buyerIdMap: Record<string, { name: string; email: string }> = {};
  for (const o of recentOrders) {
    if (!buyerIdMap[o.buyerId]) {
      buyerIdMap[o.buyerId] = { name: o.buyer.name, email: o.buyer.email };
    }
  }

  const buyers = buyerGroups.map((g) => ({
    id: g.buyerId,
    name: buyerIdMap[g.buyerId]?.name ?? "",
    email: buyerIdMap[g.buyerId]?.email ?? "",
    orderCount: g._count.id,
    totalSpent: g._sum.total ?? 0,
  }));

  return NextResponse.json({
    totalOrders,
    totalRevenue: revenueAgg._sum.total ?? 0,
    uniqueBuyers: buyerGroups.length,
    repeatCustomers: buyerGroups.filter((g) => g._count.id >= 2).length,
    buyers,
    orders: recentOrders,
  });
}
