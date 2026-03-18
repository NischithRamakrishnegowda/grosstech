import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PLATFORM_FEE, PAYMENT_HOLD_DAYS } from "@/lib/constants";
import crypto from "crypto";
import { z } from "zod";
import {
  sendBuyerOrderConfirmation,
  sendSellerOrderNotification,
  sendAdminOrderNotification,
  sendPaymentFailedEmail,
} from "@/lib/email";

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
  shippingAddress: z.string().optional(),
  shippingPhone: z.string().optional(),
  secondaryPhone: z.string().optional(),
});

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    const { razorpayOrderId, razorpayPaymentId, razorpaySignature, items, shippingAddress, shippingPhone, secondaryPhone } =
      schema.parse(body);

    // Verify signature
    const secret = process.env.RAZORPAY_KEY_SECRET;
    if (!secret) return NextResponse.json({ error: "Payment not configured" }, { status: 500 });
    const expectedSignature = crypto
      .createHmac("sha256", secret)
      .update(razorpayOrderId + "|" + razorpayPaymentId)
      .digest("hex");

    if (expectedSignature !== razorpaySignature) {
      // Send payment failed email
      const buyer = await prisma.user.findUnique({ where: { id: session.user.id } });
      if (buyer) {
        const approxTotal = 0;
        sendPaymentFailedEmail(buyer, approxTotal).catch(() => {});
      }
      return NextResponse.json({ error: "Invalid signature" }, { status: 400 });
    }

    // Idempotency: return existing order if already processed
    const existingOrder = await prisma.order.findFirst({ where: { razorpayOrderId } });
    if (existingOrder) return NextResponse.json({ orderId: existingOrder.id });

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
        shippingAddress: shippingAddress || null,
        shippingPhone: shippingPhone || null,
        secondaryPhone: secondaryPhone || null,
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

    // Send order emails (fire-and-forget)
    sendOrderEmails(order.id).catch((e) => console.error("Order email error:", e));

    return NextResponse.json({ orderId: order.id });
  } catch (err) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.issues }, { status: 400 });
    }
    console.error("verify error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function sendOrderEmails(orderId: string) {
  const fullOrder = await prisma.order.findUnique({
    where: { id: orderId },
    include: {
      buyer: true,
      items: {
        include: {
          listing: { include: { seller: true } },
          priceOption: true,
        },
      },
    },
  });
  if (!fullOrder) return;

  // Email buyer
  await sendBuyerOrderConfirmation(fullOrder.buyer, fullOrder, fullOrder.items as Parameters<typeof sendBuyerOrderConfirmation>[2]);

  // Email each unique seller (only for SELLER-sourced items)
  const sellerMap = new Map<string, { seller: { name: string; email: string }; items: typeof fullOrder.items }>();
  for (const item of fullOrder.items) {
    if (item.listing.seller.role === "SELLER") {
      const sid = item.listing.sellerId;
      if (!sellerMap.has(sid)) sellerMap.set(sid, { seller: item.listing.seller, items: [] });
      sellerMap.get(sid)!.items.push(item);
    }
  }
  for (const { seller, items: sellerItems } of sellerMap.values()) {
    await sendSellerOrderNotification(
      seller,
      fullOrder,
      sellerItems as Parameters<typeof sendSellerOrderNotification>[2],
      fullOrder.buyer
    );
  }

  // Always email admin
  await sendAdminOrderNotification(
    fullOrder,
    fullOrder.buyer,
    fullOrder.items as Parameters<typeof sendAdminOrderNotification>[2]
  );
}
