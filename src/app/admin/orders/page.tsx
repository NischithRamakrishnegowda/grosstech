import { prisma } from "@/lib/prisma";
import PayoutManager from "@/components/admin/PayoutManager";

export default async function AdminOrdersPage() {
  const now = new Date();

  const sellerSelect = { select: { id: true, name: true, businessName: true, upiId: true, accountNumber: true, ifscCode: true } } as const;

  const readyOrders = await prisma.order.findMany({
    where: { status: "PAYMENT_HELD", releaseScheduledAt: { lte: now } },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          listing: { select: { name: true, seller: sellerSelect } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { releaseScheduledAt: "asc" },
  });

  const allOrders = await prisma.order.findMany({
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          listing: { select: { name: true, seller: sellerSelect } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Payouts & Orders</h1>
      <PayoutManager readyOrders={readyOrders} allOrders={allOrders} />
    </div>
  );
}
