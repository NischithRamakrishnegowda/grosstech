import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createRazorpayPayout } from "@/lib/razorpayx";

export async function PUT(
  _req: Request,
  { params }: { params: Promise<{ orderId: string }> }
) {
  const { orderId } = await params;
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Fetch order with seller details for each item
  const order = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      items: {
        include: {
          listing: {
            select: {
              name: true,
              seller: {
                select: {
                  id: true,
                  name: true,
                  businessName: true,
                  email: true,
                  phone: true,
                  upiId: true,
                },
              },
            },
          },
          priceOption: { select: { weight: true } },
        },
      },
    },
  });

  if (!order) {
    return NextResponse.json({ error: "Order not found" }, { status: 404 });
  }

  if (order.status !== "PAYMENT_HELD") {
    return NextResponse.json(
      { error: "Order is not in PAYMENT_HELD status" },
      { status: 400 }
    );
  }

  // Group items by seller and calculate each seller's share
  const sellerShares: Record<
    string,
    {
      sellerId: string;
      name: string;
      email: string;
      phone: string | null;
      upiId: string | null;
      amount: number;
    }
  > = {};

  for (const item of order.items) {
    const seller = item.listing.seller;
    if (!sellerShares[seller.id]) {
      sellerShares[seller.id] = {
        sellerId: seller.id,
        name: seller.businessName || seller.name,
        email: seller.email,
        phone: seller.phone,
        upiId: seller.upiId,
        amount: 0,
      };
    }
    sellerShares[seller.id].amount += item.priceAtOrder * item.quantity;
  }

  // Attempt RazorpayX payout to each seller
  const payoutResults = [];
  const shortId = orderId.slice(-8).toUpperCase();

  for (const sp of Object.values(sellerShares)) {
    if (!sp.upiId) {
      payoutResults.push({
        seller: sp.name,
        amount: sp.amount,
        success: false,
        error: "No UPI ID on file",
      });
      continue;
    }

    const result = await createRazorpayPayout({
      amount: sp.amount,
      upiId: sp.upiId,
      sellerName: sp.name,
      sellerEmail: sp.email,
      sellerPhone: sp.phone || undefined,
      referenceId: `GT${shortId}_${sp.sellerId.slice(-6)}`,
      narration: `GrossTech Order #GT-${shortId}`,
    });

    payoutResults.push({
      seller: sp.name,
      amount: sp.amount,
      ...result,
    });
  }

  // Mark order as released (admin confirmed the release)
  const updated = await prisma.order.update({
    where: { id: orderId },
    data: { status: "RELEASED_TO_SELLER", releasedAt: new Date() },
  });

  return NextResponse.json({ order: updated, payouts: payoutResults });
}
