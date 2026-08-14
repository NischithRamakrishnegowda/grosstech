import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ sellerId: string }> }
) {
  const { sellerId } = await params;
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "BUYER") return NextResponse.json({ error: "Forbidden" }, { status: 403 });

  // Check 1: paid contact unlock
  const unlock = await prisma.contactUnlock.findUnique({
    where: { buyerId_sellerId: { buyerId: session.user.id, sellerId } },
  });

  // Check 2: buyer has an existing completed order with this seller
  const existingOrder = !unlock?.isPaid ? await prisma.order.findFirst({
    where: {
      buyerId: session.user.id,
      status: { in: ["PAYMENT_HELD", "RELEASED_TO_SELLER"] },
      items: { some: { listing: { sellerId } } },
    },
  }) : null;

  if (!unlock?.isPaid && !existingOrder) {
    return NextResponse.json({ locked: true });
  }

  const seller = await prisma.user.findUnique({
    where: { id: sellerId },
    select: { name: true, phone: true, email: true, street: true, city: true, state: true, pincode: true, businessName: true },
  });

  return NextResponse.json({
    locked: false,
    seller,
    reason: existingOrder ? "purchased" : "unlocked",
  });
}
