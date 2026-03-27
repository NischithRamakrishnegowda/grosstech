import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const order = await prisma.order.findUnique({ where: { id: orderId } });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PAYMENT_HELD") {
    return NextResponse.json(
      { error: "Order is not in PAYMENT_HELD status" },
      { status: 400 }
    );
  }

  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "RELEASED_TO_SELLER", releasedAt: new Date() },
  });

  return NextResponse.json(updated);
}
