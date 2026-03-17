import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { CONTACT_UNLOCK_FEE } from "@/lib/constants";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  sellerId: z.string(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, sellerId } =
      schema.parse(body);

    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    await prisma.contactUnlock.upsert({
      where: { buyerId_sellerId: { buyerId: session.user.id, sellerId } },
      update: {
        isPaid: true,
        razorpayOrderId,
        razorpayPaymentId,
        unlockedAt: new Date(),
      },
      create: {
        buyerId: session.user.id,
        sellerId,
        razorpayOrderId,
        razorpayPaymentId,
        fee: CONTACT_UNLOCK_FEE,
        isPaid: true,
        unlockedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
