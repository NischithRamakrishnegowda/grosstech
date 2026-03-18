import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { razorpay } from "@/lib/razorpay";
import { PLATFORM_FEE } from "@/lib/constants";
import { z } from "zod";

const schema = z.object({
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
  if (session.user.role !== "BUYER") return NextResponse.json({ error: "Only buyers can place orders" }, { status: 403 });

  try {
    const body = await req.json();
    const { items } = schema.parse(body);

    // Fetch all prices in one query — never trust client
    const priceOptions = await prisma.priceOption.findMany({
      where: { id: { in: items.map((i) => i.priceOptionId) } },
    });
    const priceMap = new Map(priceOptions.map((p) => [p.id, p]));

    let subtotal = 0;
    for (const item of items) {
      const po = priceMap.get(item.priceOptionId);
      if (!po) return NextResponse.json({ error: "Invalid price option" }, { status: 400 });
      subtotal += po.price * item.quantity;
    }

    const total = subtotal + PLATFORM_FEE;

    const order = await razorpay.orders.create({
      amount: Math.round(total * 100), // paise
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    return NextResponse.json({
      razorpayOrderId: order.id,
      amount: order.amount,
      currency: order.currency,
      keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
      subtotal,
      platformFee: PLATFORM_FEE,
      total,
    });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}
