import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const now = new Date();
  const orders = await prisma.order.findMany({
    where: {
      status: "PAYMENT_HELD",
      releaseScheduledAt: { lte: now },
    },
    include: {
      buyer: { select: { name: true, email: true } },
      items: {
        include: {
          listing: { select: { name: true, seller: { select: { id: true, name: true, businessName: true, upiId: true } } } },
          priceOption: { select: { weight: true } },
        },
      },
    },
    orderBy: { releaseScheduledAt: "asc" },
  });

  return NextResponse.json(orders);
}
