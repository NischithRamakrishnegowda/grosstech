import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { razorpay } from "@/lib/razorpay";
import { CONTACT_UNLOCK_FEE } from "@/lib/constants";
import { z } from "zod";

const schema = z.object({ sellerId: z.string() });

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { sellerId } = schema.parse(body);

    if (sellerId === session.user.id) {
      return NextResponse.json({ error: "Cannot unlock your own contact" }, { status: 400 });
    }

    // Prevent double payment — check if already unlocked
    const { prisma } = await import("@/lib/prisma");
    const existing = await prisma.contactUnlock.findUnique({
      where: { buyerId_sellerId: { buyerId: session.user.id, sellerId } },
    });
    if (existing?.isPaid) {
      return NextResponse.json({ error: "Already unlocked" }, { status: 400 });
    }

    const order = await razorpay.orders.create({
      amount: CONTACT_UNLOCK_FEE * 100,
      currency: "INR",
      receipt: `cu_${Date.now()}`,
      notes: { type: "contact_unlock", buyerId: session.user.id, sellerId },
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
    });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
