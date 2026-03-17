import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const orders = await prisma.order.findMany({
    include: {
      buyer: { select: { id: true, name: true, email: true } },
      items: {
        include: {
          listing: { select: { name: true, sellerId: true, seller: { select: { name: true, businessName: true } } } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  const totalOrders = orders.length;
  const totalRevenue = orders.reduce((sum, o) => sum + o.total, 0);
  const uniqueBuyers = new Set(orders.map((o) => o.buyerId)).size;

  // Per-buyer breakdown
  const buyerMap: Record<
    string,
    { name: string; email: string; orderCount: number; totalSpent: number }
  > = {};
  for (const order of orders) {
    if (!buyerMap[order.buyerId]) {
      buyerMap[order.buyerId] = {
        name: order.buyer.name,
        email: order.buyer.email,
        orderCount: 0,
        totalSpent: 0,
      };
    }
    buyerMap[order.buyerId].orderCount += 1;
    buyerMap[order.buyerId].totalSpent += order.total;
  }

  const repeatCustomers = Object.values(buyerMap).filter(
    (b) => b.orderCount >= 2
  ).length;

  return NextResponse.json({
    totalOrders,
    totalRevenue,
    uniqueBuyers,
    repeatCustomers,
    buyers: Object.entries(buyerMap).map(([id, data]) => ({ id, ...data })),
    orders: orders.map((o) => ({
      id: o.id,
      buyer: o.buyer,
      total: o.total,
      status: o.status,
      createdAt: o.createdAt,
      items: o.items,
    })),
  });
}
