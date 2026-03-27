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
  shippingAddress: z.string().optional(),
  shippingPhone: z.string().optional(),
  secondaryPhone: z.string().optional(),
  deliveryOption: z.enum(["SELF_PICKUP", "DELIVERY"]).default("SELF_PICKUP"),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  if (session.user.role !== "BUYER") return NextResponse.json({ error: "Only buyers can place orders" }, { status: 403 });

  try {
    const body = await req.json();
    const { items, shippingAddress, shippingPhone, secondaryPhone, deliveryOption } = schema.parse(body);

    // Fetch all prices from DB — never trust client
    const priceOptions = await prisma.priceOption.findMany({
      where: { id: { in: items.map((i) => i.priceOptionId) } },
    });
    const priceMap = new Map(priceOptions.map((p) => [p.id, p]));

    let subtotal = 0;
    const itemsWithPrice: Array<{ listingId: string; priceOptionId: string; quantity: number; priceAtOrder: number }> = [];
    for (const item of items) {
      const po = priceMap.get(item.priceOptionId);
      if (!po) return NextResponse.json({ error: "Invalid price option" }, { status: 400 });
      subtotal += po.price * item.quantity;
      itemsWithPrice.push({ ...item, priceAtOrder: po.price });
    }

    const total = subtotal + PLATFORM_FEE;

    const rzpOrder = await razorpay.orders.create({
      amount: Math.round(total * 100),
      currency: "INR",
      receipt: `receipt_${Date.now()}`,
    });

    // Store order as PENDING in DB immediately
    const order = await prisma.order.create({
      data: {
        razorpayOrderId: rzpOrder.id,
        buyerId: session.user.id,
        subtotal,
        platformFee: PLATFORM_FEE,
        total,
        status: "PENDING",
        shippingAddress: shippingAddress || null,
        shippingPhone: shippingPhone || null,
        secondaryPhone: secondaryPhone || null,
        deliveryOption,
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

    return NextResponse.json({
      razorpayOrderId: rzpOrder.id,
      internalOrderId: order.id,
      amount: rzpOrder.amount,
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID,
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
