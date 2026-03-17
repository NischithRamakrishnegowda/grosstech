import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEE, PAYMENT_HOLD_DAYS } from "@/lib/constants";
import crypto from "crypto";
import { z } from "zod";

const schema = z.object({
  razorpayOrderId: z.string(),
  razorpayPaymentId: z.string(),
  razorpaySignature: z.string(),
  items: z.array(
    z.object({
      listingId: z.string(),
      priceOptionId: z.string(),
      quantity: z.number().int().positive(),
    })
  ),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, items } =
      schema.parse(body);

    // Verify signature
    const expectedSignature = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET!)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Recalculate subtotal from DB
    let subtotal = 0;
    const itemsWithPrice = await Promise.all(
      items.map(async (item) => {
        const priceOption = await prisma.priceOption.findUnique({
          where: { id: item.priceOptionId },
        });
        if (!priceOption) throw new Error("Invalid price option");
        subtotal += priceOption.price * item.quantity;
        return { ...item, priceAtOrder: priceOption.price };
      })
    );

    const total = subtotal + PLATFORM_FEE;
    const now = new Date();
    const releaseScheduledAt = new Date(
      now.getTime() + PAYMENT_HOLD_DAYS * 24 * 60 * 60 * 1000
    );

    const order = await prisma.order.create({
      data: {
        razorpayOrderId,
        razorpayPaymentId,
        razorpaySignature,
        buyerId: session.user.id,
        subtotal,
        platformFee: PLATFORM_FEE,
        total,
        status: "PAYMENT_HELD",
        paymentCapturedAt: now,
        releaseScheduledAt,
        items: {
          create: itemsWithPrice.map((item) => ({
            listingId: item.listingId,
            priceOptionId: item.priceOptionId,
            quantity: item.quantity,
            priceAtOrder: item.priceAtOrder,
          })),
        },
      },
    });

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
